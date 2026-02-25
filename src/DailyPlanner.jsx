import { useState, useRef, useCallback, useMemo } from "react";

// ── Calendar ──────────────────────────────────────────────────────────────────
const CALENDAR_PROVIDERS = [
  { id: "google",  label: "Google Calendar",   abbr: "G",  color: "#4285f4", bg: "#4285f418" },
  { id: "outlook", label: "Microsoft Outlook", abbr: "M",  color: "#0078d4", bg: "#0078d418" },
  { id: "apple",   label: "Apple Calendar",    abbr: "A",  color: "#fc3158", bg: "#fc315818" },
  { id: "caldav",  label: "CalDAV / iCal",     abbr: "iC", color: "#64748b", bg: "#64748b18" },
];

const DURATION_OPTIONS = [
  { id: "1h",         label: "1 Hour"       },
  { id: "1d",         label: "1 Day"        },
  { id: "indefinite", label: "Indefinitely" },
];

// ── Geography ─────────────────────────────────────────────────────────────────
const TRAVEL_MATRIX = {
  "Home Gym":       { "Home Gym": 0,   "Home Office": 3,   "1871 Chicago": 35,  "Cortex STL": 290, "Remote/Virtual": 0 },
  "Home Office":    { "Home Gym": 3,   "Home Office": 0,   "1871 Chicago": 35,  "Cortex STL": 290, "Remote/Virtual": 0 },
  "1871 Chicago":   { "Home Gym": 35,  "Home Office": 35,  "1871 Chicago": 0,   "Cortex STL": 290, "Remote/Virtual": 0 },
  "Cortex STL":     { "Home Gym": 290, "Home Office": 290, "1871 Chicago": 290, "Cortex STL": 0,   "Remote/Virtual": 0 },
  "Remote/Virtual": { "Home Gym": 0,   "Home Office": 0,   "1871 Chicago": 0,   "Cortex STL": 0,   "Remote/Virtual": 0 },
};

const LOCATION_COLORS = {
  "Home Gym":       "#22c55e",
  "Home Office":    "#22c55e",
  "1871 Chicago":   "#8b5cf6",
  "Cortex STL":     "#06b6d4",
  "Remote/Virtual": "#64748b",
};

function getTravelTime(from, to) {
  if (!from || !to || from === to) return 0;
  return TRAVEL_MATRIX[from]?.[to] ?? TRAVEL_MATRIX[to]?.[from] ?? 20;
}

function getLocationColor(loc) {
  return LOCATION_COLORS[loc] || "#64748b";
}

// ── Groups ────────────────────────────────────────────────────────────────────
const GROUP_PALETTE = ["#8b5cf6","#ec4899","#f97316","#06b6d4","#22c55e","#f59e0b","#3b82f6","#ef4444"];

const INITIAL_CONTACTS = [
  { id: 1, name: "Alex Chen",   location: "1871 Chicago",   status: "At coworking", avatar: "AC" },
  { id: 2, name: "Maya Patel",  location: "Home Office",    status: "WFH",          avatar: "MP" },
  { id: 3, name: "Jordan Kim",  location: "Cortex STL",     status: "At Cortex",    avatar: "JK" },
  { id: 4, name: "Sam Torres",  location: "Remote/Virtual", status: "Remote",       avatar: "ST" },
  { id: 5, name: "Riley Burke", location: "1871 Chicago",   status: "At coworking", avatar: "RB" },
  { id: 6, name: "Devon Nash",  location: "Home Gym",       status: "Working out",  avatar: "DN" },
];

// ── Events ────────────────────────────────────────────────────────────────────
const INITIAL_EVENTS = [
  { id: 1, subject: "Workout + AI Podcast",              startTime: "06:30", endTime: "07:15", location: "Home Gym",     description: "Strength + cardio while listening to AI/Quantum podcast",                               color: "#22c55e" },
  { id: 2, subject: "Daily Interview Drill",             startTime: "07:15", endTime: "07:30", location: "Home Office",  description: "1 STAR story rotation: Andretti, Bench-Q, CruTrade, Charter",                          color: "#f59e0b" },
  { id: 3, subject: "Job Search Ops",                    startTime: "07:30", endTime: "08:00", location: "Home Office",  description: "Update Notion Recruiter CRM, send 5 recruiter messages, check LinkedIn roles",          color: "#3b82f6" },
  { id: 4, subject: "Networking Events Calendar Build",  startTime: "09:00", endTime: "10:30", location: "1871 Chicago", description: "Build Chicago/St Louis event calendar, color code Cortex, 1871, CIC, STL AWS Chicago", color: "#8b5cf6" },
  { id: 5, subject: "Resume + LinkedIn Optimizer",       startTime: "10:45", endTime: "12:15", location: "1871 Chicago", description: "ATS benchmark resumes: AI TPM, Quantum PM, Security Integration PM versions in GitHub", color: "#ec4899" },
  { id: 6, subject: "Self-Updating Portfolio App Build", startTime: "13:30", endTime: "15:00", location: "Cortex STL",   description: "Repo to Notion sync, roadmap auto research, architecture diagrams, recruiter demo",      color: "#06b6d4" },
  { id: 7, subject: "Recruiter Outreach Automation",     startTime: "15:00", endTime: "16:00", location: "Cortex STL",   description: "n8n + Gmail + LinkedIn + Notion CRM workflow, 7-day follow-up templates",               color: "#f97316" },
];

// ── Constants ─────────────────────────────────────────────────────────────────
const START_HOUR  = 6;
const END_HOUR    = 17;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const SLOT_HEIGHT = 60;

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
function formatDisplay(t) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const disp = h % 12 === 0 ? 12 : h % 12;
  return `${disp}:${m.toString().padStart(2, "0")} ${ampm}`;
}
function getDuration(start, end) {
  return timeToMinutes(end) - timeToMinutes(start);
}

// ── PinIcon ───────────────────────────────────────────────────────────────────
const PinIcon = ({ color, size = 8 }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 10 14" fill="none" style={{ flexShrink: 0 }}>
    <path d="M5 0C2.24 0 0 2.24 0 5c0 3.75 5 9 5 9s5-5.25 5-9c0-2.76-2.24-5-5-5z" fill={color} opacity="0.9"/>
    <circle cx="5" cy="5" r="1.8" fill="#0a0a0f" opacity="0.7"/>
  </svg>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function DailyPlanner() {
  const mono = { fontFamily: "'IBM Plex Mono', 'Courier New', monospace" };

  // core
  const [events,   setEvents]   = useState(INITIAL_EVENTS);
  const [dragging, setDragging] = useState(null);
  const [tooltip,  setTooltip]  = useState(null);
  const gridRef    = useRef(null);
  const dragOffset = useRef(0);

  // calendar
  const [showCalendarModal,   setShowCalendarModal]   = useState(false);
  const [calendarConnections, setCalendarConnections] = useState([]);
  const [calendarForm,        setCalendarForm]        = useState({ provider: null, duration: "1d" });

  // groups
  const [showGroupsPanel, setShowGroupsPanel] = useState(false);
  const [groups,          setGroups]          = useState([]);
  const [contacts]                            = useState(INITIAL_CONTACTS);
  const [groupView,       setGroupView]       = useState("list"); // "list" | "create" | "detail"
  const [activeGroupId,   setActiveGroupId]   = useState(null);
  const [groupForm,       setGroupForm]       = useState({ name: "", color: GROUP_PALETTE[0], memberIds: [] });

  // ── Grid helpers ──────────────────────────────────────────────────────────
  const getTopPercent    = t => ((timeToMinutes(t) - START_HOUR * 60) / (TOTAL_HOURS * 60)) * 100;
  const getHeightPercent = (s, e) => (getDuration(s, e) / (TOTAL_HOURS * 60)) * 100;

  // ── Drag ──────────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e, id) => {
    e.preventDefault();
    dragOffset.current = e.clientY - e.currentTarget.getBoundingClientRect().top;
    setDragging(id);
    setTooltip(null);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !gridRef.current) return;
    const rect     = gridRef.current.getBoundingClientRect();
    const relY     = e.clientY - rect.top - dragOffset.current;
    const fraction = Math.max(0, Math.min(relY / rect.height, 1));
    let snapMins   = Math.round((fraction * TOTAL_HOURS * 60) / 15) * 15;
    snapMins       = Math.max(0, Math.min(snapMins, TOTAL_HOURS * 60));
    setEvents(prev => prev.map(ev => {
      if (ev.id !== dragging) return ev;
      const dur      = getDuration(ev.startTime, ev.endTime);
      const newStart = START_HOUR * 60 + snapMins;
      const newEnd   = newStart + dur;
      if (newEnd > END_HOUR * 60) return ev;
      return { ...ev, startTime: minutesToTime(newStart), endTime: minutesToTime(newEnd) };
    }));
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  // ── Touch drag (mobile) ───────────────────────────────────────────────────
  const handleTouchStart = useCallback((e, id) => {
    const touch = e.touches[0];
    dragOffset.current = touch.clientY - e.currentTarget.getBoundingClientRect().top;
    setDragging(id);
    setTooltip(null);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!dragging || !gridRef.current) return;
    e.preventDefault();
    const touch    = e.touches[0];
    const rect     = gridRef.current.getBoundingClientRect();
    const relY     = touch.clientY - rect.top - dragOffset.current;
    const fraction = Math.max(0, Math.min(relY / rect.height, 1));
    let snapMins   = Math.round((fraction * TOTAL_HOURS * 60) / 15) * 15;
    snapMins       = Math.max(0, Math.min(snapMins, TOTAL_HOURS * 60));
    setEvents(prev => prev.map(ev => {
      if (ev.id !== dragging) return ev;
      const dur      = getDuration(ev.startTime, ev.endTime);
      const newStart = START_HOUR * 60 + snapMins;
      const newEnd   = newStart + dur;
      if (newEnd > END_HOUR * 60) return ev;
      return { ...ev, startTime: minutesToTime(newStart), endTime: minutesToTime(newEnd) };
    }));
  }, [dragging]);

  const handleTouchEnd = useCallback(() => setDragging(null), []);

  // ── Location analysis ─────────────────────────────────────────────────────
  const locationAnalysis = useMemo(() => {
    const sorted = [...events].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    const transitions = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i].location, to = sorted[i + 1].location;
      if (from === to) continue;
      const gapMins    = timeToMinutes(sorted[i + 1].startTime) - timeToMinutes(sorted[i].endTime);
      const travelMins = getTravelTime(from, to);
      transitions.push({ from, to, gapMins, travelMins, hasEnoughTime: gapMins >= travelMins, fromEvent: sorted[i], toEvent: sorted[i + 1] });
    }
    const locationGroups = {};
    sorted.forEach(ev => { (locationGroups[ev.location] = locationGroups[ev.location] || []).push(ev); });
    const totalTrans      = sorted.length - 1;
    const conflictCount   = transitions.filter(t => !t.hasEnoughTime).length;
    const efficiencyScore = totalTrans > 0 ? Math.round(((totalTrans - transitions.length) / totalTrans) * 100) : 100;
    return { transitions, locationGroups, efficiencyScore, conflictCount };
  }, [events]);

  // ── Calendar handlers ─────────────────────────────────────────────────────
  const handleConnectCalendar = () => {
    if (!calendarForm.provider) return;
    const prov = CALENDAR_PROVIDERS.find(p => p.id === calendarForm.provider);
    setCalendarConnections(prev => [
      ...prev.filter(c => c.providerId !== calendarForm.provider),
      { providerId: prov.id, providerLabel: prov.label, providerColor: prov.color, duration: calendarForm.duration },
    ]);
    setShowCalendarModal(false);
    setCalendarForm({ provider: null, duration: "1d" });
  };

  // ── Group handlers ────────────────────────────────────────────────────────
  const handleCreateGroup = () => {
    if (!groupForm.name.trim()) return;
    const g = { id: Date.now(), name: groupForm.name.trim(), color: groupForm.color, memberIds: groupForm.memberIds };
    setGroups(prev => [...prev, g]);
    setActiveGroupId(g.id);
    setGroupView("detail");
    setGroupForm({ name: "", color: GROUP_PALETTE[0], memberIds: [] });
  };

  const handleLeaveGroup    = id => { setGroups(prev => prev.filter(g => g.id !== id)); setGroupView("list"); setActiveGroupId(null); };
  const handleRemoveMember  = (gid, mid) => setGroups(prev => prev.map(g => g.id !== gid ? g : { ...g, memberIds: g.memberIds.filter(id => id !== mid) }));
  const handleAddMember     = (gid, mid) => setGroups(prev => prev.map(g => g.id !== gid ? g : { ...g, memberIds: [...new Set([...g.memberIds, mid])] }));

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ ...mono, background: "#0a0a0f", minHeight: "100vh", color: "#e2e8f0", padding: "16px", userSelect: dragging ? "none" : "auto" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; background: #1a1a2e; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        input::placeholder { color: #334155; }
        input:focus { border-color: #334155 !important; }
      `}</style>

      {/* ════════════════════════════════════════════════════════════
          CALENDAR MODAL
      ════════════════════════════════════════════════════════════ */}
      {showCalendarModal && (
        <div
          onClick={e => e.target === e.currentTarget && setShowCalendarModal(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#00000090", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
        >
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 24, width: "min(360px, 92vw)", boxShadow: "0 24px 64px #00000080" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#475569", marginBottom: 4 }}>CALENDAR SYNC</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>CONNECT CALENDAR</div>
              </div>
              <button onClick={() => { setShowCalendarModal(false); setCalendarForm({ provider: null, duration: "1d" }); }}
                style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            {/* Provider grid */}
            <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#475569", marginBottom: 8 }}>SELECT PROVIDER</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              {CALENDAR_PROVIDERS.map(p => (
                <button key={p.id} onClick={() => setCalendarForm(f => ({ ...f, provider: p.id }))}
                  style={{ background: calendarForm.provider === p.id ? p.bg : "#0a0a0f", border: `1px solid ${calendarForm.provider === p.id ? p.color : "#1e293b"}`, borderRadius: 8, padding: "10px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: p.color, marginBottom: 3, ...mono }}>{p.abbr}</div>
                  <div style={{ fontSize: 10, color: "#cbd5e1", lineHeight: 1.3, ...mono }}>{p.label}</div>
                </button>
              ))}
            </div>

            {/* Duration */}
            <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "#475569", marginBottom: 8 }}>SYNC DURATION</div>
            <div style={{ background: "#0a0a0f", border: "1px solid #1e293b", borderRadius: 8, padding: 4, display: "flex", gap: 4, marginBottom: 20 }}>
              {DURATION_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setCalendarForm(f => ({ ...f, duration: opt.id }))}
                  style={{ flex: 1, padding: "8px 4px", background: calendarForm.duration === opt.id ? "#1e293b" : "none", border: "none", borderRadius: 6, color: calendarForm.duration === opt.id ? "#f8fafc" : "#475569", fontSize: 10, ...mono, cursor: "pointer", transition: "all 0.15s" }}>
                  {opt.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setShowCalendarModal(false); setCalendarForm({ provider: null, duration: "1d" }); }}
                style={{ flex: 1, padding: 11, background: "none", border: "1px solid #1e293b", borderRadius: 8, color: "#64748b", fontSize: 11, ...mono, cursor: "pointer", letterSpacing: "0.08em" }}>
                CANCEL
              </button>
              <button onClick={handleConnectCalendar} disabled={!calendarForm.provider}
                style={{ flex: 2, padding: 11, background: calendarForm.provider ? `${CALENDAR_PROVIDERS.find(p => p.id === calendarForm.provider)?.color}22` : "#1e293b", border: `1px solid ${calendarForm.provider ? `${CALENDAR_PROVIDERS.find(p => p.id === calendarForm.provider)?.color}60` : "#1e293b"}`, borderRadius: 8, color: calendarForm.provider ? "#f8fafc" : "#475569", fontSize: 11, ...mono, cursor: calendarForm.provider ? "pointer" : "not-allowed", fontWeight: 600, letterSpacing: "0.08em", transition: "all 0.15s" }}>
                CONNECT →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          GROUPS PANEL (right drawer)
      ════════════════════════════════════════════════════════════ */}
      {showGroupsPanel && (
        <div
          onClick={e => e.target === e.currentTarget && setShowGroupsPanel(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#00000090", backdropFilter: "blur(4px)", display: "flex", justifyContent: "flex-end" }}
        >
          <div style={{ width: "min(380px, 100vw)", height: "100%", background: "#0f172a", borderLeft: "1px solid #1e293b", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            {/* Panel header */}
            <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#0f172a", zIndex: 10 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#475569", marginBottom: 4 }}>GEOGRAPHY + CONTACTS</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>GROUPS</div>
              </div>
              <button onClick={() => { setShowGroupsPanel(false); setGroupView("list"); setActiveGroupId(null); }}
                style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 22 }}>×</button>
            </div>

            <div style={{ padding: "16px 20px", flex: 1 }}>

              {/* ── WHO'S WHERE ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#475569", marginBottom: 10 }}>WHO'S WHERE</div>
                {Object.entries(
                  contacts.reduce((acc, c) => { (acc[c.location] = acc[c.location] || []).push(c); return acc; }, {})
                ).map(([loc, members]) => (
                  <div key={loc} style={{ marginBottom: 10, padding: "10px 12px", background: "#0a0a0f", border: `1px solid ${getLocationColor(loc)}28`, borderRadius: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <PinIcon color={getLocationColor(loc)} size={9} />
                      <span style={{ fontSize: 10, color: getLocationColor(loc), fontWeight: 600, letterSpacing: "0.06em" }}>{loc}</span>
                      <span style={{ fontSize: 9, color: "#334155", marginLeft: "auto" }}>{members.length} here</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {members.map(m => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 5, background: `${getLocationColor(loc)}12`, border: `1px solid ${getLocationColor(loc)}28`, borderRadius: 20, padding: "3px 8px" }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${getLocationColor(loc)}28`, border: `1px solid ${getLocationColor(loc)}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: getLocationColor(loc), fontWeight: 700 }}>{m.avatar}</div>
                          <span style={{ fontSize: 9, color: "#cbd5e1" }}>{m.name.split(" ")[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── CO-LOCATION OPPORTUNITIES ── */}
              {(() => {
                const colocated = events.filter(ev => contacts.some(c => c.location === ev.location));
                if (!colocated.length) return null;
                return (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#475569", marginBottom: 10 }}>CO-LOCATION OPS</div>
                    {colocated.map(ev => {
                      const here = contacts.filter(c => c.location === ev.location);
                      return (
                        <div key={ev.id} style={{ marginBottom: 8, padding: "8px 10px", background: `${ev.color}10`, border: `1px solid ${ev.color}28`, borderRadius: 6 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#f1f5f9", marginBottom: 2 }}>{ev.subject}</div>
                          <div style={{ fontSize: 9, color: ev.color, marginBottom: 5, letterSpacing: "0.05em" }}>
                            {formatDisplay(ev.startTime)} · {ev.location}
                          </div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {here.map(m => (
                              <span key={m.id} style={{ fontSize: 9, color: "#94a3b8", background: "#1e293b", borderRadius: 20, padding: "2px 7px" }}>
                                {m.name.split(" ")[0]}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* ── GROUPS ── */}
              <div style={{ borderTop: "1px solid #1e293b", paddingTop: 16 }}>

                {/* LIST VIEW */}
                {groupView === "list" && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#475569" }}>MY GROUPS</div>
                      <button onClick={() => setGroupView("create")}
                        style={{ background: "#0a0a0f", border: "1px solid #1e293b", borderRadius: 6, padding: "4px 12px", fontSize: 10, color: "#94a3b8", cursor: "pointer", ...mono, letterSpacing: "0.08em" }}>
                        + NEW GROUP
                      </button>
                    </div>
                    {groups.length === 0 ? (
                      <div style={{ fontSize: 10, color: "#334155", textAlign: "center", padding: "24px 0", lineHeight: 1.8 }}>
                        No groups yet.<br />Create one to see where everyone is.
                      </div>
                    ) : groups.map(g => {
                      const members = contacts.filter(c => g.memberIds.includes(c.id));
                      return (
                        <div key={g.id} onClick={() => { setActiveGroupId(g.id); setGroupView("detail"); }}
                          style={{ marginBottom: 8, padding: "10px 12px", background: "#0a0a0f", border: `1px solid ${g.color}28`, borderRadius: 8, cursor: "pointer" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: g.color, boxShadow: `0 0 6px ${g.color}` }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: "#f1f5f9" }}>{g.name}</span>
                            <span style={{ fontSize: 9, color: "#475569", marginLeft: "auto" }}>{members.length} members →</span>
                          </div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {members.slice(0, 5).map(m => (
                              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <PinIcon color={getLocationColor(m.location)} size={7} />
                                <span style={{ fontSize: 9, color: "#64748b" }}>{m.name.split(" ")[0]}</span>
                              </div>
                            ))}
                            {members.length > 5 && <span style={{ fontSize: 9, color: "#334155" }}>+{members.length - 5}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* CREATE VIEW */}
                {groupView === "create" && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <button onClick={() => { setGroupView("list"); setGroupForm({ name: "", color: GROUP_PALETTE[0], memberIds: [] }); }}
                        style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>←</button>
                      <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#475569" }}>CREATE GROUP</div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#475569", marginBottom: 6 }}>GROUP NAME</div>
                      <input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Chicago Crew"
                        style={{ width: "100%", background: "#0a0a0f", border: "1px solid #1e293b", borderRadius: 6, padding: "9px 10px", color: "#f1f5f9", fontSize: 11, ...mono, outline: "none" }} />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#475569", marginBottom: 8 }}>COLOR</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {GROUP_PALETTE.map(c => (
                          <button key={c} onClick={() => setGroupForm(f => ({ ...f, color: c }))}
                            style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: groupForm.color === c ? "2px solid #f8fafc" : "2px solid transparent", cursor: "pointer", boxShadow: groupForm.color === c ? `0 0 8px ${c}` : "none" }} />
                        ))}
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#475569", marginBottom: 8 }}>ADD MEMBERS</div>
                      {contacts.map(c => {
                        const sel = groupForm.memberIds.includes(c.id);
                        return (
                          <div key={c.id} onClick={() => setGroupForm(f => ({ ...f, memberIds: sel ? f.memberIds.filter(id => id !== c.id) : [...f.memberIds, c.id] }))}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 4, background: sel ? `${groupForm.color}12` : "#0a0a0f", border: `1px solid ${sel ? `${groupForm.color}50` : "#1e293b"}`, borderRadius: 6, cursor: "pointer", transition: "all 0.12s" }}>
                            <div style={{ width: 26, height: 26, borderRadius: "50%", background: sel ? `${groupForm.color}30` : "#1e293b", border: `1px solid ${sel ? groupForm.color : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: sel ? groupForm.color : "#64748b", fontWeight: 700, flexShrink: 0 }}>{c.avatar}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 10, color: "#f1f5f9" }}>{c.name}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                                <PinIcon color={getLocationColor(c.location)} size={7} />
                                <span style={{ fontSize: 9, color: "#475569" }}>{c.location}</span>
                              </div>
                            </div>
                            <div style={{ width: 16, height: 16, borderRadius: "50%", background: sel ? groupForm.color : "none", border: `1px solid ${sel ? groupForm.color : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {sel && <span style={{ fontSize: 9, color: "#0a0a0f", fontWeight: 700, lineHeight: 1 }}>✓</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { setGroupView("list"); setGroupForm({ name: "", color: GROUP_PALETTE[0], memberIds: [] }); }}
                        style={{ flex: 1, padding: 11, background: "none", border: "1px solid #1e293b", borderRadius: 8, color: "#64748b", fontSize: 11, ...mono, cursor: "pointer" }}>
                        CANCEL
                      </button>
                      <button onClick={handleCreateGroup} disabled={!groupForm.name.trim()}
                        style={{ flex: 2, padding: 11, background: groupForm.name.trim() ? `${groupForm.color}22` : "#1e293b", border: `1px solid ${groupForm.name.trim() ? `${groupForm.color}60` : "#1e293b"}`, borderRadius: 8, color: groupForm.name.trim() ? "#f8fafc" : "#475569", fontSize: 11, ...mono, cursor: groupForm.name.trim() ? "pointer" : "not-allowed", fontWeight: 600, letterSpacing: "0.06em", transition: "all 0.15s" }}>
                        CREATE GROUP
                      </button>
                    </div>
                  </>
                )}

                {/* DETAIL VIEW */}
                {groupView === "detail" && activeGroup && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <button onClick={() => { setGroupView("list"); setActiveGroupId(null); }}
                        style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>←</button>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: activeGroup.color, boxShadow: `0 0 8px ${activeGroup.color}` }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{activeGroup.name}</span>
                    </div>

                    {/* Members */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#475569", marginBottom: 8 }}>
                        MEMBERS ({activeGroup.memberIds.length})
                      </div>
                      {activeGroup.memberIds.length === 0 ? (
                        <div style={{ fontSize: 10, color: "#334155", padding: "10px 0" }}>No members yet.</div>
                      ) : contacts.filter(c => activeGroup.memberIds.includes(c.id)).map(m => (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 4, background: "#0a0a0f", border: "1px solid #1e293b", borderRadius: 6 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${getLocationColor(m.location)}18`, border: `1px solid ${getLocationColor(m.location)}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: getLocationColor(m.location), fontWeight: 700, flexShrink: 0 }}>{m.avatar}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, color: "#f1f5f9" }}>{m.name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                              <PinIcon color={getLocationColor(m.location)} size={7} />
                              <span style={{ fontSize: 9, color: getLocationColor(m.location) }}>{m.location}</span>
                              <span style={{ fontSize: 9, color: "#334155" }}>· {m.status}</span>
                            </div>
                          </div>
                          <button onClick={() => handleRemoveMember(activeGroup.id, m.id)}
                            style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
                        </div>
                      ))}
                    </div>

                    {/* Add more members */}
                    {contacts.filter(c => !activeGroup.memberIds.includes(c.id)).length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "#475569", marginBottom: 8 }}>ADD MORE</div>
                        {contacts.filter(c => !activeGroup.memberIds.includes(c.id)).map(c => (
                          <div key={c.id} onClick={() => handleAddMember(activeGroup.id, c.id)}
                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", marginBottom: 4, background: "#0a0a0f", border: "1px solid #1e293b", borderRadius: 6, cursor: "pointer" }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#64748b", fontWeight: 700, flexShrink: 0 }}>{c.avatar}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 10, color: "#94a3b8" }}>{c.name}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
                                <PinIcon color={getLocationColor(c.location)} size={7} />
                                <span style={{ fontSize: 9, color: "#475569" }}>{c.location}</span>
                              </div>
                            </div>
                            <span style={{ fontSize: 14, color: "#475569" }}>+</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <button onClick={() => handleLeaveGroup(activeGroup.id)}
                      style={{ width: "100%", padding: 11, background: "#7c1d1d20", border: "1px solid #ef444330", borderRadius: 8, color: "#ef4444", fontSize: 11, ...mono, cursor: "pointer", letterSpacing: "0.06em" }}>
                      LEAVE / DELETE GROUP
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 20, borderBottom: "1px solid #1e293b", paddingBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.25em", color: "#475569", marginBottom: 4 }}>DAILY OPS PLANNER</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 20, fontWeight: 700, color: "#f8fafc" }}>WED FEB 25, 2026</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 5 }}>
              {events.length} BLOCKS · {Math.round(events.reduce((a, e) => a + getDuration(e.startTime, e.endTime), 0) / 60 * 10) / 10}H SCHEDULED · DRAG TO RESCHEDULE
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            {/* Connected calendar chips */}
            {calendarConnections.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {calendarConnections.map(conn => (
                  <div key={conn.providerId} style={{ display: "flex", alignItems: "center", gap: 6, background: `${conn.providerColor}12`, border: `1px solid ${conn.providerColor}38`, borderRadius: 20, padding: "4px 10px", fontSize: 10, color: conn.providerColor }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: conn.providerColor, boxShadow: `0 0 5px ${conn.providerColor}` }} />
                    {conn.providerLabel}
                    <span style={{ color: "#475569", fontSize: 9 }}>· {DURATION_OPTIONS.find(d => d.id === conn.duration)?.label}</span>
                    <button onClick={() => setCalendarConnections(prev => prev.filter(c => c.providerId !== conn.providerId))}
                      style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button onClick={() => setShowGroupsPanel(true)}
                style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, padding: "6px 14px", fontSize: 10, color: "#64748b", cursor: "pointer", ...mono, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12 }}>◎</span> GROUPS
                {groups.length > 0 && <span style={{ background: "#1e293b", borderRadius: 10, padding: "1px 6px", fontSize: 9, color: "#94a3b8" }}>{groups.length}</span>}
              </button>
              <button onClick={() => setShowCalendarModal(true)}
                style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, padding: "6px 14px", fontSize: 10, color: "#64748b", cursor: "pointer", ...mono, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13 }}>+</span> CALENDAR
              </button>
            </div>
          </div>
        </div>

        {/* Travel conflict banner */}
        {locationAnalysis.conflictCount > 0 && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#7c1d1d20", border: "1px solid #ef444438", borderRadius: 6, display: "flex", alignItems: "center", gap: 8, fontSize: 10, flexWrap: "wrap" }}>
            <span style={{ color: "#ef4444" }}>⚠</span>
            <span style={{ color: "#fca5a5" }}>{locationAnalysis.conflictCount} TRAVEL CONFLICT{locationAnalysis.conflictCount > 1 ? "S" : ""} DETECTED</span>
            <span style={{ color: "#475569" }}>— insufficient travel time between location changes</span>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          MAIN LAYOUT
      ════════════════════════════════════════════════════════════ */}
      <div style={{ display: "flex", gap: 16 }}>
        {/* Time labels */}
        <div style={{ width: 44, flexShrink: 0 }}>
          <div style={{ position: "relative", height: TOTAL_HOURS * SLOT_HEIGHT }}>
            {hours.map(h => (
              <div key={h} style={{ position: "absolute", top: (h - START_HOUR) * SLOT_HEIGHT - 8, right: 6, fontSize: 9, color: "#475569", letterSpacing: "0.04em" }}>
                {h === 12 ? "12PM" : h > 12 ? `${h - 12}PM` : `${h}AM`}
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
          <div
            ref={gridRef}
            style={{ position: "relative", height: TOTAL_HOURS * SLOT_HEIGHT, borderLeft: "2px solid #1e293b" }}
            onTouchMove={handleTouchMove}
          >
            {/* Hour rows */}
            {hours.map(h => (
              <div key={h} style={{ position: "absolute", top: (h - START_HOUR) * SLOT_HEIGHT, left: 0, right: 0, borderTop: h === START_HOUR ? "none" : "1px solid #1e293b", height: SLOT_HEIGHT }}>
                <div style={{ position: "absolute", top: SLOT_HEIGHT / 2, left: 0, right: 0, borderTop: "1px dashed #111827" }} />
              </div>
            ))}

            {/* Current time indicator */}
            {(() => {
              const now  = new Date();
              const mins = now.getHours() * 60 + now.getMinutes();
              if (mins < START_HOUR * 60 || mins > END_HOUR * 60) return null;
              const pct  = ((mins - START_HOUR * 60) / (TOTAL_HOURS * 60)) * 100;
              return (
                <div style={{ position: "absolute", top: `${pct}%`, left: -2, right: 0, height: 2, background: "#ef4444", zIndex: 10, boxShadow: "0 0 8px #ef444488" }}>
                  <div style={{ position: "absolute", left: -4, top: -4, width: 10, height: 10, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef444488" }} />
                </div>
              );
            })()}

            {/* Travel conflict overlays */}
            {locationAnalysis.transitions.filter(t => !t.hasEnoughTime).map((t, i) => {
              const y1 = getTopPercent(t.fromEvent.endTime);
              const y2 = getTopPercent(t.toEvent.startTime);
              return (
                <div key={i} style={{ position: "absolute", top: `${y1}%`, left: 0, right: 0, height: `${y2 - y1}%`, background: "#ef444408", borderTop: "1px dashed #ef444438", borderBottom: "1px dashed #ef444438", zIndex: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, color: "#ef444460", letterSpacing: "0.08em" }}>
                    ⚠ NEED {t.travelMins}m · ONLY {t.gapMins}m FREE · {t.from} → {t.to}
                  </span>
                </div>
              );
            })}

            {/* Events */}
            {events.map(ev => {
              const top      = getTopPercent(ev.startTime);
              const height   = getHeightPercent(ev.startTime, ev.endTime);
              const isDrag   = dragging === ev.id;
              const dur      = getDuration(ev.startTime, ev.endTime);
              const isShort  = dur <= 30;
              const locColor = getLocationColor(ev.location);
              const nearby   = contacts.filter(c => c.location === ev.location);

              return (
                <div key={ev.id}
                  onMouseDown={e => handleMouseDown(e, ev.id)}
                  onTouchStart={e => handleTouchStart(e, ev.id)}
                  onMouseEnter={() => !dragging && setTooltip(ev.id)}
                  onMouseLeave={() => setTooltip(null)}
                  style={{ position: "absolute", top: `${top}%`, left: 8, right: 8, height: `${height}%`, minHeight: 26, background: `${ev.color}18`, borderLeft: `3px solid ${ev.color}`, borderTop: `1px solid ${ev.color}40`, borderBottom: `1px solid ${ev.color}20`, borderRight: `1px solid ${ev.color}20`, borderRadius: "0 4px 4px 0", padding: isShort ? "3px 8px" : "6px 10px", cursor: isDrag ? "grabbing" : "grab", zIndex: isDrag ? 100 : 5, transition: isDrag ? "none" : "box-shadow 0.15s, transform 0.1s", boxShadow: isDrag ? `0 8px 32px ${ev.color}40, 0 0 0 1px ${ev.color}60` : tooltip === ev.id ? `0 4px 16px ${ev.color}30` : "none", transform: isDrag ? "scale(1.01)" : "scale(1)", overflow: "hidden", touchAction: "none" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, height: "100%" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: ev.color, flexShrink: 0, marginTop: isShort ? 5 : 3, boxShadow: `0 0 6px ${ev.color}` }} />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: isShort ? 11 : 12, fontWeight: 600, color: "#f1f5f9", letterSpacing: "0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.3 }}>
                        {ev.subject}
                      </div>
                      {!isShort && (
                        <div style={{ fontSize: 10, color: ev.color, opacity: 0.85, marginTop: 2, letterSpacing: "0.04em" }}>
                          {formatDisplay(ev.startTime)} → {formatDisplay(ev.endTime)} · {dur}m
                        </div>
                      )}
                      {!isShort && ev.location && (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, flexWrap: "wrap" }}>
                          <PinIcon color={locColor} size={7} />
                          <span style={{ fontSize: 9, color: locColor, letterSpacing: "0.04em" }}>{ev.location}</span>
                          {nearby.length > 0 && (
                            <span style={{ fontSize: 9, color: "#475569" }}>· {nearby.map(c => c.name.split(" ")[0]).join(", ")} nearby</span>
                          )}
                        </div>
                      )}
                      {!isShort && dur > 45 && (
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {ev.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tooltip */}
                  {tooltip === ev.id && !isDrag && (
                    <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 200, background: "#0f172a", border: `1px solid ${ev.color}50`, borderRadius: 6, padding: "10px 14px", width: 280, boxShadow: `0 8px 32px #00000080, 0 0 0 1px ${ev.color}20`, pointerEvents: "none" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f8fafc", marginBottom: 4 }}>{ev.subject}</div>
                      <div style={{ fontSize: 11, color: ev.color, marginBottom: 5, letterSpacing: "0.04em" }}>
                        {formatDisplay(ev.startTime)} — {formatDisplay(ev.endTime)} · {dur} min
                      </div>
                      {ev.location && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                          <PinIcon color={locColor} size={8} />
                          <span style={{ fontSize: 10, color: locColor }}>{ev.location}</span>
                        </div>
                      )}
                      {nearby.length > 0 && (
                        <div style={{ fontSize: 10, color: "#64748b", marginBottom: 5 }}>
                          <span style={{ color: "#94a3b8" }}>Co-located: </span>{nearby.map(c => c.name).join(", ")}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>{ev.description}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div style={{ width: 180, flexShrink: 0, display: "flex", flexDirection: "column", gap: 0 }}>

          {/* Schedule */}
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#475569", marginBottom: 10 }}>SCHEDULE</div>
          {[...events].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)).map(ev => (
            <div key={ev.id} style={{ marginBottom: 6, padding: "6px 8px", borderLeft: `2px solid ${ev.color}`, background: "#0f172a", borderRadius: "0 4px 4px 0" }}>
              <div style={{ fontSize: 10, color: ev.color, letterSpacing: "0.04em" }}>{formatDisplay(ev.startTime)}</div>
              <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 1, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.subject}</div>
              {ev.location && (
                <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                  <PinIcon color={getLocationColor(ev.location)} size={6} />
                  <span style={{ fontSize: 9, color: "#475569" }}>{ev.location}</span>
                </div>
              )}
            </div>
          ))}

          {/* Geo score */}
          <div style={{ marginTop: 14, borderTop: "1px solid #1e293b", paddingTop: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#475569", marginBottom: 8 }}>GEO SCORE</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: "#64748b" }}>EFFICIENCY</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: locationAnalysis.efficiencyScore >= 70 ? "#22c55e" : locationAnalysis.efficiencyScore >= 40 ? "#f59e0b" : "#ef4444" }}>
                {locationAnalysis.efficiencyScore}%
              </span>
            </div>
            <div style={{ height: 3, background: "#1e293b", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
              <div style={{ height: "100%", width: `${locationAnalysis.efficiencyScore}%`, background: locationAnalysis.efficiencyScore >= 70 ? "#22c55e" : locationAnalysis.efficiencyScore >= 40 ? "#f59e0b" : "#ef4444", borderRadius: 2, transition: "width 0.3s" }} />
            </div>
            {Object.entries(locationAnalysis.locationGroups).map(([loc, evs]) => (
              <div key={loc} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                <PinIcon color={getLocationColor(loc)} size={7} />
                <span style={{ fontSize: 9, color: getLocationColor(loc), flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc}</span>
                <span style={{ fontSize: 9, color: "#334155" }}>{evs.length}×</span>
              </div>
            ))}
          </div>

          {/* Travel warnings */}
          {locationAnalysis.transitions.length > 0 && (
            <div style={{ marginTop: 12, borderTop: "1px solid #1e293b", paddingTop: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#475569", marginBottom: 8 }}>TRAVEL</div>
              {locationAnalysis.transitions.map((t, i) => (
                <div key={i} style={{ marginBottom: 7, padding: "6px 8px", background: t.hasEnoughTime ? "#0f172a" : "#7c1d1d18", border: `1px solid ${t.hasEnoughTime ? "#1e293b" : "#ef444330"}`, borderRadius: 4 }}>
                  <div style={{ fontSize: 9, color: t.hasEnoughTime ? "#22c55e" : "#ef4444", marginBottom: 2 }}>{t.hasEnoughTime ? "✓" : "⚠"} {t.travelMins}m needed</div>
                  <div style={{ fontSize: 9, color: "#475569", lineHeight: 1.4 }}>{t.from} → {t.to}</div>
                  <div style={{ fontSize: 9, color: t.hasEnoughTime ? "#64748b" : "#f59e0b", marginTop: 1 }}>{t.gapMins}m available</div>
                </div>
              ))}
            </div>
          )}

          {/* Free time (net of travel) */}
          <div style={{ marginTop: 12, borderTop: "1px solid #1e293b", paddingTop: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#475569", marginBottom: 8 }}>FREE TIME</div>
            {(() => {
              const sorted = [...events].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
              const gaps = [];
              for (let i = 0; i < sorted.length - 1; i++) {
                const gapMins = timeToMinutes(sorted[i + 1].startTime) - timeToMinutes(sorted[i].endTime);
                const travel  = getTravelTime(sorted[i].location, sorted[i + 1].location);
                if (gapMins >= 15) gaps.push({ start: sorted[i].endTime, end: sorted[i + 1].startTime, gapMins, travel, netFree: gapMins - travel });
              }
              if (!gaps.length) return <div style={{ fontSize: 10, color: "#475569" }}>None</div>;
              return gaps.map((g, i) => (
                <div key={i} style={{ marginBottom: 6, fontSize: 10 }}>
                  <span style={{ color: g.netFree > 0 ? "#f59e0b" : "#ef4444" }}>
                    {g.netFree > 0 ? `${g.netFree}m free` : `${Math.abs(g.netFree)}m short`}
                  </span>
                  {g.travel > 0 && <span style={{ color: "#334155", fontSize: 9 }}> (−{g.travel}m travel)</span>}
                  <br />
                  <span style={{ color: "#475569" }}>{formatDisplay(g.start)} – {formatDisplay(g.end)}</span>
                </div>
              ));
            })()}
          </div>

          {/* Groups mini */}
          {groups.length > 0 && (
            <div style={{ marginTop: 12, borderTop: "1px solid #1e293b", paddingTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#475569" }}>GROUPS</div>
                <button onClick={() => setShowGroupsPanel(true)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 9, ...mono, letterSpacing: "0.06em" }}>VIEW ALL</button>
              </div>
              {groups.map(g => (
                <div key={g.id} style={{ marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: g.color, boxShadow: `0 0 4px ${g.color}` }} />
                  <span style={{ fontSize: 10, color: "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                  <span style={{ fontSize: 9, color: "#334155" }}>{g.memberIds.length}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
