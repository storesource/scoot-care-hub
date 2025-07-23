import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'bot';
  created_at: string;
  file_url?: string;
  escalated?: boolean;
}

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (content: string, file?: File) => Promise<void>;
  escalateMessage: (messageId: string) => Promise<void>;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load messages when user is authenticated
  useEffect(() => {
    if (user) {
      loadMessages();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('chat-messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const newMessage = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMessage.id,
            message: newMessage.message,
            sender: newMessage.sender,
            created_at: newMessage.created_at,
            file_url: newMessage.file_url,
            escalated: newMessage.escalated
          }]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data.map(msg => ({
        id: msg.id,
        message: msg.message,
        sender: msg.sender as 'user' | 'bot',
        created_at: msg.created_at,
        file_url: msg.file_url,
        escalated: msg.escalated
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
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

  const findFAQAnswer = async (userMessage: string): Promise<string | null> => {
    try {
      const { data: faqs, error } = await supabase
        .from('faqs')
        .select('question, answer')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Simple keyword matching - find FAQ with most keyword matches
      const userWords = userMessage.toLowerCase().split(' ');
      let bestMatch = null;
      let bestScore = 0;

      for (const faq of faqs) {
        const questionWords = faq.question.toLowerCase().split(' ');
        const matches = userWords.filter(word => 
          questionWords.some(qWord => qWord.includes(word) || word.includes(qWord))
        );
        
        if (matches.length > bestScore && matches.length > 0) {
          bestScore = matches.length;
          bestMatch = faq.answer;
        }
      }

      return bestMatch;
    } catch (error) {
      console.error('Error finding FAQ answer:', error);
      return null;
    }
  };

  const sendMessage = async (content: string, file?: File) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      let fileUrl = null;
      if (file) {
        fileUrl = await uploadFile(file);
      }

      // Insert user message
      const { error: userMessageError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          message: content,
          sender: 'user',
          file_url: fileUrl,
          escalated: false
        });

      if (userMessageError) throw userMessageError;

      // Find FAQ answer
      const faqAnswer = await findFAQAnswer(content);
      
      if (faqAnswer) {
        // Insert bot response
        const { error: botMessageError } = await supabase
          .from('chat_messages')
          .insert({
            user_id: user.id,
            message: faqAnswer,
            sender: 'bot',
            escalated: false
          });

        if (botMessageError) throw botMessageError;
      } else {
        // Insert default bot response
        const { error: botMessageError } = await supabase
          .from('chat_messages')
          .insert({
            user_id: user.id,
            message: "I understand your question, but I don't have a specific answer for that. Would you like to submit this to our support team?",
            sender: 'bot',
            escalated: false
          });

        if (botMessageError) throw botMessageError;
      }
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

  const escalateMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ escalated: true })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, escalated: true } : msg
      ));

      toast({
        title: "Submitted to Support",
        description: "Your query has been submitted to our support team. We'll get back to you soon.",
      });
    } catch (error) {
      console.error('Error escalating message:', error);
      toast({
        title: "Error",
        description: "Failed to submit to support. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <ChatContext.Provider value={{
      messages,
      sendMessage,
      escalateMessage,
      isLoading
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useSupabaseChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useSupabaseChat must be used within a ChatProvider');
  }
  return context;
};