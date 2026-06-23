import type { LeaderboardEntry } from "@workspace/api-client-react";
import TeamToken from "@/components/TeamToken";

interface Props {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
}

const RANK_STYLES = [
  { bg: "#f7941d22", border: "#f7941d", label: "#f7941d" },
  { bg: "#aae0fa22", border: "#aae0fa", label: "#aae0fa" },
  { bg: "#95543622", border: "#955436", label: "#c08060" },
];

export default function LeaderboardPanel({ entries, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => {
        const style = RANK_STYLES[entry.rank - 1];
        return (
          <div
            key={entry.teamId}
            className="rounded-lg px-3 py-2 flex items-center gap-3"
            style={{
              backgroundColor: style?.bg ?? "hsl(var(--card))",
              border: `1px solid ${style?.border ?? "hsl(var(--border))"}`,
            }}
          >
            {/* Rank */}
            <div
              className="font-black text-sm w-5 text-center shrink-0"
              style={{ color: style?.label ?? "hsl(var(--muted-foreground))" }}
            >
              #{entry.rank}
            </div>

            {/* Team token + color dot */}
            <div className="relative shrink-0">
              <TeamToken emoji={entry.teamEmoji} name={entry.teamName} size={32} />
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-border"
                style={{ backgroundColor: entry.teamColor }}
              />
            </div>

            {/* Name + breakdown */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-foreground truncate">{entry.teamName}</div>
              <div className="text-xs text-muted-foreground">
                ${entry.cash} cash · {entry.propertyCount} props
                {entry.setBonus > 0 && (
                  <span className="text-accent font-semibold"> · +${entry.setBonus} bonus</span>
                )}
              </div>
            </div>

            {/* Net worth */}
            <div className="text-right shrink-0">
              <div className="font-black text-base text-foreground">${entry.netWorth}</div>
              <div className="text-xs text-muted-foreground">net worth</div>
            </div>
          </div>
        );
      })}

      {entries.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-4">
          No teams yet. Add teams in the Admin panel.
        </div>
      )}
    </div>
  );
}
