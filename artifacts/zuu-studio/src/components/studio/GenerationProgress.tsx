import { useState, useEffect } from "react";
import {
  useGetVideoStatus,
  useGetVideo,
  getGetVideoStatusQueryKey,
  getGetVideoQueryKey,
} from "@workspace/api-client-react";
import { Loader2, CheckCircle, XCircle, Download, Copy, Share2, Heart, Film, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GenerationProgress({ videoId, onReset }: { videoId: number, onReset: () => void }) {
  const { data: statusData, isError, error } = useGetVideoStatus(videoId, {
    query: {
      queryKey: getGetVideoStatusQueryKey(videoId),
      refetchInterval: (query) => {
        // Stop polling if completed, failed, or cancelled
        const status = query.state.data?.status;
        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
          return false;
        }
        return 3000; // poll every 3 seconds
      },
    }
  });

  const { data: videoData } = useGetVideo(videoId, {
    query: {
      queryKey: getGetVideoQueryKey(videoId),
      enabled: statusData?.status === 'completed',
    }
  });

  const status = statusData?.status || 'queued';
  const progressMessage = statusData?.progressMessage || "Waiting in queue...";
  
  const isFinished = status === 'completed';
  const isFailed = status === 'failed' || isError;

  if (isFinished && videoData) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onReset} className="hover:bg-white/10">
            <ArrowLeft className="mr-2" size={16} /> Back to Studio
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
              <Heart size={16} className="mr-2" /> Favourite
            </Button>
            <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
              <Share2 size={16} className="mr-2" /> Share
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white glow-button">
              <Download size={16} className="mr-2" /> Download
            </Button>
          </div>
        </div>

        <div className="glass-card overflow-hidden rounded-3xl border-purple-500/30">
          <div className="aspect-video bg-black w-full flex items-center justify-center relative group">
            {videoData.videoUrl ? (
              <video 
                src={videoData.videoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-contain"
                poster={videoData.thumbnailUrl || undefined}
              />
            ) : (
              <div className="text-center p-8">
                <Film size={64} className="mx-auto mb-4 text-purple-500" />
                <h3 className="text-xl font-bold">Video Completed</h3>
                <p className="text-slate-400">But video URL is missing from response.</p>
              </div>
            )}
          </div>
          
          <div className="p-6 md:p-8 bg-[#080b14]">
            <h3 className="text-lg font-semibold mb-2">Prompt</h3>
            <div className="bg-[#050508] border border-white/10 rounded-xl p-4 relative group">
              <p className="text-slate-300 leading-relaxed pr-10">{videoData.enhancedPrompt || videoData.prompt}</p>
              <Button size="icon" variant="ghost" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10">
                <Copy size={16} className="text-slate-400 hover:text-white" />
              </Button>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-slate-300">Style: {videoData.style}</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-slate-300">Ratio: {videoData.aspectRatio}</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-slate-300">Duration: {videoData.duration}s</span>
              {videoData.cameraMovement && <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-slate-300">Camera: {videoData.cameraMovement}</span>}
              <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs font-medium text-purple-300 ml-auto">Model: {videoData.provider}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500 max-w-2xl mx-auto text-center">
      <div className="glass-card p-12 rounded-3xl w-full border-purple-500/20 relative overflow-hidden">
        
        {/* Animated background glow */}
        {!isFailed && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] animate-pulse pointer-events-none" />
        )}
        
        <div className="relative z-10">
          {isFailed ? (
            <XCircle className="w-20 h-20 text-pink-500 mx-auto mb-6" />
          ) : (
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            </div>
          )}

          <h2 className="text-3xl font-bold mb-3">
            {isFailed ? "Generation Failed" : 
             status === 'processing' ? "Rendering Cinematic Motion" : 
             "Preparing Scene Parameters"}
          </h2>
          
          <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto h-8">
            {isFailed ? (error?.message || statusData?.errorMessage || "Unknown error occurred") : progressMessage}
          </p>

          {!isFailed && (
            <div className="w-full bg-[#050508] h-3 rounded-full overflow-hidden border border-white/10 mb-8">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-1000 ease-out relative"
                style={{ width: status === 'processing' ? '65%' : '15%' }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
              </div>
            </div>
          )}

          <Button 
            variant="outline" 
            onClick={onReset}
            className="border-white/20 text-white hover:bg-white/10 px-8 rounded-full"
          >
            {isFailed ? "Try Again" : "Cancel Generation"}
          </Button>
        </div>
      </div>
      
      {!isFailed && (
        <p className="mt-8 text-slate-500 text-sm">
          Tip: High quality generations can take several minutes to complete. <br/>
          You can safely navigate away, your video will appear in History.
        </p>
      )}
    </div>
  );
}
