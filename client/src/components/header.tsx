import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Newspaper, Sun, Moon, User, Settings, Key, LogOut, ChevronDown } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ApiKeysDialog from "@/components/api-keys-dialog";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [showApiKeysDialog, setShowApiKeysDialog] = useState(false);

  // Navigation links with active state handling
  const navigationLinks = [
    { name: "Home", path: "/" },
    { name: "Technology", path: "/category/technology" },
    { name: "Sports", path: "/category/sports" },
    { name: "Business", path: "/category/business" },
    { name: "Health", path: "/category/health" },
    { name: "My Interests", path: "/interests" },
  ];

  // Get initials for avatar
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm dark:bg-neutral-900 dark:border-b dark:border-neutral-700">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Newspaper className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-semibold text-neutral-800 dark:text-white">NewsFlow</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-neutral-200" />
            ) : (
              <Moon className="h-5 w-5 text-neutral-600" />
            )}
          </Button>
          
          {/* Profile dropdown */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-full">
                  <Avatar className="h-8 w-8 bg-primary text-white">
                    <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium text-neutral-700 dark:text-neutral-200">{user.username}</span>
                  <ChevronDown className="h-5 w-5 text-neutral-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <button className="w-full flex items-center" onClick={() => setShowApiKeysDialog(true)}>
                    <Key className="mr-2 h-4 w-4" />
                    <span>API Keys</span>
                  </button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <button className="w-full flex items-center text-red-600 dark:text-red-400" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      
      {/* Navigation tabs */}
      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="container mx-auto px-4 flex space-x-6 overflow-x-auto">
          {navigationLinks.map(link => (
            <Link 
              key={link.path} 
              href={link.path}
              className={`py-3 border-b-2 whitespace-nowrap font-medium transition-colors ${
                (location === link.path || (link.path !== '/' && location.includes(link.path)))
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:border-primary/30 text-neutral-600 dark:text-neutral-300 hover:text-primary'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* API Keys Dialog */}
      <ApiKeysDialog 
        open={showApiKeysDialog} 
        onOpenChange={setShowApiKeysDialog}
      />
    </header>
  );
}

export default Header;
