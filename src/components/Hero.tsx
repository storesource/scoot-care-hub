import { Button } from "@/components/ui/button";
import { ArrowRight, Battery, Zap } from "lucide-react";
import heroImage from "@/assets/scooter-hero.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[50vh] bg-gradient-hero flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="ScootCare Electric Scooter" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-electric-blue animate-pulse" />
            <span className="text-sm font-medium text-primary">24/7 Support Available</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Welcome to{" "}
            <span className="bg-gradient-electric bg-clip-text text-transparent">
              ScootCare
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Your complete support center for electric scooter maintenance, troubleshooting, 
            and customer service. Get back on the road faster.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="electric" size="lg" className="group">
              Get Instant Help
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="group">
              <Battery className="h-4 w-4" />
              Check Scooter Status
            </Button>
          </div>
          
          <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-electric-green rounded-full animate-pulse"></div>
              <span>Support Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-electric-blue rounded-full animate-pulse"></div>
              <span>Average Response: 2 mins</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;