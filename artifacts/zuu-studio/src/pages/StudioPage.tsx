import { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  useListProviders, 
  useGenerateVideo, 
  useEnhancePrompt,
  useSavePrompt,
  useGetCredits,
  useListCharacters
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Wand2, Zap, Save, Film, Settings2, Image as ImageIcon, 
  Play, StopCircle, RefreshCw, Loader2, CreditCard
} from "lucide-react";
import GenerationProgress from "@/components/studio/GenerationProgress";

const STYLES = [
  { id: "cinematic", name: "Cinematic Realistic", emoji: "🎥" },
  { id: "3d_animation", name: "3D Animated Movie", emoji: "🦄" },
  { id: "anime", name: "Anime", emoji: "🌸" },
  { id: "fantasy", name: "Fantasy", emoji: "🐉" },
  { id: "claymation", name: "Clay Animation", emoji: "🧸" },
  { id: "photorealistic", name: "Photorealistic", emoji: "📸" },
  { id: "product", name: "Product Ad", emoji: "👟" },
  { id: "nature", name: "Nature Doc", emoji: "🌿" },
  { id: "horror", name: "Horror Cinematic", emoji: "🧟" },
  { id: "scifi", name: "Sci-Fi", emoji: "🛸" },
  { id: "social", name: "Social Media Viral", emoji: "📱" },
  { id: "cartoon", name: "Cute Cartoon", emoji: "🎨" }
];

const formSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  enhancedPrompt: z.string().optional(),
  negativePrompt: z.string().optional(),
  style: z.string(),
  aspectRatio: z.enum(["9:16", "16:9", "1:1", "4:5"]),
  duration: z.number(),
  quality: z.enum(["standard", "hd", "full_hd", "4k"]),
  cameraMovement: z.string().optional(),
  lighting: z.string().optional(),
  motionStrength: z.enum(["low", "medium", "high"]),
  provider: z.string().optional(),
  characterProfileId: z.number().optional().nullable(),
  seed: z.number().optional().nullable(),
  referenceImageUrl: z.string().optional().nullable()
});

export default function StudioPage() {
  const { toast } = useToast();
  const [activeGenerationId, setActiveGenerationId] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { data: providersData } = useListProviders();
  const { data: creditsData } = useGetCredits();
  const { data: charactersData } = useListCharacters();
  
  const generateMutation = useGenerateVideo();
  const enhanceMutation = useEnhancePrompt();
  const savePromptMutation = useSavePrompt();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      style: "cinematic",
      aspectRatio: "16:9",
      duration: 5,
      quality: "hd",
      motionStrength: "medium",
      negativePrompt: "ugly, blurry, deformed, low resolution, bad anatomy, bad hands, bad lighting, grainy, worst quality, watermark, text"
    }
  });

  const handleEnhance = async () => {
    const currentPrompt = form.getValues("prompt");
    if (!currentPrompt) return;
    
    enhanceMutation.mutate({
      data: {
        prompt: currentPrompt,
        style: form.getValues("style"),
        aspectRatio: form.getValues("aspectRatio")
      }
    }, {
      onSuccess: (data) => {
        form.setValue("enhancedPrompt", data.enhancedPrompt);
        form.setValue("negativePrompt", data.negativePrompt);
        toast({ title: "Prompt enhanced!", description: "Applied LLM magic to your vision." });
      }
    });
  };

  const handleSavePrompt = () => {
    const prompt = form.getValues("enhancedPrompt") || form.getValues("prompt");
    if (!prompt) return;
    
    savePromptMutation.mutate({
      data: {
        title: prompt.substring(0, 30) + "...",
        prompt: form.getValues("prompt"),
        enhancedPrompt: form.getValues("enhancedPrompt"),
        style: form.getValues("style")
      }
    }, {
      onSuccess: () => toast({ title: "Prompt saved to library" })
    });
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    generateMutation.mutate({
      data: {
        ...values,
        duration: values.duration as any,
      }
    }, {
      onSuccess: (data) => {
        setActiveGenerationId(data.id);
        toast({ title: "Generation started", description: "Your video is queued for processing." });
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Failed to start", description: error.message || "Something went wrong." });
      }
    });
  };

  if (activeGenerationId) {
    return <GenerationProgress videoId={activeGenerationId} onReset={() => setActiveGenerationId(null)} />;
  }

  const providers = providersData || [];
  const defaultProvider = providers.find(p => p.enabled)?.id;
  
  if (defaultProvider && !form.getValues("provider")) {
    form.setValue("provider", defaultProvider);
  }

  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Studio</h1>
          <p className="text-slate-400 mt-1">Configure your cinematic parameters and generate.</p>
        </div>
        <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 border-purple-500/30">
          <CreditCard size={16} className="text-purple-400" />
          <span className="font-bold">{creditsData?.balance || 0} Credits remaining</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-8">
          {/* Prompt Section */}
          <section className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <Wand2 className="text-purple-400" size={20} />
                Vision
              </Label>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="bg-white/5 border-white/10 hover:bg-white/10 hover:text-white h-8"
                  onClick={handleEnhance}
                  disabled={enhanceMutation.isPending || !form.watch("prompt")}
                >
                  {enhanceMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Zap size={14} className="mr-2 text-yellow-400" />}
                  Enhance Prompt
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-white/10 h-8"
                  onClick={handleSavePrompt}
                  disabled={savePromptMutation.isPending || !form.watch("prompt")}
                >
                  <Save size={14} />
                </Button>
              </div>
            </div>

            <Textarea 
              placeholder="Describe your video scene, characters, environment, camera movement, lighting and action..."
              className="min-h-[120px] bg-[#050508] border-white/10 text-lg resize-y placeholder:text-slate-600 focus-visible:ring-purple-500 focus-visible:border-purple-500"
              {...form.register(form.watch("enhancedPrompt") ? "enhancedPrompt" : "prompt")}
              onChange={(e) => {
                if (form.watch("enhancedPrompt")) {
                  form.setValue("enhancedPrompt", e.target.value);
                } else {
                  form.setValue("prompt", e.target.value);
                }
              }}
            />
            
            {charactersData && charactersData.length > 0 && (
              <div className="flex items-center gap-3 bg-[#050508] p-3 rounded-xl border border-white/5">
                <Label className="text-sm text-slate-400 whitespace-nowrap">Inject Character:</Label>
                <Select onValueChange={(val) => form.setValue("characterProfileId", parseInt(val))}>
                  <SelectTrigger className="bg-white/5 border-none h-8 text-sm">
                    <SelectValue placeholder="Select a saved character..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#080b14] border-white/10">
                    <SelectItem value="none">None</SelectItem>
                    {charactersData.map(char => (
                      <SelectItem key={char.id} value={char.id.toString()}>{char.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </section>

          {/* Style Selector */}
          <section className="space-y-4">
            <Label className="text-lg font-semibold flex items-center gap-2">
              <Film className="text-purple-400" size={20} />
              Aesthetic Style
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STYLES.map(style => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => form.setValue("style", style.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    form.watch("style") === style.id 
                    ? "bg-purple-600/20 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
                    : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20 hover:text-slate-200"
                  }`}
                >
                  <span className="text-2xl mb-2 block">{style.emoji}</span>
                  <span className="text-xs font-medium text-center">{style.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Reference Image */}
          <section className="glass-card p-6 rounded-2xl space-y-4">
             <div className="flex justify-between items-center mb-2">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="text-purple-400" size={20} />
                Reference Image (Optional)
              </Label>
            </div>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center bg-[#050508] hover:bg-white/5 hover:border-purple-500/30 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <ImageIcon className="text-slate-400 group-hover:text-purple-400 transition-colors" size={24} />
              </div>
              <p className="text-sm font-medium mb-1">Click or drag image here</p>
              <p className="text-xs text-slate-500">Supports PNG, JPG, WEBP. Subject to provider support.</p>
            </div>
          </section>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl space-y-6 sticky top-24">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-white/10 pb-4">
              <Settings2 className="text-purple-400" size={20} />
              Parameters
            </h3>

            <div className="space-y-3">
              <Label className="text-sm text-slate-400">Aspect Ratio</Label>
              <div className="grid grid-cols-4 gap-2">
                {["16:9", "9:16", "1:1", "4:5"].map(ratio => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => form.setValue("aspectRatio", ratio as any)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                      form.watch("aspectRatio") === ratio
                      ? "bg-purple-600/20 border-purple-500 text-white"
                      : "bg-[#050508] border-white/10 text-slate-400 hover:border-white/30"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm text-slate-400">Duration</Label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map(dur => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => form.setValue("duration", dur)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                      form.watch("duration") === dur
                      ? "bg-purple-600/20 border-purple-500 text-white"
                      : "bg-[#050508] border-white/10 text-slate-400 hover:border-white/30"
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm text-slate-400">Motion Strength</Label>
                <span className="text-xs font-medium text-purple-400 uppercase">{form.watch("motionStrength")}</span>
              </div>
              <Controller
                control={form.control}
                name="motionStrength"
                render={({ field }) => (
                  <Slider 
                    min={0} max={2} step={1} 
                    value={[field.value === 'low' ? 0 : field.value === 'medium' ? 1 : 2]} 
                    onValueChange={(vals) => {
                      const v = vals[0] === 0 ? 'low' : vals[0] === 1 ? 'medium' : 'high';
                      field.onChange(v);
                    }}
                    className="py-4"
                  />
                )}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm text-slate-400">Camera Movement</Label>
              <Select onValueChange={(v) => form.setValue("cameraMovement", v)}>
                <SelectTrigger className="bg-[#050508] border-white/10">
                  <SelectValue placeholder="Auto (let AI decide)" />
                </SelectTrigger>
                <SelectContent className="bg-[#080b14] border-white/10">
                  <SelectItem value="none">Auto (let AI decide)</SelectItem>
                  <SelectItem value="static">Static Shot</SelectItem>
                  <SelectItem value="pan_left">Pan Left</SelectItem>
                  <SelectItem value="pan_right">Pan Right</SelectItem>
                  <SelectItem value="zoom_in">Slow Zoom In</SelectItem>
                  <SelectItem value="zoom_out">Slow Zoom Out</SelectItem>
                  <SelectItem value="tracking">Tracking Shot</SelectItem>
                  <SelectItem value="drone">Drone Shot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button 
                onClick={() => setShowAdvanced(!showAdvanced)} 
                variant="ghost" 
                className="w-full text-xs text-slate-400 hover:text-white"
              >
                {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}
              </Button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Provider Model</Label>
                  <Select 
                    value={form.watch("provider") || defaultProvider} 
                    onValueChange={(v) => form.setValue("provider", v)}
                  >
                    <SelectTrigger className="bg-[#050508] border-white/10 h-8 text-xs">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#080b14] border-white/10">
                      {providers.map(p => (
                        <SelectItem key={p.id} value={p.id} disabled={!p.enabled}>
                          {p.name} {p.isMock ? "(Mock)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Negative Prompt</Label>
                  <Textarea 
                    className="bg-[#050508] border-white/10 text-xs min-h-[80px]"
                    {...form.register("negativePrompt")}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-slate-400">Seed (optional)</Label>
                  <Input 
                    type="number" 
                    className="bg-[#050508] border-white/10 text-xs h-8"
                    {...form.register("seed", { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}

            <div className="pt-6">
              <Button 
                onClick={form.handleSubmit(onSubmit)}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg rounded-xl glow-button border-0 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                disabled={generateMutation.isPending || !form.watch("prompt")}
              >
                {generateMutation.isPending ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <Play className="mr-2 h-6 w-6 fill-current" />
                )}
                Generate Video
              </Button>
              <p className="text-center text-xs text-slate-500 mt-3 font-medium">
                Estimated cost: ~10 Credits
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
