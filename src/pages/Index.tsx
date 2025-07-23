import Header from "@/components/Header";
import Hero from "@/components/Hero";
import QuickActions from "@/components/QuickActions";
import FAQSection from "@/components/FAQSection";
import StatusBar from "@/components/StatusBar";
import { SupabaseChatInterface } from "@/components/chat/SupabaseChatInterface";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <SupabaseChatInterface />
        </div>
      </div>
      <QuickActions />
      <FAQSection />
      <StatusBar />
    </div>
  );
};

export default Index;
