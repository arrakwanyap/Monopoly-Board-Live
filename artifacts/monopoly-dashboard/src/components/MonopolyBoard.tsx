import { useMemo } from "react";
import type { BoardSpace, Team } from "@workspace/api-client-react";
import { isTokenImage } from "@/components/TeamToken";

interface Props {
  spaces: BoardSpace[];
  teams: Team[];
}

// ── Board geometry ──────────────────────────────────────────────────────────
// board.png is 1152×1152 px.
// 2 × 180px corners + 9 × 88px regular cells = 1152px exactly.
const BOARD_PX = 1152;
const CORNER_PX = 180;
const CELL_PX = 88;
const CORNER = (CORNER_PX / BOARD_PX) * 100; // 15.625 %
const CELL   = (CELL_PX   / BOARD_PX) * 100; // 7.639  %

// Percentage-based centre for each grid index 0‥10
const CELL_CENTERS: number[] = [
  CORNER / 2,
  ...Array.from({ length: 9 }, (_, i) => CORNER + CELL * i + CELL / 2),
  CORNER + CELL * 9 + CORNER / 2,
];

// Map board position (0‥39) → [row, col] in the 11×11 grid
// Corners: 0=GO=[10,10], 10=JAIL=[10,0], 20=FreeParking=[0,0], 30=GoToJail=[0,10]
function getGridPos(position: number): [number, number] {
  if (position === 0)                      return [10, 10];
  if (position >= 1  && position <= 9)     return [10, 10 - position];
  if (position === 10)                     return [10, 0];
  if (position >= 11 && position <= 19)    return [10 - (position - 10), 0];
  if (position === 20)                     return [0,  0];
  if (position >= 21 && position <= 29)    return [0,  position - 20];
  if (position === 30)                     return [0,  10];
  if (position >= 31 && position <= 39)    return [position - 30, 10];
  return [5, 5];
}

// Bounding box (in %) for a cell in the 11×11 grid
function getCellBounds(row: number, col: number) {
  const left   = col  === 0  ? 0             : col  === 10 ? 100 - CORNER : CORNER + (col  - 1) * CELL;
  const width  = col  === 0 || col  === 10   ? CORNER       : CELL;
  const top    = row  === 0  ? 0             : row  === 10 ? 100 - CORNER : CORNER + (row  - 1) * CELL;
  const height = row  === 0 || row  === 10   ? CORNER       : CELL;
  return { left, top, width, height };
}

// ── Token circle ─────────────────────────────────────────────────────────────
// Renders a team token (image or emoji) inside a white circle with navy border.
// sizePercent is expressed as % of the board container width.
// The circle is always perfectly round because we use aspectRatio 1/1 on the
// wrapper, never a height percentage (which would resolve against parent height
// and could differ from parent width).
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
  return (
    <div
      style={{
        width: `${sizePercent}%`,
        aspectRatio: "1 / 1",
        borderRadius: "50%",
        backgroundColor: "#ffffff",
        border: "2px solid " + borderColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {isTokenImage(emoji) ? (
        <img
          src={emoji}
          alt={name}
          draggable={false}
          style={{
            width: "70%",
            height: "70%",
            objectFit: "contain",
            display: "block",
          }}
        />
      ) : (
        <span style={{ fontSize: `${sizePercent * 0.45}cqi`, lineHeight: 1 }}>
          {emoji}
        </span>
      )}
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function MonopolyBoard({ spaces, teams }: Props) {
  const teamsByPosition = useMemo(() => {
    const map: Record<number, Team[]> = {};
    for (const t of teams) (map[t.position] ??= []).push(t);
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
      {/* ── Board image ─────────────────────────────────────── */}
      <img
        src="/board.png"
        alt="YCIS Monopoly Board"
        style={{ width: "100%", height: "100%", display: "block", userSelect: "none" }}
        draggable={false}
      />

      {/* ── Overlay ─────────────────────────────────────────── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>

        {/* Property frames: coloured outline when a team is standing on this tile */}
        {propertySpaces.map((space) => {
          const teamsHere = teamsByPosition[space.position] ?? [];
          if (teamsHere.length === 0) return null;
          const [row, col] = getGridPos(space.position);
          const { left, top, width, height } = getCellBounds(row, col);
          return (
            <div
              key={`frame-${space.id}`}
              style={{
                position: "absolute",
                left:   `${left}%`,
                top:    `${top}%`,
                width:  `${width}%`,
                height: `${height}%`,
                outline: `3.5px solid ${teamsHere[0].color}`,
                outlineOffset: "-3.5px",
                zIndex: 8,
              }}
            />
          );
        })}

        {/* Ownership tokens: small circle at the top-left of the tile */}
        {propertySpaces
          .filter((s) => s.ownerId && (s as any).ownerEmoji)
          .map((space) => {
            const [row, col] = getGridPos(space.position);
            const { left, top } = getCellBounds(row, col);
            return (
              <div
                key={`owner-${space.id}`}
                title={`Owned by ${space.ownerName ?? "?"}`}
                style={{
                  position: "absolute",
                  left: `${left + 0.3}%`,
                  top:  `${top  + 0.3}%`,
                  zIndex: 12,
                }}
              >
                <CircleToken
                  emoji={(space as any).ownerEmoji as string}
                  name={space.ownerName ?? ""}
                  sizePercent={4.2}
                />
              </div>
            );
          })}

        {/* Team tokens: centred on the cell, one per team with a small orbit offset
            when multiple teams share the same cell                               */}
        {Object.entries(teamsByPosition).map(([posStr, teamsHere]) => {
          const position = parseInt(posStr, 10);
          const [row, col] = getGridPos(position);
          const cx = CELL_CENTERS[col];
          const cy = CELL_CENTERS[row];

          return teamsHere.map((team, idx) => {
            const total = teamsHere.length;
            let dx = 0, dy = 0;
            if (total > 1) {
              const angle  = (idx / total) * 2 * Math.PI - Math.PI / 2;
              const radius = total <= 3 ? 1.6 : 2.2;
              dx = Math.cos(angle) * radius;
              dy = Math.sin(angle) * radius;
            }

            return (
              <div
                key={team.id}
                title={team.name}
                style={{
                  position: "absolute",
                  left:      `${cx + dx}%`,
                  top:       `${cy + dy}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 20,
                }}
              >
                <CircleToken
                  emoji={team.emoji}
                  name={team.name}
                  sizePercent={5.6}
                />
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
