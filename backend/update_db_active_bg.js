const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating database theme colors to include adminSidebarActiveBg...");
  try {
    const config = await prisma.config.findUnique({
      where: { id: 'singleton' },
    });

    if (config) {
      let colors = {};
      try {
        colors = typeof config.themeColors === 'string' ? JSON.parse(config.themeColors) : config.themeColors;
      } catch (e) {
        colors = {};
      }

      // Add adminSidebarActiveBg if missing
      colors.adminSidebarActiveBg = colors.adminSidebarActiveBg || '#f59e0b';

      await prisma.config.update({
        where: { id: 'singleton' },
        data: {
          themeColors: JSON.stringify(colors)
        },
      });
      console.log("Database updated successfully with adminSidebarActiveBg!");
    } else {
      console.log("No config record found.");
    }
  } catch (error) {
    console.error("Error updating config:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
