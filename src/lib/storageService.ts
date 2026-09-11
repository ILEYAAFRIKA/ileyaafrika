import { supabase, BUCKET_NAME } from './supabase';

/**
 * Upload a single image file to Supabase Storage and return the public URL.
 */
export async function uploadListingImageFile(file: File, listingId?: string): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanName = `${listingId || 'prop'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  const filePath = `listings/${cleanName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw new Error(error.message || 'Supabase storage image upload failed');
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Upload multiple image files sequentially or in parallel to Supabase Storage.
 */
export async function uploadListingImageFiles(files: File[], listingId?: string): Promise<string[]> {
  if (!files || files.length === 0) return [];
  const results: string[] = [];
  for (const file of files) {
    const url = await uploadListingImageFile(file, listingId);
    results.push(url);
  }
  return results;
}
