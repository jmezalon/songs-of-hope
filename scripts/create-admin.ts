import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function createAdmin() {
  const email = "admin@example.com"
  const password = "Admin123!"
  const name = "Admin User"

  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    console.log("Admin user already exists!")
    console.log("Email:", email)
    console.log("Password:", password)
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
  console.log("🔑 Password:", password)
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
