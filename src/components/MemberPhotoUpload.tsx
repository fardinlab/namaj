import { useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export function MemberPhotoUpload({ photo, name, onPhotoChange, size = 'md' }: MemberPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('শুধুমাত্র ছবি ফাইল আপলোড করা যাবে');
      return;
    }

    // Check file size
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`ছবির সাইজ সর্বোচ্চ ${MAX_SIZE_KB} কেবি হতে হবে`);
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onPhotoChange(base64);
      toast.success('ছবি যোগ করা হয়েছে');
    };
    reader.onerror = () => {
      toast.error('ছবি পড়তে সমস্যা হয়েছে');
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        className="relative cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
      >
        <Avatar className={`${sizeClasses[size]} border-2 border-border`}>
          <AvatarImage src={photo} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload overlay */}
        <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${sizeClasses[size]}`}>
          <Camera className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Remove button */}
      {photo && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0"
          onClick={handleRemovePhoto}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
