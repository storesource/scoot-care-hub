import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Send, Upload, MessageCircle, Package, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StarterQuestion {
  id: string;
  question: string;
  order_hint: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  file_url?: string;
  escalated: boolean;
  created_at: string;
}

interface Order {
  id: string;
  model: string;
  status: string;
  expected_delivery_date?: string;
}

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const [starterQuestions, setStarterQuestions] = useState<StarterQuestion[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStarterQuestions();
    fetchChatHistory();
    fetchOrders();
  }, [user]);

  const fetchStarterQuestions = async () => {
    const { data, error } = await supabase
      .from('starter_questions')
      .select('*')
      .order('order_hint');
    
    if (!error) {
      setStarterQuestions(data || []);
    }
  };

  const fetchChatHistory = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at');
    
    if (!error) {
      setChatMessages(data || []);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (!error) {
      setOrders(data || []);
    }
  };

  const findKnowledgebaseAnswer = async (question: string) => {
    const { data, error } = await supabase
      .from('chat_knowledgebase')
      .select('*');
    
    if (error || !data) return null;
    
    // Simple keyword matching
    const normalizedQuestion = question.toLowerCase();
    const match = data.find(entry => 
      normalizedQuestion.includes(entry.question.toLowerCase()) ||
      entry.question.toLowerCase().includes(normalizedQuestion)
    );
    
    return match?.answer || null;
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !user) return;
    
    setIsLoading(true);
    
    try {
      // Save user message
      const { error: userError } = await supabase
        .from('chat_messages')
        .insert([{
          user_id: user.id,
          sender: 'user',
          message: messageText,
          escalated: false
        }]);
      
      if (userError) throw userError;
      
      // Find and send bot response
      const answer = await findKnowledgebaseAnswer(messageText);
      
      if (answer) {
        const { error: botError } = await supabase
          .from('chat_messages')
          .insert([{
            user_id: user.id,
            sender: 'bot',
            message: answer,
            escalated: false
          }]);
        
        if (botError) throw botError;
      } else {
        // Send default response
        const { error: botError } = await supabase
          .from('chat_messages')
          .insert([{
            user_id: user.id,
            sender: 'bot',
            message: "I'm sorry, I don't have information about that. Would you like to escalate this to support?",
            escalated: false
          }]);
        
        if (botError) throw botError;
      }
      
      setCurrentMessage("");
      fetchChatHistory();
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const escalateMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({ escalated: true })
      .eq('id', messageId);
    
    if (error) {
      toast({ title: "Error", description: "Failed to escalate message", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Message escalated to support" });
      fetchChatHistory();
    }
  };

  const handleStarterQuestion = (question: string) => {
    setCurrentMessage(question);
    sendMessage(question);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'in_transit': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute inset-0 bg-gradient-electric opacity-5 rounded-2xl"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-electric rounded-xl flex items-center justify-center shadow-lg animate-pulse-glow">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-electric bg-clip-text text-transparent">
                  ScootCare
                </h1>
                <p className="text-sm text-muted-foreground animate-float">
                  How can we help you today?
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat Section */}
        <Card className="p-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            Live Chat Support
          </h2>
          
          {/* Starter Questions */}
          {starterQuestions.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-100">
              <p className="text-sm font-medium text-teal-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                Quick questions to get you started:
              </p>
              <div className="flex flex-wrap gap-2">
                {starterQuestions.map((sq, index) => (
                  <Button
                    key={sq.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleStarterQuestion(sq.question)}
                    className="text-xs border-teal-200 hover:bg-teal-100 hover:border-teal-300 transition-all duration-200 hover:scale-105 hover:shadow-md"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {sq.question}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Chat Messages */}
          <div className="h-80 overflow-y-auto mb-4 space-y-3 p-4 border border-gray-100 rounded-xl bg-gradient-to-b from-gray-50/50 to-white/50">
            {chatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-gradient-to-r from-teal-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <MessageCircle className="h-8 w-8 text-teal-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Start a conversation</p>
                    <p className="text-xs text-gray-400 mt-1">Ask a question or try one of the quick options above</p>
                  </div>
                </div>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom duration-300`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white' 
                      : 'bg-white border border-gray-200 shadow-md'
                  }`}>
                    <p className="text-sm">{msg.message}</p>
                    {msg.sender === 'bot' && !msg.escalated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => escalateMessage(msg.id)}
                        className="mt-2 text-xs p-1 h-auto text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Helpful? Submit to Support
                      </Button>
                    )}
                    {msg.escalated && (
                      <Badge variant="secondary" className="mt-1 text-xs bg-orange-100 text-orange-700">Escalated</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Chat Input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(currentMessage))}
              className="flex-1 resize-none"
              rows={2}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => sendMessage(currentMessage)}
                disabled={!currentMessage.trim() || isLoading}
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
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
                className="border-teal-200 hover:bg-teal-50 hover:border-teal-300"
              >
                <Upload className="h-4 w-4 text-teal-600" />
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Orders Section */}
        <Card className="p-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-white" />
            </div>
            My Orders
          </h2>
          
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders found</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="p-4 bg-secondary/30 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{order.model}</h3>
                      <p className="text-sm text-muted-foreground">Order ID: {order.id.slice(0, 8)}...</p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  {order.expected_delivery_date && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Expected delivery: {new Date(order.expected_delivery_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};