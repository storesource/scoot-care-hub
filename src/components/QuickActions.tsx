import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  FileText, 
  AlertTriangle, 
  Settings 
} from "lucide-react";

const QuickActions = () => {
  const actions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help",
      variant: "electric" as const,
      urgent: false
    },
    {
      icon: AlertTriangle,
      title: "Emergency",
      description: "Urgent assistance",
      variant: "urgent" as const,
      urgent: true
    },
    {
      icon: FileText,
      title: "My Tickets",
      description: "Track support requests",
      variant: "default" as const,
      urgent: false
    },
    {
      icon: Phone,
      title: "Call Support",
      description: "Speak to an expert",
      variant: "secondary" as const,
      urgent: false
    },
    {
      icon: Mail,
      title: "Email Us",
      description: "Send a message",
      variant: "outline" as const,
      urgent: false
    },
    {
      icon: Settings,
      title: "Register Product",
      description: "Activate warranty",
      variant: "ghost" as const,
      urgent: false
    }
  ];

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6 text-center">How can we help you?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Card 
              key={index} 
              className={`group cursor-pointer hover:shadow-card transition-all duration-200 transform hover:scale-105 ${
                action.urgent ? 'animate-float' : ''
              }`}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  action.urgent 
                    ? 'bg-energy-orange/10 text-energy-orange' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                <Button 
                  variant={action.variant} 
                  size="sm" 
                  className="w-full"
                >
                  {action.urgent ? 'Get Help Now' : 'Access'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickActions;