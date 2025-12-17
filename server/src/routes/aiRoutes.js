import express from 'express';
import classifier from '../services/classifierService.js';
import opinionService from '../services/opinionService.js';
import climateService from '../services/climateService.js';
import priceService from '../services/priceService.js';
import config from '../config/index.js';

const router = express.Router();

/* ============================================
   GET /api/ai/test - Testa conexão com Groq
   ============================================ */
router.get('/test', async (req, res) => {
  try {
    const result = await classifier.testConnection();

    res.json({
      success: result.success,
      data: {
        connected: result.success,
        model: config.groq.model,
        response: result.response,
        error: result.error
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   POST /api/ai/classify - Classifica texto
   ============================================ */
router.post('/classify', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Campo "title" obrigatório' });
    }

    const score = await classifier.classifyNews(title);
    const labels = ['não relevante', 'pouco relevante', 'relevante', 'muito relevante'];

    res.json({
      success: score !== null,
      data: {
        title,
        description,
        classification: {
          score,
          label: score !== null ? labels[score] : 'erro'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   POST /api/ai/classify-batch - Classifica múltiplos
   ============================================ */
router.post('/classify-batch', async (req, res) => {
  try {
    const { items, delay = 500 } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: '"items" deve ser array não vazio' });
    }

    if (items.length > 10) {
      return res.status(400).json({ success: false, error: 'Máximo 10 itens por requisição' });
    }

    const results = await classifier.classifyBatch(items, delay);

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   GET /api/ai/config - Configuração atual
   ============================================ */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      enabled: classifier.isEnabled,
      model: config.groq.model
    }
  });
});

/* ============================================
   POST /api/ai/impact - Análise de impacto no mercado
   ============================================ */
router.post('/impact', async (req, res) => {
  try {
    const { text, title, description } = req.body;

    // Aceita "text" ou "title + description"
    const analysisText = text || `${title || ''} ${description || ''}`.trim();

    if (!analysisText) {
      return res.status(400).json({ 
        success: false, 
        error: 'Forneça "text" ou "title" para análise' 
      });
    }

    const result = await opinionService.analyzeCocoaImpact(analysisText);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   POST /api/ai/summary - Resumo de mercado
   ============================================ */
router.post('/summary', async (req, res) => {
  try {
    const { headlines } = req.body;

    if (!headlines || !Array.isArray(headlines) || headlines.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: '"headlines" deve ser array não vazio' 
      });
    }

    if (headlines.length > 20) {
      return res.status(400).json({ 
        success: false, 
        error: 'Máximo 20 headlines por requisição' 
      });
    }

    const result = await opinionService.generateMarketSummary(headlines);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   POST /api/ai/advanced-analysis - Análise avançada completa
   ============================================ */
router.post('/advanced-analysis', async (req, res) => {
  try {
    const { title, content, includeClimate = true } = req.body;

    if (!title) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campo "title" obrigatório' 
      });
    }

    const result = await opinionService.generateAdvancedAnalysis(title, content, includeClimate);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   GET /api/ai/climate - Dados climáticos das regiões
   ============================================ */
router.get('/climate', async (req, res) => {
  try {
    const climateData = await climateService.fetchAllRegionsClimate();
    const risks = climateService.analyzeClimateRisks(climateData);

    res.json({
      success: true,
      data: {
        regions: climateData,
        riskAnalysis: risks,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   GET /api/ai/prices - Dados de preços regionais
   ============================================ */
router.get('/prices', (req, res) => {
  try {
    const prices = priceService.getRegionalPrices();
    const trend = priceService.analyzePriceTrend();

    res.json({
      success: true,
      data: {
        prices,
        trend,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   POST /api/ai/market-analysis - Análise de tendência de mercado
   ============================================ */
router.post('/market-analysis', async (req, res) => {
  try {
    const { headlines } = req.body;

    if (!headlines || !Array.isArray(headlines) || headlines.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: '"headlines" deve ser array não vazio' 
      });
    }

    // Construir contexto das notícias
    const newsContext = headlines.map((h, i) => 
      `${i+1}. ${h.title} (Relevância: ${h.score}/3, Impacto: ${h.impact})`
    ).join('\n');

    const prompt = `Analise estas notícias do mercado de cacau e preveja a tendência:

${newsContext}

Responda em JSON com esta estrutura exata:
{
  "trend": "alta" ou "queda" ou "estável",
  "confidence": número de 0 a 100,
  "summary": "resumo da análise em 1-2 frases",
  "factors": ["fator1", "fator2", "fator3"],
  "recommendation": "recomendação para traders em 1-2 frases"
}

Baseie sua análise em:
- Sentimento geral das notícias
- Impacto nos preços
- Fatores climáticos mencionados
- Questões de oferta/demanda`;

    const result = await opinionService.callGroq(prompt, 500);
    
    // Tentar parsear o JSON da resposta
    let analysis;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON não encontrado');
      }
    } catch (parseErr) {
      // Fallback: análise baseada em keywords
      const text = result.toLowerCase();
      analysis = {
        trend: text.includes('alta') ? 'alta' : text.includes('queda') ? 'queda' : 'estável',
        confidence: 65,
        summary: result.slice(0, 200),
        factors: ['Análise de sentimento das notícias'],
        recommendation: 'Acompanhe as próximas notícias para confirmação da tendência.'
      };
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Erro na análise de mercado:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   POST /api/ai/chat - Chat interativo sobre mercado
   ============================================ */
router.post('/chat', async (req, res) => {
  try {
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campo "question" obrigatório' 
      });
    }

    const prompt = `Você é um especialista em mercado de commodities, especificamente em cacau.
    
Contexto atual: ${context || 'Mercado de cacau brasileiro e global'}

Pergunta do usuário: ${question}

Responda de forma clara, direta e profissional em português brasileiro. 
Seja específico sobre preços, tendências e recomendações quando apropriado.
Limite sua resposta a 2-3 frases objetivas.`;

    const response = await opinionService.callGroq(prompt, 300);

    res.json({
      success: true,
      data: {
        response: response.trim(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro no chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
