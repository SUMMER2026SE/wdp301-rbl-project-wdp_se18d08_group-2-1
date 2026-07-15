import { Sparkles } from "lucide-react";

const tierPalette = {
  Silver: {
    ring: "from-slate-300 via-white to-slate-400",
    glow: "shadow-slate-400/25",
    badge: "bg-slate-100 text-slate-700",
  },
  Gold: {
    ring: "from-amber-300 via-orange-400 to-yellow-300",
    glow: "shadow-amber-400/35",
    badge: "bg-amber-500/15 text-amber-700",
  },
  Platinum: {
    ring: "from-cyan-300 via-fuchsia-400 to-indigo-300",
    glow: "shadow-cyan-400/35",
    badge: "bg-cyan-500/15 text-cyan-700",
  },
};

export default function MembershipAvatarFrame({
  avatarUrl,
  name = "",
  tier = "Silver",
  celebrating = false,
  size = 112,
  showBadge = true,
  className = "",
}) {
  const palette = tierPalette[tier] || tierPalette.Silver;
  const resolvedName = String(name || "U").trim();
  const initial = resolvedName ? resolvedName.charAt(0).toUpperCase() : "U";
  const badgeLabel = celebrating ? "Member+" : tier;
  const ringGradient = celebrating
    ? "conic-gradient(from 180deg, #fb7185, #f97316, #facc15, #4ade80, #22d3ee, #a78bfa, #fb7185)"
    : `linear-gradient(135deg, ${tier === "Platinum" ? "#22d3ee, #a78bfa, #60a5fa" : tier === "Gold" ? "#fbbf24, #f97316, #fde68a" : "#cbd5e1, #ffffff, #94a3b8"})`;

  const glowStyle = celebrating
    ? {
        boxShadow: "0 0 0 1px rgba(255,255,255,0.14), 0 0 24px rgba(249,115,22,0.38), 0 0 58px rgba(34,211,238,0.18)",
      }
    : {
        boxShadow: tier === "Platinum"
          ? "0 0 0 1px rgba(255,255,255,0.12), 0 0 28px rgba(34,211,238,0.22)"
          : tier === "Gold"
            ? "0 0 0 1px rgba(255,255,255,0.1), 0 0 24px rgba(245,158,11,0.2)"
            : "0 0 0 1px rgba(255,255,255,0.08), 0 0 18px rgba(148,163,184,0.12)",
      };

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div
        className={`absolute inset-0 rounded-full ${celebrating ? "animate-[spin_8s_linear_infinite]" : ""}`}
        style={{
          backgroundImage: ringGradient,
          padding: 3,
          ...glowStyle,
        }}
      >
        <div className="h-full w-full rounded-full bg-white p-[2px] dark:bg-slate-950">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400 to-amber-500 text-lg font-black text-white">
                {initial}
              </div>
            )}

            {celebrating && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.35),transparent_42%),linear-gradient(to_bottom,rgba(255,255,255,0.12),transparent_34%)]" />
            )}
          </div>
        </div>
      </div>

      {showBadge && (
        <div
          className={`absolute -bottom-1 -right-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] backdrop-blur-md ${
            celebrating
              ? "border-white/30 bg-white text-orange-600 shadow-lg shadow-orange-500/20"
              : palette.badge
          }`}
        >
          {celebrating ? <Sparkles size={10} /> : null}
          <span>{badgeLabel}</span>
        </div>
      )}
    </div>
  );
}
