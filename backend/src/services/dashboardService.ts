export interface PillarStatus {
  id: string;
  title: string;
  subtitle: string;
  weight: string;
  status: "active" | "ready" | "standby";
}

export function getPillars(): PillarStatus[] {
  return [
    { id: "market-intel", title: "PILLAR 1", subtitle: "Market Intel", weight: "40%", status: "active" },
    { id: "b2b", title: "PILLAR 2", subtitle: "B2B Trade", weight: "20%", status: "standby" },
    { id: "b2c", title: "PILLAR 3", subtitle: "B2C Commerce", weight: "30%", status: "standby" },
    { id: "gov", title: "PILLAR 4", subtitle: "Gov Tender", weight: "10%", status: "standby" },
  ];
}
