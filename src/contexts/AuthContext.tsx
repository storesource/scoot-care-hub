import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  currentStep: 'phone' | 'otp' | 'authenticated';
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
  setCurrentStep: (step: 'phone' | 'otp' | 'authenticated') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentStep, setCurrentStep] = useState<'phone' | 'otp' | 'authenticated'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSetCurrentStep = (step: 'phone' | 'otp' | 'authenticated') => {
    setCurrentStep(step);
    if (step === 'authenticated') {
      setIsAuthenticated(true);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentStep('phone');
    setPhoneNumber('');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      currentStep,
      phoneNumber,
      setPhoneNumber,
      setCurrentStep: handleSetCurrentStep,
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