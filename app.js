// ===== Sozlama: API manzili. Vercel'da /api bot serveriga rewrite qilinadi (vercel.json).
const API = window.VIP_API || "";
const BOT_USERNAME = "Vipchiuzbot";

const tg = window.Telegram && window.Telegram.WebApp;
const initData = (tg && tg.initData) || "";
if (tg) { try { tg.ready(); tg.expand(); tg.setHeaderColor("#0b0614"); tg.setBackgroundColor("#0b0614"); } catch (e) {} }

let S = null;        // settings
let ME = null;       // user
let ADMIN = false;
let SUBS = [];
let LANG = localStorage.getItem("lang") || ((tg && tg.initDataUnsafe?.user?.language_code === "ru") ? "ru" : "uz");

const L = {
  uz: {
    perks: ["🎬 Yangi qismlar birinchi", "🚫 Reklamasiz", "🎙 O'zbekcha ovoz", "⚡ Tez yuklash"],
    pick: "Bo'limni tanlang", tap: "Batafsil ko'rish", back: "← Orqaga", choose: "Tarifni tanlang",
    best: "FOYDALI", days: "kun", pay: "To'lov", sumL: "To'lov summasi", copy: "Nusxa", copied: "Nusxalandi ✅",
    steps: "1️⃣ Quyidagi kartaga summani o'tkazing<br>2️⃣ To'lov chekini (skrinshot) yuklang<br>3️⃣ «Yuborish»ni bosing — admin tasdiqlaydi",
    up: "📎 Chekni yuklash uchun bosing", send: "Yuborish", sending: "Yuborilmoqda...",
    done: "Chek yuborildi!", doneP: "Admin chekni tekshirib tasdiqlagach, bot sizga VIP kanal havolasini yuboradi. Odatda bir necha daqiqa.",
    join: "🔐 VIP kanalga zayavka", toBot: "🤖 Botga o'tish", ok: "Yaxshi",
    needTg: "To'lov qilish uchun saytni Telegram bot orqali oching", openTg: "Telegramda ochish",
    active: "Faol VIP: {d} gacha", noFile: "Avval chekni yuklang",
  },
  ru: {
    perks: ["🎬 Новые серии первыми", "🚫 Без рекламы", "🎙 Озвучка", "⚡ Быстро"],
    pick: "Выберите раздел", tap: "Подробнее", back: "← Назад", choose: "Выберите тариф",
    best: "ВЫГОДНО", days: "дн.", pay: "Оплата", sumL: "Сумма оплаты", copy: "Копировать", copied: "Скопировано ✅",
    steps: "1️⃣ Переведите сумму на карту ниже<br>2️⃣ Загрузите чек (скриншот)<br>3️⃣ Нажмите «Отправить» — админ подтвердит",
    up: "📎 Нажмите, чтобы загрузить чек", send: "Отправить", sending: "Отправка...",
    done: "Чек отправлен!", doneP: "После проверки админом бот пришлёт вам ссылку на VIP канал. Обычно несколько минут.",
    join: "🔐 Заявка в VIP канал", toBot: "🤖 Перейти в бот", ok: "Хорошо",
    needTg: "Для оплаты откройте сайт через Telegram бота", openTg: "Открыть в Telegram",
    active: "Активный VIP до {d}", noFile: "Сначала загрузите чек",
  },
};
const t = (k) => L[LANG][k];
const tr = (o) => (o && (o[LANG] || o.uz)) || "";
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => Number(n || 0).toLocaleString("ru-RU").replace(/,/g, " ");
const price = (tf) => LANG === "ru" ? `${money(tf.rub)} ₽` : `${money(tf.uzs)} so'm`;
const media = (u) => (!u ? "" : u.startsWith("/api/") ? API + u : u);
const fdate = (ts) => new Date(ts * 1000).toLocaleDateString(LANG === "ru" ? "ru-RU" : "uz-UZ");

async function api(path, opts = {}) {
  opts.headers = Object.assign({ "X-Init-Data": initData }, opts.headers || {});
  const r = await fetch(API + path, opts);
  let j; try { j = await r.json(); } catch { j = { ok: false, error: "server" }; }
  if (!r.ok && j.ok !== false) j.ok = false;
  return j;
}
function toast(m) { const el = $("#toast"); el.textContent = m; el.classList.remove("hidden"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.add("hidden"), 2200); }
function haptic(type = "light") { try { tg && tg.HapticFeedback.impactOccurred(type); } catch {} }
function openModal(html) { $("#sheet").innerHTML = html; $("#modal").classList.remove("hidden"); }
function closeModal() { $("#modal").classList.add("hidden"); }
$("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });

function applyBg() {
  $("#bg").style.backgroundImage = S.background ? `url("${media(S.background)}")` : "";
}
function setLang(l) {
  LANG = l; localStorage.setItem("lang", l); document.documentElement.lang = l;
  document.querySelectorAll(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.lang === l));
  if (ME) api("/api/lang", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lang: l }) });
  route();
}
document.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => { haptic(); setLang(b.dataset.lang); }));
$("#adminBtn").addEventListener("click", () => (location.hash = "#admin"));

// ================= Views
function viewHome() {
  const secs = S.sections;
  const keys = Object.keys(secs);
  const sub = SUBS.length ? `<div class="badge" style="margin-top:14px;color:#7dffb2;border-color:#7dffb2">✓ ${t("active").replace("{d}", fdate(Math.max(...SUBS.map((s) => s.expires))))}</div>` : "";
  $("#app").innerHTML = `
    <section class="hero">
      <div class="badge">♛ PREMIUM ACCESS</div>
      <h1>${esc(tr(S.hero.title))}</h1>
      <p>${esc(tr(S.hero.subtitle))}</p>
      ${sub}
      <div class="perks">${t("perks").map((p) => `<span>${p}</span>`).join("")}</div>
    </section>
    <div class="choices">
      ${keys.map((k, i) => `
        <button class="choice ${i % 2 ? "b" : "a"}" data-k="${k}">
          <i class="shine"></i>
          <div><div class="t">${esc(tr(secs[k].button))}</div><div class="s">${t("tap")}</div></div>
          <div class="arr">→</div>
        </button>`).join("")}
    </div>`;
  document.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => { haptic("medium"); location.hash = "#s/" + b.dataset.k; }));
}

function viewSection(k) {
  const sec = S.sections[k];
  if (!sec) return (location.hash = "");
  $("#app").innerHTML = `
    <button class="back" id="back">${t("back")}</button>
    <div class="poster">
      ${sec.image ? `<img src="${esc(media(sec.image))}" alt="">` : `<div class="ph">♛</div>`}
      <span class="vip">♛ VIP</span>
      <div class="cap"><h2>${esc(tr(sec.title))}</h2></div>
    </div>
    <div class="actions">
      <button class="btn main" id="buy">💎 ${esc(tr(sec.buy_text))}</button>
      ${sec.show_instagram && sec.instagram ? `<a class="btn ig" id="ig" href="${esc(sec.instagram)}" target="_blank">📸 ${esc(tr(sec.insta_text))}</a>` : ""}
    </div>`;
  $("#back").onclick = () => (location.hash = "");
  $("#buy").onclick = () => { haptic("medium"); showTariffs(k); };
  const ig = $("#ig");
  if (ig && tg) ig.onclick = (e) => { e.preventDefault(); tg.openLink(sec.instagram); };
}

function showTariffs(k) {
  const sec = S.sections[k];
  openModal(`
    <h3>${t("choose")}</h3>
    ${sec.tariffs.map((tf, i) => `
      <button class="tariff ${i === sec.tariffs.length - 1 && sec.tariffs.length > 1 ? "best" : ""}" data-i="${i}">
        <div><div class="n">${esc(tr(tf.name))}${i === sec.tariffs.length - 1 && sec.tariffs.length > 1 ? `<span class="tag">${t("best")}</span>` : ""}</div>
        <div class="d">${tf.days} ${t("days")}</div></div>
        <div class="p">${price(tf)}</div>
      </button>`).join("")}`);
  document.querySelectorAll(".tariff").forEach((b) => b.addEventListener("click", () => { haptic(); showPay(k, +b.dataset.i); }));
}

function showPay(k, i) {
  if (!initData) {
    return openModal(`<div class="ok-big"><div class="e">📲</div><h3>${t("needTg")}</h3><p></p>
      <a class="btn main" href="https://t.me/${BOT_USERNAME}?start=vip">${t("openTg")}</a></div>`);
  }
  const sec = S.sections[k], tf = sec.tariffs[i];
  const card = S.cards[LANG === "ru" ? "ru" : "uz"];
  openModal(`
    <h3>${t("pay")} — ${esc(tr(tf.name))}</h3>
    <div class="steps">${t("steps")}</div>
    <div class="sum"><span>${t("sumL")}</span><b>${price(tf)}</b></div>
    <div class="card">
      <button class="copy" id="cp">${t("copy")}</button>
      <div class="bank">💳 ${esc(card.bank)}</div>
      <div class="num">${esc(card.number)}</div>
      <div class="own">${esc(card.owner)}</div>
    </div>
    <label class="upload" id="upl"><input type="file" id="file" accept="image/*,.pdf" hidden><span id="uplT">${t("up")}</span></label>
    <button class="btn main" id="send">${t("send")}</button>`);
  $("#cp").onclick = () => { navigator.clipboard?.writeText(card.number.replace(/\s/g, "")); toast(t("copied")); haptic(); };
  $("#file").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    $("#upl").classList.add("has");
    $("#uplT").innerHTML = "✅ " + esc(f.name) + (f.type.startsWith("image/") ? `<br><img src="${URL.createObjectURL(f)}">` : "");
  };
  $("#send").onclick = async () => {
    const f = $("#file").files[0];
    if (!f) return toast(t("noFile"));
    const b = $("#send"); b.disabled = true; b.textContent = t("sending");
    const fd = new FormData();
    fd.append("section", k); fd.append("tariff", i); fd.append("lang", LANG); fd.append("file", f);
    const r = await api("/api/pay", { method: "POST", body: fd });
    if (!r.ok) { b.disabled = false; b.textContent = t("send"); return toast(r.error || "Xatolik"); }
    haptic("heavy");
    openModal(`<div class="ok-big"><div class="e">🎉</div><h3>${t("done")}</h3><p>${t("doneP")}</p>
      <a class="btn ghost" href="${esc(sec.join_link)}" target="_blank" style="margin-bottom:10px">${t("join")}</a>
      <button class="btn main" id="okb">${t("ok")}</button></div>`);
    $("#okb").onclick = () => { closeModal(); if (tg) tg.close(); };
  };
}

// ================= Admin
let ATAB = "pay";
function viewAdmin() {
  if (!ADMIN) return (location.hash = "");
  $("#app").innerHTML = `
    <button class="back" id="back">← Bosh sahifa</button>
    <div class="tabs">
      <button data-t="pay">🧾 Cheklar</button><button data-t="subs">💎 Obunachilar</button>
      <button data-t="set">⚙️ Sozlamalar</button><button data-t="hist">📜 Tarix</button>
    </div>
    <div id="ab"></div>`;
  $("#back").onclick = () => (location.hash = "");
  document.querySelectorAll(".tabs button").forEach((b) => {
    b.classList.toggle("on", b.dataset.t === ATAB);
    b.onclick = () => { ATAB = b.dataset.t; viewAdmin(); };
  });
  ({ pay: () => adminPayments("pending"), hist: () => adminPayments("approved"), subs: adminSubs, set: adminSettings })[ATAB]();
}

async function chequeUrl(file) {
  const r = await fetch(API + "/api/admin/cheque/" + file, { headers: { "X-Init-Data": initData } });
  return r.ok ? URL.createObjectURL(await r.blob()) : "";
}

async function adminPayments(status) {
  const box = $("#ab"); box.innerHTML = "⏳";
  const r = await api("/api/admin/payments?status=" + status);
  if (!r.ok) return (box.innerHTML = "Xatolik");
  if (!r.items.length) return (box.innerHTML = `<div class="box">Hozircha yo'q</div>`);
  box.innerHTML = r.items.map((p) => `
    <div class="box"><div class="item">
      <img class="thumb" data-f="${esc(p.file)}">
      <div class="meta" style="flex:1"><b>#${p.id} ${esc(p.name)}</b> ${p.username ? "@" + esc(p.username) : ""}<br>
        🆔 ${p.user_id} · ${esc(S.sections[p.section]?.title?.uz || p.section)}<br>
        ${p.days} kun · <b>${money(p.amount)} ${p.currency}</b><br>${new Date(p.created * 1000).toLocaleString("ru-RU")}</div>
    </div>
    ${status === "pending" ? `<div class="row" style="margin-top:10px;margin-bottom:0">
      <button class="mini g" data-ok="${p.id}">✅ Tasdiqlash</button><button class="mini r" data-no="${p.id}">❌ Rad etish</button></div>` : ""}
    </div>`).join("");
  box.querySelectorAll("img[data-f]").forEach(async (im) => {
    const u = await chequeUrl(im.dataset.f); if (u) { im.src = u; im.onclick = () => tg ? window.open(u) : window.open(u); }
  });
  const decide = async (id, action) => {
    const x = await api("/api/admin/decide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    toast(x.msg || (x.ok ? "OK" : "Xato")); adminPayments(status);
  };
  box.querySelectorAll("[data-ok]").forEach((b) => (b.onclick = () => decide(+b.dataset.ok, "approve")));
  box.querySelectorAll("[data-no]").forEach((b) => (b.onclick = () => decide(+b.dataset.no, "reject")));
}

async function adminSubs() {
  const box = $("#ab"); box.innerHTML = "⏳";
  const r = await api("/api/admin/subs");
  if (!r.ok) return (box.innerHTML = "Xatolik");
  const st = r.stats;
  box.innerHTML = `
    <div class="stats">
      <div class="stat">👥 Foydalanuvchi<b>${st.users}</b></div><div class="stat">💎 Faol VIP<b>${st.active}</b></div>
      <div class="stat">💰 Daromad<b>${money(st.income_uzs)} so'm</b></div><div class="stat">₽ Daromad<b>${money(st.income_rub)} ₽</b></div>
    </div>
    <div class="box"><h4>Qo'lda VIP berish</h4>
      <div class="row3"><input id="mu" placeholder="User ID"><select id="ms">${Object.keys(S.sections).map((k) => `<option value="${k}">${esc(S.sections[k].title.uz)}</option>`).join("")}</select><input id="md" placeholder="Kun" value="30"></div>
      <button class="btn main" id="madd" style="padding:12px;animation:none">Qo'shish / uzaytirish</button>
    </div>
    ${r.items.map((s) => `<div class="box item"><div class="meta"><b>${esc(s.name || "")}</b> ${s.username ? "@" + esc(s.username) : ""}<br>🆔 ${s.user_id} · ${esc(S.sections[s.section]?.title?.uz || s.section)}<br>⏳ ${new Date(s.expires * 1000).toLocaleString("ru-RU")}</div>
      <button class="mini r" data-del="${s.user_id}" data-s="${s.section}">Chiqarish</button></div>`).join("") || `<div class="box">Faol obunachi yo'q</div>`}`;
  const post = (b) => api("/api/admin/sub", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
  $("#madd").onclick = async () => {
    const uid = $("#mu").value.trim(); if (!uid) return toast("User ID kiriting");
    await post({ user_id: +uid, section: $("#ms").value, days: +$("#md").value || 30 }); toast("Qo'shildi ✅"); adminSubs();
  };
  box.querySelectorAll("[data-del]").forEach((b) => (b.onclick = async () => {
    if (!confirm("Chiqarilsinmi? (5 daqiqa ichida kanaldan chiqariladi)")) return;
    await post({ user_id: +b.dataset.del, section: b.dataset.s, days: 0 }); toast("Belgilandi"); adminSubs();
  }));
}

// --- settings editor
let DRAFT = null;
const getP = (o, p) => p.split(".").reduce((a, k) => a?.[k], o);
const setP = (o, p, v) => { const ks = p.split("."); const last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };
const inp = (p, label, type = "text") => `<label class="f">${label}<input data-p="${p}" type="${type}" value="${esc(getP(DRAFT, p))}"></label>`;
const pair = (p, label) => `<div class="row">${inp(p + ".uz", label + " (UZ)")}${inp(p + ".ru", label + " (RU)")}</div>`;
const imgField = (p, label) => `<label class="f">${label}</label>${getP(DRAFT, p) ? `<img class="imgprev" src="${esc(media(getP(DRAFT, p)))}">` : ""}
  <div class="row"><label class="btn ghost" style="padding:10px;font-size:14px">📤 Yuklash<input type="file" accept="image/*" hidden data-img="${p}"></label>
  <button class="btn ghost" style="padding:10px;font-size:14px" data-clr="${p}">🗑 O'chirish</button></div>`;

function adminSettings() {
  if (!DRAFT) DRAFT = JSON.parse(JSON.stringify(S));
  const secs = Object.keys(DRAFT.sections);
  $("#ab").innerHTML = `
    <div class="box"><h4>Bosh sahifa</h4>${pair("hero.title", "Sarlavha")}${pair("hero.subtitle", "Matn")}
      ${imgField("background", "Orqa fon rasmi")}</div>
    ${secs.map((k, si) => {
      const p = "sections." + k;
      return `<div class="box"><h4>${si + 1}-bo'lim</h4>
        ${pair(p + ".button", "Bosh sahifadagi tugma")}
        ${pair(p + ".title", "Nomi (rasm ustida)")}
        ${imgField(p + ".image", "Rasm")}
        ${pair(p + ".buy_text", "Sotib olish tugmasi")}
        <label class="check"><input type="checkbox" data-chk="${p}.show_instagram" ${getP(DRAFT, p + ".show_instagram") ? "checked" : ""}> Instagram tugmasini ko'rsatish</label>
        ${pair(p + ".insta_text", "Instagram tugmasi")}
        ${inp(p + ".instagram", "Instagram (edit) havolasi")}
        ${inp(p + ".join_link", "VIP kanal zayavka havolasi")}
        <h4 style="margin-top:12px">Tariflar</h4>
        ${DRAFT.sections[k].tariffs.map((tf, i) => `<div class="box" style="background:rgba(0,0,0,.2)">
          ${pair(`${p}.tariffs.${i}.name`, "Nomi")}
          <div class="row3">${inp(`${p}.tariffs.${i}.days`, "Kun", "number")}${inp(`${p}.tariffs.${i}.uzs`, "So'm", "number")}${inp(`${p}.tariffs.${i}.rub`, "Rubl", "number")}</div>
          <button class="mini r" data-rmt="${k}:${i}">Tarifni o'chirish</button></div>`).join("")}
        <button class="mini v" data-addt="${k}">+ Tarif qo'shish</button>
      </div>`;
    }).join("")}
    <div class="box"><h4>💳 Karta (o'zbekcha)</h4>${inp("cards.uz.number", "Karta raqami")}${inp("cards.uz.owner", "Egasi")}${inp("cards.uz.bank", "Bank / turi")}</div>
    <div class="box"><h4>💳 Karta (ruscha — rubl)</h4>${inp("cards.ru.number", "Karta raqami")}${inp("cards.ru.owner", "Egasi")}${inp("cards.ru.bank", "Bank / turi")}</div>
    <div class="save"><button class="btn main" id="saveS">💾 Saqlash</button></div>`;
  const ab = $("#ab");
  ab.querySelectorAll("input[data-p]").forEach((el) => (el.oninput = () => setP(DRAFT, el.dataset.p, el.type === "number" ? +el.value : el.value)));
  ab.querySelectorAll("input[data-chk]").forEach((el) => (el.onchange = () => setP(DRAFT, el.dataset.chk, el.checked)));
  ab.querySelectorAll("input[data-img]").forEach((el) => (el.onchange = async () => {
    const f = el.files[0]; if (!f) return; toast("Yuklanmoqda...");
    const fd = new FormData(); fd.append("file", f);
    const r = await api("/api/admin/upload", { method: "POST", body: fd });
    if (!r.ok) return toast("Xato: " + (r.error || ""));
    setP(DRAFT, el.dataset.img, r.url); adminSettings(); toast("Rasm yuklandi — Saqlashni bosing");
  }));
  ab.querySelectorAll("[data-clr]").forEach((b) => (b.onclick = () => { setP(DRAFT, b.dataset.clr, ""); adminSettings(); }));
  ab.querySelectorAll("[data-addt]").forEach((b) => (b.onclick = () => {
    DRAFT.sections[b.dataset.addt].tariffs.push({ name: { uz: "Yangi", ru: "Новый" }, days: 30, uzs: 0, rub: 0 }); adminSettings();
  }));
  ab.querySelectorAll("[data-rmt]").forEach((b) => (b.onclick = () => {
    const [k, i] = b.dataset.rmt.split(":"); DRAFT.sections[k].tariffs.splice(+i, 1); adminSettings();
  }));
  $("#saveS").onclick = async () => {
    const r = await api("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: DRAFT }) });
    if (!r.ok) return toast("Xato: " + (r.error || ""));
    S = JSON.parse(JSON.stringify(DRAFT)); applyBg(); haptic("heavy"); toast("Saqlandi ✅");
  };
}

// ================= Router
function route() {
  const h = location.hash;
  closeModal();
  window.scrollTo(0, 0);
  if (tg) {
    try {
      if (h && h !== "#") { tg.BackButton.show(); } else tg.BackButton.hide();
    } catch {}
  }
  if (h.startsWith("#s/")) viewSection(h.slice(3));
  else if (h === "#admin") viewAdmin();
  else viewHome();
}
window.addEventListener("hashchange", route);
if (tg) try { tg.BackButton.onClick(() => (location.hash = "")); } catch {}

// ================= Petals (dekor)
(function petals() {
  const c = $("#petals"), x = c.getContext("2d");
  let W, H, P = [];
  const rs = () => { W = c.width = innerWidth * devicePixelRatio; H = c.height = innerHeight * devicePixelRatio; };
  rs(); addEventListener("resize", rs);
  for (let i = 0; i < 26; i++) P.push({ x: Math.random() * W, y: Math.random() * H, s: 4 + Math.random() * 7, v: .4 + Math.random() * .9, a: Math.random() * 6, w: .01 + Math.random() * .02 });
  (function loop() {
    x.clearRect(0, 0, W, H);
    for (const p of P) {
      p.y += p.v * devicePixelRatio; p.a += p.w; p.x += Math.sin(p.a) * .8 * devicePixelRatio;
      if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
      x.save(); x.translate(p.x, p.y); x.rotate(p.a);
      x.fillStyle = "rgba(255,150,200,.55)";
      x.beginPath(); x.ellipse(0, 0, p.s * devicePixelRatio, p.s * .55 * devicePixelRatio, 0, 0, Math.PI * 2); x.fill(); x.restore();
    }
    requestAnimationFrame(loop);
  })();
})();

// ================= Init
(async function init() {
  document.querySelectorAll(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.lang === LANG));
  $("#app").innerHTML = `<div class="hero"><h1>♛</h1></div>`;
  const r = await api("/api/config");
  if (!r.ok) { $("#app").innerHTML = `<div class="box">Server bilan aloqa yo'q. Keyinroq urinib ko'ring.</div>`; return; }
  S = r.settings; ME = r.user; ADMIN = r.admin; SUBS = r.subs || [];
  if (ME && ME.lang && !localStorage.getItem("lang")) LANG = ME.lang;
  document.querySelectorAll(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.lang === LANG));
  $("#adminBtn").classList.toggle("hidden", !ADMIN);
  applyBg();
  // Admin Telegram orqali kirsa — avtomatik panelga
  if (ADMIN && !sessionStorage.getItem("seenAdmin") && !location.hash) { sessionStorage.setItem("seenAdmin", 1); location.hash = "#admin"; }
  route();
})();
