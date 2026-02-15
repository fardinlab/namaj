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
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));

        let maxDim = INITIAL_MAX_DIMENSION;
        let quality = 0.8;
        
        const tryCompress = (): Blob | null => {
          let width = img.width;
          let height = img.height;

          // Scale down to maxDim
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (height / width) * maxDim;
              width = maxDim;
            } else {
              width = (width / height) * maxDim;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          return null; // we'll use toBlob async
        };

        const attemptCompress = (currentMaxDim: number, currentQuality: number) => {
          let width = img.width;
          let height = img.height;

          if (width > currentMaxDim || height > currentMaxDim) {
            if (width > height) {
              height = (height / width) * currentMaxDim;
              width = currentMaxDim;
            } else {
              width = (width / height) * currentMaxDim;
              height = currentMaxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Failed to compress image'));
              
              if (blob.size <= MAX_SIZE_BYTES) {
                resolve(blob);
              } else if (currentQuality > 0.2) {
                // Reduce quality first
                attemptCompress(currentMaxDim, currentQuality - 0.1);
              } else if (currentMaxDim > 100) {
                // Then reduce dimensions
                attemptCompress(Math.round(currentMaxDim * 0.7), 0.7);
              } else {
                // Accept whatever we got at minimum settings
                resolve(blob);
              }
            },
            'image/jpeg',
            currentQuality
          );
        };

        attemptCompress(INITIAL_MAX_DIMENSION, quality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
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
