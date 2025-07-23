import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage } from './ChatMessage';
import { FileUpload } from './FileUpload';
import { FileAttachment } from '@/contexts/ChatContext';
import { Send, Paperclip, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ChatInterface: React.FC = () => {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const { currentSession, sendMessage, chatHistory } = useChat();
  const { phoneNumber } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const handleSendMessage = () => {
    if (!message.trim() && attachedFiles.length === 0) return;
    
    sendMessage(message, attachedFiles);
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

  const userChatHistory = chatHistory.filter(session => session.phoneNumber === phoneNumber);

  return (
    <div className="flex h-full">
      {/* Chat History Sidebar */}
      {userChatHistory.length > 1 && (
        <div className="w-80 border-r bg-muted/20 p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Previous Conversations
          </h3>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {userChatHistory.map((session) => (
                <Card key={session.id} className="p-3 cursor-pointer hover:bg-muted/50">
                  <div className="text-sm">
                    <p className="font-medium">{session.createdAt.toLocaleDateString()}</p>
                    <p className="text-muted-foreground truncate">
                      {session.messages[session.messages.length - 1]?.content.substring(0, 50)}...
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        session.status === 'escalated' ? 'bg-orange-100 text-orange-800' :
                        session.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {session.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {session.messages.length} messages
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

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
                {currentSession?.messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    sessionId={currentSession.id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* File Upload Area */}
            {showFileUpload && (
              <div className="px-6 py-4 border-t">
                <FileUpload onFilesAdded={setAttachedFiles} />
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