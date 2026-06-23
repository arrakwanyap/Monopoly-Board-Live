import { useMemo } from "react";
import type { BoardSpace, Team } from "@workspace/api-client-react";

interface Props {
  spaces: BoardSpace[];
  teams: Team[];
}

// Maps board position → [row, col] in an 11×11 grid (0-indexed, top-left = [0,0])
function getGridPos(position: number): [number, number] {
  if (position === 0)  return [10, 10]; // GO — bottom-right
  if (position >= 1  && position <= 9)  return [10, 10 - position]; // bottom row, right→left
  if (position === 10) return [10, 0];  // Jail — bottom-left
  if (position >= 11 && position <= 19) return [10 - (position - 10), 0]; // left col, bottom→top
  if (position === 20) return [0, 0];   // Free Parking — top-left
  if (position >= 21 && position <= 29) return [0, position - 20]; // top row, left→right
  if (position === 30) return [0, 10];  // Go To Jail — top-right
  if (position >= 31 && position <= 39) return [position - 30, 10]; // right col, top→bottom
  return [5, 5];
}

// Cell center positions as percentages of board width/height.
// Corners ≈ 11%, regular cells ≈ 8.67% of board width each (2*11 + 9*8.67 = 100).
const CORNER = 11;
const CELL = (100 - 2 * CORNER) / 9; // ≈ 8.667%
const CELL_CENTERS: number[] = [
  CORNER / 2,                          // col/row 0  — left corner
  ...Array.from({ length: 9 }, (_, i) => CORNER + CELL * i + CELL / 2), // cols/rows 1-9
  CORNER + CELL * 9 + CORNER / 2,      // col/row 10 — right corner
];

export default function MonopolyBoard({ spaces, teams }: Props) {
  // Group teams by board position
  const teamsByPosition = useMemo(() => {
    const map: Record<number, Team[]> = {};
    for (const t of teams) {
      (map[t.position] ??= []).push(t);
    }
    return map;
  }, [teams]);

  // Owned spaces for ownership overlays
  const ownedSpaces = useMemo(
    () => spaces.filter((s) => s.ownerId && s.type === "property"),
    [spaces],
  );

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1" }}>
      {/* Actual board image — matches the Figma design exactly */}
      <img
        src="/board.png"
        alt="YCIS Monopoly Board"
        style={{ width: "100%", height: "100%", display: "block", userSelect: "none" }}
        draggable={false}
      />

      {/* Overlay container — covers the board image */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>

        {/* ── Ownership dots ──────────────────────────────────────────────── */}
        {ownedSpaces.map((space) => {
          const [row, col] = getGridPos(space.position);
          const cx = CELL_CENTERS[col];
          const cy = CELL_CENTERS[row];

          // Place the dot toward the outer edge of the space
          const isBottom = space.position >= 1  && space.position <= 9;
          const isLeft   = space.position >= 11 && space.position <= 19;
          const isTop    = space.position >= 21 && space.position <= 29;
          const isRight  = space.position >= 31 && space.position <= 39;

          const BAND = CELL * 0.32; // roughly matches the color-band depth
          const dx = isLeft ? -BAND / 2 : isRight ? BAND / 2 : 0;
          const dy = isBottom ? BAND / 2 : isTop ? -BAND / 2 : 0;

          return (
            <div
              key={`owner-${space.id}`}
              title={`Owned by ${space.ownerName ?? "?"}`}
              style={{
                position: "absolute",
                left: `${cx + dx}%`,
                top: `${cy + dy}%`,
                transform: "translate(-50%, -50%)",
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                backgroundColor: space.ownerColor ?? "#fff",
                border: "1.5px solid rgba(255,255,255,0.9)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.7)",
                zIndex: 10,
              }}
            />
          );
        })}

        {/* ── Hotel indicators ────────────────────────────────────────────── */}
        {spaces.filter((s) => s.hasHotel).map((space) => {
          const [row, col] = getGridPos(space.position);
          const cx = CELL_CENTERS[col];
          const cy = CELL_CENTERS[row];
          return (
            <div
              key={`hotel-${space.id}`}
              title="Hotel"
              style={{
                position: "absolute",
                left: `${cx + 1}%`,
                top: `${cy - 1}%`,
                transform: "translate(-50%, -50%)",
                width: "8px",
                height: "8px",
                backgroundColor: "#e74c3c",
                borderRadius: "2px",
                border: "1px solid #c0392b",
                boxShadow: "0 1px 2px rgba(0,0,0,0.6)",
                zIndex: 11,
              }}
            />
          );
        })}

        {/* ── Team tokens ─────────────────────────────────────────────────── */}
        {Object.entries(teamsByPosition).map(([posStr, teamsHere]) => {
          const position = parseInt(posStr, 10);
          const [row, col] = getGridPos(position);
          const cx = CELL_CENTERS[col];
          const cy = CELL_CENTERS[row];

          return teamsHere.map((team, idx) => {
            // Spread tokens in a small cluster when multiple teams share a space
            const total = teamsHere.length;
            let offsetX = 0;
            let offsetY = 0;
            if (total > 1) {
              const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
              const radius = total <= 3 ? 1.5 : 2.2; // % of board width
              offsetX = Math.cos(angle) * radius;
              offsetY = Math.sin(angle) * radius;
            }

            return (
              <div
                key={team.id}
                title={team.name}
                style={{
                  position: "absolute",
                  left: `${cx + offsetX}%`,
                  top: `${cy + offsetY}%`,
                  transform: "translate(-50%, -50%)",
                  fontSize: "clamp(14px, 2.2vw, 22px)",
                  lineHeight: 1,
                  filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9)) drop-shadow(0 0 6px rgba(255,255,255,0.6))",
                  zIndex: 20,
                  cursor: "default",
                }}
              >
                {team.emoji}
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
