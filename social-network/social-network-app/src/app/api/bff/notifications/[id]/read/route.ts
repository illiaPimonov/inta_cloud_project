import { NextResponse } from "next/server";
import { callService } from "@/lib/services/client";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  try {
    const result = await callService("notifications", `/notifications/${params.id}/read`, { method: "PATCH" });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[bff] mark notification read failed", err);
    return NextResponse.json({ message: "notifications-service is unreachable" }, { status: 502 });
  }
}
