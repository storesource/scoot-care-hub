import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Package, FileText, Sparkles, HeadphonesIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomerDashboard = () => {
  const quickActions = [
    {
      icon: MessageCircle,
      title: "Ask a Question",
      description: "Get instant answers to your questions",
      color: "bg-blue-500",
      href: "/chat"
    },
    {
      icon: Package,
      title: "Track Order",
      description: "Check your order status and delivery",
      color: "bg-green-500",
      href: "/orders"
    },
    {
      icon: HeadphonesIcon,
      title: "Get Support",
      description: "Contact our support team",
      color: "bg-purple-500",
      href: "/support"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-electric rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                ScootCare
              </h1>
              <p className="text-muted-foreground">Your electric scooter support companion</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.href}>
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200 bg-white/70 backdrop-blur-sm"
                >
                  <CardHeader className="text-center pb-2">
                    <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Featured Chat */}
        <div>
          <Card className="bg-gradient-to-r from-blue-500 to-green-500 text-white border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8" />
                <div>
                  <CardTitle className="text-2xl">AI-Powered Support Chat</CardTitle>
                  <CardDescription className="text-blue-100">
                    Get instant help with our intelligent chatbot
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm">
                    Our AI assistant can help you with:
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Order tracking and delivery status</li>
                    <li>• Technical support and troubleshooting</li>
                    <li>• Product information and recommendations</li>
                  </ul>
                </div>
                <Link to="/chat">
                  <Button 
                    className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-6 py-2 whitespace-nowrap"
                  >
                    Start Chatting
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent orders</p>
                <p className="text-sm">Your order history will appear here</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                Support Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active support tickets</p>
                <p className="text-sm">Start a chat to get help</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};