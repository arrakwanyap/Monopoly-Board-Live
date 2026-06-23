import { useMemo } from "react";
import type { BoardSpace, Team } from "@workspace/api-client-react";
import { COLOR_GROUP_HEX } from "@/lib/constants";

interface Props {
  spaces: BoardSpace[];
  teams: Team[];
}

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

type Side = "bottom" | "left" | "top" | "right";

function getSide(position: number): Side | null {
  if (position >= 1 && position <= 9) return "bottom";
  if (position >= 11 && position <= 19) return "left";
  if (position >= 21 && position <= 29) return "top";
  if (position >= 31 && position <= 39) return "right";
  return null;
}

function getRotation(side: Side | null): string {
  if (side === "left") return "rotate(90deg)";
  if (side === "top") return "rotate(180deg)";
  if (side === "right") return "rotate(270deg)";
  return "none";
}

function CornerCell({ space, teamsHere }: { space: BoardSpace; teamsHere: Team[] }) {
  const isGO = space.position === 0;
  const isJail = space.position === 10;
  const isFreeParking = space.position === 20;
  const isGoToJail = space.position === 30;

  let content: React.ReactNode;

  if (isGO) {
    content = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1px" }}>
        <div style={{ fontSize: "7px", color: "#c0392b", fontWeight: "700", letterSpacing: "0.5px" }}>COLLECT M200</div>
        <div style={{ fontSize: "7px", color: "#c0392b", fontWeight: "700" }}>SALARY AS YOU</div>
        <div style={{ fontSize: "7px", color: "#c0392b", fontWeight: "700" }}>PASS</div>
        <div style={{ fontSize: "18px", fontWeight: "900", color: "#c0392b", lineHeight: 1 }}>GO</div>
        <div style={{ fontSize: "14px" }}>➡️</div>
      </div>
    );
  } else if (isJail) {
    content = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1px" }}>
        <div style={{ display: "flex", width: "100%", height: "100%" }}>
          <div style={{ flex: 1, background: "#f7941d", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ transform: "rotate(-45deg)", fontSize: "6px", fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 1.2 }}>JUST<br/>IN</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1px" }}>
            <div style={{ fontSize: "6px", fontWeight: "800", color: "#1a1a1a", lineHeight: 1 }}>JUST</div>
            <div style={{ fontSize: "6px", fontWeight: "800", color: "#1a1a1a", lineHeight: 1 }}>VISITING</div>
            <div style={{ fontSize: "11px" }}>🚔</div>
          </div>
        </div>
      </div>
    );
  } else if (isFreeParking) {
    content = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1px" }}>
        <div style={{ fontSize: "12px" }}>🅿️</div>
        <div style={{ fontSize: "6px", fontWeight: "800", color: "#c0392b", textAlign: "center", lineHeight: 1.2 }}>FREE<br/>PARKING</div>
      </div>
    );
  } else if (isGoToJail) {
    content = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1px" }}>
        <div style={{ fontSize: "9px" }}>👮</div>
        <div style={{ fontSize: "5.5px", fontWeight: "800", color: "#1a1a1a", textAlign: "center", lineHeight: 1.2 }}>GO TO</div>
        <div style={{ fontSize: "6.5px", fontWeight: "900", color: "#1a1a1a", textAlign: "center", lineHeight: 1.2 }}>JAIL</div>
      </div>
    );
  }

  return (
    <div
      style={{
        gridRow: `${getGridPos(space.position)[0] + 1}`,
        gridColumn: `${getGridPos(space.position)[1] + 1}`,
        backgroundColor: isGO ? "#fef9e7" : isFreeParking ? "#fef9e7" : "#fff9e6",
        border: "1px solid #999",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {content}
      {teamsHere.length > 0 && (
        <div style={{ position: "absolute", bottom: "2px", right: "2px", display: "flex", flexWrap: "wrap", gap: "1px" }}>
          {teamsHere.map((t) => (
            <span key={t.id} title={t.name} style={{ fontSize: "9px", lineHeight: 1, filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.5))" }}>
              {t.emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCell({ space, side, teamsHere }: { space: BoardSpace; side: Side; teamsHere: Team[] }) {
  const colorHex = space.colorGroup ? COLOR_GROUP_HEX[space.colorGroup] : null;
  const ownerHex = space.ownerColor ?? null;

  const bandSize = "28%";

  const bandStyle: React.CSSProperties = colorHex ? {
    position: "absolute",
    backgroundColor: colorHex,
    ...(side === "bottom" ? { top: 0, left: 0, right: 0, height: bandSize } :
        side === "left"   ? { top: 0, right: 0, bottom: 0, width: bandSize } :
        side === "top"    ? { bottom: 0, left: 0, right: 0, height: bandSize } :
                            { top: 0, left: 0, bottom: 0, width: bandSize }),
  } : {};

  const ownerDotStyle: React.CSSProperties = ownerHex ? {
    position: "absolute",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: ownerHex,
    border: "1px solid rgba(0,0,0,0.3)",
    zIndex: 3,
    ...(side === "bottom" ? { top: "30%", left: "3px" } :
        side === "left"   ? { top: "3px", left: "30%" } :
        side === "top"    ? { bottom: "30%", right: "3px" } :
                            { bottom: "3px", right: "30%" }),
  } : {};

  const hotelStyle: React.CSSProperties = space.hasHotel ? {
    position: "absolute",
    width: "8px",
    height: "8px",
    backgroundColor: "#e74c3c",
    borderRadius: "1px",
    zIndex: 3,
    ...(side === "bottom" ? { top: "30%", right: "3px" } :
        side === "left"   ? { bottom: "3px", left: "30%" } :
        side === "top"    ? { bottom: "30%", left: "3px" } :
                            { top: "3px", right: "30%" }),
  } : {};

  const rotation = getRotation(side);

  const labelStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    inset: 0,
    ...(side === "bottom" ? { paddingTop: bandSize } :
        side === "left"   ? { paddingRight: bandSize } :
        side === "top"    ? { paddingBottom: bandSize } :
                            { paddingLeft: bandSize }),
    transform: rotation,
  };

  const bgColor = ownerHex ? `${ownerHex}22` : "#fff9e6";

  return (
    <div
      style={{
        gridRow: `${getGridPos(space.position)[0] + 1}`,
        gridColumn: `${getGridPos(space.position)[1] + 1}`,
        backgroundColor: bgColor,
        border: "1px solid #999",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {colorHex && <div style={bandStyle} />}
      {ownerHex && <div style={ownerDotStyle} />}
      {space.hasHotel && <div style={hotelStyle} />}

      <div style={labelStyle}>
        <div style={{
          fontSize: "5.5px",
          fontWeight: "700",
          color: "#1a1a1a",
          textAlign: "center",
          lineHeight: 1.25,
          wordBreak: "break-word",
          padding: "1px 2px",
          maxWidth: "90%",
        }}>
          {space.name}
        </div>
        {space.rentValue > 0 && (
          <div style={{ fontSize: "5.5px", color: "#333", fontWeight: "600", marginTop: "1px" }}>
            M{space.rentValue}
          </div>
        )}
      </div>

      {teamsHere.length > 0 && (
        <div style={{
          position: "absolute",
          bottom: side === "bottom" ? "30%" : "2px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "1px",
          zIndex: 4,
        }}>
          {teamsHere.map((t) => (
            <span key={t.id} title={t.name} style={{ fontSize: "9px", lineHeight: 1, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.9))" }}>
              {t.emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SpecialCell({ space, side, teamsHere }: { space: BoardSpace; side: Side; teamsHere: Team[] }) {
  const rotation = getRotation(side);

  let icon = "?";
  let iconColor = "#1a1a1a";
  let bgColor = "#fff9e6";

  if (space.type === "chance") {
    icon = "?";
    iconColor = "#e67e22";
    bgColor = "#fef5e7";
  } else if (space.type === "community_chest") {
    icon = "CC";
    iconColor = "#2980b9";
    bgColor = "#eaf4fb";
  } else if (space.type === "tax") {
    icon = "TAX";
    iconColor = "#c0392b";
    bgColor = "#fdf2f2";
  } else if (space.type === "dice_station") {
    icon = "🎲";
    iconColor = "#1a1a1a";
    bgColor = "#f0f0f0";
  }

  return (
    <div
      style={{
        gridRow: `${getGridPos(space.position)[0] + 1}`,
        gridColumn: `${getGridPos(space.position)[1] + 1}`,
        backgroundColor: bgColor,
        border: "1px solid #999",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ transform: rotation, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1px" }}>
        <div style={{ fontSize: "8px", fontWeight: "800", color: iconColor, lineHeight: 1 }}>{icon}</div>
        <div style={{ fontSize: "4.5px", fontWeight: "600", color: "#333", textAlign: "center", lineHeight: 1.2, maxWidth: "36px" }}>
          {space.name}
        </div>
      </div>
      {teamsHere.length > 0 && (
        <div style={{ position: "absolute", bottom: "2px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "1px", zIndex: 4 }}>
          {teamsHere.map((t) => (
            <span key={t.id} title={t.name} style={{ fontSize: "9px", lineHeight: 1, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.9))" }}>
              {t.emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function BoardSpaceCell({ space, teamsHere }: { space: BoardSpace; teamsHere: Team[] }) {
  const side = getSide(space.position);

  if (CORNERS.has(space.position)) {
    return <CornerCell space={space} teamsHere={teamsHere} />;
  }

  if (space.type === "property") {
    return <PropertyCell space={space} side={side!} teamsHere={teamsHere} />;
  }

  return <SpecialCell space={space} side={side!} teamsHere={teamsHere} />;
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
        border: "3px solid #1a1a6e",
        borderRadius: "2px",
        overflow: "hidden",
        backgroundColor: "#fff9e6",
      }}
    >
      {spaces.map((space) => (
        <BoardSpaceCell
          key={space.id}
          space={space}
          teamsHere={teamsByPosition[space.position] ?? []}
        />
      ))}

      {/* Center */}
      <div
        style={{
          gridRow: "2 / 11",
          gridColumn: "2 / 11",
          background: "linear-gradient(145deg, #1a237e 0%, #0d1257 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Diagonal red band */}
        <div style={{
          position: "absolute",
          background: "#c0392b",
          width: "170%",
          height: "28%",
          transform: "rotate(-35deg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}>
          <span style={{
            fontSize: "clamp(10px, 2.2vw, 22px)",
            fontWeight: "900",
            color: "#fff",
            letterSpacing: "0.12em",
            textShadow: "0 1px 3px rgba(0,0,0,0.5)",
          }}>
            MONOPOLY
          </span>
        </div>

        {/* "FOR YEW" below */}
        <div style={{
          position: "absolute",
          bottom: "16%",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
          <div style={{
            fontSize: "clamp(7px, 1.4vw, 14px)",
            fontWeight: "900",
            color: "#f7941d",
            letterSpacing: "0.2em",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          }}>
            FOR YEW
          </div>
          <div style={{ display: "flex", gap: "3px", marginTop: "4px" }}>
            {Object.entries(COLOR_GROUP_HEX).map(([key, hex]) => (
              <div key={key} style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: hex,
                border: "1px solid rgba(255,255,255,0.4)",
              }} />
            ))}
          </div>
        </div>

        {/* YCIS text top left */}
        <div style={{
          position: "absolute",
          top: "12%",
          left: "12%",
          zIndex: 2,
          fontSize: "clamp(8px, 1.5vw, 16px)",
          fontWeight: "900",
          color: "#fff",
          letterSpacing: "0.15em",
          textShadow: "0 1px 4px rgba(0,0,0,0.8)",
        }}>
          YCIS
        </div>

        {/* 2026 text bottom right */}
        <div style={{
          position: "absolute",
          bottom: "8%",
          right: "10%",
          zIndex: 2,
          fontSize: "clamp(6px, 1vw, 11px)",
          fontWeight: "700",
          color: "rgba(255,255,255,0.6)",
          letterSpacing: "0.1em",
        }}>
          2026
        </div>
      </div>
    </div>
  );
}
