import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Video, LayoutDashboard, History, Users, Save, CreditCard, Settings, ShieldAlert, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const navItems = [
    { href: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { href: "/studio", icon: <Video size={20} />, label: "Studio" },
    { href: "/history", icon: <History size={20} />, label: "History" },
    { href: "/characters", icon: <Users size={20} />, label: "Characters" },
    { href: "/prompts", icon: <Save size={20} />, label: "Saved Prompts" },
    { href: "/credits", icon: <CreditCard size={20} />, label: "Credits" },
    { href: "/settings", icon: <Settings size={20} />, label: "Settings" },
  ];

  if (user?.role === "admin") {
    navItems.push({ href: "/admin", icon: <ShieldAlert size={20} />, label: "Admin" });
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#050508] border-r border-white/10 w-64 text-white">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-gradient-to-br from-purple-600 to-pink-500 p-2 rounded-lg">
          <Video className="text-white" size={24} />
        </div>
        <span className="font-bold text-xl tracking-tight">Zuu Studio</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-purple-900/50 border border-purple-500/30 flex items-center justify-center overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-purple-400">{user?.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.credits} Credits</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start text-slate-400 hover:text-white border-white/10 bg-transparent hover:bg-white/5" onClick={handleLogout}>
          <LogOut size={16} className="mr-2" /> Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#050508] text-white overflow-hidden">
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-[#080b14]">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-600 to-pink-500 p-1.5 rounded-lg">
              <Video className="text-white" size={20} />
            </div>
            <span className="font-bold">Zuu Studio</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r-white/10 bg-[#050508] text-white">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
