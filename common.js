/* Shared settings helpers */
var Kiosk = (function () {
  var KEY = "kiosk-settings-v1";
  var defaults = { url: "", pin: "", refresh: 0 };

  function load() {
    try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch (e) { return Object.assign({}, defaults); }
  }
  function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); }

  function normalizeUrl(raw) {
    var v = (raw || "").trim();
    if (!v) return null;
    if (!/^https?:\/\//i.test(v)) v = "https://" + v;
    try {
      var u = new URL(v);
      if (u.hostname.indexOf(".") === -1 && u.hostname !== "localhost") return null;
      return u.href;
    } catch (e) { return null; }
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }

  return { load: load, save: save, normalizeUrl: normalizeUrl };
})();
