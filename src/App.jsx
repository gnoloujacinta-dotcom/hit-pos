import { useState, useEffect, useRef, useCallback } from "react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const URL_ = "https://hitghrlrfbwvefbijxtz.supabase.co";
const KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdGdocmxyZmJ3dmVmYmlqeHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODc5MjIsImV4cCI6MjA5NDI2MzkyMn0.dKGI7mvTHatMI2LzVSbmOs2VDgVHremsX-fEbgAtgbc";
const H    = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const sb = {
  get:    async (t, q="")      => { try { return await (await fetch(`${URL_}/rest/v1/${t}?order=created_at.desc${q}`, { headers: H })).json(); } catch { return []; } },
  insert: async (t, d)         => { try { return await (await fetch(`${URL_}/rest/v1/${t}`, { method:"POST", headers:{...H,Prefer:"return=representation"}, body:JSON.stringify(d) })).json(); } catch { return []; } },
  update: async (t, id, d)     => { try { return fetch(`${URL_}/rest/v1/${t}?id=eq.${id}`, { method:"PATCH", headers:H, body:JSON.stringify(d) }); } catch {} },
  del:    async (t, id)        => { try { return fetch(`${URL_}/rest/v1/${t}?id=eq.${id}`, { method:"DELETE", headers:H }); } catch {} },
  getBy:  async (t, col, val)  => { try { return await (await fetch(`${URL_}/rest/v1/${t}?${col}=eq.${val}`, { headers: H })).json(); } catch { return []; } },
  query:  async (t, q="")      => { try { return await (await fetch(`${URL_}/rest/v1/${t}?${q}`, { headers: H })).json(); } catch { return []; } },
};

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const CATS     = ["Tout","Plats","Boissons","Desserts"];
const METHODS  = ["Espèces","Wave","Orange Money","Carte","Glovo"];
const PAY_COLORS = ["#4f46e5","#3b82f6","#f97316","#8b5cf6","#ec4899"];

const DEFAULT_PRODUCTS = [
  {name:"Poulet braisé",cat:"Plats",price:5000,cost:2000,stock:15,img:"🍗"},
  {name:"Attiéké Poisson",cat:"Plats",price:4000,cost:1500,stock:10,img:"🐟"},
  {name:"Hamburger",cat:"Plats",price:3500,cost:1200,stock:8,img:"🍔"},
  {name:"Spaghetti Bolognaise",cat:"Plats",price:4500,cost:1800,stock:13,img:"🍝"},
  {name:"Brochette de bœuf",cat:"Plats",price:6000,cost:2500,stock:6,img:"🍖"},
  {name:"Jus naturel",cat:"Boissons",price:2000,cost:800,stock:20,img:"🍹"},
  {name:"Soda",cat:"Boissons",price:1500,cost:600,stock:30,img:"🥤"},
  {name:"Gâteau Chocolat",cat:"Desserts",price:2500,cost:900,stock:7,img:"🍰"},
];

const DEFAULT_EMPLOYEES = [
  { name:"Admin", pin:"1234", role:"admin",  active:true },
  { name:"Marie", pin:"0000", role:"employee", active:true },
];

// ─── THEME ───────────────────────────────────────────────────────────────────
const LIGHT = {
  accent:"#4f46e5",accentL:"#6366f1",accentBg:"rgba(79,70,229,0.08)",
  sidebar:"#1e1b4b",sidebarText:"#c7d2fe",sidebarActive:"#4f46e5",sidebarActiveBg:"rgba(255,255,255,0.12)",
  topbar:"#ffffff",topbarBorder:"rgba(0,0,0,0.08)",
  bg:"#f5f5f7",surface:"#ffffff",surface2:"#f0f0f5",
  txt:"#111827",muted:"#6b7280",border:"rgba(0,0,0,0.08)",
  green:"#16a34a",red:"#dc2626",blue:"#2563eb",orange:"#ea580c",
  gold:"#b45309",goldBg:"rgba(180,83,9,0.08)",
  cardBg:"#ffffff",cardBorder:"rgba(0,0,0,0.07)",
  inputBg:"#f9f9fb",inputBorder:"rgba(0,0,0,0.12)",
  btnPrimary:"#4f46e5",btnPrimaryText:"#ffffff",
  btnSecondary:"transparent",btnSecondaryText:"#6b7280",
  shadow:"0 1px 3px rgba(0,0,0,0.08)",
};
const DARK = {
  accent:"#6366f1",accentL:"#818cf8",accentBg:"rgba(99,102,241,0.12)",
  sidebar:"#0f0f1a",sidebarText:"#94a3b8",sidebarActive:"#6366f1",sidebarActiveBg:"rgba(99,102,241,0.15)",
  topbar:"#161625",topbarBorder:"rgba(255,255,255,0.06)",
  bg:"#0d0d1a",surface:"#161625",surface2:"#1e1e30",
  txt:"#f0ede8",muted:"#64748b",border:"rgba(255,255,255,0.07)",
  green:"#22c55e",red:"#ef4444",blue:"#3b82f6",orange:"#f97316",
  gold:"#f59e0b",goldBg:"rgba(245,158,11,0.1)",
  cardBg:"#1a1a2e",cardBorder:"rgba(255,255,255,0.06)",
  inputBg:"#1e1e30",inputBorder:"rgba(255,255,255,0.1)",
  btnPrimary:"#6366f1",btnPrimaryText:"#ffffff",
  btnSecondary:"transparent",btnSecondaryText:"#64748b",
  shadow:"none",
};

const fmt = n => new Intl.NumberFormat("fr-FR").format(n||0);
const today = () => new Date().toDateString();
const dayKey = (d) => new Date(d).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"});

// ─── LOGO ────────────────────────────────────────────────────────────────────
const AmlyLogo = ({size=32}) => (
  <div style={{width:size,height:size,background:"linear-gradient(135deg,#4f46e5,#818cf8)",borderRadius:Math.round(size*0.22),
    display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,
    fontSize:Math.round(size*0.32),color:"#fff",fontFamily:"Impact,Arial Black,sans-serif",
    letterSpacing:"-0.5px",flexShrink:0,boxShadow:"0 2px 10px rgba(79,70,229,0.4)"}}>A</div>
);

// ─── PRINT HELPERS ────────────────────────────────────────────────────────────
const printTicket = (sale, items, shopInfo) => {
  const w = window.open("","_blank","width=400,height=600");
  w.document.write(`<html><head><title>Ticket</title><style>
    body{font-family:'Courier New',monospace;width:280px;margin:0 auto;padding:10px;font-size:12px}
    .center{text-align:center} .bold{font-weight:bold} .line{border-top:1px dashed #000;margin:6px 0}
    .row{display:flex;justify-content:space-between} .big{font-size:16px;font-weight:bold}
  </style></head><body>
    <div class="center bold" style="font-size:18px">HIT FAST FOOD</div>
    <div class="center">${shopInfo.address||""}</div>
    <div class="center">${shopInfo.phone||""}</div>
    <div class="line"></div>
    <div class="row"><span>Réf:</span><span>${sale.reference}</span></div>
    <div class="row"><span>Date:</span><span>${new Date(sale.created_at||Date.now()).toLocaleString("fr-FR")}</span></div>
    <div class="row"><span>Vendeur:</span><span>${sale.vendor}</span></div>
    <div class="line"></div>
    ${items.map(i=>`<div class="row"><span>${i.name} x${i.qty}</span><span>${fmt(i.price*i.qty)} F</span></div>`).join("")}
    <div class="line"></div>
    <div class="row big"><span>TOTAL</span><span>${fmt(sale.total)} F</span></div>
    <div class="row"><span>Mode:</span><span>${sale.method}</span></div>
    <div class="line"></div>
    <div class="center">Merci pour votre visite !</div>
    <div class="center">Revenez bientôt 😊</div>
  </body></html>`);
  w.document.close(); w.print();
};

const printReport = (sales, reportPeriod, shopInfo, employees) => {
  const periodSales = filterByPeriod(sales, reportPeriod);
  const total = periodSales.reduce((s,r)=>s+(r.total||0),0);
  const byMethod = METHODS.map(m=>({name:m,v:periodSales.filter(s=>s.method?.includes(m)).reduce((a,s)=>a+(s.total||0),0)})).filter(m=>m.v>0);
  const w = window.open("","_blank","width=800,height=900");
  w.document.write(`<html><head><title>Rapport</title><style>
    body{font-family:Arial,sans-serif;padding:30px;color:#111;font-size:13px}
    h1{color:#4f46e5;font-size:22px} h2{color:#4f46e5;font-size:15px;border-bottom:2px solid #4f46e5;padding-bottom:4px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#4f46e5;color:#fff;padding:8px;text-align:left;font-size:12px}
    td{padding:7px 8px;border-bottom:1px solid #eee;font-size:12px}
    .total{font-size:18px;font-weight:bold;color:#16a34a}
    .badge{display:inline-block;padding:2px 8px;border-radius:4px;background:#e0e7ff;color:#4f46e5;font-size:11px}
    @media print{body{padding:15px}}
  </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div><h1>HIT FAST FOOD — Rapport ${reportPeriod}</h1>
      <div>${shopInfo.address} | ${shopInfo.phone||""}</div></div>
      <div style="text-align:right;font-size:11px;color:#666">${new Date().toLocaleString("fr-FR")}</div>
    </div>
    <h2>Résumé</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:20px">
      <div style="border:1px solid #e0e7ff;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:11px;color:#666">Ventes</div><div class="total">${fmt(total)} F</div>
      </div>
      <div style="border:1px solid #e0e7ff;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:11px;color:#666">Transactions</div><div class="total">${periodSales.length}</div>
      </div>
      <div style="border:1px solid #e0e7ff;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:11px;color:#666">Panier moyen</div><div class="total">${fmt(periodSales.length?Math.round(total/periodSales.length):0)} F</div>
      </div>
    </div>
    <h2>Répartition par mode de paiement</h2>
    <table><thead><tr><th>Mode</th><th>Montant</th><th>Transactions</th></tr></thead><tbody>
      ${byMethod.map(m=>`<tr><td><span class="badge">${m.name}</span></td><td style="font-weight:700;color:#16a34a">${fmt(m.v)} F</td><td>${periodSales.filter(s=>s.method?.includes(m.name)).length}</td></tr>`).join("")}
    </tbody></table>
    <h2>Détail des ventes</h2>
    <table><thead><tr><th>Référence</th><th>Date</th><th>Vendeur</th><th>Mode</th><th>Montant</th></tr></thead><tbody>
      ${periodSales.slice(0,50).map(s=>`<tr><td style="color:#4f46e5;font-weight:600">${s.reference}</td><td>${s.created_at?new Date(s.created_at).toLocaleString("fr-FR"):""}</td><td>${s.vendor}</td><td><span class="badge">${s.method}</span></td><td style="font-weight:700;color:#16a34a">${fmt(s.total)} F</td></tr>`).join("")}
    </tbody></table>
  </body></html>`);
  w.document.close(); w.print();
};

const filterByPeriod = (sales, period) => {
  const now = new Date();
  return sales.filter(s => {
    if(!s.created_at) return false;
    const d = new Date(s.created_at);
    if(period==="Aujourd'hui") return d.toDateString()===now.toDateString();
    if(period==="Semaine") { const w=new Date(now); w.setDate(now.getDate()-7); return d>=w; }
    if(period==="Mois") { const m=new Date(now); m.setDate(now.getDate()-30); return d>=m; }
    return true;
  });
};

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
const LoginScreen = ({ employees, onLogin, darkMode, C, S }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [selectedEmp, setSelectedEmp] = useState(null);

  const handlePin = (digit) => {
    if(pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    if(selectedEmp) {
      if(newPin === selectedEmp.pin) { onLogin(selectedEmp); }
      else if(newPin.length >= 4) { setError("PIN incorrect"); setPin(""); }
    }
  };

  const handleEmpSelect = (emp) => { setSelectedEmp(emp); setPin(""); setError(""); };

  return (
    <div style={{minHeight:"100vh",background:darkMode?"#0d0d1a":"#f5f5f7",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:24}}>
      <div style={{textAlign:"center",marginBottom:8}}>
        <AmlyLogo size={56}/>
        <div style={{fontWeight:900,fontSize:22,color:C.accent,marginTop:10,letterSpacing:"0.04em"}}>AMLY-POS</div>
        <div style={{fontSize:12,color:C.muted,marginTop:2}}>HIT Fast Food — Connexion</div>
      </div>

      {!selectedEmp ? (
        <div style={{background:C.cardBg,border:`1px solid ${C.cardBorder}`,borderRadius:16,padding:24,width:340,boxShadow:"0 8px 40px rgba(0,0,0,0.2)"}}>
          <div style={{fontWeight:700,fontSize:14,color:C.txt,marginBottom:14,textAlign:"center"}}>Qui êtes-vous ?</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {employees.filter(e=>e.active).map((emp,i)=>(
              <div key={i} onClick={()=>handleEmpSelect(emp)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,border:`1px solid ${C.border}`,cursor:"pointer",background:C.surface2,transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.background=C.accentBg;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.surface2;}}>
                <div style={{width:38,height:38,borderRadius:"50%",background:emp.role==="admin"?C.accent:C.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#fff",fontWeight:700,flexShrink:0}}>
                  {emp.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:C.txt}}>{emp.name}</div>
                  <div style={{fontSize:10,color:C.muted}}>{emp.role==="admin"?"👑 Administrateur":"👤 Employé"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{background:C.cardBg,border:`1px solid ${C.cardBorder}`,borderRadius:16,padding:24,width:300,boxShadow:"0 8px 40px rgba(0,0,0,0.2)",textAlign:"center"}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:selectedEmp.role==="admin"?C.accent:C.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"#fff",fontWeight:700,margin:"0 auto 10px"}}>
            {selectedEmp.name[0].toUpperCase()}
          </div>
          <div style={{fontWeight:700,fontSize:15,color:C.txt,marginBottom:2}}>{selectedEmp.name}</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:16}}>Entrez votre PIN</div>
          <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
            {[0,1,2,3,4,5].map(i=>(
              <div key={i} style={{width:12,height:12,borderRadius:"50%",background:pin.length>i?C.accent:C.border,transition:"all .15s"}}/>
            ))}
          </div>
          {error&&<div style={{color:C.red,fontSize:12,marginBottom:10,fontWeight:600}}>{error}</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
            {[1,2,3,4,5,6,7,8,9,"⌫",0,"✓"].map((d,i)=>(
              <button key={i} onClick={()=>{ if(d==="⌫"){setPin(p=>p.slice(0,-1));setError("");}else if(d==="✓"){}else handlePin(String(d)); }}
                style={{padding:"14px",borderRadius:10,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:16,fontWeight:700,
                  background:d==="✓"?C.accent:C.surface2,color:d==="✓"?"#fff":C.txt,transition:"all .1s"}}
                onMouseEnter={e=>{e.currentTarget.style.background=d==="✓"?C.accentL:C.border;}}
                onMouseLeave={e=>{e.currentTarget.style.background=d==="✓"?C.accent:C.surface2;}}>
                {d}
              </button>
            ))}
          </div>
          <button onClick={()=>{setSelectedEmp(null);setPin("");setError("");}}
            style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:12}}>← Retour</button>
        </div>
      )}
    </div>
  );
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function AmlyPOS() {
  const [darkMode, setDarkMode] = useState(true);
  const C = darkMode ? DARK : LIGHT;

  const S = {
    card:  {background:C.cardBg,border:`1px solid ${C.cardBorder}`,borderRadius:12,padding:16,boxShadow:C.shadow},
    th:    {textAlign:"left",fontSize:10,color:C.muted,fontWeight:600,padding:"7px 10px",borderBottom:`1px solid ${C.border}`,textTransform:"uppercase"},
    td:    {padding:"10px 10px",fontSize:12,borderBottom:`1px solid ${C.border}`},
    input: {background:C.inputBg,border:`1px solid ${C.inputBorder}`,borderRadius:8,padding:"8px 12px",color:C.txt,fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"},
    btnG:  {background:C.btnPrimary,color:C.btnPrimaryText,border:"none",borderRadius:8,padding:"10px 16px",fontWeight:700,cursor:"pointer",fontSize:13,width:"100%"},
    btnO:  {background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 16px",fontWeight:600,cursor:"pointer",fontSize:13,width:"100%"},
    btnB:  {background:C.blue,color:"#fff",border:"none",borderRadius:8,padding:"10px 16px",fontWeight:700,cursor:"pointer",fontSize:13,width:"100%"},
    btnR:  {background:C.red,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontWeight:700,cursor:"pointer",fontSize:12},
    btnGr: {background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"8px 14px",fontWeight:700,cursor:"pointer",fontSize:12},
  };

  // ── Auth ──
  const [currentUser,  setCurrentUser]  = useState(null);
  const [employees,    setEmployees]    = useState(DEFAULT_EMPLOYEES);

  // ── Data ──
  const [page,         setPage]         = useState("caisse");
  const [products,     setProducts]     = useState([]);
  const [sales,        setSales]        = useState([]);
  const [tables,       setTables]       = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [orderItems,   setOrderItems]   = useState({});
  const [saleItems,    setSaleItems]    = useState({});
  const [ingredients,  setIngredients]  = useState([]);
  const [recettes,     setRecettes]     = useState([]);
  const [clients,      setClients]      = useState([]);
  const [pertes,       setPertes]       = useState([]);
  const [reservations, setReservations] = useState([]);
  const [pendingOrders,setPendingOrders]= useState([]); // commandes en attente paiement

  // ── UI state ──
  const [cart,         setCart]         = useState([]);
  const [cat,          setCat]          = useState("Tout");
  const [search,       setSearch]       = useState("");
  const [loading,      setLoading]      = useState(true);
  const [modal,        setModal]        = useState(null);
  const [selSale,      setSelSale]      = useState(null);
  const [selTable,     setSelTable]     = useState(null);
  const [selProduct,   setSelProduct]   = useState(null);
  const [selClient,    setSelClient]    = useState(null);
  const [orderType,    setOrderType]    = useState("sur_place");
  const [toast,        setToast]        = useState(null);
  const [dbStatus,     setDbStatus]     = useState("checking");
  const [reportPeriod, setReportPeriod] = useState("Aujourd'hui");
  const [reportTab,    setReportTab]    = useState("perf");
  const [zClosed,      setZClosed]      = useState(false);
  const [ingSearch,    setIngSearch]    = useState("");
  const [imgPreview,   setImgPreview]   = useState("");
  const [pendingTab,   setPendingTab]   = useState(null); // id de commande en attente sélectionnée

  // ── Forms ──
  const [newP,  setNewP]  = useState({name:"",cat:"Plats",price:"",cost:"",stock:"",img:"🍽️",img_url:""});
  const [newI,  setNewI]  = useState({name:"",unit:"kg",stock:"",stock_min:"",cost_unit:""});
  const [newR,  setNewR]  = useState({ingredient_id:"",quantite:""});
  const [newCl, setNewCl] = useState({name:"",phone:"",email:"",points:0});
  const [newEmp,setNewEmp]= useState({name:"",pin:"",role:"employee"});
  const [newRes,setNewRes]= useState({client_name:"",date:"",time:"",people:2,note:"",items:[]});
  const [newResItem,setNewResItem]=useState({product_id:"",qty:1});
  const [cancelNote, setCancelNote] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);

  // ── Payment ──
  const [payMode,  setPayMode]  = useState("simple");
  const [method1,  setMethod1]  = useState("Espèces");
  const [method2,  setMethod2]  = useState("Wave");
  const [amount1,  setAmount1]  = useState("");
  const [amount2,  setAmount2]  = useState("");
  const [discount, setDiscount] = useState(0);
  const [glovoPayType, setGlovoPayType] = useState("encaissement"); // encaissement|cash|differe

  // ── Shop ──
  const [shopInfo, setShopInfo] = useState({name:"HIT Fast Food",address:"Grand-Bassam, Côte d'Ivoire",phone:""});
  const [editShop, setEditShop] = useState(false);

  const fileInputRef = useRef(null);
  const kdsInterval  = useRef(null);

  const showToast = (msg, err=false) => { setToast({msg,err}); setTimeout(()=>setToast(null),2800); };

  const role = currentUser?.role || "employee";

  useEffect(()=>{
    if(currentUser){ loadAll(); kdsInterval.current=setInterval(()=>{if(page==="cuisine")loadOrders();},8000); }
    return()=>clearInterval(kdsInterval.current);
  },[currentUser]);

  useEffect(()=>{ if(page==="cuisine"&&currentUser) loadOrders(); },[page]);

  const loadAll = async () => {
    setLoading(true);
    try {
      let prods = await sb.get("products");
      if(prods?.code){ setDbStatus("error"); showToast("Erreur DB: "+prods.message,true); setLoading(false); return; }
      if(!prods||prods.length===0){ for(const p of DEFAULT_PRODUCTS) await sb.insert("products",p); prods=await sb.get("products"); }
      setProducts(Array.isArray(prods)?prods:[]);
      const s=await sb.get("sales"); setSales(Array.isArray(s)?s:[]);
      const t=await sb.get("tables_restaurant","&order=numero.asc"); setTables(Array.isArray(t)?t:[]);
      const ing=await sb.get("ingredients","&order=name.asc"); setIngredients(Array.isArray(ing)?ing:[]);
      const rec=await sb.get("recettes"); setRecettes(Array.isArray(rec)?rec:[]);
      // Clients
      let cl = await sb.get("clients").catch(()=>[]); setClients(Array.isArray(cl)?cl:[]);
      // Pertes
      let pt = await sb.get("pertes").catch(()=>[]); setPertes(Array.isArray(pt)?pt:[]);
      // Réservations
      let rs = await sb.get("reservations").catch(()=>[]); setReservations(Array.isArray(rs)?rs:[]);
      // Employés sauvegardés
      let emps = await sb.get("employees").catch(()=>[]);
      if(Array.isArray(emps)&&emps.length>0) setEmployees(emps);
      setDbStatus("ok");
    } catch(e){ setDbStatus("error"); showToast("Erreur connexion",true); }
    setLoading(false);
  };

  const loadOrders = async () => {
    const o=await sb.get("orders","&statut=neq.servi&order=created_at.asc");
    setOrders(Array.isArray(o)?o:[]);
    for(const ord of (Array.isArray(o)?o:[])){
      const items=await sb.getBy("order_items","order_id",ord.id);
      setOrderItems(prev=>({...prev,[ord.id]:items}));
    }
  };

  const loadSaleItems = async (saleId) => {
    if(saleItems[saleId]) return;
    const items=await sb.getBy("sale_items","sale_id",saleId);
    setSaleItems(prev=>({...prev,[saleId]:items}));
  };

  const handleImageFile = (file) => {
    if(!file) return;
    const reader=new FileReader();
    reader.onload=(e)=>{ const b64=e.target.result; setImgPreview(b64); setNewP(p=>({...p,img_url:b64})); };
    reader.readAsDataURL(file);
  };

  // ── Panier ──
  const filtered = products.filter(p=>(cat==="Tout"||p.cat===cat)&&p.name.toLowerCase().includes(search.toLowerCase()));
  const cartSub   = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const cartTotal = Math.max(0,cartSub-Number(discount||0));
  const paid1     = Number(amount1||0);
  const paid2     = Number(amount2||0);
  const totalPaid = payMode==="mixte"?paid1+paid2:paid1;
  const change    = payMode==="simple"&&method1==="Espèces"?Math.max(0,paid1-cartTotal):payMode==="mixte"?Math.max(0,totalPaid-cartTotal):0;
  const methodLabel = payMode==="mixte"?`Mixte (${method1} ${fmt(paid1)}F + ${method2} ${fmt(paid2)}F)`:method1;

  const addToCart = p => {
    if(p.stock<=0){showToast("Stock épuisé",true);return;}
    setCart(prev=>{const ex=prev.find(i=>i.id===p.id);return ex?prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i):[...prev,{...p,qty:1}];});
  };
  const updateQty  = (id,d) => setCart(prev=>prev.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+d)}:i));
  const removeItem = id     => setCart(prev=>prev.filter(i=>i.id!==id));

  // ── Mettre une commande en attente de paiement ──
  const putOnHold = () => {
    if(!cart.length) return;
    const holdId = Date.now();
    const hold = {
      id: holdId,
      label: selTable?selTable.label:`Attente ${pendingOrders.length+1}`,
      table: selTable,
      orderType,
      cart:[...cart],
      cartTotal,
      discount,
      method: methodLabel,
      createdAt: new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}),
    };
    setPendingOrders(prev=>[...prev,hold]);
    setCart([]); setDiscount(0); setAmount1(""); setAmount2(""); setSelTable(null);
    showToast(`Commande mise en attente ✓`);
  };

  const resumePending = (hold) => {
    setCart(hold.cart);
    setDiscount(hold.discount||0);
    setSelTable(hold.table);
    setOrderType(hold.orderType);
    setPendingOrders(prev=>prev.filter(p=>p.id!==hold.id));
    setPendingTab(null);
    showToast(`Commande ${hold.label} reprise ✓`);
  };

  const cancelPending = (holdId) => {
    setPendingOrders(prev=>prev.filter(p=>p.id!==holdId));
    showToast("Commande annulée");
  };

  // ── Déduire ingrédients ──
  const deduireIngredients = async (cartItems) => {
    for(const item of cartItems){
      const recs=recettes.filter(r=>r.product_id===item.id);
      for(const r of recs){
        const ing=ingredients.find(i=>i.id===r.ingredient_id);
        if(ing){ const ns=Math.max(0,ing.stock-(r.quantite*item.qty)); await sb.update("ingredients",ing.id,{stock:ns}); }
      }
    }
  };

  const sendToKitchen = async () => {
    if(!cart.length) return;
    setLoading(true);
    try {
      const ref=`#CMD-${Date.now()}`;
      const [order]=await sb.insert("orders",{reference:ref,table_id:selTable?.id||null,type:orderType,statut:"en_attente",vendor:currentUser?.name||"Employé",note:""});
      if(order){ for(const i of cart) await sb.insert("order_items",{order_id:order.id,product_name:i.name,qty:i.qty,statut:"en_attente"}); }
      showToast("Commande envoyée en cuisine ✓");
      setModal("confirm_pay");
    } catch{ showToast("Erreur envoi cuisine",true); }
    setLoading(false);
  };

  const confirmSale = async () => {
    if(!cart.length) return;
    if(payMode==="mixte"&&totalPaid<cartTotal){showToast("Montant insuffisant",true);return;}
    // Glovo non cash = juste enregistrer sans bloquer
    if(method1==="Glovo"&&glovoPayType==="differe"){ showToast("Vente Glovo différée enregistrée ✓"); }
    setLoading(true);
    try {
      const ref=`#VTE-${String(sales.length+1).padStart(6,"0")}`;
      const finalMethod = method1==="Glovo"?`Glovo (${glovoPayType==="cash"?"Cash à livraison":glovoPayType==="differe"?"Différé":"Encaissement hebdo"})`:methodLabel;
      const [sale]=await sb.insert("sales",{
        reference:ref, client:selClient?.name||"Client de passage",
        method:finalMethod, vendor:currentUser?.name||"Employé",
        discount:Number(discount||0), total:cartTotal,
        client_id:selClient?.id||null
      });
      if(sale){
        for(const i of cart) await sb.insert("sale_items",{sale_id:sale.id,name:i.name,qty:i.qty,price:i.price,cost:i.cost});
        for(const i of cart){const p=products.find(x=>x.id===i.id);if(p) await sb.update("products",p.id,{stock:Math.max(0,p.stock-i.qty)});}
        await deduireIngredients(cart);
        if(selTable) await sb.update("tables_restaurant",selTable.id,{statut:"libre"});
        // Points fidélité
        if(selClient){ const pts=Math.floor(cartTotal/1000); await sb.update("clients",selClient.id,{points:(selClient.points||0)+pts}); }
      }
      await loadAll();
      setSelSale(sale);
      setSaleItems(prev=>({...prev,[sale?.id]:cart.map(i=>({name:i.name,qty:i.qty,price:i.price,cost:i.cost}))}));
      setCart([]); setDiscount(0); setAmount1(""); setAmount2(""); setSelTable(null); setSelClient(null);
      setModal("receipt"); showToast("Vente enregistrée ✓");
    } catch{ showToast("Erreur vente",true); }
    setLoading(false);
  };

  // ── Annulation commande → Pertes ──
  const cancelOrder = async () => {
    if(!cancelTarget||!cancelNote.trim()){showToast("Précisez le motif",true);return;}
    setLoading(true);
    try {
      const perte = {
        reference: cancelTarget.reference||`#ANN-${Date.now()}`,
        items: JSON.stringify(cancelTarget.items||[]),
        total: cancelTarget.total||0,
        motif: cancelNote,
        vendor: currentUser?.name||"Employé",
      };
      await sb.insert("pertes", perte);
      if(cancelTarget.saleId) await sb.del("sales",cancelTarget.saleId);
      await loadAll();
      setModal(null); setCancelNote(""); setCancelTarget(null);
      showToast("Commande annulée → Pertes ✓");
    } catch{ showToast("Erreur annulation",true); }
    setLoading(false);
  };

  const updateOrderStatut = async (orderId, statut) => {
    await sb.update("orders",orderId,{statut});
    setOrders(prev=>prev.map(o=>o.id===orderId?{...o,statut}:o));
  };
  const updateItemStatut = async (itemId, orderId, statut) => {
    await sb.update("order_items",itemId,{statut});
    setOrderItems(prev=>({...prev,[orderId]:prev[orderId].map(i=>i.id===itemId?{...i,statut}:i)}));
  };

  const selectTable = async (t) => {
    setSelTable(t);
    if(t.statut==="libre") await sb.update("tables_restaurant",t.id,{statut:"occupée"});
    await loadAll(); setPage("caisse");
    showToast(`Table ${t.label} sélectionnée`);
  };

  const addProduct = async () => {
    if(!newP.name||!newP.price||!newP.stock){showToast("Champs manquants",true);return;}
    setLoading(true);
    await sb.insert("products",{...newP,price:Number(newP.price),cost:Number(newP.cost||0),stock:Number(newP.stock)});
    setNewP({name:"",cat:"Plats",price:"",cost:"",stock:"",img:"🍽️",img_url:""}); setImgPreview("");
    await loadAll(); setModal(null); showToast("Produit ajouté ✓");
    setLoading(false);
  };

  const addIngredient = async () => {
    if(!newI.name||!newI.stock){showToast("Champs manquants",true);return;}
    setLoading(true);
    await sb.insert("ingredients",{...newI,stock:Number(newI.stock),stock_min:Number(newI.stock_min||0),cost_unit:Number(newI.cost_unit||0)});
    setNewI({name:"",unit:"kg",stock:"",stock_min:"",cost_unit:""});
    await loadAll(); setModal(null); showToast("Ingrédient ajouté ✓");
    setLoading(false);
  };

  const addRecette = async () => {
    if(!selProduct||!newR.ingredient_id||!newR.quantite){showToast("Champs manquants",true);return;}
    setLoading(true);
    await sb.insert("recettes",{product_id:selProduct.id,ingredient_id:newR.ingredient_id,quantite:Number(newR.quantite)});
    setNewR({ingredient_id:"",quantite:""});
    await loadAll(); showToast("Ingrédient ajouté à la recette ✓");
    setLoading(false);
  };

  const addClient = async () => {
    if(!newCl.name){showToast("Nom requis",true);return;}
    setLoading(true);
    await sb.insert("clients",{...newCl,points:0});
    setNewCl({name:"",phone:"",email:"",points:0});
    await loadAll(); setModal(null); showToast("Client ajouté ✓");
    setLoading(false);
  };

  const addEmployee = async () => {
    if(!newEmp.name||!newEmp.pin){showToast("Nom et PIN requis",true);return;}
    const updatedEmps=[...employees,{...newEmp,active:true}];
    setEmployees(updatedEmps);
    await sb.insert("employees",{...newEmp,active:true}).catch(()=>{});
    setNewEmp({name:"",pin:"",role:"employee"}); setModal(null); showToast("Employé ajouté ✓");
  };

  const addReservation = async () => {
    if(!newRes.client_name||!newRes.date){showToast("Champs manquants",true);return;}
    setLoading(true);
    await sb.insert("reservations",{...newRes,items:JSON.stringify(newRes.items),statut:"confirmée"}).catch(()=>{});
    setNewRes({client_name:"",date:"",time:"",people:2,note:"",items:[]});
    await loadAll(); setModal(null); showToast("Réservation ajoutée ✓");
    setLoading(false);
  };

  const deleteRecette = async (id) => { await sb.del("recettes",id); await loadAll(); showToast("Supprimé ✓"); };
  const updateIngredientStock = async (id, ns) => { await sb.update("ingredients",id,{stock:Number(ns)}); await loadAll(); showToast("Stock mis à jour ✓"); };

  // ── Clôture Z ──
  const doClotureZ = async () => {
    const todaySales = sales.filter(s=>s.created_at&&new Date(s.created_at).toDateString()===today());
    const total = todaySales.reduce((s,r)=>s+(r.total||0),0);
    await sb.insert("clotures_z",{date:new Date().toISOString(),total,nb_transactions:todaySales.length,vendor:currentUser?.name||"Admin"}).catch(()=>{});
    setZClosed(true);
    showToast(`Clôture Z effectuée — ${fmt(total)} F ✓`);
    printReport(sales,"Aujourd'hui",shopInfo,employees);
  };

  // ── Stats ──
  const totalRev  = sales.reduce((s,r)=>s+(r.total||0),0);
  const todayRev  = sales.filter(s=>s.created_at&&new Date(s.created_at).toDateString()===today()).reduce((s,r)=>s+(r.total||0),0);
  const glovoRev  = sales.filter(s=>s.method?.includes("Glovo")).reduce((s,r)=>s+(r.total||0),0);
  const ingCritiques = ingredients.filter(i=>i.stock<=i.stock_min);

  const periodSales = filterByPeriod(sales, reportPeriod);

  // Top 5 produits
  const top5 = (() => {
    const counts = {};
    sales.forEach(sale=>{ (saleItems[sale.id]||[]).forEach(item=>{ counts[item.name]=(counts[item.name]||0)+(item.price*(item.qty||1)); }); });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,v])=>({name,v}));
  })();

  // Meilleur vendeur
  const bestVendor = (() => {
    const vmap = {};
    periodSales.forEach(s=>{ vmap[s.vendor]=(vmap[s.vendor]||0)+(s.total||0); });
    const sorted = Object.entries(vmap).sort((a,b)=>b[1]-a[1]);
    return sorted[0]||null;
  })();

  // Graphique performances (7 derniers jours)
  const perfData = (() => {
    const days = [];
    for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); days.push(d); }
    return days.map(d=>({
      label: d.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit"}),
      ventes: sales.filter(s=>s.created_at&&new Date(s.created_at).toDateString()===d.toDateString()).reduce((s,r)=>s+(r.total||0),0),
    }));
  })();

  // ── NAV ──
  const ADMIN_NAV = [
    {k:"caisse",i:"🏪",l:"Caisse"},
    {k:"tables",i:"🪑",l:"Tables"},
    {k:"cuisine",i:"👨‍🍳",l:"Cuisine"},
    {k:"produits",i:"📋",l:"Produits"},
    {k:"ingredients",i:"🧂",l:"Ingrédients"},
    {k:"recettes",i:"📖",l:"Recettes"},
    {k:"ventes",i:"💳",l:"Ventes"},
    {k:"stock",i:"📦",l:"Stock"},
    {k:"clients",i:"👥",l:"Clients"},
    {k:"reservations",i:"📅",l:"Réservations"},
    {k:"pertes",i:"🗑️",l:"Pertes"},
    {k:"employes",i:"👔",l:"Employés"},
    {k:"rapports",i:"📊",l:"Rapports"},
    {k:"parametres",i:"⚙️",l:"Paramètres"},
  ];
  const EMP_NAV = [
    {k:"caisse",i:"🏪",l:"Caisse"},
    {k:"tables",i:"🪑",l:"Tables"},
    {k:"cuisine",i:"👨‍🍳",l:"Cuisine"},
    {k:"ventes",i:"💳",l:"Ventes"},
    {k:"clients",i:"👥",l:"Clients"},
    {k:"reservations",i:"📅",l:"Réservations"},
  ];
  const nav = role==="admin" ? ADMIN_NAV : EMP_NAV;
  const filteredIng = ingredients.filter(i=>i.name.toLowerCase().includes(ingSearch.toLowerCase()));

  const MBtn = ({m,active,onClick,color}) => (
    <button onClick={onClick} style={{flex:1,padding:"5px 3px",border:`1px solid ${active?(color||C.accent):C.border}`,borderRadius:6,
      cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap",
      background:active?(color||C.accent):"transparent",color:active?"#fff":C.muted}}>
      {m==="Wave"?"〰 Wave":m==="Orange Money"?"🟠 OM":m==="Glovo"?"🛵 Glovo":m}
    </button>
  );

  // ─── LOGIN SCREEN ─────────────────────────────────────────────────────────
  if(!currentUser) {
    return <LoginScreen employees={employees} onLogin={(emp)=>{ setCurrentUser(emp); showToast(`Bienvenue ${emp.name} !`); }} darkMode={darkMode} C={C} S={S}/>;
  }

  // ─── TOPBAR ───────────────────────────────────────────────────────────────
  const Topbar = () => (
    <div style={{display:"flex",alignItems:"center",padding:"0 16px",height:54,background:C.topbar,borderBottom:`1px solid ${C.topbarBorder}`,flexShrink:0,gap:12,boxShadow:darkMode?"none":"0 1px 3px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
        <AmlyLogo size={34}/>
        <div style={{lineHeight:1.1}}>
          <div style={{fontWeight:800,fontSize:13,color:C.accent,letterSpacing:"0.04em"}}>AMLY-POS</div>
          <div style={{fontSize:9,color:C.muted,fontWeight:600,letterSpacing:"0.08em"}}>HIT FAST FOOD</div>
        </div>
        {loading&&<span style={{fontSize:10,color:C.accent,marginLeft:4}}>⏳</span>}
        <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:8}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:dbStatus==="ok"?C.green:C.red,flexShrink:0}}></span>
          <span style={{fontSize:9,color:dbStatus==="ok"?C.green:C.red}}>{dbStatus==="ok"?"Connecté":"Erreur"}</span>
        </div>
        {ingCritiques.length>0&&(
          <div style={{background:`${C.red}18`,border:`1px solid ${C.red}`,borderRadius:6,padding:"2px 8px",fontSize:10,color:C.red,fontWeight:700}}>
            ⚠️ {ingCritiques.length} rupture{ingCritiques.length>1?"s":""}
          </div>
        )}
        {pendingOrders.length>0&&(
          <div style={{background:`${C.orange}18`,border:`1px solid ${C.orange}`,borderRadius:6,padding:"2px 8px",fontSize:10,color:C.orange,fontWeight:700,cursor:"pointer"}} onClick={()=>setModal("pendingList")}>
            ⏳ {pendingOrders.length} en attente
          </div>
        )}
      </div>
      <div style={{flex:1}}/>
      <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        {selTable&&<div style={{background:C.accentBg,border:`1px solid ${C.accent}`,borderRadius:8,padding:"3px 10px",fontSize:11,color:C.accent,fontWeight:700}}>🪑 {selTable.label}</div>}
        <div style={{background:orderType==="sur_place"?`${C.green}18`:`${C.blue}18`,border:`1px solid ${orderType==="sur_place"?C.green:C.blue}`,borderRadius:8,padding:"3px 10px",fontSize:11,color:orderType==="sur_place"?C.green:C.blue,fontWeight:700,cursor:"pointer"}} onClick={()=>setOrderType(t=>t==="sur_place"?"emporter":"sur_place")}>
          {orderType==="sur_place"?"🍽 Sur place":"🥡 Emporter"}
        </div>
        <div style={{textAlign:"right",borderLeft:`1px solid ${C.border}`,paddingLeft:10}}>
          <div style={{fontSize:9,color:C.muted,fontWeight:600}}>AUJOURD'HUI</div>
          <div style={{fontSize:12,fontWeight:800,color:C.accent}}>{fmt(todayRev)} F</div>
        </div>
        <button onClick={()=>setDarkMode(d=>!d)}
          style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,border:`1px solid ${C.border}`,cursor:"pointer",background:C.surface2,color:C.txt,fontSize:11,fontWeight:600}}>
          {darkMode?"☀️":"🌙"}
        </button>
        {/* User info + logout */}
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",background:C.surface2,borderRadius:10,border:`1px solid ${C.border}`}}>
          <div style={{width:24,height:24,borderRadius:"50%",background:role==="admin"?C.accent:C.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700,flexShrink:0}}>
            {currentUser.name[0].toUpperCase()}
          </div>
          <span style={{fontSize:11,fontWeight:600,color:C.txt}}>{currentUser.name}</span>
          <span style={{fontSize:9,color:C.muted}}>{role==="admin"?"👑":"👤"}</span>
          <button onClick={()=>{ setCurrentUser(null); setPage("caisse"); setCart([]); }}
            style={{background:"none",border:"none",cursor:"pointer",color:C.red,fontSize:11,marginLeft:4,fontWeight:700}} title="Déconnexion">⏏</button>
        </div>
      </div>
    </div>
  );

  // ─── SIDEBAR ──────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <div style={{width:165,background:C.sidebar,display:"flex",flexDirection:"column",padding:"12px 0",flexShrink:0,overflowY:"auto"}}>
      {nav.map(n=>(
        <div key={n.k} onClick={()=>setPage(n.k)}
          style={{display:"flex",alignItems:"center",gap:9,padding:"9px 14px",cursor:"pointer",fontSize:11,
            borderLeft:page===n.k?`3px solid ${C.accentL}`:"3px solid transparent",
            background:page===n.k?C.sidebarActiveBg:"transparent",
            color:page===n.k?"#fff":C.sidebarText,fontWeight:page===n.k?700:400}}>
          <span style={{fontSize:13}}>{n.i}</span><span>{n.l}</span>
          {n.k==="cuisine"&&orders.filter(o=>o.statut==="en_attente").length>0&&(
            <span style={{marginLeft:"auto",background:C.red,color:"#fff",borderRadius:10,fontSize:9,fontWeight:700,padding:"1px 5px"}}>{orders.filter(o=>o.statut==="en_attente").length}</span>
          )}
          {n.k==="ingredients"&&ingCritiques.length>0&&(
            <span style={{marginLeft:"auto",background:C.red,color:"#fff",borderRadius:10,fontSize:9,fontWeight:700,padding:"1px 5px"}}>{ingCritiques.length}</span>
          )}
        </div>
      ))}
      <div style={{marginTop:"auto",padding:"12px 14px",borderTop:`1px solid rgba(255,255,255,0.08)`}}>
        <div style={{fontSize:11,color:"#fff",fontWeight:700}}>{currentUser.name}</div>
        <div style={{fontSize:10,color:C.sidebarText,marginTop:1}}>{role==="admin"?"Administrateur":"Employé"}</div>
        <div style={{display:"flex",alignItems:"center",gap:4,marginTop:4}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:dbStatus==="ok"?C.green:C.red}}></span>
          <span style={{fontSize:10,color:dbStatus==="ok"?C.green:C.red}}>{dbStatus==="ok"?"En ligne":"Hors ligne"}</span>
        </div>
      </div>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:"system-ui,sans-serif",background:C.bg,color:C.txt,minHeight:"100vh",display:"flex",flexDirection:"column",fontSize:14,transition:"background 0.2s,color 0.2s"}}>
      <Topbar/>
      {toast&&<div style={{position:"fixed",top:62,right:18,zIndex:9999,background:toast.err?"#7f1d1d":"#14532d",color:toast.err?"#fca5a5":"#86efac",padding:"8px 16px",borderRadius:10,fontWeight:600,fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>{toast.msg}</div>}

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <Sidebar/>
        <div style={{flex:1,overflow:"hidden",display:"flex"}}>

          {/* ══ CAISSE ══ */}
          {page==="caisse"&&(
            <div style={{display:"flex",flex:1,overflow:"hidden"}}>
              <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  {["sur_place","emporter"].map(t=>(
                    <button key={t} onClick={()=>setOrderType(t)} style={{flex:1,padding:"9px",borderRadius:9,border:`2px solid ${orderType===t?(t==="sur_place"?C.green:C.blue):C.border}`,cursor:"pointer",fontWeight:700,fontSize:12,background:orderType===t?(t==="sur_place"?`${C.green}15`:`${C.blue}15`):"transparent",color:orderType===t?(t==="sur_place"?C.green:C.blue):C.muted}}>
                      {t==="sur_place"?"🍽️ Sur place":"🥡 Emporter"}
                    </button>
                  ))}
                  {orderType==="sur_place"&&(
                    <button onClick={()=>setPage("tables")} style={{flex:1,padding:"9px",borderRadius:9,border:`2px solid ${selTable?C.accent:C.border}`,cursor:"pointer",fontWeight:700,fontSize:12,background:selTable?C.accentBg:"transparent",color:selTable?C.accent:C.muted}}>
                      {selTable?`🪑 ${selTable.label}`:"🪑 Choisir table"}
                    </button>
                  )}
                </div>

                {/* Commandes en attente badge */}
                {pendingOrders.length>0&&(
                  <div style={{background:`${C.orange}12`,border:`1px solid ${C.orange}40`,borderRadius:9,padding:"8px 12px",marginBottom:10,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:11,color:C.orange,fontWeight:700}}>⏳ En attente de paiement :</span>
                    {pendingOrders.map(h=>(
                      <div key={h.id} style={{display:"flex",gap:4,alignItems:"center"}}>
                        <button onClick={()=>resumePending(h)} style={{background:C.orange,color:"#fff",border:"none",borderRadius:6,padding:"3px 10px",cursor:"pointer",fontSize:11,fontWeight:700}}>{h.label} — {fmt(h.cartTotal)} F ▶</button>
                        <button onClick={()=>{setCancelTarget({reference:h.label,items:h.cart,total:h.cartTotal});setModal("cancel");cancelPending(h.id);}} style={{background:`${C.red}20`,color:C.red,border:"none",borderRadius:5,padding:"3px 7px",cursor:"pointer",fontSize:11}}>✕</button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
                  <input style={{...S.input,flex:1}} placeholder="🔍 Rechercher un plat, boisson…" value={search} onChange={e=>setSearch(e.target.value)}/>
                  {role==="admin"&&(
                    <button style={{...S.btnG,width:"auto",padding:"8px 14px",whiteSpace:"nowrap",fontSize:12}} onClick={()=>{setImgPreview("");setModal("addProd");}}>+ Produit</button>
                  )}
                </div>

                <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
                  {CATS.map(c=>(
                    <button key={c} onClick={()=>setCat(c)} style={{padding:"5px 14px",borderRadius:16,border:`1px solid ${cat===c?C.accent:C.border}`,cursor:"pointer",fontSize:11,fontWeight:600,background:cat===c?C.accent:"transparent",color:cat===c?"#fff":C.muted}}>
                      {c==="Tout"?"🍽 Tous":c==="Plats"?"🥘 Plats":c==="Boissons"?"🥤 Boissons":"🍰 Desserts"}
                    </button>
                  ))}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10}}>
                  {filtered.map(p=>(
                    <div key={p.id} onClick={()=>addToCart(p)}
                      style={{background:C.cardBg,border:`1px solid ${C.cardBorder}`,borderRadius:12,padding:10,cursor:p.stock>0?"pointer":"not-allowed",textAlign:"center",opacity:p.stock===0?0.45:1,display:"flex",flexDirection:"column",gap:4,boxShadow:C.shadow,transition:"all .15s"}}
                      onMouseEnter={e=>{if(p.stock>0){e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.transform="translateY(-2px)";}}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.cardBorder;e.currentTarget.style.transform="none";}}>
                      {p.img_url?<img src={p.img_url} alt={p.name} style={{width:"100%",height:72,objectFit:"cover",borderRadius:8}}/>
                        :<div style={{fontSize:32,height:72,display:"flex",alignItems:"center",justifyContent:"center",background:C.surface2,borderRadius:8}}>{p.img}</div>}
                      <div style={{fontSize:11,fontWeight:600,lineHeight:1.3,color:C.txt}}>{p.name}</div>
                      <div style={{fontSize:12,fontWeight:800,color:C.accent}}>{fmt(p.price)} F</div>
                      <div style={{fontSize:10,color:p.stock<5?C.red:C.muted}}>Stock: {p.stock}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Panier ── */}
              <div style={{width:295,background:C.surface,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <div style={{padding:"10px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontWeight:800,fontSize:13,color:C.txt}}>🧾 Commande</span>
                  {/* Sélectionner client */}
                  <button onClick={()=>setModal("selClient")} style={{background:selClient?C.accentBg:"transparent",border:`1px solid ${selClient?C.accent:C.border}`,borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:10,color:selClient?C.accent:C.muted,fontWeight:600}}>
                    {selClient?`👤 ${selClient.name}`:"+ Client"}
                  </button>
                </div>

                {cart.length===0?(
                  <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:C.muted,gap:8}}>
                    <span style={{fontSize:32}}>🛒</span><span style={{fontSize:12}}>Panier vide</span>
                  </div>
                ):(
                  <div style={{flex:1,overflow:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse"}}>
                      <thead><tr>
                        <th style={S.th}>Produit</th>
                        <th style={{...S.th,textAlign:"center"}}>Qté</th>
                        <th style={{...S.th,textAlign:"right"}}>Prix</th>
                        <th style={S.th}></th>
                      </tr></thead>
                      <tbody>
                        {cart.map(i=>(
                          <tr key={i.id}>
                            <td style={{...S.td,fontSize:10,paddingLeft:8}}>{i.img} {i.name}</td>
                            <td style={{...S.td,textAlign:"center"}}>
                              <div style={{display:"flex",alignItems:"center",gap:2,justifyContent:"center"}}>
                                <button onClick={()=>updateQty(i.id,-1)} style={{width:18,height:18,borderRadius:4,border:`1px solid ${C.border}`,background:C.surface2,color:C.txt,cursor:"pointer",fontSize:11}}>−</button>
                                <span style={{fontSize:11,fontWeight:700,minWidth:14,textAlign:"center"}}>{i.qty}</span>
                                <button onClick={()=>updateQty(i.id,1)}  style={{width:18,height:18,borderRadius:4,border:`1px solid ${C.border}`,background:C.surface2,color:C.txt,cursor:"pointer",fontSize:11}}>+</button>
                              </div>
                            </td>
                            <td style={{...S.td,textAlign:"right",color:C.accent,fontWeight:700,fontSize:10}}>{fmt(i.price*i.qty)}</td>
                            <td style={S.td}><button onClick={()=>removeItem(i.id)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:11}}>✕</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{padding:10,borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:7}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}>
                    <span>Sous-total</span><span>{fmt(cartSub)} F</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11}}>
                    <span style={{color:C.muted}}>Remise</span>
                    <input style={{...S.input,width:72,textAlign:"right",padding:"3px 7px",fontSize:11}} type="number" value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="0"/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15,padding:"4px 0",borderTop:`1px solid ${C.border}`}}>
                    <span>Total</span><span style={{color:C.green}}>{fmt(cartTotal)} F</span>
                  </div>

                  {/* Mode paiement */}
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>setPayMode("simple")} style={{flex:1,padding:"4px",border:`1px solid ${payMode==="simple"?C.accent:C.border}`,borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600,background:payMode==="simple"?C.accent:"transparent",color:payMode==="simple"?"#fff":C.muted}}>Simple</button>
                    <button onClick={()=>setPayMode("mixte")} style={{flex:1,padding:"4px",border:`1px solid ${payMode==="mixte"?C.blue:C.border}`,borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600,background:payMode==="mixte"?C.blue:"transparent",color:payMode==="mixte"?"#fff":C.muted}}>💰 Mixte</button>
                  </div>

                  {payMode==="simple"&&(
                    <>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                        {METHODS.map(m=><MBtn key={m} m={m} active={method1===m} onClick={()=>setMethod1(m)}/>)}
                      </div>
                      {method1==="Espèces"&&(
                        <>
                          <input style={{...S.input,fontSize:11,padding:"6px 9px"}} type="number" placeholder="Montant reçu (F)" value={amount1} onChange={e=>setAmount1(e.target.value)}/>
                          {amount1&&change>0&&<div style={{background:`${C.green}15`,border:`1px solid ${C.green}40`,borderRadius:6,padding:"5px 8px",fontSize:11}}>Monnaie : <strong style={{color:C.green}}>{fmt(change)} F</strong></div>}
                        </>
                      )}
                      {method1==="Glovo"&&(
                        <div style={{background:`${C.orange}12`,border:`1px solid ${C.orange}40`,borderRadius:7,padding:"8px 10px"}}>
                          <div style={{fontSize:10,color:C.orange,fontWeight:700,marginBottom:6}}>🛵 Mode Glovo</div>
                          <div style={{display:"flex",gap:4}}>
                            {[{k:"encaissement",l:"Hebdo"},{k:"cash",l:"Cash livr."},{k:"differe",l:"Différé"}].map(g=>(
                              <button key={g.k} onClick={()=>setGlovoPayType(g.k)}
                                style={{flex:1,padding:"4px 3px",border:`1px solid ${glovoPayType===g.k?C.orange:C.border}`,borderRadius:5,cursor:"pointer",fontSize:9,fontWeight:600,background:glovoPayType===g.k?`${C.orange}25`:"transparent",color:glovoPayType===g.k?C.orange:C.muted}}>
                                {g.l}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {payMode==="mixte"&&(
                    <div style={{background:C.surface2,borderRadius:8,padding:8,display:"flex",flexDirection:"column",gap:5}}>
                      <div style={{fontSize:10,color:C.muted,fontWeight:600}}>Paiement 1</div>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{METHODS.map(m=><MBtn key={m} m={m} active={method1===m} onClick={()=>setMethod1(m)}/>)}</div>
                      <input style={{...S.input,fontSize:11,padding:"4px 8px"}} type="number" placeholder={`Montant ${method1} (F)`} value={amount1} onChange={e=>setAmount1(e.target.value)}/>
                      <div style={{fontSize:10,color:C.muted,fontWeight:600}}>Paiement 2</div>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{METHODS.filter(m=>m!==method1).map(m=><MBtn key={m} m={m} active={method2===m} onClick={()=>setMethod2(m)}/>)}</div>
                      <input style={{...S.input,fontSize:11,padding:"4px 8px"}} type="number" placeholder={`Montant ${method2} (F)`} value={amount2} onChange={e=>setAmount2(e.target.value)}/>
                      {(amount1||amount2)&&<div style={{borderTop:`1px solid ${C.border}`,paddingTop:4,fontSize:11}}>{totalPaid>=cartTotal?<div style={{color:C.green,fontWeight:700}}>✓ Rendu : {fmt(change)} F</div>:<div style={{color:C.red}}>⚠ Manque : {fmt(cartTotal-totalPaid)} F</div>}</div>}
                    </div>
                  )}

                  {/* Actions */}
                  <button style={{...S.btnB,...(!cart.length||loading?{opacity:.4,cursor:"not-allowed"}:{})}} onClick={()=>cart.length&&!loading&&sendToKitchen()}>👨‍🍳 Envoyer cuisine</button>
                  <button style={{...S.btnG,...(!cart.length||loading?{opacity:.4,cursor:"not-allowed"}:{})}} onClick={()=>cart.length&&!loading&&setModal("confirm")}>✓ Encaisser</button>
                  <div style={{display:"flex",gap:5}}>
                    <button style={{...S.btnO,flex:1,padding:"7px",fontSize:11}} onClick={putOnHold} disabled={!cart.length}>⏳ Mettre en attente</button>
                    <button style={{...S.btnR,flex:1,padding:"7px",fontSize:11}} onClick={()=>{if(cart.length){setCancelTarget({reference:"Commande en cours",items:cart,total:cartTotal});setModal("cancel");}}}>✕ Annuler</button>
                  </div>
                  <button style={{...S.btnO,padding:"5px",fontSize:10}} onClick={()=>setCart([])}>Vider panier</button>
                </div>
              </div>
            </div>
          )}

          {/* ══ TABLES ══ */}
          {page==="tables"&&(
            <div style={{flex:1,overflow:"auto",padding:20,background:C.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <span style={{fontWeight:800,fontSize:17,color:C.txt}}>🪑 Plan de salle</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:14}}>
                {tables.map(t=>(
                  <div key={t.id} style={{...S.card,cursor:"pointer",textAlign:"center",transition:"all .15s",borderColor:t.statut==="occupée"?C.accent:t.statut==="libre"?`${C.green}40`:C.cardBorder}}
                    onClick={()=>selectTable(t)}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="none";}}>
                    <div style={{fontSize:28,marginBottom:5}}>🪑</div>
                    <div style={{fontWeight:800,fontSize:16,color:C.txt}}>{t.label}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>{t.capacite} personnes</div>
                    <div style={{marginTop:7}}>
                      <span style={{display:"inline-block",padding:"3px 12px",borderRadius:10,fontSize:11,fontWeight:600,background:t.statut==="libre"?`${C.green}15`:`${C.accent}15`,color:t.statut==="libre"?C.green:C.accent}}>{t.statut}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ CUISINE ══ */}
          {page==="cuisine"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:darkMode?"#0a0a0a":C.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontWeight:800,fontSize:18,color:C.txt}}>👨‍🍳 Écran Cuisine</span>
                <button onClick={loadOrders} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 12px",cursor:"pointer",color:C.txt,fontSize:11}}>🔄 Rafraîchir</button>
              </div>
              {orders.length===0?(
                <div style={{textAlign:"center",padding:60,color:C.muted}}><div style={{fontSize:48,marginBottom:12}}>✅</div><div style={{fontSize:16,fontWeight:600}}>Aucune commande en attente</div></div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
                  {orders.map(order=>(
                    <div key={order.id} style={{background:order.statut==="en_attente"?(darkMode?"#1a0f00":"#fff8f0"):(darkMode?"#001a0f":"#f0fff8"),border:`2px solid ${order.statut==="en_attente"?C.orange:C.green}`,borderRadius:12,padding:14,display:"flex",flexDirection:"column",gap:10}}>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <span style={{fontWeight:800,fontSize:13,color:C.accent}}>{order.reference}</span>
                        <span style={{fontSize:10,color:C.muted}}>{order.created_at?new Date(order.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):""}</span>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {(orderItems[order.id]||[]).map(item=>(
                          <div key={item.id} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 7px",borderRadius:6,background:item.statut==="pret"?`${C.green}15`:C.surface2}}>
                            <span style={{fontSize:13,fontWeight:800,color:C.accent,minWidth:18}}>×{item.qty}</span>
                            <span style={{flex:1,fontSize:11,fontWeight:600,color:C.txt}}>{item.product_name}</span>
                            <button onClick={()=>updateItemStatut(item.id,order.id,item.statut==="pret"?"en_attente":"pret")}
                              style={{padding:"2px 7px",borderRadius:5,border:"none",cursor:"pointer",fontSize:10,fontWeight:700,background:item.statut==="pret"?C.green:C.surface,color:item.statut==="pret"?"#fff":C.muted}}>
                              {item.statut==="pret"?"✓":"Prêt"}
                            </button>
                          </div>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:5}}>
                        {order.statut==="en_attente"&&<button onClick={()=>updateOrderStatut(order.id,"en_preparation")} style={{flex:1,padding:"6px",borderRadius:7,border:"none",cursor:"pointer",background:C.orange,color:"#fff",fontWeight:700,fontSize:11}}>🔥 Démarrer</button>}
                        {order.statut==="en_preparation"&&<button onClick={()=>updateOrderStatut(order.id,"pret")} style={{flex:1,padding:"6px",borderRadius:7,border:"none",cursor:"pointer",background:C.green,color:"#fff",fontWeight:700,fontSize:11}}>✅ Prêt</button>}
                        {order.statut==="pret"&&<button onClick={()=>updateOrderStatut(order.id,"servi")} style={{flex:1,padding:"6px",borderRadius:7,border:"none",cursor:"pointer",background:C.surface2,color:C.muted,fontWeight:700,fontSize:11}}>Servi</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ INGRÉDIENTS ══ */}
          {page==="ingredients"&&role==="admin"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontWeight:700,fontSize:15,color:C.txt}}>🧂 Stock Ingrédients</span>
                <button style={{...S.btnG,width:"auto",padding:"7px 14px"}} onClick={()=>setModal("addIng")}>+ Ajouter</button>
              </div>
              {ingCritiques.length>0&&(
                <div style={{background:`${C.red}10`,border:`1px solid ${C.red}`,borderRadius:10,padding:12,marginBottom:14}}>
                  <div style={{fontWeight:700,color:C.red,marginBottom:8}}>⚠️ Stock critique</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {ingCritiques.map(i=><span key={i.id} style={{background:`${C.red}20`,color:C.red,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600}}>{i.name} — {i.stock} {i.unit}</span>)}
                  </div>
                </div>
              )}
              <input style={{...S.input,marginBottom:12}} placeholder="🔍 Rechercher…" value={ingSearch} onChange={e=>setIngSearch(e.target.value)}/>
              <div style={S.card}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["Ingrédient","Unité","Stock","Min","Coût/u","Statut","Modifier"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredIng.map(i=>{
                      const st=i.stock<=0?"Épuisé":i.stock<=i.stock_min?"Critique":"OK";
                      const sc=st==="Épuisé"?C.red:st==="Critique"?"#fbbf24":C.green;
                      return(
                        <tr key={i.id}>
                          <td style={{...S.td,fontWeight:600,color:C.txt}}>{i.name}</td>
                          <td style={{...S.td,color:C.muted}}>{i.unit}</td>
                          <td style={{...S.td,fontWeight:700,color:i.stock<=i.stock_min?C.red:C.txt}}>{i.stock}</td>
                          <td style={{...S.td,color:C.muted}}>{i.stock_min}</td>
                          <td style={{...S.td,color:C.muted}}>{fmt(i.cost_unit)} F</td>
                          <td style={S.td}><span style={{display:"inline-block",padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:600,background:`${sc}22`,color:sc}}>{st}</span></td>
                          <td style={S.td}><input type="number" defaultValue={i.stock} onBlur={e=>{if(Number(e.target.value)!==i.stock)updateIngredientStock(i.id,e.target.value);}} style={{...S.input,width:65,padding:"3px 6px",fontSize:11,textAlign:"center"}}/></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {page==="ingredients"&&role!=="admin"&&(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:C.muted}}>
              <span style={{fontSize:48}}>🔒</span>
              <span style={{fontWeight:700,fontSize:15}}>Accès réservé à l'administrateur</span>
            </div>
          )}

          {/* ══ RECETTES ══ */}
          {page==="recettes"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14,color:C.txt}}>📖 Gestion des Recettes</div>
              <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                <div style={{...S.card,width:210,flexShrink:0}}>
                  <div style={{fontWeight:700,marginBottom:10,fontSize:12,color:C.txt}}>Sélectionner un plat</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {products.map(p=>(
                      <div key={p.id} onClick={()=>setSelProduct(p)} style={{padding:"7px 9px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600,background:selProduct?.id===p.id?C.accentBg:"transparent",border:`1px solid ${selProduct?.id===p.id?C.accent:C.border}`,color:selProduct?.id===p.id?C.accent:C.txt}}>
                        {p.img} {p.name}
                        <div style={{fontSize:9,color:C.muted,fontWeight:400}}>{recettes.filter(r=>r.product_id===p.id).length} ing.</div>
                      </div>
                    ))}
                  </div>
                </div>
                {selProduct&&(
                  <div style={{flex:1,minWidth:280}}>
                    <div style={{...S.card,marginBottom:12}}>
                      <div style={{fontWeight:700,fontSize:13,marginBottom:12,color:C.accent}}>{selProduct.img} {selProduct.name}</div>
                      {recettes.filter(r=>r.product_id===selProduct.id).length===0?(
                        <div style={{color:C.muted,fontSize:12,textAlign:"center",padding:16}}>Aucun ingrédient défini</div>
                      ):(
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead><tr>{["Ingrédient","Quantité","Unité",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                          <tbody>
                            {recettes.filter(r=>r.product_id===selProduct.id).map(r=>{
                              const ing=ingredients.find(i=>i.id===r.ingredient_id);
                              return(<tr key={r.id}><td style={{...S.td,fontWeight:600,color:C.txt}}>{ing?.name||"?"}</td><td style={{...S.td,color:C.accent,fontWeight:700}}>{r.quantite}</td><td style={{...S.td,color:C.muted}}>{ing?.unit||""}</td><td style={S.td}><button onClick={()=>deleteRecette(r.id)} style={S.btnR}>✕</button></td></tr>);
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                    <div style={S.card}>
                      <div style={{fontWeight:700,marginBottom:9,fontSize:12,color:C.txt}}>+ Ajouter un ingrédient</div>
                      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                        <div style={{flex:2,minWidth:140}}>
                          <select style={S.input} value={newR.ingredient_id} onChange={e=>setNewR(p=>({...p,ingredient_id:e.target.value}))}>
                            <option value="">-- Choisir --</option>
                            {ingredients.map(i=><option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                          </select>
                        </div>
                        <div style={{flex:1,minWidth:70}}>
                          <input style={S.input} type="number" placeholder="Qté ex: 0.2" value={newR.quantite} onChange={e=>setNewR(p=>({...p,quantite:e.target.value}))}/>
                        </div>
                        <button style={{...S.btnG,width:"auto",padding:"8px 14px"}} onClick={addRecette}>Ajouter</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ PRODUITS ══ */}
          {page==="produits"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontWeight:700,fontSize:15,color:C.txt}}>Gestion des Produits</span>
                <button style={{...S.btnG,width:"auto",padding:"7px 14px"}} onClick={()=>{setImgPreview("");setModal("addProd");}}>+ Nouveau produit</button>
              </div>
              <div style={S.card}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["","Produit","Cat.","Coût","Prix","Marge","%","Stock"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {products.map(p=>{const mg=p.price-p.cost,pct=p.price>0?((mg/p.price)*100).toFixed(1):0;return(
                      <tr key={p.id}>
                        <td style={S.td}>{p.img_url?<img src={p.img_url} alt={p.name} style={{width:30,height:30,objectFit:"cover",borderRadius:5}}/>:<span style={{fontSize:18}}>{p.img}</span>}</td>
                        <td style={{...S.td,fontWeight:600,color:C.txt}}>{p.name}</td>
                        <td style={S.td}><span style={{display:"inline-block",padding:"2px 7px",borderRadius:8,fontSize:10,fontWeight:600,background:C.accentBg,color:C.accent}}>{p.cat}</span></td>
                        <td style={{...S.td,color:C.muted}}>{fmt(p.cost)} F</td>
                        <td style={{...S.td,color:C.accent,fontWeight:700}}>{fmt(p.price)} F</td>
                        <td style={{...S.td,color:C.green,fontWeight:700}}>{fmt(mg)} F</td>
                        <td style={{...S.td,color:C.green,fontWeight:700}}>{pct}%</td>
                        <td style={{...S.td,color:p.stock<5?C.red:C.txt}}>{p.stock}</td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ VENTES ══ */}
          {page==="ventes"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14,color:C.txt}}>Historique des Ventes</div>
              <div style={S.card}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["Référence","Date","Client","Vendeur","Mode","Montant",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {sales.map(sale=>(
                      <tr key={sale.id}>
                        <td style={{...S.td,color:C.accent,fontWeight:700}}>{sale.reference}</td>
                        <td style={{...S.td,color:C.muted,fontSize:10}}>{sale.created_at?new Date(sale.created_at).toLocaleString("fr-FR"):""}</td>
                        <td style={{...S.td,color:C.txt,fontSize:11}}>{sale.client||"—"}</td>
                        <td style={{...S.td,color:C.txt}}>{sale.vendor}</td>
                        <td style={S.td}><span style={{display:"inline-block",padding:"2px 7px",borderRadius:8,fontSize:10,fontWeight:600,background:`${C.blue}20`,color:C.blue}}>{sale.method}</span></td>
                        <td style={{...S.td,fontWeight:700,color:C.green}}>{fmt(sale.total)} F</td>
                        <td style={S.td}>
                          <div style={{display:"flex",gap:4}}>
                            <button onClick={async()=>{await loadSaleItems(sale.id);setSelSale(sale);setModal("receipt");}} style={{background:`${C.green}15`,color:C.green,border:"none",borderRadius:5,padding:"4px 7px",cursor:"pointer",fontSize:10,fontWeight:600}}>Ticket</button>
                            {role==="admin"&&<button onClick={()=>{setCancelTarget({reference:sale.reference,items:saleItems[sale.id]||[],total:sale.total,saleId:sale.id});setModal("cancel");}} style={{background:`${C.red}15`,color:C.red,border:"none",borderRadius:5,padding:"4px 7px",cursor:"pointer",fontSize:10,fontWeight:600}}>Annuler</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ STOCK ══ */}
          {page==="stock"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14,color:C.txt}}>📦 Stock Produits</div>
              <div style={S.card}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["","Produit","Cat.","Stock","Statut"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {products.map(p=>(
                      <tr key={p.id}>
                        <td style={S.td}>{p.img_url?<img src={p.img_url} alt={p.name} style={{width:26,height:26,objectFit:"cover",borderRadius:4}}/>:<span style={{fontSize:16}}>{p.img}</span>}</td>
                        <td style={{...S.td,fontWeight:600,color:C.txt}}>{p.name}</td>
                        <td style={{...S.td,color:C.muted}}>{p.cat}</td>
                        <td style={{...S.td,fontWeight:700,color:p.stock<5?C.red:C.txt}}>{p.stock}</td>
                        <td style={S.td}><span style={{display:"inline-block",padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:600,background:p.stock===0?`${C.red}20`:p.stock<5?`${C.orange}20`:`${C.green}20`,color:p.stock===0?C.red:p.stock<5?C.orange:C.green}}>{p.stock===0?"Épuisé":p.stock<5?"Faible":"En stock"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ CLIENTS ══ */}
          {page==="clients"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontWeight:700,fontSize:15,color:C.txt}}>👥 Clients & Fidélité</span>
                <button style={{...S.btnG,width:"auto",padding:"7px 14px"}} onClick={()=>setModal("addClient")}>+ Nouveau client</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12,marginBottom:16}}>
                {clients.map(cl=>(
                  <div key={cl.id} style={{...S.card,cursor:"pointer"}}
                    onClick={()=>{setSelClient(cl);showToast(`Client ${cl.name} sélectionné pour la vente`);setPage("caisse");}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                      <div style={{width:40,height:40,borderRadius:"50%",background:C.accentBg,border:`2px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>👤</div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:C.txt}}>{cl.name}</div>
                        <div style={{fontSize:11,color:C.muted}}>{cl.phone||"Sans tél."}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
                      <span style={{color:C.muted}}>Points fidélité</span>
                      <span style={{fontWeight:800,color:C.gold}}>⭐ {cl.points||0} pts</span>
                    </div>
                    <div style={{marginTop:6,background:C.surface2,borderRadius:6,height:6,overflow:"hidden"}}>
                      <div style={{width:`${Math.min(100,(cl.points||0)/10)}%`,background:C.gold,height:"100%",borderRadius:6,transition:"width .5s"}}></div>
                    </div>
                    <div style={{fontSize:9,color:C.muted,marginTop:3}}>Prochain palier : {Math.max(0,100-(cl.points||0)%100)} pts</div>
                  </div>
                ))}
                {clients.length===0&&<div style={{color:C.muted,fontSize:13,padding:20}}>Aucun client enregistré</div>}
              </div>
            </div>
          )}

          {/* ══ RÉSERVATIONS ══ */}
          {page==="reservations"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontWeight:700,fontSize:15,color:C.txt}}>📅 Réservations</span>
                <button style={{...S.btnG,width:"auto",padding:"7px 14px"}} onClick={()=>setModal("addReservation")}>+ Réservation</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {reservations.map(r=>(
                  <div key={r.id} style={{...S.card,borderLeft:`3px solid ${C.accent}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:C.txt}}>{r.client_name}</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2}}>{r.date} {r.time&&`à ${r.time}`} — {r.people} personnes</div>
                        {r.note&&<div style={{fontSize:11,color:C.txt,marginTop:4,fontStyle:"italic"}}>"{r.note}"</div>}
                      </div>
                      <span style={{display:"inline-block",padding:"3px 10px",borderRadius:8,fontSize:11,fontWeight:600,background:r.statut==="confirmée"?`${C.green}15`:`${C.orange}15`,color:r.statut==="confirmée"?C.green:C.orange}}>{r.statut||"confirmée"}</span>
                    </div>
                    {r.items&&JSON.parse(r.items||"[]").length>0&&(
                      <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:5}}>
                        {JSON.parse(r.items).map((item,i)=>(
                          <span key={i} style={{background:C.accentBg,color:C.accent,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600}}>{products.find(p=>p.id===item.product_id)?.name||"?"} ×{item.qty}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {reservations.length===0&&<div style={{color:C.muted,fontSize:13,padding:20}}>Aucune réservation</div>}
              </div>
            </div>
          )}

          {/* ══ PERTES ══ */}
          {page==="pertes"&&role==="admin"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14,color:C.txt}}>🗑️ Pertes & Annulations</div>
              <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
                <div style={{...S.card,flex:1,minWidth:120}}>
                  <div style={{fontSize:10,color:C.muted,fontWeight:600}}>ANNULATIONS</div>
                  <div style={{fontSize:20,fontWeight:800,color:C.red,marginTop:4}}>{pertes.length}</div>
                </div>
                <div style={{...S.card,flex:1,minWidth:120}}>
                  <div style={{fontSize:10,color:C.muted,fontWeight:600}}>MONTANT PERDU</div>
                  <div style={{fontSize:20,fontWeight:800,color:C.red,marginTop:4}}>{fmt(pertes.reduce((s,p)=>s+(p.total||0),0))} F</div>
                </div>
              </div>
              <div style={S.card}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["Référence","Date","Vendeur","Motif","Montant"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {pertes.map((p,i)=>(
                      <tr key={p.id||i}>
                        <td style={{...S.td,color:C.red,fontWeight:700}}>{p.reference}</td>
                        <td style={{...S.td,color:C.muted,fontSize:10}}>{p.created_at?new Date(p.created_at).toLocaleString("fr-FR"):""}</td>
                        <td style={{...S.td,color:C.txt}}>{p.vendor}</td>
                        <td style={{...S.td,color:C.muted,fontSize:11}}>{p.motif}</td>
                        <td style={{...S.td,fontWeight:700,color:C.red}}>{fmt(p.total)} F</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pertes.length===0&&<div style={{textAlign:"center",padding:20,color:C.muted,fontSize:12}}>Aucune perte enregistrée</div>}
              </div>
            </div>
          )}
          {page==="pertes"&&role!=="admin"&&(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:C.muted}}>
              <span style={{fontSize:48}}>🔒</span><span style={{fontWeight:700,fontSize:15}}>Accès réservé à l'administrateur</span>
            </div>
          )}

          {/* ══ EMPLOYÉS ══ */}
          {page==="employes"&&role==="admin"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontWeight:700,fontSize:15,color:C.txt}}>👔 Gestion des Employés</span>
                <button style={{...S.btnG,width:"auto",padding:"7px 14px"}} onClick={()=>setModal("addEmp")}>+ Employé</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
                {employees.map((emp,i)=>(
                  <div key={i} style={S.card}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                      <div style={{width:42,height:42,borderRadius:"50%",background:emp.role==="admin"?C.accent:C.blue,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff",fontWeight:700,flexShrink:0}}>
                        {emp.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:C.txt}}>{emp.name}</div>
                        <div style={{fontSize:11,color:C.muted}}>{emp.role==="admin"?"👑 Administrateur":"👤 Employé"}</div>
                      </div>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                      <span style={{color:C.muted}}>PIN</span>
                      <span style={{fontWeight:700,letterSpacing:3,color:C.txt}}>{"•".repeat(emp.pin?.length||4)}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginTop:4}}>
                      <span style={{color:C.muted}}>Statut</span>
                      <span style={{color:emp.active!==false?C.green:C.red,fontWeight:600}}>{emp.active!==false?"Actif":"Inactif"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ RAPPORTS ══ */}
          {page==="rapports"&&role==="admin"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
                <span style={{fontWeight:800,fontSize:17,color:C.txt}}>📊 Rapports</span>
                <div style={{display:"flex",gap:8}}>
                  {/* Période */}
                  <div style={{display:"flex",gap:4}}>
                    {["Aujourd'hui","Semaine","Mois","Tout"].map(p=>(
                      <button key={p} onClick={()=>setReportPeriod(p)} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${reportPeriod===p?C.accent:C.border}`,cursor:"pointer",fontSize:11,fontWeight:600,background:reportPeriod===p?C.accent:"transparent",color:reportPeriod===p?"#fff":C.muted}}>{p}</button>
                    ))}
                  </div>
                  {/* Impression */}
                  <button onClick={()=>printReport(sales,reportPeriod,shopInfo,employees)} style={{...S.btnG,width:"auto",padding:"6px 14px",fontSize:11}}>🖨️ Imprimer A4</button>
                  {/* Clôture Z */}
                  {!zClosed?(
                    <button onClick={doClotureZ} style={{background:C.orange,color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontWeight:700,cursor:"pointer",fontSize:11}}>🔒 Clôture Z</button>
                  ):(
                    <span style={{background:`${C.green}15`,color:C.green,border:`1px solid ${C.green}`,borderRadius:8,padding:"6px 14px",fontSize:11,fontWeight:600}}>✓ Clôture Z effectuée</span>
                  )}
                </div>
              </div>

              {/* KPIs */}
              <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                {[
                  {l:"Ventes (période)",v:fmt(periodSales.reduce((s,r)=>s+(r.total||0),0))+" F",i:"💰",c:C.accent},
                  {l:"Transactions",v:periodSales.length,i:"💳",c:C.green},
                  {l:"Panier moyen",v:fmt(periodSales.length?Math.round(periodSales.reduce((s,r)=>s+(r.total||0),0)/periodSales.length):0)+" F",i:"🛒",c:C.blue},
                  {l:"Glovo",v:fmt(periodSales.filter(s=>s.method?.includes("Glovo")).reduce((s,r)=>s+(r.total||0),0))+" F",i:"🛵",c:C.orange},
                ].map(c=>(
                  <div key={c.l} style={{...S.card,flex:1,minWidth:120,textAlign:"center"}}>
                    <div style={{fontSize:22,marginBottom:4}}>{c.i}</div>
                    <div style={{fontSize:10,color:C.muted,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>{c.l}</div>
                    <div style={{fontSize:15,fontWeight:800,color:c.c}}>{c.v}</div>
                  </div>
                ))}
              </div>

              {/* Meilleur vendeur */}
              {bestVendor&&(
                <div style={{...S.card,marginBottom:14,background:`${C.gold}10`,border:`1px solid ${C.gold}40`}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:30}}>🏆</span>
                    <div>
                      <div style={{fontSize:10,color:C.gold,fontWeight:700,textTransform:"uppercase"}}>Meilleur vendeur — {reportPeriod}</div>
                      <div style={{fontWeight:800,fontSize:16,color:C.txt}}>{bestVendor[0]}</div>
                      <div style={{fontSize:12,color:C.muted}}>{fmt(bestVendor[1])} F de ventes</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Onglets graphiques */}
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {[{k:"perf",l:"📈 Performances"},{k:"top5",l:"🏅 Top 5 produits"},{k:"payment",l:"💳 Paiements"}].map(t=>(
                  <button key={t.k} onClick={()=>setReportTab(t.k)} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${reportTab===t.k?C.accent:C.border}`,cursor:"pointer",fontSize:11,fontWeight:600,background:reportTab===t.k?C.accent:"transparent",color:reportTab===t.k?"#fff":C.muted}}>{t.l}</button>
                ))}
              </div>

              {/* Graphique performances */}
              {reportTab==="perf"&&(
                <div style={S.card}>
                  <div style={{fontWeight:700,marginBottom:14,color:C.txt}}>Ventes — 7 derniers jours</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={perfData} margin={{top:5,right:20,bottom:5,left:10}}>
                      <XAxis dataKey="label" tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10,fill:C.muted}} axisLine={false} tickLine={false} tickFormatter={v=>fmt(v)}/>
                      <Tooltip formatter={v=>[fmt(v)+" F","Ventes"]} contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11,color:C.txt}}/>
                      <Line type="monotone" dataKey="ventes" stroke={C.accent} strokeWidth={2.5} dot={{fill:C.accent,r:4}} activeDot={{r:6}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Top 5 */}
              {reportTab==="top5"&&(
                <div style={S.card}>
                  <div style={{fontWeight:700,marginBottom:14,color:C.txt}}>Top 5 produits (par chiffre d'affaires)</div>
                  {top5.length===0?(
                    <div style={{color:C.muted,textAlign:"center",padding:30,fontSize:12}}>Pas encore de données</div>
                  ):(
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {top5.map((item,i)=>{
                        const pct=top5[0].v>0?(item.v/top5[0].v)*100:0;
                        const colors=[C.accent,C.blue,C.green,C.orange,"#8b5cf6"];
                        return(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontSize:14,minWidth:20,textAlign:"center"}}>{["🥇","🥈","🥉","4️⃣","5️⃣"][i]}</span>
                            <div style={{flex:1}}>
                              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}>
                                <span style={{fontWeight:600,color:C.txt}}>{item.name}</span>
                                <span style={{fontWeight:800,color:colors[i]}}>{fmt(item.v)} F</span>
                              </div>
                              <div style={{background:C.surface2,borderRadius:6,height:8,overflow:"hidden",cursor:"pointer",position:"relative"}}
                                title={`${fmt(item.v)} F de ventes`}>
                                <div style={{width:`${pct}%`,background:colors[i],height:"100%",borderRadius:6,transition:"width .8s ease"}}></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Répartition paiements */}
              {reportTab==="payment"&&(
                <div style={S.card}>
                  <div style={{fontWeight:700,marginBottom:12,color:C.txt}}>Répartition par mode de paiement</div>
                  {(()=>{
                    const bm=METHODS.map((m,i)=>({name:m,v:periodSales.filter(s=>s.method?.includes(m)).reduce((a,s)=>a+(s.total||0),0),color:PAY_COLORS[i]})).filter(m=>m.v>0);
                    return bm.length===0?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:20}}>Aucune vente</div>:(
                      <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
                        <PieChart width={130} height={130}><Pie data={bm} dataKey="v" cx={60} cy={60} innerRadius={34} outerRadius={58}>{bm.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie></PieChart>
                        <div style={{display:"flex",flexDirection:"column",gap:8,flex:1}}>
                          {bm.map(d=>(
                            <div key={d.name} style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
                              <span style={{width:10,height:10,borderRadius:2,background:d.color,flexShrink:0}}></span>
                              <span style={{color:C.muted,flex:1}}>{d.name}</span>
                              <span style={{fontWeight:700,color:C.txt}}>{fmt(d.v)} F</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
          {page==="rapports"&&role!=="admin"&&(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:C.muted}}>
              <span style={{fontSize:48}}>🔒</span><span style={{fontWeight:700,fontSize:15}}>Accès réservé à l'administrateur</span>
            </div>
          )}

          {/* ══ PARAMÈTRES ══ */}
          {page==="parametres"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14,color:C.txt}}>Paramètres</div>

              <div style={{...S.card,marginBottom:14}}>
                <div style={{fontWeight:700,marginBottom:10,color:C.txt}}>🎨 Apparence</div>
                <div style={{display:"flex",gap:10}}>
                  {[{l:"🌙 Sombre",d:true},{l:"☀️ Clair",d:false}].map(opt=>(
                    <button key={String(opt.d)} onClick={()=>setDarkMode(opt.d)} style={{flex:1,padding:"10px",borderRadius:9,border:`2px solid ${darkMode===opt.d?C.accent:C.border}`,cursor:"pointer",background:darkMode===opt.d?C.accentBg:"transparent",color:darkMode===opt.d?C.accent:C.muted,fontWeight:700,fontSize:13}}>{opt.l}</button>
                  ))}
                </div>
              </div>

              <div style={{...S.card,marginBottom:14}}>
                <div style={{fontWeight:700,marginBottom:10,color:C.txt}}>🖨️ Impression</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button onClick={()=>{ if(sales.length){const s=sales[0];loadSaleItems(s.id).then(()=>printTicket(s,saleItems[s.id]||[],shopInfo));} else showToast("Aucune vente à imprimer",true); }}
                    style={{...S.btnO,flex:1,padding:"10px",fontSize:12}}>🧾 Test ticket thermique</button>
                  <button onClick={()=>printReport(sales,"Tout",shopInfo,employees)}
                    style={{...S.btnO,flex:1,padding:"10px",fontSize:12}}>📄 Test rapport A4 (HP)</button>
                </div>
                <div style={{fontSize:11,color:C.muted,marginTop:8}}>Le ticket thermique s'imprime sur 80mm (ESC/POS). Le rapport A4 convient aux imprimantes HP/Laser.</div>
              </div>

              <div style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontWeight:700,color:C.txt}}>🏪 Informations du commerce</div>
                  <button onClick={()=>{if(editShop)showToast("Sauvegardé ✓");setEditShop(!editShop);}} style={{background:editShop?C.accent:"transparent",color:editShop?"#fff":C.accent,border:`1px solid ${C.accent}`,borderRadius:6,padding:"4px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>
                    {editShop?"✓ Enregistrer":"Modifier"}
                  </button>
                </div>
                {editShop?(
                  <div style={{display:"flex",flexDirection:"column",gap:9}}>
                    {[{l:"Nom",k:"name"},{l:"Adresse",k:"address"},{l:"Téléphone",k:"phone"}].map(f=>(
                      <div key={f.k}><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>{f.l.toUpperCase()}</div><input style={S.input} value={shopInfo[f.k]||""} onChange={e=>setShopInfo(p=>({...p,[f.k]:e.target.value}))}/></div>
                    ))}
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {[{l:"Nom",k:"name"},{l:"Adresse",k:"address"},{l:"Téléphone",k:"phone"}].map(f=>(
                      <div key={f.k} style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                        <span style={{color:C.muted}}>{f.l}</span><span style={{fontWeight:600,color:C.txt}}>{shopInfo[f.k]||"—"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ─────────────── MODALS ─────────────── */}

      {/* Confirmation encaissement */}
      {modal==="confirm"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:420,maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <AmlyLogo size={26}/>
              <span style={{fontWeight:800,fontSize:15,color:C.txt}}>Confirmer l'encaissement</span>
            </div>
            {selClient&&<div style={{background:C.accentBg,border:`1px solid ${C.accent}40`,borderRadius:7,padding:"6px 10px",fontSize:11,color:C.accent,marginBottom:10,fontWeight:600}}>👤 Client : {selClient.name} — {selClient.points||0} pts</div>}
            {cart.map(i=>(
              <div key={i.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6,color:C.txt}}>
                <span>{i.img} {i.name} × {i.qty}</span><span style={{color:C.accent,fontWeight:700}}>{fmt(i.price*i.qty)} F</span>
              </div>
            ))}
            <div style={{borderTop:`1px solid ${C.border}`,marginTop:10,paddingTop:10,display:"flex",flexDirection:"column",gap:5}}>
              {discount>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}><span>Remise</span><span>-{fmt(discount)} F</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15}}><span style={{color:C.txt}}>Total</span><span style={{color:C.green}}>{fmt(cartTotal)} F</span></div>
              <div style={{fontSize:11,color:C.muted}}>Mode : {method1==="Glovo"?`Glovo (${glovoPayType==="cash"?"Cash":glovoPayType==="differe"?"Différé":"Hebdo"})`:methodLabel}</div>
              {change>0&&<div style={{fontSize:11,color:C.green,fontWeight:600}}>Monnaie : {fmt(change)} F</div>}
            </div>
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button style={S.btnG} onClick={confirmSale}>✓ Valider</button>
              <button style={S.btnO} onClick={()=>setModal(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket de caisse */}
      {modal==="receipt"&&selSale&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:400,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
              <AmlyLogo size={36}/><div style={{fontWeight:900,fontSize:14,color:C.accent,marginTop:7}}>HIT FAST FOOD</div>
              <div style={{fontSize:11,color:C.muted}}>{shopInfo.address}</div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <span style={{display:"inline-block",padding:"2px 9px",borderRadius:7,fontSize:11,fontWeight:600,background:C.accentBg,color:C.accent}}>{selSale.reference}</span>
              <span style={{fontSize:10,color:C.muted}}>{selSale.created_at?new Date(selSale.created_at).toLocaleString("fr-FR"):""}</span>
            </div>
            {saleItems[selSale.id]&&(
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:10}}>
                <thead><tr>{["Produit","Qté","Prix","Total"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>{saleItems[selSale.id].map((i,idx)=><tr key={idx}><td style={{...S.td,fontSize:11,color:C.txt}}>{i.name}</td><td style={{...S.td,color:C.muted}}>{i.qty}</td><td style={{...S.td,color:C.muted}}>{fmt(i.price)}</td><td style={{...S.td,color:C.accent,fontWeight:700}}>{fmt(i.price*i.qty)}</td></tr>)}</tbody>
              </table>
            )}
            <div style={{background:C.surface2,borderRadius:8,padding:10,fontSize:12,marginBottom:12,display:"flex",flexDirection:"column",gap:5}}>
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:14}}><span>Total</span><span style={{color:C.green}}>{fmt(selSale.total)} F</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.muted}}>Mode</span><span style={{color:C.blue,fontSize:11}}>{selSale.method}</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.muted}}>Vendeur</span><span>{selSale.vendor}</span></div>
            </div>
            <div style={{textAlign:"center",fontSize:10,color:C.muted,marginBottom:12}}>Merci pour votre visite ! — HIT Fast Food</div>
            <div style={{display:"flex",gap:8}}>
              <button style={S.btnG} onClick={()=>{loadSaleItems(selSale.id).then(()=>printTicket(selSale,saleItems[selSale.id]||[],shopInfo));}}>🖨️ Imprimer ticket</button>
              <button style={S.btnO} onClick={()=>setModal(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Annulation commande */}
      {modal==="cancel"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:380}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:4,color:C.red}}>✕ Annuler la commande</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Cette commande sera enregistrée dans les Pertes.</div>
            {cancelTarget&&(
              <div style={{background:C.surface2,borderRadius:8,padding:10,marginBottom:12,fontSize:12}}>
                <div style={{fontWeight:700,color:C.txt,marginBottom:4}}>{cancelTarget.reference}</div>
                <div style={{color:C.red,fontWeight:700,fontSize:14}}>{fmt(cancelTarget.total)} F</div>
              </div>
            )}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:4}}>MOTIF D'ANNULATION *</div>
              <textarea style={{...S.input,height:70,resize:"vertical",fontSize:12}} placeholder="Ex: Désistement client, erreur commande, plat non disponible..." value={cancelNote} onChange={e=>setCancelNote(e.target.value)}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button style={S.btnR} onClick={cancelOrder}>✕ Confirmer annulation</button>
              <button style={S.btnO} onClick={()=>{setModal(null);setCancelNote("");setCancelTarget(null);}}>Retour</button>
            </div>
          </div>
        </div>
      )}

      {/* Ajout produit */}
      {modal==="addProd"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:400,maxHeight:"88vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:14,color:C.txt}}>Nouveau produit</div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:5,fontWeight:600}}>PHOTO</div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                {imgPreview?<img src={imgPreview} alt="preview" style={{width:70,height:70,objectFit:"cover",borderRadius:9,border:`2px solid ${C.accent}`,flexShrink:0}}/>
                  :<div style={{width:70,height:70,borderRadius:9,border:`2px dashed ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,background:C.surface2,flexShrink:0,cursor:"pointer"}} onClick={()=>fileInputRef.current?.click()}>📷</div>}
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                  <button onClick={()=>fileInputRef.current?.click()} style={{...S.btnO,padding:"7px 10px",fontSize:11}}>📁 Choisir image</button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleImageFile(e.target.files[0])}/>
                  <input style={{...S.input,fontSize:11}} placeholder="ou URL https://..." value={newP.img_url||""} onChange={e=>{setNewP(p=>({...p,img_url:e.target.value}));setImgPreview(e.target.value);}}/>
                </div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {[{l:"Nom",k:"name",t:"text",p:"Ex: Poulet braisé"},{l:"Emoji",k:"img",t:"text",p:"🍗"},{l:"Prix de vente (FCFA)",k:"price",t:"number",p:"5000"},{l:"Coût d'achat (FCFA)",k:"cost",t:"number",p:"2000"},{l:"Stock initial",k:"stock",t:"number",p:"10"}].map(f=>(
                <div key={f.k}><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>{f.l.toUpperCase()}</div><input style={S.input} type={f.t} placeholder={f.p} value={newP[f.k]||""} onChange={e=>setNewP(p=>({...p,[f.k]:e.target.value}))}/></div>
              ))}
              <div><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>CATÉGORIE</div><select style={S.input} value={newP.cat} onChange={e=>setNewP(p=>({...p,cat:e.target.value}))}>{["Plats","Boissons","Desserts"].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button style={S.btnG} onClick={addProduct}>Ajouter</button>
                <button style={S.btnO} onClick={()=>setModal(null)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ajout ingrédient */}
      {modal==="addIng"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:370}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:14,color:C.txt}}>Nouvel ingrédient</div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {[{l:"Nom",k:"name",t:"text",p:"Ex: Farine"},{l:"Stock actuel",k:"stock",t:"number",p:"10"},{l:"Stock minimum",k:"stock_min",t:"number",p:"2"},{l:"Coût par unité (FCFA)",k:"cost_unit",t:"number",p:"500"}].map(f=>(
                <div key={f.k}><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>{f.l.toUpperCase()}</div><input style={S.input} type={f.t} placeholder={f.p} value={newI[f.k]||""} onChange={e=>setNewI(p=>({...p,[f.k]:e.target.value}))}/></div>
              ))}
              <div><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>UNITÉ</div><select style={S.input} value={newI.unit} onChange={e=>setNewI(p=>({...p,unit:e.target.value}))}>{["kg","g","l","ml","pièce","tranche","bouteille","sachet"].map(u=><option key={u} value={u}>{u}</option>)}</select></div>
              <div style={{display:"flex",gap:8,marginTop:4}}><button style={S.btnG} onClick={addIngredient}>Ajouter</button><button style={S.btnO} onClick={()=>setModal(null)}>Annuler</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Ajout client */}
      {modal==="addClient"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:370}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:14,color:C.txt}}>Nouveau client</div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {[{l:"Nom complet *",k:"name",t:"text",p:"Ex: Kouamé Jean"},{l:"Téléphone",k:"phone",t:"tel",p:"0701234567"},{l:"Email",k:"email",t:"email",p:"email@example.com"}].map(f=>(
                <div key={f.k}><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>{f.l.toUpperCase()}</div><input style={S.input} type={f.t} placeholder={f.p} value={newCl[f.k]||""} onChange={e=>setNewCl(p=>({...p,[f.k]:e.target.value}))}/></div>
              ))}
              <div style={{display:"flex",gap:8,marginTop:4}}><button style={S.btnG} onClick={addClient}>Ajouter</button><button style={S.btnO} onClick={()=>setModal(null)}>Annuler</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Sélection client pour vente */}
      {modal==="selClient"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:360,maxHeight:"70vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:C.txt}}>Associer un client</div>
            <button onClick={()=>{setSelClient(null);setModal(null);}} style={{...S.btnO,marginBottom:8,fontSize:11}}>✕ Sans client</button>
            {clients.map(cl=>(
              <div key={cl.id} onClick={()=>{setSelClient(cl);setModal(null);}}
                style={{display:"flex",alignItems:"center",gap:10,padding:"9px 11px",borderRadius:8,cursor:"pointer",border:`1px solid ${selClient?.id===cl.id?C.accent:C.border}`,marginBottom:5,background:selClient?.id===cl.id?C.accentBg:"transparent"}}
                onMouseEnter={e=>{e.currentTarget.style.background=C.surface2;}}
                onMouseLeave={e=>{e.currentTarget.style.background=selClient?.id===cl.id?C.accentBg:"transparent";}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:C.accentBg,border:`1px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>👤</div>
                <div><div style={{fontWeight:600,fontSize:12,color:C.txt}}>{cl.name}</div><div style={{fontSize:10,color:C.muted}}>⭐ {cl.points||0} pts — {cl.phone||"No tél."}</div></div>
              </div>
            ))}
            {clients.length===0&&<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:20}}>Aucun client. <span style={{color:C.accent,cursor:"pointer"}} onClick={()=>setModal("addClient")}>+ Ajouter</span></div>}
          </div>
        </div>
      )}

      {/* Ajout employé */}
      {modal==="addEmp"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:360}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:14,color:C.txt}}>Nouvel employé</div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              <div><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>NOM *</div><input style={S.input} placeholder="Prénom Nom" value={newEmp.name} onChange={e=>setNewEmp(p=>({...p,name:e.target.value}))}/></div>
              <div><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>PIN (4-6 chiffres) *</div><input style={S.input} type="password" placeholder="Ex: 1234" value={newEmp.pin} onChange={e=>setNewEmp(p=>({...p,pin:e.target.value}))}/></div>
              <div><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>RÔLE</div>
                <select style={S.input} value={newEmp.role} onChange={e=>setNewEmp(p=>({...p,role:e.target.value}))}>
                  <option value="employee">👤 Employé</option>
                  <option value="admin">👑 Administrateur</option>
                </select>
              </div>
              <div style={{display:"flex",gap:8,marginTop:4}}><button style={S.btnG} onClick={addEmployee}>Ajouter</button><button style={S.btnO} onClick={()=>setModal(null)}>Annuler</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Réservation */}
      {modal==="addReservation"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:420,maxHeight:"88vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:14,color:C.txt}}>📅 Nouvelle réservation</div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              <div><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>CLIENT *</div><input style={S.input} placeholder="Nom du client" value={newRes.client_name} onChange={e=>setNewRes(p=>({...p,client_name:e.target.value}))}/></div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>DATE *</div><input style={S.input} type="date" value={newRes.date} onChange={e=>setNewRes(p=>({...p,date:e.target.value}))}/></div>
                <div style={{flex:1}}><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>HEURE</div><input style={S.input} type="time" value={newRes.time} onChange={e=>setNewRes(p=>({...p,time:e.target.value}))}/></div>
              </div>
              <div><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>NOMBRE DE PERSONNES</div><input style={S.input} type="number" min="1" value={newRes.people} onChange={e=>setNewRes(p=>({...p,people:Number(e.target.value)}))}/></div>
              <div><div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>NOTE</div><textarea style={{...S.input,height:60,resize:"none"}} placeholder="Allergies, préférences, occasions spéciales…" value={newRes.note} onChange={e=>setNewRes(p=>({...p,note:e.target.value}))}/></div>
              {/* Plats à l'avance */}
              <div style={{background:C.surface2,borderRadius:8,padding:10}}>
                <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:8}}>PLATS PRÉ-COMMANDÉS</div>
                <div style={{display:"flex",gap:6,marginBottom:7}}>
                  <select style={{...S.input,flex:2}} value={newResItem.product_id} onChange={e=>setNewResItem(p=>({...p,product_id:e.target.value}))}>
                    <option value="">-- Choisir un plat --</option>
                    {products.map(p=><option key={p.id} value={p.id}>{p.img} {p.name}</option>)}
                  </select>
                  <input style={{...S.input,width:55}} type="number" min="1" value={newResItem.qty} onChange={e=>setNewResItem(p=>({...p,qty:Number(e.target.value)}))}/>
                  <button style={{...S.btnG,width:"auto",padding:"7px 10px"}} onClick={()=>{ if(!newResItem.product_id)return; setNewRes(r=>({...r,items:[...r.items,{...newResItem}]})); setNewResItem({product_id:"",qty:1}); }}>+</button>
                </div>
                {newRes.items.map((item,i)=>{
                  const p=products.find(x=>x.id===item.product_id);
                  return(<div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"4px 0",borderBottom:`1px solid ${C.border}`}}>
                    <span style={{color:C.txt}}>{p?.img} {p?.name}</span>
                    <span style={{color:C.accent,fontWeight:700}}>×{item.qty}</span>
                    <button onClick={()=>setNewRes(r=>({...r,items:r.items.filter((_,idx)=>idx!==i)}))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:12}}>✕</button>
                  </div>);
                })}
              </div>
              <div style={{display:"flex",gap:8,marginTop:4}}><button style={S.btnG} onClick={addReservation}>Enregistrer</button><button style={S.btnO} onClick={()=>setModal(null)}>Annuler</button></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
