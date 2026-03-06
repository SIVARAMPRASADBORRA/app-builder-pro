import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plane, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const truncatedEmail = user?.email
    ? user.email.length > 20
      ? user.email.slice(0, 20) + "…"
      : user.email
    : "";

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Plane className="h-6 w-6 text-primary" />
          <span>TripAI</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            My Trips
          </Link>
          <Link to="/create-trip" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            New Trip
          </Link>
          <span className="text-sm text-muted-foreground">{truncatedEmail}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4 space-y-3 animate-fade-in">
          <Link to="/dashboard" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>My Trips</Link>
          <Link to="/create-trip" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>New Trip</Link>
          <div className="text-xs text-muted-foreground">{truncatedEmail}</div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start">
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
