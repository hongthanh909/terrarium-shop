import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { createProductSchema } from "@/lib/validations";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
    log: ["error"],
  });

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
      const product = await client.product.findUnique({
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
        const vote = await client.productVote.findUnique({
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

    const products = await client.product.findMany({
      where,
      include: {
        category: true,
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await client.product.count({ where });

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.$disconnect().catch(() => {});
  }
}

export async function POST(request: NextRequest) {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
    log: ["error"],
  });

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
    } = validatedData;

    // Extract sale fields from body (not in schema yet, pass through)
    const salePrice = body.salePrice != null ? parseFloat(body.salePrice) : null;
    const saleEndDate = body.saleEndDate ? new Date(body.saleEndDate) : null;

    const product = await client.$transaction(async (tx) => {
      // Create product
      const newProduct = await tx.product.create({
        data: {
          slug,
          name,
          basePrice,
          ...(salePrice != null && { salePrice }),
          ...(saleEndDate && { saleEndDate }),
          type,
          categoryId,
          status,
          images,
        },
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
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.$disconnect().catch(() => {});
  }
}
