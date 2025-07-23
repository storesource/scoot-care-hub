import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Paperclip, Send, Bot, User, FileText, AlertTriangle } from 'lucide-react';
import { useChat } from '@/contexts/NewChatContext';
import { useDropzone } from 'react-dropzone';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: string;
    file_url?: string;
    user_id?: string;
    type?: 'message' | 'fileupload';
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { escalateToSupport, currentSession } = useChat();
  const isBot = message.role === 'assistant';
  const isCurrentUser = message.user_id === currentSession?.user_id;
  const senderLabel = isBot ? 'Support' : 'You';

  const handleEscalate = () => {
    escalateToSupport(message.content, message.file_url);
  };

  return (
    <div className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <Avatar className="w-8 h-8 bg-gradient-electric">
          <AvatarFallback className="text-white">
            <Bot className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-[80%] ${isCurrentUser ? 'order-1' : 'order-2'}`}>
        <div className="mb-1">
          <span className="text-xs text-muted-foreground font-medium">{senderLabel}</span>
        </div>
        <Card className={`p-3 ${
          isCurrentUser 
            ? 'bg-gradient-electric text-white border-0' 
            : 'bg-card border-border'
        }`}>
          {message.content && <p className="text-sm">{message.content}</p>}
          
          {message.file_url && (
            <div className={`${message.content ? 'mt-2' : ''} flex items-center gap-2 text-xs`}>
              <FileText className="w-3 h-3" />
              <div className="flex flex-col gap-1">
                <a 
                  href={message.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline hover:no-underline"
                  download
                >
                  Download file
                </a>
                <span className="opacity-70 text-xs">
                  Uploaded by {senderLabel}
                </span>
              </div>
            </div>
          )}
        </Card>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(message.timestamp).toLocaleString()}
        </p>
        
        {isBot && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEscalate}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Submit to Support
          </Button>
        )}
      </div>

      {isCurrentUser && (
        <Avatar className="w-8 h-8 bg-gradient-electric">
          <AvatarFallback className="text-white">
            <User className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export const SupabaseChatInterface: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { currentSession, sendMessage, isLoading } = useChat();
  const messages = currentSession?.chat_blob || [];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles: 1,
    maxSize: 1 * 1024 * 1024, // 1MB
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setAttachedFile(acceptedFiles[0]);
      }
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !attachedFile) return;
    
    await sendMessage(inputMessage, attachedFile || undefined);
    setInputMessage('');
    setAttachedFile(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Welcome to ScootCare Support!</h3>
              <p>How can I help you today? Ask me about your scooter, orders, or any issues you're experiencing.</p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* File drop zone */}
      {isDragActive && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Paperclip className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-primary font-medium">Drop file here to attach</p>
          </div>
        </div>
      )}

      {/* Attached file preview */}
      {attachedFile && (
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
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="min-h-[44px] max-h-32 resize-none pr-12"
              disabled={isLoading}
            />
            <div {...getRootProps()} className="absolute right-2 top-2">
              <input {...getInputProps()} />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                type="button"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={(!inputMessage.trim() && !attachedFile) || isLoading}
            className="h-11"
            variant="electric"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};