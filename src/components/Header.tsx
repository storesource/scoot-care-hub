import { Button } from "@/components/ui/button";
import { Menu, Search, User, Shield, Package, LogOut, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const { logout, user } = useAuth();
  const [userRole, setUserRole] = useState<string>('customer');

  useEffect(() => {
    if (user) {
      checkUserRole();
    }
  }, [user]);

  const checkUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user?.id)
        .single();
      
      if (!error && data) {
        setUserRole(data.role || 'customer');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

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
          {/* Customer Navigation */}
          <Link to="/orders">
            <Button variant="ghost" size="icon" title="My Orders">
              <Package className="h-5 w-5" />
            </Button>
          </Link>
          
          {/* Admin-only Navigation */}
          {userRole === 'admin' && (
            <Link to="/admin/faqs">
              <Button variant="ghost" size="icon" title="Admin Panel" className="text-primary">
                <Shield className="h-5 w-5" />
              </Button>
            </Link>
          )}
          
          {/* User Profile */}
          <Button variant="ghost" size="icon" title="Profile">
            <User className="h-5 w-5" />
          </Button>
          
          {/* Logout */}
          <Button variant="ghost" size="icon" onClick={logout} title="Logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;