import { useCallback } from "react";
import {
  useGetVideoStatus,
  useGetVideo,
  getGetVideoStatusQueryKey,
  getGetVideoQueryKey,
} from "@workspace/api-client-react";
import {
  Loader2, CheckCircle, XCircle, Download, Copy,
  Heart, Film, ArrowLeft, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useToggleFavourite } from "@workspace/api-client-react";

const STATUS_LABELS: Record<string, string> = {
  queued:     "Queued",
  processing: "Processing",
  completed:  "Completed",
  failed:     "Failed",
  cancelled:  "Cancelled",
  draft:      "Draft",
};

const PROGRESS_WIDTHS: Record<string, string> = {
  queued:     "w-[12%]",
  processing: "w-[55%]",
  completed:  "w-full",
  failed:     "w-0",
  cancelled:  "w-0",
};

export default function GenerationProgress({
  videoId,
  onReset,
}: {
  videoId: number;
  onReset: () => void;
}) {
  const { toast } = useToast();
  const toggleFavMutation = useToggleFavourite();

  const { data: statusData, isError, error } = useGetVideoStatus(videoId, {
    query: {
      queryKey: getGetVideoStatusQueryKey(videoId),
      refetchInterval: (query) => {
        const s = query.state.data?.status;
        return s === "completed" || s === "failed" || s === "cancelled" ? false : 3000;
      },
    },
  });

  const { data: videoData } = useGetVideo(videoId, {
    query: {
      queryKey: getGetVideoQueryKey(videoId),
      enabled: statusData?.status === "completed",
    },
  });

  const status = statusData?.status ?? "queued";
  const progressMessage = statusData?.progressMessage ?? "Waiting in queue…";
  const isFinished = status === "completed";
  const isFailed = status === "failed" || isError;

  const handleCopyPrompt = useCallback(() => {
    if (!videoData) return;
    navigator.clipboard.writeText(videoData.enhancedPrompt ?? videoData.prompt).then(() =>
      toast({ title: "Prompt copied" }),
    );
  }, [videoData, toast]);

  const handleDownload = useCallback(() => {
    if (!videoData?.videoUrl) return;
    const a = document.createElement("a");
    a.href = videoData.videoUrl;
    a.download = `zuu-${videoId}.mp4`;
    a.target = "_blank";
    a.click();
  }, [videoData, videoId]);

  const handleFavourite = useCallback(() => {
    toggleFavMutation.mutate({ id: videoId }, {
      onSuccess: () => toast({ title: "Favourite updated" }),
    });
  }, [videoId, toggleFavMutation, toast]);

  /* ── Completed view ──────────────────────────────────────────────────── */
  if (isFinished && videoData) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onReset} className="hover:bg-white/10 gap-2">
            <ArrowLeft size={16} /> Back to Studio
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-white/10 bg-white/5 hover:bg-white/10 gap-2"
              onClick={handleFavourite}
              disabled={toggleFavMutation.isPending}
            >
              <Heart size={15} className={videoData.isFavourite ? "fill-current text-red-400" : ""} />
              Favourite
            </Button>
            {videoData.videoUrl && (
              <>
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 hover:bg-white/10 gap-2"
                  onClick={() => window.open(videoData.videoUrl!, "_blank")}
                >
                  <ExternalLink size={15} /> Open
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                  onClick={handleDownload}
                >
                  <Download size={15} /> Download
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Video player */}
        <div className="glass-card overflow-hidden rounded-3xl border-purple-500/20">
          <div className="aspect-video bg-black w-full relative">
            {videoData.videoUrl ? (
              <video
                src={videoData.videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain"
                poster={videoData.thumbnailUrl ?? undefined}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                <Film size={56} className="text-purple-500/40" />
                <p>Video URL not yet available — try refreshing in a moment</p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="p-6 md:p-8 bg-[#080b14]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-base">Prompt</h3>
              <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-white/10" onClick={handleCopyPrompt}>
                <Copy size={13} className="text-slate-400" />
              </Button>
            </div>
            <div className="bg-[#050508] border border-white/10 rounded-xl p-4 mb-5">
              <p className="text-slate-300 leading-relaxed text-sm">
                {videoData.enhancedPrompt ?? videoData.prompt}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { label: "Style",    value: videoData.style },
                { label: "Ratio",    value: videoData.aspectRatio },
                { label: "Duration", value: `${videoData.duration}s` },
                { label: "Quality",  value: videoData.quality },
                { label: "Credits",  value: `${videoData.creditsUsed} cr` },
              ].map((m) => (
                <span key={m.label} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300">
                  <span className="text-slate-500 mr-1">{m.label}:</span>{m.value}
                </span>
              ))}
              <span className="px-2.5 py-1 bg-purple-500/15 border border-purple-500/30 rounded-lg text-purple-300 ml-auto">
                {videoData.provider}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── In-progress / failed view ───────────────────────────────────────── */
  const barWidth = PROGRESS_WIDTHS[status] ?? "w-[12%]";

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500 max-w-2xl mx-auto text-center">
      <div className="glass-card p-12 rounded-3xl w-full border-purple-500/20 relative overflow-hidden">
        {/* Background glow */}
        {!isFailed && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/15 rounded-full blur-[90px] animate-pulse pointer-events-none" />
        )}

        <div className="relative z-10">
          {/* Icon */}
          {isFailed ? (
            <XCircle className="w-20 h-20 text-pink-500 mx-auto mb-6" />
          ) : (
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
              <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            </div>
          )}

          {/* Status label */}
          <div className="mb-2">
            <span className={`text-xs font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
              isFailed ? "bg-pink-500/15 text-pink-400" : "bg-purple-500/15 text-purple-400"
            }`}>
              {STATUS_LABELS[status] ?? status}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-3 mt-4">
            {isFailed
              ? "Generation Failed"
              : status === "processing"
                ? "Rendering Your Video"
                : "Preparing Generation"}
          </h2>

          <p className="text-slate-400 text-base mb-8 max-w-md mx-auto min-h-[24px]">
            {isFailed
              ? ((error as any)?.message ?? statusData?.errorMessage ?? "An unknown error occurred")
              : progressMessage}
          </p>

          {/* Progress bar */}
          {!isFailed && (
            <div className="w-full bg-[#050508] h-2.5 rounded-full overflow-hidden border border-white/10 mb-8">
              <div
                className={`h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-1000 ease-out relative ${barWidth}`}
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)] -translate-x-full animate-[shimmer_1.5s_infinite]" />
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={onReset}
            className="border-white/20 hover:bg-white/10 px-8 rounded-full"
          >
            {isFailed ? "← Try Again" : "Cancel"}
          </Button>
        </div>
      </div>

      {!isFailed && (
        <p className="mt-6 text-slate-500 text-xs text-center leading-relaxed">
          Generations can take 1–5 minutes depending on provider and queue load.<br />
          You can safely navigate away — your video will appear in History when ready.
        </p>
      )}
    </div>
  );
}
