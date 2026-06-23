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

  const statusColor = {
    lobby: "#f7941d",
    active: "#1fb25a",
    finished: "#ed1b24",
  }[gameState?.status ?? "lobby"] ?? "#7f8c8d";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ borderBottom: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center font-black text-sm"
            style={{ backgroundColor: "#1fb25a", color: "#fff" }}
          >
            M
          </div>
          <div>
            <div className="font-black text-base leading-tight" style={{ color: "#1fb25a" }}>
              YCIS MONOPOLY 2026
            </div>
            <div className="text-xs text-muted-foreground tracking-widest uppercase">
              Live Ops Command
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-widest">Status</div>
            <div
              className="text-sm font-bold uppercase"
              style={{ color: statusColor }}
            >
              {gameState?.status ?? "Loading"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-widest">Round</div>
            <div className="text-sm font-bold text-foreground">{gameState?.round ?? 0}</div>
          </div>
          <a
            href="/admin"
            className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#1fb25a", color: "#fff" }}
          >
            Admin
          </a>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* Board area */}
        <div className="flex-1 p-3 flex items-center justify-center min-w-0 overflow-hidden">
          {stateLoading ? (
            <div className="text-muted-foreground">Loading board...</div>
          ) : (
            <div style={{ width: "100%", maxWidth: "640px", maxHeight: "calc(100vh - 60px)" }}>
              <MonopolyBoard
                spaces={gameState?.board ?? []}
                teams={gameState?.teams ?? []}
              />
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div
          className="flex flex-col gap-4 p-3 overflow-y-auto shrink-0"
          style={{
            width: "300px",
            borderLeft: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
          }}
        >
          {/* Leaderboard */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-1 h-4 rounded-full"
                style={{ backgroundColor: "#f7941d" }}
              />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Leaderboard
              </h2>
            </div>
            <LeaderboardPanel entries={leaderboard ?? []} isLoading={lbLoading} />
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Live event feed */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-1 h-4 rounded-full animate-pulse"
                style={{ backgroundColor: "#1fb25a" }}
              />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Live Event Feed
              </h2>
            </div>
            <EventFeed
              events={gameState?.recentEvents ?? []}
              isLoading={stateLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
