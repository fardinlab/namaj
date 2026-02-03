import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Download, Trash2, Calendar as CalendarIcon, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCampaignData } from '@/hooks/useCampaignData';
import { formatBanglaDate, toBanglaNumber, getTotalDays } from '@/lib/bangla-utils';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { toast } = useToast();
  const { config, updateConfig } = useCampaignData();
  
  const [startDate, setStartDate] = useState<Date>(new Date(config.startDate));
  const [endDate, setEndDate] = useState<Date>(new Date(config.endDate));
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteError, setDeleteError] = useState(false);

  const totalDays = getTotalDays(
    startDate.toISOString().split('T')[0], 
    endDate.toISOString().split('T')[0]
  );

  const handleSaveDates = () => {
    if (endDate <= startDate) {
      toast({
        title: 'ত্রুটি',
        description: 'শেষের তারিখ শুরুর তারিখের পরে হতে হবে।',
        variant: 'destructive',
      });
      return;
    }

    updateConfig({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });

    toast({
      title: 'তারিখ আপডেট হয়েছে',
      description: `ক্যাম্পেইন এখন ${toBanglaNumber(totalDays)} দিনের।`,
    });
  };

  const handleExportData = () => {
    const members = localStorage.getItem('campaign-members') || '[]';
    const attendance = localStorage.getItem('campaign-attendance') || '[]';
    const campaignConfig = localStorage.getItem('campaign-config') || '{}';
    
    const data = {
      members: JSON.parse(members),
      attendance: JSON.parse(attendance),
      config: JSON.parse(campaignConfig),
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
    if (deleteCode === 'FARDIN') {
      localStorage.removeItem('campaign-members');
      localStorage.removeItem('campaign-attendance');
      localStorage.removeItem('campaign-config');
      window.location.reload();
    } else {
      setDeleteError(true);
    }
  };

  const openDeleteDialog = () => {
    setDeleteCode('');
    setDeleteError(false);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">সেটিংস</h1>

      {/* Campaign Date Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            ক্যাম্পেইন তারিখ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            ক্যাম্পেইনের শুরু এবং শেষের তারিখ নির্ধারণ করুন।
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">শুরুর তারিখ</label>
              <Popover open={startOpen} onOpenChange={setStartOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? formatBanglaDate(startDate) : 'তারিখ নির্বাচন করুন'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date);
                        setStartOpen(false);
                      }
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">শেষের তারিখ</label>
              <Popover open={endOpen} onOpenChange={setEndOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? formatBanglaDate(endDate) : 'তারিখ নির্বাচন করুন'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date);
                        setEndOpen(false);
                      }
                    }}
                    disabled={(date) => date <= startDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm">
              মোট দিন: <span className="font-semibold">{toBanglaNumber(totalDays)} দিন</span>
            </p>
          </div>

          <Button onClick={handleSaveDates} className="w-full sm:w-auto">
            তারিখ সংরক্ষণ করুন
          </Button>
        </CardContent>
      </Card>

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
          
          <Button variant="destructive" className="gap-2" onClick={openDeleteDialog}>
            <Trash2 className="h-4 w-4" />
            সমস্ত ডাটা মুছে ফেলুন
          </Button>
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

      {/* Delete All Data Dialog with Secret Code */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>সমস্ত ডাটা মুছে ফেলুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              এই কাজটি সমস্ত সদস্য এবং তাদের উপস্থিতি তথ্য স্থায়ীভাবে মুছে ফেলবে।
              মুছে ফেলতে গোপন কোড লিখুন।
            </p>
            <div className="space-y-2">
              <Label htmlFor="delete-all-code">গোপন কোড</Label>
              <Input
                id="delete-all-code"
                type="password"
                placeholder="গোপন কোড লিখুন"
                value={deleteCode}
                onChange={(e) => {
                  setDeleteCode(e.target.value);
                  setDeleteError(false);
                }}
                className={deleteError ? 'border-destructive' : ''}
              />
              {deleteError && (
                <p className="text-sm text-destructive">ভুল কোড! সঠিক কোড দিন।</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)} 
                className="flex-1"
              >
                বাতিল
              </Button>
              <Button 
                variant="destructive"
                onClick={handleClearData} 
                className="flex-1"
              >
                মুছে ফেলুন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
