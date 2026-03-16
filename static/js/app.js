let cart = [], currentCategory = "All", currentSearch = "", currentUser = null, authMode = "login", toastTimer = null;

document.addEventListener("DOMContentLoaded", () => { fetchSession(); fetchProducts(); loadPromoProducts(); });

// ── SESSION ──
async function fetchSession() {
  try { const r = await fetch("/api/session", { credentials: "same-origin" }); const d = await r.json(); if (d.user) setUser(d.user); } catch(e) {}
}
function setUser(user) {
  currentUser = user;
  const bar = document.getElementById("topbar-user");
  const si = document.getElementById("nav-signin");
  if (user) {
    bar.innerHTML = `<span>👤 ${user.name}</span><button onclick="logout()">Sign Out</button>`;
    if (si) si.style.display = "none";
  } else {
    bar.innerHTML = "";
    if (si) si.style.display = "";
  }
}

// ── PAGES ──
function showPage(name) {
  if (name === "rewards") loadRewards();
  ["shop","promotions","contact","rewards"].forEach(p => {
    const el = document.getElementById("page-"+p);
    if (el) el.style.display = p === name ? "" : "none";
  });
  document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
  const map = {shop:0,promotions:1,contact:2,rewards:3};
  const btns = document.querySelectorAll(".nav-link");
  if (btns[map[name]]) btns[map[name]].classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
}

// ── PRODUCTS ──
async function fetchProducts() {
  const params = new URLSearchParams();
  if (currentSearch) params.set("search", currentSearch);
  if (currentCategory !== "All") params.set("category", currentCategory);
  try {
    const r = await fetch("/api/products?" + params);
    const products = await r.json();
    renderProducts(products, "product-grid");
    updateSectionLabel();
  } catch(e) { console.error(e); }
}

async function loadPromoProducts() {
  try {
    const r = await fetch("/api/products");
    const all = await r.json();
    const featured = all.filter(p => ["Best Seller","New","Popular","Iconic"].includes(p.badge)).slice(0,8);
    renderProducts(featured, "promo-product-grid");
  } catch(e) {}
}

function renderProducts(products, gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  if (!products.length) {
    grid.innerHTML = `<div class="empty-state"><div class="e-icon">🌍</div><p>No products found.<br/>Try a different search.</p></div>`;
    return;
  }
  grid.innerHTML = products.map((p, i) => {
    const badgeClass = p.badge === "Best Seller" || p.badge === "Popular" ? "green" : p.badge === "New" ? "" : p.badge === "Iconic" ? "gold" : "";
    return `
    <div class="product-card" style="animation:cardIn .35s ${i*.05}s both">
      <div class="card-img">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'" />
        ${p.badge ? `<span class="card-badge ${badgeClass}">${p.badge}</span>` : ""}
      </div>
      <div class="card-body">
        <div class="card-cat">${p.category}</div>
        <div class="card-name">${p.name}</div>
        <div class="card-desc">${p.description}</div>
        <div class="card-footer">
          <span class="card-price">$${p.price.toFixed(2)} AUD</span>
          <button class="add-btn" onclick='addToCart(${p.id},"${esc(p.name)}","${esc(p.category)}",${p.price},"${esc(p.image)}")'>+ Add</button>
        </div>
      </div>
    </div>`;
  }).join("");
  if (!document.getElementById("card-anim-style")) {
    const s = document.createElement("style");
    s.id = "card-anim-style";
    s.textContent = "@keyframes cardIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}";
    document.head.appendChild(s);
  }
}

function esc(s) { return String(s).replace(/\\/g,"\\\\").replace(/"/g,"&quot;").replace(/'/g,"\\'"); }

function updateSectionLabel() {
  const el = document.getElementById("section-label");
  if (!el) return;
  let t = currentCategory === "All" ? "All Products" : currentCategory;
  if (currentSearch) t += ` — "${currentSearch}"`;
  el.textContent = t;
}

// ── SEARCH & FILTER ──
let searchDebounce;
function onSearch() {
  currentSearch = document.getElementById("search-input").value.trim();
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(fetchProducts, 280);
}
function selectCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  fetchProducts();
}
function filterCategory(cat) {
  showPage("shop");
  currentCategory = cat;
  document.querySelectorAll(".filter-chip").forEach(c => {
    c.classList.toggle("active", c.dataset.cat === cat);
  });
  fetchProducts();
  setTimeout(() => document.getElementById("shop").scrollIntoView({behavior:"smooth"}), 200);
}
function scrollToShop() {
  document.getElementById("shop").scrollIntoView({behavior:"smooth"});
}

// ── CART ──
function addToCart(id, name, category, price, image) {
  const ex = cart.find(i => i.id === id);
  if (ex) ex.qty++;
  else cart.push({id, name, category, price, image, qty:1});
  renderCart();
  updateCartBadge();
  showToast(`🧺 ${name} added to cart`);
}
function updateQty(id, delta) {
  cart = cart.map(i => i.id === id ? {...i, qty: i.qty + delta} : i).filter(i => i.qty > 0);
  renderCart();
  updateCartBadge();
}
function renderCart() {
  const itemsEl = document.getElementById("cart-items");
  const emptyEl = document.getElementById("cart-empty");
  const footerEl = document.getElementById("cart-footer");
  const totalEl = document.getElementById("cart-total-amount");
  if (!cart.length) {
    emptyEl.style.display = "";
    if (footerEl) footerEl.style.display = "none";
    itemsEl.innerHTML = "";
    itemsEl.appendChild(emptyEl);
    return;
  }
  emptyEl.style.display = "none";
  if (footerEl) footerEl.style.display = "";
  const total = cart.reduce((s,i) => s + i.price * i.qty, 0);
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img class="ci-img" src="${item.image}" alt="${item.name}" onerror="this.style.opacity='0'" />
      <div class="ci-info">
        <div class="ci-name">${item.name}</div>
        <div class="ci-cat">${item.category}</div>
        <div class="qty-row">
          <button class="qty-btn" onclick="updateQty(${item.id},-1)">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty(${item.id},1)">+</button>
        </div>
      </div>
      <div class="ci-right">
        <span class="ci-price">$${(item.price*item.qty).toFixed(2)}</span>
        <button class="rm-btn" onclick="updateQty(${item.id},${-item.qty})">🗑</button>
      </div>
    </div>`).join("");
}
function updateCartBadge() {
  const b = document.getElementById("cart-badge");
  const c = cart.reduce((s,i) => s+i.qty, 0);
  b.textContent = c;
  b.style.display = c > 0 ? "flex" : "none";
}
function toggleCart() {
  document.getElementById("cart-overlay").classList.toggle("open");
  document.getElementById("cart-drawer").classList.toggle("open");
}

// ── CHECKOUT ──
async function checkout() {
  if (!currentUser) { toggleCart(); openAuth("login"); showToast("Please sign in to place an order"); return; }
  try {
    const r = await fetch("/api/checkout", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cart})});
    const d = await r.json();
    if (d.success) {
      cart = []; renderCart(); updateCartBadge(); toggleCart();
      const banner = document.getElementById("success-banner");
      banner.style.display = "block";
      banner.textContent = `🎉 Order ${d.order_id} confirmed! ${d.message}`;
      setTimeout(() => { banner.style.display = "none"; }, 5000);
    }
  } catch(e) { showToast("Something went wrong. Please try again."); }
}

// ── AUTH ──
function openAuth(mode) {
  authMode = mode || "login";
  updateAuthUI();
  document.getElementById("modal-overlay").classList.add("open");
  document.getElementById("auth-modal").classList.add("open");
}
function closeAuth() {
  document.getElementById("modal-overlay").classList.remove("open");
  document.getElementById("auth-modal").classList.remove("open");
}
function toggleAuthMode() { authMode = authMode === "login" ? "signup" : "login"; updateAuthUI(); }
function updateAuthUI() {
  const s = authMode === "signup";
  document.getElementById("modal-title").textContent = s ? "Create Account" : "Welcome Back";
  document.getElementById("modal-sub").textContent = s ? "Join Cape to Cairo" : "Sign in to your account";
  document.getElementById("name-group").style.display = s ? "" : "none";
  document.getElementById("modal-submit").textContent = s ? "Create Account" : "Sign In";
  document.getElementById("modal-toggle").innerHTML = s
    ? `Already have an account? <button onclick="toggleAuthMode()">Sign In</button>`
    : `Don't have an account? <button onclick="toggleAuthMode()">Sign Up</button>`;
}
async function submitAuth() {
  const email = document.getElementById("inp-email").value.trim();
  const pass = document.getElementById("inp-pass").value;
  const name = authMode === "signup" ? document.getElementById("inp-name").value.trim() : "";
  if (!email || !pass) { showToast("Please fill in all fields"); return; }
  try {
    const r = await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email, name: name||undefined})});
    const d = await r.json();
    if (d.success) {
      setUser(d.user); closeAuth(); showToast(`👋 Welcome, ${d.user.name}!`);
      ["inp-email","inp-pass","inp-name"].forEach(id => { const el=document.getElementById(id); if(el) el.value=""; });
    }
  } catch(e) { showToast("Sign in failed. Please try again."); }
}
async function logout() {
  await fetch("/api/logout",{method:"POST"});
  setUser(null);
  showToast("Signed out successfully");
}

// ── CONTACT FORM ──
function submitContact() {
  const name = document.getElementById("cf-name").value.trim();
  const email = document.getElementById("cf-email").value.trim();
  const msg = document.getElementById("cf-message").value.trim();
  if (!name || !email || !msg) { showToast("Please fill in all required fields"); return; }
  showToast("✅ Message sent! We'll be in touch soon.");
  ["cf-name","cf-email","cf-subject","cf-message"].forEach(id => { const el=document.getElementById(id); if(el) el.value=""; });
}

// ── TOAST ──
function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

// ── KEYBOARD ──
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closeAuth();
    if (document.getElementById("cart-drawer").classList.contains("open")) toggleCart();
  }
});

// ══════════════════════════════════════
// REWARDS — SPIN WHEEL
// ══════════════════════════════════════
let wheelPrizes = [], isSpinning = false, currentWinCode = "";

// Hardcoded prizes so wheel always draws even if API is slow
const STATIC_PRIZES = [
  {id:1, label:"10% OFF",      type:"discount", value:10, colour:"#b84520", description:"10% off your next order!",                  code_prefix:"SAVE10"},
  {id:2, label:"Mystery Gift", type:"mystery",  value:0,  colour:"#5a7a4a", description:"A surprise gift added to your next order!", code_prefix:"MYSTERY"},
  {id:3, label:"5% OFF",       type:"discount", value:5,  colour:"#c8a96e", description:"5% off your next order!",                   code_prefix:"SAVE5"},
  {id:4, label:"15% OFF",      type:"discount", value:15, colour:"#6b3a1e", description:"15% off your next order!",                  code_prefix:"SAVE15"},
  {id:5, label:"Try Again",    type:"none",     value:0,  colour:"#9c5a2e", description:"Better luck tomorrow!",                     code_prefix:""},
  {id:6, label:"Mystery Gift", type:"mystery",  value:0,  colour:"#3b1f0c", description:"A surprise gift added to your next order!", code_prefix:"MYSTERY"},
  {id:7, label:"20% OFF",      type:"discount", value:20, colour:"#d4882a", description:"20% off your next order!",                  code_prefix:"SAVE20"},
  {id:8, label:"Try Again",    type:"none",     value:0,  colour:"#7a4a28", description:"Better luck tomorrow!",                     code_prefix:""},
];

async function loadRewards() {
  const promptEl = document.getElementById("rewards-signin-prompt");
  const mainEl   = document.getElementById("rewards-main");

  // Always draw wheel immediately with static prizes
  wheelPrizes = STATIC_PRIZES;

  // Re-check session
  try {
    const sr = await fetch("/api/session", { credentials: "same-origin" });
    const sd = await sr.json();
    if (sd.user) { currentUser = sd.user; setUser(sd.user); }
  } catch(e) {}

  if (!currentUser) {
    if (promptEl) promptEl.style.display = "";
    if (mainEl)   mainEl.style.display   = "none";
    return;
  }

  if (promptEl) promptEl.style.display = "none";
  if (mainEl)   mainEl.style.display   = "";

  // Draw wheel right away - no API needed for this
  setTimeout(() => { drawWheel(STATIC_PRIZES); }, 80);

  // Then try to get server state for spin availability and past prizes
  try {
    const r = await fetch("/api/rewards/status", { credentials: "same-origin" });
    if (r.ok) {
      const d = await r.json();
      if (d.success) {
        wheelPrizes = d.prizes && d.prizes.length ? d.prizes : STATIC_PRIZES;
        renderMyPrizes(d.my_prizes);
        updateSpinBtn(d.can_spin);
        return;
      }
    }
  } catch(e) {
    console.warn("Could not reach rewards API, using local state:", e);
  }

  // Fallback if API unreachable - still let them use the wheel
  updateSpinBtn(true);
  renderMyPrizes([]);
}

function drawWheel(prizes) {
  const canvas = document.getElementById("spin-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 8;
  const slice = (2 * Math.PI) / prizes.length;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  prizes.forEach((p, i) => {
    const start = i * slice - Math.PI / 2;
    const end = start + slice;
    // Segment
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = p.colour;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();
    // Label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px 'Libre Baskerville', serif";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 3;
    ctx.fillText(p.label, r - 12, 5);
    ctx.restore();
  });
  // Centre circle
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
  ctx.fillStyle = "#3b1f0c";
  ctx.fill();
  ctx.strokeStyle = "#c8a96e";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#c8a96e";
  ctx.font = "bold 11px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GO", cx, cy);
}

function renderMyPrizes(prizes) {
  const el = document.getElementById("my-prizes-list");
  if (!prizes || !prizes.length) {
    el.innerHTML = `<p class="no-prizes">No prizes yet — give it a spin! 🤞</p>`;
    return;
  }
  el.innerHTML = [...prizes].reverse().map(p => `
    <div class="prize-card">
      <div class="prize-card-top">
        <span class="prize-card-label">${p.label}</span>
        <span class="prize-card-date">${p.date}</span>
      </div>
      <div class="prize-card-desc">${p.description}</div>
      ${p.code ? `<span class="prize-card-code">${p.code}</span>` : ""}
    </div>`).join("");
}

function updateSpinBtn(canSpin) {
  const btn = document.getElementById("spin-btn");
  const note = document.getElementById("spin-note");
  if (!btn) return;
  btn.disabled = !canSpin;
  note.textContent = canSpin ? "🎡 You have a spin available today!" : "✅ You've already spun today. Come back tomorrow!";
}

async function doSpin() {
  if (isSpinning) return;
  isSpinning = true;
  const btn = document.getElementById("spin-btn");
  btn.disabled = true;

  // Pick a random prize locally first so wheel always spins
  const weights = [15, 12, 18, 8, 20, 12, 5, 20];
  const total = weights.reduce((a,b) => a+b, 0);
  let rand = Math.random() * total, localPrize = STATIC_PRIZES[0];
  for (let i = 0; i < STATIC_PRIZES.length; i++) {
    rand -= weights[i];
    if (rand <= 0) { localPrize = STATIC_PRIZES[i]; break; }
  }

  // Try to get server-confirmed prize
  let result = {
    prize_id: localPrize.id, label: localPrize.label, type: localPrize.type,
    description: localPrize.description, colour: localPrize.colour, code: null
  };

  try {
    const r = await fetch("/api/rewards/spin", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      credentials: "same-origin"
    });
    if (r.ok) {
      const d = await r.json();
      if (d.success) result = d.result;
    }
  } catch(e) {
    console.warn("Spin API unreachable, using local result");
  }

  // Generate a local code if API didn't provide one and prize deserves it
  if (!result.code && result.type !== "none") {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const suffix = Array.from({length:6}, () => chars[Math.floor(Math.random()*chars.length)]).join("");
    const prefix = result.type === "mystery" ? "MYSTERY" : "SAVE" + (result.label.replace(/[^0-9]/g,"") || "");
    result.code = prefix + "-" + suffix;
  }

  const targetIdx = wheelPrizes.findIndex(p => p.id === result.prize_id);
  const idx = targetIdx >= 0 ? targetIdx : Math.floor(Math.random() * wheelPrizes.length);

  animateWheel(idx, wheelPrizes.length, () => {
    isSpinning = false;
    updateSpinBtn(false);
    showWinModal(result);
    // Try to refresh prize list from server
    fetch("/api/rewards/status", {credentials:"same-origin"})
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.success) renderMyPrizes(d.my_prizes); })
      .catch(() => {
        // Show locally won prize if server unreachable
        if (result.code) {
          renderMyPrizes([{label: result.label, description: result.description, code: result.code, date: new Date().toISOString().slice(0,10)}]);
        }
      });
  });
}

function animateWheel(targetIdx, total, onDone) {
  const canvas = document.getElementById("spin-canvas");
  const slice = 360 / total;
  const targetDeg = 360 - (targetIdx * slice + slice / 2);
  const extraSpins = 5 * 360;
  const finalAngle = extraSpins + targetDeg;
  let current = 0;
  const duration = 4000;
  const start = performance.now();

  function ease(t) { return t < 1 ? 1 - Math.pow(1 - t, 4) : 1; }

  function frame(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    current = ease(t) * finalAngle;
    drawWheelRotated(current % 360);
    if (t < 1) requestAnimationFrame(frame);
    else { drawWheelRotated(current % 360); onDone(); }
  }
  requestAnimationFrame(frame);
}

function drawWheelRotated(angleDeg) {
  const canvas = document.getElementById("spin-canvas");
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2, cy = canvas.height / 2;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.translate(-cx, -cy);
  const r = cx - 8;
  const slice = (2 * Math.PI) / wheelPrizes.length;
  wheelPrizes.forEach((p, i) => {
    const start = i * slice - Math.PI / 2;
    const end = start + slice;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = p.colour;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + slice / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px 'Libre Baskerville', serif";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 3;
    ctx.fillText(p.label, r - 12, 5);
    ctx.restore();
  });
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
  ctx.fillStyle = "#3b1f0c";
  ctx.fill();
  ctx.strokeStyle = "#c8a96e";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#c8a96e";
  ctx.font = "bold 11px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GO", cx, cy);
}

function showWinModal(result) {
  document.getElementById("win-emoji").textContent = result.type === "none" ? "😅" : result.type === "mystery" ? "🎁" : "🎉";
  document.getElementById("win-title").textContent = result.type === "none" ? "Better Luck Tomorrow!" : "You Won!";
  document.getElementById("win-desc").textContent = result.description;
  const codeWrap = document.getElementById("win-code-wrap");
  if (result.code) {
    codeWrap.style.display = "";
    document.getElementById("win-code").textContent = result.code;
    currentWinCode = result.code;
  } else {
    codeWrap.style.display = "none";
    currentWinCode = "";
  }
  document.getElementById("win-overlay").classList.add("open");
  document.getElementById("win-modal").classList.add("open");
}

function closeWinModal() {
  document.getElementById("win-overlay").classList.remove("open");
  document.getElementById("win-modal").classList.remove("open");
}

function copyCode() {
  if (!currentWinCode) return;
  navigator.clipboard.writeText(currentWinCode).then(() => showToast("✅ Code copied to clipboard!"));
}
