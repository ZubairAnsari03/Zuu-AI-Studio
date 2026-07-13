import { useState, useMemo } from "react";
import { useListCharacters, useCreateCharacter, useDeleteCharacter } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, Trash2, Search, Save, Loader2, Send,
} from "lucide-react";
import { useLocation } from "wouter";

// ── Schema ───────────────────────────────────────────────────────────────────

const charSchema = z.object({
  name:              z.string().min(1, "Name required"),
  age:               z.string().optional(),
  gender:            z.string().optional(),
  bodyType:          z.string().optional(),
  faceDescription:   z.string().optional(),
  hair:              z.string().optional(),
  clothes:           z.string().optional(),
  consistencyNotes:  z.string().optional(),
});

type CharForm = z.infer<typeof charSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildConsistencyPrompt(char: CharForm): string {
  const parts: string[] = [];
  if (char.gender)          parts.push(char.gender);
  if (char.age)             parts.push(`age ${char.age}`);
  if (char.bodyType)        parts.push(char.bodyType);
  if (char.faceDescription) parts.push(char.faceDescription);
  if (char.hair)            parts.push(`hair: ${char.hair}`);
  if (char.clothes)         parts.push(`wearing ${char.clothes}`);
  if (char.consistencyNotes) parts.push(char.consistencyNotes);
  return parts.join(", ");
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CharactersPage() {
  const { data, isLoading, refetch } = useListCharacters();
  const createMutation = useCreateCharacter();
  const deleteMutation = useDeleteCharacter();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const form = useForm<CharForm>({
    resolver: zodResolver(charSchema),
    defaultValues: { name: "", age: "", gender: "", bodyType: "", faceDescription: "", hair: "", clothes: "", consistencyNotes: "" },
  });

  const characters = data ?? [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return characters;
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.faceDescription ?? "").toLowerCase().includes(q) ||
        (c.hair ?? "").toLowerCase().includes(q) ||
        (c.clothes ?? "").toLowerCase().includes(q),
    );
  }, [characters, search]);

  const onSubmit = (values: CharForm) => {
    createMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: "Character saved" });
          form.reset();
          setIsOpen(false);
          refetch();
        },
        onError: () => toast({ variant: "destructive", title: "Failed to create character" }),
      },
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this character profile?")) return;
    deleteMutation.mutate({ id }, {
      onSuccess: () => { toast({ title: "Character deleted" }); refetch(); },
    });
  };

  /** Inject this character's description into Studio prompt via localStorage. */
  const sendToStudio = (char: typeof characters[0]) => {
    const prompt = buildConsistencyPrompt(char as unknown as CharForm);
    localStorage.setItem("zuu_studio_prefill", JSON.stringify({
      prompt: `A scene featuring ${char.name}: ${prompt}`,
      characterProfileId: char.id,
    }));
    toast({ title: `${char.name} loaded into Studio` });
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
          <h1 className="text-3xl font-bold">Character Library</h1>
          <p className="text-slate-400 mt-1">
            Save character profiles for consistent faces and styles across generations.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 gap-2 glow-button shrink-0">
              <Plus size={16} /> New Character
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#080b14] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Character Profile</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "name",     label: "Name / Identifier" },
                    { name: "age",      label: "Age / Apparent Age" },
                    { name: "gender",   label: "Gender / Presentation" },
                    { name: "bodyType", label: "Body Type" },
                  ].map(({ name, label }) => (
                    <FormField key={name} control={form.control} name={name as keyof CharForm} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-400 text-xs uppercase tracking-wider">{label}</FormLabel>
                        <FormControl>
                          <Input className="bg-[#050508] border-white/10 h-9" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ))}
                </div>

                {[
                  { name: "faceDescription", label: "Facial Features (be highly descriptive)", placeholder: "Sharp jawline, deep-set blue eyes, freckled skin, high cheekbones…" },
                  { name: "hair",            label: "Hair Style & Color",                       placeholder: "Wavy auburn hair, shoulder-length, slight curl at ends…" },
                  { name: "clothes",         label: "Default Outfit / Style",                   placeholder: "Black tactical jacket, cargo pants, worn leather boots…" },
                  { name: "consistencyNotes",label: "AI Consistency Keywords",                  placeholder: "e.g. cinematic lighting, photorealistic, hyper-detailed features" },
                ].map(({ name, label, placeholder }) => (
                  <FormField key={name} control={form.control} name={name as keyof CharForm} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-400 text-xs uppercase tracking-wider">{label}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={placeholder}
                          className="bg-[#050508] border-white/10 min-h-[72px] resize-none text-sm placeholder:text-slate-600"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                ))}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-white/20">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                    {createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    Save Character
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      {characters.length > 3 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <Input
            placeholder="Search characters…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#050508] border-white/10 h-9"
          />
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((char) => (
            <div
              key={char.id}
              className="glass-card p-5 rounded-2xl flex flex-col border border-white/5 hover:border-purple-500/25 transition-all group"
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-900/60 to-pink-900/60 border border-purple-500/20 flex items-center justify-center overflow-hidden shrink-0">
                  {char.referenceImageUrl ? (
                    <img src={char.referenceImageUrl} alt={char.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-purple-300">
                      {char.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold truncate">{char.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {char.age    && <span className="text-[9px] uppercase bg-white/5 px-2 py-0.5 rounded text-slate-400 font-medium">{char.age}</span>}
                    {char.gender && <span className="text-[9px] uppercase bg-white/5 px-2 py-0.5 rounded text-slate-400 font-medium">{char.gender}</span>}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2.5 text-sm flex-1">
                {char.faceDescription && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider block mb-0.5">Face</span>
                    <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed">{char.faceDescription}</p>
                  </div>
                )}
                {(char.hair || char.clothes) && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider block mb-0.5">Look</span>
                    <p className="text-slate-300 text-xs line-clamp-1">
                      {[char.hair, char.clothes].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                )}
                {char.consistencyNotes && (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider block mb-0.5">Keywords</span>
                    <p className="text-slate-500 text-xs line-clamp-1 font-mono">{char.consistencyNotes}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-500 hover:text-pink-400 hover:bg-pink-500/10 h-8 gap-1.5 text-xs"
                  onClick={() => handleDelete(char.id)}
                >
                  <Trash2 size={13} /> Delete
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-600/80 hover:bg-purple-600 text-white h-8 gap-1.5 text-xs"
                  onClick={() => sendToStudio(char)}
                >
                  <Send size={13} /> Use in Studio
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-16 rounded-3xl text-center border-dashed border-2 border-white/10 bg-transparent flex flex-col items-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Users className="text-slate-600" size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-3">
            {search ? "No characters found" : "Character Library Empty"}
          </h3>
          <p className="text-slate-400 mb-8 max-w-md text-sm">
            {search
              ? "No characters match your search. Try different keywords."
              : "Create character profiles to maintain consistent faces, styles, and outfits across all your video generations."}
          </p>
          {search ? (
            <Button variant="outline" className="border-white/20" onClick={() => setSearch("")}>
              Clear Search
            </Button>
          ) : (
            <Button onClick={() => setIsOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 glow-button gap-2">
              <Plus size={16} /> Create First Character
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
