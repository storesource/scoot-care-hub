import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Upload, MessageCircle, AlertTriangle, Bot, User, FileText, Plus } from 'lucide-react';
import { useChat } from '@/contexts/NewChatContext';
import { useToast } from '@/hooks/use-toast';

export const NewChatInterface = () => {
  const { currentSession, knowledgebase, sendMessage, escalateToSupport, isLoading, startNewSession, loadLastSession } = useChat();
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) return;
    
    try {
      await sendMessage(message, selectedFile || undefined);
      setMessage('');
      setSelectedFile(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleQuickQuestion = async (question: string) => {
    setMessage(question);
    await sendMessage(question);
    setMessage(''); // Clear input after sending
  };

  const handleEscalate = async (messageContent: string) => {
    try {
      await escalateToSupport(messageContent);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to escalate to support",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Filter knowledgebase for starter questions - show all QnA entries
  const starterQuestions = knowledgebase.filter(entry => entry.type === 'qna');
  
  // Add "Where is my order?" as a quick question
  const quickQuestions = [
    ...starterQuestions,
    {
      id: 'order-status',
      question: 'Where is my order?',
      type: 'function' as const,
      resolution: '',
      metadata: { function: 'order_tracking' }
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              ScootCare Support Chat
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={startNewSession}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Starter Questions */}
          {quickQuestions.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-700 mb-3">
                Quick questions to get you started:
              </p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question) => (
                  <Button
                    key={question.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickQuestion(question.question)}
                    className="text-xs border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                  >
                    {question.question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50/50 p-4 space-y-3">
            {!currentSession || currentSession.chat_blob.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <MessageCircle className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Start a conversation</p>
                    <p className="text-xs text-gray-400 mt-1">Ask a question or try one of the quick options above</p>
                  </div>
                </div>
              </div>
            ) : (
              currentSession.chat_blob.map((msg) => {
                const isCurrentUser = msg.user_id === currentSession.user_id;
                const isBot = msg.sender === 'bot';
                const senderLabel = isBot ? 'Support' : 'You';
                
                return (
                  <div key={msg.id} className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
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
                        {msg.content && <p className="text-sm">{msg.content}</p>}
                        
                        {msg.file_url && (
                          <div className={`${msg.content ? 'mt-2' : ''} flex items-center gap-2 text-xs`}>
                            <FileText className="w-3 h-3" />
                            <div className="flex flex-col gap-1">
                              <a 
                                href={msg.file_url} 
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
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
                    </div>

                    {isCurrentUser && (
                      <Avatar className="w-8 h-8 bg-gradient-electric">
                        <AvatarFallback className="text-white">
                          <User className="w-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    {isBot && (
                      <div className="flex gap-1 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEscalate(msg.content)}
                          className="text-xs h-auto p-1 text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                        >
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Not Helpful?
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input */}
          <div className="space-y-3">
            {selectedFile && (
              <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                <span className="text-sm text-gray-600">Selected: {selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 resize-none"
                rows={2}
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSendMessage}
                  disabled={(!message.trim() && !selectedFile) || isLoading}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="border-blue-200 hover:bg-blue-50"
                >
                  <Upload className="h-4 w-4 text-blue-600" />
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};