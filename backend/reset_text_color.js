const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Resetting theme color 'text' to dark slate (#0f172a)...");
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

      // Reset the text color to #0f172a
      colors.text = '#0f172a';

      await prisma.config.update({
        where: { id: 'singleton' },
        data: {
          themeColors: JSON.stringify(colors)
        },
      });
      console.log("Theme color 'text' updated successfully in database!");
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
