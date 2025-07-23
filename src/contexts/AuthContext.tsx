import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  currentStep: 'phone' | 'otp' | 'authenticated';
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  sendOTP: (phone: string) => Promise<{ error?: string }>;
  verifyOTP: (phone: string, token: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentStep, setCurrentStep] = useState<'phone' | 'otp' | 'authenticated'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setCurrentStep('authenticated');
          // Create or update user profile
          await upsertUserProfile(session.user);
        } else {
          setCurrentStep('phone');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setCurrentStep('authenticated');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const upsertUserProfile = async (user: User) => {
    try {
      console.log('Creating/updating user profile for:', user.id, user.phone);
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          phone: user.phone || phoneNumber,
          role: 'customer'
        }, { onConflict: 'id' });
      
      if (error) {
        console.error('Error upserting user profile:', error);
      } else {
        console.log('User profile created/updated successfully:', data);
      }
    } catch (error) {
      console.error('Error upserting user profile:', error);
    }
  };

  const sendOTP = async (phone: string) => {
    try {
      // Ensure phone number has proper international format for Supabase Auth
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      
      console.log('Attempting to send OTP to:', formattedPhone);
      
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms'
        }
      });
      
      console.log('OTP send result:', { data, error });
      
      if (error) {
        console.error('OTP send error:', error);
        return { error: error.message };
      }
      
      setPhoneNumber(formattedPhone);
      setCurrentStep('otp');
      return {};
    } catch (error) {
      return { error: 'Failed to send OTP' };
    }
  };

  const verifyOTP = async (phone: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: token,
        type: 'sms'
      });
      
      if (error) {
        return { error: error.message };
      }
      
      return {};
    } catch (error) {
      return { error: 'Failed to verify OTP' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setPhoneNumber('');
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAuthenticated: !!session,
      currentStep,
      phoneNumber,
      setPhoneNumber,
      sendOTP,
      verifyOTP,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};