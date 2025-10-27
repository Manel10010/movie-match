import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IInvite extends Document {
  senderId: mongoose.Types.ObjectId
  receiverEmail: string
  combatId: mongoose.Types.ObjectId
  status: "pending" | "accepted" | "declined"
  createdAt: Date
}

const InviteSchema = new Schema<IInvite>({
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiverEmail: { type: String, required: true },
  combatId: { type: Schema.Types.ObjectId, ref: "Combat", required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
})

export const Invite: Model<IInvite> = mongoose.models.Invite || mongoose.model<IInvite>("Invite", InviteSchema)
