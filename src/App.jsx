import { useState, useEffect } from "react";
import { supabase } from "./supabase"
import Auth from "./Auth"
import EmojiPicker from "emoji-picker-react"
import { Trash2 } from "lucide-react"

const TASKS = [
  { id: "run",    label: "5km Run / 10k Steps",  icon: "🏃", category: "body",   detail: "Track steps or log your run" },
  { id: "gym",    label: "Gym Session",           icon: "🏋️", category: "body",   detail: "Strength / hypertrophy work" },
  { id: "food",   label: "Clean Eating",          icon: "🥗", category: "body",   detail: "High protein, gym-aligned meals" },
  { id: "cyber",  label: "Cyber Upskilling",      icon: "💻", category: "mind",   detail: "Courses, labs, CTFs — min 1.5 hrs" },
  { id: "agency", label: "Agency Building",       icon: "🏗️", category: "mind",   detail: "Client outreach, ops, systems" },
  { id: "edit",   label: "Creative Edit Work",    icon: "🎬", category: "mind",   detail: "Video / photo editing output" },
  { id: "jobs",   label: "Job Applications",      icon: "📨", category: "hustle", detail: "Apply to at least 3 jobs today" },
  { id: "rapido", label: "Rapido Night Ride",     icon: "🛵", category: "hustle", detail: "Hit daily ₹ target" },
];

const DAILY_TARGET = 750;
const MONTHLY_GOAL = 20000;
const STORAGE_KEY  = "accountability-tracker-v2";

const CAT_LABELS = { body: "Body", mind: "Mind & Skills", hustle: "Hustle" };
const CAT_COLORS = { body: "#f97316", mind: "#6366f1", hustle: "#10b981" };

function getToday() {
  return new Date().toISOString().split("T")[0];
}
function getDayData(all, date) {
  return all[date] || { completed: {}, earning: 0 };
}

export default function Tracker() {
  const today = getToday();
  const [allData,    setAllData]    = useState({});
  const [earning,    setEarning]    = useState("");
  const [view,       setView]       = useState("today");
  const [streak,     setStreak]     = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [saveLabel,  setSaveLabel]  = useState("");
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [newTask, setNewTask] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("📝")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // ── Load from persistent storage ──────────────────────────────
  useEffect(() => {
  if (!user) return

  ;(async () => {
    try {
      const { data, error } = await supabase
        .from("tracker_data")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error && error.code !== "PGRST116") {
        console.log(error)
      }

      if (data?.data) {
        setAllData(data.data)
      }

    } catch (err) {
      console.log(err)
    }

    setLoading(false)
  })()
}, [user])

useEffect(() => {
  const saved = localStorage.getItem("tracker_user")

  if (saved) {
    setUser(JSON.parse(saved))
  }
}, [])

useEffect(() => {

  if (!user) return

  loadTasks()

}, [user])

async function loadTasks() {

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.log(error)
    return
  }

  setTasks(data || [])
}

async function addTask() {

  if (!newTask.trim()) return

  const { error } = await supabase
    .from("tasks")
    .insert([
      {
        user_id: user.id,
        title: newTask,
        category: selectedCategory || "mind",
        emoji: selectedEmoji,
        completed: false
      }
    ])

  if (error) {
    console.log(error)
    return
  }

  setNewTask("")
  loadTasks()
}

async function deleteTask(taskId) {

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)

  if (error) {
    console.log(error)
    return
  }

  loadTasks()
}

async function addCategory(name, color) {

  const { error } = await supabase
    .from("categories")
    .insert([
      {
        user_id: user.id,
        name,
        color
      }
    ])

  if (error) {
    console.log(error)
  }

  loadCategories()
}

useEffect(() => {

  if (!user) return

  loadCategories()

}, [user])

async function loadCategories() {

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)

  if (error) {
    console.log(error)
    return
  }

  setCategories(data || [])
}

  // ── Streak calculation ─────────────────────────────────────────
  useEffect(() => {
    let s = 0;
    const d = new Date();
    d.setDate(d.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const key = d.toISOString().split("T")[0];
      const dd  = allData[key];
      if (!dd) break;
      if (Object.values(dd.completed || {}).filter(Boolean).length >= 5) s++;
      else break;
      d.setDate(d.getDate() - 1);
    }
    setStreak(s);
  }, [allData]);

  // ── Persist helper ─────────────────────────────────────────────
  async function persist(newData) {
  setSaveLabel("saving")

  try {
    const { error } = await supabase
      .from("tracker_data")
      .upsert(
  {
    user_id: user.id,
    data: newData
  },
  {
    onConflict: "user_id"
  }
)

    if (error) {
      console.log(error)
      setSaveLabel("error")
    } else {
      setSaveLabel("saved")
    }

  } catch (err) {
    console.log(err)
    setSaveLabel("error")
  }

  setTimeout(() => setSaveLabel(""), 2200)
}

  function toggle(taskId) {
    const dd  = getDayData(allData, today);
    const upd = {
      ...allData,
      [today]: { ...dd, completed: { ...dd.completed, [taskId]: !dd.completed[taskId] } }
    };
    setAllData(upd); persist(upd);
  }

  function logEarning() {
    const val = parseFloat(earning);
    if (isNaN(val) || val < 0) return;
    const dd  = getDayData(allData, today);
    const upd = { ...allData, [today]: { ...dd, earning: val } };
    setAllData(upd); persist(upd);
    setEarning("");
  }

  // ── Derived values ─────────────────────────────────────────────
  const dayData      = getDayData(allData, today);
  const completed = dayData.completed || {};
const todayEarning = dayData.earning || 0;

const totalTasks = tasks.length;

const doneCount = tasks.filter(
  task => completed[task.id]
).length;

const pct =
  totalTasks > 0
    ? Math.round((doneCount / totalTasks) * 100)
    : 0;
  const thisMonth    = today.slice(0, 7);
  let monthEarnings  = 0, fullDays = 0;
  Object.entries(allData).forEach(([date, dd]) => {
    if (!date.startsWith(thisMonth)) return;
    monthEarnings += dd.earning || 0;
    if (Object.values(dd.completed || {}).filter(Boolean).length >= 5) fullDays++;
  });

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d   = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().split("T")[0];
    const dd  = allData[key] || {};
    return {
      key,
      cnt:   Object.values(dd.completed || {}).filter(Boolean).length,
      earn:  dd.earning || 0,
      label: d.toLocaleDateString("en", { weekday: "short" }).slice(0, 2),
    };
  });

  const barColor = n => n >= 6 ? "#10b981" : n >= 4 ? "#6366f1" : n >= 2 ? "#f97316" : "#1e1e2e";
  const COLORS = [
  "#9400D3",
  "#4B0082",
  "#0000FF",
  "#00FF00",
  "#FFFF00",
  "#FF7F00",
  "#FF0000"
]

  // ── Loading screen ─────────────────────────────────────────────
  if (!user) {
    return <Auth onLogin={setUser} />
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#07070f", display:"flex",
      alignItems:"center", justifyContent:"center", fontFamily:"monospace",
      fontSize:12, letterSpacing:3, color:"#333" }}>
      LOADING...
    </div>
  );

  // ── UI ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#07070f", color:"#e4e4f0",
      fontFamily:"'DM Mono','Courier New',monospace", paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px;background:#0a0a12}
        ::-webkit-scrollbar-thumb{background:#222;border-radius:4px}

        .row{display:flex;align-items:flex-start;gap:14px;padding:13px 15px;
          border-radius:10px;cursor:pointer;transition:all .15s;
          border:1px solid transparent;margin-bottom:7px;background:#0f0f1a}
        .row:active{opacity:.8}
        .row.done{background:#091410;border-color:#193328}
        .deleteBtn{
          opacity:0;
          transition:opacity .15s ease;
        }

        .row:hover .deleteBtn{
          opacity:1;
        }

        .chk{width:22px;height:22px;border-radius:6px;border:2px solid #2a2a3a;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;margin-top:1px;transition:all .15s;font-size:12px}
        .chk.done{background:#10b981;border-color:#10b981;color:#07070f}

        .tab{padding:8px 18px;border-radius:8px;border:none;cursor:pointer;
          font-family:inherit;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;
          transition:all .15s}
        .tab.on{background:#e4e4f0;color:#07070f}
        .tab.off{background:transparent;color:#444;border:1px solid #1a1a2a}

        .einput{background:#0f0f1a;border:1px solid #1e1e30;border-radius:8px;
          color:#e4e4f0;font-family:inherit;font-size:15px;padding:10px 13px;
          width:130px;outline:none}
        .einput:focus{border-color:#10b981}

        .ebtn{background:#10b981;border:none;border-radius:8px;color:#07070f;
          font-family:inherit;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;
          padding:10px 15px;cursor:pointer;font-weight:500}

        .ring{transform:rotate(-90deg)}
        @keyframes pop{0%{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
        .pop{animation:pop .25s ease}
      `}</style>

        {/* ── HEADER ── */}
        <div>
<div style={{ padding:"26px 18px 0" }}>

  <div
    style={{
      display:"flex",
      justifyContent:"space-between",
      alignItems:"flex-start"
    }}
  >
    <div>

      <div
        style={{
          fontFamily:"'Bebas Neue',sans-serif",
          fontSize:36,
          letterSpacing:2,
          lineHeight:1.2,
          color:"#e4e4f0"
        }}
      >
        Hi {user.username.charAt(0).toUpperCase() + user.username.slice(1)}
      </div>

      <div
        style={{
          color:"#333",
          fontSize:10,
          letterSpacing:2,
          marginTop:5
        }}
      >
        {new Date().toLocaleDateString("en", {
          weekday:"long",
          month:"long",
          day:"numeric"
        }).toUpperCase()}
      </div>

    </div>

    <div style={{ textAlign:"right" }}>

      <div
        style={{
          fontSize:10,
          color:"#333",
          letterSpacing:1
        }}
      >
        STREAK
      </div>

      <div
        style={{
          fontFamily:"'Bebas Neue'",
          fontSize:30,
          color: streak > 0 ? "#f97316" : "#222"
        }}
      >
        {streak}🔥
      </div>

    </div>

  </div>

</div>

        {/* save pill */}
        <div style={{ height:18, marginTop:6 }}>
          {saveLabel === "saving" &&
            <span style={{ fontSize:10, color:"#333", letterSpacing:1 }}>SAVING…</span>}
          {saveLabel === "saved" &&
            <span className="pop" style={{ fontSize:10, color:"#10b981", letterSpacing:1 }}>✓ SAVED TO CLOUD</span>}
          {saveLabel === "error" &&
            <span className="pop" style={{ fontSize:10, color:"#ef4444", letterSpacing:1 }}>⚠ SAVE FAILED — CHECK CONNECTION</span>}
        </div>

        {/* ring + stat cards */}
        <div style={{ display:"flex", gap:12, marginTop:8, alignItems:"center" }}>
          <svg width="70" height="70" viewBox="0 0 70 70">
            <circle cx="35" cy="35" r="29" fill="none" stroke="#141422" strokeWidth="6"/>
            <circle className="ring" cx="35" cy="35" r="29" fill="none"
              stroke={pct===100?"#10b981":"#6366f1"} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2*Math.PI*29}`}
              strokeDashoffset={`${2*Math.PI*29*(1-pct/100)}`}
              style={{transition:"stroke-dashoffset .5s"}}/>
            <text x="35" y="40" textAnchor="middle"
              style={{fontFamily:"'Bebas Neue'",fontSize:17,fill:"#e4e4f0"}}>
              {pct}%
            </text>
          </svg>
          <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
            {[
              {label:"Tasks Done", val:`${doneCount}/${totalTasks}`, color:"#6366f1"},
              {label:"Today ₹",    val:`₹${todayEarning}`,           color:"#10b981"},
              {label:"Month ₹",    val:`₹${monthEarnings.toLocaleString()}`, color:"#f97316"},
              {label:"Full Days",  val:fullDays,                      color:"#e4e4f0"},
            ].map(s=>(
              <div key={s.label} style={{background:"#0f0f1a",borderRadius:8,padding:"9px 11px"}}>
                <div style={{fontSize:9,color:"#333",letterSpacing:1,textTransform:"uppercase"}}>{s.label}</div>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:19,color:s.color,marginTop:2}}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* monthly bar */}
        <div style={{ marginTop:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            fontSize:10, color:"#333", letterSpacing:1, marginBottom:5 }}>
            <span>MONTHLY SAVINGS GOAL</span>
            <span>₹{monthEarnings.toLocaleString()} / ₹{MONTHLY_GOAL.toLocaleString()}</span>
          </div>
          <div style={{ height:5, background:"#141422", borderRadius:3, overflow:"hidden" }}>
            <div style={{
              height:"100%", borderRadius:3,
              background:"linear-gradient(90deg,#10b981,#6366f1)",
              width:`${Math.min(100,(monthEarnings/MONTHLY_GOAL)*100)}%`,
              transition:"width .5s"
            }}/>
          </div>
        </div>

        {/* tabs */}
        <div style={{ display:"flex", gap:8, marginTop:18 }}>
          {[["today","Today"],["history","History"]].map(([v,l])=>(
            <button key={v} className={`tab ${view===v?"on":"off"}`}
              onClick={()=>setView(v)}>{l}</button>
          ))}
        </div>
      </div>


          <div
  style={{
    padding:"18px",
    background:"#0f0f1a",
    borderRadius:12,
    margin:"18px"
  }}
>

  <input
    value={newTask}
    onChange={(e) => setNewTask(e.target.value)}
    placeholder="New Task"
    style={{
      width:"100%",
      padding:"12px",
      marginBottom:"10px",
      background:"#07070f",
      border:"1px solid #222",
      color:"white"
    }}
  />

  <select
  value={selectedCategory}
  onChange={(e) => setSelectedCategory(e.target.value)}
  style={{
    width:"100%",
    padding:"12px",
    marginBottom:"10px",
    background:"#07070f",
    color:"white"
  }}
>

  <option value="body">Body</option>
  <option value="mind">Mind & Skills</option>
  <option value="hustle">Hustle</option>

</select>

  <div style={{ marginBottom:"12px", position:"relative" }}>

  <button
    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
    style={{
      width:"100%",
      padding:"12px",
      background:"#07070f",
      border:"1px solid #222",
      color:"white",
      fontSize:"20px",
      borderRadius:"8px",
      textAlign:"left",
      cursor:"pointer"
    }}
  >
    {selectedEmoji} Select Emoji
  </button>

  {showEmojiPicker && (

    <div
      style={{
        position:"absolute",
        zIndex:1000,
        marginTop:"10px"
      }}
    >

      <EmojiPicker
        onEmojiClick={(emojiData) => {
          setSelectedEmoji(emojiData.emoji)
          setShowEmojiPicker(false)
        }}
        theme="dark"
        searchDisabled={false}
      />

    </div>

  )}

</div>

  <button
    onClick={addTask}
    style={{
      width:"100%",
      padding:"12px",
      background:"#6366f1",
      border:"none",
      color:"white",
      borderRadius:"8px"
    }}
  >
    Add Task
  </button>

</div>


      {/* ── TODAY ── */}
      {view==="today" && (
        <div style={{ padding:"18px 18px 0" }}>
          {Object.entries(CAT_LABELS).map(([cat, label])=>(
            <div key={cat} style={{ marginBottom:22 }}>
              <div style={{ fontSize:10, letterSpacing:2, marginBottom:9,
                color:CAT_COLORS[cat], textTransform:"uppercase",
                display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:18, height:2, background:CAT_COLORS[cat], borderRadius:1 }}/>
                {label}
              </div>
              {tasks.filter(task=>task.category===cat).map(task=>(
                <div key={task.id}
                  className={`row ${completed[task.id]?"done":""}`}
                  onClick={()=>toggle(task.id)}>
                  <div className={`chk ${completed[task.id]?"done":""}`}>
                    {completed[task.id]&&"✓"}
                  </div>
                  <div
                    style={{
                      flex:1,
                      display:"flex",
                      justifyContent:"space-between",
                      alignItems:"center"
                    }}
                  >                    
  <div style={{ fontSize:13, display:"flex", gap:8, alignItems:"center" }}>

<span>{task.emoji || "📝"}</span>

  <span
    style={{
      textDecoration: completed[task.id] ? "line-through" : "none",
      color: completed[task.id] ? "#2e2e42" : "#e4e4f0"
    }}
  >
    {task.title}
  </span>
</div>
<button
  className="deleteBtn"
  onClick={(e) => {
    e.stopPropagation()
    deleteTask(task.id)
  }}
  style={{
    background:"transparent",
    border:"none",
    color:"#ef4444",
    cursor:"pointer",
    display:"flex",
    alignItems:"center",
    justifyContent:"center"
  }}
>

  <Trash2 size={16} />

</button>
                    
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* earnings logger */}
          <div style={{ background:"#091410", border:"1px solid #193328",
            borderRadius:12, padding:"15px", marginBottom:24 }}>
            <div style={{ fontSize:10, color:"#10b981", letterSpacing:2, marginBottom:10 }}>
              LOG RAPIDO EARNINGS — TARGET ₹{DAILY_TARGET}/DAY
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ fontSize:16, color:"#10b981" }}>₹</span>
              <input className="einput" type="number" placeholder="Today's earning"
                value={earning} onChange={e=>setEarning(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&logEarning()}/>
              <button className="ebtn" onClick={logEarning}>LOG</button>
            </div>
            {todayEarning>0&&(
              <div style={{ marginTop:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  fontSize:10, color:"#333", marginBottom:4, letterSpacing:1 }}>
                  <span>LOGGED</span>
                  <span>{Math.round((todayEarning/DAILY_TARGET)*100)}% of target</span>
                </div>
                <div style={{ height:4, background:"#0a1a0f", borderRadius:3, overflow:"hidden" }}>
                  <div style={{
                    height:"100%", background:"#10b981", borderRadius:3,
                    width:`${Math.min(100,(todayEarning/DAILY_TARGET)*100)}%`
                  }}/>
                </div>
                <div style={{ fontSize:12, marginTop:6,
                  color: todayEarning>=DAILY_TARGET?"#10b981":"#f97316" }}>
                  {todayEarning>=DAILY_TARGET
                    ? "✓ Daily target hit!"
                    : `₹${DAILY_TARGET-todayEarning} to go`}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {view==="history" && (
        <div style={{ padding:"18px" }}>
          <div style={{ fontSize:10, color:"#333", letterSpacing:2, marginBottom:14 }}>LAST 14 DAYS</div>

          {/* bar chart */}
          <div style={{ background:"#0f0f1a", borderRadius:12, padding:"14px",
            display:"flex", alignItems:"flex-end", gap:5, height:110, marginBottom:20 }}>
            {last14.map(({key,cnt,label})=>(
              <div key={key} style={{ flex:1, display:"flex", flexDirection:"column",
                alignItems:"center", height:"100%" }}>
                <div style={{ flex:1, display:"flex", alignItems:"flex-end", width:"100%" }}>
                  <div style={{
                    width:"100%",
                    height: cnt===0 ? 3 : `${(cnt/totalTasks)*100}%`,
                    background: barColor(cnt),
                    borderRadius:"3px 3px 0 0",
                    transition:"height .3s"
                  }}/>
                </div>
                <div style={{ fontSize:8, color:"#2e2e42", marginTop:4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* legend */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18,
            fontSize:10, color:"#444" }}>
            {[["#10b981","6+ tasks"],["#6366f1","4-5"],["#f97316","2-3"],["#1e1e2e","0-1"]].map(([c,l])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:9, height:9, background:c, borderRadius:2 }}/>
                {l}
              </div>
            ))}
          </div>

          {/* day cards */}
          {last14.slice().reverse().map(({key,cnt,earn})=>{
            const dd = allData[key];
            if (!dd && key!==today) return null;
            const tasks = dd?.completed||{};
            return (
              <div key={key} style={{
                background:"#0f0f1a", borderRadius:10, padding:"11px 13px",
                marginBottom:7, borderLeft:`3px solid ${barColor(cnt)}`
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                  <span style={{ fontSize:10, color:"#555", letterSpacing:1 }}>
                    {new Date(key+"T12:00:00").toLocaleDateString("en",
                      {weekday:"short",month:"short",day:"numeric"}).toUpperCase()}
                  </span>
                  <span style={{ fontSize:11, color:"#10b981" }}>
                    {earn>0?`₹${earn}`:"—"}
                  </span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                  {tasks.map(t=>(
                    <span key={t.id} style={{
                      fontSize:12, padding:"2px 7px", borderRadius:4,
                      background: tasks[t.id]?"#091410":"#141420",
                      color:       tasks[t.id]?"#10b981":"#2e2e42",
                      border:`1px solid ${tasks[t.id]?"#193328":"#1a1a28"}`
                    }}>
                      📝{tasks[t.id]?" ✓":" —"}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {Object.keys(allData).length===0&&(
            <div style={{ textAlign:"center", color:"#222", fontSize:11,
              letterSpacing:1, marginTop:50 }}>
              NO HISTORY YET — START TODAY
            </div>
          )}
        </div>
      )}
    </div>
    
  );
}
