import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { updateProductSchema } from "@/lib/validations";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

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
  try {
    const { id } = params;

    const product = await prisma.product.findUnique({
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
  }
}
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const product = await prisma.$transaction(async (tx) => {
      // Update product
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          slug,
          name,
          basePrice,
          type,
          categoryId: categoryId,
          status,
          images,
        },
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
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await verifyAdminRequest(request);
    if (!admin) return unauthorizedResponse();

    const { id } = params;

    const product = await prisma.product.findUnique({
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
    await prisma.product.delete({ where: { id } });

    await logAdminAction(admin.id, "DELETE", "Product", id, {
      name: product.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}