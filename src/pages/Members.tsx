import { useState } from 'react';
import { useCampaignData } from '@/hooks/useCampaignData';
import { toBanglaNumber } from '@/lib/bangla-utils';
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
import { Plus, Search, Star, Calendar, Flame, Trash2 } from 'lucide-react';

export default function Members() {
  const { members, addMember, removeMember, updateMemberPhoto, getMemberStats } = useCampaignData();
  const [searchQuery, setSearchQuery] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

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
            
            return (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Photo */}
                    <MemberPhotoUpload
                      photo={member.photo}
                      name={member.name}
                      onPhotoChange={(photo) => updateMemberPhoto(member.id, photo)}
                      size="md"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold truncate">{member.name}</h3>
                        {stats.isWinner && (
                          <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex-shrink-0">
                            🏆 বিজয়ী
                          </span>
                        )}
                      </div>
                      
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
                            <span className="font-medium">{toBanglaNumber(stats.perfectDays)}</span>
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

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive flex-shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>সদস্য মুছে ফেলুন?</AlertDialogTitle>
                          <AlertDialogDescription>
                            আপনি কি নিশ্চিত যে আপনি "{member.name}" কে মুছে ফেলতে চান? 
                            এই সদস্যের সমস্ত উপস্থিতি তথ্যও মুছে যাবে।
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>বাতিল</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeMember(member.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            মুছে ফেলুন
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
    </div>
  );
}
