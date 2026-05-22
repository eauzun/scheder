export type Owner = "emirali" | "idil";

export interface Task {
  id: string;
  date: string; // YYYY-MM-DD
  owner: Owner;
  title: string;
  diff: 1 | 2 | 3 | 4 | 5;
  done: boolean;
  penaltyApplied?: boolean;
  createdAt: number;
}
