import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Send, Upload, MessageCircle, AlertTriangle, Bot, User } from 'lucide-react';
import { useChat } from '@/contexts/NewChatContext';
import { useToast } from '@/hooks/use-toast';

export const NewChatInterface = () => {
  const { currentSession, knowledgebase, sendMessage, escalateToSupport, isLoading } = useChat();
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

  const handleQuickQuestion = (question: string) => {
    setMessage(question);
    sendMessage(question);
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

  // Filter knowledgebase for starter questions
  const starterQuestions = knowledgebase.filter(entry => entry.type === 'qna').slice(0, 5);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-blue-600 flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            ScootCare Support Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Starter Questions */}
          {starterQuestions.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-700 mb-3">
                Quick questions to get you started:
              </p>
              <div className="flex flex-wrap gap-2">
                {starterQuestions.map((question) => (
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
              currentSession.chat_blob.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <div className="flex items-start gap-2 mb-2">
                      {msg.sender === 'bot' ? (
                        <Bot className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <User className="h-4 w-4 text-white flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm">{msg.content}</p>
                        {msg.fileUrl && (
                          <a 
                            href={msg.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs underline mt-1 block"
                          >
                            View attachment
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {msg.sender === 'bot' && (
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
                </div>
              ))
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
                  accept="image/*,audio/*,.pdf,.doc,.docx"
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