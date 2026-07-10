import { useListSavedPrompts, useDeletePrompt } from "@workspace/api-client-react";
import { Loader2, Save, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

export default function PromptsPage() {
  const { data, isLoading, refetch } = useListSavedPrompts();
  const deleteMutation = useDeletePrompt();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleDelete = (id: number) => {
    if (confirm("Delete this saved prompt?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Prompt deleted" });
          refetch();
        }
      });
    }
  };

  const useInStudio = (prompt: any) => {
    // In a real app we'd save this to a global state or pass via URL state
    toast({ title: "Prompt selected", description: "Navigating to studio..." });
    setLocation("/studio");
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const prompts = data || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Saved Prompts</h1>
          <p className="text-slate-400 mt-1">Your library of cinematic ideas</p>
        </div>
      </div>

      {prompts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map(prompt => (
            <div key={prompt.id} className="glass-card p-6 rounded-3xl flex flex-col border border-white/5 hover:border-purple-500/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold line-clamp-1">{prompt.title}</h3>
                <span className="text-[10px] uppercase bg-white/5 px-2 py-1 rounded text-slate-400 whitespace-nowrap ml-2">
                  {prompt.style || "Auto"}
                </span>
              </div>
              
              <div className="bg-[#050508] p-4 rounded-xl border border-white/5 mb-6 flex-1">
                <p className="text-sm text-slate-300 line-clamp-4 leading-relaxed font-mono">
                  {prompt.enhancedPrompt || prompt.prompt}
                </p>
              </div>
              
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs text-slate-500">{new Date(prompt.createdAt).toLocaleDateString()}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400 hover:text-pink-400 hover:bg-pink-500/10" onClick={() => handleDelete(prompt.id)}>
                    <Trash2 size={16} />
                  </Button>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4" onClick={() => useInStudio(prompt)}>
                    <Video size={14} className="mr-2" /> Use
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-16 rounded-3xl text-center border-dashed border-2 border-white/10 bg-transparent flex flex-col items-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Save className="text-slate-500" size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-3">No Saved Prompts</h3>
          <p className="text-slate-400 mb-8 max-w-md">
            When you create a masterpiece in the Studio, save the prompt here to reuse it later.
          </p>
          <Link href="/studio">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 glow-button">
              Go to Studio
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
