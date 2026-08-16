import type { MatchView } from "@/lib/types";

export function StatusBadge({ status }: { status: MatchView["status"] }) {
  const map = {
    waiting: { label: "Waiting", className: "bg-white/10 text-white/80" },
    active: { label: "Active", className: "bg-turf-500/20 text-turf-400" },
    completed: { label: "Completed", className: "bg-volley-500/20 text-volley-400" },
  } as const;
  const item = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${item.className}`}
    >
      {item.label}
    </span>
  );
}
