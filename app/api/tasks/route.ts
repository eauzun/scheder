import { NextResponse } from "next/server";
import { Task } from "@/lib/types";

let localTasks: Task[] = [];

async function getTasks(): Promise<Task[]> {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { kv } = await import("@vercel/kv");
    const tasks = await kv.get<Task[]>("tasks");
    return tasks ?? [];
  }
  return localTasks;
}

async function setTasks(tasks: Task[]): Promise<void> {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const { kv } = await import("@vercel/kv");
    await kv.set("tasks", tasks);
    return;
  }
  localTasks = tasks;
}

export async function GET() {
  const tasks = await getTasks();
  return NextResponse.json(tasks);
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
  if (id === "__RESET__") {
    await setTasks([]);
    return NextResponse.json({ ok: true });
  }
  tasks = tasks.filter((t) => t.id !== id);
  await setTasks(tasks);
  return NextResponse.json({ ok: true });
}
