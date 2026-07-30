import { NextRequest, NextResponse } from "next/server";
import { callService, ServiceError } from "@/lib/services/client";
import type { ServiceUser } from "@/lib/services/types";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle");
  if (!handle) {
    return NextResponse.json({ message: "handle is required" }, { status: 400 });
  }
  try {
    const user = await callService<ServiceUser>("users", `/users/${encodeURIComponent(handle)}`);
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof ServiceError && err.status === 404) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    console.error("[bff] settings account fetch failed", err);
    return NextResponse.json({ message: "users-service is unreachable" }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const currentHandle = typeof body?.currentHandle === "string" ? body.currentHandle : "";
  const displayName = typeof body?.displayName === "string" ? body.displayName : "";
  const username = typeof body?.username === "string" ? body.username : "";
  const email = typeof body?.email === "string" ? body.email : "";

  if (!currentHandle || !displayName || !username || !email) {
    return NextResponse.json({ message: "All fields are required" }, { status: 400 });
  }

  try {
    const user = await callService<ServiceUser>("users", `/users/${encodeURIComponent(currentHandle)}`, {
      method: "PATCH",
      body: JSON.stringify({ displayName, username, email }),
    });
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof ServiceError && err.status === 409) {
      return NextResponse.json({ message: "Username already taken" }, { status: 409 });
    }
    console.error("[bff] settings save failed", err);
    return NextResponse.json({ message: "users-service is unreachable" }, { status: 502 });
  }
}
