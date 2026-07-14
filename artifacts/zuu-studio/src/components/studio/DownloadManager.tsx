import { AnimatePresence, motion } from "framer-motion";
import { Download, X, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDownloads } from "@/context/DownloadContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function DownloadManager() {
  const { downloads, removeDownload, clearCompleted } = useDownloads();
  const [collapsed, setCollapsed] = useState(false);

  const active    = downloads.filter((d) => d.status === "downloading" || d.status === "pending");
  const completed = downloads.filter((d) => d.status === "done" || d.status === "error");

  if (downloads.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed bottom-5 right-5 z-50 w-[340px] surface-raised border border-[var(--glass-border)] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-2">
            <Download size={15} className="text-purple-400" />
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Downloads
            </span>
            {active.length > 0 && (
              <span className="px-1.5 py-0.5 bg-purple-600/20 text-purple-400 rounded text-[10px] font-bold">
                {active.length} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {completed.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-[--text-muted] hover:text-[--text-secondary]"
                onClick={clearCompleted}
                title="Clear completed"
              >
                <Trash2 size={12} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[--text-muted] hover:text-[--text-secondary]"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          </div>
        </div>

        {/* Items */}
        {!collapsed && (
          <div className="divide-y divide-[var(--glass-border)] max-h-[260px] overflow-y-auto scrollbar-hide">
            {downloads.map((dl) => (
              <div key={dl.id} className="flex items-center gap-3 px-4 py-3">
                {/* Status icon */}
                <div className="shrink-0">
                  {dl.status === "done"        && <CheckCircle size={16} className="text-green-400" />}
                  {dl.status === "error"       && <XCircle    size={16} className="text-red-400" />}
                  {(dl.status === "downloading" || dl.status === "pending") && (
                    <Loader2 size={16} className="text-purple-400 animate-spin" />
                  )}
                </div>

                {/* Name + progress */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {dl.filename}
                  </p>
                  {(dl.status === "downloading" || dl.status === "pending") && (
                    <Progress value={dl.progress} className="h-1 mt-1.5 bg-white/10" />
                  )}
                  {dl.status === "error" && (
                    <p className="text-[10px] text-red-400 mt-0.5 truncate">{dl.error}</p>
                  )}
                  {dl.status === "done" && (
                    <p className="text-[10px] text-green-400 mt-0.5">Complete</p>
                  )}
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeDownload(dl.id)}
                  className="shrink-0 p-1 rounded text-[--text-muted] hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
