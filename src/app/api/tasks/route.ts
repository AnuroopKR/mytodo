import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import Task from "@/models/Task";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in-progress", "done"]).default("todo"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional().nullable(),
  projectId: z.string().min(1, "Project ID is required"),
  subtasks: z.array(z.object({
    title: z.string(),
    isCompleted: z.boolean().default(false)
  })).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
  recurring: z.object({
    frequency: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
    nextInstanceGenerated: z.boolean().default(false)
  }).optional().default({ frequency: "none", nextInstanceGenerated: false }),
  startTime: z.number().min(0).max(23).optional().nullable()
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const tags = searchParams.get("tags");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    await connectToDatabase();
    const query: any = { userId: session.user.id };
    
    if (projectId) query.projectId = projectId;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (tags) {
      query.tags = { $in: tags.split(",") };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }
    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = new Date(startDate);
      if (endDate) query.dueDate.$lte = new Date(endDate);
    }

    const tasks = await Task.find(query)
      .sort({ dueDate: 1, priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Task.countDocuments(query);

    return NextResponse.json(tasks, {
      headers: {
        'X-Total-Count': total.toString(),
        'X-Total-Pages': Math.ceil(total / limit).toString(),
        'X-Current-Page': page.toString()
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = taskSchema.parse(body);

    await connectToDatabase();
    const newTask = await Task.create({
      ...parsed,
      userId: session.user.id,
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
