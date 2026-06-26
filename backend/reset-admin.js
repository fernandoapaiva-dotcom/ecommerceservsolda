const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('Admin@2026!', 10)
  await prisma.user.upsert({
    where: { email: 'admin@servsolda.com.br' },
    update: { password: hash, role: 'ADMIN' },
    create: {
      email: 'admin@servsolda.com.br',
      name: 'Administrador',
      password: hash,
      role: 'ADMIN'
    }
  })
  console.log('Admin recriado com sucesso!')
  await prisma.$disconnect()
}

main()
