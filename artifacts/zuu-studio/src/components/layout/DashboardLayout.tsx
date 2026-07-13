import { ReactNode, memo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Video, LayoutDashboard, History, Users, BookOpen,
  Sparkles, Layers, CreditCard, Settings, ShieldAlert,
  LogOut, Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_SECTIONS = [
  {
    label: "Create",
    items: [
      { href: "/studio",     icon: Video,          label: "Studio" },
      { href: "/templates",  icon: Sparkles,        label: "Templates" },
      { href: "/storyboard", icon: Layers,          label: "Storyboard" },
    ],
  },
  {
    label: "Library",
    items: [
      { href: "/history",    icon: History,         label: "History" },
      { href: "/characters", icon: Users,           label: "Characters" },
      { href: "/prompts",    icon: BookOpen,        label: "Saved Prompts" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
      { href: "/credits",    icon: CreditCard,      label: "Credits" },
      { href: "/settings",   icon: Settings,        label: "Settings" },
    ],
  },
];

const SidebarContent = memo(function SidebarContent() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="flex flex-col h-full bg-[#050508] border-r border-white/[0.06] w-64 text-white">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="bg-gradient-to-br from-purple-600 to-pink-500 p-2 rounded-xl shadow-[0_0_12px_rgba(168,85,247,0.4)]">
          <Video className="text-white" size={20} />
        </div>
        <span className="font-bold text-lg tracking-tight">Zuu Studio</span>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <nav className="px-3 space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600 px-4 mb-1.5">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ href, icon: Icon, label }) => {
                  const active = location === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${
                        active
                          ? "bg-purple-600/20 text-purple-300 border border-purple-500/25 shadow-[0_0_8px_rgba(168,85,247,0.1)]"
                          : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                      }`}
                    >
                      <Icon size={17} className={active ? "text-purple-400" : ""} />
                      <span className="font-medium">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Admin link — only for admins */}
          {user?.role === "admin" && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600 px-4 mb-1.5">
                Admin
              </p>
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm ${
                  location === "/admin"
                    ? "bg-red-600/20 text-red-300 border border-red-500/25"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <ShieldAlert size={17} />
                <span className="font-medium">Admin Panel</span>
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* User card */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 rounded-full bg-purple-900/50 border border-purple-500/30 flex items-center justify-center overflow-hidden shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-purple-300 text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.credits ?? 0} credits</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-slate-400 hover:text-white border-white/10 bg-transparent hover:bg-white/5 gap-2"
          onClick={handleLogout}
        >
          <LogOut size={14} /> Logout
        </Button>
      </div>
    </div>
  );
});

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#050508] text-white overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block shrink-0">
        <SidebarContent />
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-white/[0.06] bg-[#080b14] shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-purple-600 to-pink-500 p-1.5 rounded-lg">
              <Video className="text-white" size={18} />
            </div>
            <span className="font-bold text-sm">Zuu Studio</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white h-9 w-9">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          <div className="max-w-6xl mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
