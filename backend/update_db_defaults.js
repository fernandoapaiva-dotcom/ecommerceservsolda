const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const current = await prisma.config.findUnique({ where: { id: 'singleton' } });
  
  let colors = {};
  if (current && current.themeColors) {
    colors = typeof current.themeColors === 'string' ? JSON.parse(current.themeColors) : current.themeColors;
  }
  
  // Inject default header theme colors matching the user's secondary/accent scheme
  colors.headerBg = colors.headerBg || colors.secondary || '#002405';
  colors.headerText = colors.headerText || '#ffffff';
  colors.navBg = colors.navBg || colors.accent || '#004822';
  colors.navText = colors.navText || '#ffffff';
  colors.searchBg = colors.searchBg || colors.accent || '#004822';
  colors.searchText = colors.searchText || '#ffffff';

  await prisma.config.update({
    where: { id: 'singleton' },
    data: {
      logo: '/uploads/logo.svg',
      favicon: '/uploads/favicon.svg',
      themeColors: JSON.stringify(colors)
    }
  });
  console.log("Database successfully updated with default logo, favicon, and header colors!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
