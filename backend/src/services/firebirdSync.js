const Firebird = require('node-firebird');
const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');
const prisma = require('../models/db');

/**
 * Restaura um arquivo de backup .FBK do Firebird para um banco .FDB temporário usando gbak.exe
 */
function restoreFbkToFdb(fbkPath, user = 'SYSDBA', password = 'masterkey') {
  let gbakDir = 'C:\\Softsystem';
  let gbakPath = 'C:\\Softsystem\\gbak.exe';

  if (!fs.existsSync(gbakPath)) {
    if (fs.existsSync('C:\\Program Files\\Firebird\\Firebird_3_0\\gbak.exe')) {
      gbakPath = 'C:\\Program Files\\Firebird\\Firebird_3_0\\gbak.exe';
      gbakDir = 'C:\\Program Files\\Firebird\\Firebird_3_0';
    } else if (fs.existsSync('C:\\Program Files (x86)\\Firebird\\Firebird_2_5\\bin\\gbak.exe')) {
      gbakPath = 'C:\\Program Files (x86)\\Firebird\\Firebird_2_5\\bin\\gbak.exe';
      gbakDir = 'C:\\Program Files (x86)\\Firebird\\Firebird_2_5\\bin';
    } else {
      gbakPath = 'gbak';
      gbakDir = process.cwd();
    }
  }

  const absFbkPath = path.resolve(fbkPath);
  const absTargetFdbPath = path.resolve(fbkPath + '_temp.fdb');

  if (fs.existsSync(absTargetFdbPath)) {
    try { fs.unlinkSync(absTargetFdbPath); } catch (e) {}
  }

  // Faz cópia temporária do arquivo .FBK na pasta do Firebird (C:\Softsystem) para evitar locks de gravação do Multer/Windows
  let fileToRestore = absFbkPath;
  const safeTempCopy = path.join(gbakDir, 'temp_input_' + Date.now() + '.fbk');

  try {
    fs.copyFileSync(absFbkPath, safeTempCopy);
    fileToRestore = safeTempCopy;
    console.log(`[Firebird restore] Criada cópia limpa em: ${safeTempCopy}`);
  } catch (copyErr) {
    console.warn('[Firebird restore warning] Não foi possível criar cópia em gbakDir, usando arquivo original:', copyErr.message);
  }

  console.log(`[Firebird restore] Restaurando backup .FBK (${fileToRestore}) usando ${gbakPath} (cwd: ${gbakDir})...`);
  
  try {
    execFileSync(gbakPath, ['-c', '-user', user, '-password', password, fileToRestore, absTargetFdbPath], {
      cwd: gbakDir,
      timeout: 300000
    });
    console.log(`[Firebird restore] Backup restaurado com sucesso em: ${absTargetFdbPath}`);
    return absTargetFdbPath;
  } catch (err) {
    console.error('[Firebird restore error]', err.message);
    throw new Error(`Não foi possível descompactar o arquivo .FBK. Erro do Firebird: ${err.message}`);
  } finally {
    if (fileToRestore === safeTempCopy) {
      try { fs.unlinkSync(safeTempCopy); } catch (e) {}
    }
  }
}

/**
 * Conecta em um banco Firebird (.FDB ou host Firebird) e executa query de busca de produtos.
 */
async function queryFirebirdDatabase(options) {
  let targetHost = options.host || '127.0.0.1';
  let targetDatabase = options.database;

  // Se o caminho informado for da rede no formato UNC: \\SRV-SERVWELD\Softsystem\Base\CENTROOESTE.FDB
  if (targetDatabase && typeof targetDatabase === 'string' && targetDatabase.startsWith('\\\\')) {
    const parts = targetDatabase.substring(2).split('\\').filter(Boolean);
    if (parts.length >= 2) {
      targetHost = parts[0]; // SRV-SERVWELD
      const restPath = parts.slice(1).join('\\'); // Softsystem\Base\CENTROOESTE.FDB
      targetDatabase = `C:\\${restPath}`; // C:\Softsystem\Base\CENTROOESTE.FDB
      console.log(`[Firebird UNC Auto-Parse] Host: ${targetHost} | Database no Servidor: ${targetDatabase}`);
    }
  }

  const dbOptions = {
    host: targetHost,
    port: options.port || 3050,
    database: targetDatabase,
    user: options.user || 'SYSDBA',
    password: options.password || 'masterkey',
    lowercase_keys: false,
    role: null,
    pageSize: 4096,
  };

  return new Promise((resolve, reject) => {
    Firebird.attach(dbOptions, (err, db) => {
      if (err) {
        return reject(new Error(`Erro ao conectar no banco Firebird: ${err.message}`));
      }

      // Tenta consultar metadados ou tabelas comuns do Softsystem / ERP Firebird
      const candidateQueries = [
        'SELECT * FROM PRODUTOS',
        'SELECT * FROM PRODUTO',
        'SELECT * FROM CADPROD',
        'SELECT * FROM ESTOQUE',
        'SELECT * FROM ITENS'
      ];

      // Busca dinâmica de tabelas se disponível
      const getTablesQuery = "SELECT RDB$RELATION_NAME FROM RDB$RELATIONS WHERE RDB$SYSTEM_FLAG = 0";
      
      db.query(getTablesQuery, (tablesErr, tablesResult) => {
        let queryToUse = options.onlyWebExport
          ? "SELECT p.CODPRODUTO, p.CODORIGINAL, p.DESCRICAO, p.PRECO, v.ESTOQUE FROM PRODUTOS p LEFT JOIN VIEW_PRODUTOS_ESTOQUE v ON p.CODPRODUTO = v.CODPRODUTO WHERE p.EXPORTWEB = 'T'"
          : "SELECT p.CODPRODUTO, p.CODORIGINAL, p.DESCRICAO, p.PRECO, v.ESTOQUE FROM PRODUTOS p LEFT JOIN VIEW_PRODUTOS_ESTOQUE v ON p.CODPRODUTO = v.CODPRODUTO";
        
        if (!tablesErr && Array.isArray(tablesResult)) {
          const tableNames = tablesResult.map(row => (row.RDB$RELATION_NAME || '').trim().toUpperCase());
          console.log('[Firebird] Tabelas encontradas no banco:', tableNames.length);

          if (tableNames.includes('VIEW_PRODUTOS_ESTOQUE') && tableNames.includes('PRODUTOS')) {
            queryToUse = options.onlyWebExport
              ? "SELECT p.CODPRODUTO, p.CODORIGINAL, p.DESCRICAO, p.PRECO, v.ESTOQUE FROM PRODUTOS p LEFT JOIN VIEW_PRODUTOS_ESTOQUE v ON p.CODPRODUTO = v.CODPRODUTO WHERE p.EXPORTWEB = 'T'"
              : "SELECT p.CODPRODUTO, p.CODORIGINAL, p.DESCRICAO, p.PRECO, v.ESTOQUE FROM PRODUTOS p LEFT JOIN VIEW_PRODUTOS_ESTOQUE v ON p.CODPRODUTO = v.CODPRODUTO";
          } else if (tableNames.includes('PRODUTOS')) {
            queryToUse = options.onlyWebExport
              ? "SELECT CODPRODUTO, CODORIGINAL, DESCRICAO, PRECO FROM PRODUTOS WHERE EXPORTWEB = 'T'"
              : "SELECT CODPRODUTO, CODORIGINAL, DESCRICAO, PRECO FROM PRODUTOS";
          } else {
            const matchedTable = tableNames.find(t => t.includes('PROD') || t.includes('ESTOQUE'));
            if (matchedTable) {
              queryToUse = `SELECT * FROM ${matchedTable}`;
            }
          }
        }

        console.log('[Firebird] Executando query:', queryToUse);

        db.query(queryToUse, (queryErr, result) => {
          db.detach();
          if (queryErr) {
            return reject(new Error(`Erro ao consultar tabela de produtos no Firebird: ${queryErr.message}`));
          }
          resolve(result || []);
        });
      });
    });
  });
}

/**
 * Helper seguro para conversão de números do Firebird / CSV
 */
function parseErpNumber(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  
  let str = String(val).trim();
  if (!str) return null;

  if (str.includes('.') && str.includes(',')) {
    // Ex: 1.250,50 -> 1250.50
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // Ex: 1250,50 -> 1250.50
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

/**
 * Normaliza e converte registros Firebird ou CSV/TXT em formato padronizado de produto:
 * { sku, price, stock, name }
 */
function normalizeErpRecords(records) {
  const normalized = [];

  for (const row of records) {
    // Dá prioridade absoluta ao Cód. Original (ex: 915972)
    let sku = row.CODORIGINAL || row.codoriginal || row.COD_ORIGINAL || row.CODPRODUTO || row.codproduto || row.CODIGO || row.SKU;
    if (sku) sku = String(sku).trim();
    if (!sku) continue;

    let price = null;
    let stock = null;
    let name = row.DESCRICAO || row.descricao || row.NOME || row.nome || null;
    if (name) name = String(name).trim();

    const keys = Object.keys(row);
    for (const key of keys) {
      const k = key.trim().toUpperCase();
      const val = row[key];
      if (val === null || val === undefined) continue;

      // Preço
      if (price === null && (k === 'PRECO' || k.includes('PRECO') || k.includes('VALOR') || k.includes('VLR') || k === 'PRICE')) {
        const parsedPrice = parseErpNumber(val);
        if (parsedPrice !== null && parsedPrice >= 0) {
          price = parseFloat(parsedPrice.toFixed(2));
        }
      }

      // Estoque
      if (stock === null && (k === 'ESTOQUE' || k.includes('ESTOQUE') || k.includes('QTD') || k.includes('SALDO') || k === 'STOCK')) {
        const parsedStock = parseErpNumber(val);
        if (parsedStock !== null) {
          let rounded = Math.round(parsedStock);
          if (rounded > 2147483647) rounded = 2147483647;
          if (rounded < 0) rounded = 0; // Se o estoque estiver negativo no ERP, exibe 0 no site por segurança
          stock = rounded;
        }
      }
    }

    normalized.push({
      sku,
      price: price !== null ? price : 0.0,
      stock: stock !== null ? stock : 0,
      name: name || undefined
    });
  }

  return normalized;
}

/**
 * Aplica os registros sincronizados do ERP no banco de dados SQLite do site
 */
async function applyErpProductsToDb(normalizedProducts, createIfMissing = false) {
  let updatedCount = 0;
  let createdCount = 0;
  let skippedCount = 0;
  const errors = [];

  // Pega uma seção padrão se for criar novos produtos
  let defaultSectionId = null;
  if (createIfMissing) {
    const firstSection = await prisma.section.findFirst({ where: { active: true } });
    if (firstSection) {
      defaultSectionId = firstSection.id;
    }
  }

  for (const item of normalizedProducts) {
    try {
      const { sku, price, stock, name } = item;
      if (!sku) continue;

      const existing = await prisma.product.findUnique({ where: { sku } });

      if (existing) {
        const updateData = {};
        if (price !== undefined) updateData.price = price;
        if (stock !== undefined) updateData.stock = stock;
        if (name && !existing.name) updateData.name = name;

        if (Object.keys(updateData).length > 0) {
          await prisma.product.update({
            where: { sku },
            data: updateData
          });
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else if (createIfMissing && defaultSectionId) {
        await prisma.product.create({
          data: {
            sku,
            name: name || `Produto ${sku}`,
            price: price || 0.0,
            stock: stock || 0,
            description: `<p>Produto cadastrado via sincronização ERP Softsystem (SKU: ${sku}).</p>`,
            specs: JSON.stringify([]),
            images: JSON.stringify([]),
            pdfs: JSON.stringify([]),
            videos: JSON.stringify([]),
            status: 'ACTIVE',
            sectionId: defaultSectionId
          }
        });
        createdCount++;
      } else {
        skippedCount++;
      }
    } catch (err) {
      errors.push(`Erro no SKU ${item.sku}: ${err.message}`);
    }
  }

  const logMsg = `Sincronização ERP Firebird realizada: ${updatedCount} atualizados, ${createdCount} criados, ${skippedCount} mantidos.`;
  console.log(`[ERP Firebird] ${logMsg}`);

  await prisma.syncLog.create({
    data: {
      status: errors.length > 0 ? 'WARNING' : 'SUCCESS',
      message: logMsg
    }
  });

  return {
    totalRecords: normalizedProducts.length,
    updatedCount,
    createdCount,
    skippedCount,
    errors
  };
}

module.exports = {
  restoreFbkToFdb,
  queryFirebirdDatabase,
  normalizeErpRecords,
  applyErpProductsToDb
};
