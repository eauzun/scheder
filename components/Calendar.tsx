"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Task, Owner } from "@/lib/types";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, getDaysInMonth, subMonths, addMonths,
} from "date-fns";

/* ── constants ─────────────────────────────────────────────── */
const DIFF_LABELS = ["","Kolay","Normal","Orta","Zor","Çok Zor"];
const DIFF_COLORS = ["","#22c55e","#84cc16","#f59e0b","#f97316","#ef4444"];
const MONTHS_TR   = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
                     "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const WEEKDAYS    = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];

/* avatars – inline SVG emoji-style */
const AVATARS: Record<Owner, React.FC<{size?:number}>> = {
  emirali: ({ size=40 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#2d1b4e"/>
      {/* gorilla face */}
      <ellipse cx="50" cy="58" rx="28" ry="26" fill="#1a1a1a"/>
      <ellipse cx="50" cy="72" rx="18" ry="12" fill="#2a2a2a"/>
      {/* ears */}
      <ellipse cx="22" cy="52" rx="9" ry="11" fill="#1a1a1a"/>
      <ellipse cx="78" cy="52" rx="9" ry="11" fill="#1a1a1a"/>
      <ellipse cx="22" cy="52" rx="5" ry="7" fill="#3a2a2a"/>
      <ellipse cx="78" cy="52" rx="5" ry="7" fill="#3a2a2a"/>
      {/* brow */}
      <rect x="28" y="42" width="44" height="7" rx="4" fill="#111"/>
      {/* eyes */}
      <circle cx="38" cy="53" r="6" fill="#fff"/>
      <circle cx="62" cy="53" r="6" fill="#fff"/>
      <circle cx="39" cy="54" r="3.5" fill="#222"/>
      <circle cx="63" cy="54" r="3.5" fill="#222"/>
      <circle cx="40" cy="53" r="1.2" fill="#fff"/>
      <circle cx="64" cy="53" r="1.2" fill="#fff"/>
      {/* nose */}
      <ellipse cx="50" cy="63" rx="9" ry="6" fill="#333"/>
      <circle cx="46" cy="63" r="3" fill="#222"/>
      <circle cx="54" cy="63" r="3" fill="#222"/>
      {/* mouth */}
      <path d="M38 74 Q50 82 62 74" stroke="#555" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  idil: ({ size=40 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="50" fill="#1a2e1a"/>
      {/* poppy flower - gelincik */}
      {/* leaves */}
      <ellipse cx="30" cy="72" rx="14" ry="7" fill="#2d7a2d" transform="rotate(-30 30 72)"/>
      <ellipse cx="70" cy="72" rx="14" ry="7" fill="#2d7a2d" transform="rotate(30 70 72)"/>
      <ellipse cx="50" cy="80" rx="10" ry="6" fill="#2d7a2d"/>
      {/* stem */}
      <line x1="50" y1="65" x2="50" y2="82" stroke="#2d7a2d" strokeWidth="3" strokeLinecap="round"/>
      {/* petals */}
      <ellipse cx="50" cy="33" rx="12" ry="18" fill="#e53935" opacity="0.95"/>
      <ellipse cx="50" cy="33" rx="12" ry="18" fill="#e53935" opacity="0.95" transform="rotate(60 50 50)"/>
      <ellipse cx="50" cy="33" rx="12" ry="18" fill="#e53935" opacity="0.95" transform="rotate(120 50 50)"/>
      <ellipse cx="50" cy="33" rx="12" ry="18" fill="#c62828" opacity="0.6" transform="rotate(30 50 50)"/>
      <ellipse cx="50" cy="33" rx="12" ry="18" fill="#c62828" opacity="0.6" transform="rotate(90 50 50)"/>
      <ellipse cx="50" cy="33" rx="12" ry="18" fill="#c62828" opacity="0.6" transform="rotate(150 50 50)"/>
      {/* center */}
      <circle cx="50" cy="50" r="11" fill="#1a1a1a"/>
      <circle cx="50" cy="50" r="8"  fill="#222"/>
      {/* stamen dots */}
      {[0,45,90,135,180,225,270,315].map((a,i)=>(
        <circle key={i}
          cx={50+7*Math.cos(a*Math.PI/180)}
          cy={50+7*Math.sin(a*Math.PI/180)}
          r="1.5" fill="#ffcc00"/>
      ))}
      <circle cx="50" cy="50" r="3" fill="#111"/>
    </svg>
  ),
};

/* ── helpers ────────────────────────────────────────────────── */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function canComplete(task: Task) { return task.date === todayStr(); }
function isPastDate(dateStr: string) { return dateStr < todayStr(); }

type ViewUser = "emirali" | "idil" | "both";

/* ── ScoreArc ───────────────────────────────────────────────── */
function ScoreArc({ score, max, color, owner }: {
  score: number; max: number; color: string; owner: Owner;
}) {
  const Avatar = AVATARS[owner];
  const pct   = max === 0 ? 0 : Math.min(Math.max(score,0)/max,1);
  const r=36; const cx=52; const cy=52;
  const circ  = 2*Math.PI*r;
  const dash  = pct*circ*0.75;
  const neg   = score < 0;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <div style={{ position:"relative", width:104, height:104 }}>
        <svg width="104" height="104" viewBox="0 0 104 104" style={{ position:"absolute", inset:0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a1a2e" strokeWidth="7"
            strokeDasharray={`${circ*0.75} ${circ*0.25}`} strokeDashoffset={circ*0.125}
            strokeLinecap="round" transform="rotate(135 52 52)"/>
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke={neg?"#ef4444":color} strokeWidth="7"
            strokeDasharray={`${neg?circ*0.75:dash} ${neg?0:circ-dash+circ*0.25}`}
            strokeDashoffset={circ*0.125} strokeLinecap="round" transform="rotate(135 52 52)"
            style={{ transition:"stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)" }}/>
        </svg>
        {/* avatar circle */}
        <div style={{
          position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%,-54%)",
          width:52, height:52, borderRadius:"50%",
          overflow:"hidden", border:`2px solid ${color}44`,
          background:"#0d0d14",
        }}>
          <Avatar size={52}/>
        </div>
        {/* score badge */}
        <div style={{
          position:"absolute", bottom:4, left:"50%", transform:"translateX(-50%)",
          background:neg?"#ef444422":color+"22",
          border:`1px solid ${neg?"#ef444444":color+"44"}`,
          borderRadius:20, padding:"2px 10px",
          fontFamily:"var(--font-display)", fontSize:13, fontWeight:700,
          color: neg?"#ef4444":color, whiteSpace:"nowrap",
        }}>{score > 0 ? "+" : ""}{score}</div>
      </div>
      <span style={{ fontFamily:"var(--font-display)", fontSize:12, fontWeight:600, color }}>
        {owner === "emirali" ? "Emirali" : "İdil"}
      </span>
    </div>
  );
}

/* ── Task Detail Modal ──────────────────────────────────────── */
function TaskDetailModal({ task, onToggle, onDelete, onClose }: {
  task: Task; onToggle:()=>void; onDelete:()=>void; onClose:()=>void;
}) {
  const isE    = task.owner === "emirali";
  const color  = isE ? "#7C3AED" : "#059669";
  const canDo  = canComplete(task);
  const past   = isPastDate(task.date);
  const Avatar = AVATARS[task.owner];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"flex-end",
      justifyContent:"center", padding:"0 0 0 0",
      background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)" }} onClick={onClose}>
      <div style={{ width:"100%", maxWidth:480, borderRadius:"20px 20px 0 0", padding:"20px 20px 36px",
        background:"#111118", borderTop:"1px solid #222230" }} onClick={e=>e.stopPropagation()}>

        {/* drag handle */}
        <div style={{ width:36, height:4, borderRadius:2, background:"#222", margin:"0 auto 20px" }}/>

        {/* header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <div style={{ width:44, height:44, borderRadius:"50%", overflow:"hidden",
            border:`2px solid ${color}44`, flexShrink:0 }}>
            <Avatar size={44}/>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"var(--font-display)", fontSize:17, fontWeight:700,
              color:"#f0eeff", lineHeight:1.2,
              textDecoration: task.done?"line-through":"none" }}>{task.title}</p>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4 }}>
              <span style={{ fontSize:11, color, fontWeight:600, fontFamily:"var(--font-display)" }}>
                {isE?"Emirali":"İdil"}
              </span>
              <span style={{ fontSize:11, color:"#333" }}>·</span>
              <span style={{ fontSize:11, color:"#444" }}>{task.date}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ color:"#333", fontSize:20, background:"none",
            border:"none", cursor:"pointer", lineHeight:1, flexShrink:0 }}>✕</button>
        </div>

        {/* diff + status badges */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
          <span style={{ fontSize:12, padding:"4px 12px", borderRadius:20, fontWeight:700,
            fontFamily:"var(--font-display)",
            background:DIFF_COLORS[task.diff]+"22", color:DIFF_COLORS[task.diff] }}>
            {task.diff}★ {DIFF_LABELS[task.diff]}
          </span>
          {task.done && (
            <span style={{ fontSize:12, padding:"4px 12px", borderRadius:20, fontWeight:700,
              background:color+"22", color }}>+{task.diff} kazanıldı ✓</span>
          )}
          {task.penaltyApplied && (
            <span style={{ fontSize:12, padding:"4px 12px", borderRadius:20, fontWeight:700,
              background:"#ef444422", color:"#ef4444" }}>-{task.diff} ceza ✗</span>
          )}
        </div>

        {/* info banner */}
        {!task.done && !task.penaltyApplied && (
          canDo ? (
            <div style={{ padding:"10px 14px", borderRadius:12, background:"#7C3AED18",
              border:"1px solid #7C3AED33", marginBottom:16 }}>
              <p style={{ fontSize:12, color:"#A78BFA" }}>
                📅 Bugün <strong>{task.date}</strong> — tamamlayabilirsin
              </p>
            </div>
          ) : past ? (
            <div style={{ padding:"10px 14px", borderRadius:12, background:"#ef444411",
              border:"1px solid #ef444433", marginBottom:16 }}>
              <p style={{ fontSize:12, color:"#ef4444" }}>
                ⚠️ Tarih geçti — gece yarısı -{task.diff} puan ceza uygulanacak
              </p>
            </div>
          ) : (
            <div style={{ padding:"10px 14px", borderRadius:12, background:"#1a1a26",
              border:"1px solid #222", marginBottom:16 }}>
              <p style={{ fontSize:12, color:"#555" }}>
                🔒 Bu task <strong>{task.date}</strong> tarihinde tamamlanabilir
              </p>
            </div>
          )
        )}

        {/* actions */}
        <div style={{ display:"flex", gap:10 }}>
          <button
            onClick={() => { if(canDo||task.done){ onToggle(); onClose(); } }}
            disabled={!canDo && !task.done}
            style={{
              flex:1, padding:"13px", borderRadius:14, fontSize:14, fontWeight:700,
              fontFamily:"var(--font-display)",
              background: task.done ? "#1a1a26" : canDo ? color : "#111",
              color: task.done ? "#666" : canDo ? "#fff" : "#333",
              border: task.done ? "1px solid #222" : "none",
              cursor: (canDo||task.done) ? "pointer" : "not-allowed",
              opacity: (!canDo&&!task.done) ? 0.4 : 1,
            }}>
            {task.done ? "↩ Geri Al" : canDo ? "✓ Tamamla" : "🔒 Bugün değil"}
          </button>
          <button onClick={() => { onDelete(); onClose(); }}
            style={{ width:48, height:48, borderRadius:14, background:"transparent",
              border:"1px solid #2a1515", color:"#ef444455", fontSize:18, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center" }}>🗑</button>
        </div>
      </div>
    </div>
  );
}

/* ── Add Task Modal ─────────────────────────────────────────── */
function AddTaskModal({ date, defaultOwner, onSave, onClose }: {
  date: string; defaultOwner: Owner;
  onSave: (t:Omit<Task,"id"|"createdAt">)=>void; onClose:()=>void;
}) {
  const [owner, setOwner] = useState<Owner>(defaultOwner);
  const [title, setTitle] = useState("");
  const [diff,  setDiff]  = useState<1|2|3|4|5>(3);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(()=>{ setTimeout(()=>inputRef.current?.focus(),80); },[]);

  function submit() {
    if(!title.trim()) return;
    onSave({ date, owner, title:title.trim(), diff, done:false });
    onClose();
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"flex-end",
      justifyContent:"center", background:"rgba(0,0,0,0.75)", backdropFilter:"blur(6px)" }}
      onClick={onClose}>
      <div style={{ width:"100%", maxWidth:480, borderRadius:"20px 20px 0 0", padding:"20px 20px 40px",
        background:"#111118", borderTop:"1px solid #222230" }} onClick={e=>e.stopPropagation()}>

        <div style={{ width:36, height:4, borderRadius:2, background:"#222", margin:"0 auto 20px" }}/>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <p style={{ fontFamily:"var(--font-display)", fontSize:17, fontWeight:700 }}>{date}</p>
            <p style={{ fontSize:12, color:"#444" }}>Yeni task</p>
          </div>
          <button onClick={onClose} style={{ color:"#444", fontSize:20, background:"none", border:"none", cursor:"pointer" }}>✕</button>
        </div>

        {/* owner selector with avatars */}
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          {(["emirali","idil"] as Owner[]).map(o => {
            const Av = AVATARS[o];
            const col = o==="emirali"?"#7C3AED":"#059669";
            return (
              <button key={o} onClick={()=>setOwner(o)} style={{
                flex:1, padding:"10px 8px", borderRadius:14, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                background: owner===o ? col+"22" : "#1a1a26",
                border:"1px solid "+(owner===o ? col+"66" : "#222"),
                transition:"all 0.15s",
              }}>
                <div style={{ width:28, height:28, borderRadius:"50%", overflow:"hidden",
                  flexShrink:0, border:`1.5px solid ${col}44` }}>
                  <Av size={28}/>
                </div>
                <span style={{ fontFamily:"var(--font-display)", fontSize:13, fontWeight:600,
                  color: owner===o ? col : "#555" }}>
                  {o==="emirali"?"Emirali":"İdil"}
                </span>
              </button>
            );
          })}
        </div>

        <input ref={inputRef} type="text" value={title}
          onChange={e=>setTitle(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") submit(); if(e.key==="Escape") onClose(); }}
          placeholder="Task adı..."
          style={{ width:"100%", padding:"12px 14px", borderRadius:12,
            background:"#1a1a26", border:"1px solid #222", color:"#f0eeff",
            fontSize:14, outline:"none", marginBottom:14 }}/>

        <p style={{ fontSize:10, color:"#333", marginBottom:8, fontWeight:600,
          letterSpacing:"0.1em", textTransform:"uppercase" }}>Zorluk / Puan</p>
        <div style={{ display:"flex", gap:6, marginBottom:8 }}>
          {([1,2,3,4,5] as const).map(n=>(
            <button key={n} onClick={()=>setDiff(n)} style={{
              flex:1, height:44, borderRadius:10, fontSize:15, fontWeight:700,
              fontFamily:"var(--font-display)", cursor:"pointer", transition:"all 0.15s",
              background: diff===n ? DIFF_COLORS[n] : "#1a1a26",
              color: diff===n ? "#fff" : "#444",
              border:"1px solid "+(diff===n ? DIFF_COLORS[n] : "#222"),
            }}>{n}</button>
          ))}
        </div>
        <p style={{ fontSize:11, color:"#444", marginBottom:20 }}>{DIFF_LABELS[diff]} — {diff} puan</p>

        <button onClick={submit} style={{
          width:"100%", padding:"14px", borderRadius:14, fontSize:14, fontWeight:700,
          fontFamily:"var(--font-display)", cursor:"pointer",
          background: owner==="emirali" ? "#7C3AED" : "#059669", color:"#fff", border:"none",
        }}>Kaydet</button>
      </div>
    </div>
  );
}

/* ── Reset Confirm ──────────────────────────────────────────── */
function ResetConfirm({ onConfirm, onClose }: { onConfirm:()=>void; onClose:()=>void }) {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center",
      justifyContent:"center", padding:16,
      background:"rgba(0,0,0,0.8)", backdropFilter:"blur(6px)" }} onClick={onClose}>
      <div style={{ borderRadius:20, padding:28, textAlign:"center", maxWidth:300, width:"100%",
        background:"#111118", border:"1px solid #2a1a1a" }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
        <p style={{ fontFamily:"var(--font-display)", fontSize:17, fontWeight:700, marginBottom:8 }}>Sıfırla?</p>
        <p style={{ fontSize:13, color:"#555", marginBottom:24, lineHeight:1.6 }}>
          Tüm tasklar ve puanlar silinecek.<br/>Geri alınamaz.
        </p>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"12px", borderRadius:12,
            background:"#1a1a26", border:"1px solid #222", color:"#777", fontSize:13, cursor:"pointer" }}>
            Vazgeç
          </button>
          <button onClick={()=>{ onConfirm(); onClose(); }} style={{
            flex:1, padding:"12px", borderRadius:12, background:"#ef4444",
            border:"none", color:"#fff", fontSize:13, fontWeight:700,
            fontFamily:"var(--font-display)", cursor:"pointer" }}>Sıfırla</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Calendar ──────────────────────────────────────────── */
export function Calendar() {
  const [tasks,       setTasks]       = useState<Task[]>([]);
  const [viewUser,    setViewUser]    = useState<ViewUser>("emirali");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view,        setView]        = useState<"month"|"list">("month");
  const [addModal,    setAddModal]    = useState<string|null>(null);
  const [detailTask,  setDetailTask]  = useState<Task|null>(null);
  const [showReset,   setShowReset]   = useState(false);
  const [loading,     setLoading]     = useState(true);
  const today = todayStr();

  const fetchTasks = useCallback(async () => {
    try { const r = await fetch("/api/tasks"); setTasks(await r.json()); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(()=>{ fetchTasks(); },[fetchTasks]);

  // PWA service worker
  useEffect(()=>{
    if("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(()=>{});
  },[]);

  /* API helpers */
  async function addTask(t: Omit<Task,"id"|"createdAt">) {
    const task: Task = { ...t, id:Date.now().toString(), createdAt:Date.now() };
    setTasks(p=>[...p,task]);
    await fetch("/api/tasks",{ method:"POST",
      headers:{"Content-Type":"application/json"}, body:JSON.stringify(task) });
  }

  async function toggleTask(id: string) {
    const task = tasks.find(t=>t.id===id);
    if(!task) return;
    if(!canComplete(task) && !task.done) return; // only today or undo
    const updated = { ...task, done:!task.done };
    setTasks(p=>p.map(t=>t.id===id?updated:t));
    await fetch("/api/tasks",{ method:"PATCH",
      headers:{"Content-Type":"application/json"}, body:JSON.stringify({id,done:updated.done}) });
  }

  async function deleteTask(id: string) {
    setTasks(p=>p.filter(t=>t.id!==id));
    await fetch("/api/tasks",{ method:"DELETE",
      headers:{"Content-Type":"application/json"}, body:JSON.stringify({id}) });
  }

  async function resetAll() {
    setTasks([]);
    await fetch("/api/tasks",{ method:"DELETE",
      headers:{"Content-Type":"application/json"}, body:JSON.stringify({id:"__RESET__"}) });
  }

  /* scores */
  function calcScore(owner: Owner) {
    return tasks.filter(t=>t.owner===owner).reduce((s,t)=>{
      if(t.done) return s+t.diff;
      if(t.penaltyApplied) return s-t.diff;
      return s;
    },0);
  }
  const scoreE  = calcScore("emirali");
  const scoreI  = calcScore("idil");
  const maxScr  = Math.max(Math.abs(scoreE),Math.abs(scoreI),1);
  const leader  = scoreE>scoreI?"emirali":scoreI>scoreE?"idil":null;

  /* calendar grid */
  const monthStart  = startOfMonth(currentDate);
  const days        = eachDayOfInterval({ start:monthStart, end:endOfMonth(currentDate) });
  const startDow    = (getDay(monthStart)+6)%7;
  const prevDays    = getDaysInMonth(subMonths(currentDate,1));
  const prefixDays  = Array.from({length:startDow},(_,i)=>prevDays-startDow+1+i);
  const totalCells  = Math.ceil((startDow+days.length)/7)*7;
  const suffixCount = totalCells-startDow-days.length;

  function tasksForDate(dateStr:string) {
    let t = tasks.filter(x=>x.date===dateStr);
    if(viewUser!=="both") t=t.filter(x=>x.owner===viewUser);
    return t;
  }

  const listTasks = tasks
    .filter(t=>{ const[y,m]=t.date.split("-").map(Number);
      return y===currentDate.getFullYear()&&m===currentDate.getMonth()+1; })
    .filter(t=>viewUser==="both"||t.owner===viewUser)
    .sort((a,b)=>a.date.localeCompare(b.date));

  /* ── render ── */
  return (
    <div style={{ minHeight:"100dvh", background:"#0a0a0f", paddingBottom:80 }}>
      {/* bg glows */}
      <div style={{ position:"fixed",top:-200,left:-200,width:500,height:500,borderRadius:"50%",
        background:"radial-gradient(circle,#7C3AED18,transparent 70%)",pointerEvents:"none",zIndex:0 }}/>
      <div style={{ position:"fixed",top:-100,right:-150,width:400,height:400,borderRadius:"50%",
        background:"radial-gradient(circle,#05966920,transparent 70%)",pointerEvents:"none",zIndex:0 }}/>

      <div style={{ position:"relative",zIndex:1,maxWidth:480,margin:"0 auto",padding:"0 16px" }}>

        {/* ── HEADER ── */}
        <div style={{ paddingTop:28,paddingBottom:20 }}>
          <p style={{ fontFamily:"var(--font-display)",fontSize:10,fontWeight:600,
            letterSpacing:"0.18em",color:"#2a2a3a",textTransform:"uppercase",marginBottom:4 }}>
            Rekabet Takvimi
          </p>

          {/* scores */}
          <div style={{ display:"flex",gap:8,justifyContent:"center",alignItems:"center",marginBottom:20 }}>
            <ScoreArc score={scoreE} max={maxScr} color="#7C3AED" owner="emirali"/>
            {/* center */}
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6,flex:"0 0 60px" }}>
              {leader ? (
                <>
                  <span style={{ fontSize:26 }}>👑</span>
                  <span style={{ fontFamily:"var(--font-display)",fontSize:9,fontWeight:700,
                    color:leader==="emirali"?"#A78BFA":"#34D399",
                    textTransform:"uppercase",letterSpacing:"0.1em",textAlign:"center" }}>Lider</span>
                </>
              ):(
                <>
                  <span style={{ fontSize:22 }}>⚔️</span>
                  <span style={{ fontFamily:"var(--font-display)",fontSize:9,color:"#2a2a3a",textAlign:"center" }}>
                    Berabere
                  </span>
                </>
              )}
              <button onClick={()=>setShowReset(true)} style={{ marginTop:4,padding:"4px 8px",
                borderRadius:8,background:"transparent",border:"1px solid #2a1a1a",
                color:"#ef444444",fontSize:10,cursor:"pointer",whiteSpace:"nowrap" }}>
                ↺ Sıfırla
              </button>
            </div>
            <ScoreArc score={scoreI} max={maxScr} color="#059669" owner="idil"/>
          </div>

          {/* user tabs */}
          <div style={{ display:"flex",gap:5,background:"#111118",borderRadius:14,
            padding:4,border:"1px solid #1a1a26" }}>
            {(["emirali","idil","both"] as const).map(u=>{
              const col = u==="emirali"?"#7C3AED":u==="idil"?"#059669":"#555";
              const Av  = u!=="both" ? AVATARS[u] : null;
              return (
                <button key={u} onClick={()=>setViewUser(u)} style={{
                  flex:1,padding:"7px 4px",borderRadius:10,border:"none",cursor:"pointer",
                  transition:"all 0.2s",display:"flex",alignItems:"center",
                  justifyContent:"center",gap:5,
                  background:viewUser===u?(u==="emirali"?"#7C3AED22":u==="idil"?"#05966922":"#222"):"transparent",
                  boxShadow:viewUser===u?`0 0 0 1px ${col}44`:"none",
                }}>
                  {Av && (
                    <div style={{ width:20,height:20,borderRadius:"50%",overflow:"hidden",flexShrink:0 }}>
                      <Av size={20}/>
                    </div>
                  )}
                  <span style={{ fontFamily:"var(--font-display)",fontSize:12,fontWeight:600,
                    color:viewUser===u?col:"#444" }}>
                    {u==="emirali"?"Emirali":u==="idil"?"İdil":"İkisi"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── NAV ── */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <button onClick={()=>setCurrentDate(subMonths(currentDate,1))}
              style={{ width:32,height:32,borderRadius:8,background:"#111118",
                border:"1px solid #1a1a26",color:"#888",fontSize:16,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center" }}>‹</button>
            <span style={{ fontFamily:"var(--font-display)",fontSize:15,fontWeight:700 }}>
              {MONTHS_TR[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={()=>setCurrentDate(addMonths(currentDate,1))}
              style={{ width:32,height:32,borderRadius:8,background:"#111118",
                border:"1px solid #1a1a26",color:"#888",fontSize:16,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center" }}>›</button>
          </div>
          <div style={{ display:"flex",gap:3,background:"#111118",borderRadius:10,
            padding:3,border:"1px solid #1a1a26" }}>
            {(["month","list"] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{
                padding:"5px 12px",borderRadius:7,fontSize:11,fontWeight:600,
                fontFamily:"var(--font-display)",border:"none",cursor:"pointer",
                background:view===v?"#222":"transparent",
                color:view===v?"#f0eeff":"#444",
              }}>{v==="month"?"Ay":"Liste"}</button>
            ))}
          </div>
        </div>

        {/* ── MONTH VIEW ── */}
        {view==="month" && (
          <div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:3 }}>
              {WEEKDAYS.map(d=>(
                <div key={d} style={{ textAlign:"center",fontSize:10,color:"#2a2a3a",
                  fontWeight:600,padding:"4px 0",fontFamily:"var(--font-display)" }}>{d}</div>
              ))}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3 }}>
              {prefixDays.map(d=>(
                <div key={`p${d}`} style={{ minHeight:62,borderRadius:10,
                  background:"#0a0a12",border:"1px solid #0f0f1a",padding:4 }}>
                  <span style={{ fontSize:11,color:"#181820" }}>{d}</span>
                </div>
              ))}
              {days.map(day=>{
                const dateStr   = format(day,"yyyy-MM-dd");
                const dayTasks  = tasksForDate(dateStr);
                const isT       = dateStr===today;
                const isPast_   = dateStr<today;
                const hasPenalty= dayTasks.some(t=>t.penaltyApplied);
                const allDone   = dayTasks.length>0 && dayTasks.every(t=>t.done);
                return (
                  <div key={dateStr} onClick={()=>setAddModal(dateStr)}
                    style={{
                      minHeight:62,borderRadius:10,padding:4,cursor:"pointer",
                      background: isT?"#130d1f":isPast_?"#0a0a11":"#0d0d14",
                      border: isT?"1px solid #7C3AED66"
                        :hasPenalty?"1px solid #ef444430"
                        :allDone?"1px solid #22c55e22"
                        :"1px solid #111",
                      WebkitTapHighlightColor:"transparent",
                      opacity:isPast_&&!isT?0.8:1,
                    }}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor="#333")}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor=
                      isT?"#7C3AED66":hasPenalty?"#ef444430":allDone?"#22c55e22":"#111")}>
                    <div style={{ fontSize:11,fontWeight:600,marginBottom:2,
                      fontFamily:"var(--font-display)",
                      color:isT?"#A78BFA":isPast_?"#2a2a3a":"#363646" }}>{day.getDate()}</div>
                    {dayTasks.slice(0,2).map(t=>(
                      <div key={t.id}
                        onClick={e=>{ e.stopPropagation(); setDetailTask(t); }}
                        style={{
                          fontSize:9,padding:"2px 4px",borderRadius:4,marginBottom:2,
                          background:t.penaltyApplied?"#ef444418":t.owner==="emirali"?"#7C3AED22":"#05966922",
                          color:t.penaltyApplied?"#ef4444":t.owner==="emirali"?"#A78BFA":"#34D399",
                          display:"flex",alignItems:"center",gap:3,
                          opacity:t.done?0.4:1,
                          textDecoration:t.done?"line-through":"none",
                          overflow:"hidden",whiteSpace:"nowrap",
                        }}>
                        {viewUser==="both"&&(
                          <span style={{ fontSize:8,fontWeight:700,flexShrink:0 }}>
                            {t.owner==="emirali"?"E":"İ"}
                          </span>
                        )}
                        <span style={{ width:5,height:5,borderRadius:"50%",
                          background:t.penaltyApplied?"#ef4444":DIFF_COLORS[t.diff],flexShrink:0 }}/>
                        <span style={{ overflow:"hidden",textOverflow:"ellipsis" }}>{t.title}</span>
                      </div>
                    ))}
                    {dayTasks.length>2&&(
                      <div style={{ fontSize:8,color:"#2a2a3a" }}>+{dayTasks.length-2}</div>
                    )}
                  </div>
                );
              })}
              {Array.from({length:suffixCount},(_,i)=>(
                <div key={`s${i}`} style={{ minHeight:62,borderRadius:10,
                  background:"#0a0a12",border:"1px solid #0f0f1a",padding:4 }}>
                  <span style={{ fontSize:11,color:"#181820" }}>{i+1}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {view==="list" && (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {loading&&<div style={{ textAlign:"center",color:"#333",padding:40 }}>Yükleniyor...</div>}
            {!loading&&listTasks.length===0&&(
              <div style={{ textAlign:"center",padding:48,color:"#333" }}>
                <div style={{ fontSize:32,marginBottom:8 }}>📅</div>
                <p style={{ fontSize:13 }}>Bu ay task yok</p>
              </div>
            )}
            {listTasks.map(t=>{
              const col    = t.owner==="emirali"?"#7C3AED":"#059669";
              const canDo  = canComplete(t);
              const past_  = isPastDate(t.date);
              const Av     = AVATARS[t.owner];
              return (
                <div key={t.id}
                  onClick={()=>setDetailTask(t)}
                  style={{
                    display:"flex",alignItems:"center",gap:10,padding:"12px 14px",
                    borderRadius:14,cursor:"pointer",
                    background:t.penaltyApplied?"#150a0a":"#0d0d14",
                    border:"1px solid "+(t.penaltyApplied?"#ef444430":t.done?"#111":past_?"#1a1010":col+"30"),
                    transition:"background 0.15s",
                  }}>
                  {/* avatar */}
                  <div style={{ width:34,height:34,borderRadius:"50%",overflow:"hidden",
                    flexShrink:0,border:`1.5px solid ${col}33`,opacity:t.done?0.4:1 }}>
                    <Av size={34}/>
                  </div>
                  {/* info */}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:500,overflow:"hidden",
                      textOverflow:"ellipsis",whiteSpace:"nowrap",
                      textDecoration:t.done?"line-through":"none",
                      color:t.done?"#444":t.penaltyApplied?"#ef4444":"#f0eeff" }}>{t.title}</div>
                    <div style={{ display:"flex",alignItems:"center",gap:5,marginTop:2 }}>
                      <span style={{ fontSize:10,color:col,fontWeight:600,
                        fontFamily:"var(--font-display)" }}>
                        {t.owner==="emirali"?"Emirali":"İdil"}
                      </span>
                      <span style={{ fontSize:10,color:"#2a2a3a" }}>{t.date}</span>
                      {t.done&&<span style={{ fontSize:10,color:col,fontWeight:700 }}>+{t.diff}✓</span>}
                      {t.penaltyApplied&&<span style={{ fontSize:10,color:"#ef4444",fontWeight:700 }}>-{t.diff}✗</span>}
                      {!t.done&&!t.penaltyApplied&&canDo&&(
                        <span style={{ fontSize:10,color:"#A78BFA",fontWeight:600 }}>← bugün!</span>
                      )}
                    </div>
                  </div>
                  {/* diff */}
                  <span style={{ fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:700,
                    fontFamily:"var(--font-display)",flexShrink:0,
                    background:DIFF_COLORS[t.diff]+"22",color:DIFF_COLORS[t.diff] }}>{t.diff}★</span>
                  {/* quick complete */}
                  <button
                    onClick={e=>{ e.stopPropagation(); if(canDo||t.done) toggleTask(t.id); }}
                    title={canDo?"Tamamla":t.done?"Geri al":"Sadece bugün"}
                    style={{
                      width:32,height:32,borderRadius:"50%",flexShrink:0,
                      cursor:(canDo||t.done)?"pointer":"not-allowed",
                      background:t.done?col:"transparent",
                      border:"1.5px solid "+(t.done?"transparent":canDo?col+"88":"#1e1e2e"),
                      color:"#fff",fontSize:14,display:"flex",alignItems:"center",
                      justifyContent:"center",
                      WebkitTapHighlightColor:"transparent",
                      opacity:(!canDo&&!t.done)?0.3:1,
                    }}>
                    {t.done?"✓":(canDo?"○":"🔒")}
                  </button>
                  {/* delete */}
                  <button onClick={e=>{ e.stopPropagation(); deleteTask(t.id); }}
                    style={{ width:28,height:28,borderRadius:8,background:"transparent",
                      border:"1px solid #1a1a26",color:"#333",fontSize:12,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                      WebkitTapHighlightColor:"transparent" }}>✕</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <button onClick={()=>setAddModal(today)} style={{
        position:"fixed",bottom:24,right:20,width:56,height:56,borderRadius:"50%",
        background:viewUser==="idil"?"#059669":"#7C3AED",
        border:"none",color:"#fff",fontSize:28,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow:`0 0 0 8px ${viewUser==="idil"?"#05966918":"#7C3AED18"}`,
        WebkitTapHighlightColor:"transparent",
      }}>+</button>

      {/* ── MODALS ── */}
      {addModal&&(
        <AddTaskModal date={addModal}
          defaultOwner={viewUser==="both"?"emirali":viewUser}
          onSave={addTask} onClose={()=>setAddModal(null)}/>
      )}
      {detailTask&&(
        <TaskDetailModal task={detailTask}
          onToggle={()=>toggleTask(detailTask.id)}
          onDelete={()=>deleteTask(detailTask.id)}
          onClose={()=>setDetailTask(null)}/>
      )}
      {showReset&&<ResetConfirm onConfirm={resetAll} onClose={()=>setShowReset(false)}/>}
    </div>
  );
}
