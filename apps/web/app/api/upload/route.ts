import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { uploadFile } from "@/lib/storage";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { authOptions } from "@/lib/auth";
import {
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_PRODUCT_VIDEO_UPLOAD_BYTES,
} from "@/lib/upload-limits";

const ADMIN_BUCKETS = new Set(["products", "banners", "blog", "homepage", "policies", "gallery", "avatars"]);
const CUSTOMER_BUCKETS = new Set(["avatars"]);

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const ALLOWED_VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

function getUploadKind(file: File): "image" | "video" | null {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (ALLOWED_IMAGE_TYPES.has(type)) return "image";
  if (ALLOWED_VIDEO_TYPES.has(type)) return "video";

  // Some browsers/devices provide an empty or generic MIME type.
  if (ALLOWED_VIDEO_EXTENSIONS.has(name.slice(name.lastIndexOf(".")))) {
    return "video";
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdminRequest(request);
    const session = await getServerSession(authOptions);

    if (!admin && !session?.user) {
      return NextResponse.json({ error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "products";

    if (!file) {
      return NextResponse.json({ error: "Chưa chọn file để tải lên." }, { status: 400 });
    }

    const bucketAllowed = admin ? ADMIN_BUCKETS.has(bucket) : CUSTOMER_BUCKETS.has(bucket);
    if (!bucketAllowed) {
      return NextResponse.json({ error: "Bạn không có quyền upload vào thư mục này." }, { status: 400 });
    }

    const kind = getUploadKind(file);
    if (!kind) {
      return NextResponse.json(
        { error: "Định dạng file chưa được hỗ trợ. Ảnh: JPG/PNG/WEBP/GIF. Video: MP4/WEBM/MOV." },
        { status: 400 }
      );
    }

    if (kind === "video" && (!admin || bucket !== "products")) {
      return NextResponse.json(
        { error: "Video chỉ được upload bởi admin trong mục sản phẩm." },
        { status: 400 }
      );
    }

    const maxSize =
      kind === "video" ? MAX_PRODUCT_VIDEO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024);
      return NextResponse.json(
        { error: `${kind === "video" ? "Video" : "Ảnh"} quá lớn. Tối đa ${maxSizeMB}MB.` },
        { status: 400 }
      );
    }

    const publicUrl = await uploadFile(file, bucket);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: publicUrl.split("/").pop(),
      type: kind,
      provider: process.env.STORAGE_PROVIDER || "supabase",
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Tải file thất bại. Vui lòng thử lại hoặc kiểm tra cấu hình storage." },
      { status: 500 }
    );
  }
}
