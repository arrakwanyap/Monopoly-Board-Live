import { useMemo } from "react";
import type { BoardSpace, Team } from "@workspace/api-client-react";
import TeamToken from "@/components/TeamToken";

interface Props {
  spaces: BoardSpace[];
  teams: Team[];
}

function getGridPos(position: number): [number, number] {
  if (position === 0)  return [10, 10];
  if (position >= 1  && position <= 9)  return [10, 10 - position];
  if (position === 10) return [10, 0];
  if (position >= 11 && position <= 19) return [10 - (position - 10), 0];
  if (position === 20) return [0, 0];
  if (position >= 21 && position <= 29) return [0, position - 20];
  if (position === 30) return [0, 10];
  if (position >= 31 && position <= 39) return [position - 30, 10];
  return [5, 5];
}

const CORNER = 11;
const CELL = (100 - 2 * CORNER) / 9;

const CELL_CENTERS: number[] = [
  CORNER / 2,
  ...Array.from({ length: 9 }, (_, i) => CORNER + CELL * i + CELL / 2),
  CORNER + CELL * 9 + CORNER / 2,
];

function getCellBounds(row: number, col: number) {
  let left: number, width: number, top: number, height: number;
  if (col === 0)       { left = 0;              width = CORNER; }
  else if (col === 10) { left = 100 - CORNER;   width = CORNER; }
  else                 { left = CORNER + (col - 1) * CELL; width = CELL; }

  if (row === 0)       { top = 0;              height = CORNER; }
  else if (row === 10) { top = 100 - CORNER;   height = CORNER; }
  else                 { top = CORNER + (row - 1) * CELL; height = CELL; }

  return { left, top, width, height };
}

export default function MonopolyBoard({ spaces, teams }: Props) {
  const teamsByPosition = useMemo(() => {
    const map: Record<number, Team[]> = {};
    for (const t of teams) {
      (map[t.position] ??= []).push(t);
    }
    return map;
  }, [teams]);

  const propertySpaces = useMemo(
    () => spaces.filter((s) => s.type === "property"),
    [spaces],
  );

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1" }}>
      <img
        src="/board.png"
        alt="YCIS Monopoly Board"
        style={{ width: "100%", height: "100%", display: "block", userSelect: "none" }}
        draggable={false}
      />

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>

        {/* ── Property frames: team landed on this space ──────────────────── */}
        {propertySpaces.map((space) => {
          const teamsHere = teamsByPosition[space.position] ?? [];
          if (teamsHere.length === 0) return null;

          const [row, col] = getGridPos(space.position);
          const { left, top, width, height } = getCellBounds(row, col);
          const color = teamsHere[0].color;

          return (
            <div
              key={`frame-${space.id}`}
              style={{
                position: "absolute",
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`,
                boxShadow: `inset 0 0 0 3px ${color}, inset 0 0 0 5px rgba(255,255,255,0.25)`,
                zIndex: 8,
              }}
            />
          );
        })}

        {/* ── Owner token: top-left corner of property tile ───────────────── */}
        {propertySpaces.filter((s) => s.ownerId && (s as any).ownerEmoji).map((space) => {
          const [row, col] = getGridPos(space.position);
          const { left, top } = getCellBounds(row, col);

          return (
            <div
              key={`owner-token-${space.id}`}
              title={`Owned by ${space.ownerName ?? "?"}`}
              style={{
                position: "absolute",
                left: `${left + 0.25}%`,
                top: `${top + 0.25}%`,
                zIndex: 12,
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.8))",
              }}
            >
              <TeamToken
                emoji={(space as any).ownerEmoji as string}
                name={space.ownerName ?? ""}
                size={14}
                style={{ display: "block" }}
              />
            </div>
          );
        })}

        {/* ── Hotel indicators ─────────────────────────────────────────────── */}
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

        {/* ── Team tokens ──────────────────────────────────────────────────── */}
        {Object.entries(teamsByPosition).map(([posStr, teamsHere]) => {
          const position = parseInt(posStr, 10);
          const [row, col] = getGridPos(position);
          const cx = CELL_CENTERS[col];
          const cy = CELL_CENTERS[row];

          return teamsHere.map((team, idx) => {
            const total = teamsHere.length;
            let offsetX = 0;
            let offsetY = 0;
            if (total > 1) {
              const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
              const radius = total <= 3 ? 1.5 : 2.2;
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
                  zIndex: 20,
                  cursor: "default",
                  filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.85))",
                }}
              >
                <TeamToken
                  emoji={team.emoji}
                  name={team.name}
                  size={Math.round(window.innerWidth * 0.034)}
                  style={{ display: "block" }}
                />
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
