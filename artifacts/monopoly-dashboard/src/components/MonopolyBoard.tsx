import { useMemo } from "react";
import type { BoardSpace, Team } from "@workspace/api-client-react";
import { COLOR_GROUP_HEX } from "@/lib/constants";

interface Props {
  spaces: BoardSpace[];
  teams: Team[];
}

// Board positions mapped to CSS grid [row, col] (0-indexed, 11x11 grid)
// Position 0=GO bottom-right, clockwise: bottom→left→top→right
function getGridPos(position: number): [number, number] {
  if (position === 0) return [10, 10];
  if (position >= 1 && position <= 9) return [10, 10 - position];
  if (position === 10) return [10, 0];
  if (position >= 11 && position <= 19) return [10 - (position - 10), 0];
  if (position === 20) return [0, 0];
  if (position >= 21 && position <= 29) return [0, position - 20];
  if (position === 30) return [0, 10];
  if (position >= 31 && position <= 39) return [position - 30, 10];
  return [5, 5];
}

const CORNERS = new Set([0, 10, 20, 30]);

function BoardSpaceCell({ space, teamsHere }: { space: BoardSpace; teamsHere: Team[] }) {
  const isCorner = CORNERS.has(space.position);
  const colorHex = space.colorGroup ? COLOR_GROUP_HEX[space.colorGroup] : null;

  // Determine color band direction based on position
  const isBottom = space.position >= 1 && space.position <= 9;
  const isLeft = space.position >= 11 && space.position <= 19;
  const isTop = space.position >= 21 && space.position <= 29;
  const isRight = space.position >= 31 && space.position <= 39;

  const ownerBg = space.ownerColor ? `${space.ownerColor}22` : undefined;

  return (
    <div
      className="relative flex flex-col items-center justify-between overflow-hidden border border-border/60 text-center"
      style={{
        gridRow: `${getGridPos(space.position)[0] + 1}`,
        gridColumn: `${getGridPos(space.position)[1] + 1}`,
        backgroundColor: ownerBg ?? "hsl(var(--card))",
        minHeight: isCorner ? "70px" : "52px",
        minWidth: isCorner ? "70px" : "44px",
        fontSize: "8px",
        padding: "2px",
      }}
    >
      {/* Color band */}
      {colorHex && (
        <div
          style={{
            position: "absolute",
            backgroundColor: colorHex,
            ...(isBottom ? { bottom: 0, left: 0, right: 0, height: "10px" } :
                isLeft   ? { top: 0, left: 0, bottom: 0, width: "10px" } :
                isTop    ? { top: 0, left: 0, right: 0, height: "10px" } :
                isRight  ? { top: 0, right: 0, bottom: 0, width: "10px" } :
                           { top: 0, left: 0, right: 0, height: "10px" }),
          }}
        />
      )}

      {/* Hotel */}
      {space.hasHotel && (
        <div
          style={{
            position: "absolute",
            top: colorHex && isTop ? "12px" : "2px",
            right: "2px",
            width: "8px",
            height: "8px",
            backgroundColor: "#e74c3c",
            borderRadius: "2px",
            zIndex: 2,
          }}
        />
      )}

      {/* Owner dot */}
      {space.ownerColor && (
        <div
          style={{
            position: "absolute",
            top: "2px",
            left: "2px",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: space.ownerColor,
            border: "1px solid rgba(255,255,255,0.5)",
            zIndex: 2,
          }}
        />
      )}

      {/* Space name */}
      <div
        className="font-bold leading-tight text-foreground"
        style={{
          fontSize: isCorner ? "9px" : "7px",
          maxWidth: "100%",
          wordBreak: "break-word",
          padding: colorHex ? (isBottom || isTop ? "2px 2px 12px" : isLeft ? "2px 2px 2px 12px" : "2px 12px 2px 2px") : "2px",
          marginTop: "8px",
        }}
      >
        {space.name}
      </div>

      {/* Rent/value */}
      {space.rentValue > 0 && (
        <div style={{ fontSize: "7px", color: "hsl(var(--accent))", fontWeight: "600", paddingBottom: "2px" }}>
          ${space.rentValue}
        </div>
      )}

      {/* Type labels */}
      {space.type === "chance" && (
        <div style={{ fontSize: "8px", color: "#9b59b6", fontWeight: "700" }}>?</div>
      )}
      {space.type === "community_chest" && (
        <div style={{ fontSize: "7px", color: "#3498db", fontWeight: "700" }}>CC</div>
      )}
      {space.type === "tax" && (
        <div style={{ fontSize: "7px", color: "#e74c3c", fontWeight: "700" }}>TAX</div>
      )}
      {space.type === "dice_station" && (
        <div style={{ fontSize: "7px", color: "#1fb25a", fontWeight: "700" }}>DICE</div>
      )}

      {/* Team tokens */}
      {teamsHere.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1px", position: "absolute", bottom: colorHex && isBottom ? "12px" : "2px" }}>
          {teamsHere.map((t) => (
            <span
              key={t.id}
              title={t.name}
              style={{
                fontSize: "10px",
                lineHeight: 1,
                filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.8))",
              }}
            >
              {t.emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MonopolyBoard({ spaces, teams }: Props) {
  const teamsByPosition = useMemo(() => {
    const map: Record<number, Team[]> = {};
    for (const team of teams) {
      if (!map[team.position]) map[team.position] = [];
      map[team.position].push(team);
    }
    return map;
  }, [teams]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(11, 1fr)",
        gridTemplateRows: "repeat(11, 1fr)",
        width: "100%",
        aspectRatio: "1 / 1",
        border: "2px solid hsl(var(--border))",
        borderRadius: "4px",
        overflow: "hidden",
        backgroundColor: "hsl(var(--card))",
      }}
    >
      {/* Board spaces */}
      {spaces.map((space) => (
        <BoardSpaceCell
          key={space.id}
          space={space}
          teamsHere={teamsByPosition[space.position] ?? []}
        />
      ))}

      {/* Center branding */}
      <div
        style={{
          gridRow: "2 / 11",
          gridColumn: "2 / 11",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, hsl(160 22% 12%) 0%, hsl(160 20% 8%) 100%)",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div
          style={{
            fontSize: "clamp(14px, 3vw, 28px)",
            fontWeight: "900",
            color: "#1fb25a",
            letterSpacing: "0.05em",
            textAlign: "center",
            lineHeight: 1.2,
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          YCIS
        </div>
        <div
          style={{
            fontSize: "clamp(10px, 2vw, 18px)",
            fontWeight: "800",
            color: "#f7941d",
            letterSpacing: "0.08em",
            textAlign: "center",
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          MONOPOLY
        </div>
        <div
          style={{
            fontSize: "clamp(8px, 1.5vw, 14px)",
            fontWeight: "700",
            color: "hsl(var(--muted-foreground))",
            letterSpacing: "0.1em",
            textAlign: "center",
          }}
        >
          2026
        </div>
        <div
          style={{
            marginTop: "8px",
            display: "flex",
            gap: "4px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {Object.entries(COLOR_GROUP_HEX).map(([key, hex]) => (
            <div
              key={key}
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: hex,
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
