import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IMovie {
  tmdbId: string
  title: string
  posterUrl: string
}

export interface IUser extends Document {
  name: string
  email: string
  passwordHash: string
  profilePic?: string
  bio?: string
  deck: IMovie[]
  friends: mongoose.Types.ObjectId[]
  createdAt: Date
}

const MovieSchema = new Schema({
  tmdbId: { type: String, required: true },
  title: { type: String, required: true },
  posterUrl: { type: String, required: true },
})

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  profilePic: { type: String, default: "" },
  bio: { type: String, default: "" },
  deck: [MovieSchema],
  friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
})

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
