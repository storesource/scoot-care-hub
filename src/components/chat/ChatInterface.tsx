import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/contexts/NewChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage } from './ChatMessage';
import { FileUpload } from './FileUpload';
import { Send, Paperclip, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ChatInterface: React.FC = () => {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const { currentSession, sendMessage } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.chat_blob]);

  const handleSendMessage = () => {
    if (!message.trim() && attachedFiles.length === 0) return;
    
    sendMessage(message, attachedFiles[0]); // Send first file only
    setMessage('');
    setAttachedFiles([]);
    setShowFileUpload(false);
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full">

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Support Chat</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 px-6 pb-4">
              <div className="space-y-4">
                {currentSession?.chat_blob.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* File Upload Area */}
            {showFileUpload && (
              <div className="px-6 py-4 border-t">
                <input type="file" onChange={(e) => e.target.files && setAttachedFiles([e.target.files[0]])} />
              </div>
            )}

            {/* Message Input */}
            <div className="p-6 border-t space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[60px] pr-12 resize-none"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFileUpload(!showFileUpload)}
                    className="absolute right-2 top-2 h-8 w-8 p-0"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim() && attachedFiles.length === 0}
                  className="h-[60px] px-6"
                  variant="electric"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {attachedFiles.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {attachedFiles.length} file(s) attached
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};