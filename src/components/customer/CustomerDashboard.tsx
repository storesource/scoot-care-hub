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
    <div className="min-h-screen bg-background p-4" style={{ accentColor: 'hsl(173, 58%, 39%)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-electric rounded-full flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ScootCare</h1>
              <p className="text-sm text-muted-foreground -mt-1">Support Portal</p>
            </div>
          </div>
        </div>
        
        {/* Chat Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-teal-600 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat Support
          </h2>
          
          {/* Starter Questions */}
          {starterQuestions.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3">Quick questions:</p>
              <div className="flex flex-wrap gap-2">
                {starterQuestions.map((sq) => (
                  <Button
                    key={sq.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleStarterQuestion(sq.question)}
                    className="text-xs border-teal-200 hover:bg-teal-50"
                  >
                    {sq.question}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* Chat Messages */}
          <div className="h-80 overflow-y-auto mb-4 space-y-3 p-3 bg-secondary/20 rounded-lg">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender === 'user' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-white border shadow-sm'
                }`}>
                  <p className="text-sm">{msg.message}</p>
                  {msg.sender === 'bot' && !msg.escalated && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => escalateMessage(msg.id)}
                      className="mt-2 text-xs p-1 h-auto text-orange-600 hover:text-orange-800"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Not Helpful? Submit to Support
                    </Button>
                  )}
                  {msg.escalated && (
                    <Badge variant="secondary" className="mt-1 text-xs">Escalated</Badge>
                  )}
                </div>
              </div>
            ))}
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
                disabled={isLoading || !currentMessage.trim()}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Orders Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-teal-600 flex items-center gap-2">
            <Package className="h-5 w-5" />
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