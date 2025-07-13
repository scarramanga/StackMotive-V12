import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Zap, BarChart3, BookOpen, Eye, TrendingUp, Home, Settings, FileText, Calculator, Building, User, LogOut, Bell, HelpCircle } from 'lucide-react';
import { useSessionStore } from '../../store/session';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoImage from '@assets/stackmotive_logo_blugreen.png';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import OnboardingModal from '@/components/OnboardingModal';

interface HeaderProps {
  showMenuButton?: boolean;
}

export function Header({ showMenuButton = true }: HeaderProps) {
  const [location, navigate] = useLocation();
  const user = useSessionStore(s => s.user);
  const logout = useSessionStore(s => s.clearSession);
  const isAuthenticated = !!user;
  const [isOnboardingOpen, setIsOnboardingOpen] = React.useState(false);
  
  const menuItems = [
    { name: 'Dashboard', icon: <Home className="w-5 h-5 mr-2" />, path: '/' },
    { name: 'Trading Strategies', icon: <BarChart3 className="w-5 h-5 mr-2" />, path: '/trading/strategies' },
    { name: 'Account Management', icon: <Building className="w-5 h-5 mr-2" />, path: '/account-management' },
    { name: 'Whale Tracking', icon: <Eye className="w-5 h-5 mr-2" />, path: '/whale-tracking' },
    { name: 'Tax Calculator', icon: <Calculator className="w-5 h-5 mr-2" />, path: '/tax-calculator' },
    { name: 'Reports', icon: <FileText className="w-5 h-5 mr-2" />, path: '/reports' },
    { name: 'Settings', icon: <Settings className="w-5 h-5 mr-2" />, path: '/settings' },
  ];
  
  return (
    <header className="w-full py-3 px-4 border-b border-primary/20 bg-background shadow-sm sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            {/* Official StackMotive logo */}
            <img
              src={logoImage}
              alt="StackMotive"
              className="w-12 h-12 object-contain"
            />
            <span className="ml-2 font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
              StackMotive
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          {/* Help Icon */}
          {isAuthenticated && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsOnboardingOpen(true)}
                    className="h-10 w-10 rounded-full hover:bg-blue-50 hover:text-blue-600"
                  >
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>How StackMotive works</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* User Dropdown */}
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-12 w-12 rounded-full hover:ring-2 hover:ring-primary/30 transition-all">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-400 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-white ring-2 ring-gray-200 hover:ring-primary/40">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="font-medium text-sm">{user?.email?.split('@')[0] || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {showMenuButton && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="default" size="lg" className="bg-primary text-white font-bold text-xl py-6 px-8 shadow-lg">
                  <Menu className="w-6 h-6 mr-3" />
                  MENU
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader className="border-b pb-4 mb-4">
                  <SheetTitle className="text-xl">
                    <div className="flex items-center">
                      {/* Official StackMotive logo in menu */}
                      <img
                        src={logoImage}
                        alt="StackMotive"
                        className="w-8 h-8 object-contain"
                      />
                      <span className="ml-2 font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
                        StackMotive Menu
                      </span>
                    </div>
                  </SheetTitle>
                  <SheetDescription>
                    {isAuthenticated ? (
                      <div className="flex items-center mt-2 p-2 bg-muted rounded-md">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                          {user?.email?.charAt(0).toUpperCase() || 'T'}
                        </div>
                        <div>
                          <p className="font-medium">Welcome, {user?.email?.split('@')[0] || 'Trader'}</p>
                          <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => navigate('/login')} className="flex-1">Login</Button>
                        <Button size="sm" variant="outline" onClick={() => navigate('/register')} className="flex-1">Sign Up</Button>
                      </div>
                    )}
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col space-y-1">
                  {menuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant={location === item.path ? 'default' : 'ghost'}
                      className="justify-start h-12"
                      onClick={() => navigate(item.path)}
                    >
                      {item.icon}
                      {item.name}
                      {item.path === '/trading/ai-strategy-builder' && (
                        <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">New</span>
                      )}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </header>
  );
}