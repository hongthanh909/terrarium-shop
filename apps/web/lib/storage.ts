/**
 * Storage Abstraction Layer
 * Hỗ trợ 2 provider:
 *   - Supabase Storage (mặc định, dùng khi dev hoặc chưa có MinIO)
 *   - MinIO / S3-compatible (dùng khi deploy VPS)
 *
 * Điều khiển bằng biến môi trường:
 *   STORAGE_PROVIDER="supabase"  → dùng Supabase Storage
 *   STORAGE_PROVIDER="minio"     → dùng MinIO / S3
 */

// =============================================
// SUPABASE STORAGE (Provider hiện tại)
// =============================================
async function uploadToSupabase(file: File, bucket: string): Promise<string> {
  const { uploadImage } = await import('./supabase');
  return uploadImage(file, bucket);
}

async function deleteFromSupabase(url: string, bucket: string): Promise<void> {
  const { deleteImage } = await import('./supabase');
  return deleteImage(url, bucket);
}

// =============================================
// MINIO / S3 STORAGE (VPS self-hosted)
// =============================================
async function uploadToMinio(file: File, bucket: string): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;
  const publicUrl = process.env.MINIO_PUBLIC_URL;
  const bucketName = process.env.MINIO_BUCKET_NAME || bucket;

  if (!endpoint || !accessKey || !secretKey || !publicUrl) {
    throw new Error('MinIO environment variables are not configured');
  }

  const s3 = new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true, // Required for MinIO
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const key = bucket !== bucketName ? `${bucket}/${fileName}` : fileName;

  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: file.type,
    // MinIO sẽ serve public nếu bucket đã set public policy
  }));

  return `${publicUrl}/${bucketName}/${key}`;
}

async function deleteFromMinio(url: string): Promise<void> {
  const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');

  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;
  const publicUrl = process.env.MINIO_PUBLIC_URL;
  const bucketName = process.env.MINIO_BUCKET_NAME || 'terrarium-shop';

  if (!endpoint || !accessKey || !secretKey) return;

  // Extract key từ URL
  const key = url.replace(`${publicUrl}/${bucketName}/`, '');
  if (!key || key === url) return;

  const s3 = new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: true,
  });

  await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}

// =============================================
// PUBLIC API — Dùng xuyên suốt project
// =============================================

/**
 * Upload một file ảnh
 * @param file - File object
 * @param bucket - Tên bucket/folder ('products', 'banners', ...)
 * @returns Public URL của ảnh đã upload
 */
export async function uploadFile(file: File, bucket: string = 'products'): Promise<string> {
  const provider = process.env.STORAGE_PROVIDER || 'supabase';

  if (provider === 'minio') {
    return uploadToMinio(file, bucket);
  }

  return uploadToSupabase(file, bucket);
}

/**
 * Xoá một file ảnh theo URL
 * @param url - Public URL của ảnh
 * @param bucket - Tên bucket (chỉ cần cho Supabase)
 */
export async function deleteFile(url: string, bucket: string = 'products'): Promise<void> {
  if (!url) return;
  const provider = process.env.STORAGE_PROVIDER || 'supabase';

  if (provider === 'minio') {
    return deleteFromMinio(url);
  }

  return deleteFromSupabase(url, bucket);
}

/**
 * Alias giữ tương thích ngược với code cũ dùng uploadImage
 */
export { uploadFile as uploadImage };
