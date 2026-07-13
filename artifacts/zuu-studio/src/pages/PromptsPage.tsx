import { useState, useMemo } from "react";
import { useListSavedPrompts, useDeletePrompt } from "@workspace/api-client-react";
import { Loader2, BookOpen, Trash2, Video, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

export default function PromptsPage() {
  const { data, isLoading, refetch } = useListSavedPrompts();
  const deleteMutation = useDeletePrompt();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState("all");

  const prompts = data ?? [];

  const styles = useMemo(() => {
    const s = new Set<string>();
    prompts.forEach((p) => { if (p.style) s.add(p.style); });
    return ["all", ...Array.from(s)];
  }, [prompts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return prompts.filter((p) => {
      const matchStyle = styleFilter === "all" || p.style === styleFilter;
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q) ||
        (p.enhancedPrompt ?? "").toLowerCase().includes(q);
      return matchStyle && matchSearch;
    });
  }, [prompts, search, styleFilter]);

  const handleDelete = (id: number) => {
    if (!confirm("Delete this saved prompt?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => { toast({ title: "Prompt deleted" }); refetch(); },
    });
  };

  const useInStudio = (prompt: { prompt: string; enhancedPrompt?: string | null; style?: string | null }) => {
    localStorage.setItem(
      "zuu_studio_prefill",
      JSON.stringify({
        prompt: prompt.prompt,
        enhancedPrompt: prompt.enhancedPrompt,
        style: prompt.style,
      }),
    );
    toast({ title: "Prompt loaded into Studio" });
    setLocation("/studio");
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Saved Prompts</h1>
          <p className="text-slate-400 mt-1">Your library of cinematic ideas · {prompts.length} saved</p>
        </div>
        <Link href="/templates">
          <Button variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 gap-2">
            <Sparkles size={15} className="text-purple-400" />
            Browse Templates
          </Button>
        </Link>
      </div>

      {prompts.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
            <Input
              placeholder="Search prompts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#050508] border-white/10 h-9"
            />
          </div>
          {/* Style filter */}
          {styles.length > 2 && (
            <div className="flex gap-2 flex-wrap">
              {styles.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyleFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
                    styleFilter === s
                      ? "bg-purple-600/20 border-purple-500 text-purple-300"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {s === "all" ? "All Styles" : s.replace("_", " ")}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((prompt) => (
            <div
              key={prompt.id}
              className="glass-card p-5 rounded-2xl flex flex-col border border-white/5 hover:border-purple-500/30 transition-all group hover:shadow-[0_0_16px_rgba(124,58,237,0.1)]"
            >
              {/* Title + style */}
              <div className="flex items-start justify-between mb-3 gap-2">
                <h3 className="font-bold text-sm line-clamp-1">{prompt.title}</h3>
                {prompt.style && (
                  <span className="text-[9px] uppercase bg-purple-600/10 border border-purple-500/20 px-2 py-0.5 rounded text-purple-400 whitespace-nowrap shrink-0 font-bold tracking-wide">
                    {prompt.style.replace("_", " ")}
                  </span>
                )}
              </div>

              {/* Prompt preview */}
              <div className="bg-[#050508] p-3 rounded-xl border border-white/5 mb-4 flex-1">
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-5 font-mono">
                  {prompt.enhancedPrompt || prompt.prompt}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-[10px] text-slate-600">
                  {new Date(prompt.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-400 hover:text-pink-400 hover:bg-pink-500/10"
                    onClick={() => handleDelete(prompt.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 h-8 text-xs gap-1"
                    onClick={() => useInStudio(prompt)}
                  >
                    <Video size={12} /> Use
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-14 rounded-3xl text-center border-dashed border-2 border-white/10 bg-transparent flex flex-col items-center">
          <BookOpen className="text-slate-600 mb-4" size={36} />
          <h3 className="text-2xl font-bold mb-3">
            {search || styleFilter !== "all" ? "No prompts found" : "No Saved Prompts"}
          </h3>
          <p className="text-slate-400 mb-8 max-w-md text-sm">
            {search || styleFilter !== "all"
              ? "Try adjusting your search or clearing the style filter."
              : "Save prompts from the Studio to reuse them later, or start from a curated template."}
          </p>
          <div className="flex gap-3">
            {(search || styleFilter !== "all") ? (
              <Button variant="outline" className="border-white/20" onClick={() => { setSearch(""); setStyleFilter("all"); }}>
                Clear Filters
              </Button>
            ) : (
              <>
                <Link href="/studio">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 glow-button">
                    Go to Studio
                  </Button>
                </Link>
                <Link href="/templates">
                  <Button variant="outline" className="border-white/20 gap-2 rounded-full px-6">
                    <Sparkles size={14} /> Templates
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
