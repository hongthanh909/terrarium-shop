import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { updateProductSchema } from "@/lib/validations";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";
import { revalidatePath } from "next/cache";

/** Extract file path from Supabase public URL */
function extractStoragePath(url: string): string | null {
  try {
    // URL format: https://xxx.supabase.co/storage/v1/object/public/product-images/filename.jpg
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
      },
    },
    log: ["error"],
  });

  try {
    const { id } = await params;

    const product = await client.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        variantOptions: true,
        careGuide: true,
        reviews: {
          include: {
            customer: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.$disconnect().catch(() => {});
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateProductSchema.parse(body);

    const {
      slug,
      name,
      basePrice,
      type,
      categoryId,
      status,
      images,
      inventory,
      variants,
      variantOptions,
      careGuideData,
      isFeatured,
      size,
      soil,
      moss,
      driftwood,
      accessories,
      displayRating,
      displayReviewCount,
    } = validatedData;

    // Extract sale fields from body
    const salePrice = body.salePrice != null ? (parseFloat(body.salePrice) || null) : null;
    const saleEndDate = body.saleEndDate ? new Date(body.saleEndDate) : null;
    const createdAt = body.createdAt ? new Date(body.createdAt) : undefined;

    if (salePrice !== null) {
      let finalBasePrice = basePrice;
      if (finalBasePrice === undefined) {
        const existing = await client.product.findUnique({
          where: { id },
          select: { basePrice: true },
        });
        if (existing) {
          finalBasePrice = Number(existing.basePrice);
        }
      }
      if (finalBasePrice !== undefined && salePrice >= finalBasePrice) {
        return NextResponse.json(
          { error: "Giá khuyến mãi phải nhỏ hơn giá gốc" },
          { status: 400 }
        );
      }
    }

    const product = await client.$transaction(async (tx) => {
      // Update product
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          ...(slug !== undefined && { slug }),
          ...(name !== undefined && { name }),
          ...(basePrice !== undefined && { basePrice }),
          salePrice: salePrice,
          saleEndDate: saleEndDate,
          ...(type !== undefined && { type }),
          ...(categoryId !== undefined && categoryId !== null && { category: { connect: { id: categoryId } } }),
          ...(status !== undefined && { status }),
          ...(images !== undefined && { images }),
          ...(inventory !== undefined && { inventory }),
          ...(isFeatured !== undefined && { featured: isFeatured }),
          ...(createdAt !== undefined && { createdAt }),
          size: size !== undefined ? size : undefined,
          soil: soil !== undefined ? soil : undefined,
          moss: moss !== undefined ? moss : undefined,
          driftwood: driftwood !== undefined ? driftwood : undefined,
          accessories: accessories !== undefined ? accessories : undefined,
          displayRating: displayRating !== undefined ? displayRating : undefined,
          displayReviewCount: displayReviewCount !== undefined ? displayReviewCount : undefined,
        } as any,
      });

      // Delete and recreate variants ONLY if variants is explicitly passed in the request
      if (variants !== undefined) {
        await tx.productVariant.deleteMany({
          where: { productId: id },
        });

        if (variants.length > 0) {
          await tx.productVariant.createMany({
            data: variants.map((v: any) => ({
              productId: id,
              variantType: v.variantType,
              value: v.value,
              priceAdjustment: parseFloat(v.priceAdjustment) || 0,
              inventory: v.inventory || 0,
              sku: v.sku || null,
            })),
          });
        }
      }

      // Delete and recreate variant options ONLY if variantOptions is explicitly passed in the request
      if (variantOptions !== undefined) {
        await tx.productVariantOption.deleteMany({
          where: { productId: id },
        });

        if (variantOptions.length > 0) {
          await tx.productVariantOption.createMany({
            data: variantOptions.map((o: any) => ({
              productId: id,
              variantType: o.variantType,
              options: o.options,
              image: o.image || null,
            })),
          });
        }
      }

      // Update or create care guide
      if (careGuideData) {
        await tx.careGuide.upsert({
          where: { productId: id },
          create: {
            productId: id,
            watering: careGuideData.watering || "",
            sunlight: careGuideData.sunlight || "",
            temperature: careGuideData.temperature || "",
            humidity: careGuideData.humidity || "",
            commonIssues: careGuideData.commonIssues ?? null,
            videoUrl: careGuideData.videoUrl ?? null,
          },
          update: {
            watering: careGuideData.watering || "",
            sunlight: careGuideData.sunlight || "",
            temperature: careGuideData.temperature || "",
            humidity: careGuideData.humidity || "",
            commonIssues: careGuideData.commonIssues ?? null,
            videoUrl: careGuideData.videoUrl ?? null,
          },
        });
      }

      return tx.product.findUnique({
        where: { id },
        include: {
          category: true,
          variants: true,
          variantOptions: true,
          careGuide: true,
        },
      });
    });

    if (product) {
      await logAdminAction(admin.id, "UPDATE", "Product", product.id, {
        name: product.name,
        slug: product.slug,
        status: product.status,
      });
    }

    // Revalidate user-facing pages
    revalidatePath("/products");
    revalidatePath("/");

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.$disconnect().catch(() => {});
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const product = await client.product.findUnique({
      where: { id },
      select: { name: true, images: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // ─── Xóa ảnh trong Supabase Storage ────────────────────────────────────────
    if (product.images && product.images.length > 0) {
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || "product-images";
      const filePaths = product.images
        .map(extractStoragePath)
        .filter((p): p is string => p !== null);

      if (filePaths.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage
          .from(bucket)
          .remove(filePaths);

        if (storageError) {
          // Log nhưng không block việc xóa DB
          console.warn("Storage cleanup warning:", storageError.message);
        }
      }
    }

    // ─── Xóa product và các liên kết ─────────────────────────────────
    await client.$transaction(async (tx) => {
      const condition = { productId: id };
      await tx.review.deleteMany({ where: condition });
      await tx.productVote.deleteMany({ where: condition });
      await tx.wishlist.deleteMany({ where: condition });
      await tx.weeklyFeatured.deleteMany({ where: condition });
      await tx.seoMeta.deleteMany({ where: condition });
      await tx.careGuide.deleteMany({ where: condition });
      await tx.productVariantOption.deleteMany({ where: condition });
      await tx.productVariant.deleteMany({ where: condition });

      await tx.product.delete({ where: { id } });
    });

    await logAdminAction(admin.id, "DELETE", "Product", id, {
      name: product.name,
    });

    // Revalidate user-facing pages
    revalidatePath("/products");
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.$disconnect().catch(() => {});
  }
}
