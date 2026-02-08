import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MAX_DIMENSION = 400;

export function useMemberPhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const compressAndUpload = async (file: File, memberId: string): Promise<string> => {
    setIsUploading(true);
    
    try {
      // Compress image
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
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Scale down if needed
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = (height / width) * MAX_DIMENSION;
            width = MAX_DIMENSION;
          } else {
            width = (width / height) * MAX_DIMENSION;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.8
        );
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
