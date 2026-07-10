import { useGetCredits } from "@workspace/api-client-react";
import { Loader2, CreditCard, ArrowUpRight, ArrowDownRight, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreditsPage() {
  const { data, isLoading } = useGetCredits();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const balance = data?.balance || 0;
  const transactions = data?.transactions || [];

  return (
    <div className="space-y-12 pb-12">
      <div>
        <h1 className="text-3xl font-bold">Credits</h1>
        <p className="text-slate-400 mt-1">Manage your generative balance and subscriptions.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-8">
          <div className="glass-card p-8 md:p-12 rounded-3xl relative overflow-hidden border-purple-500/30 shadow-[0_0_30px_rgba(124,58,237,0.1)]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <CreditCard className="text-purple-400" />
              <h2 className="text-xl font-semibold">Available Balance</h2>
            </div>
            
            <div className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 relative z-10 text-gradient bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-purple-300">
              {balance.toLocaleString()}
            </div>
            
            <div className="flex flex-wrap gap-4 relative z-10">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 h-12 text-lg glow-button">
                Buy Credits
              </Button>
              <Button variant="outline" className="border-white/20 text-white rounded-full px-8 h-12 text-lg bg-white/5 hover:bg-white/10">
                View Pricing
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-6">Transaction History</h3>
            <div className="glass-card rounded-2xl overflow-hidden border-white/5">
              {transactions.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {transactions.map(tx => (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-slate-300'}`}>
                          {tx.type === 'credit' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{tx.description}</p>
                          <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className={`font-bold text-lg ${tx.type === 'credit' ? 'text-green-400' : 'text-slate-300'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  No transactions found.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl border-white/5 bg-[#080b14]">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Zap className="text-yellow-400" size={18} /> Pro Subscription
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Upgrade to Zuu Pro to get monthly credit refills, priority rendering queue, and 4K export capabilities.
            </p>
            <ul className="space-y-3 text-sm text-slate-300 mb-6">
              <li className="flex items-start gap-2"><Check size={16} className="text-purple-400 mt-0.5 shrink-0" /> 2,000 Credits / month</li>
              <li className="flex items-start gap-2"><Check size={16} className="text-purple-400 mt-0.5 shrink-0" /> Fast-lane processing</li>
              <li className="flex items-start gap-2"><Check size={16} className="text-purple-400 mt-0.5 shrink-0" /> Commercial rights</li>
              <li className="flex items-start gap-2"><Check size={16} className="text-purple-400 mt-0.5 shrink-0" /> Max duration (60s)</li>
            </ul>
            <Button className="w-full bg-white text-black hover:bg-slate-200 rounded-xl font-bold">
              Upgrade to Pro — $29/mo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
