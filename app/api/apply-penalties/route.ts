import { NextResponse } from "next/server";
import { Task } from "@/lib/types";

async function run() {
  const today = new Date().toISOString().split("T")[0];
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return { applied: 0, message: "No Redis in local dev" };
  }
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  const tasks: Task[] = (await redis.get<Task[]>("tasks")) ?? [];
  const topenalize = tasks.filter(t => t.date < today && !t.done && !t.penaltyApplied);
  if (topenalize.length === 0) return { applied: 0 };
  const updated = tasks.map(t =>
    t.date < today && !t.done && !t.penaltyApplied ? { ...t, penaltyApplied: true } : t
  );
  await redis.set("tasks", updated);
  const penalties = topenalize.reduce((acc, t) => {
    acc[t.owner] = (acc[t.owner] ?? 0) + t.diff;
    return acc;
  }, {} as Record<string, number>);
  return { applied: topenalize.length, penalties };
}

export async function GET() { return NextResponse.json(await run()); }
export async function POST() { return NextResponse.json(await run()); }
