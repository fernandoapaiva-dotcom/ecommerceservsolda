const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  // Create default admin config
  const existingConfig = await prisma.config.findUnique({
    where: { id: 'singleton' },
  });

  if (!existingConfig) {
    await prisma.config.create({
      data: {
        id: 'singleton',
        companyName: 'ServSolda',
        cnpj: '12.345.678/0001-99',
        address: 'Rua Principal da Soldagem, 123 - Distrito Industrial, Caxias do Sul - RS',
        phone: '(54) 3210-9876',
        whatsappSales: '5554999999999', // standard WA link formatted phone number
        alertEmail: 'vendas@servsolda.com.br',
        validityDays: 10,
        socialLinks: JSON.stringify({
          instagram: 'https://instagram.com/servsolda',
          facebook: 'https://facebook.com/servsolda',
          linkedin: 'https://linkedin.com/company/servsolda',
        }),
        footerText: 'ServSolda LTDA © 2026. Todos os direitos reservados. CNPJ: 12.345.678/0001-99',
        workingHours: 'Segunda a Sexta: 08:00 às 12:00 e 13:30 às 18:00',
        erpUrl: 'http://localhost:5000/api/mock-erp',
        erpToken: 'mock-erp-secret-token-key-2026',
        erpSyncMinutes: 1,
      },
    });
    console.log('Default config created!');
  }

  // Create default Admin account: admin@servsolda.com.br / Admin123!
  const bcrypt = require('bcryptjs');
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@servsolda.com.br' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    await prisma.user.create({
      data: {
        email: 'admin@servsolda.com.br',
        password: hashedPassword,
        name: 'Administrador ServSolda',
        role: 'ADMIN',
        document: '000.000.000-00',
        phone: '(54) 99999-9999',
        address: 'Sede ServSolda',
      },
    });
    console.log('Default admin user created: admin@servsolda.com.br / Admin123!');
  }

  // Create some default sections
  const sectionsData = [
    { name: 'Máquinas de Solda', order: 1 },
    { name: 'Acessórios & Tochas', order: 2 },
    { name: 'Eletrodos & Consumíveis', order: 3 },
    { name: 'Gases Industriais', order: 4 },
  ];

  for (const sec of sectionsData) {
    const existingSec = await prisma.section.findFirst({
      where: { name: sec.name },
    });
    if (!existingSec) {
      await prisma.section.create({
        data: {
          name: sec.name,
          order: sec.order,
          active: true,
          image: '',
        },
      });
    }
  }
  console.log('Default sections seeded!');

  // Create some products
  const mqs = await prisma.section.findFirst({ where: { name: 'Máquinas de Solda' } });
  if (mqs) {
    const productsData = [
      {
        sku: 'MIG-250',
        name: 'Máquina de Solda MIG/MAG 250A Flex',
        price: 2490.00,
        stock: 15,
        description: '<p>A Máquina MIG/MAG 250A Flex é ideal para trabalhos profissionais exigentes de serralheria, fabricação leve e reparos automotivos. Possui controle digital inteligente de parâmetros e excelente estabilidade de arco.</p>',
        specs: JSON.stringify([
          { key: 'Processo', value: 'MIG/MAG, MMA (Eletrodo), TIG Lift' },
          { key: 'Tensão de Alimentação', value: '220V Monofásico' },
          { key: 'Faixa de Corrente', value: '20A - 250A' },
          { key: 'Ciclo de Trabalho', value: '60% a 250A' },
          { key: 'Peso', value: '18 kg' }
        ]),
        status: 'FEATURED',
        images: JSON.stringify(['https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=60']),
        pdfs: JSON.stringify([{ title: 'Manual do Usuário MIG-250', url: '#' }]),
        videos: JSON.stringify([{ title: 'Apresentação MIG-250', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }]),
        metaTitle: 'Máquina de Solda MIG/MAG 250A Flex Profissional',
        metaDesc: 'Compre a Máquina de Solda MIG/MAG 250A com controle digital e alta estabilidade. Perfeita para serralheria e oficinas. Solicite orçamento.',
        sectionId: mqs.id
      },
      {
        sku: 'INV-160',
        name: 'Inversora de Solda Eletrodo MMA 160A',
        price: 790.00,
        stock: 30,
        description: '<p>Inversora portátil leve e potente para soldagem de eletrodos revestidos (MMA). Fácil de transportar, perfeita para manutenção e trabalhos em altura. Excelente ciclo de trabalho.</p>',
        specs: JSON.stringify([
          { key: 'Processo', value: 'MMA (Eletrodo Revestido)' },
          { key: 'Tensão de Alimentação', value: '127V/220V Bivolt Automático' },
          { key: 'Faixa de Corrente', value: '10A - 160A' },
          { key: 'Ciclo de Trabalho', value: '60% a 160A' },
          { key: 'Peso', value: '4.5 kg' }
        ]),
        status: 'ACTIVE',
        images: JSON.stringify(['https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=60']),
        pdfs: JSON.stringify([]),
        videos: JSON.stringify([]),
        metaTitle: 'Inversora de Solda Eletrodo MMA 160A Portátil Bivolt',
        metaDesc: 'Inversora de solda portátil 160A bivolt automático para eletrodo. Leve e eficiente. Ideal para manutenção geral e hobby. Faça seu orçamento.',
        sectionId: mqs.id
      }
    ];

    for (const prod of productsData) {
      const existingProd = await prisma.product.findUnique({
        where: { sku: prod.sku },
      });
      if (!existingProd) {
        await prisma.product.create({ data: prod });
      }
    }
    console.log('Default products seeded!');
  }

  // Create a default banner
  const existingBanner = await prisma.banner.findFirst();
  if (!existingBanner) {
    await prisma.banner.create({
      data: {
        image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&auto=format&fit=crop&q=80',
        title: 'Equipamentos de Solda Profissionais',
        link: '/secao/maquinas-de-solda',
        order: 1,
        active: true,
      },
    });
    console.log('Default banners seeded!');
  }

  console.log('Seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
