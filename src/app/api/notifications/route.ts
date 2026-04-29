import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Task from "@/models/Task";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const now = new Date();
    now.setHours(0, 0, 0, 0); // start of today

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    const baseQuery = {
      userId: session.user.id,
      status: { $ne: "done" },
      dueDate: { $exists: true, $ne: null }
    };

    const overdueTasks = await Task.find({
      ...baseQuery,
      dueDate: { $lt: now }
    }).sort({ dueDate: 1 }).limit(10);

    const dueSoonTasks = await Task.find({
      ...baseQuery,
      dueDate: { $gte: now, $lte: threeDaysFromNow }
    }).sort({ dueDate: 1 }).limit(10);

    return NextResponse.json({
      overdue: overdueTasks,
      dueSoon: dueSoonTasks
    });
  } catch (error) {
    console.error("Notifications API Error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
