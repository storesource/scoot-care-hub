import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
  fileUrl?: string;
}

interface ChatSession {
  id: string;
  user_id: string;
  started_at: string;
  chat_blob: ChatMessage[];
}

interface KnowledgebaseEntry {
  id: string;
  question: string;
  type: 'qna' | 'function';
  resolution: string;
  metadata: any;
}

interface SupportQuery {
  id: string;
  user_id: string;
  session_id: string;
  summary: string;
  file_url?: string;
  status: string;
  created_at: string;
}

interface ChatContextType {
  currentSession: ChatSession | null;
  knowledgebase: KnowledgebaseEntry[];
  sendMessage: (content: string, file?: File) => Promise<void>;
  startNewSession: () => Promise<void>;
  escalateToSupport: (summary: string, fileUrl?: string) => Promise<void>;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [knowledgebase, setKnowledgebase] = useState<KnowledgebaseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load knowledgebase on mount
  useEffect(() => {
    loadKnowledgebase();
  }, []);

  // Load or create session when user is authenticated
  useEffect(() => {
    if (user) {
      loadOrCreateSession();
    }
  }, [user]);

  const loadKnowledgebase = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledgebase')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setKnowledgebase((data || []) as KnowledgebaseEntry[]);
    } catch (error) {
      console.error('Error loading knowledgebase:', error);
    }
  };

  const loadOrCreateSession = async () => {
    if (!user) return;

    try {
      // Try to get the most recent session
      const { data: sessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(1);

      if (sessionError) throw sessionError;

      if (sessions && sessions.length > 0) {
        setCurrentSession(sessions[0]);
      } else {
        // Create a new session
        await startNewSession();
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const startNewSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          chat_blob: []
        })
        .select()
        .single();

      if (error) throw error;
      setCurrentSession(data);
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to start new chat session",
        variant: "destructive"
      });
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const findKnowledgebaseMatch = (userMessage: string): KnowledgebaseEntry | null => {
    const userWords = userMessage.toLowerCase().split(' ');
    let bestMatch = null;
    let bestScore = 0;

    for (const entry of knowledgebase) {
      const questionWords = entry.question.toLowerCase().split(' ');
      const matches = userWords.filter(word => 
        questionWords.some(qWord => qWord.includes(word) || word.includes(qWord))
      );
      
      if (matches.length > bestScore && matches.length > 0) {
        bestScore = matches.length;
        bestMatch = entry;
      }
    }

    return bestMatch;
  };

  const handleFunctionType = async (entry: KnowledgebaseEntry): Promise<string> => {
    // Handle function type knowledgebase entries
    if (entry.metadata?.function === 'order_tracking') {
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (orders && orders.length > 0) {
          const order = orders[0];
          return `Your latest order for ${order.model_name} is currently ${order.order_status}. ${order.expected_delivery_date ? `Expected delivery: ${order.expected_delivery_date}` : ''}`;
        } else {
          return "You don't have any orders on record. Would you like to place an order?";
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        return "I'm having trouble accessing your order information right now. Please try again later.";
      }
    }

    return entry.resolution;
  };

  const sendMessage = async (content: string, file?: File) => {
    if (!user || !currentSession) return;
    
    setIsLoading(true);
    
    try {
      let fileUrl = null;
      if (file) {
        fileUrl = await uploadFile(file);
      }

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content,
        sender: 'user',
        timestamp: new Date().toISOString(),
        fileUrl
      };

      // Find knowledgebase match
      const match = findKnowledgebaseMatch(content);
      let botResponse: string;

      if (match) {
        if (match.type === 'function') {
          botResponse = await handleFunctionType(match);
        } else {
          botResponse = match.resolution;
        }
      } else {
        botResponse = "I understand your question, but I don't have a specific answer for that. Would you like me to escalate this to our support team?";
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };

      const updatedChatBlob = [...currentSession.chat_blob, userMessage, botMessage];

      // Update session in database
      const { error } = await supabase
        .from('chat_sessions')
        .update({ chat_blob: updatedChatBlob })
        .eq('id', currentSession.id);

      if (error) throw error;

      // Update local state
      setCurrentSession({
        ...currentSession,
        chat_blob: updatedChatBlob
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const escalateToSupport = async (summary: string, fileUrl?: string) => {
    if (!user || !currentSession) return;

    try {
      const { error } = await supabase
        .from('support_queries')
        .insert({
          user_id: user.id,
          session_id: currentSession.id,
          summary,
          file_url: fileUrl,
          status: 'open'
        });

      if (error) throw error;

      toast({
        title: "Escalated to Support",
        description: "Your query has been submitted to our support team. We'll get back to you soon.",
      });
    } catch (error) {
      console.error('Error escalating to support:', error);
      toast({
        title: "Error",
        description: "Failed to escalate to support. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <ChatContext.Provider value={{
      currentSession,
      knowledgebase,
      sendMessage,
      startNewSession,
      escalateToSupport,
      isLoading
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