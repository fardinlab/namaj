import { useState } from 'react';
import { useCampaignData } from '@/hooks/useCampaignData';
import { toBanglaNumber } from '@/lib/bangla-utils';
import { PRAYER_NAMES, PrayerName } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MemberPhotoUpload } from '@/components/MemberPhotoUpload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Plus, Search, Star, Calendar, Flame, Trash2, Phone } from 'lucide-react';

export default function Members() {
  const { members, attendance, addMember, removeMember, updateMemberPhoto, updateMemberPhone, getMemberStats } = useCampaignData();
  const [searchQuery, setSearchQuery] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteError, setDeleteError] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const prayers: PrayerName[] = ['fajr', 'zuhr', 'asr', 'maghrib', 'isha'];

  const hasTodayData = (memberId: string) => {
    const record = attendance.find(a => a.memberId === memberId && a.date === todayStr);
    if (!record) return false;
    return Object.values(record.prayers).some(Boolean);
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      addMember(newMemberName.trim(), newMemberPhone.trim() || undefined);
      setNewMemberName('');
      setNewMemberPhone('');
      setDialogOpen(false);
    }
  };

  const handleAddPhone = (memberId: string) => {
    if (editPhone.trim()) {
      updateMemberPhone(memberId, editPhone.trim());
      setPhoneDialogOpen(null);
      setEditPhone('');
    }
  };

  const openPhoneDialog = (memberId: string, currentPhone?: string) => {
    setEditPhone(currentPhone || '');
    setPhoneDialogOpen(memberId);
  };

  const handleDeleteMember = (memberId: string) => {
    if (deleteCode === 'FARDIN') {
      removeMember(memberId);
      setDeleteDialogOpen(null);
      setDeleteCode('');
      setDeleteError(false);
    } else {
      setDeleteError(true);
    }
  };

  const openDeleteDialog = (memberId: string) => {
    setDeleteCode('');
    setDeleteError(false);
    setDeleteDialogOpen(memberId);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">সদস্য তালিকা</h1>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              নতুন সদস্য যোগ করুন
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>নতুন সদস্য যোগ করুন</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">নাম *</Label>
                <Input
                  id="name"
                  placeholder="সদস্যের নাম লিখুন"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">ফোন নম্বর (ঐচ্ছিক)</Label>
                <Input
                  id="phone"
                  placeholder="ফোন নম্বর লিখুন"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                />
              </div>
              <Button onClick={handleAddMember} className="w-full">
                সদস্য যোগ করুন
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="সদস্য খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Members list */}
      {filteredMembers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-5xl mb-4">👥</div>
            <p className="text-muted-foreground">
              {members.length === 0 
                ? 'কোনো সদস্য যোগ করা হয়নি। উপরের বাটনে ক্লিক করে সদস্য যোগ করুন।'
                : 'কোনো সদস্য পাওয়া যায়নি।'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMembers.map(member => {
            const stats = getMemberStats(member.id);
            const hasUpdatedToday = hasTodayData(member.id);
            const todayRecord = attendance.find(a => a.memberId === member.id && a.date === todayStr);
              
              return (
                <Card 
                  key={member.id} 
                  className={`hover:shadow-md transition-shadow ${
                    hasUpdatedToday 
                      ? 'border-2 border-green-500 bg-green-50/50 dark:bg-green-950/20' 
                      : 'border-2 border-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                  }`}
                >
                  <CardContent className="p-4">
                    {/* Today's Prayer Status */}
                    <div className="flex gap-1.5 mb-3">
                      {prayers.map(prayer => {
                        const isCompleted = todayRecord?.prayers[prayer] ?? false;
                        return (
                          <div
                            key={prayer}
                            className={`flex-1 text-center py-1 px-1 rounded text-xs font-medium ${
                              isCompleted 
                                ? 'bg-green-500 text-white' 
                                : 'bg-muted text-muted-foreground'
                            }`}
                            title={isCompleted ? `${PRAYER_NAMES[prayer]} ✓` : `${PRAYER_NAMES[prayer]} - বাকি`}
                          >
                            {PRAYER_NAMES[prayer]}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-start gap-4">
                    {/* Photo */}
                    <MemberPhotoUpload
                      photo={member.photo}
                      name={member.name}
                      onPhotoChange={(photo) => updateMemberPhoto(member.id, photo)}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold truncate">{member.name}</h3>
                        {stats.isWinner && (
                          <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex-shrink-0">
                            🏆 বিজয়ী
                          </span>
                        )}
                      </div>
                      
                      {/* Phone number */}
                      {member.phone ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{member.phone}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => openPhoneDialog(member.id)}
                          className="flex items-center gap-1.5 text-sm text-primary hover:underline mb-2"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>নম্বর যোগ করুন</span>
                        </button>
                      )}
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>
                            <span className="font-medium">{toBanglaNumber(stats.totalPoints)}</span>
                            <span className="text-muted-foreground"> পয়েন্ট</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span>
                            <span className="font-medium">{toBanglaNumber(stats.activeDays)}</span>
                            <span className="text-muted-foreground"> দিন</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Flame className="h-4 w-4 text-amber-600 flex-shrink-0" />
                          <span>
                            <span className="font-medium">{toBanglaNumber(stats.currentStreak)}</span>
                            <span className="text-muted-foreground"> ধারা</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive flex-shrink-0"
                      onClick={() => openDeleteDialog(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        মোট সদস্য: {toBanglaNumber(members.length)} জন
      </p>

      {/* Phone Number Dialog */}
      <Dialog open={phoneDialogOpen !== null} onOpenChange={(open) => !open && setPhoneDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ফোন নম্বর যোগ করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-phone">ফোন নম্বর</Label>
              <Input
                id="edit-phone"
                placeholder="ফোন নম্বর লিখুন"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => phoneDialogOpen && handleAddPhone(phoneDialogOpen)} 
              className="w-full"
            >
              সংরক্ষণ করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Member Dialog with Secret Code */}
      <Dialog open={deleteDialogOpen !== null} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>সদস্য মুছে ফেলুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              এই সদস্যের সমস্ত উপস্থিতি তথ্যও মুছে যাবে। মুছে ফেলতে গোপন কোড লিখুন।
            </p>
            <div className="space-y-2">
              <Label htmlFor="delete-code">গোপন কোড</Label>
              <Input
                id="delete-code"
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
                onClick={() => setDeleteDialogOpen(null)} 
                className="flex-1"
              >
                বাতিল
              </Button>
              <Button 
                variant="destructive"
                onClick={() => deleteDialogOpen && handleDeleteMember(deleteDialogOpen)} 
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
