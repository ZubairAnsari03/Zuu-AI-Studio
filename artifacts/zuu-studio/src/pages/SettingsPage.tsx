import { useAuth } from "@/context/AuthContext";
import { useUpdateProfile, useListProviders } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Key, Server, AlertTriangle } from "lucide-react";
import { useEffect } from "react";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const updateMutation = useUpdateProfile();
  const { data: providersData } = useListProviders();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      avatarUrl: "",
    }
  });

  // Init form when user loads
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, form]);

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateMutation.mutate({ 
      data: {
        name: values.name,
        avatarUrl: values.avatarUrl || null
      } 
    }, {
      onSuccess: (data) => {
        updateUser(data);
        toast({ title: "Profile updated successfully" });
      }
    });
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account preferences and integrations.</p>
      </div>

      <div className="space-y-6">
        <section className="glass-card p-6 md:p-8 rounded-3xl border-white/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <User className="text-purple-400" size={20} /> Profile Information
          </h2>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-24 h-24 rounded-full bg-[#050508] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-slate-600">{user?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            <div className="flex-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-400">Display Name</FormLabel>
                        <FormControl>
                          <Input className="bg-[#050508] border-white/10 max-w-md" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-400">Avatar URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." className="bg-[#050508] border-white/10 max-w-md" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-2">
                    <Button type="submit" disabled={updateMutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
                      {updateMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </section>

        <section className="glass-card p-6 md:p-8 rounded-3xl border-white/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Key className="text-purple-400" size={20} /> Security
          </h2>
          <div className="space-y-4 max-w-md">
            <div className="space-y-2">
              <FormLabel className="text-slate-400">Email Address</FormLabel>
              <Input value={user?.email || ""} disabled className="bg-[#050508] border-white/10 text-slate-400" />
            </div>
            <Button variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10 mt-4">
              Change Password
            </Button>
          </div>
        </section>

        <section className="glass-card p-6 md:p-8 rounded-3xl border-white/5">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Server className="text-purple-400" size={20} /> AI Providers
          </h2>
          <p className="text-slate-400 mb-6 text-sm">
            These are the AI generation backends currently active on the platform. Admins control configuration.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {providersData?.map(provider => (
              <div key={provider.id} className="p-4 rounded-xl border border-white/10 bg-[#050508] flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-200">{provider.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{provider.isMock ? "Mock Mode" : "Production Mode"}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${provider.enabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                  {provider.enabled ? 'Active' : 'Disabled'}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-red-500/20 bg-red-500/5 p-6 md:p-8 rounded-3xl">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">
            <AlertTriangle size={20} /> Danger Zone
          </h2>
          <p className="text-slate-400 mb-6 text-sm">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
            Delete Account
          </Button>
        </section>
      </div>
    </div>
  );
}
