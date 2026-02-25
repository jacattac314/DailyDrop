import { useState, useRef, useCallback } from "react";

const INITIAL_EVENTS = [
  { id: 1, subject: "Workout + AI Podcast", startTime: "06:30", endTime: "07:15", description: "Strength + cardio while listening to AI/Quantum podcast", color: "#22c55e" },
  { id: 2, subject: "Daily Interview Drill", startTime: "07:15", endTime: "07:30", description: "1 STAR story rotation: Andretti, Bench-Q, CruTrade, Charter", color: "#f59e0b" },
  { id: 3, subject: "Job Search Ops", startTime: "07:30", endTime: "08:00", description: "Update Notion Recruiter CRM, send 5 recruiter messages, check LinkedIn roles", color: "#3b82f6" },
  { id: 4, subject: "Networking Events Calendar Build", startTime: "09:00", endTime: "10:30", description: "Build Chicago/St Louis event calendar, color code Cortex, 1871, CIC, STL AWS Chicago", color: "#8b5cf6" },
  { id: 5, subject: "Resume + LinkedIn Optimizer", startTime: "10:45", endTime: "12:15", description: "ATS benchmark resumes: AI TPM, Quantum PM, Security Integration PM versions in GitHub", color: "#ec4899" },
  { id: 6, subject: "Self-Updating Portfolio App Build", startTime: "13:30", endTime: "15:00", description: "Repo to Notion sync, roadmap auto research, architecture diagrams, recruiter demo", color: "#06b6d4" },
  { id: 7, subject: "Recruiter Outreach Automation Build", startTime: "15:00", endTime: "16:00", description: "n8n + Gmail + LinkedIn + Notion CRM workflow, 7-day follow-up templates", color: "#f97316" },
];

const START_HOUR = 6;
const END_HOUR = 17;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const SLOT_HEIGHT = 60; // px per hour

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

export default function DailyPlanner() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [dragging, setDragging] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const gridRef = useRef(null);
  const dragOffset = useRef(0);

  const getTopPercent = (startTime) => {
    const mins = timeToMinutes(startTime) - START_HOUR * 60;
    return (mins / (TOTAL_HOURS * 60)) * 100;
  };

  const getHeightPercent = (startTime, endTime) => {
    const dur = getDuration(startTime, endTime);
    return (dur / (TOTAL_HOURS * 60)) * 100;
  };

  const handleMouseDown = useCallback((e, id) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = e.clientY - rect.top;
    setDragging(id);
    setTooltip(null);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !gridRef.current) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    const relY = e.clientY - gridRect.top - dragOffset.current;
    const totalH = gridRect.height;
    const fraction = Math.max(0, Math.min(relY / totalH, 1));
    const totalMins = TOTAL_HOURS * 60;
    let snapMins = Math.round((fraction * totalMins) / 15) * 15;
    snapMins = Math.max(0, Math.min(snapMins, totalMins));

    setEvents(prev => prev.map(ev => {
      if (ev.id !== dragging) return ev;
      const dur = getDuration(ev.startTime, ev.endTime);
      const newStartMins = (START_HOUR * 60) + snapMins;
      const newEndMins = newStartMins + dur;
      if (newEndMins > END_HOUR * 60) return ev;
      return { ...ev, startTime: minutesToTime(newStartMins), endTime: minutesToTime(newEndMins) };
    }));
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        background: "#0a0a0f",
        minHeight: "100vh",
        color: "#e2e8f0",
        padding: "24px",
        userSelect: dragging ? "none" : "auto",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600&family=Space+Mono:wght@400;700&display=swap'); * { box-sizing: border-box; } ::-webkit-scrollbar { width: 4px; background: #1a1a2e; } ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 28, borderBottom: "1px solid #1e293b", paddingBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.25em", color: "#475569", marginBottom: 4 }}>
          DAILY OPS PLANNER
        </div>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700, color: "#f8fafc" }}>
          WED FEB 25, 2026
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
          {events.length} BLOCKS · {Math.round(events.reduce((a, e) => a + getDuration(e.startTime, e.endTime), 0) / 60 * 10) / 10}H SCHEDULED · DRAG TO RESCHEDULE
        </div>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        {/* Time labels */}
        <div style={{ width: 52, flexShrink: 0 }}>
          <div style={{ height: 0 }} />
          <div style={{ position: "relative", height: TOTAL_HOURS * SLOT_HEIGHT }}>
            {hours.map(h => (
              <div
                key={h}
                style={{
                  position: "absolute",
                  top: (h - START_HOUR) * SLOT_HEIGHT - 8,
                  right: 8,
                  fontSize: 10,
                  color: "#475569",
                  letterSpacing: "0.05em",
                }}
              >
                {h === 12 ? "12PM" : h > 12 ? `${h - 12}PM` : `${h}AM`}
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, position: "relative" }}>
          {/* Hour lines */}
          <div
            ref={gridRef}
            style={{
              position: "relative",
              height: TOTAL_HOURS * SLOT_HEIGHT,
              borderLeft: "2px solid #1e293b",
            }}
          >
            {hours.map(h => (
              <div
                key={h}
                style={{
                  position: "absolute",
                  top: (h - START_HOUR) * SLOT_HEIGHT,
                  left: 0,
                  right: 0,
                  borderTop: h === START_HOUR ? "none" : "1px solid #1e293b",
                  height: SLOT_HEIGHT,
                }}
              >
                {/* Half-hour tick */}
                <div style={{
                  position: "absolute",
                  top: SLOT_HEIGHT / 2,
                  left: 0,
                  right: 0,
                  borderTop: "1px dashed #111827",
                }} />
              </div>
            ))}

            {/* Current time indicator */}
            {(() => {
              const now = new Date();
              const nowMins = now.getHours() * 60 + now.getMinutes();
              const startMins = START_HOUR * 60;
              const endMins = END_HOUR * 60;
              if (nowMins < startMins || nowMins > endMins) return null;
              const pct = ((nowMins - startMins) / (TOTAL_HOURS * 60)) * 100;
              return (
                <div style={{
                  position: "absolute",
                  top: `${pct}%`,
                  left: -2,
                  right: 0,
                  height: 2,
                  background: "#ef4444",
                  zIndex: 10,
                  boxShadow: "0 0 8px #ef444488",
                }}>
                  <div style={{
                    position: "absolute",
                    left: -4,
                    top: -4,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#ef4444",
                    boxShadow: "0 0 8px #ef444488",
                  }} />
                </div>
              );
            })()}

            {/* Events */}
            {events.map(ev => {
              const top = getTopPercent(ev.startTime);
              const height = getHeightPercent(ev.startTime, ev.endTime);
              const isDrag = dragging === ev.id;
              const dur = getDuration(ev.startTime, ev.endTime);
              const isShort = dur <= 30;

              return (
                <div
                  key={ev.id}
                  onMouseDown={(e) => handleMouseDown(e, ev.id)}
                  onMouseEnter={() => !dragging && setTooltip(ev.id)}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    position: "absolute",
                    top: `${top}%`,
                    left: 8,
                    right: 8,
                    height: `${height}%`,
                    minHeight: 24,
                    background: `${ev.color}18`,
                    borderLeft: `3px solid ${ev.color}`,
                    borderTop: `1px solid ${ev.color}40`,
                    borderBottom: `1px solid ${ev.color}20`,
                    borderRight: `1px solid ${ev.color}20`,
                    borderRadius: "0 4px 4px 0",
                    padding: isShort ? "3px 8px" : "6px 10px",
                    cursor: isDrag ? "grabbing" : "grab",
                    zIndex: isDrag ? 100 : 5,
                    transition: isDrag ? "none" : "box-shadow 0.15s, transform 0.1s",
                    boxShadow: isDrag
                      ? `0 8px 32px ${ev.color}40, 0 0 0 1px ${ev.color}60`
                      : tooltip === ev.id
                      ? `0 4px 16px ${ev.color}30`
                      : "none",
                    transform: isDrag ? "scale(1.01)" : "scale(1)",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, height: "100%" }}>
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: ev.color,
                      flexShrink: 0,
                      marginTop: isShort ? 4 : 3,
                      boxShadow: `0 0 6px ${ev.color}`,
                    }} />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{
                        fontSize: isShort ? 11 : 12,
                        fontWeight: 600,
                        color: "#f1f5f9",
                        letterSpacing: "0.02em",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: 1.3,
                      }}>
                        {ev.subject}
                      </div>
                      {!isShort && (
                        <div style={{
                          fontSize: 10,
                          color: ev.color,
                          opacity: 0.85,
                          marginTop: 2,
                          letterSpacing: "0.05em",
                        }}>
                          {formatDisplay(ev.startTime)} → {formatDisplay(ev.endTime)} · {dur}m
                        </div>
                      )}
                      {!isShort && dur > 45 && (
                        <div style={{
                          fontSize: 10,
                          color: "#94a3b8",
                          marginTop: 4,
                          lineHeight: 1.5,
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}>
                          {ev.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tooltip */}
                  {tooltip === ev.id && !isDrag && (
                    <div style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      left: 0,
                      zIndex: 200,
                      background: "#0f172a",
                      border: `1px solid ${ev.color}50`,
                      borderRadius: 6,
                      padding: "10px 14px",
                      width: 260,
                      boxShadow: `0 8px 32px #00000080, 0 0 0 1px ${ev.color}20`,
                      pointerEvents: "none",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#f8fafc", marginBottom: 4 }}>
                        {ev.subject}
                      </div>
                      <div style={{ fontSize: 11, color: ev.color, marginBottom: 6, letterSpacing: "0.05em" }}>
                        {formatDisplay(ev.startTime)} — {formatDisplay(ev.endTime)} · {dur} min
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                        {ev.description}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar summary */}
        <div style={{ width: 180, flexShrink: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#475569", marginBottom: 12 }}>
            SCHEDULE
          </div>
          {[...events]
            .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
            .map(ev => (
              <div key={ev.id} style={{
                marginBottom: 8,
                padding: "6px 8px",
                borderLeft: `2px solid ${ev.color}`,
                background: "#0f172a",
                borderRadius: "0 4px 4px 0",
              }}>
                <div style={{ fontSize: 10, color: ev.color, letterSpacing: "0.05em" }}>
                  {formatDisplay(ev.startTime)}
                </div>
                <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 1, lineHeight: 1.3 }}>
                  {ev.subject}
                </div>
              </div>
            ))}

          {/* Gap detector */}
          <div style={{ marginTop: 16, borderTop: "1px solid #1e293b", paddingTop: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#475569", marginBottom: 8 }}>
              GAPS
            </div>
            {(() => {
              const sorted = [...events].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
              const gaps = [];
              for (let i = 0; i < sorted.length - 1; i++) {
                const endMins = timeToMinutes(sorted[i].endTime);
                const nextStartMins = timeToMinutes(sorted[i + 1].startTime);
                if (nextStartMins - endMins >= 15) {
                  gaps.push({ start: sorted[i].endTime, end: sorted[i + 1].startTime, dur: nextStartMins - endMins });
                }
              }
              if (!gaps.length) return <div style={{ fontSize: 10, color: "#475569" }}>No major gaps</div>;
              return gaps.map((g, i) => (
                <div key={i} style={{ marginBottom: 6, fontSize: 10, color: "#64748b" }}>
                  <span style={{ color: "#f59e0b" }}>{g.dur}m free</span>
                  <br />
                  {formatDisplay(g.start)} – {formatDisplay(g.end)}
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
