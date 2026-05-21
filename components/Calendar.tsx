"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Task, Owner } from "@/lib/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, getDaysInMonth, subMonths, addMonths, isToday, isSameMonth } from "date-fns";
import { tr } from "date-fns/locale";

const DIFF_LABELS = ["", "Kolay", "Normal", "Orta", "Zor", "Çok Zor"];
const DIFF_COLORS = ["", "#22c55e", "#84cc16", "#f59e0b", "#f97316", "#ef4444"];

type ViewUser = "emirali" | "idil" | "both";

// ─── Score Arc SVG ────────────────────────────────────────────────────────────
function ScoreArc({ score, max, color, name }: { score: number; max: number; color: string; name: string }) {
  const pct = max === 0 ? 0 : Math.min(score / max, 1);
  const r = 36; const cx = 48; const cy = 48;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ * 0.75;
  const gap = circ - dash;
  const offset = circ * 0.125;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a1a2e" strokeWidth="8" strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(135 48 48)" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={`${dash} ${gap + circ * 0.25}`} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(135 48 48)" style={{ transition: "stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)" }} />
        <text x="48" y="44" textAnchor="middle" fill="#f0eeff" fontSize="20" fontWeight="700" fontFamily="var(--font-display)">{score}</text>
        <text x="48" y="60" textAnchor="middle" fill="#666" fontSize="10" fontFamily="var(--font-body)">puan</text>
      </svg>
      <span style={{ color, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>{name}</span>
    </div>
  );
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────
function TaskModal({ date, defaultOwner, onSave, onClose }: {
  date: string; defaultOwner: Owner; onSave: (t: Omit<Task, "id" | "createdAt">) => void; onClose: () => void;
}) {
  const [owner, setOwner] = useState<Owner>(defaultOwner);
  const [title, setTitle] = useState("");
  const [diff, setDiff] = useState<1|2|3|4|5>(3);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  function submit() {
    if (!title.trim()) return;
    onSave({ date, owner, title: title.trim(), diff, done: false });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-5 relative" style={{ background: "#111118", border: "1px solid #222230" }} onClick={e => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700 }}>{date}</p>
            <p style={{ fontSize: 12, color: "#666" }}>Yeni task ekle</p>
          </div>
          <button onClick={onClose} style={{ color: "#666", fontSize: 20, lineHeight: 1, background: "none", border: "none", cursor: "pointer" }}>✕</button>
        </div>

        {/* owner toggle */}
        <div className="flex gap-2 mb-4">
          {(["emirali", "idil"] as Owner[]).map(o => (
            <button key={o} onClick={() => setOwner(o)}
              className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13,
                background: owner === o ? (o === "emirali" ? "#7C3AED" : "#059669") : "#1a1a26",
                color: owner === o ? "#fff" : "#555",
                border: "1px solid " + (owner === o ? "transparent" : "#222"),
                cursor: "pointer",
              }}>
              {o === "emirali" ? "Emirali" : "İdil"}
            </button>
          ))}
        </div>

        {/* title */}
        <input ref={inputRef} type="text" value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }}
          placeholder="Task adı..."
          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "#1a1a26", border: "1px solid #222", color: "#f0eeff", fontSize: 14, outline: "none", marginBottom: 16 }} />

        {/* difficulty */}
        <p style={{ fontSize: 11, color: "#555", marginBottom: 8, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>Zorluk / Puan</p>
        <div className="flex gap-2 mb-5">
          {([1,2,3,4,5] as const).map(n => (
            <button key={n} onClick={() => setDiff(n)}
              style={{
                flex: 1, height: 40, borderRadius: 10, fontSize: 14, fontWeight: 700,
                fontFamily: "var(--font-display)",
                background: diff === n ? DIFF_COLORS[n] : "#1a1a26",
                color: diff === n ? "#fff" : "#444",
                border: "1px solid " + (diff === n ? DIFF_COLORS[n] : "#222"),
                cursor: "pointer", transition: "all 0.15s",
              }}>{n}</button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#444", marginBottom: 16 }}>{DIFF_LABELS[diff]} — {diff} puan</p>

        <button onClick={submit}
          style={{
            width: "100%", padding: "13px", borderRadius: 12, fontSize: 14, fontWeight: 700,
            fontFamily: "var(--font-display)",
            background: owner === "emirali" ? "#7C3AED" : "#059669",
            color: "#fff", border: "none", cursor: "pointer",
          }}>Kaydet</button>
      </div>
    </div>
  );
}

// ─── Reset Confirm ────────────────────────────────────────────────────────────
function ResetConfirm({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="rounded-2xl p-6 text-center max-w-xs w-full" style={{ background: "#111118", border: "1px solid #2a1a1a" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Puanları sıfırla?</p>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>Tüm tasklar ve puanlar silinecek. Bu işlem geri alınamaz.</p>
        <div className="flex gap-3">
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 12, background: "#1a1a26", border: "1px solid #222", color: "#888", fontSize: 13, cursor: "pointer" }}>Vazgeç</button>
          <button onClick={() => { onConfirm(); onClose(); }}
            style={{ flex: 1, padding: "11px", borderRadius: 12, background: "#ef4444", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)", cursor: "pointer" }}>Sıfırla</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Calendar ────────────────────────────────────────────────────────────
export function Calendar() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewUser, setViewUser] = useState<ViewUser>("emirali");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "list">("month");
  const [addModal, setAddModal] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data: Task[] = await res.json();
      setTasks(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  async function addTask(t: Omit<Task, "id" | "createdAt">) {
    const task: Task = { ...t, id: Date.now().toString(), createdAt: Date.now() };
    setTasks(prev => [...prev, task]);
    await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(task) });
  }

  async function toggleTask(id: string) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated = { ...task, done: !task.done };
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    await fetch("/api/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, done: updated.done }) });
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    await fetch("/api/tasks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  }

  async function resetAll() {
    setTasks([]);
    await fetch("/api/tasks", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: "__RESET__" }) });
  }

  // Scores
  const scoreE = tasks.filter(t => t.owner === "emirali" && t.done).reduce((s, t) => s + t.diff, 0);
  const scoreI = tasks.filter(t => t.owner === "idil" && t.done).reduce((s, t) => s + t.diff, 0);
  const maxScore = Math.max(scoreE, scoreI, 1);
  const leader = scoreE > scoreI ? "emirali" : scoreI > scoreE ? "idil" : null;

  // Calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  let startDow = (getDay(monthStart) + 6) % 7;
  const prevDays = getDaysInMonth(subMonths(currentDate, 1));
  const prefixDays = Array.from({ length: startDow }, (_, i) => prevDays - startDow + 1 + i);
  const totalCells = Math.ceil((startDow + days.length) / 7) * 7;
  const suffixCount = totalCells - startDow - days.length;

  function tasksForDate(dateStr: string) {
    let t = tasks.filter(x => x.date === dateStr);
    if (viewUser !== "both") t = t.filter(x => x.owner === viewUser);
    return t;
  }

  const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const MONTHS_TR = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

  // List view tasks
  const listTasks = tasks
    .filter(t => {
      const [y, m] = t.date.split("-").map(Number);
      return y === currentDate.getFullYear() && m === currentDate.getMonth() + 1;
    })
    .filter(t => viewUser === "both" || t.owner === viewUser)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0a0f", padding: "0 0 40px 0" }}>
      {/* BG decoration */}
      <div style={{ position: "fixed", top: -200, left: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #7C3AED18, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: -100, right: -150, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #05966920, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>
        {/* ── Header ── */}
        <div style={{ paddingTop: 24, paddingBottom: 20 }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", color: "#444", textTransform: "uppercase", marginBottom: 4 }}>Rekabet Takvimi</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, lineHeight: 1.1, marginBottom: 20 }}>
            <span style={{ color: "#A78BFA" }}>Emirali</span>
            <span style={{ color: "#333" }}> vs </span>
            <span style={{ color: "#34D399" }}>İdil</span>
          </h1>

          {/* Score cards */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 16 }}>
            <ScoreArc score={scoreE} max={maxScore} color="#7C3AED" name="Emirali" />
            {/* Leader badge / draw */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {leader ? (
                <>
                  <div style={{ fontSize: 24 }}>👑</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, color: leader === "emirali" ? "#A78BFA" : "#34D399", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.1em" }}>Lider</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 22 }}>⚔️</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 10, color: "#444", textAlign: "center" }}>Berabere</div>
                </>
              )}
              <button onClick={() => setShowReset(true)}
                style={{ marginTop: 4, padding: "5px 10px", borderRadius: 8, background: "transparent", border: "1px solid #2a1a1a", color: "#ef444466", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                ↺ Sıfırla
              </button>
            </div>
            <ScoreArc score={scoreI} max={maxScore} color="#059669" name="İdil" />
          </div>

          {/* User tabs */}
          <div style={{ display: "flex", gap: 6, background: "#111118", borderRadius: 14, padding: 4, border: "1px solid #1a1a26" }}>
            {(["emirali", "idil", "both"] as const).map(u => (
              <button key={u} onClick={() => setViewUser(u)}
                style={{
                  flex: 1, padding: "8px 4px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                  fontFamily: "var(--font-display)",
                  background: viewUser === u
                    ? u === "emirali" ? "#7C3AED" : u === "idil" ? "#059669" : "#222"
                    : "transparent",
                  color: viewUser === u ? "#fff" : "#444",
                  border: "none", cursor: "pointer", transition: "all 0.2s",
                }}>
                {u === "emirali" ? "Emirali" : u === "idil" ? "İdil" : "İkisi"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Month Nav ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              style={{ width: 32, height: 32, borderRadius: 8, background: "#111118", border: "1px solid #1a1a26", color: "#888", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700 }}>
              {MONTHS_TR[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              style={{ width: 32, height: 32, borderRadius: 8, background: "#111118", border: "1px solid #1a1a26", color: "#888", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
          </div>
          <div style={{ display: "flex", gap: 4, background: "#111118", borderRadius: 10, padding: 3, border: "1px solid #1a1a26" }}>
            {(["month", "list"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, fontFamily: "var(--font-display)", background: view === v ? "#222" : "transparent", color: view === v ? "#f0eeff" : "#444", border: "none", cursor: "pointer", transition: "all 0.15s" }}>
                {v === "month" ? "Ay" : "Liste"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Month View ── */}
        {view === "month" && (
          <div>
            {/* Weekday headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 3 }}>
              {WEEKDAYS.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#333", fontWeight: 600, letterSpacing: "0.05em", padding: "4px 0", fontFamily: "var(--font-display)" }}>{d}</div>
              ))}
            </div>
            {/* Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
              {/* prev month days */}
              {prefixDays.map(d => (
                <div key={`p-${d}`} style={{ minHeight: 64, borderRadius: 10, background: "#0d0d14", border: "1px solid #111", padding: 4 }}>
                  <span style={{ fontSize: 11, color: "#222" }}>{d}</span>
                </div>
              ))}
              {/* current month days */}
              {days.map(day => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayTasks = tasksForDate(dateStr);
                const today = isToday(day);
                return (
                  <div key={dateStr} onClick={() => setAddModal(dateStr)}
                    style={{
                      minHeight: 64, borderRadius: 10, padding: 4, cursor: "pointer",
                      background: today ? "#130d1f" : "#0d0d14",
                      border: today ? "1px solid #7C3AED66" : "1px solid #111",
                      transition: "border-color 0.15s, background 0.15s",
                      WebkitTapHighlightColor: "transparent",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#222")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = today ? "#7C3AED66" : "#111")}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: today ? "#A78BFA" : "#444", marginBottom: 3, fontFamily: "var(--font-display)" }}>{day.getDate()}</div>
                    {dayTasks.slice(0, 2).map(t => (
                      <div key={t.id} style={{
                        fontSize: 9, padding: "1px 4px", borderRadius: 4, marginBottom: 2,
                        background: t.owner === "emirali" ? "#7C3AED22" : "#05966922",
                        color: t.owner === "emirali" ? "#A78BFA" : "#34D399",
                        display: "flex", alignItems: "center", gap: 3,
                        opacity: t.done ? 0.4 : 1,
                        textDecoration: t.done ? "line-through" : "none",
                        overflow: "hidden", whiteSpace: "nowrap",
                      }}>
                        {viewUser === "both" && (
                          <span style={{ fontSize: 8, fontWeight: 700, flexShrink: 0 }}>{t.owner === "emirali" ? "E" : "İ"}</span>
                        )}
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: DIFF_COLORS[t.diff], flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 2 && <div style={{ fontSize: 8, color: "#333" }}>+{dayTasks.length - 2}</div>}
                  </div>
                );
              })}
              {/* suffix */}
              {Array.from({ length: suffixCount }, (_, i) => (
                <div key={`s-${i}`} style={{ minHeight: 64, borderRadius: 10, background: "#0d0d14", border: "1px solid #111", padding: 4 }}>
                  <span style={{ fontSize: 11, color: "#222" }}>{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── List View ── */}
        {view === "list" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {loading && <div style={{ textAlign: "center", color: "#333", padding: 40 }}>Yükleniyor...</div>}
            {!loading && listTasks.length === 0 && (
              <div style={{ textAlign: "center", padding: 48, color: "#333" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                <p style={{ fontSize: 13 }}>Bu ay task yok</p>
              </div>
            )}
            {listTasks.map(t => (
              <div key={t.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                borderRadius: 14, background: "#0d0d14",
                border: "1px solid " + (t.done ? "#111" : t.owner === "emirali" ? "#7C3AED33" : "#05966933"),
                opacity: t.done ? 0.5 : 1, transition: "opacity 0.2s",
              }}>
                {/* check */}
                <button onClick={() => toggleTask(t.id)}
                  style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                    background: t.done ? (t.owner === "emirali" ? "#7C3AED" : "#059669") : "transparent",
                    border: "1.5px solid " + (t.done ? "transparent" : t.owner === "emirali" ? "#7C3AED44" : "#05966944"),
                    color: "#fff", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
                    WebkitTapHighlightColor: "transparent",
                  }}>
                  {t.done ? "✓" : ""}
                </button>
                {/* info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#444" : "#f0eeff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <span style={{
                      fontSize: 10, padding: "1px 6px", borderRadius: 20, fontWeight: 600, fontFamily: "var(--font-display)",
                      background: t.owner === "emirali" ? "#7C3AED22" : "#05966922",
                      color: t.owner === "emirali" ? "#A78BFA" : "#34D399",
                    }}>{t.owner === "emirali" ? "Emirali" : "İdil"}</span>
                    <span style={{ fontSize: 11, color: "#333" }}>{t.date}</span>
                  </div>
                </div>
                {/* diff badge */}
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, fontFamily: "var(--font-display)", background: DIFF_COLORS[t.diff] + "22", color: DIFF_COLORS[t.diff], flexShrink: 0 }}>{t.diff}★</span>
                {/* delete */}
                <button onClick={() => deleteTask(t.id)}
                  style={{ width: 28, height: 28, borderRadius: 8, background: "transparent", border: "1px solid #1a1a26", color: "#333", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, WebkitTapHighlightColor: "transparent" }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── FAB: add task for today ── */}
        <button onClick={() => setAddModal(format(new Date(), "yyyy-MM-dd"))}
          style={{
            position: "fixed", bottom: 24, right: 24, width: 52, height: 52, borderRadius: "50%",
            background: viewUser === "idil" ? "#059669" : "#7C3AED",
            border: "none", color: "#fff", fontSize: 24, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 0 6px ${viewUser === "idil" ? "#05966920" : "#7C3AED20"}`,
            transition: "transform 0.15s, background 0.2s",
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
          +
        </button>
      </div>

      {/* ── Modals ── */}
      {addModal && (
        <TaskModal
          date={addModal}
          defaultOwner={viewUser === "both" ? "emirali" : viewUser}
          onSave={addTask}
          onClose={() => setAddModal(null)}
        />
      )}
      {showReset && <ResetConfirm onConfirm={resetAll} onClose={() => setShowReset(false)} />}
    </div>
  );
}
