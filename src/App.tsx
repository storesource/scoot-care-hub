import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/NewChatContext";
import { MobileLogin } from "@/components/auth/MobileLogin";
import { OTPVerification } from "@/components/auth/OTPVerification";
import Index from "./pages/Index";
import Orders from "./pages/Orders";
import Support from "./pages/Support";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { isAuthenticated, currentStep, user } = useAuth();

  if (!isAuthenticated) {
    if (currentStep === 'otp') {
      return <OTPVerification />;
    }
    return <MobileLogin />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/orders" element={<Orders />} />
        {user?.user_metadata?.role !== 'admin' && (
          <Route path="/support" element={<Support />} />
        )}
        <Route path="/chat" element={<Chat />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ChatProvider>
          <Toaster />
          <Sonner />
          <AuthenticatedApp />
        </ChatProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
