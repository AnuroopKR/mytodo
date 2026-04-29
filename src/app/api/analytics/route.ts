import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Task from "@/models/Task";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const userId = new mongoose.Types.ObjectId(session.user.id);

    // 1. Completion count per day over the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyActivity = await Task.aggregate([
      {
        $match: {
          userId,
          status: "done",
          updatedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days
    const activityMap = new Map(weeklyActivity.map(item => [item._id, item.count]));
    const formattedWeeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      formattedWeeklyActivity.push({
        date: dateStr,
        count: activityMap.get(dateStr) || 0
      });
    }

    // 2. Total pending vs completed
    const taskStatusCounts = await Task.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const statusMap = new Map(taskStatusCounts.map(item => [item._id, item.count]));
    const pendingCount = (statusMap.get("todo") || 0) + (statusMap.get("in-progress") || 0);
    const completedCount = statusMap.get("done") || 0;

    return NextResponse.json({
      weeklyActivity: formattedWeeklyActivity,
      statusBreakdown: {
        pending: pendingCount,
        completed: completedCount
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
