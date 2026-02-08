import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, UserPlus, Moon, CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type SignupStep = 'email' | 'otp' | 'success';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<SignupStep>('email');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
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
      const response = await supabase.functions.invoke('send-verification-code', {
        body: { email },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'কোড পাঠাতে সমস্যা হয়েছে');
      }

      setStep('otp');
    } catch (err) {
      console.error('Error sending verification code:', err);
      setError(err instanceof Error ? err.message : 'কোড পাঠাতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setResendLoading(true);

    try {
      const response = await supabase.functions.invoke('send-verification-code', {
        body: { email },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'কোড পাঠাতে সমস্যা হয়েছে');
      }

      setOtp('');
    } catch (err) {
      console.error('Error resending verification code:', err);
      setError(err instanceof Error ? err.message : 'কোড পাঠাতে সমস্যা হয়েছে');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (otp.length !== 6) {
      setError('অনুগ্রহ করে সম্পূর্ণ কোড দিন');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await supabase.functions.invoke('verify-code', {
        body: { email, code: otp, password },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'কোড যাচাই করতে সমস্যা হয়েছে');
      }

      setStep('success');
    } catch (err) {
      console.error('Error verifying code:', err);
      setError(err instanceof Error ? err.message : 'কোড যাচাই করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl text-primary">অ্যাকাউন্ট তৈরি সফল!</CardTitle>
            <CardDescription>
              আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।
              <br />
              এখন লগইন করে অ্যাপ ব্যবহার শুরু করুন।
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => navigate('/login')}
            >
              লগইন করুন
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">কোড যাচাই করুন</CardTitle>
            <CardDescription>
              আপনার ইমেইলে ({email}) একটি ৬ সংখ্যার কোড পাঠানো হয়েছে।
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                disabled={loading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              কোড পাননি?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendLoading}
                className="text-primary hover:underline font-medium disabled:opacity-50"
              >
                {resendLoading ? 'পাঠানো হচ্ছে...' : 'আবার পাঠান'}
              </button>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              className="w-full" 
              onClick={handleVerifyCode}
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  যাচাই হচ্ছে...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  যাচাই করুন
                </>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => {
                setStep('email');
                setOtp('');
                setError(null);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              পিছনে যান
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
        
        <form onSubmit={handleSendCode}>
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
                  কোড পাঠানো হচ্ছে...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  কোড পাঠান
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
