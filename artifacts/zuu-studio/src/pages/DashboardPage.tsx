import { useGetVideoStats, useListVideos, useGetCredits } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Film, CheckCircle, Clock, XCircle, CreditCard, Heart, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useGetVideoStats();
  const { data: videosData, isLoading: videosLoading } = useListVideos({ limit: 8 });
  const { data: creditsData } = useGetCredits();

  if (statsLoading || videosLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Videos", value: stats?.total || 0, icon: <Film size={20} className="text-purple-400" /> },
    { label: "Completed", value: stats?.completed || 0, icon: <CheckCircle size={20} className="text-green-400" /> },
    { label: "Processing", value: stats?.processing || 0, icon: <Clock size={20} className="text-blue-400" /> },
    { label: "Failed", value: stats?.failed || 0, icon: <XCircle size={20} className="text-pink-500" /> },
    { label: "Credits Used", value: stats?.creditsUsed || 0, icon: <CreditCard size={20} className="text-yellow-400" /> },
    { label: "Favourites", value: stats?.favourites || 0, icon: <Heart size={20} className="text-red-400" /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back to your editing suite.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 border-purple-500/30">
            <CreditCard size={16} className="text-purple-400" />
            <span className="font-bold">{creditsData?.balance || 0} Credits</span>
          </div>
          <Link href="/studio">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 glow-button">
              <Plus size={18} className="mr-2" />
              Create Video
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-card p-4 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm font-medium">{stat.label}</span>
              {stat.icon}
            </div>
            <span className="text-2xl font-bold">{stat.value}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recent Generations</h2>
          <Link href="/history" className="text-purple-400 hover:text-purple-300 text-sm font-medium">View all</Link>
        </div>

        {videosData?.items && videosData.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {videosData.items.map((video) => (
              <div key={video.id} className="glass-card rounded-2xl overflow-hidden group hover:border-purple-500/50 transition-colors">
                <div className="aspect-video bg-black relative flex items-center justify-center border-b border-white/5">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  ) : video.videoUrl ? (
                    <video src={video.videoUrl} className="w-full h-full object-cover" muted />
                  ) : (
                    <Film className="text-slate-600 opacity-50" size={32} />
                  )}
                  
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium uppercase tracking-wider backdrop-blur-md ${
                      video.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      video.status === 'processing' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      video.status === 'failed' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' :
                      'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                    }`}>
                      {video.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-slate-300 line-clamp-2 mb-3 h-10">{video.prompt}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    <span>{video.duration}s • {video.quality}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-3xl text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Film className="text-slate-500" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">No videos yet</h3>
            <p className="text-slate-400 mb-6 max-w-md">You haven't generated any videos. Head over to the Studio to create your first masterpiece.</p>
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
