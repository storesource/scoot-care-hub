import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Smartphone } from 'lucide-react';

interface MobileLoginForm {
  phoneNumber: string;
}

export const MobileLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setPhoneNumber, setCurrentStep } = useAuth();
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm<MobileLoginForm>();

  const onSubmit = async (data: MobileLoginForm) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setPhoneNumber(data.phoneNumber);
      setCurrentStep('otp');
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${data.phoneNumber}`,
      });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/95 backdrop-blur border-0 shadow-electric">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-electric rounded-full flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl text-foreground">Welcome to ScootCare</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your mobile number to get started
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Mobile Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                {...register('phoneNumber', {
                  required: 'Mobile number is required',
                  pattern: {
                    value: /^[\+]?[1-9][\d]{0,15}$/,
                    message: 'Please enter a valid mobile number'
                  }
                })}
                className="text-base"
              />
              {errors.phoneNumber && (
                <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              variant="electric"
              disabled={isLoading}
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};