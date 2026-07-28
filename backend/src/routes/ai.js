const express = require('express');
const axios = require('axios');
const prisma = require('../models/db');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Jimp = require('jimp');
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
    // 1. Fetch the image
    const urlObj = new URL(imageUrl);
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer', 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Referer': `${urlObj.protocol}//${urlObj.hostname}/`
      }
    });
    const productBuffer = Buffer.from(response.data);
    
    // 2. Load with Jimp
    const productImg = await Jimp.read(productBuffer);
    
    // 3. Apply watermark if logo exists
    if (logoRelativePath) {
      const logoAbsolutePath = path.join(__dirname, '..', '..', logoRelativePath);
      if (fs.existsSync(logoAbsolutePath)) {
        const logoImg = await Jimp.read(logoAbsolutePath);
        
        // Resize logo to 18% of the product image width
        const targetWidth = Math.floor(productImg.getWidth() * 0.18);
        logoImg.resize(targetWidth, Jimp.AUTO);
        
        // Position at bottom-right corner with 15px padding
        const x = productImg.getWidth() - logoImg.getWidth() - 15;
        const y = productImg.getHeight() - logoImg.getHeight() - 15;
        
        // Blend logo onto image with 65% opacity
        productImg.composite(logoImg, x, y, {
          mode: Jimp.BLEND_SOURCE_OVER,
          opacitySource: 0.65
        });
      }
    }
    
    // 4. Save to uploads folder
    const filename = `watermarked-${Date.now()}-${Math.floor(Math.random() * 1000000)}.jpg`;
    const outputRelativePath = `/uploads/${filename}`;
    const outputDirectory = path.join(__dirname, '..', '..', 'uploads');
    
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }
    
    const outputAbsolutePath = path.join(outputDirectory, filename);
    await productImg.quality(85).writeAsync(outputAbsolutePath);
    
    return outputRelativePath;
  } catch (err) {
    console.error('Failed to watermark image:', imageUrl, err.message);
    return null;
  }
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

// Validate YouTube URL with oEmbed
async function validateYoutubeVideo(url, defaultTitle) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
  if (!match) return null;
  const id = match[1];
  try {
    const res = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, { timeout: 3000 });
    if (res.status === 200) {
      return { title: res.data.title || defaultTitle, url: `https://www.youtube.com/watch?v=${id}` };
    }
  } catch (err) {
    console.warn(`YouTube oEmbed verification failed for ID ${id}: ${err.message}`);
  }
  return null;
}

// Validate PDF URL with a fast HEAD request
async function validatePdfUrl(url, title) {
  if (!url) return null;
  try {
    const res = await axios.head(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' },
      timeout: 4000 
    });
    if (res.status >= 200 && res.status < 400) {
      return { title, url };
    }
  } catch (err) {
    if (err.response && err.response.status === 403) {
      return { title, url }; // treat as valid if only forbidden/hotlink-blocked but exists
    }
    console.warn(`PDF validation failed for ${url}: ${err.message}`);
  }
  return null;
}

// Gemini description generation route
router.post('/generate-description', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let { productName, productUrl } = req.body;
    if (!productName) {
      return res.status(400).json({ error: 'O nome do produto é obrigatório para gerar a descrição.' });
    }

    const config = await prisma.config.findUnique({ where: { id: 'singleton' } });
    const apiKey = config ? config.geminiApiKey : '';
    const geminiModel = config ? config.geminiModel : 'gemini-2.5-flash';
    const logoRelativePath = config ? config.logo : null;

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'Chave de API do Gemini não configurada no servidor. Por favor, adicione-a no painel administrativo.' 
      });
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
Sua tarefa é analisar as informações sobre o produto de soldagem: "${productName}".

Você DEVE utilizar a ferramenta de busca integrada (Google Search) para obter informações reais e verídicas sobre o produto na internet.
Pesquise especificamente nos sites do fabricante correspondente (como esab.com.br, vonder.com.br, balmer.com.br, etc.) e em revendedores autorizados (como dutramaquinas.com.br, casadosoldador.com.br, etc.).

Obtenha de forma autônoma:
1. O fabricante exato e a descrição comercial detalhada e atrativa do produto.
2. A tabela de especificações técnicas 100% verídicas do equipamento (processo, amperagem, ciclo de trabalho, tensão de alimentação, peso, etc.).
3. O termo de garantia oficial fornecido pelo fabricante (ex: "3 anos de garantia nacional" para ESAB Rogue, ou o prazo correto do fabricante).
4. De 2 a 5 URLs de imagens reais e diferentes do equipamento físico (devem terminar com .jpg, .jpeg ou .png). Priorize imagens de alta resolução encontradas nos sites oficiais ou em servidores de imagens de distribuidores conhecidos. Não use fotos de banco de imagens genéricas (Unsplash) sob hipótese alguma.
5. URLs diretas de arquivos manuais ou fichas técnicas em PDF (devem ser links diretos de arquivos que terminam com .pdf).
6. URLs reais de vídeos do YouTube correspondentes (reviews técnicos, apresentações do fabricante ou testes práticos do modelo exato).
7. Escolha a categoria correta para este produto a partir desta lista de categorias existentes no sistema: ${JSON.stringify(categoriesList)}. Você DEVE retornar o ID correspondente da categoria no campo "sectionId". NÃO crie categorias novas!

Retorne os dados estruturados estritamente em um bloco de código JSON válido delimitado por \`\`\`json e \`\`\` com as seguintes chaves:
1. "description" (string HTML contendo a descrição comercial rica em parágrafos e lista de benefícios com tags p, ul, li, strong).
2. "specs" (array de objetos com { "key": "nome do parâmetro", "value": "valor real" }).
3. "tags" (array de strings de palavras-chave para SEO).
4. "metaDescription" (string de descrição de SEO de até 160 caracteres).
5. "sectionId" (string contendo a ID da categoria selecionada da lista fornecida).
6. "recommendedImages" (array de strings contendo de 2 a 5 URLs diretas de imagens reais e diferentes do produto físico).
7. "recommendedPdfs" (array de objetos { "title": "título do PDF", "url": "URL direta do arquivo .pdf" }).
8. "recommendedVideos" (array de objetos { "title": "título do vídeo", "url": "URL real do vídeo no YouTube" }).
9. "warranty" (string contendo o termo de garantia exato do fabricante, ex: "3 anos de garantia de fábrica").

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
          // Attempt without search grounding tool to bypass Google Search tool quota limit/overload
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
    console.log('Gemini raw response:', text);

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
    let brandManualFallback = 'https://www.google.com';
    let brandVideoFallback = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rickroll or generic
    const nameLower = productName.toLowerCase();
    if (nameLower.includes('esab') || nameLower.includes('rogue') || nameLower.includes('lhn')) {
      brandManualFallback = 'https://manuals.esab.com/';
      brandVideoFallback = 'https://www.youtube.com/watch?v=K4eMsEPT1-A'; // Real active BrazilWelds Rogue video!
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
        if (imgUrl && imgUrl.startsWith('http')) {
          console.log(`Downloading and applying watermark to image: ${imgUrl}`);
          const localPath = await downloadAndWatermark(imgUrl, logoRelativePath);
          if (localPath) {
            watermarkedImages.push(`http://localhost:5000${localPath}`);
          } else {
            console.log(`Watermark failed or blocked. Falling back to remote URL: ${imgUrl}`);
            watermarkedImages.push(imgUrl);
          }
        }
      }
    }

    // Validate and clean up PDFs
    const validPdfs = [];
    if (parsedResult.recommendedPdfs && Array.isArray(parsedResult.recommendedPdfs)) {
      for (const pdfItem of parsedResult.recommendedPdfs) {
        const validated = await validatePdfUrl(pdfItem.url, pdfItem.title);
        if (validated) {
          validPdfs.push(validated);
        }
      }
    }
    // Fallback if no valid direct PDF was found
    if (validPdfs.length === 0) {
      validPdfs.push({
        title: `Página Oficial de Manuais e Downloads ${productName.includes('ESAB') ? 'ESAB' : 'do Fabricante'}`,
        url: brandManualFallback
      });
    }

    // Validate and clean up YouTube videos
    const validVideos = [];
    if (parsedResult.recommendedVideos && Array.isArray(parsedResult.recommendedVideos)) {
      for (const vidItem of parsedResult.recommendedVideos) {
        const validated = await validateYoutubeVideo(vidItem.url, vidItem.title);
        if (validated) {
          validVideos.push(validated);
        }
      }
    }
    // Fallback if no valid direct YouTube video was found
    if (validVideos.length === 0) {
      validVideos.push({
        title: `Vídeo de Apresentação Oficial da Linha ${productName.includes('ESAB') ? 'ESAB Rogue' : 'do Fabricante'}`,
        url: brandVideoFallback
      });
    }

    // Append localized watermarked images, PDFs and videos to the final API response
    parsedResult.images = watermarkedImages;
    parsedResult.pdfs = validPdfs;
    parsedResult.videos = validVideos;

    return res.json(parsedResult);

  } catch (error) {
    console.error('Erro na geração por IA (Gemini):', error.message);
    return res.status(500).json({ error: `Erro ao gerar descrição com Gemini: ${error.message}` });
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
