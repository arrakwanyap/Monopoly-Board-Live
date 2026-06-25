import { useEffect, useRef } from "react";
import type { GameEvent } from "@workspace/api-client-react";
import TeamToken from "@/components/TeamToken";
import { EVENT_TYPE_COLOR, EVENT_TYPE_LABEL } from "@/lib/constants";

interface Props {
  events: GameEvent[];
  isLoading?: boolean;
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function EventFeed({ events, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const sorted = [...events].reverse();

  return (
    <div className="flex flex-col gap-1.5 pr-1">
      {sorted.map((event) => {
        const color = EVENT_TYPE_COLOR[event.type] ?? "#7f8c8d";
        const label = EVENT_TYPE_LABEL[event.type] ?? event.type;
        return (
          <div
            key={event.id}
            className="flex items-start gap-2 rounded-md p-2 border border-border/40"
            style={{ backgroundColor: `${color}11` }}
          >
            {/* Left accent bar */}
            <div
              className="w-0.5 self-stretch rounded-full shrink-0"
              style={{ backgroundColor: color, minHeight: "16px" }}
            />

            <div className="flex-1 min-w-0">
              {/* Team + type tag */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {event.teamEmoji && (
                  <TeamToken emoji={event.teamEmoji} name={event.teamName ?? ""} size={18} />
                )}
                {event.teamName && (
                  <span className="text-xs font-bold text-foreground">{event.teamName}</span>
                )}
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${color}33`, color }}
                >
                  {label}
                </span>
                {event.amount && (
                  <span
                    className="text-xs font-bold"
                    style={{ color: event.amount > 0 ? "#60a5fa" : "#ed1b24" }}
                  >
                    {event.amount > 0 ? `+$${event.amount}` : `-$${Math.abs(event.amount)}`}
                  </span>
                )}
              </div>
              {/* Message */}
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{event.message}</p>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-muted-foreground shrink-0 mt-0.5">
              {timeAgo(event.createdAt)}
            </div>
          </div>
        );
      })}

      {sorted.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-4">
          No events yet. The game will be tracked here live.
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
