import { NextRequest, NextResponse } from "next/server";
import { callService, ServiceError } from "@/lib/services/client";
import type { ServiceUser } from "@/lib/services/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const identifier = typeof body?.identifier === "string" ? body.identifier : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!identifier || !password) {
    return NextResponse.json({ message: "Enter your email/username and password" }, { status: 400 });
  }

  try {
    const user = await callService<ServiceUser>("users", "/users/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof ServiceError && err.status === 401) {
      return NextResponse.json({ message: "Incorrect username or password" }, { status: 401 });
    }
    console.error("[bff] users-service login failed", err);
    return NextResponse.json({ message: "users-service is unreachable" }, { status: 502 });
  }
}
