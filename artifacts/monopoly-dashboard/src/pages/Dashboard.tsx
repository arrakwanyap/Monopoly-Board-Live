import { useState, useEffect, useRef } from "react";
import { useGetGameState, useGetLeaderboard } from "@workspace/api-client-react";
import MonopolyBoard from "@/components/MonopolyBoard";
import LeaderboardPanel from "@/components/LeaderboardPanel";
import EventFeed from "@/components/EventFeed";

export default function Dashboard() {
  const { data: gameState, isLoading: stateLoading } = useGetGameState({
    query: { refetchInterval: 3000 },
  });
  const { data: leaderboard, isLoading: lbLoading } = useGetLeaderboard({
    query: { refetchInterval: 3000 },
  });

  const announcement = (gameState as any)?.announcement as string | null | undefined;
  const timerEnd     = (gameState as any)?.timerEnd     as string | null | undefined;

  // ── Announcement overlay ──────────────────────────────────────────────────
  // Overlay re-opens whenever a *new* (different) announcement arrives.
  // The viewer can dismiss it locally with "Okay".
  const prevAnnouncementRef = useRef<string | null | undefined>(undefined);
  const [overlayVisible, setOverlayVisible] = useState(false);

  useEffect(() => {
    if (announcement && announcement !== prevAnnouncementRef.current) {
      // New message — always show the overlay, even if previously dismissed
      setOverlayVisible(true);
    } else if (!announcement) {
      setOverlayVisible(false);
    }
    prevAnnouncementRef.current = announcement;
  }, [announcement]);

  // ── Countdown timer ───────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!timerEnd) { setTimeLeft(null); return; }
    const calc = () => Math.max(0, new Date(timerEnd).getTime() - Date.now());
    setTimeLeft(calc());
    const id = setInterval(() => setTimeLeft(calc()), 500);
    return () => clearInterval(id);
  }, [timerEnd]);

  const showTimer = timeLeft !== null;
  const timerMins = timeLeft !== null ? Math.floor(timeLeft / 60000) : 0;
  const timerSecs = timeLeft !== null ? Math.floor((timeLeft % 60000) / 1000) : 0;
  const timerStr  = `${String(timerMins).padStart(2, "0")}:${String(timerSecs).padStart(2, "0")}`;
  const timerExpired = timeLeft === 0;
  const timerColor =
    timerExpired           ? "#ef4444" :
    timerMins < 1          ? "#f97316" :
    timerMins < 3          ? "#eab308" :
                             "#22c55e";

  // ── Status colour ─────────────────────────────────────────────────────────
  const statusColor = {
    lobby:    "#f7941d",
    active:   "#2563eb",
    finished: "#ed1b24",
  }[gameState?.status ?? "lobby"] ?? "#7f8c8d";

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden relative">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ borderBottom: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center font-black text-sm"
            style={{ backgroundColor: "#2563eb", color: "#fff" }}
          >
            M
          </div>
          <div>
            <div className="font-black text-base leading-tight" style={{ color: "#3b82f6" }}>
              YCIS MONOPOLY 2026
            </div>
            <div className="text-xs text-muted-foreground tracking-widest uppercase">
              Live Ops Command
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Floating countdown in header when timer is active */}
          {showTimer && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono font-black text-lg"
              style={{
                borderColor: timerColor,
                color: timerColor,
                backgroundColor: `${timerColor}18`,
                boxShadow: timerExpired ? `0 0 12px ${timerColor}88` : undefined,
                animation: timerExpired ? "pulse 1s ease-in-out infinite" : undefined,
              }}
            >
              <span style={{ fontSize: "0.9rem" }}>⏱</span>
              <span>{timerExpired ? "TIME'S UP" : timerStr}</span>
            </div>
          )}
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-widest">Status</div>
            <div className="text-sm font-bold uppercase" style={{ color: statusColor }}>
              {gameState?.status ?? "Loading"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-widest">Round</div>
            <div className="text-sm font-bold text-foreground">{gameState?.round ?? 0}</div>
          </div>
        </div>
      </header>

      {/* Announcement overlay — dismissed locally per-viewer with "Okay" */}
      {overlayVisible && announcement && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="flex flex-col items-center gap-6 px-10 py-10 rounded-2xl text-center max-w-2xl w-full mx-6"
            style={{
              background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
              border: "2px solid #3b82f6",
              boxShadow: "0 0 60px rgba(59,130,246,0.4)",
              animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            <div className="text-5xl animate-bounce">📢</div>
            <div
              className="font-black text-white leading-tight"
              style={{ fontSize: "clamp(1.6rem, 4vw, 2.6rem)", textShadow: "0 2px 16px rgba(59,130,246,0.6)" }}
            >
              {announcement}
            </div>
            <div className="text-xs text-blue-300 uppercase tracking-widest font-bold">
              — From the Organiser —
            </div>
            <button
              onClick={() => setOverlayVisible(false)}
              className="mt-2 px-8 py-3 rounded-xl font-black text-base uppercase tracking-widest transition-all"
              style={{
                backgroundColor: "#2563eb",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(37,99,235,0.5)",
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#2563eb")}
            >
              Okay
            </button>
          </div>
          <style>{`
            @keyframes popIn {
              from { opacity: 0; transform: scale(0.7); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}

      {/* Main content — fills remaining height */}
      <div className="flex flex-1 min-h-0">
        {/* Board area */}
        <div className="flex-1 p-3 flex items-center justify-center min-w-0 overflow-hidden">
          {stateLoading ? (
            <div className="text-muted-foreground">Loading board...</div>
          ) : (
            <div style={{ width: "100%", maxWidth: "min(calc(100% - 0px), calc(100vh - 60px))", aspectRatio: "1 / 1" }}>
              <MonopolyBoard
                spaces={gameState?.board ?? []}
                teams={gameState?.teams ?? []}
              />
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div
          className="flex flex-col shrink-0 overflow-hidden"
          style={{
            width: "300px",
            borderLeft: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
          }}
        >
          {/* Leaderboard */}
          <div
            className="shrink-0 p-3 overflow-y-auto"
            style={{ maxHeight: "55%", borderBottom: "1px solid hsl(var(--border))" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: "#f7941d" }} />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Leaderboard
              </h2>
            </div>
            <LeaderboardPanel entries={leaderboard ?? []} isLoading={lbLoading} />
          </div>

          {/* Live event feed */}
          <div className="flex-1 flex flex-col min-h-0 p-3">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <div
                className="w-1 h-4 rounded-full animate-pulse"
                style={{ backgroundColor: "#3b82f6" }}
              />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Live Event Feed
              </h2>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <EventFeed
                events={gameState?.recentEvents ?? []}
                isLoading={stateLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
