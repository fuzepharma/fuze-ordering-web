// ─────────────────────────────────────────────────────────────────────────
// The ONLY environment-specific file in this repo.
// Point API_URL at the Apps Script web-app /exec URL you want this frontend
// to talk to. Swap dev → production at cutover; nothing else changes.
// ─────────────────────────────────────────────────────────────────────────
window.FUZE_CONFIG = {
  // PRODUCTION JSON API — script 1hP5… ("Fuze Ordering System"), version 41,
  // bound to the LIVE "ORDERING SYSTEM" sheet (id 16w_epgd…, owned by
  // info@fuzepharma.com). This is the real data clinics use.
  // ⚠️ Orders placed through this frontend are REAL orders.
  API_URL: "https://script.google.com/macros/s/AKfycbxuykK7NGMIu1OiYDMGuHeG_2yu9zwr6sP4YX-S0FmmeEwV6e41Nb4ht5ce2IWU01nl/exec",

  // TEST sandbox — dev script 1Kp5MDzh…, bound to "Copy of ORDERING SYSTEM"
  // (1ofDUy…), fully isolated from live data. Activate by opening the site with
  // ?env=test (sticky until ?env=prod). A TEST MODE banner shows when active.
  TEST_API_URL: "https://script.google.com/macros/s/AKfycbzcqd9OAJf6EMEj1ziWsFxdwBqb1cokjqq9eTisiwrBlTyY_HjH8ONUQT1VE-yteKUINw/exec"
};
