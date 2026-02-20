/**
 * get_shipping_quotes(shipment)
 * Forwarders: DHL, FedEx, UPS, Maersk, COSCO, Local Forwarders
 * Returns: cheapest, fastest, best_value, all_quotes (sorted by cost)
 */

export interface ShipmentInput {
  origin_port?: string;
  dest_port?: string;
  weight?: number;
  cbm?: number;
  incoterm?: string;
}

export interface ShippingQuote {
  forwarder: string;
  cost: number;
  transit_time: number;
  reliability: number;
  cost_per_day: number;
}

export interface ShippingQuotesResult {
  cheapest: ShippingQuote;
  fastest: ShippingQuote;
  best_value: ShippingQuote;
  all_quotes: ShippingQuote[];
}

const FORWARDERS = ["DHL", "FedEx", "UPS", "Maersk", "COSCO", "Local Forwarders"];

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function apiGetQuote(
  forwarder: string,
  origin: string,
  destination: string,
  weight: number,
  volume: number,
  _incoterm: string
): { total_cost: number; days: number } {
  const h = simpleHash(forwarder + origin + destination);
  const baseCost = 200 + (h % 800);
  const weightFactor = (weight || 100) / 100;
  const volFactor = (volume || 1) / 1;
  const total_cost = Math.round((baseCost * weightFactor * (1 + volFactor * 0.3)) * 100) / 100;
  const days = 3 + (h % 18);
  return { total_cost, days };
}

function getReliabilityScore(forwarder: string): number {
  const scores: Record<string, number> = {
    DHL: 95,
    FedEx: 92,
    UPS: 90,
    Maersk: 88,
    COSCO: 85,
    "Local Forwarders": 78,
  };
  return scores[forwarder] ?? 80;
}

/**
 * get_shipping_quotes
 */
export function getShippingQuotes(shipment: ShipmentInput): ShippingQuotesResult {
  const origin = (shipment.origin_port || "KRICN").trim();
  const dest = (shipment.dest_port || "USLAX").trim();
  const weight = Number(shipment.weight) || 100;
  const cbm = Number(shipment.cbm) || 1;
  const incoterm = shipment.incoterm || "CIF";

  const quotes: ShippingQuote[] = FORWARDERS.map((forwarder) => {
    const quote = apiGetQuote(forwarder, origin, dest, weight, cbm, incoterm);
    const cost_per_day = quote.days > 0 ? Math.round((quote.total_cost / quote.days) * 100) / 100 : quote.total_cost;
    return {
      forwarder,
      cost: quote.total_cost,
      transit_time: quote.days,
      reliability: getReliabilityScore(forwarder),
      cost_per_day,
    };
  });

  const sortedByCost = [...quotes].sort((a, b) => a.cost - b.cost);
  const cheapest = sortedByCost[0];
  const fastest = [...quotes].sort((a, b) => a.transit_time - b.transit_time)[0];
  const best_value = [...quotes].sort((a, b) => a.cost_per_day - b.cost_per_day)[0];

  return {
    cheapest,
    fastest,
    best_value,
    all_quotes: sortedByCost,
  };
}
