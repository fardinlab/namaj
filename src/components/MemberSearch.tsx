import { useState, useRef, useCallback } from 'react';
import { Search, Camera, X, Loader2, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Member } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MemberSearchProps {
  members: Member[];
  onSelectMember: (memberId: string) => void;
}

export function MemberSearch({ members, onSelectMember }: MemberSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      (member.phone && member.phone.includes(searchQuery))
    );
  });

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('ক্যামেরা অ্যাক্সেস করা যায়নি। অনুগ্রহ করে ক্যামেরা পারমিশন দিন।');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleOpenCamera = () => {
    setShowCamera(true);
    setTimeout(startCamera, 100);
  };

  const handleCloseCamera = () => {
    stopCamera();
    setShowCamera(false);
    setCameraError(null);
  };

  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Get members with photos
    const membersWithPhotos = members.filter(m => m.photo);
    
    if (membersWithPhotos.length === 0) {
      toast.error('কোনো সদস্যের ছবি নেই। প্রথমে সদস্যদের ছবি যোগ করুন।');
      return;
    }

    setIsScanning(true);

    try {
      // Capture image from video
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      ctx.drawImage(video, 0, 0);
      const capturedImage = canvas.toDataURL('image/jpeg', 0.8);

      // Prepare member photos for comparison
      const memberPhotos = membersWithPhotos.map(m => ({
        id: m.id,
        name: m.name,
        photo: m.photo!
      }));

      // Call face recognition API
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/face-recognition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          capturedImage,
          memberPhotos
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Face recognition failed');
      }

      const result = await response.json();

      if (result.matched && result.memberId) {
        const matchedMember = members.find(m => m.id === result.memberId);
        if (matchedMember) {
          toast.success(`${matchedMember.name} সনাক্ত হয়েছে!`);
          onSelectMember(result.memberId);
          handleCloseCamera();
        } else {
          toast.error('সদস্য খুঁজে পাওয়া যায়নি');
        }
      } else {
        toast.error('মুখ সনাক্ত করা যায়নি। আবার চেষ্টা করুন।');
      }
    } catch (error) {
      console.error('Recognition error:', error);
      toast.error(error instanceof Error ? error.message : 'সনাক্তকরণে সমস্যা হয়েছে');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Input with Camera Button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="নাম বা নম্বর দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-12"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0"
          onClick={handleOpenCamera}
        >
          <Camera className="h-5 w-5" />
        </Button>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="bg-card border rounded-xl overflow-hidden">
          {filteredMembers.length > 0 ? (
            <div className="divide-y">
              {filteredMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => {
                    onSelectMember(member.id);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{member.name}</p>
                    {member.phone && (
                      <p className="text-sm text-muted-foreground">{member.phone}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              কোনো সদস্য পাওয়া যায়নি
            </div>
          )}
        </div>
      )}

      {/* Camera Dialog */}
      <Dialog open={showCamera} onOpenChange={(open) => !open && handleCloseCamera()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">ফেস রিকগনিশন</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {cameraError ? (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-sm text-destructive text-center px-4">{cameraError}</p>
              </div>
            ) : (
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">সনাক্ত করা হচ্ছে...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCloseCamera}
              >
                বাতিল
              </Button>
              <Button
                className="flex-1"
                onClick={captureAndRecognize}
                disabled={isScanning || !!cameraError}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    সনাক্ত করা হচ্ছে
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    স্ক্যান করুন
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              ক্যামেরার সামনে মুখ রাখুন এবং "স্ক্যান করুন" বাটনে ক্লিক করুন
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
