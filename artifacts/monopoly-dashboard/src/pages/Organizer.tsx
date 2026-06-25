import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import TeamToken from "@/components/TeamToken";
import {
  useListTeams,
  useGetBoard,
  useUpdateTeam,
  useSetBoardSpaceOwnership,
  useCreateEvent,
  useResetGame,
  getListTeamsQueryKey,
  getGetBoardQueryKey,
  getGetGameStateQueryKey,
  getGetLeaderboardQueryKey,
  getListEventsQueryKey,
} from "@workspace/api-client-react";

// ── Constants ───────────────────────────────────────────────────────────────

const PIN = "1234";
const PIN_KEY = "organizer_unlocked";

const CORNERS = [
  { pos: 0,  label: "GO",           color: "#2ecc71" },
  { pos: 8,  label: "Just Visiting",color: "#f7941d" },
  { pos: 16, label: "Free Parking", color: "#3b82f6" },
  { pos: 24, label: "Go To Jail",   color: "#ed1c24" },
];

const CHANCE_CARDS = [
  { text: "Advance to GO — collect $200",          amount: 200,  moveTo: 0 },
  { text: "Bank error in your favour — collect $200", amount: 200 },
  { text: "Pay hospital fees — lose $100",          amount: -100 },
  { text: "Pay school fees — lose $150",            amount: -150 },
  { text: "Speeding fine — lose $15",               amount: -15  },
  { text: "Won crossword competition — collect $100", amount: 100 },
  { text: "Go to Jail",                             amount: 0,   moveTo: 8 },
  { text: "Building loan matures — collect $150",   amount: 150  },
  { text: "Poor tax — lose $15",                    amount: -15  },
  { text: "Street repairs assessment — lose $40",   amount: -40  },
];

// ── Shared UI helpers ────────────────────────────────────────────────────────

const card  = "rounded-xl p-4 border border-border bg-card";
const lbl   = "text-xs text-muted-foreground font-medium mb-1 block uppercase tracking-wider";
const inp   = "w-full rounded-lg px-3 py-2 text-sm bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500";
const sel   = inp;

function Btn({ children, onClick, disabled, variant = "blue", className = "" }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "blue" | "red" | "green" | "gray" | "orange";
  className?: string;
}) {
  const colors: Record<string, string> = {
    blue:   "bg-blue-600 text-white hover:bg-blue-700",
    red:    "bg-red-600 text-white hover:bg-red-700",
    green:  "bg-green-600 text-white hover:bg-green-700",
    gray:   "bg-secondary text-foreground border border-border hover:bg-secondary/80",
    orange: "bg-orange-500 text-white hover:bg-orange-600",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${colors[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 border-b border-border pb-2">
      {title}
    </h3>
  );
}

// ── PIN Gate ─────────────────────────────────────────────────────────────────

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === PIN) {
      sessionStorage.setItem(PIN_KEY, "1");
      onUnlock();
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className={`${card} w-80 flex flex-col items-center gap-6`}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-black text-white mx-auto mb-3">
            🎲
          </div>
          <div className="font-black text-lg text-foreground">Organizer Panel</div>
          <div className="text-xs text-muted-foreground mt-1">YCIS Monopoly 2026</div>
        </div>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div>
            <label className={lbl}>Access Code</label>
            <input
              type="password"
              className={`${inp} text-center text-lg tracking-[0.4em] ${error ? "border-red-500 ring-1 ring-red-500" : ""}`}
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••"
              maxLength={8}
              autoFocus
            />
            {error && <p className="text-xs text-red-500 mt-1 text-center">Incorrect code. Try again.</p>}
          </div>
          <Btn variant="blue" className="w-full py-2.5 text-sm">
            Unlock
          </Btn>
        </form>
      </div>
    </div>
  );
}

// ── Collision Wheel ──────────────────────────────────────────────────────────

const WHEEL_SEGMENTS = [
  { label: "Pay Rent",  color: "#ed1c24", textColor: "#fff" },
  { label: "Take Over", color: "#2ecc71", textColor: "#fff" },
  { label: "Pay Rent",  color: "#c0392b", textColor: "#fff" },
];

function CollisionWheel() {
  const [spinning, setSpinning] = useState(false);
  const [totalDeg, setTotalDeg] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const n = WHEEL_SEGMENTS.length;
    const segDeg = 360 / n;
    const outcomeIdx = Math.floor(Math.random() * n);
    const landDeg = outcomeIdx * segDeg + segDeg / 2;
    const extra = 360 * 8;
    const next = totalDeg + extra + (360 - (totalDeg % 360)) + (360 - landDeg);
    setTotalDeg(next);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSpinning(false);
      setResult(WHEEL_SEGMENTS[outcomeIdx].label);
    }, 4000);
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const n = WHEEL_SEGMENTS.length;
  const r = 90;
  const cx = 100;
  const cy = 100;

  const slices = WHEEL_SEGMENTS.map((seg, i) => {
    const startDeg = (i * 360) / n - 90;
    const endDeg   = ((i + 1) * 360) / n - 90;
    const startRad = (startDeg * Math.PI) / 180;
    const endRad   = (endDeg   * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const midRad = ((startDeg + endDeg) / 2 * Math.PI) / 180;
    const tx = cx + (r * 0.62) * Math.cos(midRad);
    const ty = cy + (r * 0.62) * Math.sin(midRad);
    const large = 360 / n > 180 ? 1 : 0;
    return { seg, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, tx, ty, midDeg: (startDeg + endDeg) / 2 };
  });

  const resultColor = result ? (WHEEL_SEGMENTS.find(s => s.label === result)?.color ?? "#fff") : undefined;

  return (
    <div className="flex flex-col items-center gap-4">
      <div style={{ position: "relative", width: 220, height: 220 }}>
        {/* Pointer */}
        <div style={{
          position: "absolute", top: -2, left: "50%",
          transform: "translateX(-50%)",
          width: 0, height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderTop: "22px solid #f7941d",
          zIndex: 10, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
        }} />
        {/* Wheel SVG */}
        <svg
          viewBox="0 0 200 200"
          style={{
            width: 220, height: 220,
            transition: spinning ? "transform 4s cubic-bezier(0.17,0.67,0.12,0.99)" : "none",
            transform: `rotate(${totalDeg}deg)`,
            borderRadius: "50%",
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          {slices.map(({ seg, path, tx, ty, midDeg }, i) => (
            <g key={i}>
              <path d={path} fill={seg.color} stroke="#111" strokeWidth="1.5" />
              <text
                x={tx} y={ty}
                textAnchor="middle" dominantBaseline="middle"
                fill={seg.textColor}
                fontSize="9"
                fontWeight="bold"
                transform={`rotate(${midDeg + 90}, ${tx}, ${ty})`}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {seg.label.toUpperCase()}
              </text>
            </g>
          ))}
          <circle cx={cx} cy={cy} r={10} fill="#111" stroke="#333" strokeWidth="2" />
        </svg>
      </div>

      <Btn variant="orange" className="px-8 py-2.5 text-sm" onClick={spin} disabled={spinning}>
        {spinning ? "Spinning…" : "SPIN"}
      </Btn>

      {result && (
        <div
          className="text-center font-black text-xl px-6 py-3 rounded-xl border-2"
          style={{ color: resultColor, borderColor: resultColor, backgroundColor: `${resultColor}22` }}
        >
          {result === "Pay Rent" ? "💸 Pay Rent!" : "🏠 Take Over!"}
        </div>
      )}
    </div>
  );
}

// ── Gameplay Tab ─────────────────────────────────────────────────────────────

function GameplayTab() {
  const qc = useQueryClient();
  const { data: teams } = useListTeams({ query: { refetchInterval: 5000 } });
  const { data: board } = useGetBoard({ query: { refetchInterval: 5000 } });
  const updateTeam  = useUpdateTeam();
  const createEvent = useCreateEvent();

  const [moveTeamId, setMoveTeamId] = useState("");
  const [movePos, setMovePos]       = useState("0");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListTeamsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetBoardQueryKey() });
    qc.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
    qc.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
    qc.invalidateQueries({ queryKey: getListEventsQueryKey() });
  };

  const handleMove = () => {
    if (!moveTeamId) return;
    const team = teams?.find(t => t.id === parseInt(moveTeamId));
    const pos  = parseInt(movePos);
    const space = board?.find(s => s.position === pos);
    updateTeam.mutate(
      { id: parseInt(moveTeamId), data: { position: pos } },
      {
        onSuccess: () => {
          const msg = space
            ? `${team?.name} moved to ${space.name} (pos ${pos})`
            : `${team?.name} moved to position ${pos}`;
          createEvent.mutate({ data: { message: msg, type: "system", teamId: parseInt(moveTeamId) } });
          invalidate();
        },
      }
    );
  };

  const movedTeam  = teams?.find(t => t.id === parseInt(moveTeamId));
  const targetSpace = board?.find(s => s.position === parseInt(movePos));
  const isOwned    = !!(targetSpace?.ownerId && targetSpace.ownerId !== parseInt(moveTeamId));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Move Team */}
      <div className={card}>
        <SectionHeader title="Move Team" />
        <div className="flex flex-col gap-3">
          <div>
            <label className={lbl}>Team</label>
            <select className={sel} value={moveTeamId} onChange={e => setMoveTeamId(e.target.value)}>
              <option value="">Select team…</option>
              {teams?.map(t => (
                <option key={t.id} value={t.id}>{t.name} — currently at pos {t.position}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl}>Destination Space</label>
            <select className={sel} value={movePos} onChange={e => setMovePos(e.target.value)}>
              {board?.map(s => (
                <option key={s.position} value={s.position}>
                  {s.position}: {s.name}{s.ownerId ? ` (owned by ${s.ownerName})` : ""}
                </option>
              ))}
            </select>
          </div>

          {targetSpace && (
            <div className="rounded-lg p-3 bg-background border border-border text-xs flex flex-col gap-1">
              <div className="font-bold text-foreground text-sm">{targetSpace.name}</div>
              <div className="text-muted-foreground capitalize">{targetSpace.type}</div>
              {targetSpace.ownerId && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (targetSpace as any).ownerColor ?? "#fff" }} />
                  <span className="text-muted-foreground">Owned by <strong className="text-foreground">{targetSpace.ownerName}</strong></span>
                </div>
              )}
              {targetSpace.rentValue > 0 && (
                <div className="text-muted-foreground">Rent: <strong className="text-foreground">${targetSpace.rentValue}</strong></div>
              )}
              {isOwned && (
                <div className="mt-1 text-orange-400 font-bold">⚠ Occupied — use the Collision Wheel</div>
              )}
              {targetSpace.ownerId === parseInt(moveTeamId) && moveTeamId && (
                <div className="mt-1 text-blue-400 font-bold">🏨 Team's own property — hotel added!</div>
              )}
            </div>
          )}

          <Btn variant="blue" onClick={handleMove} disabled={!moveTeamId || updateTeam.isPending} className="w-full py-2">
            {updateTeam.isPending ? "Moving…" : "Move Team"}
          </Btn>
        </div>
      </div>

      {/* Collision Wheel */}
      <div className={card}>
        <SectionHeader title="Collision Wheel" />
        <p className="text-xs text-muted-foreground mb-4">
          Spin when a team lands on a property owned by another team.
          <br />2 in 3 chance to pay rent · 1 in 3 chance to take over.
        </p>
        <CollisionWheel />
      </div>
    </div>
  );
}

// ── Teams Tab ─────────────────────────────────────────────────────────────────

function TeamsTab() {
  const qc = useQueryClient();
  const { data: teams, isLoading } = useListTeams({ query: { refetchInterval: 5000 } });
  const updateTeam  = useUpdateTeam();
  const createEvent = useCreateEvent();

  const [cashAmounts, setCashAmounts] = useState<Record<number, string>>({});

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListTeamsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
    qc.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
    qc.invalidateQueries({ queryKey: getListEventsQueryKey() });
  };

  const adjustCash = (team: NonNullable<typeof teams>[number], delta: number) => {
    const amount = Math.abs(delta);
    const newCash = Math.max(0, team.cash + delta);
    updateTeam.mutate(
      { id: team.id, data: { cash: newCash } },
      {
        onSuccess: () => {
          createEvent.mutate({
            data: {
              message: delta > 0
                ? `${team.name} received $${amount}`
                : `${team.name} paid $${amount}`,
              type: "cash_change",
              teamId: team.id,
              amount: delta,
            },
          });
          invalidate();
        },
      }
    );
  };

  const sendToCorner = (team: NonNullable<typeof teams>[number], pos: number, label: string) => {
    updateTeam.mutate(
      { id: team.id, data: { position: pos } },
      {
        onSuccess: () => {
          createEvent.mutate({
            data: {
              message: `${team.name} sent to ${label}`,
              type: "system",
              teamId: team.id,
            },
          });
          invalidate();
        },
      }
    );
  };

  if (isLoading) return <div className="text-muted-foreground text-sm p-4">Loading teams…</div>;

  return (
    <div className="flex flex-col gap-3">
      {teams?.map(team => {
        const amt = cashAmounts[team.id] ?? "";
        return (
          <div key={team.id} className={`${card} flex flex-col gap-3`}>
            <div className="flex items-center gap-3">
              <TeamToken emoji={team.emoji} name={team.name} size={36} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-foreground text-sm">{team.name}</div>
                <div className="text-xs text-muted-foreground">
                  Pos {team.position} &nbsp;·&nbsp;
                  <span className="text-green-400 font-semibold">${team.cash}</span>
                  &nbsp;·&nbsp;{team.propertyCount} properties
                </div>
              </div>
              <div
                className="w-4 h-4 rounded-full shrink-0 border border-white/20"
                style={{ backgroundColor: team.color }}
              />
            </div>

            {/* Cash adjustment */}
            <div className="flex gap-2 items-center">
              <input
                type="number"
                className={`${inp} flex-1`}
                placeholder="Amount ($)"
                min="0"
                value={amt}
                onChange={e => setCashAmounts(prev => ({ ...prev, [team.id]: e.target.value }))}
              />
              <Btn
                variant="green"
                onClick={() => { if (amt) adjustCash(team, +parseInt(amt)); }}
                disabled={!amt || updateTeam.isPending}
              >
                + Add
              </Btn>
              <Btn
                variant="red"
                onClick={() => { if (amt) adjustCash(team, -parseInt(amt)); }}
                disabled={!amt || updateTeam.isPending}
              >
                − Deduct
              </Btn>
            </div>

            {/* Send to corner */}
            <div>
              <div className={`${lbl} mb-1.5`}>Send to corner</div>
              <div className="flex flex-wrap gap-2">
                {CORNERS.map(c => (
                  <button
                    key={c.pos}
                    onClick={() => sendToCorner(team, c.pos, c.label)}
                    disabled={updateTeam.isPending || team.position === c.pos}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40 transition-opacity hover:opacity-80"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Board Tab ─────────────────────────────────────────────────────────────────

function BoardTab() {
  const qc = useQueryClient();
  const { data: board, isLoading: boardLoading } = useGetBoard({ query: { refetchInterval: 5000 } });
  const { data: teams }  = useListTeams({ query: { refetchInterval: 5000 } });
  const setOwnership    = useSetBoardSpaceOwnership();
  const createEvent     = useCreateEvent();

  const [filter, setFilter]    = useState<string>("all");
  const [search, setSearch]    = useState("");
  const [editing, setEditing]  = useState<number | null>(null);
  const [editOwner, setEditOwner]  = useState("");
  const [editHotel, setEditHotel]  = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getGetBoardQueryKey() });
    qc.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
    qc.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
    qc.invalidateQueries({ queryKey: getListEventsQueryKey() });
  };

  const properties = board?.filter(s => s.type === "property") ?? [];
  const colorGroups = [...new Set(properties.map(p => p.colorGroup).filter(Boolean))] as string[];

  const filtered = properties.filter(s => {
    if (filter !== "all" && s.colorGroup !== filter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const startEdit = (spaceId: number) => {
    const sp = board?.find(s => s.id === spaceId);
    if (!sp) return;
    setEditing(spaceId);
    setEditOwner(sp.ownerId?.toString() ?? "");
    setEditHotel(sp.hasHotel ?? false);
  };

  const saveEdit = () => {
    if (editing === null) return;
    const space = board?.find(s => s.id === editing);
    const team  = teams?.find(t => t.id === parseInt(editOwner));
    const wasHotel = space?.hasHotel ?? false;
    setOwnership.mutate(
      {
        id: editing,
        data: { ownerId: editOwner ? parseInt(editOwner) : null, hasHotel: editHotel },
      },
      {
        onSuccess: () => {
          if (space) {
            let msg = "";
            let type: string = "system";
            if (team && !space.ownerId) {
              msg = `${team.name} claimed ${space.name}`;
              type = "property_taken";
            } else if (team && space.ownerId && space.ownerId !== parseInt(editOwner)) {
              msg = `${team.name} took over ${space.name}`;
              type = "takeover";
            } else if (editHotel && !wasHotel && team) {
              msg = `${team.name} built a hotel on ${space.name}`;
              type = "hotel_built";
            } else if (!editOwner && space.ownerId) {
              msg = `${space.name} is now unowned`;
              type = "system";
            }
            if (msg) {
              createEvent.mutate({
                data: { message: msg, type: type as any, teamId: team?.id ?? null },
              });
            }
          }
          setEditing(null);
          invalidate();
        },
      }
    );
  };

  const colorHex: Record<string, string> = {
    brown: "#8B4513", "light-blue": "#87CEEB", pink: "#FF69B4",
    orange: "#f7941d", red: "#ed1c24", yellow: "#FFD700",
    green: "#2ecc71", "dark-blue": "#001D61",
  };

  if (boardLoading) return <div className="text-muted-foreground text-sm p-4">Loading board…</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className={`${inp} flex-1`}
          placeholder="Search property…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className={`${sel} sm:w-44`} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All colours</option>
          {colorGroups.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* Property list */}
      <div className="flex flex-col gap-2">
        {filtered.map(space => {
          const isEditing = editing === space.id;
          const ownerColor = (space as any).ownerColor as string | undefined;
          const cg = space.colorGroup ?? "";
          const stripColor = colorHex[cg] ?? "#555";

          return (
            <div key={space.id} className={`${card} flex gap-3 items-start`}>
              {/* Colour strip */}
              <div className="w-1.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: stripColor }} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="text-sm font-bold text-foreground">{space.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Pos {space.position} &nbsp;·&nbsp; Value ${space.propertyValue}
                      &nbsp;·&nbsp; Rent ${space.rentValue}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2 shrink-0">
                      {space.ownerId ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ownerColor ?? "#888" }} />
                          <span className="text-foreground font-medium">{space.ownerName}</span>
                          {space.hasHotel && <span className="text-yellow-400">🏨</span>}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unowned</span>
                      )}
                      <Btn variant="gray" onClick={() => startEdit(space.id)}>Edit</Btn>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="mt-3 flex flex-col gap-2 p-3 rounded-lg bg-background border border-border">
                    <div>
                      <label className={lbl}>Owner</label>
                      <select className={sel} value={editOwner} onChange={e => setEditOwner(e.target.value)}>
                        <option value="">None (unowned)</option>
                        {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editHotel}
                        onChange={e => setEditHotel(e.target.checked)}
                        className="rounded"
                      />
                      Has Hotel (+$100 property value, rent increases)
                    </label>
                    <div className="flex gap-2">
                      <Btn variant="blue" onClick={saveEdit} disabled={setOwnership.isPending} className="flex-1">
                        {setOwnership.isPending ? "Saving…" : "Save"}
                      </Btn>
                      <Btn variant="gray" onClick={() => setEditing(null)}>Cancel</Btn>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-muted-foreground text-sm text-center py-8">No properties match your filter.</div>
        )}
      </div>
    </div>
  );
}

// ── Events Tab ────────────────────────────────────────────────────────────────

function EventsTab() {
  const qc = useQueryClient();
  const { data: teams }  = useListTeams({ query: { refetchInterval: 5000 } });
  const { data: board }  = useGetBoard({ query: { refetchInterval: 5000 } });
  const updateTeam       = useUpdateTeam();
  const createEvent      = useCreateEvent();
  const setOwnershipMut  = useSetBoardSpaceOwnership();
  const resetGame        = useResetGame();

  const [teamId, setTeamId]       = useState("");
  const [spaceId, setSpaceId]     = useState("");
  const [customMsg, setCustomMsg] = useState("");
  const [customAmt, setCustomAmt] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [drawnCard, setDrawnCard] = useState<typeof CHANCE_CARDS[number] | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListTeamsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetBoardQueryKey() });
    qc.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
    qc.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
    qc.invalidateQueries({ queryKey: getListEventsQueryKey() });
  };

  const team  = teams?.find(t => t.id === parseInt(teamId));
  const space = board?.find(s => s.id === parseInt(spaceId));
  const propertySpaces = board?.filter(s => s.type === "property") ?? [];

  const logEvent = (msg: string, type: string, amount?: number) => {
    createEvent.mutate(
      { data: { message: msg, type: type as any, teamId: team?.id ?? null, amount: amount ?? null } },
      { onSuccess: invalidate }
    );
  };

  const handleClaimProperty = () => {
    if (!team || !space) return;
    setOwnershipMut.mutate(
      { id: space.id, data: { ownerId: team.id, hasHotel: false } },
      {
        onSuccess: () => {
          logEvent(`${team.name} claimed ${space.name}`, "property_taken");
          invalidate();
        },
      }
    );
  };

  const handleBuildHotel = () => {
    if (!team || !space) return;
    setOwnershipMut.mutate(
      { id: space.id, data: { ownerId: team.id, hasHotel: true } },
      {
        onSuccess: () => {
          logEvent(`${team.name} built a hotel on ${space.name} — rent increases!`, "hotel_built");
          invalidate();
        },
      }
    );
  };

  const handlePassedGo = () => {
    if (!team) return;
    updateTeam.mutate(
      { id: team.id, data: { cash: team.cash + 200 } },
      {
        onSuccess: () => {
          logEvent(`${team.name} passed GO — collected $200!`, "cash_change", 200);
          invalidate();
        },
      }
    );
  };

  const handlePaidRent = () => {
    if (!team || !space) return;
    const rent = space.rentValue * (space.hasHotel ? 2 : 1);
    updateTeam.mutate(
      { id: team.id, data: { cash: Math.max(0, team.cash - rent) } },
      {
        onSuccess: () => {
          logEvent(`${team.name} paid $${rent} rent on ${space.name}`, "rent_paid", -rent);
          invalidate();
        },
      }
    );
  };

  const handleDrawChance = () => {
    const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
    setDrawnCard(card);
  };

  const handleApplyChance = () => {
    if (!drawnCard || !team) return;
    const updates: Array<() => void> = [];
    if (drawnCard.amount !== 0) {
      updates.push(() => {
        updateTeam.mutate(
          { id: team.id, data: { cash: Math.max(0, team.cash + drawnCard.amount) } },
          { onSuccess: invalidate }
        );
      });
    }
    if (drawnCard.moveTo !== undefined) {
      updates.push(() => {
        updateTeam.mutate(
          { id: team.id, data: { position: drawnCard.moveTo! } },
          { onSuccess: invalidate }
        );
      });
    }
    updates.forEach(fn => fn());
    logEvent(`${team.name} drew a Chance card: "${drawnCard.text}"`, "chance", drawnCard.amount || undefined);
    setDrawnCard(null);
  };

  const handleCustomEvent = () => {
    if (!customMsg.trim()) return;
    logEvent(customMsg, "system", customAmt ? parseInt(customAmt) : undefined);
    setCustomMsg("");
    setCustomAmt("");
  };

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    resetGame.mutate(undefined as any, { onSuccess: () => { setConfirmReset(false); invalidate(); } });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Team + Property context */}
      <div className={card}>
        <SectionHeader title="Context (select team & property)" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={lbl}>Team</label>
            <select className={sel} value={teamId} onChange={e => setTeamId(e.target.value)}>
              <option value="">Select team…</option>
              {teams?.map(t => <option key={t.id} value={t.id}>{t.name} (${t.cash})</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Property (optional)</label>
            <select className={sel} value={spaceId} onChange={e => setSpaceId(e.target.value)}>
              <option value="">Select property…</option>
              {propertySpaces.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.ownerId ? `(${s.ownerName})` : "(unowned)"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick-action buttons */}
      <div className={card}>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Btn
            variant="green"
            disabled={!team || !space}
            onClick={handleClaimProperty}
            className="flex-1 py-2"
          >
            🏠 Claim Property
          </Btn>
          <Btn
            variant="orange"
            disabled={!team || !space}
            onClick={handleBuildHotel}
            className="flex-1 py-2"
          >
            🏨 Build Hotel
          </Btn>
          <Btn
            variant="blue"
            disabled={!team}
            onClick={handlePassedGo}
            className="flex-1 py-2"
          >
            🟢 Passed GO (+$200)
          </Btn>
          <Btn
            variant="red"
            disabled={!team || !space || !space.rentValue}
            onClick={handlePaidRent}
            className="flex-1 py-2"
          >
            💸 Paid Rent
          </Btn>
          <Btn
            variant="gray"
            disabled={!team}
            onClick={handleDrawChance}
            className="flex-1 py-2"
          >
            🎴 Draw Chance
          </Btn>
        </div>

        {/* Chance card result */}
        {drawnCard && (
          <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex flex-col gap-3">
            <div className="text-sm font-bold text-yellow-400">🎴 Chance Card Drawn!</div>
            <div className="text-foreground">{drawnCard.text}</div>
            {drawnCard.amount !== 0 && (
              <div className={`text-sm font-bold ${drawnCard.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                {drawnCard.amount > 0 ? `+$${drawnCard.amount}` : `-$${Math.abs(drawnCard.amount)}`}
              </div>
            )}
            {drawnCard.moveTo !== undefined && (
              <div className="text-sm text-blue-400">
                → Move to: {board?.find(s => s.position === drawnCard.moveTo)?.name ?? `pos ${drawnCard.moveTo}`}
              </div>
            )}
            <div className="flex gap-2">
              <Btn variant="green" onClick={handleApplyChance} disabled={!team} className="flex-1">
                Apply to {team?.name ?? "team"}
              </Btn>
              <Btn variant="gray" onClick={() => setDrawnCard(null)}>Discard</Btn>
            </div>
          </div>
        )}
      </div>

      {/* Custom event */}
      <div className={card}>
        <SectionHeader title="Custom Event" />
        <div className="flex flex-col gap-3">
          <div>
            <label className={lbl}>Message</label>
            <textarea
              className={inp}
              rows={2}
              placeholder="Describe what happened…"
              value={customMsg}
              onChange={e => setCustomMsg(e.target.value)}
            />
          </div>
          <div>
            <label className={lbl}>Cash change (optional — negative to deduct)</label>
            <input
              type="number"
              className={inp}
              placeholder="e.g. 150 or -50"
              value={customAmt}
              onChange={e => setCustomAmt(e.target.value)}
            />
          </div>
          <Btn variant="blue" onClick={handleCustomEvent} disabled={!customMsg.trim()} className="w-full py-2">
            Post Event
          </Btn>
        </div>
      </div>

      {/* Game Controls */}
      <div className={`${card} border-red-900/40`}>
        <SectionHeader title="Game Controls" />
        <p className="text-xs text-muted-foreground mb-3">
          Resetting clears all events, returns all teams to $1500 at GO, and removes all property ownership.
        </p>
        <div className="flex items-center gap-3">
          <Btn variant={confirmReset ? "red" : "gray"} onClick={handleReset} disabled={resetGame.isPending} className="py-2 px-6">
            {confirmReset ? "⚠ Confirm Reset" : "Reset Game"}
          </Btn>
          {confirmReset && (
            <button className="text-xs text-muted-foreground underline" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Organizer Page ───────────────────────────────────────────────────────

const TABS = ["Gameplay", "Teams", "Board", "Events"] as const;
type Tab = typeof TABS[number];

export default function Organizer() {
  const isUnlocked = sessionStorage.getItem(PIN_KEY) === "1";
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [tab, setTab] = useState<Tab>("Gameplay");

  if (!unlocked) {
    return <PinGate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm text-white">
            🎲
          </div>
          <div>
            <div className="font-black text-base leading-tight text-blue-400">YCIS MONOPOLY 2026</div>
            <div className="text-xs text-muted-foreground tracking-widest uppercase">Organizer Panel</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Dashboard
          </a>
          <button
            onClick={() => { sessionStorage.removeItem(PIN_KEY); setUnlocked(false); }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div
        className="flex border-b border-border px-4 gap-1 shrink-0"
        style={{ backgroundColor: "hsl(var(--card))" }}
      >
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
              tab === t
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        {tab === "Gameplay" && <GameplayTab />}
        {tab === "Teams"    && <TeamsTab />}
        {tab === "Board"    && <BoardTab />}
        {tab === "Events"   && <EventsTab />}
      </div>
    </div>
  );
}
