import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Moon, CheckCircle2 } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড মিলছে না');
      return;
    }

    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        if (error.message.includes('already registered')) {
          setError('এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট তৈরি করা হয়েছে');
        } else {
          setError(error.message);
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('সাইন আপ করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl text-primary">সাইন আপ সফল!</CardTitle>
            <CardDescription>
              আপনার ইমেইলে একটি ভেরিফিকেশন লিংক পাঠানো হয়েছে।
              <br />
              অনুগ্রহ করে ইমেইল চেক করুন এবং লিংকে ক্লিক করে ভেরিফাই করুন।
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate('/login')}
            >
              লগইন পেজে যান
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Moon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">নতুন অ্যাকাউন্ট তৈরি করুন</CardTitle>
          <CardDescription>নামাজ ক্যাম্পেইনে যোগ দিন</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input
                id="password"
                type="password"
                placeholder="কমপক্ষে ৬ অক্ষর"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="পাসওয়ার্ড আবার লিখুন"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  অ্যাকাউন্ট তৈরি হচ্ছে...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  সাইন আপ করুন
                </>
              )}
            </Button>
            
            <p className="text-sm text-center text-muted-foreground">
              আগে থেকেই অ্যাকাউন্ট আছে?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                লগইন করুন
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
