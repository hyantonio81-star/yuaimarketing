/**
 * calculate_total_landed_cost(shipment, destination_country)
 * product + freight + insurance + customs_duty + vat + other_fees = total
 * duty on (product+freight+insurance), vat on taxable_value, effective_markup %
 */

export interface ShipmentForLandedCost {
  fob_value: number;
  freight?: number;
  hs_code?: string;
  origin_country?: string;
}

export interface LandedCostResult {
  breakdown: {
    product_cost: number;
    freight: number;
    insurance: number;
    customs_duty: number;
    vat: number;
    other_fees: number;
  };
  total_landed_cost: number;
  duty_rate: number;
  vat_rate: number;
  effective_markup: number;
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getShippingCost(_shipment: ShipmentForLandedCost): number {
  return 850;
}

function getTariffRate(_hsCode: string, _origin: string, destination: string): { duty_rate: number } {
  const h = simpleHash(destination);
  return { duty_rate: (h % 15) / 100 };
}

function getVatRate(destination: string): number {
  const rates: Record<string, number> = {
    US: 0,
    DE: 0.19,
    FR: 0.20,
    JP: 0.10,
    KR: 0.10,
    GB: 0.20,
  };
  const key = destination?.toUpperCase()?.slice(0, 2) ?? "US";
  return rates[key] ?? 0.1;
}

function estimateOtherFees(_destination: string): number {
  return 120;
}

/**
 * calculate_total_landed_cost
 */
export function calculateTotalLandedCost(
  shipment: ShipmentForLandedCost,
  destinationCountry: string
): LandedCostResult {
  const dest = (destinationCountry || "US").trim();
  const productCost = Number(shipment.fob_value) || 0;
  const freight = Number(shipment.freight) ?? getShippingCost(shipment);
  const insurance = Math.round(productCost * 0.01 * 100) / 100;

  const tariffInfo = getTariffRate(
    shipment.hs_code ?? "8541",
    shipment.origin_country ?? "KR",
    dest
  );
  const dutyBase = productCost + freight + insurance;
  const customsDuty = Math.round(dutyBase * tariffInfo.duty_rate * 100) / 100;

  const taxableValue = productCost + freight + insurance + customsDuty;
  const vatRate = getVatRate(dest);
  const vat = Math.round(taxableValue * vatRate * 100) / 100;

  const otherFees = estimateOtherFees(dest);

  const breakdown = {
    product_cost: productCost,
    freight,
    insurance,
    customs_duty: customsDuty,
    vat,
    other_fees: otherFees,
  };
  const total = Math.round((productCost + freight + insurance + customsDuty + vat + otherFees) * 100) / 100;
  const effectiveMarkup = productCost > 0
    ? Math.round((total / productCost - 1) * 10000) / 100
    : 0;

  return {
    breakdown,
    total_landed_cost: total,
    duty_rate: Math.round(tariffInfo.duty_rate * 10000) / 100,
    vat_rate: Math.round(vatRate * 10000) / 100,
    effective_markup: effectiveMarkup,
  };
}
