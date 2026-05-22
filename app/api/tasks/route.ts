import { NextResponse } from "next/server";
import { Task } from "@/lib/types";

let localTasks: Task[] = [];

async function getRedis() {
  const { Redis } = await import("@upstash/redis");
  return Redis.fromEnv(); // otomatik KV_REST_API_URL + KV_REST_API_TOKEN okur
}

async function getTasks(): Promise<Task[]> {
  if (!process.env.KV_REST_API_URL) return localTasks;
  const redis = await getRedis();
  return (await redis.get<Task[]>("tasks")) ?? [];
}

async function setTasks(tasks: Task[]): Promise<void> {
  if (!process.env.KV_REST_API_URL) { localTasks = tasks; return; }
  const redis = await getRedis();
  await redis.set("tasks", tasks);
}

export async function GET() {
  return NextResponse.json(await getTasks());
}

export async function POST(req: Request) {
  const task: Task = await req.json();
  const tasks = await getTasks();
  tasks.push(task);
  await setTasks(tasks);
  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(req: Request) {
  const { id, ...updates } = await req.json();
  const tasks = await getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  tasks[idx] = { ...tasks[idx], ...updates };
  await setTasks(tasks);
  return NextResponse.json(tasks[idx]);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  let tasks = await getTasks();
  if (id === "__RESET__") { await setTasks([]); return NextResponse.json({ ok: true }); }
  tasks = tasks.filter((t) => t.id !== id);
  await setTasks(tasks);
  return NextResponse.json({ ok: true });
}
