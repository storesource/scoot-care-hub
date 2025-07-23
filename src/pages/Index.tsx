import { useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import QuickActions from "@/components/QuickActions";
import { OrdersSection } from "@/components/OrdersSection";
import FAQSection from "@/components/FAQSection";
import StatusBar from "@/components/StatusBar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { loadChatHistory } = useChat();
  const { phoneNumber } = useAuth();

  useEffect(() => {
    if (phoneNumber) {
      loadChatHistory(phoneNumber);
    }
  }, [phoneNumber, loadChatHistory]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <ChatInterface />
        </div>
        <div className="mb-8">
          <OrdersSection />
        </div>
      </div>
      <QuickActions />
      <FAQSection />
      <StatusBar />
    </div>
  );
};

export default Index;
