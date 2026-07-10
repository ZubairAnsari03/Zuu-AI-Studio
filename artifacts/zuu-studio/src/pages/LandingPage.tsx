import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Play, Sparkles, Film, Zap, Layers, Wand2, Users, Video } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium mb-8">
            <Sparkles size={16} />
            <span>Zuu AI Engine v2.0 is now live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Create Cinematic AI Videos <br className="hidden md:block" />
            <span className="text-gradient">From Simple Text</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12">
            The next-generation editing suite for content creators, marketers, and storytellers. Turn your ideas into professional-quality video in seconds.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full glow-button border-0">
                Start Creating Free
                <Play className="ml-2 fill-current" size={18} />
              </Button>
            </Link>
            <a href="#examples" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg border-white/20 text-white hover:bg-white/10 rounded-full">
                View Examples
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-24 bg-[#080b14] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Command <span className="text-gradient-blue">Every Frame</span></h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">Not just a text box. A complete cinematic control center.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Film size={32}/>, title: "Director's Camera", desc: "Specify tracking shots, drone flyovers, slow zooms, and orbital camera movements with precision." },
              { icon: <Wand2 size={32}/>, title: "Style Engine", desc: "Choose from Cinematic Realistic, 3D Animation, Anime, Claymation, and more to match your vision." },
              { icon: <Layers size={32}/>, title: "Scene Builder", desc: "Construct multi-scene stories with consistent characters, environments, and precise pacing." },
              { icon: <Users size={32}/>, title: "Character Consistency", desc: "Save character profiles and reuse them across different videos while maintaining their exact look." },
              { icon: <Zap size={32}/>, title: "Prompt Enhancer", desc: "Let our LLM rewrite your simple ideas into rich, detailed cinematic prompts automatically." },
              { icon: <Sparkles size={32}/>, title: "4K Rendering", desc: "Export in stunning Full HD or 4K with flawless framerates and lifelike lighting." }
            ].map((feature, i) => (
              <div key={i} className="glass-card p-8 rounded-3xl transition-transform hover:-translate-y-2">
                <div className="bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-purple-400 border border-purple-500/20">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">From Idea to Reality in <span className="text-gradient">3 Steps</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-pink-500/0 -translate-y-1/2 z-0" />
            
            {[
              { step: "01", title: "Write your vision", desc: "Describe the scene, action, and mood." },
              { step: "02", title: "Set the parameters", desc: "Choose camera angle, style, and motion." },
              { step: "03", title: "Generate & Export", desc: "Get a stunning video in minutes." }
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-[#080b14] border-2 border-purple-500 flex items-center justify-center text-2xl font-bold mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Placeholder */}
      <section id="pricing" className="py-24 bg-[#080b14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Starter", price: "$0", credits: "50 Credits / month", desc: "Perfect for exploring the platform" },
              { name: "Pro", price: "$29", credits: "500 Credits / month", desc: "For serious content creators", popular: true },
              { name: "Studio", price: "$99", credits: "2000 Credits / month", desc: "Unlimited 4K and priority queue" }
            ].map((plan, i) => (
              <div key={i} className={`glass-card p-8 rounded-3xl relative ${plan.popular ? 'border-purple-500/50 shadow-[0_0_30px_rgba(124,58,237,0.2)] scale-105 z-10' : ''}`}>
                {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</div>}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-slate-400 mb-6">{plan.desc}</p>
                <div className="mb-6"><span className="text-5xl font-bold">{plan.price}</span><span className="text-slate-400">/mo</span></div>
                <ul className="mb-8 space-y-3 text-slate-300">
                  <li className="flex items-center gap-2"><Zap size={16} className="text-purple-400" /> {plan.credits}</li>
                  <li className="flex items-center gap-2"><Film size={16} className="text-purple-400" /> Full HD Exports</li>
                  <li className="flex items-center gap-2"><Layers size={16} className="text-purple-400" /> Commercial Rights</li>
                </ul>
                <Button className={`w-full rounded-full ${plan.popular ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                  Choose Plan
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#050508] pt-16 pb-8 text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4 text-white">
                <Video size={20} />
                <span className="font-bold text-xl">Zuu Studio</span>
              </div>
              <p>The cinematic AI video platform for creators.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Studio</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Showcase</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Prompt Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} Zuu Studio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
