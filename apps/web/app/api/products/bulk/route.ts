import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminRequest, unauthorizedResponse } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { supabaseAdmin } from "@/lib/supabase";

/** Extract file path from Supabase public URL */
function extractStoragePath(url: string): string | null {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
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
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid request, no ids provided" },
        { status: 400 }
      );
    }

    // Get info + images before deletion
    const products = await client.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, images: true },
    });

    // ─── Xóa ảnh trong Supabase Storage ────────────────────────────────────────
    const allImages = products.flatMap((p) => p.images || []);
    if (allImages.length > 0) {
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || "product-images";
      const filePaths = allImages
        .map(extractStoragePath)
        .filter((p): p is string => p !== null);

      if (filePaths.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage
          .from(bucket)
          .remove(filePaths);

        if (storageError) {
          console.warn("Bulk storage cleanup warning:", storageError.message);
        }
      }
    }

    // ─── Xóa products trong DB ────────────────────────────────────────────────
    await client.product.deleteMany({
      where: { id: { in: ids } },
    });

    await logAdminAction(admin.id, "BULK_DELETE", "Product", "multiple", {
      deletedIds: ids,
      deletedNames: products.map((p) => p.name),
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("Error bulk deleting products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await client.$disconnect().catch(() => {});
  }
}
