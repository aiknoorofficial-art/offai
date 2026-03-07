import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogOut, Zap, User as UserIcon, Menu, X } from "lucide-react";
import { TransactionModal } from "./TransactionModal";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  user: User | null;
}

export const Header = ({ user }: HeaderProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    navigate("/");
  };

  const closeMenu = () => setIsOpen(false);

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <TransactionModal />
      <Link to="/changelog" onClick={closeMenu}>
        <Button variant="ghost" size={mobile ? "default" : "sm"} className={mobile ? "w-full justify-start" : ""}>
          What's New
        </Button>
      </Link>
      {user ? (
        <>
          <Link to="/chat" onClick={closeMenu}>
            <Button variant="ghost" size={mobile ? "default" : "sm"} className={mobile ? "w-full justify-start" : ""}>
              Chat
            </Button>
          </Link>
          <Link to="/generate" onClick={closeMenu}>
            <Button variant="ghost" size={mobile ? "default" : "sm"} className={mobile ? "w-full justify-start" : ""}>
              Code
            </Button>
          </Link>
          <Link to="/video" onClick={closeMenu}>
            <Button variant="ghost" size={mobile ? "default" : "sm"} className={mobile ? "w-full justify-start" : ""}>
              Video
            </Button>
          </Link>
          <Link to="/courses" onClick={closeMenu}>
            <Button variant="ghost" size={mobile ? "default" : "sm"} className={mobile ? "w-full justify-start" : ""}>
              Courses
            </Button>
          </Link>
          {!mobile && user && <NotificationBell userId={user.id} />}
          <Link to="/profile" onClick={closeMenu}>
            <Button variant="ghost" size={mobile ? "default" : "sm"} className={mobile ? "w-full justify-start gap-2" : ""}>
              <UserIcon className="w-4 h-4" />
              {mobile && "Profile"}
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size={mobile ? "default" : "sm"} 
            onClick={handleSignOut}
            className={mobile ? "w-full justify-start" : ""}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </>
      ) : (
        <>
          <Link to="/auth" onClick={closeMenu}>
            <Button variant="ghost" size={mobile ? "default" : "sm"} className={mobile ? "w-full justify-start" : ""}>
              Sign In
            </Button>
          </Link>
          <Link to="/auth?mode=signup" onClick={closeMenu}>
            <Button variant="glow" size={mobile ? "default" : "sm"} className={mobile ? "w-full" : ""}>
              Get Started
            </Button>
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.5)] group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.7)] transition-all duration-300">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground text-glow">OFF AI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <NavLinks />
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-1 md:hidden">
          {user && <NotificationBell userId={user.id} />}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px]">
            <div className="flex flex-col gap-2 mt-8">
              <NavLinks mobile />
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </div>
    </header>
  );
};