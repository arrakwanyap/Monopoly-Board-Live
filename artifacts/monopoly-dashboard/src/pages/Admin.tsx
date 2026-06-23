import { useState } from "react";
import TeamToken from "@/components/TeamToken";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTeams,
  useGetBoard,
  useUpdateTeam,
  useCreateTeam,
  useDeleteTeam,
  useSetBoardSpaceOwnership,
  useCreateEvent,
  useResetGame,
  getListTeamsQueryKey,
  getGetBoardQueryKey,
  getGetGameStateQueryKey,
  getGetLeaderboardQueryKey,
  getListEventsQueryKey,
} from "@workspace/api-client-react";

const EMOJI_OPTIONS = ["🦅", "🐉", "🦁", "🐯", "🦊", "🐺", "🦋", "🦓", "🐬", "🦄"];
const COLOR_OPTIONS = [
  "#e74c3c", "#3498db", "#2ecc71", "#f39c12",
  "#9b59b6", "#1abc9c", "#e91e63", "#ff5722",
];
const EVENT_TYPES = [
  "property_taken", "rent_paid", "takeover", "chance",
  "community_chest", "hotel_built", "cash_change", "system",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full rounded px-2 py-1.5 text-sm bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-ring";
const selectClass = inputClass;
const btnPrimary = "px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-80 disabled:opacity-50";

export default function Admin() {
  const qc = useQueryClient();

  const { data: teams } = useListTeams({ query: { refetchInterval: 5000 } });
  const { data: board } = useGetBoard({ query: { refetchInterval: 5000 } });

  const updateTeam = useUpdateTeam();
  const createTeam = useCreateTeam();
  const deleteTeam = useDeleteTeam();
  const setOwnership = useSetBoardSpaceOwnership();
  const createEvent = useCreateEvent();
  const resetGame = useResetGame();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: getListTeamsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetBoardQueryKey() });
    qc.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
    qc.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
    qc.invalidateQueries({ queryKey: getListEventsQueryKey() });
  };

  // Move team
  const [moveTeamId, setMoveTeamId] = useState("");
  const [movePos, setMovePos] = useState("0");
  const handleMove = () => {
    if (!moveTeamId) return;
    updateTeam.mutate(
      { id: parseInt(moveTeamId), data: { position: parseInt(movePos) } },
      {
        onSuccess: () => {
          createEvent.mutate({
            data: {
              message: `${teams?.find(t => t.id === parseInt(moveTeamId))?.name} moved to position ${movePos}`,
              type: "system",
              teamId: parseInt(moveTeamId),
            },
          });
          invalidateAll();
        },
      }
    );
  };

  // Adjust cash
  const [cashTeamId, setCashTeamId] = useState("");
  const [cashAmount, setCashAmount] = useState("0");
  const handleCash = (add: boolean) => {
    if (!cashTeamId) return;
    const team = teams?.find(t => t.id === parseInt(cashTeamId));
    if (!team) return;
    const delta = parseInt(cashAmount) * (add ? 1 : -1);
    const newCash = Math.max(0, team.cash + delta);
    updateTeam.mutate(
      { id: parseInt(cashTeamId), data: { cash: newCash } },
      {
        onSuccess: () => {
          createEvent.mutate({
            data: {
              message: `${team.name} ${add ? "received" : "paid"} $${cashAmount}`,
              type: "cash_change",
              teamId: parseInt(cashTeamId),
              amount: delta,
            },
          });
          invalidateAll();
        },
      }
    );
  };

  // Set property ownership
  const [propSpaceId, setPropSpaceId] = useState("");
  const [propTeamId, setPropTeamId] = useState("");
  const [propHotel, setPropHotel] = useState(false);
  const handleSetOwnership = () => {
    if (!propSpaceId) return;
    const space = board?.find(s => s.id === parseInt(propSpaceId));
    const team = teams?.find(t => t.id === parseInt(propTeamId));
    setOwnership.mutate(
      {
        id: parseInt(propSpaceId),
        data: { ownerId: propTeamId ? parseInt(propTeamId) : null, hasHotel: propHotel },
      },
      {
        onSuccess: () => {
          if (space && team) {
            createEvent.mutate({
              data: {
                message: `${team.name} ${propHotel ? "built a hotel on" : "claimed"} ${space.name}`,
                type: propHotel ? "hotel_built" : "property_taken",
                teamId: parseInt(propTeamId),
              },
            });
          }
          invalidateAll();
        },
      }
    );
  };

  // Post event
  const [eventMsg, setEventMsg] = useState("");
  const [eventType, setEventType] = useState("system");
  const [eventTeamId, setEventTeamId] = useState("");
  const [eventAmount, setEventAmount] = useState("");
  const handlePostEvent = () => {
    if (!eventMsg.trim()) return;
    createEvent.mutate(
      {
        data: {
          message: eventMsg,
          type: eventType as any,
          teamId: eventTeamId ? parseInt(eventTeamId) : null,
          amount: eventAmount ? parseInt(eventAmount) : null,
        },
      },
      {
        onSuccess: () => {
          setEventMsg("");
          setEventAmount("");
          invalidateAll();
        },
      }
    );
  };

  // Create team
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState(COLOR_OPTIONS[0]);
  const [newTeamEmoji, setNewTeamEmoji] = useState(EMOJI_OPTIONS[0]);
  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;
    createTeam.mutate(
      { data: { name: newTeamName, color: newTeamColor, emoji: newTeamEmoji } },
      {
        onSuccess: (team) => {
          createEvent.mutate({
            data: { message: `${team.name} has joined the game!`, type: "system" },
          });
          setNewTeamName("");
          invalidateAll();
        },
      }
    );
  };

  // Reset game
  const [confirmReset, setConfirmReset] = useState(false);
  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    resetGame.mutate({}, { onSuccess: () => { setConfirmReset(false); invalidateAll(); } });
  };

  const propertySpaces = board?.filter(s => s.type === "property") ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center font-black text-sm"
            style={{ backgroundColor: "#1fb25a", color: "#fff" }}
          >
            M
          </div>
          <div>
            <div className="font-black text-base leading-tight" style={{ color: "#1fb25a" }}>
              YCIS MONOPOLY 2026
            </div>
            <div className="text-xs text-muted-foreground tracking-widest uppercase">
              Organizer Admin Panel
            </div>
          </div>
        </div>
        <a
          href="/"
          className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider"
          style={{ backgroundColor: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
        >
          Back to Dashboard
        </a>
      </header>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">

        {/* Move Team */}
        <Section title="Move Team">
          <div className="flex flex-col gap-2">
            <Field label="Team">
              <select className={selectClass} value={moveTeamId} onChange={e => setMoveTeamId(e.target.value)}>
                <option value="">Select team...</option>
                {teams?.map(t => <option key={t.id} value={t.id}>{t.name} (pos {t.position})</option>)}
              </select>
            </Field>
            <Field label="Board Position (0-39)">
              <select className={selectClass} value={movePos} onChange={e => setMovePos(e.target.value)}>
                {board?.map(s => <option key={s.position} value={s.position}>{s.position}: {s.name}</option>)}
              </select>
            </Field>
            <button
              className={btnPrimary}
              style={{ backgroundColor: "#1fb25a" }}
              onClick={handleMove}
              disabled={!moveTeamId || updateTeam.isPending}
            >
              Move Team
            </button>
          </div>
        </Section>

        {/* Adjust Cash */}
        <Section title="Adjust Cash">
          <div className="flex flex-col gap-2">
            <Field label="Team">
              <select className={selectClass} value={cashTeamId} onChange={e => setCashTeamId(e.target.value)}>
                <option value="">Select team...</option>
                {teams?.map(t => <option key={t.id} value={t.id}>{t.name} (${t.cash})</option>)}
              </select>
            </Field>
            <Field label="Amount ($)">
              <input
                type="number"
                className={inputClass}
                value={cashAmount}
                onChange={e => setCashAmount(e.target.value)}
                min="0"
              />
            </Field>
            <div className="flex gap-2">
              <button
                className={btnPrimary + " flex-1"}
                style={{ backgroundColor: "#1fb25a" }}
                onClick={() => handleCash(true)}
                disabled={!cashTeamId}
              >
                + Add
              </button>
              <button
                className={btnPrimary + " flex-1"}
                style={{ backgroundColor: "#ed1b24" }}
                onClick={() => handleCash(false)}
                disabled={!cashTeamId}
              >
                - Deduct
              </button>
            </div>
          </div>
        </Section>

        {/* Set Property Ownership */}
        <Section title="Property Ownership">
          <div className="flex flex-col gap-2">
            <Field label="Property">
              <select className={selectClass} value={propSpaceId} onChange={e => {
                setPropSpaceId(e.target.value);
                const sp = board?.find(s => s.id === parseInt(e.target.value));
                if (sp) {
                  setPropTeamId(sp.ownerId?.toString() ?? "");
                  setPropHotel(sp.hasHotel);
                }
              }}>
                <option value="">Select property...</option>
                {propertySpaces.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.ownerId ? `(owned by ${s.ownerName})` : "(unowned)"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Owner">
              <select className={selectClass} value={propTeamId} onChange={e => setPropTeamId(e.target.value)}>
                <option value="">None (unowned)</option>
                {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={propHotel}
                onChange={e => setPropHotel(e.target.checked)}
                className="rounded"
              />
              Has Hotel
            </label>
            <button
              className={btnPrimary}
              style={{ backgroundColor: "#f7941d" }}
              onClick={handleSetOwnership}
              disabled={!propSpaceId || setOwnership.isPending}
            >
              Set Ownership
            </button>
          </div>
        </Section>

        {/* Post Event */}
        <Section title="Post Event">
          <div className="flex flex-col gap-2">
            <Field label="Message">
              <textarea
                className={inputClass}
                rows={2}
                value={eventMsg}
                onChange={e => setEventMsg(e.target.value)}
                placeholder="Event description..."
              />
            </Field>
            <Field label="Event Type">
              <select className={selectClass} value={eventType} onChange={e => setEventType(e.target.value)}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </Field>
            <Field label="Team (optional)">
              <select className={selectClass} value={eventTeamId} onChange={e => setEventTeamId(e.target.value)}>
                <option value="">No team</option>
                {teams?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Amount (optional, negative for penalty)">
              <input
                type="number"
                className={inputClass}
                value={eventAmount}
                onChange={e => setEventAmount(e.target.value)}
                placeholder="e.g. 150 or -35"
              />
            </Field>
            <button
              className={btnPrimary}
              style={{ backgroundColor: "#3498db" }}
              onClick={handlePostEvent}
              disabled={!eventMsg.trim() || createEvent.isPending}
            >
              Post Event
            </button>
          </div>
        </Section>

        {/* Manage Teams */}
        <Section title="Manage Teams">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Field label="Team Name">
                <input
                  type="text"
                  className={inputClass}
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  placeholder="e.g. Team Alpha"
                />
              </Field>
              <Field label="Color">
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewTeamColor(c)}
                      className="w-7 h-7 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: c,
                        borderColor: newTeamColor === c ? "#fff" : "transparent",
                        transform: newTeamColor === c ? "scale(1.2)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>
              </Field>
              <Field label="Emoji">
                <div className="flex gap-2 flex-wrap">
                  {EMOJI_OPTIONS.map(e => (
                    <button
                      key={e}
                      onClick={() => setNewTeamEmoji(e)}
                      className="w-8 h-8 rounded text-lg flex items-center justify-center border transition-all"
                      style={{
                        borderColor: newTeamEmoji === e ? "hsl(var(--primary))" : "hsl(var(--border))",
                        backgroundColor: newTeamEmoji === e ? "hsl(var(--primary) / 0.2)" : "transparent",
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </Field>
              <button
                className={btnPrimary}
                style={{ backgroundColor: "#1fb25a" }}
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim() || createTeam.isPending}
              >
                Create Team
              </button>
            </div>

            {/* Existing teams */}
            {teams && teams.length > 0 && (
              <div className="border-t border-border pt-3">
                <div className="text-xs text-muted-foreground mb-2 font-medium">Existing Teams</div>
                <div className="flex flex-col gap-1.5">
                  {teams.map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      <TeamToken emoji={t.emoji} name={t.name} size={24} />
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="flex-1 font-medium text-foreground">{t.name}</span>
                      <span className="text-muted-foreground text-xs">${t.cash}</span>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${t.name}?`)) {
                            deleteTeam.mutate({ id: t.id }, { onSuccess: invalidateAll });
                          }
                        }}
                        className="text-xs text-destructive hover:opacity-70"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Game Controls */}
        <Section title="Game Controls">
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Resetting the game will clear all events, reset all teams to $1500 at position 0, and remove all property ownership. This cannot be undone.
            </p>
            <button
              className={btnPrimary}
              style={{ backgroundColor: confirmReset ? "#ed1b24" : "hsl(var(--secondary))", color: confirmReset ? "#fff" : "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
              onClick={handleReset}
              disabled={resetGame.isPending}
            >
              {confirmReset ? "Confirm Reset Game" : "Reset Game"}
            </button>
            {confirmReset && (
              <button
                className="text-xs text-muted-foreground underline"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
            )}
          </div>
        </Section>

      </div>
    </div>
  );
}
