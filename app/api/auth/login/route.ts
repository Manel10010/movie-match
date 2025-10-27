import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await createToken(user._id.toString())
    await setAuthCookie(token)

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        bio: user.bio,
      },
    })
  } catch (error) {
    console.error("[LOGIN_ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
