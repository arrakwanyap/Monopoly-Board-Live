import { useMemo } from "react";
import type { BoardSpace, Team } from "@workspace/api-client-react";
import { COLOR_GROUP_HEX } from "@/lib/constants";
import { isTokenImage } from "@/components/TeamToken";

interface Props {
  spaces: BoardSpace[];
  teams: Team[];
}

// ── Board geometry ─────────────────────────────────────────────────────────
// board.png is 1152×1152 px: 2×180 + 9×88 = 1152 exactly.
const CORNER = (180 / 1152) * 100; // 15.625 %
const CELL   = (88  / 1152) * 100; // 7.639  %
// Same values as cqi units (board is square, 100cqi = board width = board height)
const CQI_CORNER = 15.625;
const CQI_CELL   = 7.639;

// Centre position for each 11-element axis (col 0‥10 or row 0‥10)
const AXIS_CENTERS: number[] = [
  CORNER / 2,
  ...Array.from({ length: 9 }, (_, i) => CORNER + CELL * i + CELL / 2),
  CORNER + 9 * CELL + CORNER / 2,
];

// ── Grid mapping ───────────────────────────────────────────────────────────
function getGridPos(position: number): [number, number] {
  if (position === 0)                    return [10, 10];
  if (position >= 1  && position <= 9)   return [10, 10 - position];
  if (position === 10)                   return [10, 0];
  if (position >= 11 && position <= 19)  return [10 - (position - 10), 0];
  if (position === 20)                   return [0, 0];
  if (position >= 21 && position <= 29)  return [0, position - 20];
  if (position === 30)                   return [0, 10];
  if (position >= 31 && position <= 39)  return [position - 30, 10];
  return [5, 5];
}

function getCellBounds(row: number, col: number) {
  const left   = col === 0  ? 0 : col === 10 ? 100 - CORNER : CORNER + (col  - 1) * CELL;
  const width  = col === 0 || col === 10 ? CORNER : CELL;
  const top    = row === 0  ? 0 : row === 10 ? 100 - CORNER : CORNER + (row  - 1) * CELL;
  const height = row === 0 || row === 10 ? CORNER : CELL;
  return { left, top, width, height };
}

// Natural rotation for each board section (band is always rendered at the "bottom"
// of the inner content div, and the whole thing is rotated to put it at the board edge).
// Bottom row → 0°   Left column → −90°   Top row → 180°   Right column → 90°
function getTileRotation(position: number): 0 | 90 | 180 | -90 {
  if ([0, 10, 20, 30].includes(position)) return 0;
  if (position >= 1  && position <= 9)    return 0;
  if (position >= 11 && position <= 19)   return -90;
  if (position >= 21 && position <= 29)   return 180;
  if (position >= 31 && position <= 39)   return 90;
  return 0;
}

// ── Tile content renderers ─────────────────────────────────────────────────
const TILE_BORDER = "1px solid #222";
const TILE_BG     = "#ffffff";

// Natural layout: info area (top flex-1) + colour band (bottom, fixed height).
// The whole inner div is rotated by parent to face the correct board edge.
function PropertyContent({
  name,
  colorGroup,
  price,
}: {
  name: string;
  colorGroup: string;
  price: number;
}) {
  const bandColor = COLOR_GROUP_HEX[colorGroup] ?? "#ccc";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: TILE_BG,
        overflow: "hidden",
      }}
    >
      {/* text area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.3cqi 0.2cqi",
          textAlign: "center",
          overflow: "hidden",
          gap: "0.15cqi",
        }}
      >
        <span
          style={{
            fontSize: "1.15cqi",
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#111",
            wordBreak: "break-word",
            hyphens: "auto",
          }}
        >
          {name}
        </span>
        <span style={{ fontSize: "1.05cqi", color: "#333" }}>M{price}</span>
      </div>
      {/* colour band – bottom 22 % of the natural height */}
      <div
        style={{
          height: "22%",
          backgroundColor: bandColor,
          flexShrink: 0,
          border: "none",
        }}
      />
    </div>
  );
}

function ChanceContent() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: TILE_BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.3cqi",
      }}
    >
      <span style={{ fontSize: "4.5cqi", color: "#d93a96", fontWeight: 900, lineHeight: 1 }}>?</span>
      <span style={{ fontSize: "1.0cqi", fontWeight: 700, letterSpacing: "0.05em", color: "#333" }}>
        CHANCE
      </span>
    </div>
  );
}

function CommunityChestContent({ name }: { name: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#fffbea",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.3cqi",
        padding: "0.5cqi",
      }}
    >
      <span style={{ fontSize: "3cqi", lineHeight: 1 }}>🏆</span>
      <span
        style={{
          fontSize: "0.95cqi",
          fontWeight: 700,
          textAlign: "center",
          color: "#333",
          lineHeight: 1.2,
        }}
      >
        {name.toUpperCase()}
      </span>
    </div>
  );
}

function TaxContent({ name }: { name: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: TILE_BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.3cqi",
        padding: "0.5cqi",
      }}
    >
      <span style={{ fontSize: "3cqi", lineHeight: 1 }}>💸</span>
      <span
        style={{
          fontSize: "0.9cqi",
          fontWeight: 700,
          textAlign: "center",
          color: "#333",
          lineHeight: 1.2,
        }}
      >
        {name.toUpperCase()}
      </span>
    </div>
  );
}

function DiceStationContent({ name }: { name: string }) {
  // Strip "(Dice Station)" from name for display
  const label = name.replace(/\s*\(Dice Station\)/i, "").trim();
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#eaf4ff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.3cqi",
        padding: "0.5cqi",
      }}
    >
      <span style={{ fontSize: "3cqi", lineHeight: 1 }}>🎲</span>
      <span
        style={{
          fontSize: "0.9cqi",
          fontWeight: 700,
          textAlign: "center",
          color: "#1a4a8a",
          lineHeight: 1.2,
        }}
      >
        {label.toUpperCase()}
      </span>
    </div>
  );
}

// Corner tiles: clip board.png to show just that corner.
// board.png = 1152×1152 px; each corner = 180px.
// img dims: 1152/180 = 640% of corner tile; offsets use the same ratio.
const CORNER_SCALE = (1152 / 180) * 100; // 640 %
const CORNER_OFFSET = (972 / 180) * 100; // 540 % (= 1152-180 / 180 * 100)

function CornerContent({ position }: { position: number }) {
  let imgLeft = "0%";
  let imgTop  = "0%";

  // pos 20 = Free Parking (top-left):  x=0,   y=0   → no offset
  // pos 30 = Go To Jail (top-right):   x=972, y=0   → left=-540%, top=0%
  // pos 10 = Jail (bottom-left):       x=0,   y=972 → left=0%,   top=-540%
  // pos  0 = GO (bottom-right):        x=972, y=972 → left=-540%, top=-540%
  if (position === 30 || position === 0)  imgLeft = `-${CORNER_OFFSET}%`;
  if (position === 10 || position === 0)  imgTop  = `-${CORNER_OFFSET}%`;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: TILE_BG,
      }}
    >
      <img
        src="/board.png"
        alt=""
        draggable={false}
        style={{
          position: "absolute",
          width:  `${CORNER_SCALE}%`,
          height: `${CORNER_SCALE}%`,
          left:   imgLeft,
          top:    imgTop,
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ── BoardTile ──────────────────────────────────────────────────────────────
function BoardTile({ space }: { space: BoardSpace }) {
  const [row, col] = getGridPos(space.position);
  const { left, top, width, height } = getCellBounds(row, col);
  const rotation = getTileRotation(space.position);
  const isVert   = rotation === 90 || rotation === -90;
  const isCorner = [0, 10, 20, 30].includes(space.position);

  // Inner content dimensions (before rotation).
  // For vertical tiles (left/right column): swap to CELL_CQI × CORNER_CQI
  // so after ±90° rotation the element fits the display cell exactly.
  const innerW = isVert ? `${CQI_CELL}cqi`   : "100%";
  const innerH = isVert ? `${CQI_CORNER}cqi` : "100%";

  let content: React.ReactNode;
  if (isCorner) {
    content = <CornerContent position={space.position} />;
  } else if (space.type === "property" && space.colorGroup) {
    content = (
      <PropertyContent
        name={space.name}
        colorGroup={space.colorGroup}
        price={space.propertyValue}
      />
    );
  } else if (space.type === "chance") {
    content = <ChanceContent />;
  } else if (space.type === "community_chest") {
    content = <CommunityChestContent name={space.name} />;
  } else if (space.type === "tax") {
    content = <TaxContent name={space.name} />;
  } else if (space.type === "dice_station") {
    content = <DiceStationContent name={space.name} />;
  } else {
    content = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1cqi",
          backgroundColor: TILE_BG,
        }}
      >
        {space.name}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left:   `${left}%`,
        top:    `${top}%`,
        width:  `${width}%`,
        height: `${height}%`,
        border: TILE_BORDER,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {isCorner ? (
        content
      ) : (
        <div
          style={{
            position: "absolute",
            top:  "50%",
            left: "50%",
            width:  innerW,
            height: innerH,
            transform: `translate(-50%,-50%) rotate(${rotation}deg)`,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

// ── Token circle ───────────────────────────────────────────────────────────
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
        width:           `${sizePercent}%`,
        aspectRatio:     "1 / 1",
        borderRadius:    "50%",
        backgroundColor: "#fff",
        border:          `2px solid ${borderColor}`,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        overflow:        "hidden",
        flexShrink:      0,
        boxShadow:       "0 1px 4px rgba(0,0,0,0.35)",
      }}
    >
      {isTokenImage(emoji) ? (
        <img
          src={emoji}
          alt={name}
          draggable={false}
          style={{ width: "70%", height: "70%", objectFit: "contain" }}
        />
      ) : (
        <span style={{ fontSize: `${sizePercent * 0.45}cqi`, lineHeight: 1 }}>{emoji}</span>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
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
        position:      "relative",
        width:         "100%",
        aspectRatio:   "1 / 1",
        containerType: "inline-size",
        backgroundColor: "#1a2a4a", // board outer border colour
        border: "3px solid #1a2a4a",
        boxSizing: "border-box",
      }}
    >
      {/* ── Board tiles ─────────────────────────────────────── */}
      {spaces.map((space) => (
        <BoardTile key={space.id} space={space} />
      ))}

      {/* ── Board centre (logo from board.png) ──────────────── */}
      <div
        style={{
          position:   "absolute",
          left:       `${CORNER}%`,
          top:        `${CORNER}%`,
          width:      `${100 - 2 * CORNER}%`,
          height:     `${100 - 2 * CORNER}%`,
          overflow:   "hidden",
          pointerEvents: "none",
        }}
      >
        {/* Scale board.png so that its centre section exactly fills this div */}
        <img
          src="/board.png"
          alt="Board centre"
          draggable={false}
          style={{
            position: "absolute",
            // 100 / 68.75 = 145.45 %
            width:  `${(1152 / (1152 - 360)) * 100}%`,
            height: `${(1152 / (1152 - 360)) * 100}%`,
            // -(180 / 792) = −22.73 %
            left: `-${(180 / (1152 - 360)) * 100}%`,
            top:  `-${(180 / (1152 - 360)) * 100}%`,
            userSelect:    "none",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Overlay (tokens + frames) ────────────────────────── */}
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
                position:      "absolute",
                left:          `${left}%`,
                top:           `${top}%`,
                width:         `${width}%`,
                height:        `${height}%`,
                outline:       `3px solid ${teamsHere[0].color}`,
                outlineOffset: "-3px",
                zIndex:        8,
              }}
            />
          );
        })}

        {/* Ownership tokens: pinned to tile center-top so they never hide under borders */}
        {propertySpaces
          .filter((s) => s.ownerId && (s as any).ownerEmoji)
          .map((space) => {
            const [row, col] = getGridPos(space.position);
            const { left, top, width, height } = getCellBounds(row, col);
            // Centre-top of tile
            const cx = left + width / 2;
            const cy = top  + height * 0.18;
            return (
              <div
                key={`owner-${space.id}`}
                title={`Owned by ${space.ownerName ?? "?"}`}
                style={{
                  position:  "absolute",
                  left:      `${cx}%`,
                  top:       `${cy}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex:    12,
                }}
              >
                <CircleToken
                  emoji={(space as any).ownerEmoji as string}
                  name={space.ownerName ?? ""}
                  sizePercent={4.0}
                  borderColor={(space as any).ownerColor ?? "#1a3a6b"}
                />
              </div>
            );
          })}

        {/* Team tokens: centred on cell, orbiting when multiple teams share a cell */}
        {Object.entries(teamsByPosition).map(([posStr, teamsHere]) => {
          const position = parseInt(posStr, 10);
          const [row, col] = getGridPos(position);
          const cx = AXIS_CENTERS[col];
          const cy = AXIS_CENTERS[row];

          return teamsHere.map((team, idx) => {
            const total = teamsHere.length;
            let dx = 0, dy = 0;
            if (total > 1) {
              const angle  = (idx / total) * 2 * Math.PI - Math.PI / 2;
              const radius = total <= 3 ? 1.8 : 2.4;
              dx = Math.cos(angle) * radius;
              dy = Math.sin(angle) * radius;
            }
            return (
              <div
                key={team.id}
                title={team.name}
                style={{
                  position:  "absolute",
                  left:      `${cx + dx}%`,
                  top:       `${cy + dy}%`,
                  transform: "translate(-50%,-50%)",
                  zIndex:    20,
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
