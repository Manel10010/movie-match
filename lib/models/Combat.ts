import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface IFilm {
  tmdbId: string
  title: string
  posterUrl: string
}

export interface IRound {
  filmA: IFilm
  filmB: IFilm
  votes: Map<string, "A" | "B">
}

export interface ICombat extends Document {
  creatorId: mongoose.Types.ObjectId
  participants: mongoose.Types.ObjectId[]
  deckSize: number
  maxParticipants: number
  status: "waiting" | "in_progress" | "finished"
  rounds: IRound[]
  winner?: IFilm
  createdAt: Date
}

const FilmSchema = new Schema({
  tmdbId: { type: String, required: true },
  title: { type: String, required: true },
  posterUrl: { type: String, required: true },
})

const RoundSchema = new Schema({
  filmA: FilmSchema,
  filmB: FilmSchema,
  votes: { type: Map, of: String },
})

const CombatSchema = new Schema<ICombat>({
  creatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  deckSize: { type: Number, required: true },
  maxParticipants: { type: Number, required: true },
  status: {
    type: String,
    enum: ["waiting", "in_progress", "finished"],
    default: "waiting",
  },
  rounds: [RoundSchema],
  winner: FilmSchema,
  createdAt: { type: Date, default: Date.now },
})

export const Combat: Model<ICombat> = mongoose.models.Combat || mongoose.model<ICombat>("Combat", CombatSchema)
