/**
 * Minimal store for current market (country) so api.js can add X-Country header.
 * Set from MarketContext.
 */
let currentCountryCode = "";

export function getCurrentCountryCode() {
  return currentCountryCode;
}

export function setCurrentCountryCode(code) {
  currentCountryCode = code || "";
}
