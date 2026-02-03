import { Card, CardContent } from '@/components/ui/card';
import { Phone, Send, Facebook, Globe } from 'lucide-react';
import developerPhoto from '@/assets/developer-photo.jpg';

const AboutDeveloper = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">About Developer</h1>
      
      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary/30">
              <img 
                src={developerPhoto} 
                alt="Fardin Sagor" 
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-xl font-bold text-foreground">Fardin Sagor</h2>
          </div>

          {/* Contact Links */}
          <div className="space-y-4">
            {/* Phone */}
            <a 
              href="tel:+8801932378913" 
              className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-5 w-5 text-green-500" />
              <span>01932378913</span>
            </a>

            {/* Telegram */}
            <a 
              href="https://t.me/elitefardin" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors"
            >
              <Send className="h-5 w-5 text-blue-400" />
              <span>@elitefardin</span>
            </a>

            {/* Facebook */}
            <a 
              href="https://facebook.com/elitefardinlab" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors"
            >
              <Facebook className="h-5 w-5 text-blue-500" />
              <span>elitefardinlab</span>
            </a>

            {/* Website */}
            <a 
              href="https://sagor.pages.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors"
            >
              <Globe className="h-5 w-5 text-purple-500" />
              <span>sagor.pages.dev</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutDeveloper;
