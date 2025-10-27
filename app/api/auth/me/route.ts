import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(session.userId).select("-passwordHash")
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[ME_ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
