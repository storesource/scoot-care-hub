import React, { createContext, useContext, useState } from 'react';

export interface QAPair {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface AdminContextType {
  isAdminAuthenticated: boolean;
  qaPairs: QAPair[];
  addQAPair: (qa: Omit<QAPair, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateQAPair: (id: string, qa: Partial<QAPair>) => void;
  deleteQAPair: (id: string) => void;
  loginAdmin: (username: string, password: string) => boolean;
  logoutAdmin: () => void;
  getBotResponse: (userMessage: string) => string;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [qaPairs, setQAPairs] = useState<QAPair[]>([
    {
      id: '1',
      question: 'Battery not charging',
      answer: "Battery issues can often be resolved by checking the charging port for debris and ensuring you're using the original charger. If the battery won't hold a charge, it may need replacement. Would you like me to schedule a battery diagnostic?",
      keywords: ['battery', 'charge', 'charging', 'power'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      question: 'Scooter running slow',
      answer: "Speed issues can be caused by low battery, tire pressure, or software settings. Try checking your riding mode settings and ensure your tires are properly inflated. Is your scooter in eco mode?",
      keywords: ['speed', 'slow', 'performance', 'mode'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      question: 'Brakes not working properly',
      answer: "Brake issues require immediate attention for safety. Check if the brake pads are worn or if there's debris in the brake mechanism. Please stop using the scooter immediately and contact our emergency support line at 1-800-SCOOT-911.",
      keywords: ['brake', 'brakes', 'stopping', 'safety'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const loginAdmin = (username: string, password: string): boolean => {
    // Simple admin credentials (in production, this would be properly secured)
    if (username === 'admin' && password === 'scootcare2024') {
      setIsAdminAuthenticated(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
  };

  const addQAPair = (qa: Omit<QAPair, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newQA: QAPair = {
      ...qa,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setQAPairs(prev => [...prev, newQA]);
  };

  const updateQAPair = (id: string, updates: Partial<QAPair>) => {
    setQAPairs(prev => prev.map(qa => 
      qa.id === id 
        ? { ...qa, ...updates, updatedAt: new Date() }
        : qa
    ));
  };

  const deleteQAPair = (id: string) => {
    setQAPairs(prev => prev.filter(qa => qa.id !== id));
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Find matching Q&A pair based on keywords
    const matchingQA = qaPairs.find(qa => 
      qa.keywords.some(keyword => message.includes(keyword.toLowerCase()))
    );
    
    if (matchingQA) {
      return matchingQA.answer;
    }
    
    // Default response
    return "I understand you're having an issue with your scooter. Could you provide more details about the specific problem? You can also try restarting your scooter or checking our FAQ section for common solutions.";
  };

  return (
    <AdminContext.Provider value={{
      isAdminAuthenticated,
      qaPairs,
      addQAPair,
      updateQAPair,
      deleteQAPair,
      loginAdmin,
      logoutAdmin,
      getBotResponse
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};