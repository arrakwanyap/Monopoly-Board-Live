import { useMemo } from "react";
import type { BoardSpace, Team } from "@workspace/api-client-react";
import { COLOR_GROUP_HEX } from "@/lib/constants";
import { isTokenImage } from "@/components/TeamToken";

interface Props {
  spaces: BoardSpace[];
  teams: Team[];
}

// ── Board geometry (32 tiles: 4 corners + 7 per side) ──────────────────────
const CORNER   = (180 / 1152) * 100;
const CELL     = (792 / 7 / 1152) * 100;
const CQI_CORNER = 15.625;
const CQI_CELL   = 792 / 7 / 1152 * 100;

const AXIS_CENTERS: number[] = [
  CORNER / 2,
  ...Array.from({ length: 7 }, (_, i) => CORNER + CELL * i + CELL / 2),
  CORNER + 7 * CELL + CORNER / 2,
];

// ── Grid helpers ───────────────────────────────────────────────────────────
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

function getTileRotation(position: number): 0 | 90 | 180 | -90 {
  const CORNERS = [0, 8, 16, 24];
  if (CORNERS.includes(position))        return 0;
  if (position >= 1  && position <= 7)   return 0;
  if (position >= 9  && position <= 15)  return 90;
  if (position >= 17 && position <= 23)  return 180;
  if (position >= 25 && position <= 31)  return -90;
  return 0;
}

// ── Shared tokens ──────────────────────────────────────────────────────────
const TILE_BG     = "#E7E3E4";
const TILE_BORDER = "1px solid #001D61";
const NAVY        = "#001D61";
const RED         = "#ed1c24";
const ORANGE      = "#f7941d";
const KABEL       = "'ITC Kabel Std', 'Nunito', sans-serif";

// ── Property tile ──────────────────────────────────────────────────────────
function PropertyContent({ name, colorGroup, price }: {
  name: string; colorGroup: string; price: number;
}) {
  const bandColor = COLOR_GROUP_HEX[colorGroup] ?? "#ccc";

  return (
    <div style={{
      width: "100%", height: "100%",
      display: "flex", flexDirection: "column",
      backgroundColor: TILE_BG,
      fontFamily: KABEL, overflow: "hidden",
    }}>
      {/* Colour band — no text, just solid colour */}
      <div style={{
        height: "25%",
        backgroundColor: bandColor,
        flexShrink: 0,
      }} />

      {/* Name */}
      <div style={{
        flex: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0.2cqi 0.3cqi", textAlign: "center", overflow: "hidden",
      }}>
        <span style={{
          fontSize: "1.1cqi", fontWeight: 700, lineHeight: 1.15,
          color: "#111", wordBreak: "break-word", hyphens: "auto",
        }}>
          {name}
        </span>
      </div>

      {/* Price */}
      <div style={{
        height: "22%", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderTop: `1px solid ${NAVY}33`,
      }}>
        <span style={{ fontSize: "1.0cqi", fontWeight: 800, color: "#111" }}>
          ${price}
        </span>
      </div>
    </div>
  );
}

// ── Chance tile ─────────────────────────────────────────────────────────────
function ChanceContent() {
  return (
    <div style={{
      width: "100%", height: "100%",
      backgroundColor: TILE_BG,
      display: "flex", flexDirection: "column",
      alignItems: "center", overflow: "hidden",
      fontFamily: KABEL,
    }}>
      {/* CHANCE label */}
      <div style={{
        padding: "0.7cqi 0.4cqi 0.1cqi",
        width: "100%", textAlign: "center",
      }}>
        <span style={{
          fontSize: "1.0cqi", fontWeight: 800,
          color: NAVY, letterSpacing: "0.12em", textTransform: "uppercase",
        }}>
          CHANCE
        </span>
      </div>

      {/* Large pink ? */}
      <div style={{
        flex: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontSize: "6.5cqi", fontWeight: 900,
          color: "#d93a96", lineHeight: 0.85,
          fontFamily: KABEL,
        }}>?</span>
      </div>
    </div>
  );
}

// ── Tax / Fee tile ──────────────────────────────────────────────────────────
function TaxContent({ name }: { name: string }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      backgroundColor: TILE_BG,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "0.3cqi", padding: "0.4cqi",
      fontFamily: KABEL,
    }}>
      <span style={{ fontSize: "2.8cqi", lineHeight: 1 }}>💰</span>
      <span style={{
        fontSize: "0.9cqi", fontWeight: 700,
        textAlign: "center", color: "#333",
        lineHeight: 1.2, textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}>
        {name}
      </span>
    </div>
  );
}

// ── Corner tiles — CSS + editable text, no static PNG ─────────────────────

// GO (pos 0 — bottom-right)
function GoContent() {
  return (
    <div style={{
      width: "100%", height: "100%",
      backgroundColor: TILE_BG,
      position: "relative",
      fontFamily: KABEL, overflow: "hidden",
    }}>
      <span style={{
        position: "absolute",
        top: "0.8cqi", left: 0, right: 0,
        fontSize: "1.2cqi", fontWeight: 800,
        color: NAVY, textAlign: "center",
        lineHeight: 1.25, textTransform: "uppercase",
      }}>
        Collect $200 Salary as you pass
      </span>

      <img
        src="/go_arrow.png"
        alt="GO arrow"
        draggable={false}
        style={{
          position: "absolute",
          bottom: "0.5cqi", left: "50%",
          transform: "translateX(-50%)",
          width: "13cqi", height: "5cqi",
          objectFit: "contain",
          userSelect: "none",
        }}
      />
    </div>
  );
}

// JAIL (pos 8 — bottom-left) — Just Visiting / In Jail
function JailContent() {
  return (
    <div style={{
      width: "100%", height: "100%",
      backgroundColor: TILE_BG,
      display: "flex", flexDirection: "column",
      fontFamily: KABEL, overflow: "hidden",
    }}>
      {/* Main area: jail cell */}
      <div style={{
        flex: 1,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "0.5cqi", padding: "0.6cqi",
      }}>
        {/* In Jail image */}
        <img
          src="/in_jail.png"
          alt="In Jail"
          draggable={false}
          style={{
            width: "10cqi", height: "10cqi",
            objectFit: "contain", flexShrink: 0,
            userSelect: "none",
          }}
        />
        <span style={{
          fontSize: "1.4cqi", fontWeight: 900,
          color: RED, textTransform: "uppercase",
          textAlign: "center", lineHeight: 1.1,
        }}>
          IN JAIL
        </span>
      </div>

      {/* Bottom strip — JUST VISITING */}
      <div style={{
        flexShrink: 0,
        backgroundColor: ORANGE,
        padding: "0.55cqi 0.3cqi",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontSize: "1.15cqi", fontWeight: 800,
          color: "#fff", textTransform: "uppercase",
          letterSpacing: "0.07em", textAlign: "center",
        }}>
          JUST VISITING
        </span>
      </div>
    </div>
  );
}

// FREE PARKING (pos 16 — top-left)
function FreeParkingContent() {
  return (
    <div style={{
      width: "100%", height: "100%",
      backgroundColor: TILE_BG,
      position: "relative",
      fontFamily: KABEL, overflow: "hidden",
    }}>
      <span style={{
        position: "absolute",
        top: "0.8cqi", left: 0, right: 0,
        fontSize: "1.5cqi", fontWeight: 900,
        color: RED, textTransform: "uppercase",
        letterSpacing: "0.06em", lineHeight: 1,
        textAlign: "center",
      }}>
        FREE
      </span>

      <img
        src="/free_parking_car.png"
        alt="Free Parking car"
        draggable={false}
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "7cqi", height: "7cqi",
          objectFit: "contain",
          userSelect: "none",
        }}
      />

      <span style={{
        position: "absolute",
        bottom: "0.8cqi", left: 0, right: 0,
        fontSize: "1.5cqi", fontWeight: 900,
        color: NAVY, textTransform: "uppercase",
        letterSpacing: "0.06em", lineHeight: 1,
        textAlign: "center",
      }}>
        PARKING
      </span>
    </div>
  );
}

// GO TO JAIL (pos 24 — top-right)
function GoToJailContent() {
  return (
    <div style={{
      width: "100%", height: "100%",
      backgroundColor: TILE_BG,
      position: "relative",
      fontFamily: KABEL, overflow: "hidden",
    }}>
      <span style={{
        position: "absolute",
        top: "0.8cqi", left: 0, right: 0,
        fontSize: "1.4cqi", fontWeight: 900,
        color: NAVY, textTransform: "uppercase",
        letterSpacing: "0.04em", lineHeight: 1,
        textAlign: "center",
      }}>
        GO TO
      </span>

      <img
        src="/go_to_jail_officer.png"
        alt="Go To Jail officer"
        draggable={false}
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "7cqi", height: "7cqi",
          objectFit: "contain",
          userSelect: "none",
        }}
      />

      <span style={{
        position: "absolute",
        bottom: "0.8cqi", left: 0, right: 0,
        fontSize: "1.4cqi", fontWeight: 900,
        color: RED, textTransform: "uppercase",
        letterSpacing: "0.04em", lineHeight: 1,
        textAlign: "center",
      }}>
        JAIL
      </span>
    </div>
  );
}

function CornerContent({ position }: { position: number }) {
  if (position === 0)  return <GoContent />;
  if (position === 8)  return <JailContent />;
  if (position === 16) return <FreeParkingContent />;
  if (position === 24) return <GoToJailContent />;
  return null;
}

// ── BoardTile ──────────────────────────────────────────────────────────────
const CORNER_POSITIONS = new Set([0, 8, 16, 24]);

function BoardTile({ space }: { space: BoardSpace }) {
  const [row, col] = getGridPos(space.position);
  const { left, top, width, height } = getCellBounds(row, col);
  const rotation  = getTileRotation(space.position);
  const isVert    = rotation === 90 || rotation === -90;
  const isCorner  = CORNER_POSITIONS.has(space.position);

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
      <div style={{
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1cqi", backgroundColor: TILE_BG,
        textAlign: "center", padding: "0.3cqi", fontFamily: KABEL,
      }}>
        {space.name}
      </div>
    );
  }

  return (
    <div style={{
      position: "absolute",
      left: `${left}%`, top: `${top}%`,
      width: `${width}%`, height: `${height}%`,
      border: TILE_BORDER, overflow: "hidden", boxSizing: "border-box",
    }}>
      {isCorner ? (
        content
      ) : (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: innerW, height: innerH,
          transform: `translate(-50%,-50%) rotate(${rotation}deg)`,
        }}>
          {content}
        </div>
      )}
    </div>
  );
}

// ── Team token circle ──────────────────────────────────────────────────────
function CircleToken({ emoji, name, sizePercent, borderColor = NAVY }: {
  emoji: string; name: string; sizePercent: number; borderColor?: string;
}) {
  return (
    <div style={{
      width: `${sizePercent}%`, aspectRatio: "1 / 1",
      borderRadius: "50%", backgroundColor: "#fff",
      border: `2px solid ${borderColor}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", flexShrink: 0,
      boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
    }}>
      {isTokenImage(emoji) ? (
        <img src={emoji} alt={name} draggable={false}
          style={{ width: "72%", height: "72%", objectFit: "contain" }} />
      ) : (
        <span style={{ fontSize: `${sizePercent * 0.45}cqi`, lineHeight: 1 }}>{emoji}</span>
      )}
    </div>
  );
}

// ── Main board ─────────────────────────────────────────────────────────────
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
    <div style={{
      position: "relative",
      width: "100%", aspectRatio: "1 / 1",
      containerType: "inline-size",
      backgroundColor: "#fff",
      border: `4px solid ${NAVY}`,
      boxSizing: "border-box", overflow: "hidden",
      fontFamily: KABEL,
    }}>
      {/* 32 board tiles */}
      {spaces.map((space) => (
        <BoardTile key={space.id} space={space} />
      ))}

      {/* Board centre image */}
      <div style={{
        position: "absolute",
        left: `${CORNER}%`, top: `${CORNER}%`,
        width: `${100 - 2 * CORNER}%`, height: `${100 - 2 * CORNER}%`,
        pointerEvents: "none", overflow: "hidden",
      }}>
        <img
          src="/board_center_new.png"
          alt=""
          draggable={false}
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", display: "block",
            userSelect: "none", pointerEvents: "none",
          }}
        />
      </div>

      {/* Overlays: highlight frames + ownership badges + team tokens */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>

        {propertySpaces.map((space) => {
          const here = teamsByPosition[space.position] ?? [];
          if (!here.length) return null;
          const [row, col] = getGridPos(space.position);
          const { left, top, width, height } = getCellBounds(row, col);
          return (
            <div key={`frame-${space.id}`} style={{
              position: "absolute",
              left: `${left}%`, top: `${top}%`,
              width: `${width}%`, height: `${height}%`,
              outline: `3px solid ${here[0].color}`,
              outlineOffset: "-3px", zIndex: 8,
            }} />
          );
        })}

        {propertySpaces
          .filter((s) => s.ownerId && (s as any).ownerEmoji)
          .map((space) => {
            const [row, col] = getGridPos(space.position);
            const { left, top, width, height } = getCellBounds(row, col);
            return (
              <div key={`owner-${space.id}`} title={`Owned by ${space.ownerName ?? "?"}`}
                style={{
                  position: "absolute",
                  left: `${left + width / 2}%`,
                  top:  `${top + height * 0.22}%`,
                  transform: "translate(-50%,-50%)", zIndex: 12,
                }}>
                <CircleToken
                  emoji={(space as any).ownerEmoji as string}
                  name={space.ownerName ?? ""}
                  sizePercent={4.2}
                  borderColor={(space as any).ownerColor ?? NAVY}
                />
              </div>
            );
          })}

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
              <div key={team.id} title={team.name} style={{
                position: "absolute",
                left: `${cx + dx}%`, top: `${cy + dy}%`,
                transform: "translate(-50%,-50%)", zIndex: 20,
              }}>
                <CircleToken emoji={team.emoji} name={team.name} sizePercent={5.8} />
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}
