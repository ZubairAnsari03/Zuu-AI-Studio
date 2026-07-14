import { useState, useCallback, useEffect } from "react";
import {
  useListVideos,
  useToggleFavourite,
  useDeleteVideo,
  useRegenerateVideo,
  getVideoStatus,
} from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Filter, Play, Heart, Trash2, MoreVertical, RefreshCw, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import VideoPlayerModal, { type VideoEntry } from "@/components/studio/VideoPlayerModal";


const STATUS_BADGE: Record<string, string> = {
  completed:  "bg-green-500/20 text-green-400 border-green-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  queued:     "bg-purple-500/20 text-purple-400 border-purple-500/30",
  failed:     "bg-pink-500/20 text-pink-400 border-pink-500/30",
  cancelled:  "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

function VideoStatusPoller({
  id,
  active,
  onUpdated,
}: {
  id: number;
  active: boolean;
  onUpdated: () => void;
}) {
  const { data } = useQuery({
  queryKey: ["video-status", id],
  queryFn: () => getVideoStatus(id),
  enabled: active,
  refetchInterval: active ? 5000 : false,
  refetchIntervalInBackground: true,
});

  useEffect(() => {
    if (
      data?.status === "completed" ||
      data?.status === "failed" ||
      data?.status === "cancelled"
    ) {
      onUpdated();
    }
  }, [data?.status, onUpdated]);

  return null;
}

export default function HistoryPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeVideo, setActiveVideo] = useState<VideoEntry | null>(null);
  const { toast } = useToast();

  const { data, isLoading, refetch } = useListVideos({
    limit: 60,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const hasActiveVideos = (data?.items ?? []).some(
  (video) => video.status === "queued" || video.status === "processing",
);

useEffect(() => {
  if (!hasActiveVideos) return;

  const timer = window.setInterval(() => {
    refetch();
  }, 5000);

  return () => window.clearInterval(timer);
}, [hasActiveVideos, refetch]);

  const toggleFavMutation   = useToggleFavourite();
  const deleteMutation      = useDeleteVideo();
  const regenerateMutation  = useRegenerateVideo();

  const handleToggleFav = useCallback((id: number) => {
    toggleFavMutation.mutate({ id }, { onSuccess: () => refetch() });
  }, [toggleFavMutation, refetch]);

  const handleDelete = useCallback((id: number) => {
  if (!window.confirm("Delete this video generation?")) return;

  deleteMutation.mutate(
    { id },
    {
      onSuccess: async () => {
        if (activeVideo?.id === id) {
          setActiveVideo(null);
        }

        await refetch();
        toast({ title: "Deleted successfully" });
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: err?.message ?? "The video could not be deleted.",
        });
      },
    },
  );
}, [deleteMutation, refetch, toast, activeVideo]);

  const handleRegenerate = useCallback((id: number) => {
    regenerateMutation.mutate({ id }, {
      onSuccess: () => { toast({ title: "Regeneration queued" }); refetch(); },
      onError:   () => toast({ variant: "destructive", title: "Regeneration failed" }),
    });
  }, [regenerateMutation, refetch, toast]);

  const openVideo = useCallback((video: any) => {
    if (video.status === "completed") setActiveVideo(video as VideoEntry);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  const q = search.toLowerCase();
  const videos = (data?.items ?? []).filter(
    (v) => !q || v.prompt.toLowerCase().includes(q) || (v.enhancedPrompt ?? "").toLowerCase().includes(q),
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Generation History</h1>
          <p className="text-slate-400 mt-1">Your cinematic archive · {data?.total ?? 0} total</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <Input
              placeholder="Search prompts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#050508] border-white/10 h-10 w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-[#050508] border-white/10 h-10">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#080b14] border-white/10">
              {["all","completed","processing","queued","failed"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s === "all" ? "All Statuses" : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {videos.map((video) => (
  <VideoStatusPoller
    key={`poll-${video.id}`}
    id={video.id}
    active={video.status === "queued" || video.status === "processing"}
    onUpdated={refetch}
  />
))}
          {videos.map((video) => (
            <div
              key={video.id}
              className="glass-card rounded-2xl overflow-hidden group hover:border-purple-500/40 transition-all duration-300 hover:shadow-[0_0_18px_rgba(124,58,237,0.12)] flex flex-col"
            >
              {/* Thumbnail / preview */}
              <div
                className="aspect-video bg-[#050508] relative flex items-center justify-center border-b border-white/5 cursor-pointer"
                onClick={() => openVideo(video)}
              >
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt="thumb" className="w-full h-full object-cover" />
                ) : video.videoUrl ? (
                  <video src={video.videoUrl} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-600">
                    {video.status === "processing" || video.status === "queued" ? (
                      <Loader2 className="animate-spin text-purple-500/60" size={28} />
                    ) : (
                      <Film size={28} />
                    )}
                  </div>
                )}

                {/* Play overlay */}
                {video.status === "completed" && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Play size={20} className="text-white ml-1" />
                    </div>
                  </div>
                )}

                {/* Status + fav badges */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border ${STATUS_BADGE[video.status] ?? STATUS_BADGE.cancelled}`}>
                    {video.status}
                  </span>
                  {video.isFavourite && (
                    <Heart size={12} className="text-red-400 fill-current drop-shadow" />
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-sm text-slate-200 line-clamp-2 mb-auto" title={video.prompt}>
                  {video.prompt}
                </p>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-purple-400 block">{video.style}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(video.createdAt).toLocaleDateString()} · {video.provider}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                        <MoreVertical size={15} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#080b14] border-white/10 text-slate-300 w-48">
                      {video.status === "completed" && (
                        <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer py-2" onClick={() => openVideo(video)}>
                          <Play size={13} className="mr-2" /> Watch Video
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer py-2" onClick={() => handleToggleFav(video.id)}>
                        <Heart size={13} className="mr-2" /> {video.isFavourite ? "Unfavourite" : "Favourite"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer py-2" onClick={() => handleRegenerate(video.id)}>
                        <RefreshCw size={13} className="mr-2" /> Regenerate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem className="focus:bg-pink-500/20 focus:text-pink-400 text-pink-500 cursor-pointer py-2" onClick={() => handleDelete(video.id)}>
                        <Trash2 size={13} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-16 rounded-3xl text-center border-dashed border-2 border-white/10 bg-transparent flex flex-col items-center">
          <Film className="text-slate-600 mb-4" size={36} />
          <h3 className="text-2xl font-bold mb-3">No videos found</h3>
          <p className="text-slate-400 mb-8 max-w-md">
            {search || statusFilter !== "all"
              ? "No videos match your current filters."
              : "Your history is empty. Go to Studio to generate your first video."}
          </p>
          {(search || statusFilter !== "all") && (
            <Button variant="outline" className="border-white/20" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Video player modal */}
      <VideoPlayerModal
        video={activeVideo}
        onClose={() => setActiveVideo(null)}
        onFavouriteToggled={() => {
          refetch();
          if (activeVideo) setActiveVideo({ ...activeVideo, isFavourite: !activeVideo.isFavourite });
        }}
      />
    </div>
  );
}
