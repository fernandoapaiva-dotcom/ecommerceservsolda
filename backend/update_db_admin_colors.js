const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating database theme colors to include admin panel variables...");
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

      // Add admin colors if missing
      colors.adminSidebarBg = colors.adminSidebarBg || '#0f172a';
      colors.adminSidebarText = colors.adminSidebarText || '#cbd5e1';

      await prisma.config.update({
        where: { id: 'singleton' },
        data: {
          themeColors: JSON.stringify(colors)
        },
      });
      console.log("Database theme colors updated successfully!");
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
