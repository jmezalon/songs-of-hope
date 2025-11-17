const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const themes = [
  // OCCASION themes
  { name: 'Christmas', nameKreyol: 'Nwèl', category: 'OCCASION', sortOrder: 1 },
  { name: 'Easter', nameKreyol: 'Pak', category: 'OCCASION', sortOrder: 2 },
  { name: 'New Year', nameKreyol: 'Nouvo Ane', category: 'OCCASION', sortOrder: 3 },
  { name: 'Baptism', nameKreyol: 'Batèm', category: 'OCCASION', sortOrder: 4 },
  { name: 'Wedding', nameKreyol: 'Maryaj', category: 'OCCASION', sortOrder: 5 },
  { name: 'Funeral', nameKreyol: 'Antèman', category: 'OCCASION', sortOrder: 6 },
  { name: 'Communion', nameKreyol: 'Sèn', category: 'OCCASION', sortOrder: 7 },

  // SEASON themes
  { name: 'Advent', nameKreyol: 'Advan', category: 'SEASON', sortOrder: 1 },
  { name: 'Lent', nameKreyol: 'Karèm', category: 'SEASON', sortOrder: 2 },
  { name: 'Pentecost', nameKreyol: 'Pantekòt', category: 'SEASON', sortOrder: 3 },
  { name: 'Ordinary Time', nameKreyol: 'Tan Òdinè', category: 'SEASON', sortOrder: 4 },

  // TOPIC themes
  { name: 'Praise & Worship', nameKreyol: 'Lwanj ak Adorasyon', category: 'TOPIC', sortOrder: 1 },
  { name: 'Prayer', nameKreyol: 'Lapriyè', category: 'TOPIC', sortOrder: 2 },
  { name: 'Thanksgiving', nameKreyol: 'Aksyon de Gras', category: 'TOPIC', sortOrder: 3 },
  { name: 'Faith', nameKreyol: 'Lafwa', category: 'TOPIC', sortOrder: 4 },
  { name: 'Hope', nameKreyol: 'Espwa', category: 'TOPIC', sortOrder: 5 },
  { name: 'Love', nameKreyol: 'Lanmou', category: 'TOPIC', sortOrder: 6 },
  { name: 'Forgiveness', nameKreyol: 'Padòn', category: 'TOPIC', sortOrder: 7 },
  { name: 'Salvation', nameKreyol: 'Delivrans', category: 'TOPIC', sortOrder: 8 },
  { name: 'Grace', nameKreyol: 'Lagras', category: 'TOPIC', sortOrder: 9 },
  { name: 'Peace', nameKreyol: 'Lapè', category: 'TOPIC', sortOrder: 10 },
  { name: 'Joy', nameKreyol: 'Lajwa', category: 'TOPIC', sortOrder: 11 },
  { name: 'Holy Spirit', nameKreyol: 'Sentespri', category: 'TOPIC', sortOrder: 12 },
  { name: 'Second Coming', nameKreyol: 'Dezyèm Retou', category: 'TOPIC', sortOrder: 13 },
  { name: 'Mission', nameKreyol: 'Misyon', category: 'TOPIC', sortOrder: 14 },
  { name: 'Evangelism', nameKreyol: 'Evanjelizasyon', category: 'TOPIC', sortOrder: 15 },
  { name: 'Stewardship', nameKreyol: 'Jesyon', category: 'TOPIC', sortOrder: 16 },
  { name: 'Sabbath', nameKreyol: 'Saba', category: 'TOPIC', sortOrder: 17 },
  { name: 'Creation', nameKreyol: 'Kreyasyon', category: 'TOPIC', sortOrder: 18 },
  { name: 'Cross', nameKreyol: 'Lakwa', category: 'TOPIC', sortOrder: 19 },
  { name: 'Heaven', nameKreyol: 'Syèl la', category: 'TOPIC', sortOrder: 20 },

  // MOOD themes
  { name: 'Joyful', nameKreyol: 'Kontan', category: 'MOOD', sortOrder: 1 },
  { name: 'Contemplative', nameKreyol: 'Kontanplasyon', category: 'MOOD', sortOrder: 2 },
  { name: 'Penitential', nameKreyol: 'Repanti', category: 'MOOD', sortOrder: 3 },
  { name: 'Celebratory', nameKreyol: 'Selebrasyon', category: 'MOOD', sortOrder: 4 },
  { name: 'Reverent', nameKreyol: 'Respè', category: 'MOOD', sortOrder: 5 },
  { name: 'Hopeful', nameKreyol: 'Espwa', category: 'MOOD', sortOrder: 6 },

  // LITURGICAL themes
  { name: 'Opening', nameKreyol: 'Ouvèti', category: 'LITURGICAL', sortOrder: 1 },
  { name: 'Communion/Lord\'s Supper', nameKreyol: 'Sèn/Soupe Senyè a', category: 'LITURGICAL', sortOrder: 2 },
  { name: 'Offering', nameKreyol: 'Òf', category: 'LITURGICAL', sortOrder: 3 },
  { name: 'Closing', nameKreyol: 'Fèmti', category: 'LITURGICAL', sortOrder: 4 },
  { name: 'Call to Worship', nameKreyol: 'Apèl pou Adorasyon', category: 'LITURGICAL', sortOrder: 5 },
  { name: 'Benediction', nameKreyol: 'Benedicsyon', category: 'LITURGICAL', sortOrder: 6 },

  // BIBLICAL themes
  { name: 'Psalm', nameKreyol: 'Sòm', category: 'BIBLICAL', sortOrder: 1 },
  { name: 'Gospel-based', nameKreyol: 'Baze sou Levanjil', category: 'BIBLICAL', sortOrder: 2 },
  { name: 'Old Testament', nameKreyol: 'Ansyen Testaman', category: 'BIBLICAL', sortOrder: 3 },
  { name: 'New Testament', nameKreyol: 'Nouvo Testaman', category: 'BIBLICAL', sortOrder: 4 },
  { name: 'Prophetic', nameKreyol: 'Pwofetik', category: 'BIBLICAL', sortOrder: 5 },
]

async function main() {
  console.log('<1 Seeding themes...')

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { name: theme.name },
      update: {},
      create: theme,
    })
  }

  console.log(` Successfully seeded ${themes.length} themes!`)

  // Display summary
  const themeCounts = await prisma.theme.groupBy({
    by: ['category'],
    _count: true,
  })

  console.log('\n=Ê Theme Summary:')
  for (const count of themeCounts) {
    console.log(`  ${count.category}: ${count._count} themes`)
  }
}

main()
  .catch((e) => {
    console.error('L Error seeding themes:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
