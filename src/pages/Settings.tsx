import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Download, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { toast } = useToast();

  const handleExportData = () => {
    const members = localStorage.getItem('campaign-members') || '[]';
    const attendance = localStorage.getItem('campaign-attendance') || '[]';
    
    const data = {
      members: JSON.parse(members),
      attendance: JSON.parse(attendance),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `namaz-campaign-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'ডাটা এক্সপোর্ট সম্পন্ন',
      description: 'আপনার ব্যাকআপ ফাইল ডাউনলোড হয়েছে।',
    });
  };

  const handleClearData = () => {
    localStorage.removeItem('campaign-members');
    localStorage.removeItem('campaign-attendance');
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">সেটিংস</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            ডাটা এক্সপোর্ট
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            সমস্ত সদস্য এবং উপস্থিতি তথ্য JSON ফাইল হিসেবে ডাউনলোড করুন।
          </p>
          <Button onClick={handleExportData} className="gap-2">
            <Download className="h-4 w-4" />
            ব্যাকআপ ডাউনলোড করুন
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            বিপজ্জনক জোন
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            সমস্ত ডাটা মুছে ফেলুন। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
          </p>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                সমস্ত ডাটা মুছে ফেলুন
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
                <AlertDialogDescription>
                  এই কাজটি সমস্ত সদস্য এবং তাদের উপস্থিতি তথ্য স্থায়ীভাবে মুছে ফেলবে।
                  এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>বাতিল</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  হ্যাঁ, মুছে ফেলুন
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          <p className="text-sm">
            নামাজ উপস্থিতি ক্যাম্পেইন অ্যাপ
          </p>
          <p className="text-xs mt-1">
            সংস্করণ ১.০.০
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
