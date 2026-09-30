import { requireUser } from "@/lib/auth";
import { getUnreadNotifications, getUnreadNotificationCount } from "@/lib/notifications";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireUser();
    const [notifications, count] = await Promise.all([
      getUnreadNotifications(),
      getUnreadNotificationCount(),
    ]);

    return NextResponse.json({ notifications, count });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
