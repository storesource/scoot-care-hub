import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

const StatusBar = () => {
  const systemStatus = [
    {
      service: "Support Chat",
      status: "operational",
      icon: CheckCircle,
      color: "text-electric-green",
      bgColor: "bg-electric-green/10"
    },
    {
      service: "Phone Support",
      status: "operational",
      icon: CheckCircle,
      color: "text-electric-green",
      bgColor: "bg-electric-green/10"
    },
    {
      service: "Mobile App",
      status: "maintenance",
      icon: Clock,
      color: "text-energy-orange",
      bgColor: "bg-energy-orange/10"
    },
    {
      service: "Website",
      status: "operational",
      icon: CheckCircle,
      color: "text-electric-green",
      bgColor: "bg-electric-green/10"
    }
  ];

  return (
    <section className="py-6 border-t">
      <div className="container mx-auto px-4">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">System Status</h3>
              <Badge variant="secondary" className="bg-electric-green/10 text-electric-green">
                All Systems Operational
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {systemStatus.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${item.bgColor}`}>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.service}</p>
                    <p className={`text-xs capitalize ${item.color}`}>{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default StatusBar;