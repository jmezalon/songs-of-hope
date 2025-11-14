import { PrismaClient, ThemeCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create Chant d'Espérance Collection
  const chantEsperanceCollection = await prisma.collection.upsert({
    where: { name: "Chant d'Espérance" },
    update: {},
    create: {
      name: "Chant d'Espérance",
      nameKreyol: "Chan Espérans",
      description: "Traditional Haitian Christian hymnal with 9 sections",
      sortOrder: 1,
      isActive: true,
    },
  })

  console.log('Created collection:', chantEsperanceCollection.name)

  // Create the 9 sections of Chant d'Espérance
  const sections = [
    {
      name: "Chant d'Espérance",
      nameKreyol: "Chan Espérans",
      description: "The original core hymnal section",
      sortOrder: 1,
    },
    {
      name: "Mélodies Joyeuses",
      nameKreyol: "Melodi Jwayez",
      description: "Joyful melodies for worship and celebration",
      sortOrder: 2,
    },
    {
      name: "Réveillons-Nous",
      nameKreyol: "Ann Reveye",
      description: "Songs of spiritual awakening",
      sortOrder: 3,
    },
    {
      name: "La Voix du Réveil",
      nameKreyol: "Vwa Revèy la",
      description: "The voice of revival and renewal",
      sortOrder: 4,
    },
    {
      name: "Échos des Élus",
      nameKreyol: "Eko Eli yo",
      description: "Echoes of the chosen ones",
      sortOrder: 5,
    },
    {
      name: "Gloire à l'Agneau",
      nameKreyol: "Glwa pou Mouton an",
      description: "Glory to the Lamb - songs of praise",
      sortOrder: 6,
    },
    {
      name: "Haiti Chante Avec Radio Lumière",
      nameKreyol: "Ayiti Chante Avèk Radyo Limyè",
      description: "Haiti sings with Radio Lumière",
      sortOrder: 7,
    },
    {
      name: "Réveillons-Nous Chrétiens",
      nameKreyol: "Ann Reveye Kretyen",
      description: "Awaken, Christians - songs of spiritual call",
      sortOrder: 8,
    },
    {
      name: "L'Ombre du Réveil",
      nameKreyol: "Lonbraj Revèy la",
      description: "The shadow of revival",
      sortOrder: 9,
    },
  ]

  for (const sectionData of sections) {
    const section = await prisma.section.upsert({
      where: {
        collectionId_name: {
          collectionId: chantEsperanceCollection.id,
          name: sectionData.name,
        },
      },
      update: {},
      create: {
        collectionId: chantEsperanceCollection.id,
        name: sectionData.name,
        nameKreyol: sectionData.nameKreyol,
        description: sectionData.description,
        sortOrder: sectionData.sortOrder,
        isActive: true,
      },
    })
    console.log(`Created section ${sectionData.sortOrder}: ${section.name}`)
  }

  // Create Popular Songs Collection
  const popularSongsCollection = await prisma.collection.upsert({
    where: { name: "Popular Christian Songs" },
    update: {},
    create: {
      name: "Popular Christian Songs",
      nameKreyol: "Chan Kretyen Popilè",
      description: "Contemporary Christian worship songs",
      sortOrder: 2,
      isActive: true,
    },
  })

  console.log('Created collection:', popularSongsCollection.name)

  // Create some common themes
  const themes = [
    // Occasions
    { name: "Christmas", nameKreyol: "Nwèl", category: "OCCASION" },
    { name: "Easter", nameKreyol: "Pak", category: "OCCASION" },
    { name: "Baptism", nameKreyol: "Batèm", category: "OCCASION" },
    { name: "Communion", nameKreyol: "Kominyon", category: "OCCASION" },
    { name: "Wedding", nameKreyol: "Maryaj", category: "OCCASION" },
    { name: "Funeral", nameKreyol: "Antèman", category: "OCCASION" },

    // Seasons
    { name: "Advent", nameKreyol: "Avan", category: "SEASON" },
    { name: "Lent", nameKreyol: "Karèm", category: "SEASON" },
    { name: "Pentecost", nameKreyol: "Lafetlasentespri", category: "SEASON" },

    // Topics
    { name: "Praise & Worship", nameKreyol: "Lwanj ak Adore", category: "TOPIC" },
    { name: "Prayer", nameKreyol: "Lapriyè", category: "TOPIC" },
    { name: "Thanksgiving", nameKreyol: "Aksyon de Gras", category: "TOPIC" },
    { name: "Faith", nameKreyol: "Lafwa", category: "TOPIC" },
    { name: "Hope", nameKreyol: "Espwa", category: "TOPIC" },
    { name: "Love", nameKreyol: "Lanmou", category: "TOPIC" },
    { name: "Grace", nameKreyol: "Lagrasa", category: "TOPIC" },
    { name: "Salvation", nameKreyol: "Sali", category: "TOPIC" },
    { name: "Repentance", nameKreyol: "Repanti", category: "TOPIC" },
    { name: "Revival", nameKreyol: "Revèy", category: "TOPIC" },

    // Moods
    { name: "Joyful", nameKreyol: "Kontan", category: "MOOD" },
    { name: "Contemplative", nameKreyol: "Meditasyon", category: "MOOD" },
    { name: "Penitential", nameKreyol: "Repantans", category: "MOOD" },
    { name: "Triumphant", nameKreyol: "Viktwa", category: "MOOD" },

    // Liturgical
    { name: "Opening Hymn", nameKreyol: "Chan Ouvèti", category: "LITURGICAL" },
    { name: "Closing Hymn", nameKreyol: "Chan Fèmti", category: "LITURGICAL" },
    { name: "Communion Hymn", nameKreyol: "Chan Kominyon", category: "LITURGICAL" },
    { name: "Offering", nameKreyol: "Ofrand", category: "LITURGICAL" },
  ]

  for (const themeData of themes) {
    await prisma.theme.upsert({
      where: { name: themeData.name },
      update: {},
      create: {
        name: themeData.name,
        nameKreyol: themeData.nameKreyol,
        category: themeData.category as ThemeCategory,
        isActive: true,
      },
    })
  }

  console.log(`Created ${themes.length} themes`)

  // Create a sample admin user (password: "admin123" - hashed)
  // Note: In production, you should use bcryptjs to hash the password
  const hashedPassword = await bcrypt.hash('admin123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@chantesperance.com' },
    update: {},
    create: {
      email: 'admin@chantesperance.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      preferredLanguage: 'BILINGUAL',
      emailVerified: new Date(),
    },
  })

  console.log('Created admin user: admin@chantesperance.com')

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
