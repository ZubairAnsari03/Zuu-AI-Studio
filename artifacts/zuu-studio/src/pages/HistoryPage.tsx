import { useState } from "react";
import { useListVideos, useToggleFavourite, useDeleteVideo } from "@workspace/api-client-react";
import { Loader2, Search, Filter, Play, Heart, Trash2, MoreVertical, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function HistoryPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  
  const { data, isLoading, refetch } = useListVideos({ 
    limit: 50,
    status: statusFilter !== "all" ? statusFilter : undefined
  });
  
  const toggleFavMutation = useToggleFavourite();
  const deleteMutation = useDeleteVideo();

  const handleToggleFav = (id: number) => {
    toggleFavMutation.mutate({ id }, {
      onSuccess: () => refetch()
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this video?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Video deleted" });
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

  const videos = data?.items || [];
  const filteredVideos = videos.filter(v => 
    v.prompt.toLowerCase().includes(search.toLowerCase()) || 
    (v.enhancedPrompt && v.enhancedPrompt.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Generation History</h1>
          <p className="text-slate-400 mt-1">Your cinematic archive</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <Input 
              placeholder="Search prompts..." 
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
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map(video => (
            <div key={video.id} className="glass-card rounded-2xl overflow-hidden group hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] flex flex-col h-[320px]">
              <div className="aspect-video bg-[#050508] relative flex items-center justify-center border-b border-white/5">
                {video.thumbnailUrl ? (
                  <img src={video.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : video.videoUrl ? (
                  <video src={video.videoUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-600">
                    {video.status === 'processing' ? (
                      <Loader2 className="animate-spin text-purple-500" size={32} />
                    ) : (
                      <Play size={32} />
                    )}
                  </div>
                )}
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                  {video.status === 'completed' && (
                    <Button size="icon" className="rounded-full bg-white/20 hover:bg-purple-600 text-white w-12 h-12">
                      <Play size={24} className="ml-1" />
                    </Button>
                  )}
                </div>

                <div className="absolute top-2 right-2 flex gap-2">
                  {video.isFavourite && (
                    <div className="px-2 py-1 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 backdrop-blur-md flex items-center">
                      <Heart size={12} className="fill-current" />
                    </div>
                  )}
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${
                    video.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    video.status === 'processing' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    video.status === 'failed' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' :
                    'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                  }`}>
                    {video.status}
                  </span>
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-sm text-slate-200 line-clamp-3 mb-auto" title={video.prompt}>
                  {video.prompt}
                </p>
                
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-purple-400">{video.style}</span>
                    <span className="text-[10px] text-slate-500">{new Date(video.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#080b14] border-white/10 text-slate-300 w-48">
                        <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer py-2">
                          <Play size={14} className="mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer py-2" onClick={() => handleToggleFav(video.id)}>
                          <Heart size={14} className="mr-2" /> {video.isFavourite ? "Remove Favourite" : "Add to Favourites"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer py-2">
                          <RefreshCw size={14} className="mr-2" /> Regenerate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="focus:bg-pink-500/20 focus:text-pink-400 text-pink-500 cursor-pointer py-2" onClick={() => handleDelete(video.id)}>
                          <Trash2 size={14} className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-16 rounded-3xl text-center border-dashed border-2 border-white/10 bg-transparent flex flex-col items-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Search className="text-slate-500" size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-3">No videos found</h3>
          <p className="text-slate-400 mb-8 max-w-md">
            {search || statusFilter !== "all" 
              ? "We couldn't find any videos matching your filters. Try adjusting them." 
              : "Your history is empty. Go to the Studio to generate your first cinematic video."}
          </p>
          {(search || statusFilter !== "all") && (
            <Button 
              variant="outline" 
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
              className="border-white/20 text-white"
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
