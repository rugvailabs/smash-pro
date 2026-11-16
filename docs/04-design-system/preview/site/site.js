/* ============================================================
   PROSMASH — UNIFIED WEBSITE PREVIEW · interaction layer
   Preview-only script: demo role switching, sample-data catalogue,
   localStorage cart, racquet configurator. NOT production code.
   No backend, no real payments, no real accounts.
   ============================================================ */

/* ---------- sample data (illustrative; buyer prices = sample tier,
   % never displayed anywhere per OBD-20 pending decision) ---------- */
const PRODUCTS = [
  {sku:'CR-0417', name:'English Willow Bat — Grade 2, Short Handle', cat:'cricket', sub:'Bats', img:'../img/cricket/eng-willow-bat-g2-hero.jpg', meta:'1,180–1,250 g · 8–10 grains', std:4850.00, buyer:4122.50, url:'product.html'},
  {sku:'CR-0301', name:'Kashmir Willow Bat — Match, Full Size', cat:'cricket', sub:'Bats', img:'../img/cricket/kashmir-willow-match-hero.jpg', meta:'1,200–1,280 g · full size', std:1650.00, buyer:1402.50},
  {sku:'CR-0512', name:'Leather Match Ball — 4-Piece Red, Box of 6', cat:'cricket', sub:'Balls', img:'../img/cricket/leather-match-ball-hero.jpg', meta:'156 g · alum-tanned leather', std:2940.00, buyer:2499.00},
  {sku:'CR-0613', name:'Batting Pads — Youth, Ambidextrous Pair', cat:'cricket', sub:'Protection', img:'../img/cricket/batting-pads-hero.jpg', meta:'Cane-reinforced · 2 sizes', std:1320.00, buyer:1122.00},
  {sku:'CR-0624', name:'Batting Gloves — Match Grade, Right Hand', cat:'cricket', sub:'Protection', img:'../img/cricket/batting-gloves-hero.jpg', meta:'Sheep leather palm', std:980.00, buyer:833.00},
  {sku:'CR-0705', name:'Cricket Helmet — Steel Grille, Size M', cat:'cricket', sub:'Protection', img:'../img/cricket/helmet-hero.jpg', meta:'Adjustable · steel grille', std:1760.00, buyer:1496.00},
  {sku:'CR-0808', name:'Team Kit Bag — 85 L, Wheeled', cat:'cricket', sub:'Kit & storage', img:'../img/cricket/team-kit-bag-hero.jpg', meta:'600D polyester · wheeled', std:2310.00, buyer:1963.50},
  {sku:'CR-0901', name:'Practice Net — 60 × 10 ft, HDPE', cat:'cricket', sub:'Ground equipment', img:'../img/cricket/practice-net-hero.jpg', meta:'UV-stabilised HDPE twine', std:3480.00, buyer:2958.00},
  {sku:'BD-2001', name:'Tour Carbon Racquet — 3U, Head-Heavy', cat:'badminton', sub:'Racquets', img:'../img/badminton/racquet-tour-hero.jpg', meta:'Full graphite · 88 g · strung to order', std:5400.00, buyer:4590.00, cfg:true, url:'product-racquet.html'},
  {sku:'BD-1104', name:'Feather Shuttlecocks — Tournament, Tube of 12', cat:'badminton', sub:'Shuttles', img:'../img/badminton/shuttlecocks-hero.jpg', meta:'Speed 77 · tube of 12', std:1240.00, buyer:1054.00},
  {sku:'BB-0101', name:'Competition Basketball — Size 7, Indoor/Outdoor', cat:'basketball', sub:'Balls', img:'../img/basketball/comp-size7-hero.jpg', meta:'Size 7 · indoor/outdoor rubber', std:1980.00, buyer:1683.00},
  {sku:'SW-3001', name:'Polyester Match Jersey Set — Team of 11', cat:'sportswear', sub:'Team wear', img:'../img/sportswear/match-jersey-hero.jpg', meta:'Sublimation print · team of 11', std:5720.00, buyer:4862.00}
];
const CATS = [
  ['cricket','Cricket',312],['football','Football',198],['basketball','Basketball',86],['volleyball','Volleyball',64],
  ['badminton','Badminton',214],['tennis','Tennis',121],['athletics','Athletics',153],['gym-fitness','Gym & Fitness',240],
  ['indoor-games','Indoor Games',92],['outdoor-games','Outdoor Games',77],['sportswear','Sportswear',168],['accessories','Accessories',134]
];

/* ---------- role state (preview control) ---------- */
const ROLES = {visitor:'Visitor', pending:'Registered buyer (pending)', buyer:'Approved buyer', supplier:'Supplier'};
function getRole(){ return localStorage.getItem('ps_role') || 'visitor'; }
function setRole(r){ localStorage.setItem('ps_role', r); document.body.dataset.role = r; renderAll(); }

/* ---------- money ---------- */
function inr(n){ return '₹' + n.toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2}); }
function priceOf(p){ return getRole()==='buyer' ? p.buyer : p.std; }

/* ---------- cart (localStorage; preview only) ---------- */
function getCart(){ try{ return JSON.parse(localStorage.getItem('ps_cart')||'[]'); }catch(e){ return []; } }
function saveCart(c){ localStorage.setItem('ps_cart', JSON.stringify(c)); updateCartBadge(); }
function addToCart(sku, qty, config, delta){
  const c = getCart();
  const key = sku + (config? '|'+JSON.stringify(config) : '');
  const hit = c.find(l => l.key===key);
  if(hit){ hit.qty += qty; } else { c.push({key, sku, qty, config:config||null, delta:delta||0}); }
  saveCart(c);
}
function updateCartBadge(){
  const n = getCart().reduce((s,l)=>s+l.qty,0);
  document.querySelectorAll('.cartlink .ct').forEach(el=>{ el.textContent = n; });
}

/* ---------- card template ---------- */
function cardHTML(p){
  const href = p.url || ('product.html?sku='+p.sku);
  return `<a class="pcard" href="${href}">
    <div class="pimg"><img src="${p.img}" alt="${p.name} — representative image" loading="lazy"></div>
    <div class="pbody">
      <span class="eyebrow">${p.sub}</span>
      <div class="pname">${p.name}</div>
      <div class="pmeta">${p.meta}</div>
      ${p.cfg? '<span class="cfgtag">Strung to order — configure</span>':''}
      <div class="pricebox">
        <div class="price-std-primary">
          <div class="plabel">Standard price</div>
          <div class="pval num">${inr(p.std)} <small>incl. GST</small></div>
          <div class="pcta only-anon">Register to view your price →</div>
          <div class="pstd only-pending">Your institutional pricing activates on approval</div>
        </div>
        <div class="price-buyer">
          <div class="plabel yours">Your price</div>
          <div class="pval num">${inr(p.buyer)} <small>incl. GST</small></div>
          <div class="pstd num">Standard ${inr(p.std)}</div>
        </div>
      </div>
    </div>
  </a>`;
}

/* ---------- grid renderers ---------- */
function renderGrid(elId, items){
  const el = document.getElementById(elId);
  if(el) el.innerHTML = items.map(cardHTML).join('');
}
function renderFeatured(){ renderGrid('featured-grid', [PRODUCTS[0], PRODUCTS[8], PRODUCTS[10], PRODUCTS[11]]); }
function renderCatalog(){
  const el = document.getElementById('catalog-grid'); if(!el) return;
  const cat = new URLSearchParams(location.search).get('cat') || 'cricket';
  const items = PRODUCTS.filter(p=>p.cat===cat);
  el.innerHTML = items.length ? items.map(cardHTML).join('')
    : '<div class="empty" style="grid-column:1/-1"><p>No sample products in this category yet — preview data covers Cricket, Badminton, Basketball and Sportswear.</p><a class="btn btn-sec h40" href="catalog.html?cat=cricket">Browse Cricket</a></div>';
  const c = CATS.find(x=>x[0]===cat);
  document.querySelectorAll('[data-cat-title]').forEach(e=> e.textContent = c? c[1] : cat);
  const rc = document.getElementById('rescount'); if(rc) rc.textContent = items.length + ' of ' + (c? c[2]:'—') + ' shown · preview data';
  document.querySelectorAll('.catstrip .cat').forEach(a=>{ a.classList.toggle('on', a.dataset.cat===cat); });
}
function renderSearch(){
  const el = document.getElementById('search-grid'); if(!el) return;
  const q = (new URLSearchParams(location.search).get('q')||'').trim();
  document.querySelectorAll('[data-q]').forEach(e=> e.textContent = q || '—');
  const items = q? PRODUCTS.filter(p=> (p.name+' '+p.sub+' '+p.cat).toLowerCase().includes(q.toLowerCase())) : [];
  el.innerHTML = items.length ? items.map(cardHTML).join('')
    : `<div class="empty" style="grid-column:1/-1"><p>No results for “${q}” in the sample catalogue.</p><a class="btn btn-sec h40" href="catalog.html?cat=cricket">Browse the catalogue</a></div>`;
  const rc = document.getElementById('rescount'); if(rc) rc.textContent = items.length + ' results · preview data';
}
function renderCatStrip(){
  document.querySelectorAll('.catstrip[data-auto]').forEach(el=>{
    el.innerHTML = CATS.map(c=>`<a class="cat" data-cat="${c[0]}" href="catalog.html?cat=${c[0]}"><span class="cn">${c[1]}</span><span class="cc">${c[2]}</span></a>`).join('');
  });
}

/* ---------- product detail price panel ---------- */
function renderDetailPrice(sku){
  const p = PRODUCTS.find(x=>x.sku===sku); if(!p) return;
  document.querySelectorAll('[data-dp-std]').forEach(e=> e.textContent = inr(p.std));
  document.querySelectorAll('[data-dp-buyer]').forEach(e=> e.textContent = inr(p.buyer));
}

/* ---------- cart page ---------- */
function renderCartPage(){
  const wrapEl = document.getElementById('cart-lines'); if(!wrapEl) return;
  const c = getCart();
  if(!c.length){
    wrapEl.innerHTML = '<div class="empty"><p>Your order is empty.</p><a class="btn btn-pri h40" href="catalog.html?cat=cricket">Browse the catalogue</a></div>';
    document.getElementById('cart-summary').style.display='none';
    return;
  }
  document.getElementById('cart-summary').style.display='';
  wrapEl.innerHTML = '<div class="panel">' + c.map((l,i)=>{
    const p = PRODUCTS.find(x=>x.sku===l.sku);
    const unit = priceOf(p) + (l.delta||0);
    const cfg = l.config? `<div class="lc">String: ${l.config.string} · Tension: ${l.config.tension} · Grip: ${l.config.grip}${l.delta?` · option +${inr(l.delta)} <span class="note-flag">illustrative, pending</span>`:''}</div>`:'';
    return `<div class="line">
      <div class="th"><img src="${p.img}" alt=""></div>
      <div class="li"><div class="ln">${p.name}</div><div class="ls">SKU ${p.sku}</div>${cfg}
        <div class="lu num">${inr(unit)} / unit · incl. GST</div></div>
      <span class="qty"><button aria-label="Decrease" onclick="cartQty(${i},-1)">−</button><span class="num">${l.qty}</span><button aria-label="Increase" onclick="cartQty(${i},1)">+</button></span>
      <div class="lt num">${inr(unit*l.qty)}</div>
      <button class="btn btn-ter" style="font-size:13px" onclick="cartRemove(${i})">Remove</button>
    </div>`;
  }).join('') + '</div>';
  const total = c.reduce((s,l)=>{ const p=PRODUCTS.find(x=>x.sku===l.sku); return s + (priceOf(p)+(l.delta||0))*l.qty; },0);
  const t1=document.getElementById('cart-items-total'); if(t1) t1.textContent = inr(total);
  const t2=document.getElementById('cart-grand'); if(t2) t2.textContent = inr(total);
  const n=document.getElementById('cart-count-note'); if(n) n.textContent = c.length + (c.length===1?' line':' lines');
}
function cartQty(i,d){ const c=getCart(); c[i].qty=Math.max(1,c[i].qty+d); saveCart(c); renderCartPage(); }
function cartRemove(i){ const c=getCart(); c.splice(i,1); saveCart(c); renderCartPage(); }

/* ---------- global search box ---------- */
function wireSearch(){
  document.querySelectorAll('form[data-search]').forEach(f=>{
    f.addEventListener('submit', e=>{ e.preventDefault(); const q=f.querySelector('input').value; location.href='search.html?q='+encodeURIComponent(q); });
  });
}

/* ---------- boot ---------- */
function renderAll(){
  renderCatStrip(); renderFeatured(); renderCatalog(); renderSearch(); renderCartPage(); updateCartBadge();
  if(window.psAfterRender) window.psAfterRender();
}
document.addEventListener('DOMContentLoaded', ()=>{
  document.body.dataset.role = getRole();
  const sel = document.getElementById('role-select');
  if(sel){ sel.value = getRole(); sel.addEventListener('change', ()=> setRole(sel.value)); }
  wireSearch(); renderAll();
});
