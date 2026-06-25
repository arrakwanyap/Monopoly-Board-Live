import { useMemo } from "react";
import type { BoardSpace, Team } from "@workspace/api-client-react";
import { COLOR_GROUP_HEX } from "@/lib/constants";
import { isTokenImage } from "@/components/TeamToken";

interface Props {
  spaces: BoardSpace[];
  teams: Team[];
}

// ── Board geometry ─────────────────────────────────────────────────────────
// board.png = 1152×1152: 2×180 + 9×88 = 1152 px
const CORNER = (180 / 1152) * 100; // 15.625 %
const CELL   = (88  / 1152) * 100; //  7.639 %
// cqi equivalents (board is square, containerType:inline-size → 100cqi = board side)
const CQI_CORNER = 15.625;
const CQI_CELL   = 7.639;

// Centre of each 11-slot axis (0 = corner, 1-9 = cells, 10 = corner)
const AXIS_CENTERS: number[] = [
  CORNER / 2,
  ...Array.from({ length: 9 }, (_, i) => CORNER + CELL * i + CELL / 2),
  CORNER + 9 * CELL + CORNER / 2,
];

// ── Grid helpers ───────────────────────────────────────────────────────────
function getGridPos(position: number): [number, number] {
  if (position === 0)                    return [10, 10];
  if (position >= 1  && position <= 9)   return [10, 10 - position];
  if (position === 10)                   return [10,  0];
  if (position >= 11 && position <= 19)  return [10 - (position - 10), 0];
  if (position === 20)                   return [ 0,  0];
  if (position >= 21 && position <= 29)  return [ 0, position - 20];
  if (position === 30)                   return [ 0, 10];
  if (position >= 31 && position <= 39)  return [position - 30, 10];
  return [5, 5];
}

function getCellBounds(row: number, col: number) {
  const left   = col === 0  ? 0 : col === 10 ? 100 - CORNER : CORNER + (col  - 1) * CELL;
  const width  = (col === 0 || col === 10) ? CORNER : CELL;
  const top    = row === 0  ? 0 : row === 10 ? 100 - CORNER : CORNER + (row  - 1) * CELL;
  const height = (row === 0 || row === 10) ? CORNER : CELL;
  return { left, top, width, height };
}

// Natural orientation: band at bottom, text above.
// Rotation puts the band at the board outer edge.
//   Bottom row → 0°    (band stays at bottom = south edge)
//   Left column → +90° CW  (bottom → left = west edge)
//   Top row → 180°          (bottom → top = north edge)
//   Right column → −90° CCW (bottom → right = east edge)
function getTileRotation(position: number): 0 | 90 | 180 | -90 {
  if ([0, 10, 20, 30].includes(position)) return 0;
  if (position >= 1  && position <= 9)    return 0;
  if (position >= 11 && position <= 19)   return 90;   // left col: CW → band goes left
  if (position >= 21 && position <= 29)   return 180;
  if (position >= 31 && position <= 39)   return -90;  // right col: CCW → band goes right
  return 0;
}

// ── Shared style constants ─────────────────────────────────────────────────
const TILE_BG     = "#ffffff";
const TILE_BORDER = "1px solid #333";

// ── Tile content components (natural orientation: band at bottom) ──────────

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
  // Use dark text on light bands, white on dark bands
  const lightBands = new Set(["light_blue", "yellow", "orange"]);
  const bandText = lightBands.has(colorGroup) ? "#111" : "#fff";

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
      {/* Info area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.25cqi 0.2cqi",
          textAlign: "center",
          overflow: "hidden",
          gap: "0.1cqi",
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
        <span style={{ fontSize: "1.05cqi", color: "#444", fontWeight: 500 }}>
          M{price}
        </span>
      </div>
      {/* Colour band – at the "bottom" of natural orientation */}
      <div
        style={{
          height: "22%",
          backgroundColor: bandColor,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: "0.7cqi", color: bandText, fontWeight: 600, letterSpacing: "0.03em" }}>
          RENT M{Math.round(price * 0.1)}
        </span>
      </div>
    </div>
  );
}

function ChanceContent() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#fff8f0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.3cqi",
        border: "none",
      }}
    >
      <span
        style={{
          fontSize: "5cqi",
          color: "#d93a96",
          fontWeight: 900,
          lineHeight: 1,
          fontFamily: "serif",
        }}
      >
        ?
      </span>
      <span
        style={{
          fontSize: "0.95cqi",
          fontWeight: 700,
          color: "#d93a96",
          letterSpacing: "0.1em",
        }}
      >
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
        backgroundColor: "#fff9e6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.3cqi",
        padding: "0.4cqi",
      }}
    >
      <span style={{ fontSize: "3.2cqi", lineHeight: 1 }}>🎁</span>
      <span
        style={{
          fontSize: "0.9cqi",
          fontWeight: 700,
          textAlign: "center",
          color: "#b8860b",
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
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.25cqi",
        padding: "0.4cqi",
      }}
    >
      <span style={{ fontSize: "2.8cqi", lineHeight: 1 }}>💰</span>
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

// GLC, Podium, ELW Trip, School Supplies — look like simple station tiles
function StationContent({ name }: { name: string }) {
  const label = name.replace(/\s*\(Dice Station\)/i, "").trim();
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.3cqi",
        padding: "0.4cqi",
      }}
    >
      <span style={{ fontSize: "2.8cqi", lineHeight: 1 }}>🎲</span>
      <span
        style={{
          fontSize: "0.95cqi",
          fontWeight: 700,
          textAlign: "center",
          color: "#1a3a6b",
          lineHeight: 1.2,
        }}
      >
        {label.toUpperCase()}
      </span>
    </div>
  );
}

// Corner tiles — use individually pre-cropped images (no CSS clipping)
const CORNER_IMAGES: Record<number, string> = {
   0: "/corner_go.png",
  10: "/corner_jail.png",
  20: "/corner_free_parking.png",
  30: "/corner_go_to_jail.png",
};

function CornerContent({ position }: { position: number }) {
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <img
        src={CORNER_IMAGES[position]}
        alt=""
        draggable={false}
        style={{
          width:          "100%",
          height:         "100%",
          objectFit:      "cover",
          display:        "block",
          userSelect:     "none",
          pointerEvents:  "none",
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

  // Inner content dims before rotation.
  // Vertical tiles (left/right column): swap to CELL_CQI × CORNER_CQI so
  // after ±90° the element fills the display cell exactly.
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
    content = <StationContent name={space.name} />;
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
          textAlign: "center",
          padding: "0.3cqi",
        }}
      >
        {space.name}
      </div>
    );
  }

  return (
    <div
      style={{
        position:  "absolute",
        left:      `${left}%`,
        top:       `${top}%`,
        width:     `${width}%`,
        height:    `${height}%`,
        border:    TILE_BORDER,
        overflow:  "hidden",
        boxSizing: "border-box",
      }}
    >
      {isCorner ? (
        content
      ) : (
        <div
          style={{
            position:  "absolute",
            top:       "50%",
            left:      "50%",
            width:     innerW,
            height:    innerH,
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
        boxShadow:       "0 1px 4px rgba(0,0,0,0.4)",
      }}
    >
      {isTokenImage(emoji) ? (
        <img
          src={emoji}
          alt={name}
          draggable={false}
          style={{ width: "72%", height: "72%", objectFit: "contain" }}
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
        position:        "relative",
        width:           "100%",
        aspectRatio:     "1 / 1",
        containerType:   "inline-size",
        backgroundColor: "#e8e0cc", // cream — shows between tile borders
        border:          "4px solid #1a2a4a",
        boxSizing:       "border-box",
        overflow:        "hidden",
      }}
    >
      {/* ── 40 individual board tiles ───────────────────────── */}
      {spaces.map((space) => (
        <BoardTile key={space.id} space={space} />
      ))}

      {/* ── Board centre — pre-cropped PNG, no scaling tricks ── */}
      <div
        style={{
          position: "absolute",
          left:     `${CORNER}%`,
          top:      `${CORNER}%`,
          width:    `${100 - 2 * CORNER}%`,
          height:   `${100 - 2 * CORNER}%`,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <img
          src="/board_center.png"
          alt="Board centre"
          draggable={false}
          style={{
            width:         "100%",
            height:        "100%",
            objectFit:     "cover",
            display:       "block",
            userSelect:    "none",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Overlay: frames + ownership tokens + team tokens ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>

        {/* Property frame: coloured outline when a team is on this tile */}
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

        {/* Ownership token: centred in the top portion of the tile */}
        {propertySpaces
          .filter((s) => s.ownerId && (s as any).ownerEmoji)
          .map((space) => {
            const [row, col] = getGridPos(space.position);
            const { left, top, width, height } = getCellBounds(row, col);
            const cx = left + width / 2;
            const cy = top  + height * 0.22;
            return (
              <div
                key={`owner-${space.id}`}
                title={`Owned by ${space.ownerName ?? "?"}`}
                style={{
                  position:  "absolute",
                  left:      `${cx}%`,
                  top:       `${cy}%`,
                  transform: "translate(-50%,-50%)",
                  zIndex:    12,
                }}
              >
                <CircleToken
                  emoji={(space as any).ownerEmoji as string}
                  name={space.ownerName ?? ""}
                  sizePercent={4.2}
                  borderColor={(space as any).ownerColor ?? "#1a3a6b"}
                />
              </div>
            );
          })}

        {/* Team tokens: centred on cell, orbit when multiple teams share a tile */}
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
              const radius = total <= 3 ? 2.0 : 2.6;
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
                  sizePercent={5.8}
                />
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
