import { ReactNode } from "react";
import { Link } from "wouter";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="border-b border-white/10 bg-[#050508]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-pink-500 p-2 rounded-xl">
              <Video className="text-white" size={24} />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white">Zuu</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#examples" className="hover:text-white transition-colors">Examples</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="inline-block">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 glow-button">
                  Go to Studio
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-block">
                  <Button variant="ghost" className="text-white hover:bg-white/10 rounded-full px-6">
                    Log in
                  </Button>
                </Link>
                <Link href="/register" className="inline-block">
                  <Button className="bg-white text-black hover:bg-slate-200 rounded-full px-6 glow-button font-semibold">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
