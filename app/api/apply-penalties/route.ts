import { NextResponse } from "next/server";
import { Task } from "@/lib/types";

async function run() {
  const today = new Date().toISOString().split("T")[0];
  let tasks: Task[];
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { kv } = await import("@vercel/kv");
    tasks = (await kv.get<Task[]>("tasks")) ?? [];
    const topenalize = tasks.filter(t => t.date < today && !t.done && !t.penaltyApplied);
    if (topenalize.length === 0) return { applied: 0 };
    const updated = tasks.map(t =>
      t.date < today && !t.done && !t.penaltyApplied ? { ...t, penaltyApplied: true } : t
    );
    await kv.set("tasks", updated);
    const penalties = topenalize.reduce((acc, t) => {
      acc[t.owner] = (acc[t.owner] ?? 0) + t.diff;
      return acc;
    }, {} as Record<string, number>);
    return { applied: topenalize.length, penalties };
  }
  return { applied: 0, message: "No KV in local dev" };
}

export async function GET() { return NextResponse.json(await run()); }
export async function POST() { return NextResponse.json(await run()); }
