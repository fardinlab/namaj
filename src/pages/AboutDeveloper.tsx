import { Card, CardContent } from '@/components/ui/card';
import { Phone, Send, Facebook, Globe } from 'lucide-react';
import developerPhoto from '@/assets/developer-photo.jpg';

const AboutDeveloper = () => {
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
                alt="Fardin Sagor" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-serif font-bold text-foreground">Fardin Sagor</h2>
              <p className="text-sm text-muted-foreground mt-1">Software Developer</p>
            </div>
          </div>

          {/* Contact Links */}
          <div className="space-y-3">
            {/* Phone */}
            <a 
              href="tel:+8801932378913" 
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-success" />
              </div>
              <span className="text-foreground">01932378913</span>
            </a>

            {/* Telegram */}
            <a 
              href="https://t.me/elitefardin" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Send className="h-5 w-5 text-blue-500" />
              </div>
              <span className="text-foreground">@elitefardin</span>
            </a>

            {/* Facebook */}
            <a 
              href="https://facebook.com/elitefardinlab" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
                <Facebook className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-foreground">elitefardinlab</span>
            </a>

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
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Fardin Sagor is a computer engineering student and aspiring software developer from Bangladesh. He is passionate about building practical digital solutions, modern web applications, and community-focused platforms.
            </p>
            <p>
              He works with web technologies, UI-focused applications, and cloud-based systems, aiming to create simple, user-friendly, and impactful products.
            </p>
            <p>
              Driven by continuous learning and innovation, he actively explores new tools and platforms to improve his technical and professional skills.
            </p>
          </div>
        </CardContent>
      </Card>

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
