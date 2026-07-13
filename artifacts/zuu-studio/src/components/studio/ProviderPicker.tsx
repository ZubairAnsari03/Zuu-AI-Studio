import { memo } from "react";
import { CheckCircle, Zap, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  isMock: boolean;
  supportsImageToVideo: boolean;
  supportedDurations: number[];
  supportedAspectRatios: string[];
  description?: string | null;
}

interface ProviderPickerProps {
  providers: Provider[];
  value: string;
  onChange: (id: string) => void;
}

const PROVIDER_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  mock:      { bg: "bg-slate-800/60",    border: "border-slate-600/50",  text: "text-slate-300",  dot: "bg-slate-400" },
  replicate: { bg: "bg-blue-900/30",     border: "border-blue-500/40",   text: "text-blue-300",   dot: "bg-blue-400" },
  kling:     { bg: "bg-orange-900/30",   border: "border-orange-500/40", text: "text-orange-300", dot: "bg-orange-400" },
  runway:    { bg: "bg-green-900/30",    border: "border-green-500/40",  text: "text-green-300",  dot: "bg-green-400" },
  luma:      { bg: "bg-violet-900/30",   border: "border-violet-500/40", text: "text-violet-300", dot: "bg-violet-400" },
  pika:      { bg: "bg-pink-900/30",     border: "border-pink-500/40",   text: "text-pink-300",   dot: "bg-pink-400" },
};

const PROVIDER_ICONS: Record<string, string> = {
  mock: "🎭", replicate: "⚡", kling: "🎬", runway: "🛫", luma: "✨", pika: "🌊",
};

function ProviderCard({
  provider,
  selected,
  onSelect,
}: {
  provider: Provider;
  selected: boolean;
  onSelect: () => void;
}) {
  const colors = PROVIDER_COLORS[provider.id] ?? PROVIDER_COLORS.mock;
  const icon = PROVIDER_ICONS[provider.id] ?? "🤖";
  const disabled = !provider.enabled;

  const card = (
    <button
      type="button"
      onClick={!disabled ? onSelect : undefined}
      disabled={disabled}
      className={`
        relative w-full text-left p-3 rounded-xl border transition-all duration-200
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02]"}
        ${selected
          ? `${colors.bg} ${colors.border} shadow-[0_0_12px_rgba(168,85,247,0.15)]`
          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
        }
      `}
    >
      {/* Selected check */}
      {selected && (
        <CheckCircle
          size={14}
          className="absolute top-2 right-2 text-purple-400"
        />
      )}

      <div className="flex items-start gap-2.5">
        <span className="text-xl leading-none mt-0.5">{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-semibold text-sm text-white truncate">
              {provider.name}
            </span>
            {provider.isMock && (
              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 tracking-wider shrink-0">
                mock
              </span>
            )}
            {disabled && (
              <Lock size={10} className="text-slate-500 shrink-0" />
            )}
          </div>

          {/* Capability pills */}
          <div className="flex flex-wrap gap-1">
            {provider.supportedDurations.slice(0, 3).map((d) => (
              <span
                key={d}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-medium"
              >
                {d}s
              </span>
            ))}
            {provider.supportsImageToVideo && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 font-medium">
                i2v
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );

  if (disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent side="bottom" className="bg-[#0d0f1a] border-white/10 text-slate-300 text-xs max-w-[200px]">
          No API key configured for this provider. Add it in Replit Secrets.
        </TooltipContent>
      </Tooltip>
    );
  }

  return card;
}

const ProviderPicker = memo(function ProviderPicker({
  providers,
  value,
  onChange,
}: ProviderPickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
          <Zap size={14} className="text-purple-400" />
          AI Provider
        </span>
        {providers.find((p) => p.id === value)?.isMock && (
          <span className="text-[10px] text-slate-500 font-medium">
            Real providers need API keys in Secrets
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {providers.map((p) => (
          <ProviderCard
            key={p.id}
            provider={p}
            selected={value === p.id}
            onSelect={() => onChange(p.id)}
          />
        ))}
      </div>
    </div>
  );
});

export default ProviderPicker;
