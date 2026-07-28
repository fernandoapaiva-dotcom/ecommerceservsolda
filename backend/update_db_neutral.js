const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Updating database configuration record...");
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

      // Add neutral color if missing
      colors.neutral = colors.neutral || '#94a3b8';

      // Update name to ServSolda
      const updateData = {
        themeColors: JSON.stringify(colors),
        companyName: 'ServSolda',
      };

      if (config.footerText && config.footerText.includes('ServoSolda')) {
        updateData.footerText = config.footerText.replace(/ServoSolda/g, 'ServSolda');
      }

      await prisma.config.update({
        where: { id: 'singleton' },
        data: updateData,
      });
      console.log("Configuration updated successfully!");
    } else {
      console.log("No config record found, it will be created by the app seed.");
    }
  } catch (error) {
    console.error("Error updating config:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
