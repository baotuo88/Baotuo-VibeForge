import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: "USER" | "ADMIN"
      plan: "FREE" | "PRO" | "TEAM"
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: "USER" | "ADMIN"
    plan: "FREE" | "PRO" | "TEAM"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "USER" | "ADMIN"
    plan: "FREE" | "PRO" | "TEAM"
  }
}
