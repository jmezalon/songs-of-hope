import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function createAdmin() {
  // Get credentials from environment variables or use defaults
  const email = process.env.ADMIN_EMAIL || "admin@example.com"
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || "Admin User"

  if (!password) {
    console.error("❌ Error: ADMIN_PASSWORD environment variable is required")
    console.error("\nUsage: ADMIN_PASSWORD='your-secure-password' npx tsx scripts/create-admin.ts")
    process.exit(1)
  }

  // Validate password strength
  if (password.length < 8) {
    console.error("❌ Error: Password must be at least 8 characters long")
    process.exit(1)
  }

  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    console.log("⚠️  Admin user already exists!")
    console.log("📧 Email:", email)
    return
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create the admin user
  const admin = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    },
  })

  console.log("✅ Admin user created successfully!")
  console.log("\n📧 Email:", email)
  console.log("🔑 Password: ********")
  console.log("\nYou can now login at: http://localhost:3000/login")
}

createAdmin()
  .catch((error) => {
    console.error("Error creating admin user:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
