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
const PAY_COLORS = ["#c9a84c","#3b82f6","#f97316","#8b5cf6","#ec4899"];

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

const C = {
  gold:"#c9a84c", goldL:"#e8c96a", dark:"#0f0f0f", dark2:"#1a1a1a", dark3:"#242424",
  txt:"#f0ede8", muted:"#777", green:"#22c55e", red:"#ef4444", blue:"#3b82f6",
  orange:"#f97316", border:"rgba(201,168,76,0.18)"
};

const fmt = n => new Intl.NumberFormat("fr-FR").format(n||0);

const HitLogo = ({size=32}) => (
  <div style={{width:size,height:size,background:"linear-gradient(135deg,#f5c400,#e8a800)",borderRadius:Math.round(size*0.2),
    display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,
    fontSize:Math.round(size*0.38),color:"#1a1a1a",fontFamily:"Impact,Arial Black,sans-serif",
    letterSpacing:"-1px",border:"2px solid #1a1a1a",flexShrink:0,boxShadow:"0 2px 8px rgba(245,196,0,0.3)"}}>
    HIT
  </div>
);

const S = {
  card:  {background:C.dark2, border:`1px solid ${C.border}`, borderRadius:12, padding:16},
  th:    {textAlign:"left",fontSize:10,color:C.muted,fontWeight:600,padding:"7px 10px",borderBottom:`1px solid ${C.border}`,textTransform:"uppercase"},
  td:    {padding:"10px 10px",fontSize:12,borderBottom:`1px solid rgba(255,255,255,0.04)`},
  input: {background:C.dark3,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",color:C.txt,fontSize:13,outline:"none",width:"100%",boxSizing:"border-box"},
  btnG:  {background:`linear-gradient(135deg,${C.gold},${C.goldL})`,color:"#000",border:"none",borderRadius:8,padding:"10px 16px",fontWeight:700,cursor:"pointer",fontSize:13,width:"100%"},
  btnO:  {background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 16px",fontWeight:600,cursor:"pointer",fontSize:13,width:"100%"},
  btnB:  {background:C.blue,color:"#fff",border:"none",borderRadius:8,padding:"10px 16px",fontWeight:700,cursor:"pointer",fontSize:13,width:"100%"},
  btnR:  {background:C.red,color:"#fff",border:"none",borderRadius:8,padding:"6px 12px",fontWeight:700,cursor:"pointer",fontSize:12},
};

export default function AmlyPOS() {
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
  const [newP,       setNewP]      = useState({name:"",cat:"Plats",price:"",cost:"",stock:"",img:"🍽️"});
  const [newI,       setNewI]      = useState({name:"",unit:"kg",stock:"",stock_min:"",cost_unit:""});
  const [newR,       setNewR]      = useState({ingredient_id:"",quantite:""});
  const [payMode,    setPayMode]   = useState("simple");
  const [method1,    setMethod1]   = useState("Espèces");
  const [method2,    setMethod2]   = useState("Wave");
  const [amount1,    setAmount1]   = useState("");
  const [amount2,    setAmount2]   = useState("");
  const [discount,   setDiscount]  = useState(0);
  const [rendMode,   setRendMode]  = useState("Espèces");
  const [shopInfo,   setShopInfo]  = useState({name:"HIT Fast Food", address:"Grand-Bassam, Côte d'Ivoire", phone:""});
  const [editShop,   setEditShop]  = useState(false);
  const [ingSearch,  setIngSearch] = useState("");

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
    setNewP({name:"",cat:"Plats",price:"",cost:"",stock:"",img:"🍽️"});
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

  const MBtn = ({m,active,onClick,color}) => (
    <button onClick={onClick} style={{flex:1,padding:"5px 3px",border:`1px solid ${active?(color||C.gold):C.border}`,borderRadius:6,
      cursor:"pointer",fontSize:10,fontWeight:600,whiteSpace:"nowrap",
      background:active?(color||C.gold):"transparent",color:active?(color?"#fff":"#000"):C.muted}}>
      {m==="Wave"?"〰 Wave":m==="Orange Money"?"🟠 OM":m==="Glovo"?"🛵 Glovo":m}
    </button>
  );

  const filteredIng = ingredients.filter(i=>i.name.toLowerCase().includes(ingSearch.toLowerCase()));

  return (
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:C.dark,color:C.txt,minHeight:"100vh",display:"flex",flexDirection:"column",fontSize:14}}>

      {/* TOPBAR */}
      <div style={{display:"flex",alignItems:"center",padding:"0 14px",height:50,background:C.dark2,borderBottom:`1px solid ${C.border}`,flexShrink:0,gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <HitLogo size={34}/>
          <div style={{lineHeight:1.1}}>
            <div style={{fontWeight:900,fontSize:13,color:C.gold,fontFamily:"Impact,sans-serif",letterSpacing:"0.05em"}}>HIT FAST FOOD</div>
            <div style={{fontSize:9,color:C.muted,fontWeight:600,letterSpacing:"0.1em"}}>POINT OF SALE</div>
          </div>
          {loading&&<span style={{fontSize:10,color:C.gold,marginLeft:4}}>⏳</span>}
          <div style={{display:"flex",alignItems:"center",gap:4,marginLeft:8}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:dbStatus==="ok"?C.green:C.red}}></span>
            <span style={{fontSize:9,color:dbStatus==="ok"?C.green:C.red}}>{dbStatus==="ok"?"DB connectée":"DB erreur"}</span>
          </div>
          {ingCritiques.length>0&&(
            <div style={{background:"rgba(239,68,68,0.15)",border:`1px solid ${C.red}`,borderRadius:6,padding:"2px 8px",fontSize:10,color:C.red,fontWeight:700}}>
              ⚠️ {ingCritiques.length} ingrédient{ingCritiques.length>1?"s":""} en rupture
            </div>
          )}
        </div>

        <div style={{display:"flex",gap:2,flex:1,justifyContent:"center",flexWrap:"wrap"}}>
          {nav.map(n=>(
            <button key={n.k} onClick={()=>setPage(n.k)}
              style={{padding:"4px 10px",borderRadius:5,border:"none",cursor:"pointer",fontSize:11,fontWeight:600,
                background:page===n.k?C.gold:"transparent",color:page===n.k?"#000":C.muted}}>
              {n.i} {n.l}
            </button>
          ))}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          {selTable&&<div style={{background:"rgba(201,168,76,0.15)",border:`1px solid ${C.gold}`,borderRadius:8,padding:"3px 10px",fontSize:11,color:C.gold,fontWeight:700}}>🪑 {selTable.label}</div>}
          <div style={{background:orderType==="sur_place"?"rgba(34,197,94,0.15)":"rgba(59,130,246,0.15)",
            border:`1px solid ${orderType==="sur_place"?C.green:C.blue}`,borderRadius:8,padding:"3px 10px",fontSize:11,
            color:orderType==="sur_place"?C.green:C.blue,fontWeight:700,cursor:"pointer"}}
            onClick={()=>setOrderType(t=>t==="sur_place"?"emporter":"sur_place")}>
            {orderType==="sur_place"?"🍽 Sur place":"🥡 Emporter"}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:C.muted}}>Aujourd'hui</div>
            <div style={{fontSize:12,fontWeight:800,color:C.gold}}>{fmt(todayRev)} F</div>
          </div>
          <div style={{display:"flex",gap:4}}>
            {["admin","employee"].map(r=>(
              <button key={r} onClick={()=>{setRole(r);setPage("caisse");}}
                style={{padding:"3px 9px",borderRadius:12,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:10,fontWeight:600,
                  background:role===r?C.gold:"transparent",color:role===r?"#000":C.muted}}>
                {r==="admin"?"👑":"👤"} {r==="admin"?"Admin":"Emp."}
              </button>
            ))}
          </div>
        </div>
      </div>

      {toast&&<div style={{position:"fixed",top:58,right:18,zIndex:9999,background:toast.err?"#7f1d1d":"#14532d",color:toast.err?"#fca5a5":"#86efac",padding:"8px 16px",borderRadius:10,fontWeight:600,fontSize:13,boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>{toast.msg}</div>}

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* SIDEBAR */}
        <div style={{width:170,background:C.dark2,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"10px 0",flexShrink:0,overflowY:"auto"}}>
          {nav.map(n=>(
            <div key={n.k} onClick={()=>setPage(n.k)}
              style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",cursor:"pointer",fontSize:12,
                borderLeft:page===n.k?`3px solid ${C.gold}`:"3px solid transparent",
                background:page===n.k?"rgba(201,168,76,0.08)":"transparent",
                color:page===n.k?C.gold:C.muted}}>
              <span>{n.i}</span><span>{n.l}</span>
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
          <div style={{marginTop:"auto",padding:"12px 14px",borderTop:`1px solid ${C.border}`}}>
            <div style={{fontSize:11,color:C.gold,fontWeight:700}}>{role==="admin"?"Admin":"Employé"}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:1}}>HIT Fast Food</div>
            <div style={{display:"flex",alignItems:"center",gap:4,marginTop:4}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:dbStatus==="ok"?C.green:C.red}}></span>
              <span style={{fontSize:10,color:dbStatus==="ok"?C.green:C.red}}>{dbStatus==="ok"?"En ligne":"Hors ligne"}</span>
            </div>
          </div>
        </div>

        <div style={{flex:1,overflow:"hidden",display:"flex"}}>

          {/* ══ CAISSE ══ */}
          {page==="caisse"&&(
            <div style={{display:"flex",flex:1,overflow:"hidden"}}>
              <div style={{flex:1,overflow:"auto",padding:14}}>
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  {["sur_place","emporter"].map(t=>(
                    <button key={t} onClick={()=>setOrderType(t)}
                      style={{flex:1,padding:"8px",borderRadius:8,border:`2px solid ${orderType===t?(t==="sur_place"?C.green:C.blue):C.border}`,
                        cursor:"pointer",fontWeight:700,fontSize:12,
                        background:orderType===t?(t==="sur_place"?"rgba(34,197,94,0.15)":"rgba(59,130,246,0.15)"):"transparent",
                        color:orderType===t?(t==="sur_place"?C.green:C.blue):C.muted}}>
                      {t==="sur_place"?"🍽️ Sur place":"🥡 Emporter"}
                    </button>
                  ))}
                  {orderType==="sur_place"&&(
                    <button onClick={()=>setPage("tables")}
                      style={{flex:1,padding:"8px",borderRadius:8,border:`2px solid ${selTable?C.gold:C.border}`,
                        cursor:"pointer",fontWeight:700,fontSize:12,
                        background:selTable?"rgba(201,168,76,0.15)":"transparent",
                        color:selTable?C.gold:C.muted}}>
                      {selTable?`🪑 ${selTable.label}`:"🪑 Choisir table"}
                    </button>
                  )}
                </div>
                <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
                  <input style={{...S.input,flex:1}} placeholder="🔍 Rechercher…" value={search} onChange={e=>setSearch(e.target.value)}/>
                  {role==="admin"&&<button style={{...S.btnG,width:"auto",padding:"8px 12px",whiteSpace:"nowrap",fontSize:12}} onClick={()=>setModal("addProd")}>+ Nouveau</button>}
                </div>
                <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                  {CATS.map(c=>(
                    <button key={c} onClick={()=>setCat(c)}
                      style={{padding:"4px 12px",borderRadius:14,border:`1px solid ${C.border}`,cursor:"pointer",fontSize:11,fontWeight:600,
                        background:cat===c?C.gold:"transparent",color:cat===c?"#000":C.muted}}>
                      {c}
                    </button>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8}}>
                  {filtered.map(p=>(
                    <div key={p.id} onClick={()=>addToCart(p)}
                      style={{background:C.dark3,border:`1px solid ${C.border}`,borderRadius:10,padding:10,
                        cursor:p.stock>0?"pointer":"not-allowed",textAlign:"center",transition:"all .15s",
                        opacity:p.stock===0?0.4:1,display:"flex",flexDirection:"column",gap:3}}
                      onMouseEnter={e=>{if(p.stock>0){e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.transform="translateY(-2px)";}}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}}>
                      {p.img_url
                        ? <img src={p.img_url} alt={p.name} style={{width:"100%",height:70,objectFit:"cover",borderRadius:6}}/>
                        : <div style={{fontSize:30}}>{p.img}</div>
                      }
                      <div style={{fontSize:11,fontWeight:600,lineHeight:1.2}}>{p.name}</div>
                      <div style={{fontSize:12,fontWeight:800,color:C.gold}}>{fmt(p.price)} F</div>
                      <div style={{fontSize:10,color:p.stock<5?C.red:C.muted}}>Stock: {p.stock}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panier */}
              <div style={{width:290,background:C.dark2,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <div style={{padding:"10px 12px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontWeight:700,fontSize:13}}>🧾 Commande</span>
                  <span style={{fontSize:11,color:orderType==="sur_place"?C.green:C.blue,fontWeight:600}}>
                    {orderType==="sur_place"?`🍽 Sur place${selTable?` · ${selTable.label}`:""}` :"🥡 Emporter"}
                  </span>
                </div>
                {cart.length===0?(
                  <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:C.muted,gap:6}}>
                    <span style={{fontSize:30}}>🛒</span><span style={{fontSize:12}}>Panier vide</span>
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
                              <div style={{display:"flex",alignItems:"center",gap:2,justifyContent:"center"}}>
                                <button onClick={()=>updateQty(i.id,-1)} style={{width:19,height:19,borderRadius:4,border:`1px solid ${C.border}`,background:"transparent",color:C.txt,cursor:"pointer",fontSize:11}}>−</button>
                                <span style={{fontSize:12,fontWeight:700,minWidth:14,textAlign:"center"}}>{i.qty}</span>
                                <button onClick={()=>updateQty(i.id,1)}  style={{width:19,height:19,borderRadius:4,border:`1px solid ${C.border}`,background:"transparent",color:C.txt,cursor:"pointer",fontSize:11}}>+</button>
                              </div>
                            </td>
                            <td style={{...S.td,textAlign:"right",color:C.gold,fontWeight:700,fontSize:11}}>{fmt(i.price*i.qty)}</td>
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
                    <input style={{...S.input,width:75,textAlign:"right",padding:"3px 7px",fontSize:11}} type="number" value={discount} onChange={e=>setDiscount(e.target.value)} placeholder="0"/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:14}}>
                    <span>Total</span><span style={{color:C.green}}>{fmt(cartTotal)} F</span>
                  </div>
                  <div style={{display:"flex",gap:5}}>
                    <button onClick={()=>setPayMode("simple")} style={{flex:1,padding:"4px",border:`1px solid ${payMode==="simple"?C.gold:C.border}`,borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600,background:payMode==="simple"?C.gold:"transparent",color:payMode==="simple"?"#000":C.muted}}>Simple</button>
                    <button onClick={()=>setPayMode("mixte")} style={{flex:1,padding:"4px",border:`1px solid ${payMode==="mixte"?C.blue:C.border}`,borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600,background:payMode==="mixte"?C.blue:"transparent",color:payMode==="mixte"?"#fff":C.muted}}>💰 Mixte</button>
                  </div>
                  {payMode==="simple"&&(
                    <>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                        {METHODS.map(m=><MBtn key={m} m={m} active={method1===m} onClick={()=>setMethod1(m)}/>)}
                      </div>
                      {method1==="Espèces"&&(
                        <>
                          <input style={{...S.input,fontSize:12,padding:"6px 10px"}} type="number" placeholder="Montant reçu (F)" value={amount1} onChange={e=>setAmount1(e.target.value)}/>
                          {amount1&&change>0&&(
                            <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:7,padding:"6px 9px",fontSize:11}}>
                              <div>Monnaie : <strong style={{color:C.green}}>{fmt(change)} F</strong></div>
                            </div>
                          )}
                        </>
                      )}
                      {method1==="Glovo"&&<div style={{background:"rgba(249,115,22,0.1)",border:"1px solid rgba(249,115,22,0.3)",borderRadius:6,padding:"5px 8px",fontSize:10,color:"#fdba74"}}>🛵 Encaissement Glovo à la semaine</div>}
                    </>
                  )}
                  {payMode==="mixte"&&(
                    <div style={{background:C.dark3,borderRadius:7,padding:8,display:"flex",flexDirection:"column",gap:6}}>
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
                  <button style={S.btnO} onClick={()=>setCart([])}>Annuler</button>
                </div>
              </div>
            </div>
          )}

          {/* ══ TABLES ══ */}
          {page==="tables"&&(
            <div style={{flex:1,overflow:"auto",padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <span style={{fontWeight:700,fontSize:16}}>🪑 Plan de salle</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12}}>
                {tables.map(t=>(
                  <div key={t.id} style={{...S.card,cursor:"pointer",textAlign:"center",transition:"all .15s",
                    borderColor:t.statut==="occupée"?C.gold:t.statut==="libre"?"rgba(34,197,94,0.3)":C.border}}
                    onClick={()=>selectTable(t)}>
                    <div style={{fontSize:28,marginBottom:6}}>🪑</div>
                    <div style={{fontWeight:800,fontSize:16}}>{t.label}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>{t.capacite} personnes</div>
                    <div style={{marginTop:6}}>
                      <span style={{display:"inline-block",padding:"2px 10px",borderRadius:10,fontSize:11,fontWeight:600,
                        background:t.statut==="libre"?"rgba(34,197,94,0.15)":"rgba(201,168,76,0.15)",
                        color:t.statut==="libre"?C.green:C.gold}}>
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
            <div style={{flex:1,overflow:"auto",padding:16,background:"#0a0a0a"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontWeight:800,fontSize:18}}>👨‍🍳 Écran Cuisine</span>
                <button onClick={loadOrders} style={{background:C.dark2,border:`1px solid ${C.border}`,borderRadius:6,padding:"5px 12px",cursor:"pointer",color:C.txt,fontSize:11}}>🔄 Rafraîchir</button>
              </div>
              {orders.length===0?(
                <div style={{textAlign:"center",padding:60,color:C.muted}}>
                  <div style={{fontSize:48,marginBottom:12}}>✅</div>
                  <div style={{fontSize:16,fontWeight:600}}>Aucune commande en attente</div>
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
                  {orders.map(order=>(
                    <div key={order.id} style={{background:order.statut==="en_attente"?"#1a0f00":"#001a0f",border:`2px solid ${order.statut==="en_attente"?C.orange:C.green}`,borderRadius:12,padding:14,display:"flex",flexDirection:"column",gap:10}}>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <span style={{fontWeight:800,fontSize:14,color:C.gold}}>{order.reference}</span>
                        <span style={{fontSize:10,color:C.muted}}>{order.created_at?new Date(order.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):""}</span>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:5}}>
                        {(orderItems[order.id]||[]).map(item=>(
                          <div key={item.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:6,background:item.statut==="pret"?"rgba(34,197,94,0.1)":"rgba(255,255,255,0.04)"}}>
                            <span style={{fontSize:14,fontWeight:800,color:C.gold,minWidth:20}}>×{item.qty}</span>
                            <span style={{flex:1,fontSize:12,fontWeight:600}}>{item.product_name}</span>
                            <button onClick={()=>updateItemStatut(item.id,order.id,item.statut==="pret"?"en_attente":"pret")}
                              style={{padding:"3px 8px",borderRadius:5,border:"none",cursor:"pointer",fontSize:10,fontWeight:700,background:item.statut==="pret"?C.green:C.dark3,color:item.statut==="pret"?"#000":C.muted}}>
                              {item.statut==="pret"?"✓ Prêt":"Marquer prêt"}
                            </button>
                          </div>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        {order.statut==="en_attente"&&<button onClick={()=>updateOrderStatut(order.id,"en_preparation")} style={{flex:1,padding:"7px",borderRadius:7,border:"none",cursor:"pointer",background:C.orange,color:"#000",fontWeight:700,fontSize:11}}>🔥 Démarrer</button>}
                        {order.statut==="en_preparation"&&<button onClick={()=>updateOrderStatut(order.id,"pret")} style={{flex:1,padding:"7px",borderRadius:7,border:"none",cursor:"pointer",background:C.green,color:"#000",fontWeight:700,fontSize:11}}>✅ Prêt à servir</button>}
                        {order.statut==="pret"&&<button onClick={()=>updateOrderStatut(order.id,"servi")} style={{flex:1,padding:"7px",borderRadius:7,border:"none",cursor:"pointer",background:C.dark3,color:C.muted,fontWeight:700,fontSize:11}}>Marquer servi</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ INGRÉDIENTS ══ */}
          {page==="ingredients"&&(
            <div style={{flex:1,overflow:"auto",padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontWeight:700,fontSize:15}}>🧂 Stock Ingrédients</span>
                <button style={{...S.btnG,width:"auto",padding:"7px 14px"}} onClick={()=>setModal("addIng")}>+ Ajouter</button>
              </div>
              {ingCritiques.length>0&&(
                <div style={{background:"rgba(239,68,68,0.1)",border:`1px solid ${C.red}`,borderRadius:10,padding:12,marginBottom:14}}>
                  <div style={{fontWeight:700,color:C.red,marginBottom:8}}>⚠️ Ingrédients en rupture ou stock critique</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {ingCritiques.map(i=>(
                      <span key={i.id} style={{background:"rgba(239,68,68,0.15)",color:C.red,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600}}>
                        {i.name} — {i.stock} {i.unit}
                      </span>
                    ))}
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
                          <td style={{...S.td,fontWeight:600}}>{i.name}</td>
                          <td style={S.td}>{i.unit}</td>
                          <td style={{...S.td,fontWeight:700,color:i.stock<=i.stock_min?C.red:C.txt}}>{i.stock}</td>
                          <td style={S.td}>{i.stock_min}</td>
                          <td style={S.td}>{fmt(i.cost_unit)} F</td>
                          <td style={S.td}>
                            <span style={{display:"inline-block",padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:600,background:`${statutColor}22`,color:statutColor}}>
                              {statut}
                            </span>
                          </td>
                          <td style={S.td}>
                            <div style={{display:"flex",gap:4,alignItems:"center"}}>
                              <input
                                type="number"
                                defaultValue={i.stock}
                                onBlur={e=>{ if(Number(e.target.value)!==i.stock) updateIngredientStock(i.id, e.target.value); }}
                                style={{...S.input,width:70,padding:"3px 7px",fontSize:11,textAlign:"center"}}
                              />
                            </div>
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
            <div style={{flex:1,overflow:"auto",padding:16}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>📖 Gestion des Recettes</div>
              <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                {/* Liste des plats */}
                <div style={{...S.card,width:220,flexShrink:0}}>
                  <div style={{fontWeight:700,marginBottom:10,fontSize:13}}>Sélectionner un plat</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {products.map(p=>(
                      <div key={p.id} onClick={()=>setSelProduct(p)}
                        style={{padding:"8px 10px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600,
                          background:selProduct?.id===p.id?"rgba(201,168,76,0.15)":"transparent",
                          border:`1px solid ${selProduct?.id===p.id?C.gold:C.border}`,
                          color:selProduct?.id===p.id?C.gold:C.txt}}>
                        {p.img} {p.name}
                        <div style={{fontSize:10,color:C.muted,fontWeight:400}}>{recettes.filter(r=>r.product_id===p.id).length} ingrédient(s)</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recette du plat sélectionné */}
                {selProduct&&(
                  <div style={{flex:1,minWidth:300}}>
                    <div style={{...S.card,marginBottom:12}}>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:C.gold}}>
                        {selProduct.img} {selProduct.name} — Ingrédients
                      </div>
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
                                  <td style={{...S.td,fontWeight:600}}>{ing?.name||"?"}</td>
                                  <td style={{...S.td,color:C.gold,fontWeight:700}}>{r.quantite}</td>
                                  <td style={S.td}>{ing?.unit||""}</td>
                                  <td style={S.td}><button onClick={()=>deleteRecette(r.id)} style={S.btnR}>✕</button></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Ajouter ingrédient à la recette */}
                    <div style={S.card}>
                      <div style={{fontWeight:700,marginBottom:10,fontSize:13}}>+ Ajouter un ingrédient</div>
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
            <div style={{flex:1,overflow:"auto",padding:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <span style={{fontWeight:700,fontSize:15}}>Gestion des Produits</span>
                <button style={{...S.btnG,width:"auto",padding:"7px 14px"}} onClick={()=>setModal("addProd")}>+ Nouveau</button>
              </div>
              <div style={S.card}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["","Produit","Cat.","Coût","Prix","Marge","%","Stock"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {products.map(p=>{const mg=p.price-p.cost,pct=p.price>0?((mg/p.price)*100).toFixed(1):0;return(
                      <tr key={p.id}>
                        <td style={S.td}><span style={{fontSize:18}}>{p.img}</span></td>
                        <td style={{...S.td,fontWeight:600}}>{p.name}</td>
                        <td style={S.td}><span style={{display:"inline-block",padding:"2px 7px",borderRadius:8,fontSize:10,fontWeight:600,background:"rgba(201,168,76,0.15)",color:C.gold}}>{p.cat}</span></td>
                        <td style={S.td}>{fmt(p.cost)} F</td>
                        <td style={{...S.td,color:C.gold,fontWeight:700}}>{fmt(p.price)} F</td>
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
            <div style={{flex:1,overflow:"auto",padding:16}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>Historique des Ventes</div>
              <div style={S.card}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["Référence","Date","Vendeur","Mode","Montant",""].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {sales.map(sale=>(
                      <tr key={sale.id}>
                        <td style={{...S.td,color:C.gold,fontWeight:700}}>{sale.reference}</td>
                        <td style={S.td}>{sale.created_at?new Date(sale.created_at).toLocaleString("fr-FR"):""}</td>
                        <td style={S.td}>{sale.vendor}</td>
                        <td style={S.td}><span style={{display:"inline-block",padding:"2px 7px",borderRadius:8,fontSize:10,fontWeight:600,background:"rgba(59,130,246,0.15)",color:"#93c5fd"}}>{sale.method}</span></td>
                        <td style={{...S.td,fontWeight:700,color:C.green}}>{fmt(sale.total)} F</td>
                        <td style={S.td}><button onClick={async()=>{await loadSaleItems(sale.id);setSelSale(sale);setModal("receipt");}} style={{background:"#14532d",color:"#86efac",border:"none",borderRadius:5,padding:"4px 9px",cursor:"pointer",fontSize:11,fontWeight:600}}>Détail</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ STOCK ══ */}
          {page==="stock"&&(
            <div style={{flex:1,overflow:"auto",padding:16}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>📦 Stock Produits finis</div>
              <div style={S.card}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["","Produit","Cat.","Stock","Statut"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {products.map(p=>(
                      <tr key={p.id}>
                        <td style={S.td}><span style={{fontSize:18}}>{p.img}</span></td>
                        <td style={{...S.td,fontWeight:600}}>{p.name}</td>
                        <td style={S.td}>{p.cat}</td>
                        <td style={{...S.td,fontWeight:700,color:p.stock<5?C.red:C.txt}}>{p.stock}</td>
                        <td style={S.td}><span style={{display:"inline-block",padding:"2px 8px",borderRadius:8,fontSize:10,fontWeight:600,
                          background:p.stock===0?"rgba(239,68,68,0.15)":p.stock<5?"rgba(251,191,36,0.15)":"rgba(34,197,94,0.15)",
                          color:p.stock===0?C.red:p.stock<5?"#fbbf24":C.green}}>
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
            <div style={{flex:1,overflow:"auto",padding:16}}>
              <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                {[
                  {l:"Ventes totales",v:fmt(totalRev)+" F",i:"🏦",c:C.gold},
                  {l:"Aujourd'hui",   v:fmt(todayRev)+" F",i:"📅",c:C.green},
                  {l:"Transactions",  v:sales.length,       i:"💳",c:C.txt},
                  {l:"Glovo",         v:fmt(glovoRev)+" F", i:"🛵",c:C.orange},
                ].map(c=>(
                  <div key={c.l} style={{...S.card,flex:1,minWidth:120}}>
                    <div style={{fontSize:18,marginBottom:5}}>{c.i}</div>
                    <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{c.l}</div>
                    <div style={{fontSize:15,fontWeight:800,color:c.c}}>{c.v}</div>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{fontWeight:700,marginBottom:10}}>Répartition paiements</div>
                {(()=>{
                  const bm=METHODS.map((m,i)=>({name:m,v:sales.filter(s=>s.method?.includes(m)).reduce((a,s)=>a+s.total,0),color:PAY_COLORS[i]})).filter(m=>m.v>0);
                  return bm.length===0?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:20}}>Aucune vente</div>:(
                    <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                      <PieChart width={130} height={130}><Pie data={bm} dataKey="v" cx={60} cy={60} innerRadius={34} outerRadius={58}>{bm.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie></PieChart>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {bm.map(d=><div key={d.name} style={{display:"flex",alignItems:"center",gap:7,fontSize:11}}>
                          <span style={{width:8,height:8,borderRadius:2,background:d.color,flexShrink:0}}></span>
                          <span style={{color:C.muted}}>{d.name}</span>
                          <span style={{fontWeight:700,marginLeft:6}}>{fmt(d.v)} F</span>
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
            <div style={{flex:1,overflow:"auto",padding:16}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>Paramètres</div>
              <div style={{...S.card,marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontWeight:700}}>🏪 Informations du commerce</div>
                  <button onClick={()=>{ if(editShop) showToast("Sauvegardé ✓"); setEditShop(!editShop); }}
                    style={{background:editShop?C.gold:"transparent",color:editShop?"#000":C.gold,border:`1px solid ${C.gold}`,borderRadius:6,padding:"4px 12px",cursor:"pointer",fontSize:12,fontWeight:600}}>
                    {editShop?"✓ Enregistrer":"Modifier"}
                  </button>
                </div>
                {editShop&&(
                  <div style={{display:"flex",flexDirection:"column",gap:9}}>
                    {[{l:"Nom",k:"name"},{l:"Adresse",k:"address"},{l:"Téléphone",k:"phone"}].map(f=>(
                      <div key={f.k}>
                        <div style={{fontSize:11,color:C.muted,marginBottom:3}}>{f.l}</div>
                        <input style={S.input} value={shopInfo[f.k]||""} onChange={e=>setShopInfo(p=>({...p,[f.k]:e.target.value}))}/>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ── */}
      {modal==="confirm"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:400,maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><HitLogo size={28}/><span style={{fontWeight:800,fontSize:15}}>Confirmer l'encaissement</span></div>
            {cart.map(i=>(
              <div key={i.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}>
                <span>{i.img} {i.name} × {i.qty}</span>
                <span style={{color:C.gold,fontWeight:700}}>{fmt(i.price*i.qty)} F</span>
              </div>
            ))}
            <div style={{borderTop:`1px solid ${C.border}`,marginTop:8,paddingTop:8,display:"flex",flexDirection:"column",gap:4}}>
              {discount>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}><span>Remise</span><span>-{fmt(discount)} F</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:14}}><span>Total</span><span style={{color:C.green}}>{fmt(cartTotal)} F</span></div>
              <div style={{fontSize:11,color:C.muted}}>Mode : {methodLabel}</div>
              {change>0&&<div style={{fontSize:11,color:C.green}}>Monnaie : {fmt(change)} F</div>}
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button style={S.btnG} onClick={confirmSale}>✓ Valider</button>
              <button style={S.btnO} onClick={()=>setModal(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {modal==="receipt"&&selSale&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:420,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
              <HitLogo size={36}/>
              <div style={{fontWeight:900,fontSize:14,color:C.gold,marginTop:6}}>HIT FAST FOOD</div>
              <div style={{fontSize:11,color:C.muted}}>{shopInfo.address}</div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <span style={{display:"inline-block",padding:"2px 9px",borderRadius:7,fontSize:11,fontWeight:600,background:"rgba(201,168,76,0.15)",color:C.gold}}>{selSale.reference}</span>
              <span style={{fontSize:11,color:C.muted}}>{selSale.created_at?new Date(selSale.created_at).toLocaleString("fr-FR"):""}</span>
            </div>
            {saleItems[selSale.id]&&(
              <table style={{width:"100%",borderCollapse:"collapse",marginBottom:10}}>
                <thead><tr>{["Produit","Qté","Prix","Total"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {saleItems[selSale.id].map((i,idx)=>(
                    <tr key={idx}>
                      <td style={{...S.td,fontSize:11}}>{i.name}</td>
                      <td style={S.td}>{i.qty}</td>
                      <td style={S.td}>{fmt(i.price)}</td>
                      <td style={{...S.td,color:C.gold,fontWeight:700}}>{fmt(i.price*i.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{background:C.dark3,borderRadius:9,padding:11,display:"flex",flexDirection:"column",gap:5,fontSize:12,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:14}}><span>Total</span><span style={{color:C.green}}>{fmt(selSale.total)} F</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.muted}}>Mode</span><span style={{color:"#93c5fd",fontSize:11}}>{selSale.method}</span></div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.muted}}>Vendeur</span><span>{selSale.vendor}</span></div>
            </div>
            <button style={S.btnG} onClick={()=>setModal(null)}>Fermer</button>
          </div>
        </div>
      )}

      {modal==="addProd"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:380}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>Nouveau produit</div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {[{l:"Nom",k:"name",t:"text",p:"Ex: Poulet braisé"},{l:"Emoji",k:"img",t:"text",p:"🍗"},{l:"URL image (optionnel)",k:"img_url",t:"text",p:"https://..."},{l:"Prix (FCFA)",k:"price",t:"number",p:"5000"},{l:"Coût achat (FCFA)",k:"cost",t:"number",p:"2000"},{l:"Stock",k:"stock",t:"number",p:"10"}].map(f=>(
                <div key={f.k}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{f.l}</div>
                  <input style={S.input} type={f.t} placeholder={f.p} value={newP[f.k]||""} onChange={e=>setNewP(p=>({...p,[f.k]:e.target.value}))}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Catégorie</div>
                <select style={S.input} value={newP.cat} onChange={e=>setNewP(p=>({...p,cat:e.target.value}))}>
                  {["Plats","Boissons","Desserts"].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button style={S.btnG} onClick={addProduct}>Ajouter</button>
                <button style={S.btnO} onClick={()=>setModal(null)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal==="addIng"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setModal(null)}>
          <div style={{...S.card,width:380}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>Nouvel ingrédient</div>
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {[{l:"Nom",k:"name",t:"text",p:"Ex: Farine"},{l:"Stock actuel",k:"stock",t:"number",p:"10"},{l:"Stock minimum",k:"stock_min",t:"number",p:"2"},{l:"Coût par unité (FCFA)",k:"cost_unit",t:"number",p:"500"}].map(f=>(
                <div key={f.k}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:3}}>{f.l}</div>
                  <input style={S.input} type={f.t} placeholder={f.p} value={newI[f.k]||""} onChange={e=>setNewI(p=>({...p,[f.k]:e.target.value}))}/>
                </div>
              ))}
              <div>
                <div style={{fontSize:10,color:C.muted,marginBottom:3}}>Unité</div>
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
