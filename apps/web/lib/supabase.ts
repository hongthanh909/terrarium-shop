import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Upload image to Supabase Storage
 * @param file - The file to upload
 * @param bucket - Storage bucket name (default: 'products')
 * @returns Public URL of the uploaded image
 */
export async function uploadImage(file: File, bucket: string = 'products'): Promise<string> {
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Delete image from Supabase Storage
 * @param url - Public URL of the image to delete
 * @param bucket - Storage bucket name (default: 'products')
 */
export async function deleteImage(url: string, bucket: string = 'products'): Promise<void> {
  const fileName = url.split('/').pop();
  if (!fileName) return;

  await supabaseAdmin.storage.from(bucket).remove([fileName]);
}

/**
 * Get public URL from file path
 * @param fileName - File name in storage
 * @param bucket - Storage bucket name (default: 'products')
 * @returns Public URL
 */
export function getPublicUrl(fileName: string, bucket: string = 'products'): string {
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
}