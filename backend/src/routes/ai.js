const express = require('express');
const axios = require('axios');
const prisma = require('../models/db');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Helper to perform web searches and parse direct URLs from DuckDuckGo
async function searchWeb(query) {
  try {
    const searchResponse = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000
    });
    const html = searchResponse.data;
    
    // Extract snippets
    const snippetMatches = [...html.matchAll(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)];
    const snippets = snippetMatches.slice(0, 8).map(m => m[1].replace(/<[^>]*>/g, '').trim());

    // Extract links, resolving DuckDuckGo's redirect proxy (uddg parameter)
    const linkMatches = [...html.matchAll(/href="([^"]+)"/g)];
    const links = [];
    for (const match of linkMatches) {
      let href = match[1];
      if (href.includes('uddg=')) {
        const udMatch = href.match(/uddg=([^&]+)/);
        if (udMatch && udMatch[1]) {
          const decoded = decodeURIComponent(udMatch[1]);
          if (!links.includes(decoded) && decoded.startsWith('http')) {
            links.push(decoded);
          }
        }
      }
    }

    return { snippets, links: links.slice(0, 10) };
  } catch (err) {
    console.error('Search failed for:', query, err.message);
    return { snippets: [], links: [] };
  }
}

// Download image and overlay store logo as watermark
async function downloadAndWatermark(imageUrl, logoRelativePath) {
  try {
    const urlObj = new URL(imageUrl);
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer', 
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': `${urlObj.protocol}//${urlObj.hostname}/`
      }
    });

    const productBuffer = Buffer.from(response.data);
    if (!productBuffer || productBuffer.length < 1000) return null;

    const outputDirectory = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    try {
      const productImg = await Jimp.read(productBuffer);
      if (logoRelativePath) {
        const logoAbsolutePath = path.join(__dirname, '..', '..', logoRelativePath);
        if (fs.existsSync(logoAbsolutePath)) {
          const logoImg = await Jimp.read(logoAbsolutePath);
          const targetWidth = Math.floor(productImg.getWidth() * 0.18);
          logoImg.resize(targetWidth, Jimp.AUTO);
          const x = productImg.getWidth() - logoImg.getWidth() - 15;
          const y = productImg.getHeight() - logoImg.getHeight() - 15;
          productImg.composite(logoImg, x, y, {
            mode: Jimp.BLEND_SOURCE_OVER,
            opacitySource: 0.65
          });
        }
      }
      const filename = `watermarked-${Date.now()}-${Math.floor(Math.random() * 1000000)}.jpg`;
      const outputAbsolutePath = path.join(outputDirectory, filename);
      await productImg.quality(85).writeAsync(outputAbsolutePath);
      return `/uploads/${filename}`;
    } catch (jimpErr) {
      // Direct raw binary fallback for WebP or unhandled formats so images always save locally
      const ext = imageUrl.includes('.webp') ? 'webp' : 'jpg';
      const filename = `product-${Date.now()}-${Math.floor(Math.random() * 1000000)}.${ext}`;
      const outputAbsolutePath = path.join(outputDirectory, filename);
      fs.writeFileSync(outputAbsolutePath, productBuffer);
      console.log(`Saved raw image to /uploads/${filename}`);
      return `/uploads/${filename}`;
    }

  } catch (err) {
    console.error('Failed to download image:', imageUrl, err.message);
    return null;
  }
}

// Bing Image HD Crawler for real high-res e-commerce product photos
async function crawlHdProductImages(productName, logoRelativePath) {
  console.log(`[HD Image Agent] Buscando fotos HD de e-commerce para: ${productName}`);
  const hdImages = [];
  try {
    const res = await axios.get(`https://www.bing.com/images/async?q=${encodeURIComponent(productName + ' foto produto')}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 8000
    });

    const matches = [...res.data.matchAll(/murl&quot;:&quot;(https?:[^&]+)&quot;/gi)].map(m => m[1]);
    const filteredCandidates = matches.filter(url => 
      !url.includes('youtube.com') && !url.includes('ytimg.com') && 
      !url.includes('logo') && !url.includes('favicon') && !url.includes('icon')
    );

    for (const candUrl of filteredCandidates) {
      if (hdImages.length >= 4) break;
      const localPath = await downloadAndWatermark(candUrl, logoRelativePath);
      if (localPath) {
        hdImages.push(`http://localhost:5000${localPath}`);
      }
    }
  } catch (err) {
    console.warn(`[HD Image Agent Warning] Bing search failed: ${err.message}`);
  }
  return hdImages;
}

// Download PDF locally to local server uploads folder
async function downloadPdfLocally(pdfUrl, defaultTitle) {
  if (!pdfUrl || !pdfUrl.startsWith('http')) return null;
  try {
    const urlObj = new URL(pdfUrl);
    console.log(`[PDF Agent] Baixando manual em PDF para o servidor local: ${pdfUrl}`);
    const response = await axios.get(pdfUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,application/pdf,*/*;q=0.8',
        'Referer': `${urlObj.protocol}//${urlObj.hostname}/`
      }
    });

    if (response.status === 200 && response.data.length > 2000) {
      const filename = `manual-${Date.now()}-${Math.floor(Math.random() * 10000)}.pdf`;
      const outputDirectory = path.join(__dirname, '..', '..', 'uploads');
      if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
      }
      const outputAbsolutePath = path.join(outputDirectory, filename);
      fs.writeFileSync(outputAbsolutePath, Buffer.from(response.data));
      console.log(`[PDF Agent] PDF salvo com SUCESSO em /uploads/${filename}`);
      return {
        title: defaultTitle || 'Manual Técnico de Instruções (PDF)',
        url: `/uploads/${filename}`
      };
    }
  } catch (err) {
    console.warn(`[PDF Agent Warning] Download local do PDF falhou para ${pdfUrl}: ${err.message}`);
  }
  return {
    title: defaultTitle || 'Manual Técnico de Instruções (PDF)',
    url: pdfUrl
  };
}

// Resolve Google Search redirects to real destination URLs
async function resolveRedirectUrl(url) {
  if (!url) return '';
  if (url.includes('grounding-api-redirect')) {
    try {
      const res = await axios.get(url, { maxRedirects: 5, timeout: 5000 });
      const finalUrl = res.request.res.responseUrl || url;
      console.log(`Resolved redirect URL: ${url} -> ${finalUrl}`);
      return finalUrl;
    } catch (err) {
      console.warn(`Failed to resolve redirect URL ${url}: ${err.message}`);
    }
  }
  return url;
}

// Validate YouTube URL with oEmbed and fallback YouTube search
async function validateYoutubeVideo(url, defaultTitle, productName = '') {
  if (url && !url.includes('dQw4w9WgXcQ')) {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
    if (match) {
      const id = match[1];
      try {
        const res = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, { timeout: 4000 });
        if (res.status === 200 && res.data && res.data.title) {
          const titleLower = res.data.title.toLowerCase();
          if (!titleLower.includes('music video') && !titleLower.includes('remix') && !titleLower.includes('song')) {
            return { title: res.data.title || defaultTitle, url: `https://www.youtube.com/watch?v=${id}` };
          }
        }
      } catch (err) {
        console.warn(`YouTube oEmbed verification failed for ID ${id}: ${err.message}`);
      }
    }
  }

  // Fallback: Perform YouTube search for real public embeddable video
  if (productName) {
    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(productName)}`;
      const res = await axios.get(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 5000
      });
      const matches = [...res.data.matchAll(/"videoId":"([^"]{11})"/g)].map(m => m[1]);
      const uniqueIds = [...new Set(matches)];
      for (const vidId of uniqueIds.slice(0, 5)) {
        try {
          const oRes = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vidId}&format=json`, { timeout: 3000 });
          if (oRes.status === 200 && oRes.data && oRes.data.title) {
            return { title: oRes.data.title, url: `https://www.youtube.com/watch?v=${vidId}` };
          }
        } catch (e) {}
      }
    } catch (err) {
      console.warn(`YouTube fallback search failed: ${err.message}`);
    }
  }

  return null;
}

// Validate PDF URL with a fast GET request and reject doc viewers
async function validatePdfUrl(url, title) {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();
  // Reject Scribd, Docero or non-direct PDF viewer pages
  if (lowerUrl.includes('scribd.com') || lowerUrl.includes('docero.com')) return null;

  try {
    const res = await axios.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      },
      timeout: 5000 
    });
    if (res.status >= 200 && res.status < 400) {
      return { title: title || 'Manual Técnico de Instruções (PDF)', url };
    }
  } catch (err) {
    if (err.response && (err.response.status === 403 || err.response.status === 406)) {
      return { title: title || 'Manual Técnico de Instruções (PDF)', url }; // treat as valid if protected by WAF
    }
  }
  if (lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?')) {
    return { title: title || 'Manual Técnico de Instruções (PDF)', url };
  }
  return null;
}

// Core reusable helper to enrich a product via Gemini with Google Search Grounding
async function processProductEnrichment(productName, productUrl = '') {
  const config = await prisma.config.findUnique({ where: { id: 'singleton' } });
  const apiKey = config ? config.geminiApiKey : '';
  const geminiModel = config ? config.geminiModel : 'gemini-2.5-flash';
  const logoRelativePath = config ? config.logo : null;

  if (!apiKey) {
    throw new Error('Chave de API do Gemini não configurada no servidor. Por favor, adicione-a no painel administrativo.');
  }

  // Fetch existing active categories to pass to Gemini
  const existingSections = await prisma.section.findMany({
    where: { active: true },
    include: { parent: true }
  });

  const categoriesList = existingSections.map(s => ({
    id: s.id,
    name: s.parent ? `${s.name} (Subcategoria de ${s.parent.name})` : s.name
  }));

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Define a model with Google Search Grounding enabled to bypass WAF blocks and fetch veridic web results autonomously
  const model = genAI.getGenerativeModel({ 
    model: geminiModel,
    tools: [{ googleSearch: {} }]
  });

  const prompt = `Você é um assistente especialista de e-commerce da ServSolda.
Sua tarefa é analisar as informações sobre o produto de soldagem/corte: "${productName}".

Você DEVE utilizar a ferramenta de busca integrada (Google Search) para obter informações reais e verídicas sobre o produto na internet.
Pesquise especificamente nos sites do fabricante correspondente (como boxersoldas.com.br, esab.com.br, vonder.com.br, balmer.com.br, etc.) e em revendedores autorizados de ferramentas (como dutramaquinas.com.br, casadosoldador.com.br, etc.).

Obtenha de forma autônoma:
1. O fabricante exato e a descrição comercial detalhada e atrativa do produto em HTML com parágrafos e benefícios.
2. A tabela de especificações técnicas 100% verídicas do equipamento (processo, amperagem, ciclo de trabalho, espessura de corte, tensão de alimentação, peso, etc.).
3. O termo de garantia oficial fornecido pelo fabricante (ex: "1 ano de garantia de fábrica" ou "3 anos de garantia nacional").
4. De 2 a 5 URLs diretas de imagens REAIS do equipamento físico (devem ser URLs diretas terminando com .jpg, .jpeg, .png ou .webp salvas em sites do fabricante ou distribuidores conhecidos). NUNCA retorne fotos de bancos de imagem genéricos ou decoração!
5. Para PDFs: A URL direta do arquivo de manual de instruções ou ficha técnica oficial em PDF no site do fabricante (ex: se for Boxer, pesquise em boxersoldas.com.br; a URL DEVE ser direta de um arquivo .pdf, ex: https://boxersoldas.com.br/wp-content/uploads/2025/12/MANUAL-HARDCUT-52.pdf). NUNCA retorne links do Scribd ou bibliotecas pagas!
6. Para Vídeos: A URL real de um vídeo do YouTube correspondente ao modelo exato do produto (review técnico, teste de corte ou demonstração da marca). NUNCA use URLs genéricas de teste (como dQw4w9WgXcQ) ou clipes de música!
7. Escolha a categoria correta para este produto a partir desta lista de categorias existentes no sistema: ${JSON.stringify(categoriesList)}. Você DEVE retornar o ID correspondente da categoria no campo "sectionId".

Retorne os dados estruturados estritamente em um bloco de código JSON válido delimitado por \`\`\`json e \`\`\` com as seguintes chaves:
1. "description" (string HTML contendo a descrição comercial rica em parágrafos e lista de benefícios com tags p, ul, li, strong).
2. "specs" (array de objetos com { "key": "nome do parâmetro", "value": "valor real" }).
3. "tags" (array de strings de palavras-chave para SEO).
4. "metaDescription" (string de descrição de SEO de até 160 caracteres).
5. "sectionId" (string contendo a ID da categoria selecionada da lista fornecida).
6. "recommendedImages" (array de strings contendo de 2 a 5 URLs diretas de imagens reais do produto físico).
7. "recommendedPdfs" (array de objetos { "title": "título do PDF", "url": "URL direta do arquivo .pdf no site do fabricante" }).
8. "recommendedVideos" (array de objetos { "title": "título do vídeo", "url": "URL real do vídeo no YouTube" }).
9. "warranty" (string contendo o termo de garantia exato do fabricante).

JSON esperado:
{
  "description": "...",
  "specs": [ { "key": "...", "value": "..." } ],
  "tags": [ "...", "..." ],
  "metaDescription": "...",
  "sectionId": "ID_da_categoria_selecionada",
  "recommendedImages": [ "url_imagem_real_1", "url_imagem_real_2" ],
  "recommendedPdfs": [ { "title": "...", "url": "..." } ],
  "recommendedVideos": [ { "title": "...", "url": "..." } ],
  "warranty": "..."
}`;

  console.log(`Sending search-grounded request to Gemini for product: ${productName}`);
  let text = '';
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    text = response.text();
  } catch (apiErr) {
    console.warn(`Gemini primary model failed: ${apiErr.message}. Attempting retry with gemini-1.5-flash with search tool...`);
    try {
      const fallbackModel = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        tools: [{ googleSearch: {} }]
      });
      const result = await fallbackModel.generateContent(prompt);
      const response = await result.response;
      text = response.text();
    } catch (fallbackErr) {
      console.warn(`Gemini fallback model with search failed: ${fallbackErr.message}. Retrying WITHOUT Google Search tool...`);
      try {
        const noSearchModel = genAI.getGenerativeModel({ 
          model: geminiModel
        });
        const result = await noSearchModel.generateContent(prompt + "\nImportante: Como o serviço de busca externa está indisponível, responda usando apenas o seu conhecimento prévio verídico sobre o produto.");
        const response = await result.response;
        text = response.text();
      } catch (noSearchErr) {
        console.error(`All Gemini model attempts failed: ${noSearchErr.message}`);
        throw new Error(`O serviço da IA do Gemini está temporariamente sobrecarregado (Erro 503). Por favor, tente novamente em alguns instantes.`);
      }
    }
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Resposta do Gemini não contém JSON estruturado válido.");
  }

  const parsedResult = JSON.parse(jsonMatch[0]);

  // Verify that the chosen sectionId actually exists in the database
  let recommendedSectionId = undefined;
  if (parsedResult.sectionId) {
    const sectionExists = await prisma.section.findUnique({
      where: { id: parsedResult.sectionId }
    });
    if (sectionExists) {
      recommendedSectionId = parsedResult.sectionId;
    }
  }
  parsedResult.sectionId = recommendedSectionId;

  // Deduce manufacturer fallback pages for this brand
  const nameLower = productName.toLowerCase();
  let brandManualFallback = 'https://www.google.com/search?q=' + encodeURIComponent(`manual ${productName} filetype:pdf`);
  let brandVideoFallback = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(productName);
  
  if (nameLower.includes('boxer') || nameLower.includes('hardcut')) {
    brandManualFallback = 'https://boxersoldas.com.br/wp-content/uploads/2025/12/MANUAL-HARDCUT-52.pdf';
    brandVideoFallback = 'https://www.youtube.com/results?search_query=' + encodeURIComponent('Boxer ' + productName);
  } else if (nameLower.includes('esab') || nameLower.includes('rogue') || nameLower.includes('lhn')) {
    brandManualFallback = 'https://manuals.esab.com/';
    brandVideoFallback = 'https://www.youtube.com/watch?v=K4eMsEPT1-A';
  } else if (nameLower.includes('vonder')) {
    brandManualFallback = 'https://www.vonder.com.br/manuais';
    brandVideoFallback = 'https://www.youtube.com/user/vonderferramentas';
  } else if (nameLower.includes('balmer')) {
    brandManualFallback = 'http://www.balmer.com.br/manuais/';
    brandVideoFallback = 'https://www.youtube.com/channel/UCf1o6m5YVvO5lBskq6C1Y_A';
  }

  // Resolve any Google search redirects in the recommended lists first
  if (parsedResult.recommendedImages && Array.isArray(parsedResult.recommendedImages)) {
    for (let i = 0; i < parsedResult.recommendedImages.length; i++) {
      parsedResult.recommendedImages[i] = await resolveRedirectUrl(parsedResult.recommendedImages[i]);
    }
  }
  if (parsedResult.recommendedPdfs && Array.isArray(parsedResult.recommendedPdfs)) {
    for (let i = 0; i < parsedResult.recommendedPdfs.length; i++) {
      if (parsedResult.recommendedPdfs[i].url) {
        parsedResult.recommendedPdfs[i].url = await resolveRedirectUrl(parsedResult.recommendedPdfs[i].url);
      }
    }
  }
  if (parsedResult.recommendedVideos && Array.isArray(parsedResult.recommendedVideos)) {
    for (let i = 0; i < parsedResult.recommendedVideos.length; i++) {
      if (parsedResult.recommendedVideos[i].url) {
        parsedResult.recommendedVideos[i].url = await resolveRedirectUrl(parsedResult.recommendedVideos[i].url);
      }
    }
  }

  // Process images: download, apply store watermark, and save locally
  const watermarkedImages = [];
  if (parsedResult.recommendedImages && Array.isArray(parsedResult.recommendedImages)) {
    for (const imgUrl of parsedResult.recommendedImages) {
      if (imgUrl && imgUrl.startsWith('http') && !imgUrl.includes('youtube.com') && !imgUrl.includes('ytimg.com')) {
        console.log(`Downloading and applying watermark to image: ${imgUrl}`);
        const localPath = await downloadAndWatermark(imgUrl, logoRelativePath);
        if (localPath) {
          watermarkedImages.push(`http://localhost:5000${localPath}`);
        }
      }
    }
  }

  // Fallback: If AI returned few or broken images, use HD Bing Image Crawler
  if (watermarkedImages.length < 2) {
    console.log(`[Visual RAG] Executando crawler de imagens HD para garantir fotos em múltiplos ângulos...`);
    const hdImages = await crawlHdProductImages(productName, logoRelativePath);
    for (const img of hdImages) {
      if (!watermarkedImages.includes(img)) {
        watermarkedImages.push(img);
      }
    }
  }

  // Validate and download PDFs locally to server
  const validPdfs = [];
  if (parsedResult.recommendedPdfs && Array.isArray(parsedResult.recommendedPdfs)) {
    for (const pdfItem of parsedResult.recommendedPdfs) {
      const validated = await validatePdfUrl(pdfItem.url, pdfItem.title);
      if (validated) {
        const localPdf = await downloadPdfLocally(validated.url, validated.title);
        if (localPdf) validPdfs.push(localPdf);
      }
    }
  }
  if (validPdfs.length === 0) {
    const localPdfFallback = await downloadPdfLocally(brandManualFallback, `Manual Técnico de Instruções ${nameLower.includes('boxer') ? 'Boxer Soldas' : 'do Fabricante'} (PDF)`);
    validPdfs.push(localPdfFallback || {
      title: `Manual Técnico de Instruções ${nameLower.includes('boxer') ? 'Boxer Soldas' : 'do Fabricante'} (PDF)`,
      url: brandManualFallback
    });
  }

  // Validate and clean up YouTube videos
  const validVideos = [];
  if (parsedResult.recommendedVideos && Array.isArray(parsedResult.recommendedVideos)) {
    for (const vidItem of parsedResult.recommendedVideos) {
      const validated = await validateYoutubeVideo(vidItem.url, vidItem.title, productName);
      if (validated) {
        validVideos.push(validated);
      }
    }
  }
  if (validVideos.length === 0) {
    validVideos.push({
      title: `Vídeo de Apresentação e Testes - ${productName}`,
      url: brandVideoFallback
    });
  }

  parsedResult.images = watermarkedImages;
  parsedResult.pdfs = validPdfs;
  parsedResult.videos = validVideos;

  return parsedResult;
}

// Gemini description generation route (single product edit modal)
router.post('/generate-description', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let { productName, productUrl } = req.body;
    if (!productName) {
      return res.status(400).json({ error: 'O nome do produto é obrigatório para gerar a descrição.' });
    }

    const result = await processProductEnrichment(productName, productUrl);
    return res.json(result);

  } catch (error) {
    console.error('Erro na geração por IA (Gemini):', error.message);
    return res.status(500).json({ error: `Erro ao gerar descrição com Gemini: ${error.message}` });
  }
});

// POST /api/ai/batch-enrich - Processa enriquece vários produtos em lote
router.post('/batch-enrich', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    req.setTimeout(600000); // 10 minutos para lotes grandes
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'Forneça um array de IDs de produtos para enriquecer.' });
    }

    const results = {
      total: productIds.length,
      successCount: 0,
      failedCount: 0,
      details: []
    };

    for (const id of productIds) {
      try {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
          results.failedCount++;
          results.details.push({ id, status: 'error', error: 'Produto não encontrado' });
          continue;
        }

        console.log(`[Batch AI Enrich] Processando produto (${product.name})...`);
        const enriched = await processProductEnrichment(product.name, null);

        const updateData = {};
        if (enriched.description) updateData.description = enriched.description;
        if (enriched.specs) updateData.specs = JSON.stringify(enriched.specs);
        if (enriched.metaTitle) updateData.metaTitle = enriched.metaTitle;
        if (enriched.metaDescription) updateData.metaDesc = enriched.metaDescription;
        if (enriched.warranty) updateData.warranty = enriched.warranty;
        if (enriched.sectionId) updateData.sectionId = enriched.sectionId;
        if (enriched.images && enriched.images.length > 0) updateData.images = JSON.stringify(enriched.images);
        if (enriched.pdfs && enriched.pdfs.length > 0) updateData.pdfs = JSON.stringify(enriched.pdfs);
        if (enriched.videos && enriched.videos.length > 0) updateData.videos = JSON.stringify(enriched.videos);

        await prisma.product.update({
          where: { id },
          data: updateData
        });

        results.successCount++;
        results.details.push({ id, name: product.name, status: 'success' });

      } catch (itemErr) {
        console.error(`[Batch AI Enrich Error] Produto ID ${id}:`, itemErr.message);
        results.failedCount++;
        results.details.push({ id, status: 'error', error: itemErr.message });
      }
    }

    return res.json({
      message: `Enriquecimento por IA concluído: ${results.successCount} atualizados com sucesso, ${results.failedCount} falhas.`,
      results
    });

  } catch (error) {
    console.error('Erro no processamento em lote da IA:', error.message);
    return res.status(500).json({ error: `Erro no processamento em lote da IA: ${error.message}` });
  }
});

// POST /api/ai/generate-palette
router.post('/generate-palette', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { colors } = req.body;
    if (!colors || !Array.isArray(colors)) {
      return res.status(400).json({ error: 'Um array de cores hexadecimais é obrigatório.' });
    }

    const config = await prisma.config.findUnique({ where: { id: 'singleton' } });
    const apiKey = config ? config.geminiApiKey : '';
    const geminiModel = config ? config.geminiModel : 'gemini-2.5-flash';

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'Chave de API do Gemini não configurada no servidor. Por favor, adicione-a no painel administrativo.' 
      });
    }

    console.log(`Generating theme palette using Gemini (${geminiModel}) from hexes: ${colors.join(', ')}`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: geminiModel,
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Você é um especialista em design UX/UI e acessibilidade (WCAG AA). Sua tarefa é projetar uma paleta de cores harmoniosa e funcional para um e-commerce profissional de equipamentos industriais.
Dado o seguinte array de cores extraídas da logo de uma loja de soldagem: ${JSON.stringify(colors)}.
Gere uma paleta de tema completa. Você deve justificar a escolha de cada cor garantindo contraste de acessibilidade para textos legíveis.

Retorne um objeto JSON contendo exatamente os campos:
{
  "palette": {
    "primary": "cor hexadecimal principal para botões primários e destaque",
    "secondary": "cor hexadecimal secundária para cabeçalho e superfícies escuras",
    "accent": "cor hexadecimal de destaque para crachás e chamadas de ação",
    "background": "cor hexadecimal de fundo geral da página (tons claros ou cinza suave)",
    "surface": "cor hexadecimal para os cards brancos ou caixas",
    "text": "cor hexadecimal escura legível para textos principais",
    "textMuted": "cor hexadecimal cinza para textos secundários",
    "border": "cor hexadecimal para divisores e bordas"
  },
  "explanation": "Breve justificativa sobre a harmonia da paleta gerada."
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Resposta de cores do Gemini inválida.");
    }

    const parsedResult = JSON.parse(jsonMatch[0]);
    return res.json(parsedResult);

  } catch (error) {
    console.error('Erro na paleta por IA (Gemini):', error.message);
    // Fallback palette in case of API failure
    return res.json({
      palette: {
        primary: '#d97706',
        secondary: '#0f172a',
        accent: '#f59e0b',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#0f172a',
        textMuted: '#64748b',
        border: '#cbd5e1'
      },
      explanation: 'Paleta padrão industrial em tons de âmbar e ardósia aplicada devido a uma falha na conexão da API.'
    });
  }
});

module.exports = router;
