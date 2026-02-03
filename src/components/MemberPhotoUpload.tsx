import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface MemberPhotoUploadProps {
  photo?: string;
  name: string;
  onPhotoChange: (photo: string | undefined) => void;
  size?: 'sm' | 'md' | 'lg';
}

const MAX_SIZE_KB = 100;
const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;

// Compress image to target size
const compressImage = (file: File, maxSizeBytes: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let width = img.width;
      let height = img.height;
      let quality = 0.9;

      const tryCompress = () => {
        // Scale down if image is too large
        const maxDimension = 400;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const compress = (q: number): string => {
          return canvas.toDataURL('image/jpeg', q);
        };

        // Try different quality levels to get under max size
        let result = compress(quality);
        while (result.length > maxSizeBytes * 1.37 && quality > 0.1) { // 1.37 accounts for base64 overhead
          quality -= 0.1;
          result = compress(quality);
        }

        // If still too large, reduce dimensions further
        if (result.length > maxSizeBytes * 1.37 && width > 100) {
          width = width * 0.7;
          height = height * 0.7;
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          result = compress(0.7);
        }

        resolve(result);
      };

      tryCompress();
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

export function MemberPhotoUpload({ photo, name, onPhotoChange, size = 'md' }: MemberPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('শুধুমাত্র ছবি ফাইল আপলোড করা যাবে');
      return;
    }

    setIsCompressing(true);

    try {
      let base64: string;

      if (file.size <= MAX_SIZE_BYTES) {
        // File is already small enough, just read it
        base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      } else {
        // Compress the image
        base64 = await compressImage(file, MAX_SIZE_BYTES);
        toast.success('ছবি সংকুচিত করে যোগ করা হয়েছে');
      }

      onPhotoChange(base64);
      if (file.size <= MAX_SIZE_BYTES) {
        toast.success('ছবি যোগ করা হয়েছে');
      }
    } catch (error) {
      toast.error('ছবি প্রসেস করতে সমস্যা হয়েছে');
    } finally {
      setIsCompressing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPhotoChange(undefined);
    toast.success('ছবি মুছে ফেলা হয়েছে');
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="relative inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div 
        className={`relative ${!photo ? 'cursor-pointer group' : ''} ${isCompressing ? 'pointer-events-none' : ''}`}
        onClick={() => !photo && fileInputRef.current?.click()}
      >
        <Avatar className={`${sizeClasses[size]} border-2 border-border`}>
          <AvatarImage src={photo} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload overlay - only show when no photo */}
        {!photo && (
          <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${sizeClasses[size]}`}>
            {isCompressing ? (
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            ) : (
              <Camera className="h-4 w-4 text-white" />
            )}
          </div>
        )}

        {/* Loading state overlay */}
        {isCompressing && (
          <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center ${sizeClasses[size]}`}>
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
