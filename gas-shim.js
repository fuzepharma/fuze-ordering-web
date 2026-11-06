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

  function apiUrl() {
    var cfg = window.FUZE_CONFIG || {};
    if (!cfg.API_URL) throw new Error("FUZE_CONFIG.API_URL is not set (config.js).");
    return cfg.API_URL;
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
