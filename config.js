// ─────────────────────────────────────────────────────────────────────────
// The ONLY environment-specific file in this repo.
// Point API_URL at the Apps Script web-app /exec URL you want this frontend
// to talk to. Swap dev → production at cutover; nothing else changes.
// ─────────────────────────────────────────────────────────────────────────
window.FUZE_CONFIG = {
  // DEV JSON API deployment (script 1Kp5MDzh…, version 89).
  // ⚠️ This dev script is currently bound to the PRODUCTION data sheet
  //    ("Copy of ORDERING SYSTEM", id 1ofDUy4WhcS_2NeYlcEUBep4se4NmZNrsZG3A0wG38UA).
  //    Reads are safe; writes hit live data until a separate test sheet is set up.
  API_URL: "https://script.google.com/macros/s/AKfycbzcqd9OAJf6EMEj1ziWsFxdwBqb1cokjqq9eTisiwrBlTyY_HjH8ONUQT1VE-yteKUINw/exec"

  // PRODUCTION (fill in at cutover — the /exec URL of the production script 1hP5…):
  // API_URL: "https://script.google.com/macros/s/AKfycbxuykK7NGMIu1OiYDMGuHeG_2yu9zwr6sP4YX-S0FmmeEwV6e41Nb4ht5ce2IWU01nl/exec"
};
