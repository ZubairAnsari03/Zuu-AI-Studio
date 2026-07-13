import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useGenerateVideo, useListProviders } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Film, Plus, Trash2, ChevronUp, ChevronDown, Wand2,
  Send, Play, ArrowRight, Loader2, Layers,
} from "lucide-react";

interface Scene {
  id: string;
  name: string;
  description: string;
  duration: number;
  style: string;
  cameraMovement: string;
  lighting: string;
}

const STYLES = [
  "cinematic", "3d_animation", "anime", "fantasy", "photorealistic",
  "scifi", "nature", "product", "horror", "social",
];

const CAMERAS = [
  { value: "", label: "Auto (AI decides)" },
  { value: "static", label: "Static Shot" },
  { value: "pan_left", label: "Pan Left" },
  { value: "pan_right", label: "Pan Right" },
  { value: "zoom_in", label: "Slow Zoom In" },
  { value: "zoom_out", label: "Slow Zoom Out" },
  { value: "tracking", label: "Tracking Shot" },
  { value: "drone", label: "Drone / Aerial" },
  { value: "handheld", label: "Handheld" },
];

const LIGHTING = [
  { value: "", label: "Auto" },
  { value: "golden_hour", label: "Golden Hour" },
  { value: "night", label: "Night / Neon" },
  { value: "studio", label: "Studio Lighting" },
  { value: "natural", label: "Natural Daylight" },
  { value: "dramatic", label: "Dramatic / High-Contrast" },
  { value: "soft", label: "Soft / Diffused" },
  { value: "backlit", label: "Backlit / Silhouette" },
];

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function buildScene(partial: Partial<Scene> = {}): Scene {
  return {
    id: makeId(),
    name: "",
    description: "",
    duration: 5,
    style: "cinematic",
    cameraMovement: "",
    lighting: "",
    ...partial,
  };
}

/**
 * Simple rule-based scene splitter.
 * Splits concept text into 3–6 scenes by sentence or clause boundaries.
 */
function splitIntoScenes(concept: string, defaultStyle: string): Scene[] {
  const text = concept.trim();
  if (!text) return [buildScene({ name: "Scene 1", style: defaultStyle })];

  // Split on sentence-ending punctuation or transition keywords
  const raw = text
    .split(/(?:[.!?]+\s+)|(?:\s*,\s*(?:then|next|after|while|as|suddenly|meanwhile)\s+)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  // Clamp to 3–6 scenes
  const chunks = raw.length < 3
    ? [text]  // single block — make 3 acts
    : raw.slice(0, 6);

  if (chunks.length === 1) {
    // Create 3 acts from a single block
    const words = chunks[0].split(" ");
    const third = Math.ceil(words.length / 3);
    return [
      buildScene({ name: "Opening Shot", description: words.slice(0, third).join(" "), style: defaultStyle, cameraMovement: "zoom_in" }),
      buildScene({ name: "Main Action", description: words.slice(third, third * 2).join(" "), style: defaultStyle }),
      buildScene({ name: "Closing Shot", description: words.slice(third * 2).join(" "), style: defaultStyle, cameraMovement: "zoom_out" }),
    ];
  }

  const cameras = ["zoom_in", "", "tracking", "", "pan_right", "zoom_out"];
  return chunks.map((desc, i) => buildScene({
    name: `Scene ${i + 1}`,
    description: desc,
    style: defaultStyle,
    cameraMovement: cameras[i] ?? "",
  }));
}

export default function StoryboardPage() {
  const [concept, setConcept] = useState("");
  const [overallStyle, setOverallStyle] = useState("cinematic");
  const [scenes, setScenes] = useState<Scene[]>([buildScene({ name: "Scene 1" })]);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);

  const { data: providersData } = useListProviders();
  const generateMutation = useGenerateVideo();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const activeProvider = providersData?.find((p) => p.enabled)?.id ?? "mock";

  /* ── Scene manipulation ─────────────────────────────────────────────── */
  const addScene = () =>
    setScenes((prev) => [
      ...prev,
      buildScene({ name: `Scene ${prev.length + 1}`, style: overallStyle }),
    ]);

  const removeScene = (id: string) =>
    setScenes((prev) => prev.filter((s) => s.id !== id));

  const updateScene = (id: string, patch: Partial<Scene>) =>
    setScenes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const moveScene = (id: string, dir: -1 | 1) =>
    setScenes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });

  /* ── Auto-generate scenes from concept ─────────────────────────────── */
  const handleBreakDown = () => {
    if (!concept.trim()) {
      toast({ variant: "destructive", title: "Enter a concept first" });
      return;
    }
    const generated = splitIntoScenes(concept, overallStyle);
    setScenes(generated);
    toast({ title: `Storyboard created`, description: `${generated.length} scenes generated` });
  };

  /* ── Send single scene to Studio ───────────────────────────────────── */
  const sendToStudio = (scene: Scene) => {
    const prefill = {
      prompt: scene.description || concept,
      style: scene.style,
      cameraMovement: scene.cameraMovement || undefined,
      lighting: scene.lighting || undefined,
      duration: scene.duration,
    };
    localStorage.setItem("zuu_studio_prefill", JSON.stringify(prefill));
    toast({ title: "Scene loaded into Studio" });
    setLocation("/studio");
  };

  /* ── Generate all scenes ────────────────────────────────────────────── */
  const handleGenerateAll = useCallback(async () => {
    const validScenes = scenes.filter((s) => s.description.trim());
    if (validScenes.length === 0) {
      toast({ variant: "destructive", title: "Add scene descriptions first" });
      return;
    }
    setGeneratingAll(true);
    setQueuedCount(0);
    let count = 0;
    for (const scene of validScenes) {
      try {
        await new Promise<void>((resolve, reject) =>
          generateMutation.mutate(
            {
              data: {
                prompt: scene.description,
                style: scene.style,
                aspectRatio: "16:9",
                duration: scene.duration as any,
                quality: "hd",
                motionStrength: "medium",
                cameraMovement: scene.cameraMovement || null,
                lighting: scene.lighting || null,
                provider: activeProvider,
              },
            },
            { onSuccess: () => { count++; setQueuedCount(count); resolve(); }, onError: reject },
          ),
        );
        // Small delay between submissions to avoid rate-limiting
        await new Promise((r) => setTimeout(r, 500));
      } catch {
        toast({ variant: "destructive", title: `Scene "${scene.name}" failed to queue` });
      }
    }
    setGeneratingAll(false);
    toast({
      title: `${count} scene${count !== 1 ? "s" : ""} queued`,
      description: "Check History to track progress.",
    });
    if (count > 0) setLocation("/history");
  }, [scenes, activeProvider, generateMutation, toast, setLocation]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Layers className="text-purple-400" size={28} />
          Storyboard Generator
        </h1>
        <p className="text-slate-400 mt-1">
          Plan multi-scene productions and queue all generations at once.
        </p>
      </div>

      {/* Concept + break-down */}
      <section className="glass-card p-6 rounded-2xl space-y-4">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Wand2 className="text-purple-400" size={18} />
          Project Concept
        </Label>

        <div className="grid md:grid-cols-[1fr_180px] gap-4">
          <Textarea
            placeholder="Describe your full video concept or story. The AI will split it into scenes automatically…"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            className="min-h-[120px] bg-[#050508] border-white/10 text-base resize-y placeholder:text-slate-600"
          />
          <div className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Default Style</Label>
              <Select value={overallStyle} onValueChange={setOverallStyle}>
                <SelectTrigger className="bg-[#050508] border-white/10 h-9 text-sm capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#080b14] border-white/10">
                  {STYLES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleBreakDown}
              disabled={!concept.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white mt-auto"
            >
              <Wand2 size={14} className="mr-2" />
              Break Down
            </Button>
          </div>
        </div>
      </section>

      {/* Scene list */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Scenes
            <span className="ml-2 text-sm text-slate-500 font-normal">({scenes.length})</span>
          </h2>
          <Button variant="outline" size="sm" onClick={addScene} className="border-white/20 gap-1">
            <Plus size={14} /> Add Scene
          </Button>
        </div>

        {scenes.map((scene, idx) => (
          <div
            key={scene.id}
            className="glass-card p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors"
          >
            {/* Scene header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                <span className="text-purple-400 font-bold text-sm">{idx + 1}</span>
              </div>
              <Input
                value={scene.name}
                onChange={(e) => updateScene(scene.id, { name: e.target.value })}
                placeholder={`Scene ${idx + 1}`}
                className="bg-[#050508] border-white/10 h-8 text-sm font-medium flex-1"
              />
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500 hover:text-white" onClick={() => moveScene(scene.id, -1)} disabled={idx === 0}>
                  <ChevronUp size={14} />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500 hover:text-white" onClick={() => moveScene(scene.id, 1)} disabled={idx === scenes.length - 1}>
                  <ChevronDown size={14} />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-500 hover:text-pink-400" onClick={() => removeScene(scene.id)} disabled={scenes.length === 1}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>

            {/* Description */}
            <Textarea
              value={scene.description}
              onChange={(e) => updateScene(scene.id, { description: e.target.value })}
              placeholder="Describe what happens in this scene…"
              className="bg-[#050508] border-white/10 min-h-[80px] text-sm mb-4 resize-none placeholder:text-slate-600"
            />

            {/* Controls row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500 uppercase tracking-wider">Duration</Label>
                <Select value={String(scene.duration)} onValueChange={(v) => updateScene(scene.id, { duration: Number(v) })}>
                  <SelectTrigger className="bg-[#050508] border-white/10 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#080b14] border-white/10">
                    {[5, 10].map((d) => <SelectItem key={d} value={String(d)}>{d}s</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500 uppercase tracking-wider">Style</Label>
                <Select value={scene.style} onValueChange={(v) => updateScene(scene.id, { style: v })}>
                  <SelectTrigger className="bg-[#050508] border-white/10 h-8 text-xs capitalize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#080b14] border-white/10">
                    {STYLES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500 uppercase tracking-wider">Camera</Label>
                <Select value={scene.cameraMovement} onValueChange={(v) => updateScene(scene.id, { cameraMovement: v })}>
                  <SelectTrigger className="bg-[#050508] border-white/10 h-8 text-xs">
                    <SelectValue placeholder="Auto" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#080b14] border-white/10">
                    {CAMERAS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-500 uppercase tracking-wider">Lighting</Label>
                <Select value={scene.lighting} onValueChange={(v) => updateScene(scene.id, { lighting: v })}>
                  <SelectTrigger className="bg-[#050508] border-white/10 h-8 text-xs">
                    <SelectValue placeholder="Auto" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#080b14] border-white/10">
                    {LIGHTING.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Send to Studio */}
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="border-white/15 bg-white/5 hover:bg-purple-600/20 hover:border-purple-500/40 gap-1.5 text-xs"
                onClick={() => sendToStudio(scene)}
                disabled={!scene.description.trim()}
              >
                <Send size={12} />
                Send to Studio
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
        <p className="text-sm text-slate-500">
          {scenes.filter((s) => s.description.trim()).length} of {scenes.length} scenes have descriptions
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="border-white/20 gap-2" onClick={() => setLocation("/history")}>
            <Play size={14} />
            View History
          </Button>
          <Button
            onClick={handleGenerateAll}
            disabled={generatingAll || scenes.every((s) => !s.description.trim())}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 gap-2"
          >
            {generatingAll ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Queuing ({queuedCount}/{scenes.filter((s) => s.description.trim()).length})
              </>
            ) : (
              <>
                <ArrowRight size={14} />
                Generate All Scenes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
