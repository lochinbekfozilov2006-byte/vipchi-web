// Ko'p rasmli galereya: har rasmga alohida Instagram havolasi
(function () {
  const css = `
  .poster .track{display:flex;height:100%;transition:transform .45s ease}
  .poster .track img{flex:0 0 100%;width:100%;height:100%;object-fit:cover}
  .poster .dots{position:absolute;top:18px;right:16px;display:flex;gap:5px;z-index:2}
  .poster .dots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.4)}
  .poster .dots i.on{background:#fff;width:18px;border-radius:4px}
  .poster .nav{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:50%;
    background:rgba(0,0,0,.35);color:#fff;font-size:18px;display:grid;place-items:center;z-index:2}
  .poster .nav.l{left:10px}.poster .nav.r{right:10px}
  .gal{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:8px}
  .gal .gw{display:flex;flex-direction:column;gap:6px}
  .gal .g{position:relative;aspect-ratio:3/4;border-radius:10px;overflow:hidden;background:#000}
  .gal .g img{width:100%;height:100%;object-fit:cover}
  .gal .g .x{position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;background:#e2435d;font-size:12px;font-weight:800}
  .gal .g .mv{position:absolute;bottom:4px;left:4px;right:4px;display:flex;justify-content:space-between}
  .gal .g .mv button{width:28px;height:24px;border-radius:6px;background:rgba(0,0,0,.6);font-size:12px}
  .gal .g .n{position:absolute;top:4px;left:4px;font-size:11px;font-weight:800;background:rgba(0,0,0,.6);padding:2px 6px;border-radius:6px}
  .gal .gw input{font-size:12px;padding:8px}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  // Rasmlarni [{url, ig}] ko'rinishiga keltiradi (eski formatlar ham ishlaydi)
  const norm = (sec) => {
    const raw = Array.isArray(sec.images) && sec.images.length ? sec.images : sec.image ? [sec.image] : [];
    return raw.map((x) => (typeof x === "string" ? { url: x, ig: "" } : { url: x.url || "", ig: x.ig || "" })).filter((x) => x.url);
  };
  let timer = null;

  // ---- Bo'lim sahifasi: slayder + joriy rasmning Instagram havolasi
  window.viewSection = viewSection = function (k) {
    const sec = S.sections[k];
    if (!sec) return (location.hash = "");
    clearInterval(timer);
    const imgs = norm(sec);
    const linkOf = (i) => (imgs[i] && imgs[i].ig) || sec.instagram || "";
    const showIg = sec.show_instagram && (imgs.some((x) => x.ig) || sec.instagram);
    $("#app").innerHTML = `
      <button class="back" id="back">${t("back")}</button>
      <div class="poster" id="poster">
        ${imgs.length ? `<div class="track" id="track">${imgs.map((x) => `<img src="${esc(media(x.url))}" alt="" draggable="false">`).join("")}</div>` : `<div class="ph">♛</div>`}
        <span class="vip">♛ VIP</span>
        ${imgs.length > 1 ? `<div class="dots" id="dots">${imgs.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
          <button class="nav l" id="pv">‹</button><button class="nav r" id="nx">›</button>` : ""}
        <div class="cap"><h2>${esc(tr(sec.title))}</h2></div>
      </div>
      <div class="actions">
        <button class="btn main" id="buy">💎 ${esc(tr(sec.buy_text))}</button>
        ${showIg ? `<a class="btn ig" id="ig" href="${esc(linkOf(0))}" target="_blank">📸 ${esc(tr(sec.insta_text))}</a>` : ""}
      </div>`;
    let cur = 0;
    const ig = $("#ig");
    const updIg = () => {
      if (!ig) return;
      const l = linkOf(cur);
      ig.href = l || "#";
      ig.style.display = l ? "" : "none";
    };
    updIg();
    if (ig) ig.onclick = (e) => { const l = linkOf(cur); if (!l) return e.preventDefault(); if (tg) { e.preventDefault(); tg.openLink(l); } };
    $("#back").onclick = () => { clearInterval(timer); location.hash = ""; };
    $("#buy").onclick = () => { haptic("medium"); showTariffs(k); };
    if (imgs.length < 2) return;
    const go = (i) => {
      cur = (i + imgs.length) % imgs.length;
      $("#track").style.transform = `translateX(-${cur * 100}%)`;
      document.querySelectorAll("#dots i").forEach((d, j) => d.classList.toggle("on", j === cur));
      updIg();
    };
    const restart = () => { clearInterval(timer); timer = setInterval(() => { if (!$("#track")) return clearInterval(timer); go(cur + 1); }, 3500); };
    $("#pv").onclick = () => { go(cur - 1); restart(); haptic(); };
    $("#nx").onclick = () => { go(cur + 1); restart(); haptic(); };
    let x0 = null;
    const p = $("#poster");
    p.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    p.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); restart(); }
    });
    restart();
  };

  // ---- Admin: galereya + har rasm uchun Instagram havolasi
  const origSettings = adminSettings;
  window.adminSettings = adminSettings = function () {
    if (!DRAFT) DRAFT = JSON.parse(JSON.stringify(S));
    for (const k of Object.keys(DRAFT.sections)) {
      const s = DRAFT.sections[k];
      s.images = norm(s);
      s.image = s.images[0] ? s.images[0].url : "";
    }
    origSettings();
    for (const k of Object.keys(DRAFT.sections)) {
      const input = document.querySelector(`input[data-img="sections.${k}.image"]`);
      if (!input) continue;
      const row = input.closest(".row");
      let prev = row.previousElementSibling;
      while (prev && (prev.matches("img.imgprev") || prev.matches("label.f"))) {
        const del = prev; prev = prev.previousElementSibling; del.remove();
        if (del.matches("label.f")) break;
      }
      const imgs = DRAFT.sections[k].images;
      const box = document.createElement("div");
      box.innerHTML = `<label class="f">Rasmlar (${imgs.length} ta) — har biriga o'z Instagram havolasi</label>
        <div class="gal">${imgs.map((x, i) => `<div class="gw"><div class="g"><img src="${esc(media(x.url))}"><span class="n">${i + 1}</span>
          <button class="x" data-gx="${k}:${i}">✕</button>
          <div class="mv"><button data-gm="${k}:${i}:-1">◀</button><button data-gm="${k}:${i}:1">▶</button></div></div>
          <input placeholder="📸 Instagram havolasi" value="${esc(x.ig)}" data-gig="${k}:${i}"></div>`).join("")}</div>
        <label class="btn ghost" style="padding:10px;font-size:14px;margin-bottom:10px">📤 Rasm qo'shish (bir nechtasini tanlash mumkin)
          <input type="file" accept="image/*" multiple hidden data-gadd="${k}"></label>`;
      row.replaceWith(box);
    }
    // Umumiy Instagram maydonini tushunarli qilish
    document.querySelectorAll('input[data-p$=".instagram"]').forEach((el) => {
      const lb = el.closest("label"); if (lb && lb.firstChild) lb.firstChild.textContent = "Instagram (rasmga havola qo'yilmasa ishlatiladi)";
    });
    const sync = (k) => { const s = DRAFT.sections[k]; s.image = s.images[0] ? s.images[0].url : ""; };
    document.querySelectorAll("input[data-gig]").forEach((el) => (el.oninput = () => {
      const [k, i] = el.dataset.gig.split(":"); DRAFT.sections[k].images[+i].ig = el.value.trim();
    }));
    document.querySelectorAll("[data-gx]").forEach((b) => (b.onclick = () => {
      const [k, i] = b.dataset.gx.split(":"); DRAFT.sections[k].images.splice(+i, 1); sync(k); adminSettings();
    }));
    document.querySelectorAll("[data-gm]").forEach((b) => (b.onclick = () => {
      const [k, i, d] = b.dataset.gm.split(":"); const a = DRAFT.sections[k].images; const j = +i + +d;
      if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; sync(k); adminSettings();
    }));
    document.querySelectorAll("input[data-gadd]").forEach((el) => (el.onchange = async () => {
      const k = el.dataset.gadd, files = [...el.files];
      if (!files.length) return;
      let ok = 0;
      for (const [n, f] of files.entries()) {
        toast(`Yuklanmoqda ${n + 1}/${files.length}...`);
        const fd = new FormData(); fd.append("file", f);
        const r = await api("/api/admin/upload", { method: "POST", body: fd });
        if (r.ok) { DRAFT.sections[k].images.push({ url: r.url, ig: "" }); ok++; }
      }
      sync(k); adminSettings(); toast(`${ok} ta rasm qo'shildi — havolalarni yozib Saqlashni bosing`);
    }));
  };
})();
