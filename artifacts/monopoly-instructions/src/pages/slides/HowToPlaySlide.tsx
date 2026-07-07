export default function HowToPlaySlide() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        backgroundColor: "#F5F0E6",
        backgroundImage: "radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: "4px 4px",
        fontFamily: "'DM Sans', sans-serif",
        color: "#1B2A4A",
      }}
    >
      {/* Outer decorative frame */}
      <div
        style={{
          position: "absolute",
          top: "2.5vh", bottom: "2.5vh",
          left: "2.5vw", right: "2.5vw",
          border: "1.5px solid #1B2A4A",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "0.8vh", bottom: "0.8vh",
            left: "0.5vw", right: "0.5vw",
            border: "1px solid #1B2A4A",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          padding: "5vh 7vw 6.5vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "2vw",
            marginBottom: "2.5vh",
          }}
        >
          <div style={{ height: "1px", flex: 1, backgroundColor: "#1B2A4A", opacity: 0.3 }} />
          <div style={{ color: "#E8573A", fontSize: "0.9vw" }}>◆</div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "3.8vw",
              fontWeight: 700,
              margin: 0,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: "#1B2A4A",
            }}
          >
            How to Play
          </h2>
          <div style={{ color: "#E8573A", fontSize: "0.9vw" }}>◆</div>
          <div style={{ height: "1px", flex: 1, backgroundColor: "#1B2A4A", opacity: 0.3 }} />
        </div>

        {/* Subtitle */}
        <div
          style={{
            textAlign: "center",
            fontSize: "1.5vw",
            color: "#E8573A",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: "2.5vh",
          }}
        >
          Race around YCIS campus. Highest total value wins.
        </div>

        {/* Three columns */}
        <div
          style={{
            display: "flex",
            gap: "2vw",
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Column 1 — Move */}
          <div
            style={{
              flex: 1,
              border: "1px solid #1B2A4A",
              padding: "0.8vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                border: "1px solid #1B2A4A",
                flex: 1,
                padding: "2.2vh 1.8vw",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.5vw",
                  fontWeight: 700,
                  color: "#1B2A4A",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "0.5vh",
                }}
              >
                Move
              </div>
              <div style={{ width: "3vw", height: "2px", backgroundColor: "#E8573A", marginBottom: "2vh" }} />

              <div style={{ fontSize: "2vw", fontWeight: 700, color: "#1B2A4A", marginBottom: "0.8vh" }}>
                1.
              </div>
              <p style={{ fontSize: "1.45vw", lineHeight: 1.5, margin: 0, marginBottom: "2vh", color: "#1B2A4A" }}>
                Roll the dice at a station and move that many spaces around the board.
              </p>

              <div style={{ fontSize: "2vw", fontWeight: 700, color: "#1B2A4A", marginBottom: "0.8vh" }}>
                2.
              </div>
              <p style={{ fontSize: "1.45vw", lineHeight: 1.5, margin: 0, color: "#1B2A4A" }}>
                Go to the real campus room on the tile and complete the challenge envelope.
              </p>
            </div>
          </div>

          {/* Column 2 — Claim */}
          <div
            style={{
              flex: 1,
              border: "1px solid #1B2A4A",
              padding: "0.8vw",
              display: "flex",
              flexDirection: "column",
              transform: "translateY(-1.2vh)",
            }}
          >
            <div
              style={{
                border: "1px solid #1B2A4A",
                flex: 1,
                padding: "2.2vh 1.8vw",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(27,42,74,0.03)",
              }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.5vw",
                  fontWeight: 700,
                  color: "#1B2A4A",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "0.5vh",
                }}
              >
                Claim
              </div>
              <div style={{ width: "3vw", height: "2px", backgroundColor: "#E8573A", marginBottom: "2vh" }} />

              <div style={{ fontSize: "2vw", fontWeight: 700, color: "#1B2A4A", marginBottom: "0.8vh" }}>
                3.
              </div>
              <p style={{ fontSize: "1.45vw", lineHeight: 1.5, margin: 0, marginBottom: "2vh", color: "#1B2A4A" }}>
                First team to complete a challenge claims that property. Report via WhatsApp.
              </p>

              <div style={{ fontSize: "2vw", fontWeight: 700, color: "#1B2A4A", marginBottom: "0.8vh" }}>
                4.
              </div>
              <p style={{ fontSize: "1.45vw", lineHeight: 1.5, margin: 0, color: "#1B2A4A" }}>
                If occupied, spin the wheel — 50/50 to pay rent or take over the property.
              </p>
            </div>
          </div>

          {/* Column 3 — Special tiles & Win */}
          <div
            style={{
              flex: 1,
              border: "1px solid #1B2A4A",
              padding: "0.8vw",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                border: "1px solid #1B2A4A",
                flex: 1,
                padding: "2.2vh 1.8vw",
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(232,87,58,0.04)",
              }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.5vw",
                  fontWeight: 700,
                  color: "#1B2A4A",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "0.5vh",
                }}
              >
                Special Tiles
              </div>
              <div style={{ width: "3vw", height: "2px", backgroundColor: "#E8573A", marginBottom: "1.8vh" }} />

              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7vw", marginBottom: "1.5vh" }}>
                <div style={{ color: "#E8573A", fontSize: "1vw", marginTop: "0.3vh", flexShrink: 0 }}>◆</div>
                <p style={{ fontSize: "1.4vw", lineHeight: 1.45, margin: 0, color: "#1B2A4A" }}>
                  <span style={{ fontWeight: 600 }}>GLC (GO)</span> — collect $200 each time you pass or land.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7vw", marginBottom: "1.5vh" }}>
                <div style={{ color: "#E8573A", fontSize: "1vw", marginTop: "0.3vh", flexShrink: 0 }}>◆</div>
                <p style={{ fontSize: "1.4vw", lineHeight: 1.45, margin: 0, color: "#1B2A4A" }}>
                  <span style={{ fontWeight: 600 }}>Fee tiles</span> — auto-pay $200 (School Fees, Co-Curricular, ELW Trip, School Supplies).
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7vw", marginBottom: "1.5vh" }}>
                <div style={{ color: "#E8573A", fontSize: "1vw", marginTop: "0.3vh", flexShrink: 0 }}>◆</div>
                <p style={{ fontSize: "1.4vw", lineHeight: 1.45, margin: 0, color: "#1B2A4A" }}>
                  <span style={{ fontWeight: 600 }}>Chance / Chest</span> — draw a card and follow its school-themed result.
                </p>
              </div>
              <div style={{ height: "1px", backgroundColor: "rgba(27,42,74,0.2)", margin: "0.8vh 0 1.5vh" }} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.7vw" }}>
                <div style={{ color: "#1B2A4A", fontSize: "1vw", marginTop: "0.3vh", flexShrink: 0 }}>★</div>
                <p style={{ fontSize: "1.4vw", lineHeight: 1.45, margin: 0, color: "#1B2A4A" }}>
                  <span style={{ fontWeight: 600 }}>Win</span> — highest net worth (cash + properties + hotels) at game end takes the prize.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: "4vh",
          left: "7vw", right: "7vw",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "1.1vw",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: "#1B2A4A",
          fontWeight: 600,
          opacity: 0.6,
        }}
      >
        <span>YCIS Hong Kong / 2026</span>
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.6vw",
            fontWeight: 700,
            opacity: 1,
          }}
        >
          02
        </span>
      </div>
    </div>
  );
}
