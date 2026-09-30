import { requireUser } from "@/lib/auth";
import { markAllNotificationsAsRead } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await requireUser();
    await markAllNotificationsAsRead();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
