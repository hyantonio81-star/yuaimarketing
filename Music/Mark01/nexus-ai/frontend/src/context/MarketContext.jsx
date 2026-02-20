import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../lib/api.js";
import { setCurrentCountryCode } from "../lib/marketStore.js";

const STORAGE_KEY = "yuanto-market-country";

const MarketContext = createContext({
  countries: [],
  currentCountry: null,
  currentCountryCode: "",
  setCountry: () => {},
  loading: true,
});

export function MarketProvider({ children }) {
  const [countries, setCountries] = useState([]);
  const [currentCountryCode, setCurrentCountryCodeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/markets/countries")
      .then((r) => {
        const list = r.data?.countries ?? [];
        setCountries(list);
        if (!currentCountryCode && list.length > 0) {
          const first = list[0].country_code;
          setCurrentCountryCodeState(first);
          setCurrentCountryCode(first);
          try {
            localStorage.setItem(STORAGE_KEY, first);
          } catch (_) {}
        }
      })
      .catch(() => setCountries([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCurrentCountryCode(currentCountryCode);
    try {
      if (currentCountryCode) localStorage.setItem(STORAGE_KEY, currentCountryCode);
    } catch (_) {}
  }, [currentCountryCode]);

  const setCountry = useCallback((code) => {
    setCurrentCountryCodeState(code || "");
  }, []);

  const currentCountry =
    countries.find((c) => c.country_code === currentCountryCode) || null;

  return (
    <MarketContext.Provider
      value={{
        countries,
        currentCountry,
        currentCountryCode,
        setCountry,
        loading,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error("useMarket must be used within MarketProvider");
  return ctx;
}
