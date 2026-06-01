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
  { params }: { params: { id: string } }
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
    const { id } = params;

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
  { params }: { params: { id: string } }
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

    const { id } = params;
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
      variants = [],
      variantOptions = [],
      careGuideData,
    } = validatedData;

    // Extract sale fields from body
    const salePrice = body.salePrice != null ? (parseFloat(body.salePrice) || null) : null;
    const saleEndDate = body.saleEndDate ? new Date(body.saleEndDate) : null;

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
        } as any,
      });

      // Delete existing variants and recreate
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

      // Delete existing variant options and recreate
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
          },
          update: {
            watering: careGuideData.watering || "",
            sunlight: careGuideData.sunlight || "",
            temperature: careGuideData.temperature || "",
            humidity: careGuideData.humidity || "",
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
  { params }: { params: { id: string } }
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

    const { id } = params;

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

    // ─── Xóa product (cascade xóa variants, reviews, v.v.) ───────────────────
    await client.product.delete({ where: { id } });

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