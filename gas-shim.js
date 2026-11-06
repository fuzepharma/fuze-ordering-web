// ─────────────────────────────────────────────────────────────────────────
// google.script.run compatibility shim
//
// Re-implements the Apps Script client API `google.script.run` on top of a
// plain fetch() to the JSON router (doPost) in Code.js. This lets the existing
// HtmlService pages run unchanged on GitHub Pages — every existing call like
//
//     google.script.run
//       .withSuccessHandler(ok)
//       .withFailureHandler(err)
//       .saveOrder(payload);
//
//     google.script.run.dashboardLogout(token);   // fire-and-forget
//
// keeps working, now going over HTTP instead of the Apps Script sandbox.
//
// Must load BEFORE the page's own scripts (it's injected at the top of <head>).
// ─────────────────────────────────────────────────────────────────────────
(function () {
  "use strict";

  // Which backend to talk to. Default is production. Opening the site with
  // ?env=test switches to the sandbox (TEST_API_URL) and sticks (localStorage)
  // until ?env=prod. This keeps test clicks off the live sheet.
  function fuzeEnv() {
    try {
      var p = new URLSearchParams(location.search).get("env");
      if (p === "test" || p === "prod") {
        try { localStorage.setItem("fuzeEnv", p); } catch (e) {}
        return p;
      }
      var s = localStorage.getItem("fuzeEnv");
      if (s === "test" || s === "prod") return s;
    } catch (e) {}
    return "prod";
  }
  window.FUZE_ENV = fuzeEnv();

  function apiUrl() {
    var cfg = window.FUZE_CONFIG || {};
    var url = (fuzeEnv() === "test") ? (cfg.TEST_API_URL || cfg.API_URL) : cfg.API_URL;
    if (!url) throw new Error("No API URL set for this environment (config.js).");
    return url;
  }

  // A hard-to-miss banner so you always know when you're on the sandbox.
  function showEnvBanner() {
    if (fuzeEnv() !== "test") return;
    try {
      if (document.getElementById("fuze-test-banner")) return;
      var b = document.createElement("div");
      b.id = "fuze-test-banner";
      b.textContent = "🧪 TEST MODE — this is the sandbox sheet, not live data. Orders here are NOT real.";
      b.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;" +
        "background:#b45309;color:#fff;font:600 13px/1.4 system-ui,-apple-system,sans-serif;" +
        "text-align:center;padding:7px 12px;box-shadow:0 1px 4px rgba(0,0,0,.3);";
      (document.body || document.documentElement).appendChild(b);
    } catch (e) {}
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showEnvBanner);
  } else {
    showEnvBanner();
  }

  // One network call to the JSON router. text/plain keeps it a "simple request"
  // so the browser sends NO CORS preflight (Apps Script can't answer OPTIONS).
  function callApi(fn, args) {
    return fetch(apiUrl(), {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ fn: fn, args: args || [] })
    }).then(function (res) {
      return res.text().then(function (text) {
        var json;
        try {
          json = JSON.parse(text);
        } catch (e) {
          throw new Error("Unexpected response from server: " + String(text).slice(0, 200));
        }
        if (!json || json.ok !== true) {
          throw new Error((json && json.error) || "Server error");
        }
        return json.data;
      });
    });
  }

  // A fresh one-shot runner per `google.script.run` access, matching GAS, where
  // each chain carries its own success/failure handlers.
  function makeRunner() {
    var state = { success: null, failure: null, userObject: undefined };
    var proxy;

    var handler = {
      get: function (target, prop) {
        if (prop === "withSuccessHandler") {
          return function (fn) { state.success = fn; return proxy; };
        }
        if (prop === "withFailureHandler") {
          return function (fn) { state.failure = fn; return proxy; };
        }
        if (prop === "withUserObject") {
          return function (obj) { state.userObject = obj; return proxy; };
        }
        if (typeof prop !== "string") return undefined;

        // Any other property name is treated as a server function to invoke.
        return function () {
          var args = Array.prototype.slice.call(arguments);
          callApi(prop, args).then(function (data) {
            if (state.success) state.success(data, state.userObject);
          }).catch(function (err) {
            if (state.failure) {
              state.failure(err, state.userObject);
            } else if (window.console) {
              console.error("google.script.run." + prop + "() failed:", err);
            }
          });
          return undefined; // GAS's terminal call returns undefined
        };
      }
    };

    proxy = new Proxy({}, handler);
    return proxy;
  }

  if (!window.google) window.google = {};
  if (!window.google.script) window.google.script = {};
  Object.defineProperty(window.google.script, "run", {
    configurable: true,
    get: makeRunner
  });
})();
