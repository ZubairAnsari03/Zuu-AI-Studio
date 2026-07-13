import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Heart, Share2, X, Film, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useToggleFavourite } from "@workspace/api-client-react";

export interface VideoEntry {
  id: number;
  prompt: string;
  enhancedPrompt?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  style: string;
  aspectRatio: string;
  duration: number;
  quality: string;
  provider: string;
  isFavourite: boolean;
  creditsUsed: number;
  createdAt: string;
}

interface VideoPlayerModalProps {
  video: VideoEntry | null;
  onClose: () => void;
  onFavouriteToggled?: () => void;
}

export default function VideoPlayerModal({
  video,
  onClose,
  onFavouriteToggled,
}: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const toggleFavMutation = useToggleFavourite();

  if (!video) return null;

  const handleDownload = async () => {
    if (!video.videoUrl) return;
    try {
      const a = document.createElement("a");
      a.href = video.videoUrl;
      a.download = `zuu-${video.id}-${video.style}.mp4`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    } catch {
      toast({ variant: "destructive", title: "Download failed" });
    }
  };

  const handleCopyPrompt = () => {
    const text = video.enhancedPrompt || video.prompt;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied to clipboard" });
    });
  };

  const handleFavourite = () => {
    toggleFavMutation.mutate(
      { id: video.id },
      { onSuccess: () => onFavouriteToggled?.() },
    );
  };

  const displayPrompt = video.enhancedPrompt || video.prompt;

  return (
    <Dialog open={!!video} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl w-full bg-[#080b14] border-white/10 text-white p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Video Player</DialogTitle>
        </DialogHeader>

        {/* Video area */}
        <div className="relative bg-black w-full aspect-video flex items-center justify-center">
          {video.videoUrl ? (
            <video
              ref={videoRef}
              src={video.videoUrl}
              poster={video.thumbnailUrl ?? undefined}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Film size={48} />
              <p className="text-sm">Video URL not available</p>
            </div>
          )}

          {/* Close button overlay */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors text-white z-10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Metadata + actions */}
        <div className="p-5 space-y-4">
          {/* Action row */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className={`border-white/10 bg-white/5 hover:bg-white/10 gap-2 ${video.isFavourite ? "text-red-400 border-red-500/30" : ""}`}
                onClick={handleFavourite}
                disabled={toggleFavMutation.isPending}
              >
                <Heart size={14} className={video.isFavourite ? "fill-current" : ""} />
                {video.isFavourite ? "Unfavourite" : "Favourite"}
              </Button>
              {video.videoUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 bg-white/5 hover:bg-white/10 gap-2"
                  onClick={() => window.open(video.videoUrl!, "_blank")}
                >
                  <ExternalLink size={14} />
                  Open
                </Button>
              )}
            </div>
            {video.videoUrl && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                onClick={handleDownload}
              >
                <Download size={14} />
                Download
              </Button>
            )}
          </div>

          {/* Prompt */}
          <div className="bg-[#050508] border border-white/10 rounded-xl p-4 relative group">
            <p className="text-sm text-slate-300 leading-relaxed pr-8 line-clamp-3">
              {displayPrompt}
            </p>
            <button
              onClick={handleCopyPrompt}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
            >
              <Copy size={14} className="text-slate-400" />
            </button>
          </div>

          {/* Metadata chips */}
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { label: "Style", value: video.style },
              { label: "Ratio", value: video.aspectRatio },
              { label: "Duration", value: `${video.duration}s` },
              { label: "Quality", value: video.quality },
              { label: "Credits", value: `${video.creditsUsed} cr` },
              { label: "Date", value: new Date(video.createdAt).toLocaleDateString() },
            ].map((m) => (
              <span
                key={m.label}
                className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg font-medium text-slate-300"
              >
                <span className="text-slate-500 mr-1">{m.label}:</span>
                {m.value}
              </span>
            ))}
            <span className="px-2.5 py-1 bg-purple-500/15 border border-purple-500/30 rounded-lg font-medium text-purple-300 ml-auto">
              {video.provider}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
