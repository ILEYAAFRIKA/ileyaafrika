/**
 * Supabase Storage Integration (Replaces Cloudinary)
 */
import { uploadListingImageFile, uploadListingImageFiles } from './storageService';

export const uploadImageToCloudinary = uploadListingImageFile;
export const uploadMultipleImagesToCloudinary = uploadListingImageFiles;
