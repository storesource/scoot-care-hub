import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'customer' | 'admin' | 'bot';
  timestamp: string;
  file_url?: string;
  user_id?: string;
  type: 'message' | 'fileupload';
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
  loadLastSession: () => Promise<void>;
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
        const session = sessions[0];
        setCurrentSession({
          id: session.id,
          user_id: session.user_id,
          started_at: session.started_at,
          chat_blob: Array.isArray(session.chat_blob) ? (session.chat_blob as unknown) as ChatMessage[] : []
        });
      } else {
        // Create a new session
        await startNewSession();
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const loadLastSession = async () => {
    if (!user) return;

    try {
      // Load the most recent non-expired session
      const { data: sessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('started_at', { ascending: false })
        .limit(1);

      if (sessionError) throw sessionError;

      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        setCurrentSession({
          id: session.id,
          user_id: session.user_id,
          started_at: session.started_at,
          chat_blob: Array.isArray(session.chat_blob) ? (session.chat_blob as unknown) as ChatMessage[] : []
        });
      }
    } catch (error) {
      console.error('Error loading last session:', error);
    }
  };

  const startNewSession = async () => {
    if (!user) return;

    setCurrentSession(null);
    
    // Don't create empty session in database, just set local state
    const newSession: ChatSession = {
      id: 'temp-' + Date.now(),
      user_id: user.id,
      started_at: new Date().toISOString(),
      chat_blob: []
    };
    
    setCurrentSession(newSession);
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

  const fetchLatestOrderStatus = async (): Promise<string> => {
    if (!user?.id) {
      return "⚠️ **Authentication Required**\n\nPlease log in to view your order status.";
    }

    try {
      console.log('Fetching orders for user:', user.id);
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Database error fetching orders:', error);
        throw error;
      }

      console.log('Orders fetched:', orders);

      if (orders && orders.length > 0) {
        const order = orders[0];
        const formattedDate = order.expected_delivery_date 
          ? new Date(order.expected_delivery_date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })
          : 'not yet scheduled';
        
        const statusEmoji = {
          'processing': '⏳',
          'shipped': '🚚',
          'delivered': '✅',
          'cancelled': '❌'
        }[order.order_status.toLowerCase()] || '📦';
        
        return `${statusEmoji} **Order Status Update**\n\n` +
               `• **Product:** ${order.model_name}\n` +
               `• **Status:** ${order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}\n` +
               `• **Expected Delivery:** ${formattedDate}\n` +
               `• **Order Date:** ${new Date(order.created_at).toLocaleDateString()}\n\n` +
               `${order.order_status.toLowerCase() === 'shipped' ? 'Your order is on its way! 🎉' : 
                 order.order_status.toLowerCase() === 'delivered' ? 'Your order has been delivered! Enjoy your new scooter! 🛴' :
                 order.order_status.toLowerCase() === 'processing' ? 'We\'re preparing your order for shipment.' :
                 'Please contact support if you have any questions about your order.'}`;
      } else {
        return "📦 **No Orders Found**\n\nI don't see any orders associated with your account. Would you like to:\n\n• Browse our scooter models\n• Get help placing a new order\n• Contact support for assistance";
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      return `⚠️ **Unable to Retrieve Order Information**\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again in a few moments, or contact our support team for immediate assistance.`;
    }
  };

  const handleFunctionType = async (entry: KnowledgebaseEntry): Promise<string> => {
    // Handle function type knowledgebase entries
    if (entry.metadata?.function === 'order_tracking') {
      return await fetchLatestOrderStatus();
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
        sender: 'customer',
        timestamp: new Date().toISOString(),
        file_url: fileUrl || undefined,
        user_id: user.id,
        type: file && !content.trim() ? 'fileupload' : 'message'
      };

      let botResponse: string;
      
      // If only file was uploaded (no text message)
      if (file && !content.trim()) {
        botResponse = "Thank you for uploading the file for reference. How can I help you with this?";
      } else {
        // Find knowledgebase match
        const match = findKnowledgebaseMatch(content);

        if (match) {
          if (match.type === 'function') {
            botResponse = await handleFunctionType(match);
          } else {
            botResponse = match.resolution;
          }
        } else {
          botResponse = "I understand your question, but I don't have a specific answer for that. Would you like me to escalate this to our support team?";
        }
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        type: 'message'
      };

      const updatedMessages = [...currentSession.chat_blob, userMessage, botMessage];

      // Create or update session in database only if we have messages
      let sessionId = currentSession.id;
      if (currentSession.id.startsWith('temp-')) {
        // Create new session in database
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            chat_blob: updatedMessages as any,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        sessionId = data.id;
      } else {
        // Update existing session
        const { error } = await supabase
          .from('chat_sessions')
          .update({ chat_blob: updatedMessages as any })
          .eq('id', currentSession.id);

        if (error) throw error;
      }

      // Update local state
      setCurrentSession({
        ...currentSession,
        id: sessionId,
        chat_blob: updatedMessages
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
    if (!user || !currentSession) {
      console.error('Missing user or session for escalation:', { user: !!user, session: !!currentSession });
      return;
    }

    try {
      console.log('Escalating to support with:', { 
        user_id: user.id, 
        session_id: currentSession.id, 
        summary, 
        file_url: fileUrl 
      });

      const { data, error } = await supabase
        .from('support_queries')
        .insert({
          user_id: user.id,
          session_id: currentSession.id,
          summary,
          file_url: fileUrl,
          status: 'open'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating support query:', error);
        throw error;
      }

      console.log('Support query created successfully:', data);

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
      isLoading,
      loadLastSession
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