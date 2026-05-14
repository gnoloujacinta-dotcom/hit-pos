import { useState, useEffect, useRef } from "react";
import { PieChart, Pie, Cell } from "recharts";

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const URL_ = "https://hitghrlrfbwvefbijxtz.supabase.co";
const KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpdGdocmxyZmJ3dmVmYmlqeHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2ODc5MjIsImV4cCI6MjA5NDI2MzkyMn0.dKGI7mvTHatMI2LzVSbmOs2VDgVHremsX-fEbgAtgbc";
const H    = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const sb = {
  get:    async (t, q="") => (await fetch(`${URL_}/rest/v1/${t}?order=created_at.desc${q}`, { headers: H })).json(),
  insert: async (t, d)    => (await fetch(`${URL_}/rest/v1/${t}`, { method:"POST", headers:{...H,Prefer:"return=representation"}, body:JSON.stringify(d) })).json(),
  update: async (t, id, d)=> fetch(`${URL_}/rest/v1/${t}?id=eq.${id}`, { method:"PATCH", headers:H, body:JSON.stringify(d) }),
  del:    async (t, id)   => fetch(`${URL_}/rest/v1/${t}?id=eq.${id}`, { method:"DELETE", headers:H }),
  getBy:  async (t, col, val) => (await fetch(`${URL_}/rest/v1/${t}?${col}=eq.${val}`, { headers: H })).json(),
};

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const CATS    = ["Tout","Plats","Boissons","Desserts"];
const METHODS = ["Espèces","Wave","Orange Money","Carte","Glovo"];
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

// ─── THEME ───────────────────────────────────────────────────────────────────
const LIGHT = {
  accent:"#4f46e5", accentL:"#6366f1", accentBg:"rgba(79,70,229,0.08)",
  sidebar:"#1e1b4b", sidebarText:"#c7d2fe", sidebarActive:"#4f46e5", sidebarActiveBg:"rgba(255,255,255,0.12)",
  topbar:"#ffffff", topbarBorder:"rgba(0,0,0,0.08)",
  bg:"#f5f5f7", surface:"#ffffff", surface2:"#f0f0f5",
  txt:"#111827", muted:"#6b7280", border:"rgba(0,0,0,0.08)",
  green:"#16a34a", red:"#dc2626", blue:"#2563eb", orange:"#ea580c",
  gold:"#b45309", goldBg:"rgba(180,83,9,0.08)",
  cardBg:"#ffffff", cardBorder:"rgba(0,0,0,0.07)",
  inputBg:"#f9f9fb", inputBorder:"rgba(0,0,0,0.12)",
  btnPrimary:"#4f46e5", btnPrimaryText:"#ffffff",
  btnSecondary:"transparent", btnSecondaryText:"#6b7280",
  shadow:"0 1px 3px rgba(0,0,0,0.08)",
};

const DARK = {
  accent:"#6366f1", accentL:"#818cf8", accentBg:"rgba(99,102,241,0.12)",
  sidebar:"#0f0f1a", sidebarText:"#94a3b8", sidebarActive:"#6366f1", sidebarActiveBg:"rgba(99,102,241,0.15)",
  topbar:"#161625", topbarBorder:"rgba(255,255,255,0.06)",
  bg:"#0d0d1a", surface:"#161625", surface2:"#1e1e30",
  txt:"#f0ede8", muted:"#64748b", border:"rgba(255,255,255,0.07)",
  green:"#22c55e", red:"#ef4444", blue:"#3b82f6", orange:"#f97316",
  gold:"#f59e0b", goldBg:"rgba(245,158,11,0.1)",
  cardBg:"#1a1a2e", cardBorder:"rgba(255,255,255,0.06)",
  inputBg:"#1e1e30", inputBorder:"rgba(255,255,255,0.1)",
  btnPrimary:"#6366f1", btnPrimaryText:"#ffffff",
  btnSecondary:"transparent", btnSecondaryText:"#64748b",
  shadow:"none",
};

const fmt = n => new Intl.NumberFormat("fr-FR").format(n||0);

// ─── LOGO AMLY-POS ───────────────────────────────────────────────────────────
const AmlyLogo = ({size=32, C}) => (
  <div style={{width:size,height:size,background:"linear-gradient(135deg,#4f46e5,#818cf8)",borderRadius:Math.round(size*0.22),
    display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,
    fontSize:Math.round(size*0.32),color:"#fff",fontFamily:"Impact,Arial Black,sans-serif",
    letterSpacing:"-0.5px",flexShrink:0,boxShadow:"0 2px 10px rgba(79,70,229,0.4)"}}>
    A
  </div>
);

export default function AmlyPOS() {
  const [darkMode,    setDarkMode]  = useState(true);
  const C = darkMode ? DARK : LIGHT;

  // Styles dynamiques basés sur le thème
  const S = {
    card:  {background:C.cardBg, border:`1px solid ${C.cardBorder}`, borderRadius:12, padding:16, boxShadow:C.shadow},
    th:    {textAlign:"left",fontSize:10,color:C.muted,fontWeight:600,padding:"7px 10px",borderBottom:`1px solid ${C.border}`,textTransform:"uppercase"},
    td:    {padding:"10px 10px",fontSize:12,borderBottom:`1px solid ${C.border}`},
    input: {background:C.inputBg,border:`1px solid ${C.inputBorder}`,borderRadius:8,padding:"8px 12px",color:C.txt,fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"},
    btnG:  {background:C.btnPrimary,color:C.btnPrimaryText,border:"none",borderRadius:8,padding:"10px 16px",fontWeight:700,cursor:"pointer",fontSize:13,width:"100%"},
    btnO:  {background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 16px",fontWeight:600,cursor:"pointer",fontSize:13,width:"100%"},
    btnB:  {background:C.blue,color:"#fff",border:"none",borderRadius:8,padding:"10px 16px",fontWeight:700,cursor:"pointer",fontSize:13,width:"100%"},
    btnR:  {background:C.red,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontWeight:700,cursor:"pointer",fontSize:12},
  };

  const [role,       setRole]      = useState("admin");
  const [page,       setPage]      = useState("caisse");
  const [products,   setProducts]  = useState([]);
  const [sales,      setSales]     = useState([]);
  const [tables,     setTables]    = useState([]);
  const [orders,     setOrders]    = useState([]);
  const [orderItems, setOrderItems]= useState({});
  const [saleItems,  setSaleItems] = useState({});
  const [ingredients,setIngredients]=useState([]);
  const [recettes,   setRecettes]  = useState([]);
  const [cart,       setCart]      = useState([]);
  const [cat,        setCat]       = useState("Tout");
  const [search,     setSearch]    = useState("");
  const [loading,    setLoading]   = useState(true);
  const [modal,      setModal]     = useState(null);
  const [selSale,    setSelSale]   = useState(null);
  const [selTable,   setSelTable]  = useState(null);
  const [selProduct, setSelProduct]= useState(null);
  const [orderType,  setOrderType] = useState("sur_place");
  const [toast,      setToast]     = useState(null);
  const [dbStatus,   setDbStatus]  = useState("checking");
  const [newP,       setNewP]      = useState({name:"",cat:"Plats",price:"",cost:"",stock:"",img:"🍽️",img_url:""});
  const [newI,       setNewI]      = useState({name:"",unit:"kg",stock:"",stock_min:"",cost_unit:""});
  const [newR,       setNewR]      = useState({ingredient_id:"",quantite:""});
  const [payMode,    setPayMode]   = useState("simple");
  const [method1,    setMethod1]   = useState("Espèces");
  const [method2,    setMethod2]   = useState("Wave");
  const [amount1,    setAmount1]   = useState("");
  const [amount2,    setAmount2]   = useState("");
  const [discount,   setDiscount]  = useState(0);
  const [shopInfo,   setShopInfo]  = useState({name:"HIT Fast Food", address:"Grand-Bassam, Côte d'Ivoire", phone:""});
  const [editShop,   setEditShop]  = useState(false);
  const [ingSearch,  setIngSearch] = useState("");
  const [imgPreview, setImgPreview]= useState("");
  const fileInputRef = useRef(null);

  const kdsInterval = useRef(null);
  const showToast = (msg, err=false) => { setToast({msg,err}); setTimeout(()=>setToast(null),2500); };

  useEffect(() => {
    loadAll();
    kdsInterval.current = setInterval(()=>{ if(page==="cuisine") loadOrders(); }, 8000);
    return ()=>clearInterval(kdsInterval.current);
  }, []);

  useEffect(()=>{ if(page==="cuisine") loadOrders(); }, [page]);

  const loadAll = async () => {
    setLoading(true);
    try {
      let prods = await sb.get("products");
      if(prods?.code){ setDbStatus("error"); showToast("Erreur DB: "+prods.message,true); setLoading(false); return; }
      if(!prods||prods.length===0){ for(const p of DEFAULT_PRODUCTS) await sb.insert("products",p); prods=await sb.get("products"); }
      setProducts(Array.isArray(prods)?prods:[]);
      const s = await sb.get("sales"); setSales(Array.isArray(s)?s:[]);
      const t = await sb.get("tables_restaurant","&order=numero.asc"); setTables(Array.isArray(t)?t:[]);
      const ing = await sb.get("ingredients","&order=name.asc"); setIngredients(Array.isArray(ing)?ing:[]);
      const rec = await sb.get("recettes"); setRecettes(Array.isArray(rec)?rec:[]);
      setDbStatus("ok");
    } catch(e){ setDbStatus("error"); showToast("Erreur connexion",true); }
    setLoading(false);
  };

  const loadOrders = async () => {
    const o = await sb.get("orders","&statut=neq.servi&order=created_at.asc");
    setOrders(Array.isArray(o)?o:[]);
    for(const ord of (Array.isArray(o)?o:[])){
      const items = await sb.getBy("order_items","order_id",ord.id);
      setOrderItems(prev=>({...prev,[ord.id]:items}));
    }
  };

  const loadSaleItems = async (saleId) => {
    if(saleItems[saleId]) return;
    const items = await sb.getBy("sale_items","sale_id",saleId);
    setSaleItems(prev=>({...prev,[saleId]:items}));
  };

  // ── Gestion photo ──
  const handleImageFile = (file) => {
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setImgPreview(base64);
      setNewP(p=>({...p, img_url: base64}));
    };
    reader.readAsDataURL(file);
  };

  // ── Panier ──
  const filtered = products.filter(p=>(cat==="Tout"||p.cat===cat)&&p.name.toLowerCase().includes(search.toLowerCase()));
  const cartSub   = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const cartTotal = Math.max(0, cartSub - Number(discount||0));
  const paid1     = Number(amount1||0);
  const paid2     = Number(amount2||0);
  const totalPaid = payMode==="mixte" ? paid1+paid2 : paid1;
  const change    = payMode==="simple"&&method1==="Espèces" ? Math.max(0,paid1-cartTotal) :
                    payMode==="mixte" ? Math.max(0,totalPaid-cartTotal) : 0;
  const methodLabel = payMode==="mixte" ? `Mixte (${method1} ${fmt(paid1)}F + ${method2} ${fmt(paid2)}F)` : method1;

  const addToCart = p => {
    if(p.stock<=0){showToast("Stock épuisé",true);return;}
    setCart(prev=>{const ex=prev.find(i=>i.id===p.id);return ex?prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i):[...prev,{...p,qty:1}];});
  };
  const updateQty  = (id,d) => setCart(prev=>prev.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+d)}:i));
  const removeItem = id    => setCart(prev=>prev.filter(i=>i.id!==id));

  // ── Déduire ingrédients ──
  const deduireIngredients = async (cartItems) => {
    for(const item of cartItems){
      const recettesProduit = recettes.filter(r=>r.product_id===item.id);
      for(const r of recettesProduit){
        const ing = ingredients.find(i=>i.id===r.ingredient_id);
        if(ing){
          const newStock = Math.max(0, ing.stock - (r.quantite * item.qty));
          await sb.update("ingredients", ing.id, {stock: newStock});
        }
      }
    }
  };

  const sendToKitchen = async () => {
    if(!cart.length) return;
    setLoading(true);
    try {
      const ref = `#CMD-${Date.now()}`;
      const [order] = await sb.insert("orders",{
        reference:ref, table_id:selTable?.id||null,
        type:orderType, statut:"en_attente",
        vendor:role==="admin"?"Admin":"Employé", note:""
      });
      if(order){
        for(const i of cart) await sb.insert("order_items",{order_id:order.id,product_name:i.name,qty:i.qty,statut:"en_attente"});
      }
      showToast("Commande envoyée en cuisine ✓");
      setModal("confirm_pay");
    } catch(e){ showToast("Erreur envoi cuisine",true); }
    setLoading(false);
  };

  const confirmSale = async () => {
    if(!cart.length) return;
    if(payMode==="mixte"&&totalPaid<cartTotal){showToast("Montant insuffisant",true);return;}
    setLoading(true);
    try {
      const ref = `#VTE-${String(sales.length+1).padStart(6,"0")}`;
      const [sale] = await sb.insert("sales",{
        reference:ref, client:"Client de passage",
        method:methodLabel, vendor:role==="admin"?"Admin":"Employé",
        discount:Number(discount||0), total:cartTotal
      });
      if(sale){
        for(const i of cart) await sb.insert("sale_items",{sale_id:sale.id,name:i.name,qty:i.qty,price:i.price,cost:i.cost});
        for(const i of cart){const p=products.find(x=>x.id===i.id);if(p) await sb.update("products",p.id,{stock:Math.max(0,p.stock-i.qty)});}
        await deduireIngredients(cart);
        if(selTable) await sb.update("tables_restaurant",selTable.id,{statut:"libre"});
      }
      await loadAll();
      setSelSale(sale);
      setSaleItems(prev=>({...prev,[sale?.id]:cart.map(i=>({name:i.name,qty:i.qty,price:i.price,cost:i.cost}))}));
      setCart([]); setDiscount(0); setAmount1(""); setAmount2(""); setSelTable(null);
      setModal("receipt"); showToast("Vente enregistrée ✓");
    } catch(e){ showToast("Erreur vente",true); }
    setLoading(false);
  };

  const updateOrderStatut = async (orderId, statut) => {
    await sb.update("orders", orderId, {statut});
    setOrders(prev=>prev.map(o=>o.id===orderId?{...o,statut}:o));
  };
  const updateItemStatut = async (itemId, orderId, statut) => {
    await sb.update("order_items", itemId, {statut});
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
    setNewP({name:"",cat:"Plats",price:"",cost:"",stock:"",img:"🍽️",img_url:""});
    setImgPreview("");
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

  const deleteRecette = async (id) => {
    await sb.del("recettes", id);
    await loadAll(); showToast("Supprimé ✓");
  };

  const updateIngredientStock = async (id, newStock) => {
    await sb.update("ingredients", id, {stock: Number(newStock)});
    await loadAll(); showToast("Stock mis à jour ✓");
  };

  const totalRev  = sales.reduce((s,r)=>s+(r.total||0),0);
  const todayRev  = sales.filter(s=>s.created_at&&new Date(s.created_at).toDateString()===new Date().toDateString()).reduce((s,r)=>s+(r.total||0),0);
  const glovoRev  = sales.filter(s=>s.method?.includes("Glovo")).reduce((s,r)=>s+(r.total||0),0);
  const ingCritiques = ingredients.filter(i=>i.stock<=i.stock_min);

  const ADMIN_NAV = [
    {k:"caisse",i:"🏪",l:"Caisse"},
    {k:"tables",i:"🪑",l:"Tables"},
    {k:"cuisine",i:"👨‍🍳",l:"Cuisine"},
    {k:"produits",i:"📋",l:"Produits"},
    {k:"ingredients",i:"🧂",l:"Ingrédients"},
    {k:"recettes",i:"📖",l:"Recettes"},
    {k:"ventes",i:"💳",l:"Ventes"},
    {k:"stock",i:"📦",l:"Stock"},
    {k:"rapports",i:"📊",l:"Rapports"},
    {k:"parametres",i:"⚙️",l:"Paramètres"},
  ];
  const EMP_NAV = [
    {k:"caisse",i:"🏪",l:"Caisse"},
    {k:"tables",i:"🪑",l:"Tables"},
    {k:"cuisine",i:"👨‍🍳",l:"Cuisine"},
    {k:"ventes",i:"💳",l:"Ventes"},
    {k:"stock",i:"📦",l:"Stock"},
    {k:"ingredients",i:"🧂",l:"Ingrédients"},
  ];
  const nav = role==="admin" ? ADMIN_NAV : EMP_NAV;

  const filteredIng = ingredients.filter(i=>i.name.toLowerCase().includes(ingSearch.toLowerCase()));

  // ─── TOPBAR ──────────────────────────────────────────────────────────────
  const Topbar = () => (
    <div style={{display:"flex",alignItems:"center",padding:"0 16px",height:54,background:C.topbar,borderBottom:`1px solid ${C.topbarBorder}`,flexShrink:0,gap:12,boxShadow:darkMode?"none":"0 1px 3px rgba(0,0,0,0.06)"}}>
      {/* Brand */}
      <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
        <AmlyLogo size={34} C={C}/>
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
      </div>

      <div style={{flex:1}}/>

      {/* Infos droite */}
      <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        {selTable&&<div style={{background:C.accentBg,border:`1px solid ${C.accent}`,borderRadius:8,padding:"3px 10px",fontSize:11,color:C.accent,fontWeight:700}}>🪑 {selTable.label}</div>}
        <div style={{
          background:orderType==="sur_place"?`${C.green}18`:`${C.blue}18`,
          border:`1px solid ${orderType==="sur_place"?C.green:C.blue}`,borderRadius:8,padding:"3px 10px",fontSize:11,
          color:orderType==="sur_place"?C.green:C.blue,fontWeight:700,cursor:"pointer"}}
          onClick={()=>setOrderType(t=>t==="sur_place"?"emporter":"sur_place")}>
          {orderType==="sur_place"?"🍽 Sur place":"🥡 Emporter"}
        </div>
        <div style={{textAlign:"right",borderLeft:`1px solid ${C.border}`,paddingLeft:10}}>
          <div style={{fontSize:9,color:C.muted,fontWeight:600}}>AUJOURD'HUI</div>
          <div style={{fontSize:12,fontWeight:800,color:C.accent}}>{fmt(todayRev)} F</div>
        </div>

        {/* Toggle Dark/Light */}
        <button onClick={()=>setDarkMode(d=>!d)}
          style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,border:`1px solid ${C.border}`,cursor:"pointer",background:C.surface2,color:C.txt,fontSize:11,fontWeight:600}}>
          {darkMode?"☀️ Clair":"🌙 Sombre"}
        </button>

        {/* Rôle */}
        <div style={{display:"flex",gap:4}}>
          {["admin","employee"].map(r=>(
            <button key={r} onClick={()=>{setRole(r);setPage("caisse");}}
              style={{padding:"4px 10px",borderRadius:12,border:`1px solid ${role===r?C.accent:C.border}`,cursor:"pointer",fontSize:10,fontWeight:600,
                background:role===r?C.accent:"transparent",color:role===r?"#fff":C.muted}}>
              {r==="admin"?"👑 Admin":"👤 Emp."}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── SIDEBAR ──────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <div style={{width:175,background:C.sidebar,display:"flex",flexDirection:"column",padding:"12px 0",flexShrink:0,overflowY:"auto"}}>
      {nav.map(n=>(
        <div key={n.k} onClick={()=>setPage(n.k)}
          style={{display:"flex",alignItems:"center",gap:9,padding:"10px 16px",cursor:"pointer",fontSize:12,
            borderLeft:page===n.k?`3px solid ${C.accentL}`:"3px solid transparent",
            background:page===n.k?C.sidebarActiveBg:"transparent",
            color:page===n.k?"#fff":C.sidebarText,
            fontWeight:page===n.k?700:400}}>
          <span style={{fontSize:14}}>{n.i}</span>
          <span>{n.l}</span>
          {n.k==="cuisine"&&orders.filter(o=>o.statut==="en_attente").length>0&&(
            <span style={{marginLeft:"auto",background:C.red,color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px"}}>
              {orders.filter(o=>o.statut==="en_attente").length}
            </span>
          )}
          {n.k==="ingredients"&&ingCritiques.length>0&&(
            <span style={{marginLeft:"auto",background:C.red,color:"#fff",borderRadius:10,fontSize:10,fontWeight:700,padding:"1px 6px"}}>
              {ingCritiques.length}
            </span>
          )}
        </div>
      ))}

      {/* Footer sidebar */}
      <div style={{marginTop:"auto",padding:"12px 16px",borderTop:`1px solid rgba(255,255,255,0.08)`}}>
        <div style={{fontSize:11,color:"#fff",fontWeight:700}}>{role==="admin"?"Admin":"Employé"}</div>
        <div style={{fontSize:10,color:C.sidebarText,marginTop:1}}>HIT Fast Food</div>
        <div style={{display:"flex",alignItems:"center",gap:4,marginTop:4}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:dbStatus==="ok"?C.green:C.red}}></span>
          <span style={{fontSize:10,color:dbStatus==="ok"?C.green:C.red}}>{dbStatus==="ok"?"En ligne":"Hors ligne"}</span>
        </div>
      </div>
    </div>
  );

  const MBtn = ({m,active,onClick,color}) => (
    <button onClick={onClick} style={{flex:1,padding:"5px 3px",border:`1px solid ${active?(color||C.accent):C.border}`,borderRadius:6,
      cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap",
      background:active?(color||C.accent):"transparent",color:active?"#fff":C.muted}}>
      {m==="Wave"?"〰 Wave":m==="Orange Money"?"🟠 OM":m==="Glovo"?"🛵 Glovo":m}
    </button>
  );

  return (
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:C.bg,color:C.txt,minHeight:"100vh",display:"flex",flexDirection:"column",fontSize:14,transition:"background 0.2s,color 0.2s"}}>
      <Topbar/>

      {toast&&<div style={{position:"fixed",top:62,right:18,zIndex:9999,background:toast.err?"#7f1d1d":"#14532d",color:toast.err?"#fca5a5":"#86efac",padding:"8px 16px",borderRadius:10,fontWeight:600,fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>{toast.msg}</div>}

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <Sidebar/>

        <div style={{flex:1,overflow:"hidden",display:"flex"}}>

          {/* ══ CAISSE ══ */}
          {page==="caisse"&&(
            <div style={{display:"flex",flex:1,overflow:"hidden"}}>
              {/* Grille produits */}
              <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  {["sur_place","emporter"].map(t=>(
                    <button key={t} onClick={()=>setOrderType(t)}
                      style={{flex:1,padding:"9px",borderRadius:9,border:`2px solid ${orderType===t?(t==="sur_place"?C.green:C.blue):C.border}`,
                        cursor:"pointer",fontWeight:700,fontSize:12,
                        background:orderType===t?(t==="sur_place"?`${C.green}15`:`${C.blue}15`):"transparent",
                        color:orderType===t?(t==="sur_place"?C.green:C.blue):C.muted}}>
                      {t==="sur_place"?"🍽️ Sur place":"🥡 Emporter"}
                    </button>
                  ))}
                  {orderType==="sur_place"&&(
                    <button onClick={()=>setPage("tables")}
                      style={{flex:1,padding:"9px",borderRadius:9,border:`2px solid ${selTable?C.accent:C.border}`,
                        cursor:"pointer",fontWeight:700,fontSize:12,
                        background:selTable?C.accentBg:"transparent",color:selTable?C.accent:C.muted}}>
                      {selTable?`🪑 ${selTable.label}`:"🪑 Choisir table"}
                    </button>
                  )}
                </div>

                <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
                  <input style={{...S.input,flex:1}} placeholder="🔍 Rechercher un plat, boisson…" value={search} onChange={e=>setSearch(e.target.value)}/>
                  {role==="admin"&&(
                    <button style={{...S.btnG,width:"auto",padding:"8px 14px",whiteSpace:"nowrap",fontSize:12}} onClick={()=>{ setImgPreview(""); setModal("addProd"); }}>
                      + Nouveau produit
                    </button>
                  )}
                </div>

                {/* Catégories */}
                <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
                  {CATS.map(c=>(
                    <button key={c} onClick={()=>setCat(c)}
                      style={{padding:"5px 14px",borderRadius:16,border:`1px solid ${cat===c?C.accent:C.border}`,cursor:"pointer",fontSize:11,fontWeight:600,
                        background:cat===c?C.accent:"transparent",color:cat===c?"#fff":C.muted,transition:"all .15s"}}>
                      {c==="Tout"?"🍽 Tous":c==="Plats"?"🥘 Plats":c==="Boissons"?"🥤 Boissons":"🍰 Desserts"}
                    </button>
                  ))}
                </div>

                {/* Grille */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:10}}>
                  {filtered.map(p=>(
                    <div key={p.id} onClick={()=>addToCart(p)}
                      style={{background:C.cardBg,border:`1px solid ${C.cardBorder}`,borderRadius:12,padding:10,
                        cursor:p.stock>0?"pointer":"not-allowed",textAlign:"center",transition:"all .15s",
                        opacity:p.stock===0?0.45:1,display:"flex",flexDirection:"column",gap:4,
                        boxShadow:C.shadow}}
                      onMouseEnter={e=>{if(p.stock>0){e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 4px 12px ${C.accent}30`;}}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.cardBorder;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=C.shadow;}}>
                      {p.img_url
                        ? <img src={p.img_url} alt={p.name} style={{width:"100%",height:80,objectFit:"cover",borderRadius:8}}/>
                        : <div style={{fontSize:36,height:80,display:"flex",alignItems:"center",justifyContent:"center",background:C.surface2,borderRadius:8}}>{p.img}</div>
                      }
                      <div style={{fontSize:11,fontWeight:600,lineHeight:1.3,color:C.txt}}>{p.name}</div>
                      <div style={{fontSize:12,fontWeight:800,color:C.accent}}>{fmt(p.price)} F</div>
                      <div style={{fontSize:10,color:p.stock<5?C.red:C.muted}}>Stock: {p.stock}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Panier ── */}
              <div style={{width:300,background:C.surface,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.surface}}>
                  <span style={{fontWeight:800,fontSize:14,color:C.txt}}>🧾 Commande</span>
                  <span style={{fontSize:11,color:orderType==="sur_place"?C.green:C.blue,fontWeight:600}}>
                    {orderType==="sur_place"?`🍽 Sur place${selTable?` · ${selTable.label}`:""}` :"🥡 Emporter"}
                  </span>
                </div>

                {cart.length===0?(
                  <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:C.muted,gap:8}}>
                    <span style={{fontSize:36}}>🛒</span>
                    <span style={{fontSize:13}}>Panier vide</span>
                    <span style={{fontSize:11,color:C.muted,textAlign:"center",padding:"0 20px"}}>Cliquez sur un produit pour l'ajouter</span>
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
                            <td style={{...S.td,fontSize:11,paddingLeft:10}}>{i.img} {i.name}</td>
                            <td style={{...S.td,textAlign:"center"}}>
                              <div style={{display:"flex",alignItems:"center",gap:3,justifyContent:"center"}}>
                                <button onClick={()=>updateQty(i.id,-1)} style={{width:20,height:20,borderRadius:5,border:`1px solid ${C.border}`,background:C.surface2,color:C.txt,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                                <span style={{fontSize:12,fontWeight:700,minWidth:16,textAlign:"center"}}>{i.qty}</span>
                                <button onClick={()=>updateQty(i.id,1)}  style={{width:20,height:20,borderRadius:5,border:`1px solid ${C.border}`,background:C.surface2,color:C.txt,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                              </div>
                            </td>
                            <td style={{...S.td,textAlign:"right",color:C.accent,fontWeight:700,fontSize:11}}>{fmt(i.price*i.qty)}</td>
                            <td style={S.td}><button onClick={()=>removeItem(i.id)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:12}}>✕</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{padding:12,borderTop:`1px solid ${C.border}`,display:"flex",flexDirection:"column",gap:8,background:C.surface}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}>
                    <span>Sous-total</span><span>{fmt(cartSub)} F</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11}}>
                    <span style={{color:C.muted}}>Remise</span>
                    <input style={{...S.input,width:80,textAlign:"right",padding:"4px 8px",fontSize:11}} type="number" value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="0"/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:16,padding:"6px 0",borderTop:`1px solid ${C.border}`}}>
                    <span>Total</span><span style={{color:C.green}}>{fmt(cartTotal)} F</span>
                  </div>

                  {/* Mode paiement */}
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={()=>setPayMode("simple")} style={{flex:1,padding:"5px",border:`1px solid ${payMode==="simple"?C.accent:C.border}`,borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600,background:payMode==="simple"?C.accent:"transparent",color:payMode==="simple"?"#fff":C.muted}}>Simple</button>
                    <button onClick={()=>setPayMode("mixte")} style={{flex:1,padding:"5px",border:`1px solid ${payMode==="mixte"?C.blue:C.border}`,borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600,background:payMode==="mixte"?C.blue:"transparent",color:payMode==="mixte"?"#fff":C.muted}}>💰 Mixte</button>
                  </div>

                  {payMode==="simple"&&(
                    <>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                        {METHODS.map(m=><MBtn key={m} m={m} active={method1===m} onClick={()=>setMethod1(m)}/>)}
                      </div>
                      {method1==="Espèces"&&(
                        <>
                          <input style={{...S.input,fontSize:12,padding:"7px 10px"}} type="number" placeholder="Montant reçu (F)" value={amount1} onChange={e=>setAmount1(e.target.value)}/>
                          {amount1&&change>0&&(
                            <div style={{background:`${C.green}15`,border:`1px solid ${C.green}40`,borderRadius:7,padding:"7px 10px",fontSize:11}}>
                              Monnaie : <strong style={{color:C.green}}>{fmt(change)} F</strong>
                            </div>
                          )}
                        </>
                      )}
                      {method1==="Glovo"&&<div style={{background:`${C.orange}15`,border:`1px solid ${C.orange}40`,borderRadius:6,padding:"5px 8px",fontSize:10,color:C.orange}}>🛵 Encaissement Glovo à la semaine</div>}
                    </>
                  )}

                  {payMode==="mixte"&&(
                    <div style={{background:C.surface2,borderRadius:8,padding:10,display:"flex",flexDirection:"column",gap:6}}>
                      <div style={{fontSize:10,color:C.muted,fontWeight:600}}>Paiement 1</div>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{METHODS.map(m=><MBtn key={m} m={m} active={method1===m} onClick={()=>setMethod1(m)}/>)}</div>
                      <input style={{...S.input,fontSize:11,padding:"5px 9px"}} type="number" placeholder={`Montant ${method1} (F)`} value={amount1} onChange={e=>setAmount1(e.target.value)}/>
                      <div style={{fontSize:10,color:C.muted,fontWeight:600}}>Paiement 2</div>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{METHODS.filter(m=>m!==method1).map(m=><MBtn key={m} m={m} active={method2===m} onClick={()=>setMethod2(m)}/>)}</div>
                      <input style={{...S.input,fontSize:11,padding:"5px 9px"}} type="number" placeholder={`Montant ${method2} (F)`} value={amount2} onChange={e=>setAmount2(e.target.value)}/>
                      {(amount1||amount2)&&<div style={{borderTop:`1px solid ${C.border}`,paddingTop:5,fontSize:11}}>{totalPaid>=cartTotal?<div style={{color:C.green,fontWeight:700}}>✓ Rendu : {fmt(change)} F</div>:<div style={{color:C.red}}>⚠ Manque : {fmt(cartTotal-totalPaid)} F</div>}</div>}
                    </div>
                  )}

                  <button style={{...S.btnB,...(!cart.length||loading?{opacity:.4,cursor:"not-allowed"}:{})}} onClick={()=>cart.length&&!loading&&sendToKitchen()}>👨‍🍳 Envoyer en cuisine</button>
                  <button style={{...S.btnG,...(!cart.length||loading?{opacity:.4,cursor:"not-allowed"}:{})}} onClick={()=>cart.length&&!loading&&setModal("confirm")}>✓ Encaisser directement</button>
                  <button style={S.btnO} onClick={()=>setCart([])}>Vider le panier</button>
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
                  <div key={t.id} style={{...S.card,cursor:"pointer",textAlign:"center",transition:"all .15s",
                    borderColor:t.statut==="occupée"?C.accent:t.statut==="libre"?`${C.green}40`:C.cardBorder}}
                    onClick={()=>selectTable(t)}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=`0 6px 20px ${C.accent}25`;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=C.shadow;}}>
                    <div style={{fontSize:30,marginBottom:6}}>🪑</div>
                    <div style={{fontWeight:800,fontSize:17,color:C.txt}}>{t.label}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>{t.capacite} personnes</div>
                    <div style={{marginTop:8}}>
                      <span style={{display:"inline-block",padding:"3px 12px",borderRadius:10,fontSize:11,fontWeight:600,
                        background:t.statut==="libre"?`${C.green}15`:`${C.accent}15`,
                        color:t.statut==="libre"?C.green:C.accent}}>
                        {t.statut}
                      </span>
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
                <div style={{textAlign:"center",padding:60,color:C.muted}}>
                  <div style={{fontSize:48,marginBottom:12}}>✅</div>
                  <div style={{fontSize:16,fontWeight:600}}>Aucune commande en attente</div>
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
                  {orders.map(order=>(
                    <div key={order.id} style={{background:order.statut==="en_attente"?(darkMode?"#1a0f00":"#fff8f0"):(darkMode?"#001a0f":"#f0fff8"),border:`2px solid ${order.statut==="en_attente"?C.orange:C.green}`,borderRadius:12,padding:14,display:"flex",flexDirection:"column",gap:10}}>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <span style={{fontWeight:800,fontSize:14,color:C.accent}}>{order.reference}</span>
                        <span style={{fontSize:10,color:C.muted}}>{order.created_at?new Date(order.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):""}</span>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {(orderItems[order.id]||[]).map(item=>(
                          <div key={item.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:6,background:item.statut==="pret"?`${C.green}15`:`${C.surface2}`}}>
                            <span style={{fontSize:14,fontWeight:800,color:C.accent,minWidth:20}}>×{item.qty}</span>
                            <span style={{flex:1,fontSize:12,fontWeight:600,color:C.txt}}>{item.product_name}</span>
                            <button onClick={()=>updateItemStatut(item.id,order.id,item.statut==="pret"?"en_attente":"pret")}
                              style={{padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:10,fontWeight:700,background:item.statut==="pret"?C.green:C.surface,color:item.statut==="pret"?"#fff":C.muted}}>
                              {item.statut==="pret"?"✓ Prêt":"Marquer prêt"}
                            </button>
                          </div>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        {order.statut==="en_attente"&&<button onClick={()=>updateOrderStatut(order.id,"en_preparation")} style={{flex:1,padding:"7px",borderRadius:7,border:"none",cursor:"pointer",background:C.orange,color:"#fff",fontWeight:700,fontSize:11}}>🔥 Démarrer</button>}
                        {order.statut==="en_preparation"&&<button onClick={()=>updateOrderStatut(order.id,"pret")} style={{flex:1,padding:"7px",borderRadius:7,border:"none",cursor:"pointer",background:C.green,color:"#fff",fontWeight:700,fontSize:11}}>✅ Prêt à servir</button>}
                        {order.statut==="pret"&&<button onClick={()=>updateOrderStatut(order.id,"servi")} style={{flex:1,padding:"7px",borderRadius:7,border:"none",cursor:"pointer",background:C.surface2,color:C.muted,fontWeight:700,fontSize:11}}>Marquer servi</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ INGRÉDIENTS ══ */}
          {page==="ingredients"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontWeight:700,fontSize:15,color:C.txt}}>🧂 Stock Ingrédients</span>
                <button style={{...S.btnG,width:"auto",padding:"7px 14px"}} onClick={()=>setModal("addIng")}>+ Ajouter</button>
              </div>
              {ingCritiques.length>0&&(
                <div style={{background:`${C.red}10`,border:`1px solid ${C.red}`,borderRadius:10,padding:12,marginBottom:14}}>
                  <div style={{fontWeight:700,color:C.red,marginBottom:8}}>⚠️ Ingrédients en rupture ou stock critique</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {ingCritiques.map(i=>(<span key={i.id} style={{background:`${C.red}20`,color:C.red,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600}}>{i.name} — {i.stock} {i.unit}</span>))}
                  </div>
                </div>
              )}
              <input style={{...S.input,marginBottom:12}} placeholder="🔍 Rechercher un ingrédient…" value={ingSearch} onChange={e=>setIngSearch(e.target.value)}/>
              <div style={S.card}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["Ingrédient","Unité","Stock actuel","Stock min","Coût/unité","Statut","Modifier stock"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {filteredIng.map(i=>{
                      const statut = i.stock<=0?"Épuisé":i.stock<=i.stock_min?"Critique":"OK";
                      const statutColor = statut==="Épuisé"?C.red:statut==="Critique"?"#fbbf24":C.green;
                      return(
                        <tr key={i.id}>
                          <td style={{...S.td,fontWeight:600,color:C.txt}}>{i.name}</td>
                          <td style={{...S.td,color:C.muted}}>{i.unit}</td>
                          <td style={{...S.td,fontWeight:700,color:i.stock<=i.stock_min?C.red:C.txt}}>{i.stock}</td>
                          <td style={{...S.td,color:C.muted}}>{i.stock_min}</td>
                          <td style={{...S.td,color:C.muted}}>{fmt(i.cost_unit)} F</td>
                          <td style={S.td}><span style={{display:"inline-block",padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:600,background:`${statutColor}22`,color:statutColor}}>{statut}</span></td>
                          <td style={S.td}>
                            <input type="number" defaultValue={i.stock} onBlur={e=>{ if(Number(e.target.value)!==i.stock) updateIngredientStock(i.id, e.target.value); }}
                              style={{...S.input,width:70,padding:"3px 7px",fontSize:11,textAlign:"center"}}/>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ RECETTES ══ */}
          {page==="recettes"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14,color:C.txt}}>📖 Gestion des Recettes</div>
              <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                <div style={{...S.card,width:220,flexShrink:0}}>
                  <div style={{fontWeight:700,marginBottom:10,fontSize:13,color:C.txt}}>Sélectionner un plat</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {products.map(p=>(
                      <div key={p.id} onClick={()=>setSelProduct(p)}
                        style={{padding:"8px 10px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600,
                          background:selProduct?.id===p.id?C.accentBg:"transparent",
                          border:`1px solid ${selProduct?.id===p.id?C.accent:C.border}`,
                          color:selProduct?.id===p.id?C.accent:C.txt}}>
                        {p.img} {p.name}
                        <div style={{fontSize:10,color:C.muted,fontWeight:400}}>{recettes.filter(r=>r.product_id===p.id).length} ingrédient(s)</div>
                      </div>
                    ))}
                  </div>
                </div>
                {selProduct&&(
                  <div style={{flex:1,minWidth:300}}>
                    <div style={{...S.card,marginBottom:12}}>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:C.accent}}>{selProduct.img} {selProduct.name} — Ingrédients</div>
                      {recettes.filter(r=>r.product_id===selProduct.id).length===0?(
                        <div style={{color:C.muted,fontSize:12,textAlign:"center",padding:20}}>Aucun ingrédient défini pour ce plat</div>
                      ):(
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead><tr>{["Ingrédient","Quantité","Unité",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                          <tbody>
                            {recettes.filter(r=>r.product_id===selProduct.id).map(r=>{
                              const ing = ingredients.find(i=>i.id===r.ingredient_id);
                              return(
                                <tr key={r.id}>
                                  <td style={{...S.td,fontWeight:600,color:C.txt}}>{ing?.name||"?"}</td>
                                  <td style={{...S.td,color:C.accent,fontWeight:700}}>{r.quantite}</td>
                                  <td style={{...S.td,color:C.muted}}>{ing?.unit||""}</td>
                                  <td style={S.td}><button onClick={()=>deleteRecette(r.id)} style={S.btnR}>✕</button></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                    <div style={S.card}>
                      <div style={{fontWeight:700,marginBottom:10,fontSize:13,color:C.txt}}>+ Ajouter un ingrédient</div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        <div style={{flex:2,minWidth:150}}>
                          <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Ingrédient</div>
                          <select style={S.input} value={newR.ingredient_id} onChange={e=>setNewR(p=>({...p,ingredient_id:e.target.value}))}>
                            <option value="">-- Choisir --</option>
                            {ingredients.map(i=><option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                          </select>
                        </div>
                        <div style={{flex:1,minWidth:80}}>
                          <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Quantité</div>
                          <input style={S.input} type="number" placeholder="ex: 0.2" value={newR.quantite} onChange={e=>setNewR(p=>({...p,quantite:e.target.value}))}/>
                        </div>
                        <div style={{display:"flex",alignItems:"flex-end"}}>
                          <button style={{...S.btnG,width:"auto",padding:"8px 16px"}} onClick={addRecette}>Ajouter</button>
                        </div>
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
                <button style={{...S.btnG,width:"auto",padding:"7px 14px"}} onClick={()=>{ setImgPreview(""); setModal("addProd"); }}>+ Nouveau produit</button>
              </div>
              <div style={S.card}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["","Produit","Cat.","Coût","Prix","Marge","%","Stock"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {products.map(p=>{const mg=p.price-p.cost,pct=p.price>0?((mg/p.price)*100).toFixed(1):0;return(
                      <tr key={p.id}>
                        <td style={S.td}>
                          {p.img_url
                            ?<img src={p.img_url} alt={p.name} style={{width:32,height:32,objectFit:"cover",borderRadius:6}}/>
                            :<span style={{fontSize:20}}>{p.img}</span>
                          }
                        </td>
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
                  <thead><tr>{["Référence","Date","Vendeur","Mode","Montant",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {sales.map(sale=>(
                      <tr key={sale.id}>
                        <td style={{...S.td,color:C.accent,fontWeight:700}}>{sale.reference}</td>
                        <td style={{...S.td,color:C.muted}}>{sale.created_at?new Date(sale.created_at).toLocaleString("fr-FR"):""}</td>
                        <td style={{...S.td,color:C.txt}}>{sale.vendor}</td>
                        <td style={S.td}><span style={{display:"inline-block",padding:"2px 7px",borderRadius:8,fontSize:10,fontWeight:600,background:`${C.blue}20`,color:C.blue}}>{sale.method}</span></td>
                        <td style={{...S.td,fontWeight:700,color:C.green}}>{fmt(sale.total)} F</td>
                        <td style={S.td}><button onClick={async()=>{await loadSaleItems(sale.id);setSelSale(sale);setModal("receipt");}} style={{background:`${C.green}15`,color:C.green,border:"none",borderRadius:5,padding:"4px 9px",cursor:"pointer",fontSize:11,fontWeight:600}}>Détail</button></td>
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
              <div style={{fontWeight:700,fontSize:15,marginBottom:14,color:C.txt}}>📦 Stock Produits finis</div>
              <div style={S.card}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["","Produit","Cat.","Stock","Statut"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {products.map(p=>(
                      <tr key={p.id}>
                        <td style={S.td}>
                          {p.img_url?<img src={p.img_url} alt={p.name} style={{width:28,height:28,objectFit:"cover",borderRadius:5}}/>:<span style={{fontSize:18}}>{p.img}</span>}
                        </td>
                        <td style={{...S.td,fontWeight:600,color:C.txt}}>{p.name}</td>
                        <td style={{...S.td,color:C.muted}}>{p.cat}</td>
                        <td style={{...S.td,fontWeight:700,color:p.stock<5?C.red:C.txt}}>{p.stock}</td>
                        <td style={S.td}><span style={{display:"inline-block",padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:600,
                          background:p.stock===0?`${C.red}20`:p.stock<5?`${C.orange}20`:`${C.green}20`,
                          color:p.stock===0?C.red:p.stock<5?C.orange:C.green}}>
                          {p.stock===0?"Épuisé":p.stock<5?"Faible":"En stock"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ RAPPORTS ══ */}
          {page==="rapports"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                {[
                  {l:"Ventes totales",v:fmt(totalRev)+" F",i:"🏦",c:C.accent},
                  {l:"Aujourd'hui",   v:fmt(todayRev)+" F",i:"📅",c:C.green},
                  {l:"Transactions",  v:sales.length,       i:"💳",c:C.txt},
                  {l:"Glovo",         v:fmt(glovoRev)+" F", i:"🛵",c:C.orange},
                ].map(c=>(
                  <div key={c.l} style={{...S.card,flex:1,minWidth:120}}>
                    <div style={{fontSize:20,marginBottom:5}}>{c.i}</div>
                    <div style={{fontSize:10,color:C.muted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{c.l}</div>
                    <div style={{fontSize:16,fontWeight:800,color:c.c}}>{c.v}</div>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{fontWeight:700,marginBottom:10,color:C.txt}}>Répartition paiements</div>
                {(()=>{
                  const bm=METHODS.map((m,i)=>({name:m,v:sales.filter(s=>s.method?.includes(m)).reduce((a,s)=>a+s.total,0),color:PAY_COLORS[i]})).filter(m=>m.v>0);
                  return bm.length===0?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:20}}>Aucune vente</div>:(
                    <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                      <PieChart width={130} height={130}><Pie data={bm} dataKey="v" cx={60} cy={60} innerRadius={34} outerRadius={58}>{bm.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie></PieChart>
                      <div style={{display:"flex",flexDirection:"column",gap:7}}>
                        {bm.map(d=><div key={d.name} style={{display:"flex",alignItems:"center",gap:7,fontSize:11}}>
                          <span style={{width:8,height:8,borderRadius:2,background:d.color,flexShrink:0}}></span>
                          <span style={{color:C.muted}}>{d.name}</span>
                          <span style={{fontWeight:700,marginLeft:6,color:C.txt}}>{fmt(d.v)} F</span>
                        </div>)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ══ PARAMÈTRES ══ */}
          {page==="parametres"&&(
            <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14,color:C.txt}}>Paramètres</div>

              {/* Thème */}
              <div style={{...S.card,marginBottom:14}}>
                <div style={{fontWeight:700,marginBottom:10,color:C.txt}}>🎨 Apparence</div>
                <div style={{display:"flex",gap:10}}>
                  {[
                    {label:"🌙 Mode sombre",dark:true},
                    {label:"☀️ Mode clair",dark:false},
                  ].map(opt=>(
                    <button key={String(opt.dark)} onClick={()=>setDarkMode(opt.dark)}
                      style={{flex:1,padding:"10px",borderRadius:9,border:`2px solid ${darkMode===opt.dark?C.accent:C.border}`,cursor:"pointer",
                        background:darkMode===opt.dark?C.accentBg:"transparent",color:darkMode===opt.dark?C.accent:C.muted,fontWeight:700,fontSize:13}}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Infos commerce */}
              <div style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontWeight:700,color:C.txt}}>🏪 Informations du commerce</div>
                  <button onClick={()=>{ if(editShop) showToast("Sauvegardé ✓"); setEditShop(!editShop); }}
                    style={{background:editShop?C.accent:"transparent",color:editShop?"#fff":C.accent,border:`1px solid ${C.accent}`,borderRadius:6,padding:"4px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>
                    {editShop?"✓ Enregistrer":"Modifier"}
                  </button>
                </div>
                {editShop?(
                  <div style={{display:"flex",flexDirection:"column",gap:9}}>
                    {[{l:"Nom",k:"name"},{l:"Adresse",k:"address"},{l:"Téléphone",k:"phone"}].map(f=>(
                      <div key={f.k}>
                        <div style={{fontSize:11,color:C.muted,marginBottom:3}}>{f.l}</div>
                        <input style={S.input} value={shopInfo[f.k]||""} onChange={e=>setShopInfo(p=>({...p,[f.k]:e.target.value}))}/>
                      </div>
                    ))}
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {[{l:"Nom",k:"name"},{l:"Adresse",k:"address"},{l:"Téléphone",k:"phone"}].map(f=>(
                      <div key={f.k} style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                        <span style={{color:C.muted}}>{f.l}</span>
                        <span style={{fontWeight:600,color:C.txt}}>{shopInfo[f.k]||"—"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODALS ─── */}
      {/* Confirmation encaissement */}
      {modal==="confirm"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:420,maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <AmlyLogo size={28} C={C}/>
              <span style={{fontWeight:800,fontSize:15,color:C.txt}}>Confirmer l'encaissement</span>
            </div>
            {cart.map(i=>(
              <div key={i.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6,color:C.txt}}>
                <span>{i.img} {i.name} × {i.qty}</span>
                <span style={{color:C.accent,fontWeight:700}}>{fmt(i.price*i.qty)} F</span>
              </div>
            ))}
            <div style={{borderTop:`1px solid ${C.border}`,marginTop:10,paddingTop:10,display:"flex",flexDirection:"column",gap:5}}>
              {discount>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}><span>Remise</span><span>-{fmt(discount)} F</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15}}><span style={{color:C.txt}}>Total</span><span style={{color:C.green}}>{fmt(cartTotal)} F</span></div>
              <div style={{fontSize:11,color:C.muted}}>Mode : {methodLabel}</div>
              {change>0&&<div style={{fontSize:11,color:C.green,fontWeight:600}}>Monnaie à rendre : {fmt(change)} F</div>}
            </div>
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button style={S.btnG} onClick={confirmSale}>✓ Valider la vente</button>
              <button style={S.btnO} onClick={()=>setModal(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket de caisse */}
      {modal==="receipt"&&selSale&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:420,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${C.border}`}}>
              <AmlyLogo size={38} C={C}/>
              <div style={{fontWeight:900,fontSize:15,color:C.accent,marginTop:8}}>AMLY-POS</div>
              <div style={{fontSize:12,color:C.txt,fontWeight:700}}>HIT FAST FOOD</div>
              <div style={{fontSize:11,color:C.muted}}>{shopInfo.address}</div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
              <span style={{display:"inline-block",padding:"2px 9px",borderRadius:7,fontSize:11,fontWeight:600,background:C.accentBg,color:C.accent}}>{selSale.reference}</span>
              <span style={{fontSize:11,color:C.muted}}>{selSale.created_at?new Date(selSale.created_at).toLocaleString("fr-FR"):""}</span>
            </div>
            {saleItems[selSale.id]&&(
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:12}}>
                <thead><tr>{["Produit","Qté","Prix","Total"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {saleItems[selSale.id].map((i,idx)=>(
                    <tr key={idx}>
                      <td style={{...S.td,fontSize:11,color:C.txt}}>{i.name}</td>
                      <td style={{...S.td,color:C.muted}}>{i.qty}</td>
                      <td style={{...S.td,color:C.muted}}>{fmt(i.price)}</td>
                      <td style={{...S.td,color:C.accent,fontWeight:700}}>{fmt(i.price*i.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{background:C.surface2,borderRadius:9,padding:12,display:"flex",flexDirection:"column",gap:6,fontSize:12,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15}}><span style={{color:C.txt}}>Total</span><span style={{color:C.green}}>{fmt(selSale.total)} F</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.muted}}>Mode</span><span style={{color:C.blue,fontSize:11}}>{selSale.method}</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.muted}}>Vendeur</span><span style={{color:C.txt}}>{selSale.vendor}</span></div>
            </div>
            <div style={{textAlign:"center",fontSize:10,color:C.muted,marginBottom:12}}>Merci pour votre visite ! — HIT Fast Food</div>
            <button style={S.btnG} onClick={()=>setModal(null)}>Fermer</button>
          </div>
        </div>
      )}

      {/* Ajout produit avec upload photo */}
      {modal==="addProd"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:400,maxHeight:"88vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:16,color:C.txt}}>Nouveau produit</div>

            {/* Upload photo */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:6,fontWeight:600}}>PHOTO DU PRODUIT</div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                {imgPreview
                  ? <img src={imgPreview} alt="preview" style={{width:72,height:72,objectFit:"cover",borderRadius:10,border:`2px solid ${C.accent}`,flexShrink:0}}/>
                  : <div style={{width:72,height:72,borderRadius:10,border:`2px dashed ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,background:C.surface2,flexShrink:0,cursor:"pointer"}} onClick={()=>fileInputRef.current?.click()}>📷</div>
                }
                <div style={{display:"flex",flexDirection:"column",gap:6,flex:1}}>
                  <button onClick={()=>fileInputRef.current?.click()}
                    style={{...S.btnO,padding:"7px 10px",fontSize:12}}>
                    📁 Choisir une image
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleImageFile(e.target.files[0])}/>
                  <div style={{fontSize:10,color:C.muted}}>Ou coller une URL :</div>
                  <input style={{...S.input,fontSize:11}} placeholder="https://..." value={newP.img_url||""} onChange={e=>{setNewP(p=>({...p,img_url:e.target.value}));setImgPreview(e.target.value);}}/>
                </div>
              </div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {[
                {l:"Nom du produit",k:"name",t:"text",p:"Ex: Poulet braisé"},
                {l:"Emoji (si pas de photo)",k:"img",t:"text",p:"🍗"},
                {l:"Prix de vente (FCFA)",k:"price",t:"number",p:"5000"},
                {l:"Coût d'achat (FCFA)",k:"cost",t:"number",p:"2000"},
                {l:"Stock initial",k:"stock",t:"number",p:"10"},
              ].map(f=>(
                <div key={f.k}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>{f.l.toUpperCase()}</div>
                  <input style={S.input} type={f.t} placeholder={f.p} value={newP[f.k]||""} onChange={e=>setNewP(p=>({...p,[f.k]:e.target.value}))}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>CATÉGORIE</div>
                <select style={S.input} value={newP.cat} onChange={e=>setNewP(p=>({...p,cat:e.target.value}))}>
                  {["Plats","Boissons","Desserts"].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button style={S.btnG} onClick={addProduct}>Ajouter le produit</button>
                <button style={S.btnO} onClick={()=>setModal(null)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ajout ingrédient */}
      {modal==="addIng"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:380}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:16,color:C.txt}}>Nouvel ingrédient</div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {[{l:"Nom",k:"name",t:"text",p:"Ex: Farine"},{l:"Stock actuel",k:"stock",t:"number",p:"10"},{l:"Stock minimum",k:"stock_min",t:"number",p:"2"},{l:"Coût par unité (FCFA)",k:"cost_unit",t:"number",p:"500"}].map(f=>(
                <div key={f.k}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>{f.l.toUpperCase()}</div>
                  <input style={S.input} type={f.t} placeholder={f.p} value={newI[f.k]||""} onChange={e=>setNewI(p=>({...p,[f.k]:e.target.value}))}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:C.muted,marginBottom:3,fontWeight:600}}>UNITÉ</div>
                <select style={S.input} value={newI.unit} onChange={e=>setNewI(p=>({...p,unit:e.target.value}))}>
                  {["kg","g","l","ml","pièce","tranche","bouteille","sachet"].map(u=><option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button style={S.btnG} onClick={addIngredient}>Ajouter</button>
                <button style={S.btnO} onClick={()=>setModal(null)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
