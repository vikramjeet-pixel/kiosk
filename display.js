(function () {
  "use strict";

  var HOLD_MS = 3000;
  var s = Kiosk.load();
  var frame = document.getElementById("frame");
  var empty = document.getElementById("empty");
  var offline = document.getElementById("offline");
  var hotspot = document.getElementById("hotspot");

  /* ---------- Show the site ---------- */
  function load() {
    if (!navigator.onLine) { offline.hidden = false; return; }
    offline.hidden = true;
    frame.src = s.url;
  }

  if (!s.url) {
    frame.hidden = true;
    empty.hidden = false;
  } else {
    load();
    if (s.refresh > 0) setInterval(load, s.refresh * 60000);
  }

  window.addEventListener("online", function () { if (s.url) load(); });
  window.addEventListener("offline", function () { if (s.url) offline.hidden = false; });

  /* ---------- Keep screen on ---------- */
  var wakeLock = null;
  function keepAwake() {
    if (!("wakeLock" in navigator)) return;
    navigator.wakeLock.request("screen").then(function (l) { wakeLock = l; }).catch(function () {});
  }
  keepAwake();
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") keepAwake();
  });

  /* ---------- Block the back button ---------- */
  history.pushState(null, "");
  window.addEventListener("popstate", function () { history.pushState(null, ""); });

  /* ---------- Hold top-right corner to open admin ---------- */
  var timer = null;
  hotspot.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    hotspot.classList.add("holding");
    timer = setTimeout(function () { location.href = "admin.html"; }, HOLD_MS);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) {
    hotspot.addEventListener(ev, function () { clearTimeout(timer); hotspot.classList.remove("holding"); });
  });
  hotspot.addEventListener("contextmenu", function (e) { e.preventDefault(); });
})();
