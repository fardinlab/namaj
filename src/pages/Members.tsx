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
import { Plus, Search, Star, Calendar, Flame, Trash2, Phone, UserPlus } from 'lucide-react';

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold">সদস্য তালিকা</h1>
          <p className="text-sm text-muted-foreground mt-1">মোট {toBanglaNumber(members.length)} জন সদস্য</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl shadow-soft">
              <UserPlus className="h-4 w-4" />
              নতুন সদস্য
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif">নতুন সদস্য যোগ করুন</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">নাম *</Label>
                <Input
                  id="name"
                  placeholder="সদস্যের নাম লিখুন"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">ফোন নম্বর (ঐচ্ছিক)</Label>
                <Input
                  id="phone"
                  placeholder="ফোন নম্বর লিখুন"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <Button onClick={handleAddMember} className="w-full rounded-xl">
                সদস্য যোগ করুন
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="সদস্য খুঁজুন..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 rounded-xl shadow-soft border-0 bg-card"
        />
      </div>

      {/* Members list */}
      {filteredMembers.length === 0 ? (
        <Card className="text-center py-12 shadow-soft border-0">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl">👥</span>
            </div>
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
                  className={`shadow-soft border-0 overflow-hidden transition-all hover:shadow-soft-lg ${
                    hasUpdatedToday 
                      ? 'ring-2 ring-success/30' 
                      : 'ring-2 ring-secondary/30'
                  }`}
                >
                  {/* Top gradient indicator */}
                  <div className={`h-1 ${hasUpdatedToday ? 'bg-success' : 'bg-secondary'}`} />
                  
                  <CardContent className="p-4">
                    {/* Today's Prayer Status - Pill style */}
                    <div className="flex gap-1.5 mb-4">
                      {prayers.map(prayer => {
                        const isCompleted = todayRecord?.prayers[prayer] ?? false;
                        return (
                          <div
                            key={prayer}
                            className={`flex-1 text-center py-1.5 px-1 rounded-lg text-xs font-medium transition-colors ${
                              isCompleted 
                                ? 'bg-primary text-primary-foreground' 
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
                          <h3 className="text-lg font-serif font-semibold truncate">{member.name}</h3>
                          {stats.isWinner && (
                            <span className="bg-secondary/20 text-secondary text-xs px-2 py-1 rounded-full flex-shrink-0">
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
                        
                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Star className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span>
                              <span className="font-medium">{toBanglaNumber(stats.totalPoints)}</span>
                              <span className="text-muted-foreground text-xs"> পয়েন্ট</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-success/10 flex items-center justify-center">
                              <Calendar className="h-3.5 w-3.5 text-success" />
                            </div>
                            <span>
                              <span className="font-medium">{toBanglaNumber(stats.activeDays)}</span>
                              <span className="text-muted-foreground text-xs"> দিন</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center">
                              <Flame className="h-3.5 w-3.5 text-secondary" />
                            </div>
                            <span>
                              <span className="font-medium">{toBanglaNumber(stats.currentStreak)}</span>
                              <span className="text-muted-foreground text-xs"> ধারা</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 flex-shrink-0 rounded-xl"
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

      {/* Phone Number Dialog */}
      <Dialog open={phoneDialogOpen !== null} onOpenChange={(open) => !open && setPhoneDialogOpen(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">ফোন নম্বর যোগ করুন</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-phone">ফোন নম্বর</Label>
              <Input
                id="edit-phone"
                placeholder="ফোন নম্বর লিখুন"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button 
              onClick={() => phoneDialogOpen && handleAddPhone(phoneDialogOpen)} 
              className="w-full rounded-xl"
            >
              সংরক্ষণ করুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Member Dialog */}
      <Dialog open={deleteDialogOpen !== null} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">সদস্য মুছে ফেলুন</DialogTitle>
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
                className={`rounded-xl ${deleteError ? 'border-destructive ring-destructive/20' : ''}`}
              />
              {deleteError && (
                <p className="text-sm text-destructive">ভুল কোড! সঠিক কোড দিন।</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setDeleteDialogOpen(null)} 
                className="flex-1 rounded-xl"
              >
                বাতিল
              </Button>
              <Button 
                variant="destructive"
                onClick={() => deleteDialogOpen && handleDeleteMember(deleteDialogOpen)} 
                className="flex-1 rounded-xl"
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
