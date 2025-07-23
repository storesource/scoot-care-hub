import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isBot: boolean;
  files?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface ChatSession {
  id: string;
  phoneNumber: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'escalated' | 'resolved';
}

interface ChatContextType {
  currentSession: ChatSession | null;
  chatHistory: ChatSession[];
  sendMessage: (content: string, files?: FileAttachment[]) => void;
  escalateToHuman: (sessionId: string) => void;
  loadChatHistory: (phoneNumber: string) => void;
  startNewSession: (phoneNumber: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);

  // Load chat history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('scootcare_chat_history');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      setChatHistory(parsed.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      })));
    }
  }, []);

  // Save chat history to localStorage
  const saveChatHistory = (history: ChatSession[]) => {
    localStorage.setItem('scootcare_chat_history', JSON.stringify(history));
    setChatHistory(history);
  };

  const loadChatHistory = (phoneNumber: string) => {
    const userSessions = chatHistory.filter(session => session.phoneNumber === phoneNumber);
    // Set the most recent active session as current, or start a new one
    const activeSession = userSessions.find(session => session.status === 'active');
    if (activeSession) {
      setCurrentSession(activeSession);
    } else {
      startNewSession(phoneNumber);
    }
  };

  const startNewSession = (phoneNumber: string) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      phoneNumber,
      messages: [{
        id: Date.now().toString(),
        content: "Hello! I'm here to help you with your ScootCare needs. How can I assist you today?",
        timestamp: new Date(),
        isBot: true
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };
    setCurrentSession(newSession);
    const updatedHistory = [...chatHistory, newSession];
    saveChatHistory(updatedHistory);
  };

  const sendMessage = (content: string, files?: FileAttachment[]) => {
    if (!currentSession) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isBot: false,
      files
    };

    // Simulate bot response
    const botMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: generateBotResponse(content),
      timestamp: new Date(Date.now() + 1000),
      isBot: true
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage, botMessage],
      updatedAt: new Date()
    };

    setCurrentSession(updatedSession);
    
    const updatedHistory = chatHistory.map(session => 
      session.id === currentSession.id ? updatedSession : session
    );
    saveChatHistory(updatedHistory);
  };

  const escalateToHuman = (sessionId: string) => {
    const session = chatHistory.find(s => s.id === sessionId);
    if (!session) return;

    const escalationMessage: ChatMessage = {
      id: Date.now().toString(),
      content: "Your conversation has been escalated to our human support team. Someone will contact you within 24 hours.",
      timestamp: new Date(),
      isBot: true
    };

    const updatedSession = {
      ...session,
      messages: [...session.messages, escalationMessage],
      status: 'escalated' as const,
      updatedAt: new Date()
    };

    setCurrentSession(updatedSession);
    
    const updatedHistory = chatHistory.map(s => 
      s.id === sessionId ? updatedSession : s
    );
    saveChatHistory(updatedHistory);

    // In a real app, this would also send the conversation to your support system
    console.log('Escalated conversation:', updatedSession);
  };

  return (
    <ChatContext.Provider value={{
      currentSession,
      chatHistory,
      sendMessage,
      escalateToHuman,
      loadChatHistory,
      startNewSession
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Simple bot response generator
const generateBotResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();
  
  if (message.includes('battery') || message.includes('charge')) {
    return "Battery issues can often be resolved by checking the charging port for debris and ensuring you're using the original charger. If the battery won't hold a charge, it may need replacement. Would you like me to schedule a battery diagnostic?";
  }
  
  if (message.includes('speed') || message.includes('slow')) {
    return "Speed issues can be caused by low battery, tire pressure, or software settings. Try checking your riding mode settings and ensure your tires are properly inflated. Is your scooter in eco mode?";
  }
  
  if (message.includes('brake') || message.includes('stop')) {
    return "Brake issues should be addressed immediately for safety. Check if the brake lever feels loose or if there are any unusual sounds. I recommend scheduling an immediate inspection with our service team.";
  }
  
  if (message.includes('unlock') || message.includes('app')) {
    return "App connectivity issues can usually be resolved by checking your Bluetooth connection and ensuring the app is updated. Try restarting both your phone and scooter. Are you getting any specific error messages?";
  }
  
  return "I understand your concern. Let me help you with that. Can you provide more details about the specific issue you're experiencing with your scooter?";
};