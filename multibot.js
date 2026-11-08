// Saytni boshqa botlardan ochish: bot ID ni serverga yuboradi, chek baribir @Vipchiuzbot orqali boradi
(function () {
  const qs = new URLSearchParams(location.search);
  let BOT_ID = qs.get("bot") || "";
  try { if (BOT_ID) sessionStorage.setItem("botId", BOT_ID); else BOT_ID = sessionStorage.getItem("botId") || ""; } catch (e) {}

  const origApi = api;
  window.api = api = async function (path, opts = {}) {
    opts.headers = Object.assign({}, opts.headers || {}, BOT_ID ? { "X-Bot-Id": BOT_ID } : {});
    const r = await origApi(path, opts);
    if (path === "/api/pay" && r.ok) setTimeout(() => showStartHint(!!r.need_start), 50);
    return r;
  };

  window.chequeUrl = chequeUrl = async function (file) {
    const h = { "X-Init-Data": initData }; if (BOT_ID) h["X-Bot-Id"] = BOT_ID;
    const r = await fetch(API + "/api/admin/cheque/" + file, { headers: h });
    return r.ok ? URL.createObjectURL(await r.blob()) : "";
  };

  // Chek yuborilgach: @Vipchiuzbot'ni ishga tushirish tugmasi (havola shu botdan keladi)
  function showStartHint(need) {
    const box = document.querySelector("#sheet .ok-big");
    if (!box || box.querySelector(".start-hint")) return;
    const ru = LANG === "ru";
    const d = document.createElement("div");
    d.className = "start-hint";
    d.innerHTML = `<p style="color:${need ? "#ffd36b" : "var(--mute)"};margin:0 0 10px">${need
      ? (ru ? "⚠️ Чтобы получить ссылку на VIP, запустите бота" : "⚠️ VIP havolani olish uchun botni ishga tushiring")
      : (ru ? "Ссылка придёт от бота" : "Havola shu botdan keladi")} <b>@${BOT_USERNAME}</b></p>
      <a class="btn ${need ? "main" : "ghost"}" style="margin-bottom:10px" href="https://t.me/${BOT_USERNAME}?start=vip" target="_blank">🤖 @${BOT_USERNAME}</a>`;
    box.insertBefore(d, box.querySelector("#okb"));
    const a = d.querySelector("a");
    a.onclick = (e) => { if (tg && tg.openTelegramLink) { e.preventDefault(); tg.openTelegramLink(a.href); } };
  }

  // Admin: ulangan botlar ro'yxati
  const prevSettings = adminSettings;
  window.adminSettings = adminSettings = function () {
    prevSettings();
    if (!Array.isArray(DRAFT.bot_ids)) DRAFT.bot_ids = [];
    const save = document.querySelector("#ab .save");
    if (!save) return;
    const box = document.createElement("div");
    box.className = "box";
    box.innerHTML = `<h4>🤖 Sayt ulangan boshqa botlar</h4>
      <label class="f">Bot ID lar (vergul bilan). ID — bot tokenidagi ":" dan oldingi raqam. Masalan: 7012345678, 6123456789
        <input id="botIds" value="${esc(DRAFT.bot_ids.join(", "))}"></label>
      <div style="font-size:12px;color:var(--mute);line-height:1.5">Yoki boshqa botdagi sayt havolasiga <b>?bot=ID</b> qo'shing:<br>
      https://vipchi-web.vercel.app/?bot=7012345678<br>Cheklar baribir @${BOT_USERNAME} orqali sizga keladi.</div>`;
    save.parentNode.insertBefore(box, save);
    box.querySelector("#botIds").oninput = (e) => {
      DRAFT.bot_ids = e.target.value.split(/[\s,]+/).filter((x) => /^\d+$/.test(x));
    };
  };
})();
