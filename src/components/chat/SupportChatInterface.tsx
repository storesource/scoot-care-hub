import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Send, Bot, User, FileText, ArrowLeft } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  file_url?: string;
  [key: string]: any; // Allow additional properties for Supabase Json compatibility
}

interface SupportChatInterfaceProps {
  sessionId: string;
  ticketStatus: string;
  ticketSummary: string;
  onBack: () => void;
}

const ChatMessageComponent: React.FC<{ message: ChatMessage; isReadOnly: boolean }> = ({ message, isReadOnly }) => {
  const isBot = message.role === 'assistant';

  return (
    <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <Avatar className="w-8 h-8 bg-gradient-electric">
          <AvatarFallback className="text-white">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[80%] ${isBot ? 'order-2' : 'order-1'}`}>
        <Card className={`p-3 ${
          isBot 
            ? 'bg-card border-border' 
            : 'bg-gradient-electric text-white border-0'
        }`}>
          <p className="text-sm">{message.content}</p>
          
          {message.file_url && (
            <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
              <FileText className="w-3 h-3" />
              <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="underline">
                View attachment
              </a>
            </div>
          )}
        </Card>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(message.timestamp).toLocaleString()}
        </p>
      </div>

      {!isBot && (
        <Avatar className="w-8 h-8 bg-gradient-electric">
          <AvatarFallback className="text-white">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export const SupportChatInterface: React.FC<SupportChatInterfaceProps> = ({ 
  sessionId, 
  ticketStatus, 
  ticketSummary, 
  onBack 
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const isReadOnly = ticketStatus === 'resolved';

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0 && !isReadOnly) {
        setAttachedFile(acceptedFiles[0]);
      }
    },
    disabled: isReadOnly
  });

  useEffect(() => {
    fetchMessages();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.new && payload.new.chat_blob && Array.isArray(payload.new.chat_blob)) {
            setMessages(payload.new.chat_blob as ChatMessage[]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('chat_blob')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      
      setMessages((data?.chat_blob as ChatMessage[]) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  const sendMessage = async () => {
    if ((!inputMessage.trim() && !attachedFile) || !user || isReadOnly) return;
    
    setSending(true);
    
    try {
      let fileUrl = null;
      if (attachedFile) {
        fileUrl = await uploadFile(attachedFile);
      }

      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        content: inputMessage,
        role: 'user',
        timestamp: new Date().toISOString(),
        file_url: fileUrl || undefined
      };

      const updatedMessages = [...messages, newMessage];
      
      const { error } = await supabase
        .from('chat_sessions')
        .update({ chat_blob: updatedMessages as any })
        .eq('id', sessionId);

      if (error) throw error;

      setMessages(updatedMessages);
      setInputMessage('');
      setAttachedFile(null);
      
      toast({
        title: "Message sent",
        description: "Your message has been added to the support ticket"
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isReadOnly) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-muted rounded w-1/2"></div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h2 className="font-semibold text-lg">{ticketSummary}</h2>
              <div className="flex items-center gap-2">
                <Badge variant={ticketStatus === 'open' ? 'destructive' : 'default'}>
                  {ticketStatus}
                </Badge>
                {isReadOnly && (
                  <span className="text-sm text-muted-foreground">Read-only</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Support Ticket Chat</h3>
              <p>This is your support ticket conversation. {isReadOnly ? 'This ticket has been resolved.' : 'Add messages to continue the conversation.'}</p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessageComponent key={message.id} message={message} isReadOnly={isReadOnly} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* File drop zone */}
      {isDragActive && !isReadOnly && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Paperclip className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-primary font-medium">Drop file here to attach</p>
          </div>
        </div>
      )}

      {/* Attached file preview */}
      {attachedFile && !isReadOnly && (
        <div className="p-4 border-t bg-muted/50">
          <div className="flex items-center justify-between bg-background rounded-lg p-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm truncate">{attachedFile.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAttachedFile(null)}
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Input area */}
      {!isReadOnly && (
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="min-h-[44px] max-h-32 resize-none pr-12"
                disabled={sending}
              />
              <div {...getRootProps()} className="absolute right-2 top-2">
                <input {...getInputProps()} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  type="button"
                  disabled={sending}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              onClick={sendMessage}
              disabled={(!inputMessage.trim() && !attachedFile) || sending}
              className="h-11"
              variant="electric"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};