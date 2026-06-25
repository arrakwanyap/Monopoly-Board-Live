import { useMemo } from "react";
import type { BoardSpace, Team } from "@workspace/api-client-react";
import { COLOR_GROUP_HEX } from "@/lib/constants";
import { isTokenImage } from "@/components/TeamToken";

interface Props {
  spaces: BoardSpace[];
  teams: Team[];
}

// ── Board geometry (32 tiles: 4 corners + 7 per side) ──────────────────────
// Corner = 180px, 7 inner cells per side: CELL = 792/7 = 113.14px
// At board width 1152px: CORNER% = 15.625%, CELL% = 9.821%
const CORNER   = (180 / 1152) * 100;        // 15.625 %
const CELL     = (792 / 7 / 1152) * 100;    //  9.821 %
const CQI_CORNER = 15.625;
const CQI_CELL   = 792 / 7 / 1152 * 100;   //  9.821 cqi

// Centre of each 9-slot axis (0 & 8 = corner slots, 1-7 = inner cells)
const AXIS_CENTERS: number[] = [
  CORNER / 2,
  ...Array.from({ length: 7 }, (_, i) => CORNER + CELL * i + CELL / 2),
  CORNER + 7 * CELL + CORNER / 2,
];

// ── Grid helpers ───────────────────────────────────────────────────────────
// Board positions 0-31 (32 total):
//   0       = GO corner        (row 8, col 8)
//   1-7     = bottom row       (row 8, col 7→1)
//   8       = JAIL corner      (row 8, col 0)
//   9-15    = left column      (row 7→1, col 0)
//   16      = FREE PARKING     (row 0, col 0)
//   17-23   = top row          (row 0, col 1→7)
//   24      = GO TO JAIL       (row 0, col 8)
//   25-31   = right column     (row 1→7, col 8)
function getGridPos(position: number): [number, number] {
  if (position === 0)                    return [8, 8];
  if (position >= 1  && position <= 7)   return [8, 8 - position];
  if (position === 8)                    return [8, 0];
  if (position >= 9  && position <= 15)  return [8 - (position - 8), 0];
  if (position === 16)                   return [0, 0];
  if (position >= 17 && position <= 23)  return [0, position - 16];
  if (position === 24)                   return [0, 8];
  if (position >= 25 && position <= 31)  return [position - 24, 8];
  return [4, 4];
}

function getCellBounds(row: number, col: number) {
  const left   = col === 0 ? 0 : col === 8 ? 100 - CORNER : CORNER + (col - 1) * CELL;
  const width  = (col === 0 || col === 8) ? CORNER : CELL;
  const top    = row === 0 ? 0 : row === 8 ? 100 - CORNER : CORNER + (row - 1) * CELL;
  const height = (row === 0 || row === 8) ? CORNER : CELL;
  return { left, top, width, height };
}

// Rotation so the colour band (at natural TOP) faces the board centre.
//   Bottom row → 0°   (top = board centre side ✓)
//   Left col → +90°  CW  (top → right = centre ✓)
//   Top row → 180°        (top → bottom = centre ✓)
//   Right col → −90° CCW  (top → left = centre ✓)
function getTileRotation(position: number): 0 | 90 | 180 | -90 {
  const CORNERS = [0, 8, 16, 24];
  if (CORNERS.includes(position))        return 0;
  if (position >= 1  && position <= 7)   return 0;
  if (position >= 9  && position <= 15)  return 90;
  if (position >= 17 && position <= 23)  return 180;
  if (position >= 25 && position <= 31)  return -90;
  return 0;
}

// ── Shared style ───────────────────────────────────────────────────────────
const TILE_BG     = "#fff";
const TILE_BORDER = "1px solid #333";
const KABEL       = "'Nunito', sans-serif"; // closest free web sub for ITC Kabel Std

// ── Tile content (natural orientation: band at TOP) ────────────────────────

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
  const lightBands = new Set(["light_blue", "yellow"]);
  const bandText   = lightBands.has(colorGroup) ? "#111" : "#fff";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: TILE_BG,
        fontFamily: KABEL,
        overflow: "hidden",
      }}
    >
      {/* Colour band — at TOP in natural orientation → faces board centre */}
      <div
        style={{
          height: "25%",
          backgroundColor: bandColor,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "0.65cqi",
            color: bandText,
            fontWeight: 800,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {colorGroup.replace("_", " ")}
        </span>
      </div>

      {/* Name area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.2cqi 0.3cqi",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontSize: "1.1cqi",
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#111",
            wordBreak: "break-word",
            hyphens: "auto",
          }}
        >
          {name}
        </span>
      </div>

      {/* Price — at BOTTOM in natural orientation → faces board edge */}
      <div
        style={{
          height: "22%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          borderTop: "1px solid #ddd",
        }}
      >
        <span
          style={{
            fontSize: "1.0cqi",
            fontWeight: 800,
            color: "#111",
            fontFamily: KABEL,
          }}
        >
          ${price}
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
        backgroundColor: "#fffef0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: KABEL,
        overflow: "hidden",
      }}
    >
      {/* CHANCE label — at TOP */}
      <div
        style={{
          paddingTop: "0.5cqi",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <span
          style={{
            fontSize: "1.0cqi",
            fontWeight: 900,
            color: "#d93a96",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          CHANCE
        </span>
      </div>

      {/* Stylised question mark — at BOTTOM */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "4.8cqi",
            fontWeight: 900,
            color: "#d93a96",
            fontStyle: "italic",
            lineHeight: 1,
            fontFamily: "'Georgia', serif",
            textShadow: "2px 2px 0 rgba(217,58,150,0.2)",
          }}
        >
          ?
        </span>
      </div>
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
        gap: "0.3cqi",
        padding: "0.4cqi",
        fontFamily: KABEL,
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
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {name}
      </span>
    </div>
  );
}

// ── Corner tiles ───────────────────────────────────────────────────────────
const CORNER_IMAGES: Record<number, string> = {
   0: "/corner_go.png",
   8: "/corner_jail.png",
  16: "/corner_free_parking.png",
  24: "/corner_go_to_jail.png",
};

function CornerContent({ position }: { position: number }) {
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <img
        src={CORNER_IMAGES[position]}
        alt=""
        draggable={false}
        style={{
          width: "100%", height: "100%",
          objectFit: "cover", display: "block",
          userSelect: "none", pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ── BoardTile ──────────────────────────────────────────────────────────────
const CORNER_POSITIONS = new Set([0, 8, 16, 24]);

function BoardTile({ space }: { space: BoardSpace }) {
  const [row, col] = getGridPos(space.position);
  const { left, top, width, height } = getCellBounds(row, col);
  const rotation  = getTileRotation(space.position);
  const isVert    = rotation === 90 || rotation === -90;
  const isCorner  = CORNER_POSITIONS.has(space.position);

  // Pre-rotation inner dimensions (swapped for vertical tiles so after ±90° the
  // element exactly fills the outer cell: CELL_CQI wide → CORNER_CQI after rotation)
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
  } else if (space.type === "tax") {
    content = <TaxContent name={space.name} />;
  } else {
    content = (
      <div
        style={{
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1cqi", backgroundColor: TILE_BG,
          textAlign: "center", padding: "0.3cqi",
          fontFamily: KABEL,
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
        left: `${left}%`, top: `${top}%`,
        width: `${width}%`, height: `${height}%`,
        border: TILE_BORDER, overflow: "hidden", boxSizing: "border-box",
      }}
    >
      {isCorner ? (
        content
      ) : (
        <div
          style={{
            position: "absolute", top: "50%", left: "50%",
            width: innerW, height: innerH,
            transform: `translate(-50%,-50%) rotate(${rotation}deg)`,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

// ── Team / ownership token circle ──────────────────────────────────────────
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
        width: `${sizePercent}%`, aspectRatio: "1 / 1",
        borderRadius: "50%", backgroundColor: "#fff",
        border: `2px solid ${borderColor}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", flexShrink: 0,
        boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
      }}
    >
      {isTokenImage(emoji) ? (
        <img src={emoji} alt={name} draggable={false}
          style={{ width: "72%", height: "72%", objectFit: "contain" }} />
      ) : (
        <span style={{ fontSize: `${sizePercent * 0.45}cqi`, lineHeight: 1 }}>{emoji}</span>
      )}
    </div>
  );
}

// ── Main board component ───────────────────────────────────────────────────
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
        backgroundColor: "#fff",   // white → no cream grid showing between tiles
        border: "4px solid #1a2a4a",
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: KABEL,
      }}
    >
      {/* 32 board tiles */}
      {spaces.map((space) => (
        <BoardTile key={space.id} space={space} />
      ))}

      {/* Board centre — pre-cropped PNG */}
      <div
        style={{
          position: "absolute",
          left: `${CORNER}%`, top: `${CORNER}%`,
          width: `${100 - 2 * CORNER}%`, height: `${100 - 2 * CORNER}%`,
          overflow: "hidden", pointerEvents: "none",
        }}
      >
        <img
          src="/board_center.png"
          alt=""
          draggable={false}
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", display: "block",
            userSelect: "none", pointerEvents: "none",
          }}
        />
      </div>

      {/* Overlay: frames + ownership tokens + team tokens */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>

        {/* Highlight frame around tiles where a team is standing */}
        {propertySpaces.map((space) => {
          const here = teamsByPosition[space.position] ?? [];
          if (!here.length) return null;
          const [row, col] = getGridPos(space.position);
          const { left, top, width, height } = getCellBounds(row, col);
          return (
            <div
              key={`frame-${space.id}`}
              style={{
                position: "absolute",
                left: `${left}%`, top: `${top}%`,
                width: `${width}%`, height: `${height}%`,
                outline: `3px solid ${here[0].color}`,
                outlineOffset: "-3px",
                zIndex: 8,
              }}
            />
          );
        })}

        {/* Ownership mini-token */}
        {propertySpaces
          .filter((s) => s.ownerId && (s as any).ownerEmoji)
          .map((space) => {
            const [row, col] = getGridPos(space.position);
            const { left, top, width, height } = getCellBounds(row, col);
            return (
              <div
                key={`owner-${space.id}`}
                title={`Owned by ${space.ownerName ?? "?"}`}
                style={{
                  position: "absolute",
                  left: `${left + width / 2}%`,
                  top:  `${top + height * 0.22}%`,
                  transform: "translate(-50%,-50%)",
                  zIndex: 12,
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

        {/* Team tokens — orbit when multiple teams share a tile */}
        {Object.entries(teamsByPosition).map(([posStr, here]) => {
          const pos = parseInt(posStr, 10);
          const [row, col] = getGridPos(pos);
          const cx = AXIS_CENTERS[col];
          const cy = AXIS_CENTERS[row];

          return here.map((team, idx) => {
            let dx = 0, dy = 0;
            if (here.length > 1) {
              const angle  = (idx / here.length) * 2 * Math.PI - Math.PI / 2;
              const radius = here.length <= 3 ? 2.0 : 2.6;
              dx = Math.cos(angle) * radius;
              dy = Math.sin(angle) * radius;
            }
            return (
              <div
                key={team.id}
                title={team.name}
                style={{
                  position: "absolute",
                  left: `${cx + dx}%`, top: `${cy + dy}%`,
                  transform: "translate(-50%,-50%)",
                  zIndex: 20,
                }}
              >
                <CircleToken emoji={team.emoji} name={team.name} sizePercent={5.8} />
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
