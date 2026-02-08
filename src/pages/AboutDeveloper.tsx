import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Phone, Send, Facebook, Globe, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import developerPhoto from '@/assets/developer-photo.jpg';

interface DeveloperBio {
  id: string;
  name: string;
  title: string;
  bio: string;
  photo_url: string | null;
  telegram_url: string | null;
  facebook_url: string | null;
  phone: string | null;
  email: string | null;
  skills: string[];
}

const AboutDeveloper = () => {
  const [bio, setBio] = useState<DeveloperBio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBio();
  }, []);

  const fetchBio = async () => {
    try {
      const { data, error } = await supabase
        .from('developer_bio')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setBio(data);
    } catch (error) {
      console.error('Error fetching bio:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="text-center sm:text-left space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback to default if no data
  const displayBio = bio || {
    name: 'Fardin Sagor',
    title: 'Software Developer',
    bio: 'Computer engineering student and aspiring software developer from Bangladesh.',
    phone: '+8801932378913',
    telegram_url: 'https://t.me/elitefardin',
    facebook_url: 'https://facebook.com/elitefardinlab',
    skills: ['Software Development', 'Web Development']
  };

  // Extract username from Telegram URL
  const getTelegramUsername = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/t\.me\/(.+)/);
    return match ? `@${match[1]}` : null;
  };

  // Extract username from Facebook URL
  const getFacebookUsername = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/facebook\.com\/(.+)/);
    return match ? match[1] : null;
  };

  // Format phone for display
  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    return phone.replace('+880', '0');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-serif font-bold mb-2">ডেভেলপার সম্পর্কে</h1>
        <p className="text-muted-foreground text-sm">এই অ্যাপের নির্মাতা</p>
      </div>
      
      {/* Profile Card */}
      <Card className="border-0 shadow-soft overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-secondary" />
        <CardContent className="p-6">
          {/* Profile Section */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-soft">
              <img 
                src={developerPhoto} 
                alt={displayBio.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-serif font-bold text-foreground">{displayBio.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{displayBio.title}</p>
              {bio?.skills && bio.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 justify-center sm:justify-start">
                  {bio.skills.slice(0, 3).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact Links */}
          <div className="space-y-3">
            {/* Phone */}
            {displayBio.phone && (
              <a 
                href={`tel:${displayBio.phone}`}
                className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-success" />
                </div>
                <span className="text-foreground">{formatPhone(displayBio.phone)}</span>
              </a>
            )}

            {/* Telegram */}
            {displayBio.telegram_url && (
              <a 
                href={displayBio.telegram_url}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Send className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-foreground">{getTelegramUsername(displayBio.telegram_url)}</span>
              </a>
            )}

            {/* Facebook */}
            {displayBio.facebook_url && (
              <a 
                href={displayBio.facebook_url}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
                  <Facebook className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-foreground">{getFacebookUsername(displayBio.facebook_url)}</span>
              </a>
            )}

            {/* Website */}
            <a 
              href="https://sagor.pages.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-purple-500" />
              </div>
              <span className="text-foreground">sagor.pages.dev</span>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Bio Section */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-6">
          <h3 className="text-lg font-serif font-semibold text-foreground mb-4">পরিচিতি</h3>
          <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {displayBio.bio}
          </div>
        </CardContent>
      </Card>

      {/* Skills Section */}
      {bio?.skills && bio.skills.length > 0 && (
        <Card className="border-0 shadow-soft">
          <CardContent className="p-6">
            <h3 className="text-lg font-serif font-semibold text-foreground mb-4">দক্ষতা</h3>
            <div className="flex flex-wrap gap-2">
              {bio.skills.map((skill, index) => (
                <Badge key={index} variant="outline" className="px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground font-serif">
          جزاك الله خيرا
        </p>
      </div>
    </div>
  );
};

export default AboutDeveloper;
