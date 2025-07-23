import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useChat } from '@/contexts/NewChatContext';
import { ChatMessage as ChatMessageType } from '@/contexts/NewChatContext';
import { Bot, User, AlertTriangle, FileText, Image, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { escalateToSupport } = useChat();
  const { toast } = useToast();

  const handleEscalate = () => {
    escalateToSupport("Need human support", message.file_url);
    toast({
      title: "Escalated to Human Support", 
      description: "Your conversation has been forwarded to our support team.",
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (fileType === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`flex gap-3 ${message.sender === 'bot' ? '' : 'flex-row-reverse'}`}>
      <Avatar className="w-8 h-8">
        <AvatarFallback className={message.sender === 'bot' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
          {message.sender === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 space-y-2 ${message.sender === 'bot' ? '' : 'flex flex-col items-end'}`}>
        <div
          className={`max-w-[80%] p-3 rounded-lg ${
            message.sender === 'bot'
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          <p className="text-sm">{message.content}</p>
          
          {message.file_url && (
            <div className="mt-2">
              <div className="flex items-center gap-2 p-2 bg-background/10 rounded">
                <FileText className="w-4 h-4" />
                <div className="flex-1 min-w-0">
                  <a 
                    href={message.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs font-medium underline hover:no-underline"
                  >
                    View attachment
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>
        
        {message.sender === 'bot' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEscalate}
            className="mt-2 text-xs h-7"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Not satisfied? Submit to human support
          </Button>
        )}
      </div>
    </div>
  );
};