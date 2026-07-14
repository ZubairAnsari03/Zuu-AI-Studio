import { useCallback } from "react";
import { Bell, CheckCheck, Trash2, Film, CreditCard, Info, AlertTriangle } from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

function relativeTime(date: string | Date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  video_completed: { icon: <Film size={14} />,          color: "text-green-400 bg-green-500/10" },
  video_failed:    { icon: <AlertTriangle size={14} />, color: "text-red-400 bg-red-500/10" },
  credits_added:   { icon: <CreditCard size={14} />,    color: "text-yellow-400 bg-yellow-500/10" },
  system:          { icon: <Info size={14} />,           color: "text-blue-400 bg-blue-500/10" },
};

export default function NotificationCenter() {
  const data: {
  items: NotificationItem[];
  unreadCount: number;
} = {
  items: [],
  unreadCount: 0,
};

const refetch = async () => {};

  const items       = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const markAll = useCallback(() => {
  void refetch();
}, []);

  const dismiss = useCallback((_id: number, e: React.MouseEvent) => {
  e.stopPropagation();
}, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-xl text-[--text-secondary] hover:text-[--text-primary] hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-black/5 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] p-0 surface-raised border border-[var(--glass-border)] shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
          <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-purple-600/20 text-purple-400 rounded text-[10px] font-bold">
                {unreadCount} new
              </span>
            )}
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-[--text-secondary] hover:text-[--text-primary]"
              onClick={markAll}
            >
              <CheckCheck size={13} /> Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        {items.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-[--text-secondary]">
            <div className="w-12 h-12 rounded-full bg-[var(--glass-bg)] flex items-center justify-center">
              <Bell size={22} className="opacity-50" />
            </div>
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs opacity-60">New activity will appear here</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <div className="divide-y divide-[var(--glass-border)]">
              {items.map((notif) => {
                const typeInfo = TYPE_ICON[notif.type] ?? TYPE_ICON.system;
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--glass-bg)] ${
                      !notif.read ? "bg-purple-500/[0.03]" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${typeInfo.color}`}>
                      {typeInfo.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug" style={{ color: "var(--text-primary)" }}>
                          {notif.title}
                        </p>
                        <button
                          onClick={(e) => dismiss(notif.id, e)}
                          className="shrink-0 p-1 rounded text-[--text-muted] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          aria-label="Dismiss"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <p className="text-xs mt-0.5 leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                        {relativeTime(notif.createdAt)}
                      </p>
                    </div>

                    {/* Unread dot */}
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0 mt-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
