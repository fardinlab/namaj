import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useMemberPhotoUpload } from '@/hooks/useMemberPhotoUpload';

interface CloudMemberPhotoUploadProps {
  photoUrl?: string | null;
  memberId: string;
  name: string;
  onPhotoChange: (photoUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function CloudMemberPhotoUpload({ 
  photoUrl, 
  memberId, 
  name, 
  onPhotoChange, 
  size = 'md' 
}: CloudMemberPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, compressAndUpload } = useMemberPhotoUpload();
  const [localUploading, setLocalUploading] = useState(false);

  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('শুধুমাত্র ছবি ফাইল আপলোড করা যাবে');
      return;
    }

    setLocalUploading(true);

    try {
      const url = await compressAndUpload(file, memberId);
      onPhotoChange(url);
      toast.success('ছবি আপলোড হয়েছে');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('ছবি আপলোড করতে সমস্যা হয়েছে');
    } finally {
      setLocalUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const isLoading = isUploading || localUploading;

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
        className={`relative cursor-pointer group ${isLoading ? 'pointer-events-none' : ''}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Avatar className={`${sizeClasses[size]} border-2 border-border`}>
          <AvatarImage src={photoUrl || undefined} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload/Change overlay */}
        <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${sizeClasses[size]}`}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          ) : (
            <Camera className="h-4 w-4 text-white" />
          )}
        </div>

        {/* Loading state overlay */}
        {isLoading && (
          <div className={`absolute inset-0 rounded-full bg-black/50 flex items-center justify-center ${sizeClasses[size]}`}>
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
