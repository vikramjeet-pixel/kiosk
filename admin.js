(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var s = Kiosk.load();

  /* ---------- PIN lock ---------- */
  function showSettings() {
    $("lock").hidden = true;
    $("settings").hidden = false;
    $("url").value = s.url;
    $("refresh").value = String(s.refresh);
    $("pin").value = s.pin;
    $("cancel").hidden = !s.url;
  }

  if (s.pin && sessionStorage.getItem("kiosk-unlocked") !== "1") {
    $("lock").hidden = false;
    $("lock-pin").focus();
  } else {
    showSettings();
  }

  $("lock-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("lock-pin").value === s.pin) {
      sessionStorage.setItem("kiosk-unlocked", "1");
      showSettings();
    } else {
      $("lock-error").textContent = "Wrong PIN.";
      $("lock-pin").value = "";
    }
  });

  /* ---------- Settings ---------- */
  ["pin", "lock-pin"].forEach(function (id) {
    $(id).addEventListener("input", function () { this.value = this.value.replace(/\D/g, "").slice(0, 4); });
  });

  $("url").addEventListener("input", function () { $("url-error").textContent = ""; });

  $("paste").addEventListener("click", function () {
    if (!navigator.clipboard || !navigator.clipboard.readText) return pasteFallback();
    navigator.clipboard.readText().then(function (t) {
      if (t) $("url").value = t.trim();
    }).catch(pasteFallback);
  });
  function pasteFallback() {
    $("url").focus();
    $("url-error").textContent = "Press and hold in the box, then choose Paste.";
  }

  $("settings-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var url = Kiosk.normalizeUrl($("url").value);
    var pin = $("pin").value;
    if (!url) { $("url-error").textContent = "Please enter a valid web address."; return; }
    if (pin && pin.length !== 4) { $("url-error").textContent = "PIN must be 4 digits, or leave it empty."; return; }

    s.url = url;
    s.pin = pin;
    s.refresh = Number($("refresh").value) || 0;
    Kiosk.save(s);
    sessionStorage.removeItem("kiosk-unlocked");
    location.href = "index.html";
  });

  $("cancel").addEventListener("click", function () { sessionStorage.removeItem("kiosk-unlocked"); });

  /* ---------- Install ---------- */
  var prompt = null;
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault(); prompt = e; $("install").hidden = false;
  });
  $("install").addEventListener("click", function () {
    if (!prompt) return;
    prompt.prompt();
    prompt = null; $("install").hidden = true;
  });
})();
