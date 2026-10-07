(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const KEY = "kiosk-settings-v1";
  const HOLD_MS = 3000;

  const els = {
    setup: $("setup"), form: $("url-form"), input: $("url-input"), paste: $("paste-btn"),
    error: $("error"), recentWrap: $("recent-wrap"), recentList: $("recent-list"),
    pin: $("pin-input"), refresh: $("refresh-select"), autostart: $("autostart-input"),
    install: $("install-btn"), countdown: $("countdown"), countNum: $("countdown-num"),
    countUrl: $("countdown-url"), countCancel: $("countdown-cancel"),
    kiosk: $("kiosk"), frame: $("frame"), loader: $("loader"), offline: $("offline"),
    hotspot: $("exit-hotspot"), pinDialog: $("pin-dialog"), pinDots: $("pin-dots"), keypad: $("keypad"),
  };

  /* ---------- Settings ---------- */
  const defaults = { url: "", recent: [], pin: "", refresh: 0, autostart: true };
  let settings = { ...defaults, ...safeParse(localStorage.getItem(KEY)) };

  function safeParse(s) { try { return JSON.parse(s) || {}; } catch { return {}; } }
  function save() { localStorage.setItem(KEY, JSON.stringify(settings)); }

  function normalizeUrl(raw) {
    let v = (raw || "").trim();
    if (!v) return null;
    if (!/^https?:\/\//i.test(v)) v = "https://" + v;
    try {
      const u = new URL(v);
      if (!u.hostname.includes(".") && u.hostname !== "localhost") return null;
      return u.href;
    } catch { return null; }
  }

  /* ---------- Setup UI ---------- */
  function renderSetup() {
    els.input.value = settings.url;
    els.pin.value = settings.pin;
    els.refresh.value = String(settings.refresh);
    els.autostart.checked = settings.autostart;
    renderRecent();
  }

  function renderRecent() {
    els.recentList.innerHTML = "";
    els.recentWrap.hidden = settings.recent.length === 0;
    settings.recent.forEach((url) => {
      const li = document.createElement("li");
      const go = document.createElement("button");
      go.type = "button"; go.className = "go"; go.textContent = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
      go.onclick = () => { els.input.value = url; start(); };
      const del = document.createElement("button");
      del.type = "button"; del.className = "del"; del.textContent = "×"; del.setAttribute("aria-label", "Remove");
      del.onclick = () => { settings.recent = settings.recent.filter((r) => r !== url); save(); renderRecent(); };
      li.append(go, del);
      els.recentList.append(li);
    });
  }

  els.paste.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { els.input.value = text.trim(); els.error.textContent = ""; }
    } catch {
      els.input.focus();
      els.error.textContent = "Tap and hold the box, then choose Paste.";
    }
  });

  els.input.addEventListener("input", () => (els.error.textContent = ""));
  els.pin.addEventListener("input", () => (els.pin.value = els.pin.value.replace(/\D/g, "").slice(0, 4)));

  els.form.addEventListener("submit", (e) => { e.preventDefault(); start(); });

  function start() {
    const url = normalizeUrl(els.input.value);
    if (!url) { els.error.textContent = "Please enter a valid website address."; return; }
    const pin = els.pin.value;
    if (pin && pin.length !== 4) { els.error.textContent = "PIN must be exactly 4 digits (or leave it empty)."; return; }

    settings.url = url;
    settings.pin = pin;
    settings.refresh = Number(els.refresh.value) || 0;
    settings.autostart = els.autostart.checked;
    settings.recent = [url, ...settings.recent.filter((r) => r !== url)].slice(0, 5);
    save();
    enterKiosk();
  }

  /* ---------- Kiosk mode ---------- */
  let refreshTimer = null;
  let wakeLock = null;

  function enterKiosk() {
    els.setup.hidden = true;
    els.countdown.hidden = true;
    els.kiosk.hidden = false;
    loadFrame();
    goFullscreen();
    requestWakeLock();
    clearInterval(refreshTimer);
    if (settings.refresh > 0) refreshTimer = setInterval(loadFrame, settings.refresh * 60000);
    history.pushState({ kiosk: true }, "");
  }

  function exitKiosk() {
    clearInterval(refreshTimer);
    els.frame.src = "about:blank";
    els.kiosk.hidden = true;
    els.setup.hidden = false;
    releaseWakeLock();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    renderSetup();
  }

  function loadFrame() {
    if (!navigator.onLine) { els.offline.hidden = false; return; }
    els.offline.hidden = true;
    els.loader.classList.remove("done");
    els.frame.src = "about:blank";
    requestAnimationFrame(() => (els.frame.src = settings.url));
  }

  els.frame.addEventListener("load", () => {
    if (els.frame.src !== "about:blank") els.loader.classList.add("done");
  });

  window.addEventListener("online", () => { if (!els.kiosk.hidden) loadFrame(); });
  window.addEventListener("offline", () => { if (!els.kiosk.hidden) els.offline.hidden = false; });

  // Block the Android back button from leaving kiosk mode
  window.addEventListener("popstate", () => {
    if (!els.kiosk.hidden) history.pushState({ kiosk: true }, "");
  });

  function goFullscreen() {
    const el = document.documentElement;
    const fn = el.requestFullscreen || el.webkitRequestFullscreen;
    if (fn && !document.fullscreenElement) {
      try { const p = fn.call(el, { navigationUI: "hide" }); if (p && p.catch) p.catch(() => {}); } catch {}
    }
  }

  async function requestWakeLock() {
    try { if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen"); } catch {}
  }
  function releaseWakeLock() { if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; } }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !els.kiosk.hidden) requestWakeLock();
  });

  /* ---------- Hold-to-exit hotspot ---------- */
  let holdTimer = null;
  function holdStart(e) {
    e.preventDefault();
    els.hotspot.classList.add("holding");
    holdTimer = setTimeout(() => {
      els.hotspot.classList.remove("holding");
      if (settings.pin) openPin(); else exitKiosk();
    }, HOLD_MS);
  }
  function holdEnd() { clearTimeout(holdTimer); els.hotspot.classList.remove("holding"); }
  els.hotspot.addEventListener("pointerdown", holdStart);
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => els.hotspot.addEventListener(ev, holdEnd));
  els.hotspot.addEventListener("contextmenu", (e) => e.preventDefault());

  /* ---------- PIN dialog ---------- */
  let entered = "";
  function openPin() { entered = ""; drawDots(); els.pinDialog.hidden = false; }
  function closePin() { els.pinDialog.hidden = true; entered = ""; }
  function drawDots() { [...els.pinDots.children].forEach((d, i) => d.classList.toggle("on", i < entered.length)); }

  els.keypad.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const k = b.dataset.k;
    if (k === "cancel") return closePin();
    if (k === "del") { entered = entered.slice(0, -1); return drawDots(); }
    if (entered.length >= 4) return;
    entered += b.textContent; drawDots();
    if (entered.length === 4) {
      if (entered === settings.pin) { setTimeout(() => { closePin(); exitKiosk(); }, 150); }
      else {
        els.pinDots.classList.add("shake");
        setTimeout(() => { els.pinDots.classList.remove("shake"); entered = ""; drawDots(); }, 450);
      }
    }
  });

  /* ---------- Autostart countdown ---------- */
  function maybeAutostart() {
    if (!settings.autostart || !settings.url) return;
    let n = 3;
    els.countUrl.textContent = settings.url;
    els.countNum.textContent = n;
    els.countdown.hidden = false;
    const t = setInterval(() => {
      n -= 1;
      if (n <= 0) { clearInterval(t); enterKiosk(); }
      else els.countNum.textContent = n;
    }, 1000);
    els.countCancel.onclick = () => { clearInterval(t); els.countdown.hidden = true; els.input.focus(); };
  }

  /* ---------- PWA install ---------- */
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); deferredPrompt = e; els.install.hidden = false;
  });
  els.install.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null; els.install.hidden = true;
  });
  window.addEventListener("appinstalled", () => (els.install.hidden = true));

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  /* ---------- Init ---------- */
  renderSetup();
  maybeAutostart();
})();
