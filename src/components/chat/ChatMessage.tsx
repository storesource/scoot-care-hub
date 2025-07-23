import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useChat } from '@/contexts/ChatContext';
import { ChatMessage as ChatMessageType } from '@/contexts/ChatContext';
import { Bot, User, AlertTriangle, FileText, Image, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessageProps {
  message: ChatMessageType;
  sessionId: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, sessionId }) => {
  const { escalateToHuman } = useChat();
  const { toast } = useToast();

  const handleEscalate = () => {
    escalateToHuman(sessionId);
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
    <div className={`flex gap-3 ${message.isBot ? '' : 'flex-row-reverse'}`}>
      <Avatar className="w-8 h-8">
        <AvatarFallback className={message.isBot ? 'bg-primary text-primary-foreground' : 'bg-secondary'}>
          {message.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 space-y-2 ${message.isBot ? '' : 'flex flex-col items-end'}`}>
        <div
          className={`max-w-[80%] p-3 rounded-lg ${
            message.isBot
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          <p className="text-sm">{message.content}</p>
          
          {message.files && message.files.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.files.map((file) => (
                <div key={file.id} className="flex items-center gap-2 p-2 bg-background/10 rounded">
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{file.name}</p>
                    <p className="text-xs opacity-70">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{message.timestamp.toLocaleTimeString()}</span>
        </div>
        
        {message.isBot && (
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