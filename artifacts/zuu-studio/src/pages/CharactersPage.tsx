import { useState } from "react";
import { useListCharacters, useDeleteCharacter, useCreateCharacter } from "@workspace/api-client-react";
import { Loader2, Plus, Users, Trash2, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const charSchema = z.object({
  name: z.string().min(1, "Name is required"),
  gender: z.string().optional(),
  age: z.string().optional(),
  faceDescription: z.string().optional(),
  hair: z.string().optional(),
  clothes: z.string().optional(),
  bodyType: z.string().optional(),
  personality: z.string().optional(),
  consistencyNotes: z.string().optional(),
});

export default function CharactersPage() {
  const { data, isLoading, refetch } = useListCharacters();
  const deleteMutation = useDeleteCharacter();
  const createMutation = useCreateCharacter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<z.infer<typeof charSchema>>({
    resolver: zodResolver(charSchema),
    defaultValues: {
      name: "",
      gender: "",
      age: "",
      faceDescription: "",
      hair: "",
      clothes: "",
      bodyType: "",
      personality: "",
      consistencyNotes: "",
    }
  });

  const onSubmit = (values: z.infer<typeof charSchema>) => {
    createMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Character profile saved" });
        setIsOpen(false);
        form.reset();
        refetch();
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this character profile?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Character deleted" });
          refetch();
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const characters = data || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Characters</h1>
          <p className="text-slate-400 mt-1">Maintain consistency across scenes</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 glow-button">
              <Plus size={18} className="mr-2" /> Create Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#080b14] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">New Character Profile</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Name / ID</FormLabel><FormControl><Input className="bg-[#050508] border-white/10" {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem><FormLabel>Age / Apparent Age</FormLabel><FormControl><Input className="bg-[#050508] border-white/10" {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem><FormLabel>Gender / Presentation</FormLabel><FormControl><Input className="bg-[#050508] border-white/10" {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                  <FormField control={form.control} name="bodyType" render={({ field }) => (
                    <FormItem><FormLabel>Body Type</FormLabel><FormControl><Input className="bg-[#050508] border-white/10" {...field} /></FormControl><FormMessage/></FormItem>
                  )} />
                </div>
                
                <FormField control={form.control} name="faceDescription" render={({ field }) => (
                  <FormItem><FormLabel>Facial Features (be highly descriptive)</FormLabel><FormControl><Textarea className="bg-[#050508] border-white/10 h-20" {...field} /></FormControl><FormMessage/></FormItem>
                )} />
                <FormField control={form.control} name="hair" render={({ field }) => (
                  <FormItem><FormLabel>Hair Style & Color</FormLabel><FormControl><Input className="bg-[#050508] border-white/10" {...field} /></FormControl><FormMessage/></FormItem>
                )} />
                <FormField control={form.control} name="clothes" render={({ field }) => (
                  <FormItem><FormLabel>Default Outfit / Style</FormLabel><FormControl><Input className="bg-[#050508] border-white/10" {...field} /></FormControl><FormMessage/></FormItem>
                )} />
                <FormField control={form.control} name="consistencyNotes" render={({ field }) => (
                  <FormItem><FormLabel>Keywords for AI Consistency</FormLabel><FormControl><Textarea placeholder="e.g. detailed green eyes, sharp jawline, cinematic lighting" className="bg-[#050508] border-white/10" {...field} /></FormControl><FormMessage/></FormItem>
                )} />
                
                <div className="flex justify-end gap-3 pt-6 border-t border-white/10 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="border-white/20">Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
                    {createMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2"/> : <Save size={16} className="mr-2" />} Save Profile
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {characters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map(char => (
            <div key={char.id} className="glass-card p-6 rounded-3xl relative group overflow-hidden border border-white/5 hover:border-purple-500/30 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button size="icon" variant="ghost" className="h-8 w-8 bg-white/10 hover:bg-pink-500/20 hover:text-pink-400 text-slate-300" onClick={() => handleDelete(char.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30 flex items-center justify-center overflow-hidden">
                  {char.referenceImageUrl ? (
                    <img src={char.referenceImageUrl} alt={char.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="text-purple-400" size={28} />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{char.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {char.age && <span className="text-[10px] uppercase bg-white/5 px-2 py-0.5 rounded text-slate-400">{char.age}</span>}
                    {char.gender && <span className="text-[10px] uppercase bg-white/5 px-2 py-0.5 rounded text-slate-400">{char.gender}</span>}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                {char.faceDescription && (
                  <div>
                    <span className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-1">Face</span>
                    <p className="text-slate-300 line-clamp-2">{char.faceDescription}</p>
                  </div>
                )}
                {(char.hair || char.clothes) && (
                  <div>
                    <span className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-1">Look</span>
                    <p className="text-slate-300 line-clamp-1">{char.hair}{char.hair && char.clothes ? ' • ' : ''}{char.clothes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-16 rounded-3xl text-center border-dashed border-2 border-white/10 bg-transparent flex flex-col items-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Users className="text-slate-500" size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-3">No Characters</h3>
          <p className="text-slate-400 mb-8 max-w-md">
            Create character profiles to maintain consistent faces, clothing, and styles across different video generations.
          </p>
          <Button onClick={() => setIsOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 glow-button">
            Create First Character
          </Button>
        </div>
      )}
    </div>
  );
}
