import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MAX_SIZE_BYTES = 100 * 1024; // 100KB target
const INITIAL_MAX_DIMENSION = 400;

export function useMemberPhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const compressAndUpload = async (file: File, memberId: string): Promise<string> => {
    setIsUploading(true);
    
    try {
      // Compress image to under 100KB
      const compressedBlob = await compressImage(file);
      
      // Generate unique filename
      const fileExt = 'jpg';
      const fileName = `${memberId}/${Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('member-photos')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('member-photos')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      // Set a timeout for mobile devices where large images may hang
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Image loading timed out'));
      }, 15000);
      
      img.onload = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas not supported'));

          // For very large images (mobile camera), start with smaller dimensions
          let startMaxDim = INITIAL_MAX_DIMENSION;
          const megapixels = (img.width * img.height) / 1000000;
          if (megapixels > 4) {
            startMaxDim = 300; // More aggressive for large camera photos
          }
          if (megapixels > 8) {
            startMaxDim = 250;
          }

          const attemptCompress = (currentMaxDim: number, currentQuality: number) => {
            try {
              let width = img.width;
              let height = img.height;

              if (width > currentMaxDim || height > currentMaxDim) {
                if (width > height) {
                  height = Math.round((height / width) * currentMaxDim);
                  width = currentMaxDim;
                } else {
                  width = Math.round((width / height) * currentMaxDim);
                  height = currentMaxDim;
                }
              }

              canvas.width = width;
              canvas.height = height;
              ctx.clearRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);

              canvas.toBlob(
                (blob) => {
                  if (!blob) return reject(new Error('Failed to compress image'));
                  
                  console.log(`Compress: dim=${currentMaxDim}, q=${currentQuality.toFixed(1)}, size=${(blob.size / 1024).toFixed(1)}KB`);
                  
                  if (blob.size <= MAX_SIZE_BYTES) {
                    resolve(blob);
                  } else if (currentQuality > 0.2) {
                    attemptCompress(currentMaxDim, currentQuality - 0.15);
                  } else if (currentMaxDim > 80) {
                    attemptCompress(Math.round(currentMaxDim * 0.6), 0.6);
                  } else {
                    resolve(blob); // Accept best effort
                  }
                },
                'image/jpeg',
                currentQuality
              );
            } catch (e) {
              reject(new Error('Canvas drawing failed: ' + (e as Error).message));
            }
          };

          attemptCompress(startMaxDim, 0.8);
        } catch (e) {
          reject(new Error('Compression setup failed: ' + (e as Error).message));
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      img.src = objectUrl;
    });
  };

  const deletePhoto = async (photoUrl: string) => {
    try {
      // Extract path from URL
      const url = new URL(photoUrl);
      const pathParts = url.pathname.split('/member-photos/');
      if (pathParts.length > 1) {
        const filePath = pathParts[1];
        await supabase.storage
          .from('member-photos')
          .remove([filePath]);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  return {
    isUploading,
    compressAndUpload,
    deletePhoto
  };
}
