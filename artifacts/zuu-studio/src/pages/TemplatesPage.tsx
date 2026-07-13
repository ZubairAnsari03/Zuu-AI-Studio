import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, Sparkles, Film, Leaf, ShoppingBag, Swords, Smartphone, Skull, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  title: string;
  description: string;
  prompt: string;
  style: string;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5";
  duration: number;
  tags: string[];
  category: string;
}

const CATEGORIES = [
  { id: "all",         label: "All",           icon: <Sparkles size={14} /> },
  { id: "cinematic",   label: "Cinematic",     icon: <Film size={14} /> },
  { id: "animation",   label: "3D & Animation",icon: <Video size={14} /> },
  { id: "nature",      label: "Nature",        icon: <Leaf size={14} /> },
  { id: "product",     label: "Product",       icon: <ShoppingBag size={14} /> },
  { id: "fantasy",     label: "Fantasy & Sci-Fi", icon: <Swords size={14} /> },
  { id: "social",      label: "Social Media",  icon: <Smartphone size={14} /> },
  { id: "horror",      label: "Horror",        icon: <Skull size={14} /> },
];

const TEMPLATES: Template[] = [
  // ── Cinematic ──────────────────────────────────────────────────────────────
  {
    id: "c1", category: "cinematic", title: "Golden Hour Chase",
    description: "High-octane car chase through mountain roads at sunset",
    prompt: "Cinematic slow-motion car chase along winding mountain roads at golden hour, warm amber light, dust particles catching the setting sun, dramatic orchestral tension, IMAX film look, shallow depth of field, tracking shot",
    style: "cinematic", aspectRatio: "16:9", duration: 10,
    tags: ["action", "cars", "sunset", "dramatic"],
  },
  {
    id: "c2", category: "cinematic", title: "City Rain Walk",
    description: "A lone figure walks through neon-lit rain-soaked streets",
    prompt: "Cinematic rainy city night, lone figure with umbrella reflected in wet neon-lit pavement, Tokyo aesthetic, slow dolly shot, moody blue and pink palette, film grain, anamorphic lens flare, 4K hyperreal",
    style: "cinematic", aspectRatio: "16:9", duration: 10,
    tags: ["noir", "rain", "city", "moody"],
  },
  {
    id: "c3", category: "cinematic", title: "Desert Sunrise Reveal",
    description: "Epic drone reveal of a lone figure in a vast desert at dawn",
    prompt: "Aerial drone pull-back revealing vast orange desert dunes at sunrise, tiny lone figure at centre, long shadows, golden dust haze, sweeping orchestral score implied, cinematic color grade, ARRI film look",
    style: "cinematic", aspectRatio: "16:9", duration: 10,
    tags: ["desert", "drone", "epic", "sunrise"],
  },
  {
    id: "c4", category: "cinematic", title: "Underwater Ballet",
    description: "A dancer performs gracefully in crystal-clear ocean water",
    prompt: "Underwater cinematic shot, ballet dancer in flowing white dress, turquoise Caribbean water, light caustics rippling on the ocean floor, slow motion, dreamlike, 120fps slow-mo, crystal clarity, film score",
    style: "cinematic", aspectRatio: "16:9", duration: 10,
    tags: ["underwater", "dance", "dreamy"],
  },
  {
    id: "c5", category: "cinematic", title: "Skyscraper Storm",
    description: "Thunderstorm rolling over a glass-and-steel skyline",
    prompt: "Dramatic thunderstorm rolling over modern glass skyscraper skyline at dusk, lightning strikes in the distance, time-lapse style, deep purple and gold sky, reflections in the tower glass, cinematic wide shot",
    style: "cinematic", aspectRatio: "16:9", duration: 10,
    tags: ["storm", "city", "dramatic", "timelapse"],
  },

  // ── 3D & Animation ─────────────────────────────────────────────────────────
  {
    id: "a1", category: "animation", title: "Cute Dragon Adventure",
    description: "A tiny dragon explores a magical mushroom forest",
    prompt: "3D animated movie style, adorable small dragon with big eyes exploring a glowing mushroom forest, fireflies, warm magical lighting, Pixar quality, whimsical soundtrack, lush colours, shallow depth of field",
    style: "3d_animation", aspectRatio: "16:9", duration: 5,
    tags: ["dragon", "cute", "magic", "pixar"],
  },
  {
    id: "a2", category: "animation", title: "Space Robot Journey",
    description: "A retro robot floats through a colourful nebula",
    prompt: "3D animated retro-futurist robot floating through a vibrant nebula, soft cel-shading, colorful cosmic clouds in pink and blue, zero gravity playful motion, Dreamworks animation quality, cheerful",
    style: "3d_animation", aspectRatio: "16:9", duration: 5,
    tags: ["robot", "space", "retro", "fun"],
  },
  {
    id: "a3", category: "animation", title: "Anime Sword Master",
    description: "A samurai performs a blazing sword strike at sunrise",
    prompt: "Anime cinematic style, lone samurai on a mountain peak at dawn performing a blazing sword strike, sakura petals in the air, speed lines, dramatic wind, Studio Ghibli meets Demon Slayer art style, epic orchestral",
    style: "anime", aspectRatio: "16:9", duration: 5,
    tags: ["samurai", "anime", "action", "japan"],
  },
  {
    id: "a4", category: "animation", title: "Claymation Kitchen",
    description: "Charming clay vegetables dancing in a cosy kitchen",
    prompt: "Claymation stop-motion style, adorable clay vegetables dancing on a kitchen counter, warm morning light, cheerful bouncy music implied, highly detailed clay textures, playful Aardman quality, cosy atmosphere",
    style: "claymation", aspectRatio: "16:9", duration: 5,
    tags: ["claymation", "cute", "cooking", "fun"],
  },

  // ── Nature & Wildlife ──────────────────────────────────────────────────────
  {
    id: "n1", category: "nature", title: "Humpback Whale Song",
    description: "Majestic humpback whale swimming in deep blue ocean",
    prompt: "Nature documentary style, massive humpback whale gliding through deep luminescent blue ocean, bioluminescent plankton trails, slow motion, BBC Planet Earth quality, ambient whale song implied, 8K underwater",
    style: "nature", aspectRatio: "16:9", duration: 10,
    tags: ["ocean", "whale", "documentary", "majestic"],
  },
  {
    id: "n2", category: "nature", title: "Cherry Blossom Storm",
    description: "A windstorm of cherry blossoms through a Japanese garden",
    prompt: "Slow-motion tornado of cherry blossom petals through a traditional Japanese garden, koi pond reflections, soft morning mist, pink and white petals filling the frame, dreamlike nature documentary, 4K",
    style: "nature", aspectRatio: "16:9", duration: 10,
    tags: ["japan", "spring", "petals", "dreamy"],
  },
  {
    id: "n3", category: "nature", title: "Aurora Borealis Timelapse",
    description: "Northern Lights dance over a frozen Icelandic lake",
    prompt: "Time-lapse of vibrant aurora borealis in greens and purples dancing over a perfectly still Icelandic glacier lake reflection, stars visible, snow-covered mountains silhouette, cold crisp night, awe-inspiring",
    style: "nature", aspectRatio: "16:9", duration: 10,
    tags: ["aurora", "iceland", "night", "spectacular"],
  },
  {
    id: "n4", category: "nature", title: "Rain Forest Canopy",
    description: "Aerial glide through the top of an Amazon rainforest canopy",
    prompt: "Smooth aerial glide through top of Amazon rainforest canopy at sunrise, mist rising, monkeys jumping between branches, exotic birds taking flight, lush green textures, cinematic nature documentary, BBC quality",
    style: "nature", aspectRatio: "16:9", duration: 10,
    tags: ["jungle", "aerial", "wildlife", "morning"],
  },

  // ── Product & Commercial ───────────────────────────────────────────────────
  {
    id: "p1", category: "product", title: "Luxury Watch Reveal",
    description: "A premium watch emerges from water droplets in slow motion",
    prompt: "Ultra-premium luxury watch advertisement, slow motion water droplets around gleaming watch face, macro lens, reflective surfaces, gold and black palette, dramatic studio lighting, 4K hyperrealism, Swiss craftsmanship",
    style: "product", aspectRatio: "16:9", duration: 5,
    tags: ["watch", "luxury", "slow-mo", "premium"],
  },
  {
    id: "p2", category: "product", title: "Sneaker Launch",
    description: "A limited-edition sneaker drops into frame with impact particles",
    prompt: "Cinematic sneaker commercial, limited edition shoe drops into frame in slow motion, explosion of colour particles and light streaks, dark studio, product hero shot, bold typography implied, streetwear energy, 4K",
    style: "product", aspectRatio: "16:9", duration: 5,
    tags: ["sneaker", "fashion", "hype", "drop"],
  },
  {
    id: "p3", category: "product", title: "Coffee Morning Ritual",
    description: "Warm and inviting coffee pour in a cosy morning kitchen",
    prompt: "Cosy lifestyle coffee commercial, slow-motion espresso pour into ceramic mug, steam rising, warm morning kitchen light, rustic wooden surfaces, bokeh background, aspirational simplicity, soft film look",
    style: "product", aspectRatio: "16:9", duration: 5,
    tags: ["coffee", "lifestyle", "cosy", "morning"],
  },
  {
    id: "p4", category: "product", title: "Perfume Crystalline",
    description: "A perfume bottle shatters into sparkling crystals",
    prompt: "High-end perfume commercial, crystalline glass bottle shatters into a million sparkling light fragments in slow motion, dark luxury background, warm amber and gold tones, particle simulation, editorial fashion",
    style: "product", aspectRatio: "9:16", duration: 5,
    tags: ["perfume", "luxury", "crystals", "editorial"],
  },

  // ── Fantasy & Sci-Fi ──────────────────────────────────────────────────────
  {
    id: "f1", category: "fantasy", title: "Dragon Over Castle",
    description: "An ancient dragon soars over a medieval castle at sunset",
    prompt: "Fantasy epic, colossal fire-breathing dragon with iridescent scales soaring over a medieval stone castle at dramatic sunset, thunderclouds, orange light catching the wings, sweeping cinematic camera, Game of Thrones scale",
    style: "fantasy", aspectRatio: "16:9", duration: 10,
    tags: ["dragon", "castle", "epic", "fantasy"],
  },
  {
    id: "f2", category: "fantasy", title: "Neon Cyberpunk Street",
    description: "Rain-slicked cyberpunk alley packed with holographic ads",
    prompt: "Cyberpunk futuristic rain-drenched alley, holographic advertisements in Japanese and English reflecting in puddles, augmented reality overlays, neon pink and cyan, crowded with future fashion pedestrians, Blade Runner aesthetic",
    style: "scifi", aspectRatio: "16:9", duration: 10,
    tags: ["cyberpunk", "neon", "future", "rain"],
  },
  {
    id: "f3", category: "fantasy", title: "Space Station Docking",
    description: "A sleek spacecraft docks with an orbital station over Earth",
    prompt: "Hard sci-fi cinematic, sleek matte-black spacecraft slowly docking with a ring-shaped orbital station, Earth's curvature and cloud patterns below, sunlight gleaming off solar panels, silent vacuum, NASA-quality realism",
    style: "scifi", aspectRatio: "16:9", duration: 10,
    tags: ["space", "spacecraft", "future", "realistic"],
  },
  {
    id: "f4", category: "fantasy", title: "Enchanted Forest Portal",
    description: "A glowing magical portal opens in an ancient oak forest",
    prompt: "Fantasy magical portal of swirling teal and gold energy materialises between ancient oak trees in a misty forest, fireflies, ferns, soft diffused light, mysterious hooded figure approaching, dreamlike, ethereal atmosphere",
    style: "fantasy", aspectRatio: "16:9", duration: 10,
    tags: ["portal", "magic", "forest", "mystery"],
  },
  {
    id: "f5", category: "fantasy", title: "Ancient Sea Monster",
    description: "A kraken rises from the stormy ocean at night",
    prompt: "Epic fantasy, colossal kraken rising from stormy black ocean at night, bioluminescent tentacles catching lightning strikes, wooden tall-ship silhouette, massive scale, cinematic horror beauty, 8K",
    style: "fantasy", aspectRatio: "16:9", duration: 10,
    tags: ["kraken", "ocean", "monster", "epic"],
  },

  // ── Social Media ──────────────────────────────────────────────────────────
  {
    id: "s1", category: "social", title: "Viral Food ASMR",
    description: "Satisfying close-up food preparation for social media",
    prompt: "Social media viral ASMR food video, extreme close-up of knife slicing through perfectly ripe mango revealing bright orange flesh, satisfying texture, soft studio lighting, clean white background, 9:16 vertical format, trending",
    style: "social", aspectRatio: "9:16", duration: 5,
    tags: ["food", "asmr", "trending", "satisfying"],
  },
  {
    id: "s2", category: "social", title: "Gym Motivation Reel",
    description: "High-energy gym workout montage for fitness content",
    prompt: "High-energy fitness social media reel, athlete performing explosive barbell lift in moody dark gym, slow-motion sweat drops, dramatic backlighting, motivational energy, hard rock music implied, vertical 9:16, Gen Z aesthetic",
    style: "social", aspectRatio: "9:16", duration: 5,
    tags: ["fitness", "gym", "motivation", "reel"],
  },
  {
    id: "s3", category: "social", title: "Travel Wanderlust",
    description: "Dreamy travel montage of iconic global landmarks",
    prompt: "Dreamy travel vlog social media content, smooth gimbal shots of Santorini white-and-blue architecture at golden hour, happy couple, warm summer tones, smooth transitions implied, aspirational lifestyle, 9:16 vertical",
    style: "cinematic", aspectRatio: "9:16", duration: 5,
    tags: ["travel", "greece", "lifestyle", "vlog"],
  },
  {
    id: "s4", category: "social", title: "Aesthetic Desk Setup",
    description: "Lo-fi aesthetic desk setup reveal for creators",
    prompt: "Lo-fi aesthetic creator desk setup tour, clean minimal white desk, warm fairy lights, mechanical keyboard, studio monitor glow, smooth pan reveal, steam from coffee cup, cosy evening light, satisfying organized vibe, 9:16",
    style: "product", aspectRatio: "9:16", duration: 5,
    tags: ["aesthetic", "desk", "lofi", "creator"],
  },

  // ── Horror ────────────────────────────────────────────────────────────────
  {
    id: "h1", category: "horror", title: "Haunted Hallway",
    description: "A shadow figure appears at the end of a flickering hotel corridor",
    prompt: "Psychological horror, long dimly-lit hotel corridor with flickering overhead fluorescent light, dark shadowy figure appearing at the far end slowly moving closer, handheld camera shake, muffled heartbeat pulse, cold blue tones",
    style: "horror", aspectRatio: "16:9", duration: 10,
    tags: ["horror", "shadow", "suspense", "atmosphere"],
  },
  {
    id: "h2", category: "horror", title: "Fog-Shrouded Forest",
    description: "Something moves between the trees in a night-fog forest",
    prompt: "Horror cinematic, dense pine forest at dead of night, thick ground fog, flashlight beam cutting through darkness, branches snapping sound implied, glimpse of pale figure between trees, found-footage handheld style, dread",
    style: "horror", aspectRatio: "16:9", duration: 10,
    tags: ["forest", "night", "creature", "dread"],
  },
  {
    id: "h3", category: "horror", title: "Abandoned Hospital",
    description: "Eerie abandoned hospital corridor with a swinging gurney",
    prompt: "Gothic horror, overgrown abandoned hospital corridor, moonlight through broken windows, gurney slowly rolling down empty hall on its own, peeling paint, clinical decay, long shadows, whisper on the wind, terrifying stillness",
    style: "horror", aspectRatio: "16:9", duration: 10,
    tags: ["hospital", "abandoned", "gothic", "eerie"],
  },
];

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return TEMPLATES.filter((t) => {
      const matchCat = category === "all" || t.category === category;
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q));
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const useTemplate = (t: Template) => {
    localStorage.setItem(
      "zuu_studio_prefill",
      JSON.stringify({
        prompt: t.prompt,
        style: t.style,
        aspectRatio: t.aspectRatio,
        duration: t.duration,
      }),
    );
    toast({ title: "Template loaded", description: "Opening Studio…" });
    setLocation("/studio");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Prompt Templates</h1>
          <p className="text-slate-400 mt-1">
            {TEMPLATES.length} curated cinematic prompts — click any to open in Studio
          </p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <Input
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#050508] border-white/10 h-10"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              category === cat.id
                ? "bg-purple-600/20 border-purple-500 text-purple-300"
                : "bg-white/5 border-white/10 text-slate-400 hover:border-white/25 hover:text-white"
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="glass-card p-5 rounded-2xl flex flex-col border border-white/5 hover:border-purple-500/30 transition-all group hover:shadow-[0_0_16px_rgba(124,58,237,0.12)]"
            >
              {/* Title + style pill */}
              <div className="flex items-start justify-between mb-3 gap-2">
                <h3 className="font-bold text-base leading-tight">{t.title}</h3>
                <span className="text-[10px] uppercase bg-purple-600/15 border border-purple-500/30 px-2 py-0.5 rounded text-purple-400 whitespace-nowrap shrink-0 font-medium">
                  {t.style.replace("_", " ")}
                </span>
              </div>

              <p className="text-sm text-slate-400 mb-3">{t.description}</p>

              {/* Prompt preview */}
              <div className="bg-[#050508] p-3 rounded-xl border border-white/5 mb-4 flex-1">
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-4 font-mono">
                  {t.prompt}
                </p>
              </div>

              {/* Tags + meta */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1 flex-wrap">
                  {t.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-500 font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 ml-2 shrink-0">
                  <span>{t.aspectRatio}</span>
                  <span>·</span>
                  <span>{t.duration}s</span>
                </div>
              </div>

              {/* CTA — visible on hover */}
              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={() => useTemplate(t)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-9 text-sm"
                >
                  <Sparkles size={14} className="mr-2" />
                  Use in Studio
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-16 rounded-3xl text-center border-dashed border-2 border-white/10 flex flex-col items-center">
          <Search className="text-slate-500 mb-4" size={32} />
          <h3 className="text-xl font-bold mb-2">No templates found</h3>
          <p className="text-slate-400 mb-4">Try a different search or category.</p>
          <Button
            variant="outline"
            className="border-white/20"
            onClick={() => { setSearch(""); setCategory("all"); }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
