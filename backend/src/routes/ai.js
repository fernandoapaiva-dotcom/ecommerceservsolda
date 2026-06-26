const express = require('express');
const axios = require('axios');
const prisma = require('../models/db');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Gemini description generation route
router.post('/generate-description', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { productName } = req.body;
    if (!productName) {
      return res.status(400).json({ error: 'O nome do produto é obrigatório para gerar a descrição.' });
    }

    const config = await prisma.config.findUnique({ where: { id: 'singleton' } });
    const apiKey = config ? config.geminiApiKey : '';
    const geminiModel = config ? config.geminiModel : 'gemini-2.5-flash';

    if (!apiKey) {
      return res.status(400).json({ 
        error: 'Chave de API do Gemini não configurada no servidor. Por favor, adicione-a no painel administrativo.' 
      });
    }

    console.log(`Generating AI description for product using Gemini (${geminiModel}): ${productName}`);

    // Perform DuckDuckGo web search to gather real commercial details
    let searchResults = [];
    try {
      const searchResponse = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(productName + ' solda especificações técnicas')}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 5000
      });
      const html = searchResponse.data;
      const matches = [...html.matchAll(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)];
      searchResults = matches.slice(0, 5).map(m => m[1].replace(/<[^>]*>/g, '').trim());
    } catch (err) {
      console.error('Error fetching DuckDuckGo results for Gemini:', err.message);
    }

    const searchContext = searchResults.length > 0 
      ? `Resultados de pesquisa na internet para contexto:\n${searchResults.map((r, i) => `${i+1}. ${r}`).join('\n')}`
      : 'Sem resultados de pesquisa adicionais.';

    // Initialize Gemini Client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: geminiModel,
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Você é um assistente de e-commerce especializado em soldagem da ServoSolda.
Sua tarefa é analisar as informações sobre o produto de soldagem: "${productName}".
Use as seguintes informações coletadas da internet para contexto se forem relevantes:
${searchContext}

Gere os dados do produto estruturados em formato JSON válido contendo exatamente as chaves:
1. "description" (string HTML contendo descrição comercial rica com tags p, ul, li, strong, sem usar blocos de código adicionais).
2. "specs" (array de objetos com { "key": "nome da spec", "value": "valor da spec" }).
3. "tags" (array de strings de palavras-chave para SEO).
4. "metaDescription" (string de descrição de SEO de até 160 caracteres).

JSON esperado:
{
  "description": "...",
  "specs": [ { "key": "...", "value": "..." } ],
  "tags": [ "...", "..." ],
  "metaDescription": "..."
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Gemini raw response:', text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Resposta do Gemini não contém JSON estruturado válido.");
    }

    const parsedResult = JSON.parse(jsonMatch[0]);
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
