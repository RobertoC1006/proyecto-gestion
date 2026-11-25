export type Source = "synthetic" | "operational";
export type Day = { date: string; count: number };
export type ForecastPoint = {
  date: string;
  value: number;
  lower: number | null;
  upper: number | null;
};
export interface Metric {
  mae: number;
  mape: number | null;
  zeroExcluded: number;
  samples: number;
}
export interface Evaluation {
  provenance?: {
    runId: string;
    origin: string;
    datasetHash: string;
    engineVersion: string;
  };
  selectedModel: "weekly_naive" | "sarimax";
  metrics: { weekly_naive: Metric; sarimax: Metric | null };
  candidateStatus: string;
  folds: { trainThrough: string; testFrom: string; testThrough: string }[];
  points: {
    date: string;
    observed: number;
    weekly_naive: number;
    sarimax: number | null;
  }[];
}
export interface DemandResult {
  status: "available" | "unavailable";
  source: Source;
  unit: "tickets/day";
  timezone: string;
  horizonDays: number;
  datasetHash: string;
  engineVersion: string;
  parameters: unknown;
  libraries: unknown;
  seed: number | null;
  observationDays: number;
  totalTickets: number;
  from: string | null;
  through: string | null;
  origin: string;
  reason?: string;
  model?: string;
  intervalLevel?: number | null;
  observed: Day[];
  forecast: ForecastPoint[];
  evaluation: Evaluation | null;
  artifact?: { key: string; sha256: string };
}
export const limaDay = (at = new Date()) =>
  new Date(at.getTime() - 5 * 3600000).toISOString().slice(0, 10);
export const addDays = (day: string, n: number) =>
  new Date(Date.parse(day + "T12:00:00Z") + n * 86400000)
    .toISOString()
    .slice(0, 10);
