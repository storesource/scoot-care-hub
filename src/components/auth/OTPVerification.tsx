import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Shield } from 'lucide-react';

export const OTPVerification = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { phoneNumber, sendOTP, verifyOTP } = useAuth();
  const { toast } = useToast();

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;
    
    setIsLoading(true);
    
    const { error } = await verifyOTP(phoneNumber, otp);
    
    if (error) {
      toast({
        title: "Invalid OTP",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success!",
        description: "You have been successfully logged in.",
      });
    }
    
    setIsLoading(false);
  };

  const handleResendOTP = async () => {
    const { error } = await sendOTP(phoneNumber);
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    } else {
      toast({
        title: "OTP Resent",
        description: `New verification code sent to ${phoneNumber}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur border-0 shadow-electric">
        <CardHeader className="text-center space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* Go back functionality can be added later */}}
            className="absolute left-4 top-4"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="mx-auto w-16 h-16 bg-gradient-electric rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl text-foreground">Verify Your Phone</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter the 6-digit code sent to {phoneNumber}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
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

          <Button 
            onClick={handleVerifyOTP}
            className="w-full" 
            variant="electric"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResendOTP}
              className="text-primary"
            >
              Resend OTP
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};