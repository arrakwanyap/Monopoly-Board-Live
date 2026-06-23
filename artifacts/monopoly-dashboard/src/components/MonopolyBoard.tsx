import { useMemo } from "react";
import type { BoardSpace, Team } from "@workspace/api-client-react";
import { isTokenImage } from "@/components/TeamToken";

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
const CELL = (100 - 2 * CORNER) / 9; // ≈ 8.667%

const CELL_CENTERS: number[] = [
  CORNER / 2,
  ...Array.from({ length: 9 }, (_, i) => CORNER + CELL * i + CELL / 2),
  CORNER + CELL * 9 + CORNER / 2,
];

function getCellBounds(row: number, col: number) {
  let left: number, width: number, top: number, height: number;
  if (col === 0)       { left = 0;            width = CORNER; }
  else if (col === 10) { left = 100 - CORNER; width = CORNER; }
  else                 { left = CORNER + (col - 1) * CELL; width = CELL; }
  if (row === 0)       { top = 0;             height = CORNER; }
  else if (row === 10) { top = 100 - CORNER;  height = CORNER; }
  else                 { top = CORNER + (row - 1) * CELL; height = CELL; }
  return { left, top, width, height };
}

// Render a token inside a white circle with navy border.
// Size is given as % of the board container width so it scales.
function CircleToken({
  emoji,
  name,
  sizePercent,
  borderColor = "#1a3a6b",
}: {
  emoji: string;
  name: string;
  sizePercent: number;
  borderColor?: string;
}) {
  const inner = isTokenImage(emoji) ? (
    <img
      src={emoji}
      alt={name}
      draggable={false}
      style={{ width: "68%", height: "68%", objectFit: "contain", display: "block", flexShrink: 0 }}
    />
  ) : (
    <span style={{ fontSize: `${sizePercent * 0.45}cqi`, lineHeight: 1 }}>{emoji}</span>
  );

  return (
    <div
      style={{
        width: `${sizePercent}%`,
        height: `${sizePercent}%`,
        borderRadius: "50%",
        backgroundColor: "#ffffff",
        border: `2px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {inner}
    </div>
  );
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
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1 / 1",
        containerType: "inline-size",
      }}
    >
      {/* Board image */}
      <img
        src="/board.png"
        alt="YCIS Monopoly Board"
        style={{ width: "100%", height: "100%", display: "block", userSelect: "none" }}
        draggable={false}
      />

      {/* Overlay container */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>

        {/* ── Property frames: thick coloured border when a team is on this space */}
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
                outline: `3.5px solid ${color}`,
                outlineOffset: "-3.5px",
                zIndex: 8,
              }}
            />
          );
        })}

        {/* ── Owner token circles: small, in the top-left corner of the tile */}
        {propertySpaces
          .filter((s) => s.ownerId && (s as any).ownerEmoji)
          .map((space) => {
            const [row, col] = getGridPos(space.position);
            const { left, top } = getCellBounds(row, col);
            return (
              <div
                key={`owner-token-${space.id}`}
                title={`Owned by ${space.ownerName ?? "?"}`}
                style={{
                  position: "absolute",
                  left: `${left + 0.3}%`,
                  top: `${top + 0.3}%`,
                  zIndex: 12,
                }}
              >
                <CircleToken
                  emoji={(space as any).ownerEmoji as string}
                  name={space.ownerName ?? ""}
                  sizePercent={4.4}
                />
              </div>
            );
          })}

        {/* ── Hotel indicators */}
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
                left: `${cx + 1.2}%`,
                top: `${cy - 1.2}%`,
                transform: "translate(-50%, -50%)",
                width: "1.1%",
                height: "1.1%",
                backgroundColor: "#e74c3c",
                borderRadius: "2px",
                border: "1px solid #c0392b",
                zIndex: 11,
              }}
            />
          );
        })}

        {/* ── Team token circles: centered on the cell, larger */}
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
              const radius = total <= 3 ? 1.8 : 2.5;
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
                }}
              >
                <CircleToken
                  emoji={team.emoji}
                  name={team.name}
                  sizePercent={5.8}
                  borderColor="#1a3a6b"
                />
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
