import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Video, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4 text-white">
      <div className="glass-card p-12 rounded-3xl max-w-lg w-full text-center border-purple-500/20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-purple-600 to-pink-500 p-3 rounded-2xl">
              <Video className="text-white" size={32} />
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-pink-500 mb-4">
            <AlertTriangle size={24} />
            <h1 className="text-4xl font-bold">404</h1>
          </div>
          
          <h2 className="text-2xl font-bold mb-4">Scene Not Found</h2>
          
          <p className="text-slate-400 mb-8 leading-relaxed">
            The frame you're looking for doesn't exist on our storyboard. It might have been deleted, or the URL might be incorrect.
          </p>
          
          <Link href="/">
            <Button className="bg-white text-black hover:bg-slate-200 rounded-full px-8 h-12 font-bold w-full sm:w-auto glow-button">
              Back to Studio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
