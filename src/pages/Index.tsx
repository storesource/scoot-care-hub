import Header from "@/components/Header";
import Hero from "@/components/Hero";
import QuickActions from "@/components/QuickActions";
import FAQSection from "@/components/FAQSection";
import StatusBar from "@/components/StatusBar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <QuickActions />
      <FAQSection />
      <StatusBar />
    </div>
  );
};

export default Index;
