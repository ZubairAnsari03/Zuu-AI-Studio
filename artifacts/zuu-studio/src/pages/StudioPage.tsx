import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useListProviders, useGenerateVideo, useEnhancePrompt,
  useSavePrompt, useGetCredits, useListCharacters,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wand2, Zap, Save, Film, Settings2, Image as ImageIcon,
  Play, Loader2, CreditCard, X, Upload, Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import GenerationProgress from "@/components/studio/GenerationProgress";
import ProviderPicker from "@/components/studio/ProviderPicker";
import { compressImage, formatBytes, dataUrlBytes } from "@/lib/imageCompressor";

// ── Constants ────────────────────────────────────────────────────────────────

const STYLES = [
  { id: "cinematic",      name: "Cinematic",     emoji: "🎥" },
  { id: "3d_animation",   name: "3D Animated",   emoji: "🦄" },
  { id: "anime",          name: "Anime",         emoji: "🌸" },
  { id: "fantasy",        name: "Fantasy",       emoji: "🐉" },
  { id: "claymation",     name: "Claymation",    emoji: "🧸" },
  { id: "photorealistic", name: "Photorealistic",emoji: "📸" },
  { id: "product",        name: "Product Ad",    emoji: "👟" },
  { id: "nature",         name: "Nature Doc",    emoji: "🌿" },
  { id: "horror",         name: "Horror",        emoji: "🧟" },
  { id: "scifi",          name: "Sci-Fi",        emoji: "🛸" },
  { id: "social",         name: "Social Media",  emoji: "📱" },
  { id: "cartoon",        name: "Cartoon",       emoji: "🎨" },
];

const ALL_DURATIONS   = [5, 10, 15] as const;
const ALL_RATIOS      = ["16:9", "9:16", "1:1", "4:5"] as const;
const CAMERA_OPTIONS  = [
  { value: "", label: "Auto (AI decides)" },
  { value: "static",    label: "Static Shot" },
  { value: "pan_left",  label: "Pan Left" },
  { value: "pan_right", label: "Pan Right" },
  { value: "zoom_in",   label: "Slow Zoom In" },
  { value: "zoom_out",  label: "Slow Zoom Out" },
  { value: "tracking",  label: "Tracking Shot" },
  { value: "drone",     label: "Drone / Aerial" },
];

const formSchema = z.object({
  prompt:           z.string().min(1, "Prompt is required"),
  enhancedPrompt:   z.string().optional(),
  negativePrompt:   z.string().optional(),
  style:            z.string(),
  aspectRatio:      z.enum(["9:16", "16:9", "1:1", "4:5"]),
  duration:         z.number(),
  quality:          z.enum(["standard", "hd", "full_hd", "4k"]),
  cameraMovement:   z.string().optional(),
  lighting:         z.string().optional(),
  motionStrength:   z.enum(["low", "medium", "high"]),
  provider:         z.string().optional(),
  characterProfileId: z.number().optional().nullable(),
  seed:             z.number().optional().nullable(),
  referenceImageUrl:  z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

// ── Component ────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeGenerationId, setActiveGenerationId] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  const { data: providersData } = useListProviders();
  const { data: creditsData }   = useGetCredits();
  const { data: charactersData } = useListCharacters();

  const generateMutation  = useGenerateVideo();
  const enhanceMutation   = useEnhancePrompt();
  const savePromptMutation = useSavePrompt();

  const providers = providersData ?? [];
  const defaultProvider = providers.find((p) => p.enabled)?.id ?? "mock";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt:         "",
      style:          "cinematic",
      aspectRatio:    "16:9",
      duration:       5,
      quality:        "hd",
      motionStrength: "medium",
      provider:       defaultProvider,
      negativePrompt: "ugly, blurry, deformed, low resolution, bad anatomy, bad lighting, grainy, watermark, text",
    },
  });

  // ── Prefill from localStorage (from Templates, Storyboard, Prompts) ─────
  useEffect(() => {
    const raw = localStorage.getItem("zuu_studio_prefill");
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as Partial<FormValues>;
      form.reset({ ...form.getValues(), ...data });
    } catch { /* ignore parse errors */ }
    localStorage.removeItem("zuu_studio_prefill");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set default provider once providers load
  useEffect(() => {
    if (providers.length && !form.getValues("provider")) {
      form.setValue("provider", defaultProvider);
    }
  }, [providers, defaultProvider, form]);

  // ── Derived provider capabilities ────────────────────────────────────────
  const selectedProviderId = form.watch("provider") ?? defaultProvider;
  const selectedProvider   = providers.find((p) => p.id === selectedProviderId);
  const availDurations     = (selectedProvider?.supportedDurations ?? ALL_DURATIONS).filter((d) =>
    (ALL_DURATIONS as readonly number[]).includes(d),
  ) as number[];
  const availRatios        = selectedProvider?.supportedAspectRatios ?? [...ALL_RATIOS];

  // Auto-adjust duration/ratio when provider changes to unsupported values
  useEffect(() => {
    const dur = form.getValues("duration");
    const rat = form.getValues("aspectRatio");
    if (!availDurations.includes(dur)) form.setValue("duration", availDurations[0] ?? 5);
    if (!availRatios.includes(rat))   form.setValue("aspectRatio", (availRatios[0] ?? "16:9") as any);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProviderId]);

  // ── Credit estimate ───────────────────────────────────────────────────────
  const dur     = form.watch("duration");
  const quality = form.watch("quality");
  const creditEstimate = Math.ceil(dur * ({ standard: 1, hd: 2, full_hd: 3, "4k": 5 }[quality] ?? 1));

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleEnhance = async () => {
    const prompt = form.getValues("prompt");
    if (!prompt) return;
    enhanceMutation.mutate(
      { data: { prompt, style: form.getValues("style"), aspectRatio: form.getValues("aspectRatio") } },
      {
        onSuccess: (data) => {
          form.setValue("enhancedPrompt", data.enhancedPrompt);
          form.setValue("negativePrompt", data.negativePrompt);
          toast({ title: "Prompt enhanced!" });
        },
      },
    );
  };

  const handleSavePrompt = () => {
    const prompt = form.getValues("enhancedPrompt") || form.getValues("prompt");
    if (!prompt) return;
    savePromptMutation.mutate(
      { data: { title: prompt.substring(0, 40) + "…", prompt: form.getValues("prompt"), enhancedPrompt: form.getValues("enhancedPrompt"), style: form.getValues("style") } },
      { onSuccess: () => toast({ title: "Prompt saved to library" }) },
    );
  };

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Please upload an image file" });
      return;
    }
    setCompressing(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.85 });
      setImagePreview(compressed);
      form.setValue("referenceImageUrl", compressed);
      const kb = Math.round(dataUrlBytes(compressed) / 1024);
      toast({ title: "Image ready", description: `Compressed to ~${kb} KB` });
    } catch {
      toast({ variant: "destructive", title: "Image compression failed" });
    }
    setCompressing(false);
  }, [form, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  }, [handleImageFile]);

  const clearImage = () => {
    setImagePreview(null);
    form.setValue("referenceImageUrl", null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (values: FormValues) => {
    generateMutation.mutate(
      { data: { ...values, duration: values.duration as any, provider: values.provider ?? defaultProvider } },
      {
        onSuccess: (data) => {
          setActiveGenerationId(data.id);
          toast({ title: "Generation started!", description: "Your video is queued." });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Failed to start", description: err?.message ?? "Something went wrong." });
        },
      },
    );
  };

  // ── Render: generation in progress ───────────────────────────────────────
  if (activeGenerationId) {
    return <GenerationProgress videoId={activeGenerationId} onReset={() => setActiveGenerationId(null)} />;
  }

  const watchedPrompt = form.watch("prompt");
  const watchedEnhanced = form.watch("enhancedPrompt");
  const activePromptField = watchedEnhanced ? "enhancedPrompt" : "prompt";

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Studio</h1>
          <p className="text-slate-400 mt-1">Configure your cinematic parameters and generate.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/templates">
            <Button variant="outline" size="sm" className="border-white/15 bg-white/5 hover:bg-white/10 gap-1.5 text-xs">
              <Sparkles size={13} className="text-purple-400" /> Templates
            </Button>
          </Link>
          <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 border-purple-500/30">
            <CreditCard size={15} className="text-purple-400" />
            <span className="font-bold text-sm">{creditsData?.balance ?? 0} Credits</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Prompt */}
          <section className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Wand2 className="text-purple-400" size={18} />
                Vision
                {watchedEnhanced && (
                  <span className="text-[10px] font-bold uppercase bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">Enhanced</span>
                )}
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button" variant="outline" size="sm"
                  className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white h-8 gap-1.5"
                  onClick={handleEnhance}
                  disabled={enhanceMutation.isPending || !watchedPrompt}
                >
                  {enhanceMutation.isPending
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Zap size={13} className="text-yellow-400" />}
                  Enhance
                </Button>
                <Button
                  type="button" variant="ghost" size="sm"
                  className="hover:bg-white/10 h-8 gap-1.5 text-slate-400 hover:text-white"
                  onClick={handleSavePrompt}
                  disabled={savePromptMutation.isPending || !watchedPrompt}
                >
                  <Save size={13} /> Save
                </Button>
                {watchedEnhanced && (
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="hover:bg-white/10 h-8 gap-1.5 text-slate-500 hover:text-white text-xs"
                    onClick={() => { form.setValue("enhancedPrompt", ""); }}
                  >
                    <X size={13} /> Clear
                  </Button>
                )}
              </div>
            </div>

            <Textarea
              placeholder="Describe your scene — characters, environment, camera movement, lighting, action…"
              className="min-h-[120px] bg-[#050508] border-white/10 text-base resize-y placeholder:text-slate-600 focus-visible:ring-purple-500"
              value={watchedEnhanced || watchedPrompt}
              onChange={(e) => {
                if (watchedEnhanced) form.setValue("enhancedPrompt", e.target.value);
                else form.setValue("prompt", e.target.value);
              }}
            />

            {/* Character inject */}
            {charactersData && charactersData.length > 0 && (
              <div className="flex items-center gap-3 bg-[#050508] p-3 rounded-xl border border-white/5">
                <Label className="text-xs text-slate-400 whitespace-nowrap shrink-0">Inject Character:</Label>
                <Select onValueChange={(val) => form.setValue("characterProfileId", val === "none" ? null : parseInt(val))}>
                  <SelectTrigger className="bg-white/5 border-none h-8 text-sm flex-1">
                    <SelectValue placeholder="Select character…" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#080b14] border-white/10">
                    <SelectItem value="none">None</SelectItem>
                    {charactersData.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </section>

          {/* Style selector */}
          <section className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Film className="text-purple-400" size={18} />
              Aesthetic Style
            </Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => form.setValue("style", style.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    form.watch("style") === style.id
                      ? "bg-purple-600/20 border-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                      : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:bg-white/[0.07] hover:border-white/20 hover:text-slate-200"
                  }`}
                >
                  <span className="text-xl mb-1">{style.emoji}</span>
                  <span className="text-[10px] font-medium text-center leading-tight">{style.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Reference image */}
          <section className="glass-card p-5 rounded-2xl space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <ImageIcon className="text-purple-400" size={18} />
              Reference Image
              <span className="text-[10px] text-slate-500 font-normal ml-1">Optional · compressed client-side</span>
            </Label>

            {imagePreview ? (
              <div className="relative group rounded-xl overflow-hidden border border-white/10">
                <img src={imagePreview} alt="Reference" className="w-full max-h-56 object-contain bg-[#050508]" />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center hover:bg-pink-600/80 transition-colors"
                >
                  <X size={13} className="text-white" />
                </button>
                <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 bg-black/60 px-2 py-0.5 rounded">
                  {Math.round(dataUrlBytes(imagePreview) / 1024)} KB
                </div>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center bg-[#050508] hover:bg-white/[0.04] hover:border-purple-500/30 transition-colors cursor-pointer group"
              >
                {compressing ? (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Loader2 size={24} className="animate-spin text-purple-400" />
                    <span className="text-sm">Compressing…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="text-slate-400 group-hover:text-purple-400 transition-colors" size={20} />
                    </div>
                    <p className="text-sm font-medium text-slate-300">Drop image or click to upload</p>
                    <p className="text-xs text-slate-500">PNG, JPG, WEBP — auto-compressed to 1024px</p>
                  </div>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
            />

            {!selectedProvider?.supportsImageToVideo && selectedProviderId !== "mock" && (
              <p className="text-[11px] text-yellow-500/80 flex items-center gap-1">
                ⚠ {selectedProvider?.name ?? "This provider"} may not support image-to-video
              </p>
            )}
          </section>
        </div>

        {/* ── Right column (sticky sidebar) ───────────────────────────── */}
        <div className="space-y-5">
          <div className="glass-card p-5 rounded-2xl space-y-5 sticky top-24">
            <h3 className="text-base font-semibold flex items-center gap-2 border-b border-white/10 pb-4">
              <Settings2 className="text-purple-400" size={18} />
              Parameters
            </h3>

            {/* Provider picker */}
            <ProviderPicker
              providers={providers}
              value={selectedProviderId}
              onChange={(id) => form.setValue("provider", id)}
            />

            {/* Aspect ratio */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-400 uppercase tracking-wider">Aspect Ratio</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {ALL_RATIOS.map((ratio) => {
                  const supported = availRatios.includes(ratio);
                  return (
                    <button
                      key={ratio}
                      type="button"
                      disabled={!supported}
                      onClick={() => form.setValue("aspectRatio", ratio)}
                      className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.watch("aspectRatio") === ratio
                          ? "bg-purple-600/20 border-purple-500 text-white"
                          : supported
                            ? "bg-[#050508] border-white/10 text-slate-400 hover:border-white/30"
                            : "bg-[#050508] border-white/5 text-slate-700 cursor-not-allowed"
                      }`}
                    >
                      {ratio}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-400 uppercase tracking-wider">Duration</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {ALL_DURATIONS.map((d) => {
                  const supported = availDurations.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={!supported}
                      onClick={() => form.setValue("duration", d)}
                      className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.watch("duration") === d
                          ? "bg-purple-600/20 border-purple-500 text-white"
                          : supported
                            ? "bg-[#050508] border-white/10 text-slate-400 hover:border-white/30"
                            : "bg-[#050508] border-white/5 text-slate-700 cursor-not-allowed"
                      }`}
                    >
                      {d}s
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Motion strength */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-slate-400 uppercase tracking-wider">Motion Strength</Label>
                <span className="text-xs font-semibold text-purple-400 uppercase">{form.watch("motionStrength")}</span>
              </div>
              <Controller
                control={form.control}
                name="motionStrength"
                render={({ field }) => (
                  <Slider
                    min={0} max={2} step={1}
                    value={[field.value === "low" ? 0 : field.value === "medium" ? 1 : 2]}
                    onValueChange={(v) => field.onChange(v[0] === 0 ? "low" : v[0] === 1 ? "medium" : "high")}
                    className="py-3"
                  />
                )}
              />
            </div>

            {/* Camera movement */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-400 uppercase tracking-wider">Camera Movement</Label>
              <Select onValueChange={(v) => form.setValue("cameraMovement", v)}>
                <SelectTrigger className="bg-[#050508] border-white/10 h-8 text-xs">
                  <SelectValue placeholder="Auto (AI decides)" />
                </SelectTrigger>
                <SelectContent className="bg-[#080b14] border-white/10">
                  {CAMERA_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value || "auto"}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced toggle */}
            <div className="border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full text-xs text-slate-500 hover:text-white transition-colors text-center"
              >
                {showAdvanced ? "▲ Hide Advanced" : "▾ Advanced Settings"}
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Quality</Label>
                  <Select value={quality} onValueChange={(v) => form.setValue("quality", v as any)}>
                    <SelectTrigger className="bg-[#050508] border-white/10 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#080b14] border-white/10">
                      {["standard", "hd", "full_hd", "4k"].map((q) => (
                        <SelectItem key={q} value={q}>{q.replace("_", " ").toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Negative Prompt</Label>
                  <Textarea
                    className="bg-[#050508] border-white/10 text-xs min-h-[72px] resize-none"
                    {...form.register("negativePrompt")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Seed (optional)</Label>
                  <Input
                    type="number"
                    className="bg-[#050508] border-white/10 text-xs h-8"
                    {...form.register("seed", { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}

            {/* Generate button */}
            <div className="pt-2">
              <Button
                onClick={form.handleSubmit(onSubmit)}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-base rounded-xl glow-button border-0 shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                disabled={generateMutation.isPending || !watchedPrompt}
              >
                {generateMutation.isPending
                  ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  : <Play className="mr-2 h-5 w-5 fill-current" />}
                Generate Video
              </Button>
              <p className="text-center text-[11px] text-slate-500 mt-2 font-medium">
                ~{creditEstimate} credits · {dur}s {quality.toUpperCase()} via {selectedProvider?.name ?? "Mock"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
