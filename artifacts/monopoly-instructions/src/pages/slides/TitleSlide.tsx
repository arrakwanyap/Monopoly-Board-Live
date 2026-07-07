export default function TitleSlide() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{
        backgroundColor: "#F5F0E6",
        backgroundImage: "radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: "4px 4px",
        fontFamily: "'DM Sans', sans-serif",
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
        {/* Inner decorative frame */}
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

      {/* Main content row */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "10vh 8vw",
        }}
      >
        {/* Left column */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: "52vw",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              fontSize: "1.3vw",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "#1B2A4A",
              fontWeight: 600,
              marginBottom: "3vh",
            }}
          >
            Staff Scavenger Hunt
          </div>

          {/* Hero headline */}
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "8vw",
              fontWeight: 900,
              color: "#1B2A4A",
              margin: 0,
              lineHeight: 0.95,
              letterSpacing: "-0.02em",
            }}
          >
            YCIS
          </h1>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "5.2vw",
              fontWeight: 700,
              color: "#E8573A",
              margin: "0.5vh 0 0 0",
              lineHeight: 1,
              letterSpacing: "0.04em",
            }}
          >
            Monopoly 2026
          </h1>

          {/* Rule divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.2vw",
              margin: "3vh 0",
            }}
          >
            <div style={{ height: "1px", width: "5vw", backgroundColor: "#1B2A4A" }} />
            <div style={{ color: "#E8573A", fontSize: "0.9vw" }}>◆</div>
            <div style={{ height: "1px", width: "5vw", backgroundColor: "#1B2A4A" }} />
          </div>

          {/* Tagline */}
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "2.4vw",
              fontWeight: 400,
              color: "#1B2A4A",
              margin: 0,
              lineHeight: 1.3,
              maxWidth: "38vw",
            }}
          >
            Race around campus. Claim properties. Build your fortune.
          </p>

          {/* Year badge */}
          <div
            style={{
              marginTop: "5vh",
              display: "inline-flex",
              alignItems: "center",
              gap: "1.5vw",
            }}
          >
            <div
              style={{
                border: "1px solid #1B2A4A",
                padding: "0.8vh 2vw",
                fontSize: "1.2vw",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#1B2A4A",
                fontWeight: 600,
              }}
            >
              Player Instructions
            </div>
          </div>
        </div>

        {/* Right column — decorative board graphic */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingRight: "2vw",
          }}
        >
          {/* Stylised mini board squares arranged in an L */}
          <div style={{ position: "relative", width: "32vw", height: "32vw" }}>
            {/* Board background square */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                border: "2px solid #1B2A4A",
                backgroundColor: "rgba(27,42,74,0.04)",
              }}
            />
            {/* Corner tile: GLC GO */}
            <div
              style={{
                position: "absolute",
                bottom: 0, right: 0,
                width: "9vw", height: "9vw",
                backgroundColor: "#1B2A4A",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4vw", fontWeight: 900, color: "#F5F0E6", letterSpacing: "0.05em" }}>GLC</div>
              <div style={{ fontSize: "2.2vw", fontWeight: 700, color: "#E8573A", lineHeight: 1 }}>GO</div>
              <div style={{ fontSize: "0.9vw", color: "#F5F0E6", marginTop: "0.4vh", letterSpacing: "0.1em" }}>COLLECT $200</div>
            </div>
            {/* Bottom row tiles */}
            <div style={{ position: "absolute", bottom: 0, right: "9vw", width: "6.5vw", height: "9vw", border: "1px solid #1B2A4A", backgroundColor: "#C1D5A8", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "0.6vh" }}>
              <div style={{ fontSize: "0.75vw", color: "#1B2A4A", fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>Auditorium</div>
            </div>
            <div style={{ position: "absolute", bottom: 0, right: "15.5vw", width: "6.5vw", height: "9vw", border: "1px solid #1B2A4A", backgroundColor: "#C1D5A8", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "0.6vh" }}>
              <div style={{ fontSize: "0.75vw", color: "#1B2A4A", fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>Covered PG</div>
            </div>
            {/* Right column tiles */}
            <div style={{ position: "absolute", bottom: "9vw", right: 0, width: "9vw", height: "6.5vw", border: "1px solid #1B2A4A", backgroundColor: "#F5B8A0", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5vw" }}>
              <div style={{ fontSize: "0.75vw", color: "#1B2A4A", fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>Gymnasium</div>
            </div>
            <div style={{ position: "absolute", bottom: "15.5vw", right: 0, width: "9vw", height: "6.5vw", border: "1px solid #1B2A4A", backgroundColor: "#F5B8A0", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5vw" }}>
              <div style={{ fontSize: "0.75vw", color: "#1B2A4A", fontWeight: 600, textAlign: "center", lineHeight: 1.2 }}>Canteen</div>
            </div>
            {/* Corner tile: Free Parking top-left */}
            <div
              style={{
                position: "absolute",
                top: 0, left: 0,
                width: "9vw", height: "9vw",
                border: "2px solid #1B2A4A",
                backgroundColor: "#F5F0E6",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <div style={{ fontSize: "1vw", fontWeight: 700, color: "#1B2A4A", letterSpacing: "0.05em", textAlign: "center", lineHeight: 1.2 }}>FREE</div>
              <div style={{ fontSize: "1vw", fontWeight: 700, color: "#1B2A4A", letterSpacing: "0.05em", textAlign: "center" }}>PARKING</div>
            </div>
            {/* Centre label */}
            <div
              style={{
                position: "absolute",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                fontFamily: "'Playfair Display', serif",
                fontSize: "2.2vw",
                fontWeight: 900,
                color: "#1B2A4A",
                textAlign: "center",
                letterSpacing: "0.06em",
                opacity: 0.18,
                whiteSpace: "nowrap",
              }}
            >
              MONOPOLY
            </div>
            {/* Chance card in centre */}
            <div
              style={{
                position: "absolute",
                top: "38%", left: "15%",
                width: "12vw",
                border: "1px solid #E8573A",
                backgroundColor: "#FDF7EF",
                padding: "1.5vh 1.5vw",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.8vw", letterSpacing: "0.2em", textTransform: "uppercase", color: "#E8573A", fontWeight: 600, marginBottom: "0.8vh" }}>CHANCE</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1vw", color: "#1B2A4A", lineHeight: 1.3 }}>Collect $150 salary bonus</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: "5vh",
          left: 0, right: 0,
          textAlign: "center",
          fontSize: "1.1vw",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#1B2A4A",
          fontWeight: 600,
          opacity: 0.7,
        }}
      >
        YCIS Hong Kong / 2026
      </div>
    </div>
  );
}
