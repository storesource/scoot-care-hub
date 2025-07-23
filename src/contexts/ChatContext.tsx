import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAdmin } from './AdminContext';

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
  const { getBotResponse } = useAdmin();
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
      content: getBotResponse(content),
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

// This function is no longer used - responses now come from the admin-managed Q&A system