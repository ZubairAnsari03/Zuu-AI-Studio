import { useState } from "react";
import { 
  useGetAdminStats, 
  useListAdminUsers, 
  useListAdminJobs,
  useAdjustUserCredits
} from "@workspace/api-client-react";
import { Loader2, Users, Film, Activity, Database, DollarSign, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useListAdminUsers({ limit: 20 });
  const { data: jobsData, isLoading: jobsLoading } = useListAdminJobs();
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const adjustMutation = useAdjustUserCredits();
  const { toast } = useToast();

  const handleAdjustCredits = () => {
    if (!selectedUser || !creditAmount) return;
    
    adjustMutation.mutate({
      id: selectedUser.id,
      data: {
        amount: parseInt(creditAmount),
        description: "Admin manual adjustment"
      }
    }, {
      onSuccess: () => {
        toast({ title: "Credits adjusted successfully" });
        setSelectedUser(null);
        setCreditAmount("");
        refetchUsers();
      }
    });
  };

  if (statsLoading || usersLoading || jobsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="text-purple-500" /> Platform Admin
        </h1>
        <p className="text-slate-400 mt-1">Global statistics and user management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats?.totalUsers || 0, icon: <Users size={20} className="text-blue-400" /> },
          { label: "Total Generations", value: stats?.totalGenerations || 0, icon: <Film size={20} className="text-purple-400" /> },
          { label: "Active Jobs", value: stats?.activeGenerations || 0, icon: <Activity size={20} className="text-green-400" /> },
          { label: "Credits Burned", value: stats?.totalCreditsUsed || 0, icon: <Database size={20} className="text-yellow-400" /> }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 text-sm font-medium">{stat.label}</span>
              {stat.icon}
            </div>
            <span className="text-3xl font-bold text-white">{stat.value.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 rounded-2xl border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">User Management</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <Input className="bg-[#050508] border-white/10 pl-9 h-8 text-sm" placeholder="Search users..." />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-white/5">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Generations</th>
                    <th className="px-4 py-3">Credits</th>
                    <th className="px-4 py-3 rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {usersData?.items?.map(u => (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-4">
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-slate-300'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-300">{u.totalGenerations}</td>
                      <td className="px-4 py-4 text-slate-300 font-mono">{u.credits}</td>
                      <td className="px-4 py-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs border-white/20 bg-white/5"
                          onClick={() => setSelectedUser(u)}
                        >
                          <DollarSign size={14} className="mr-1" /> Adjust
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl border-white/5">
            <h2 className="text-xl font-bold mb-6">Recent Jobs</h2>
            <div className="space-y-4">
              {jobsData?.items?.map(job => (
                <div key={job.id} className="p-3 bg-[#050508] border border-white/5 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-slate-500">ID: {job.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      job.status === 'completed' ? 'text-green-400' :
                      job.status === 'processing' ? 'text-blue-400' :
                      job.status === 'failed' ? 'text-pink-500' : 'text-slate-400'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-1 mb-2">{job.prompt}</p>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{job.provider}</span>
                    <span>Cost: {job.creditsUsed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="bg-[#080b14] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Adjust Credits for {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-white/5 rounded-lg mb-4">
              <p className="text-sm text-slate-400 mb-1">Current Balance</p>
              <p className="text-2xl font-bold">{selectedUser?.credits}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Adjustment Amount (+/-)</label>
              <Input 
                type="number" 
                placeholder="e.g. 500 or -100" 
                className="bg-[#050508] border-white/10"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
            </div>
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
              onClick={handleAdjustCredits}
              disabled={adjustMutation.isPending || !creditAmount}
            >
              {adjustMutation.isPending && <Loader2 size={16} className="animate-spin mr-2"/>}
              Apply Adjustment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
