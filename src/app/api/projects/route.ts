import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const projects = await Project.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(session.user.id) } },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "projectId",
          as: "tasks",
        },
      },
      {
        $addFields: {
          totalTasks: { $size: "$tasks" },
          completedTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: { $eq: ["$$task.status", "done"] },
              },
            },
          },
          dueSoonTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: {
                  $and: [
                    { $ne: ["$$task.status", "done"] },
                    { $type: "$$task.dueDate" },
                    {
                      $lte: [
                        "$$task.dueDate",
                        new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          tasks: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return NextResponse.json(projects);
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
    const { name, description } = projectSchema.parse(body);

    await connectToDatabase();
    const newProject = await Project.create({
      name,
      description,
      userId: session.user.id,
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
