import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { User } from "@/lib/models/User"
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)
    const user = await User.create({
      name,
      email,
      passwordHash,
      deck: [],
      friends: [],
    })

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
    console.error("[SIGNUP_ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
