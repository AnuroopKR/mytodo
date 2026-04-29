import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITag extends Document {
  name: string;
  color: string;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: "bg-zinc-200" },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Tag || mongoose.model<ITag>("Tag", TagSchema);
