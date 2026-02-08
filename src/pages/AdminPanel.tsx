import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Users, 
  Settings, 
  Code, 
  Trash2, 
  Download, 
  RefreshCw,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  User,
  Calendar
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCampaignData } from '@/hooks/useCampaignData';
import { toast } from 'sonner';

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

interface Member {
  id: string;
  name: string;
  phone?: string;
  photo?: string;
}

export default function AdminPanel() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [developerBio, setDeveloperBio] = useState<DeveloperBio | null>(null);
  const [bioForm, setBioForm] = useState({
    name: '',
    title: '',
    bio: '',
    phone: '',
    telegram_url: '',
    facebook_url: '',
    skills: ''
  });
  const [secretCode, setSecretCode] = useState('');
  const [members] = useLocalStorage<Member[]>('members', []);
  const { config, updateConfig } = useCampaignData();
  const [campaignForm, setCampaignForm] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchDeveloperBio();
  }, []);

  useEffect(() => {
    if (config) {
      setCampaignForm({
        startDate: config.startDate || '',
        endDate: config.endDate || ''
      });
    }
  }, [config]);

  const fetchDeveloperBio = async () => {
    try {
      const { data, error } = await supabase
        .from('developer_bio')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setDeveloperBio(data);
        setBioForm({
          name: data.name || '',
          title: data.title || '',
          bio: data.bio || '',
          phone: data.phone || '',
          telegram_url: data.telegram_url || '',
          facebook_url: data.facebook_url || '',
          skills: (data.skills || []).join(', ')
        });
      }
    } catch (error) {
      console.error('Error fetching developer bio:', error);
    }
  };

  const handleSaveBio = async () => {
    if (!developerBio) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('developer_bio')
        .update({
          name: bioForm.name,
          title: bioForm.title,
          bio: bioForm.bio,
          phone: bioForm.phone,
          telegram_url: bioForm.telegram_url,
          facebook_url: bioForm.facebook_url,
          skills: bioForm.skills.split(',').map(s => s.trim()).filter(Boolean),
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', developerBio.id);

      if (error) throw error;
      
      toast.success('ডেভেলপার তথ্য সংরক্ষিত হয়েছে');
      fetchDeveloperBio();
    } catch (error) {
      console.error('Error saving bio:', error);
      toast.error('সংরক্ষণ করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCampaign = () => {
    updateConfig({
      startDate: campaignForm.startDate,
      endDate: campaignForm.endDate
    });
    toast.success('ক্যাম্পেইন সেটিংস সংরক্ষিত হয়েছে');
  };

  const handleResetPrayerData = () => {
    if (secretCode !== 'FARDIN') {
      toast.error('ভুল সিক্রেট কোড');
      return;
    }

    localStorage.removeItem('attendance');
    toast.success('সব নামাজের ডাটা মুছে ফেলা হয়েছে');
    setSecretCode('');
  };

  const handleExportData = () => {
    const data = {
      members: members,
      attendance: JSON.parse(localStorage.getItem('campaign-attendance') || '[]'),
      campaign: config,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `namaj-campaign-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ডাটা এক্সপোর্ট হয়েছে');
  };

  const handleDeleteMember = (memberId: string) => {
    if (secretCode !== 'FARDIN') {
      toast.error('ভুল সিক্রেট কোড');
      return;
    }

    const updatedMembers = members.filter(m => m.id !== memberId);
    localStorage.setItem('members', JSON.stringify(updatedMembers));
    toast.success('সদস্য মুছে ফেলা হয়েছে');
    setSecretCode('');
    window.location.reload();
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-destructive">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">অ্যাক্সেস নেই</h2>
            <p className="text-muted-foreground">
              এই পেজটি শুধুমাত্র অ্যাডমিনদের জন্য।
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold">অ্যাডমিন প্যানেল</h1>
          <p className="text-sm text-muted-foreground">সব সেটিংস এখানে পরিচালনা করুন</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <Settings className="h-4 w-4 mr-1 hidden sm:inline" />
            সারসংক্ষেপ
          </TabsTrigger>
          <TabsTrigger value="members" className="text-xs sm:text-sm">
            <Users className="h-4 w-4 mr-1 hidden sm:inline" />
            সদস্য
          </TabsTrigger>
          <TabsTrigger value="campaign" className="text-xs sm:text-sm">
            <Calendar className="h-4 w-4 mr-1 hidden sm:inline" />
            ক্যাম্পেইন
          </TabsTrigger>
          <TabsTrigger value="developer" className="text-xs sm:text-sm">
            <Code className="h-4 w-4 mr-1 hidden sm:inline" />
            ডেভেলপার
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">মোট সদস্য</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{members.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ক্যাম্পেইন শুরু</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{config?.startDate || 'সেট করা হয়নি'}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">ক্যাম্পেইন শেষ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{config?.endDate || 'সেট করা হয়নি'}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ডাটা ম্যানেজমেন্ট</CardTitle>
              <CardDescription>ব্যাকআপ এবং রিসেট অপশন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleExportData} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                সব ডাটা এক্সপোর্ট করুন
              </Button>

              <div className="border-t pt-4">
                <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  বিপজ্জনক অপারেশন
                </h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="password"
                    placeholder="সিক্রেট কোড"
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                    className="sm:w-48"
                  />
                  <Button 
                    variant="destructive" 
                    onClick={handleResetPrayerData}
                    disabled={!secretCode}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    সব নামাজ ডাটা রিসেট
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>সদস্য তালিকা</CardTitle>
              <CardDescription>মোট {members.length} জন সদস্য</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">কোনো সদস্য নেই</p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {member.photo ? (
                          <img 
                            src={member.photo} 
                            alt={member.name} 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{member.name}</p>
                          {member.phone && (
                            <p className="text-sm text-muted-foreground">{member.phone}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const code = prompt('সিক্রেট কোড দিন:');
                          if (code) {
                            setSecretCode(code);
                            handleDeleteMember(member.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campaign Tab */}
        <TabsContent value="campaign" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ক্যাম্পেইন সেটিংস</CardTitle>
              <CardDescription>তারিখ পরিবর্তন করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">শুরুর তারিখ</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">শেষের তারিখ</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleSaveCampaign}>
                <Save className="h-4 w-4 mr-2" />
                সংরক্ষণ করুন
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Developer Tab */}
        <TabsContent value="developer" className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              এখানে যা পরিবর্তন করবেন তা সব ব্যবহারকারী "ডেভেলপার সম্পর্কে" পেজে দেখতে পাবে।
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>ডেভেলপার তথ্য</CardTitle>
              <CardDescription>প্রোফাইল তথ্য সম্পাদনা করুন</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">নাম</Label>
                  <Input
                    id="name"
                    value={bioForm.name}
                    onChange={(e) => setBioForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">পদবী</Label>
                  <Input
                    id="title"
                    value={bioForm.title}
                    onChange={(e) => setBioForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">পরিচিতি</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={bioForm.bio}
                  onChange={(e) => setBioForm(prev => ({ ...prev, bio: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">ফোন</Label>
                  <Input
                    id="phone"
                    value={bioForm.phone}
                    onChange={(e) => setBioForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegram">টেলিগ্রাম URL</Label>
                  <Input
                    id="telegram"
                    value={bioForm.telegram_url}
                    onChange={(e) => setBioForm(prev => ({ ...prev, telegram_url: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook">ফেসবুক URL</Label>
                <Input
                  id="facebook"
                  value={bioForm.facebook_url}
                  onChange={(e) => setBioForm(prev => ({ ...prev, facebook_url: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">দক্ষতা (কমা দিয়ে আলাদা করুন)</Label>
                <Input
                  id="skills"
                  value={bioForm.skills}
                  onChange={(e) => setBioForm(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="React, TypeScript, Node.js"
                />
              </div>

              <Button onClick={handleSaveBio} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    সংরক্ষণ হচ্ছে...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    সংরক্ষণ করুন
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
