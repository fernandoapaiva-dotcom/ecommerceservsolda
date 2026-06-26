const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

async function generateBudgetPDF(order, user, config) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const filename = `orcamento-${order.budgetNumber}.pdf`;
      const baseUploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, '../../uploads');
      const outputDir = path.join(baseUploadsDir, 'budgets');
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const filePath = path.join(outputDir, filename);
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Logo (or placeholder if logo doesn't exist)
      let logoAdded = false;
      if (config.logo) {
        try {
          const logoFilename = path.basename(config.logo);
          const logoPath = path.join(baseUploadsDir, logoFilename);
          if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 100 });
            logoAdded = true;
          }
        } catch (e) {
          console.error("Error embedding logo in PDF:", e);
        }
      }

      // Title & Header Information
      const startX = logoAdded ? 170 : 50;
      doc.fillColor('#1f2937')
        .fontSize(20)
        .text(config.companyName || 'ServoSolda', startX, 45, { weight: 'bold' });
      
      doc.fontSize(9)
        .fillColor('#4b5563')
        .text(`CNPJ: ${config.cnpj || '12.345.678/0001-99'}`, startX, 70)
        .text(`Telefone: ${config.phone || '(54) 3210-9876'}`, startX, 85)
        .text(`Endereço: ${config.address || 'Distrito Industrial, Caxias do Sul - RS'}`, startX, 100);

      // Horizontal Divider
      doc.moveTo(50, 130).lineTo(545, 130).stroke('#d1d5db');

      // Order Title & Metadata
      doc.fontSize(14)
        .fillColor('#1f2937')
        .text(`ORÇAMENTO: ${order.budgetNumber}`, 50, 145, { weight: 'bold' });
      
      const formattedDate = new Date(order.createdAt).toLocaleDateString('pt-BR');
      doc.fontSize(10)
        .fillColor('#4b5563')
        .text(`Data de Emissão: ${formattedDate}`, 380, 145, { align: 'right' });
      
      const validUntil = new Date(order.createdAt);
      validUntil.setDate(validUntil.getDate() + (config.validityDays || 5));
      doc.text(`Válido até: ${validUntil.toLocaleDateString('pt-BR')}`, 380, 160, { align: 'right' });

      // Customer Details Card
      doc.rect(50, 185, 495, 80).fill('#f9fafb').stroke('#e5e7eb');
      doc.fillColor('#111827').fontSize(11).text('CLIENTE', 65, 195, { weight: 'bold' });
      doc.fontSize(9).fillColor('#374151')
        .text(`Nome/Razão Social: ${user.name}`, 65, 215)
        .text(`CPF/CNPJ: ${user.document || 'Não informado'}`, 65, 230)
        .text(`Email: ${user.email}`, 65, 245)
        .text(`Telefone: ${user.phone || 'Não informado'}`, 280, 215)
        .text(`Endereço: ${user.address || 'Não informado'}`, 280, 230);

      // Items Table Title
      doc.fontSize(11).fillColor('#111827').text('ITENS DO ORÇAMENTO', 50, 285, { weight: 'bold' });

      // Table Header
      let y = 305;
      doc.rect(50, y, 495, 22).fill('#1f2937');
      doc.fillColor('#ffffff').fontSize(9)
        .text('CÓDIGO/SKU', 60, y + 6)
        .text('PRODUTO', 160, y + 6)
        .text('QTD', 340, y + 6, { width: 30, align: 'center' })
        .text('VALOR UNIT.', 380, y + 6, { width: 70, align: 'right' })
        .text('TOTAL', 460, y + 6, { width: 75, align: 'right' });

      y += 22;

      // Table Rows
      const items = JSON.parse(order.items);
      doc.fillColor('#374151');
      
      items.forEach((item, idx) => {
        // Alternating background colors
        if (idx % 2 === 0) {
          doc.rect(50, y, 495, 20).fill('#f9fafb');
        } else {
          doc.rect(50, y, 495, 20).fill('#ffffff');
        }
        
        doc.fillColor('#374151')
          .text(item.sku || 'N/A', 60, y + 5)
          .text(item.name || 'Produto', 160, y + 5, { width: 170, height: 12, ellipsis: true })
          .text(item.qty.toString(), 340, y + 5, { width: 30, align: 'center' })
          .text(`R$ ${item.price.toFixed(2)}`, 380, y + 5, { width: 70, align: 'right' })
          .text(`R$ ${item.total.toFixed(2)}`, 460, y + 5, { width: 75, align: 'right' });
        
        y += 20;
      });

      // Total/Summary Card
      y += 10;
      doc.rect(340, y, 205, 80).fill('#f3f4f6').stroke('#d1d5db');
      doc.fillColor('#111827').fontSize(9).text('RESUMO', 350, y + 8, { weight: 'bold' });
      doc.fillColor('#374151').fontSize(8)
        .text('Subtotal:', 350, y + 22)
        .text(`R$ ${order.subtotal.toFixed(2)}`, 450, y + 22, { width: 85, align: 'right' })
        .text('Frete:', 350, y + 34)
        .text('R$ 0,00', 450, y + 34, { width: 85, align: 'right' })
        .text('Impostos:', 350, y + 46)
        .text('R$ 0,00', 450, y + 46, { width: 85, align: 'right' })
        .fontSize(10).fillColor('#111827')
        .text('TOTAL GERAL:', 350, y + 62, { weight: 'bold' })
        .text(`R$ ${order.total.toFixed(2)}`, 450, y + 62, { width: 85, align: 'right', weight: 'bold' });

      // Notes
      const notesText = order.notes || config.pdfNotes;
      if (notesText) {
        y += 95;
        doc.fontSize(9).fillColor('#1f2937').text('Notas:', 50, y, { weight: 'bold' });
        doc.fillColor('#4b5563').text(notesText, 50, y + 12, { width: 495 });
      }

      // Footer Note
      doc.moveTo(50, 750).lineTo(545, 750).stroke('#e5e7eb');
      doc.fontSize(8).fillColor('#9ca3af')
        .text(`Orçamento válido por ${config.validityDays || 5} dias. Faturamento sujeito a análise de crédito.`, 50, 760, { align: 'center' })
        .text('Agradecemos a preferência! ServoSolda - Equipamentos de Qualidade.', 50, 772, { align: 'center' });

      doc.end();
      writeStream.on('finish', () => {
        resolve(`/uploads/budgets/${filename}`);
      });
      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = {
  generateBudgetPDF,
};
