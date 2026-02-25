import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../lib/api.js";
import { setCurrentCountryCode } from "../lib/marketStore.js";

const STORAGE_KEY = "yuanto-market-country";

/** API 실패 시 사이드바에 표시할 기본 국가 리스트 */
const DEFAULT_COUNTRIES = [
  { country_code: "KR", name: "대한민국" },
  { country_code: "US", name: "미국" },
  { country_code: "JP", name: "일본" },
  { country_code: "DE", name: "독일" },
  { country_code: "CN", name: "중국" },
  { country_code: "VN", name: "베트남" },
  { country_code: "GB", name: "영국" },
  { country_code: "SG", name: "싱가포르" },
  { country_code: "MX", name: "멕시코" },
  { country_code: "BR", name: "브라질" },
  { country_code: "AE", name: "아랍에미리트" },
  { country_code: "FR", name: "프랑스" },
  { country_code: "ES", name: "스페인" },
  { country_code: "NL", name: "네덜란드" },
];

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
        setCountries(list.length > 0 ? list : DEFAULT_COUNTRIES);
        const effectiveList = list.length > 0 ? list : DEFAULT_COUNTRIES;
        if (!currentCountryCode && effectiveList.length > 0) {
          const first = effectiveList[0].country_code;
          setCurrentCountryCodeState(first);
          setCurrentCountryCode(first);
          try {
            localStorage.setItem(STORAGE_KEY, first);
          } catch (_) {}
        }
      })
      .catch(() => {
        setCountries(DEFAULT_COUNTRIES);
        if (!currentCountryCode && DEFAULT_COUNTRIES.length > 0) {
          const first = DEFAULT_COUNTRIES[0].country_code;
          setCurrentCountryCodeState(first);
          setCurrentCountryCode(first);
          try {
            localStorage.setItem(STORAGE_KEY, first);
          } catch (_) {}
        }
      })
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
