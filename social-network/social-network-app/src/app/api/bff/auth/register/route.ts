import { NextRequest, NextResponse } from "next/server";
import { callService, ServiceError } from "@/lib/services/client";
import type { ServiceUser } from "@/lib/services/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const displayName = typeof body?.displayName === "string" ? body.displayName : "";
  const username = typeof body?.username === "string" ? body.username : "";
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!displayName || !username || !email || !password) {
    return NextResponse.json({ message: "All fields are required" }, { status: 400 });
  }

  try {
    const user = await callService<ServiceUser>("users", "/users/register", {
      method: "POST",
      body: JSON.stringify({ displayName, username, email, password }),
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    if (err instanceof ServiceError && err.status === 409) {
      return NextResponse.json({ message: "Username already taken" }, { status: 409 });
    }
    console.error("[bff] register failed", err);
    return NextResponse.json({ message: "users-service is unreachable" }, { status: 502 });
  }
}
