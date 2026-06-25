import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { uploadFile } from "@/lib/storage";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_BUCKETS = new Set(["products", "banners", "blog", "homepage", "policies", "gallery", "avatars"]);
const CUSTOMER_BUCKETS = new Set(["avatars"]);
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    const session = await getServerSession(authOptions);

    if (!admin && !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "products";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bucketAllowed = admin ? ADMIN_BUCKETS.has(bucket) : CUSTOMER_BUCKETS.has(bucket);
    if (!bucketAllowed) {
      return NextResponse.json({ error: "Bucket is not allowed" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP or GIF images are allowed" },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    const publicUrl = await uploadFile(file, bucket);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: publicUrl.split("/").pop(),
      provider: process.env.STORAGE_PROVIDER || "supabase",
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
