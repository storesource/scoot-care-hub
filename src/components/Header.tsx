import { Button } from "@/components/ui/button";
import { Menu, Search, User, Shield, Package, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-electric rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">ScootCare</h1>
              <p className="text-xs text-muted-foreground -mt-1">Support Portal</p>
            </div>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          <Link to="/orders">
            <Button variant="ghost" size="icon" title="My Orders">
              <Package className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/admin/faqs">
            <Button variant="ghost" size="icon" title="Admin Panel">
              <Shield className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;