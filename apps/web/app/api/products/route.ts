import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createProductSchema } from "@/lib/validations";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const categoryId = searchParams.get("categoryId");
    const featured = searchParams.get("featured");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    if (slug) {
      // Get single product by slug
      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          variants: true,
          variantOptions: true,
          careGuide: true,
          reviews: {
            where: { approved: true },
            include: {
              customer: {
                select: {
                  name: true,
                },
              },
            },
          },
          _count: {
            select: { votes: true }
          }
        },
      });

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const session = await getServerSession(authOptions);
      const customerId = (session?.user as any)?.id;
      let userVoted = false;

      if (customerId) {
        const vote = await prisma.productVote.findUnique({
          where: {
            productId_customerId: {
              productId: product.id,
              customerId,
            }
          }
        });
        userVoted = !!vote;
      }

      const productWithVote = {
        ...product,
        voteCount: product._count?.votes || 0,
        userVoted
      };

      return NextResponse.json(productWithVote, {
        headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
      });
    }
    const status = searchParams.get("status");

    // Get products with filters
    const where: any = {};
    if (status !== "all") {
      where.status = "ACTIVE";
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (featured === "true") {
      where.featured = true;
    }

    // Search by name or slug
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          slug: true,
          name: true,
          basePrice: true,
          salePrice: true,
          saleEndDate: true,
          packageOptionsEnabled: true,
          standardPackageAdjustment: true,
          advancedPackageAdjustment: true,
          type: true,
          inventory: true,
          featured: true,
          status: true,
          images: true,
          setupStatus: true,
          careLevel: true,
          chatTags: true,
          shortConsultNote: true,
          displayRating: true,
          displayReviewCount: true,
          categoryId: true,
          createdAt: true,
          updatedAt: true,
          category: { select: { id: true, name: true, slug: true } },
          variants: { select: { id: true, variantType: true, value: true, priceAdjustment: true, inventory: true, sku: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Serialize Decimal → number (Prisma Decimal không phải plain object)
    const serialized = products.map((p) => ({
      ...p,
      basePrice: Number(p.basePrice),
      salePrice: p.salePrice != null ? Number(p.salePrice) : null,
      standardPackageAdjustment: Number(p.standardPackageAdjustment),
      advancedPackageAdjustment: Number(p.advancedPackageAdjustment),
      variants: p.variants.map((v) => ({
        ...v,
        priceAdjustment: Number(v.priceAdjustment),
      })),
    }));

    const isNocache = status === "all" || searchParams.get("nocache") === "true";
    const cacheHeader = isNocache
      ? "no-store, no-cache, must-revalidate, proxy-revalidate"
      : "public, s-maxage=60, stale-while-revalidate=300";

    return NextResponse.json({
      products: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, {
      headers: { "Cache-Control": cacheHeader },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const body = await request.json();
    
    // Validate request body
    const validatedData = createProductSchema.parse(body);
    
    const {
      slug,
      name,
      basePrice,
      type = "PRODUCT",
      categoryId,
      status = "DRAFT",
      images = [],
      variants = [],
      variantOptions = [],
      careGuideData,
      salePrice: salePriceRaw,
      saleEndDate: saleEndDateRaw,
      packageOptionsEnabled,
      standardPackageAdjustment,
      advancedPackageAdjustment,
      isFeatured,
      size,
      soil,
      moss,
      driftwood,
      accessories,
      setupStatus,
      careLevel,
      chatTags,
      shortConsultNote,
      displayRating,
      displayReviewCount,
    } = validatedData;

    if (!categoryId) {
      return NextResponse.json(
        { error: "Vui lòng chọn danh mục sản phẩm." },
        { status: 400 }
      );
    }

    // Resolve sale fields
    const salePrice = salePriceRaw != null ? Number(salePriceRaw) : null;
    const saleEndDate = saleEndDateRaw ? new Date(saleEndDateRaw) : null;
    // Also check body as fallback (backward-compat)
    const finalSalePrice = salePrice ?? (body.salePrice != null ? parseFloat(body.salePrice) : null);
    const finalSaleEndDate = saleEndDate ?? (body.saleEndDate ? new Date(body.saleEndDate) : null);

    if (finalSalePrice !== null && finalSalePrice >= basePrice) {
      return NextResponse.json(
        { error: "Giá khuyến mãi phải nhỏ hơn giá gốc" },
        { status: 400 }
      );
    }

    const existingSlugProduct = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        images: true,
        category: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (existingSlugProduct) {
      return NextResponse.json(
        {
          error: `Slug này đang thuộc về sản phẩm "${existingSlugProduct.name}". Vui lòng mở sản phẩm đó để sửa hoặc đổi slug URL khác.`,
          code: "SLUG_ALREADY_EXISTS",
          existingProduct: existingSlugProduct,
          editUrl: `/tiem-nho-nth24/products/${existingSlugProduct.id}/edit`,
        },
        { status: 409 }
      );
    }

    const product = await prisma.$transaction(async (tx) => {
      // Create product
      const newProduct = await tx.product.create({
        data: {
          slug,
          name,
          basePrice,
          ...(finalSalePrice != null && { salePrice: finalSalePrice }),
          ...(finalSaleEndDate && { saleEndDate: finalSaleEndDate }),
          packageOptionsEnabled,
          standardPackageAdjustment,
          advancedPackageAdjustment,
          type,
          ...(categoryId !== undefined && categoryId !== null && { category: { connect: { id: categoryId } } }),
          status: status as any,
          images,
          featured: !!isFeatured,
          inventory: validatedData.inventory ?? 0,
          size: size ?? null,
          soil: soil ?? null,
          moss: moss ?? null,
          driftwood: driftwood ?? null,
          accessories: accessories ?? null,
          setupStatus: setupStatus ?? null,
          careLevel: careLevel ?? null,
          chatTags: chatTags ?? [],
          shortConsultNote: shortConsultNote ?? null,
          displayRating: displayRating ?? null,
          displayReviewCount: displayReviewCount ?? 0,
        } as any,
      });

      // Create variants
      if (variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map((v: any) => ({
            productId: newProduct.id,
            variantType: v.variantType,
            value: v.value,
            priceAdjustment: parseFloat(v.priceAdjustment) || 0,
            inventory: v.inventory || 0,
            sku: v.sku,
          })),
        });
      }

      // Create variant options
      if (variantOptions.length > 0) {
        await tx.productVariantOption.createMany({
          data: variantOptions.map((o: any) => ({
            productId: newProduct.id,
            variantType: o.variantType,
            options: o.options,
            image: o.image,
          })),
        });
      }

      // Create care guide if provided
      if (careGuideData) {
        await tx.careGuide.create({
          data: {
            watering: careGuideData.watering || "",
            sunlight: careGuideData.sunlight || "",
            temperature: careGuideData.temperature || "",
            humidity: careGuideData.humidity || "",
            commonIssues: careGuideData.commonIssues ?? null,
            videoUrl: careGuideData.videoUrl ?? null,
            productId: newProduct.id,
          },
        });
      }

      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          category: true,
          variants: true,
          variantOptions: true,
        },
      });
    });

    await logAdminAction(admin.id, "CREATE", "Product", product!.id, {
      name: product!.name,
      slug: product!.slug,
    });

    // Revalidate user-facing pages so new product appears immediately
    revalidatePath("/products");
    revalidatePath("/");

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.errors[0]?.message || "Dữ liệu sản phẩm chưa hợp lệ.",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const fields = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "dữ liệu";
        const message = String(fields).includes("slug")
          ? "Slug này đã tồn tại. Vui lòng đổi slug URL khác trước khi tạo sản phẩm."
          : `${fields} đã tồn tại. Vui lòng kiểm tra lại.`;

        return NextResponse.json({ error: message, code: error.code }, { status: 409 });
      }

      if (error.code === "P2003" || error.code === "P2025") {
        return NextResponse.json(
          { error: "Danh mục sản phẩm không tồn tại hoặc đã bị xoá. Vui lòng chọn lại danh mục.", code: error.code },
          { status: 400 }
        );
      }

      if (error.code === "P2009" || error.code === "P2011") {
        return NextResponse.json(
          { error: "Dữ liệu sản phẩm chưa hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.", code: error.code },
          { status: 400 }
        );
      }
    }

    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
