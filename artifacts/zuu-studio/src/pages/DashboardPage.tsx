import { useMemo } from "react";
import { useGetVideoStats, useListVideos, useGetCredits } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Film, CheckCircle, Clock, XCircle, CreditCard, Heart, Plus, Loader2, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  failed:    "#ec4899",
  processing: "#3b82f6",
  queued:    "#a855f7",
  cancelled: "#64748b",
};

const PIE_COLORS = ["#22c55e", "#ec4899", "#3b82f6", "#a855f7"];

function StatCard({
  label, value, icon, sub, color = "text-white",
}: {
  label: string; value: number | string; icon: React.ReactNode;
  sub?: string; color?: string;
}) {
  return (
    <div className="glass-card p-4 rounded-2xl flex flex-col gap-2 hover:border-white/15 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <span className={`text-3xl font-bold ${color}`}>{value}</span>
      {sub && <span className="text-xs text-slate-500">{sub}</span>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0f1a] border border-white/10 rounded-xl p-3 text-xs text-slate-300 shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetVideoStats();
  const { data: videosData, isLoading: videosLoading } = useListVideos({ limit: 50 });
  const { data: creditsData } = useGetCredits();

  /* ── Derive chart data from video list ─────────────────────────────── */
  const activityData = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split("T")[0];
      return {
        day: d.toLocaleDateString("en", { weekday: "short" }),
        key,
        videos: 0,
        credits: 0,
      };
    });
    (videosData?.items ?? []).forEach((v) => {
      const key = new Date(v.createdAt).toISOString().split("T")[0];
      const slot = days.find((d) => d.key === key);
      if (slot) {
        slot.videos++;
        slot.credits += v.creditsUsed ?? 0;
      }
    });
    return days;
  }, [videosData]);

  const statusPieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Completed", value: stats.completed },
      { name: "Failed",    value: stats.failed },
      { name: "Processing",value: stats.processing },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const providerData = useMemo(() => {
    const counts: Record<string, number> = {};
    (videosData?.items ?? []).forEach((v) => {
      counts[v.provider] = (counts[v.provider] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [videosData]);

  if (statsLoading || videosLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const recentVideos = videosData?.items?.slice(0, 8) ?? [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back to your editing suite.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 border-purple-500/30">
            <CreditCard size={16} className="text-purple-400" />
            <span className="font-bold">{creditsData?.balance ?? 0} Credits</span>
          </div>
          <Link href="/studio">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 glow-button">
              <Plus size={18} className="mr-2" /> Create Video
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total" value={stats?.total ?? 0} icon={<Film size={18} className="text-purple-400" />} />
        <StatCard label="Completed" value={stats?.completed ?? 0} color="text-green-400" icon={<CheckCircle size={18} className="text-green-400" />} sub={stats?.total ? `${Math.round(((stats.completed) / stats.total) * 100)}% success` : undefined} />
        <StatCard label="Processing" value={stats?.processing ?? 0} color="text-blue-400" icon={<Clock size={18} className="text-blue-400" />} />
        <StatCard label="Failed" value={stats?.failed ?? 0} color="text-pink-400" icon={<XCircle size={18} className="text-pink-500" />} />
        <StatCard label="Credits Used" value={stats?.creditsUsed ?? 0} color="text-yellow-400" icon={<CreditCard size={18} className="text-yellow-400" />} />
        <StatCard label="Favourites" value={stats?.favourites ?? 0} color="text-red-400" icon={<Heart size={18} className="text-red-400" />} />
      </div>

      {/* Charts row */}
      {(activityData.some((d) => d.videos > 0) || statusPieData.length > 0) && (
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Activity chart */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-purple-400" />
              <h3 className="font-semibold">Generation Activity — Last 7 Days</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={activityData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradVideos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="videos" name="Videos"
                  stroke="#a855f7" strokeWidth={2}
                  fill="url(#gradVideos)" dot={{ r: 3, fill: "#a855f7" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Status pie */}
          <div className="glass-card p-6 rounded-2xl flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} className="text-purple-400" />
              <h3 className="font-semibold">Status Breakdown</h3>
            </div>
            {statusPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                      {statusPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {statusPieData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-400">{d.name}</span>
                      </div>
                      <span className="font-semibold text-slate-200">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
                No data yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Provider usage bar chart */}
      {providerData.length > 0 && (
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="font-semibold mb-4">Provider Usage</h3>
          <ResponsiveContainer width="100%" height={Math.max(60, providerData.length * 36)}>
            <BarChart data={providerData} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Generations" radius={[0, 6, 6, 0]}>
                {providerData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${260 + i * 25}, 70%, 60%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent generations */}
      <div>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">Recent Generations</h2>
          <Link href="/history" className="text-purple-400 hover:text-purple-300 text-sm font-medium">
            View all →
          </Link>
        </div>

        {recentVideos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentVideos.map((video) => (
              <Link key={video.id} href="/history">
                <div className="glass-card rounded-2xl overflow-hidden group hover:border-purple-500/40 transition-all cursor-pointer">
                  <div className="aspect-video bg-[#050508] relative flex items-center justify-center border-b border-white/5">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : video.videoUrl ? (
                      <video src={video.videoUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      <Film className="text-slate-700" size={28} />
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                        video.status === "completed"  ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                        video.status === "processing" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                        video.status === "failed"     ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" :
                                                        "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                      }`}>
                        {video.status}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-slate-300 line-clamp-2 mb-2">{video.prompt}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                      <span>{video.duration}s · {video.provider}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-3xl text-center flex flex-col items-center">
            <Film className="text-slate-600 mb-4" size={40} />
            <h3 className="text-xl font-bold mb-2">No videos yet</h3>
            <p className="text-slate-400 mb-6 max-w-md text-sm">
              Head to the Studio to generate your first cinematic video.
            </p>
            <Link href="/studio">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 glow-button">
                Start Creating
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
