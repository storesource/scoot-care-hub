import Header from "@/components/Header";
import { NewChatInterface } from "@/components/chat/NewChatInterface";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Chat = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Ask a Question</h1>
            <p className="text-muted-foreground">Get help from our AI assistant</p>
          </div>
        </div>
        
        <NewChatInterface />
      </div>
    </div>
  );
};

export default Chat;