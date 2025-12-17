/**
 * Future Analysis Routes
 * Rota unificada para análise futura do mercado de cacau
 * Integra: Investing.com, Yahoo Finance, PricePro, IA Groq
 */
import express from 'express';
import Groq from 'groq-sdk';
import { fetchAllInvestingData } from '../services/investingService.js';
import { fetchMultiPeriodData } from '../services/yahooFinanceService.js';
import { generatePriceProSignals } from '../services/priceProService.js';
import { calculateMovementCertificate } from '../services/movementCertificateService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Inicializar Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const FUTURE_ANALYSIS_CACHE_TTL_MS = (() => {
  const parsed = Number.parseInt(
    process.env.FUTURE_ANALYSIS_CACHE_TTL_MS || '60000',
    10
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60000;
})();

const futureAnalysisCache = {
  value: null,
  createdAtMs: 0
};

let futureAnalysisInFlight = null;

function isCacheValid(nowMs) {
  if (!futureAnalysisCache.value) return false;
  const ageMs = nowMs - futureAnalysisCache.createdAtMs;
  return ageMs >= 0 && ageMs < FUTURE_ANALYSIS_CACHE_TTL_MS;
}

async function buildFutureAnalysisResponse() {
  logger.info('📊 Iniciando análise futura completa...');

  // Buscar dados em paralelo
  const [investingData, yahooData] = await Promise.all([
    fetchAllInvestingData().catch(err => {
      logger.warn(`Erro ao buscar Investing.com: ${err.message}`);
      return null;
    }),
    fetchMultiPeriodData().catch(err => {
      logger.warn(`Erro ao buscar Yahoo Finance: ${err.message}`);
      return null;
    })
  ]);

  // Gerar sinais PricePro usando dados do Yahoo
  let priceProSignals = null;
  if (yahooData?.periods?.['30d']?.data?.length > 0) {
    const historicalData = yahooData.periods['30d'].data.map(p => ({
      close: p.close,
      high: p.high,
      low: p.low,
      open: p.open
    }));
    priceProSignals = generatePriceProSignals(historicalData);
  }

  // Preparar contexto para IA
  const contextData = {
    investing: investingData,
    yahoo: yahooData?.periods,
    pricePro: priceProSignals
  };

  // Chamar IA para análise e projeções
  const aiAnalysis = await generateAIAnalysis(contextData);

  const movementCertificate = calculateMovementCertificate({
    changePercent7d: yahooData?.periods?.['7d']?.changePercent,
    volatility7d: yahooData?.periods?.['7d']?.volatility,
    zigzagTrend: priceProSignals?.zigzag?.trend
  });

  // Montar resposta
  const response = {
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      // Dados do Investing.com
      currentPrice: investingData?.price || yahooData?.currentPrice,
      priceChange: investingData?.price?.change || yahooData?.periods?.['24h']?.changePercent,
      sentiment: investingData?.technical?.sentiment || 'neutro',

      // Sinal PricePro
      signal: {
        type: priceProSignals?.signal || 'AGUARDAR',
        strength: priceProSignals?.strength || 0,
        reasoning: priceProSignals?.reasoning || [],
        stopLoss: priceProSignals?.stopLoss,
        takeProfit: priceProSignals?.takeProfit,
        riskReward: priceProSignals?.riskReward
      },

      // Indicadores Técnicos
      technical: {
        rsi: priceProSignals?.indicators?.rsi || investingData?.technical?.rsi,
        cmo: priceProSignals?.indicators?.cmo,
        sma20: priceProSignals?.indicators?.sma20,
        sma50: priceProSignals?.indicators?.sma50,
        ema9: priceProSignals?.indicators?.ema9,
        ema21: priceProSignals?.indicators?.ema21,
        bollinger: priceProSignals?.bollinger,
        oscillators: investingData?.technical?.oscillators,
        movingAverages: investingData?.technical?.movingAverages
      },

      // Níveis de Suporte e Resistência
      levels: {
        support: priceProSignals?.levels?.support,
        resistance: priceProSignals?.levels?.resistance,
        pivot: priceProSignals?.levels?.pivot,
        fibonacci: priceProSignals?.fibonacci
      },

      // ZigZag Pattern
      zigzag: priceProSignals?.zigzag,

      // ✅ Certificado de Movimento
      movementCertificate,

      // Histórico Yahoo Finance
      history: {
        '24h': yahooData?.periods?.['24h'],
        '7d': yahooData?.periods?.['7d'],
        '30d': yahooData?.periods?.['30d']
      },

      // Notícias Investing.com
      news: investingData?.news?.articles?.slice(0, 5) || [],

      // Análise IA
      ai: aiAnalysis,

      // Fontes de dados
      sources: {
        investing: !!investingData,
        yahoo: !!yahooData,
        pricePro: !!priceProSignals
      }
    }
  };

  logger.info('✅ Análise futura concluída com sucesso');
  return response;
}

/**
 * GET /api/analysis/future
 * Retorna análise futura completa do mercado de cacau
 */
router.get('/future', async (req, res) => {
  try {
    const nowMs = Date.now();

    if (isCacheValid(nowMs)) {
      return res.json(futureAnalysisCache.value);
    }

    if (futureAnalysisInFlight) {
      const response = await futureAnalysisInFlight;
      return res.json(response);
    }

    futureAnalysisInFlight = (async () => {
      const response = await buildFutureAnalysisResponse();
      futureAnalysisCache.value = response;
      futureAnalysisCache.createdAtMs = Date.now();
      return response;
    })();

    try {
      const response = await futureAnalysisInFlight;
      res.json(response);
    } finally {
      futureAnalysisInFlight = null;
    }
    
  } catch (error) {
    logger.error(`❌ Erro na análise futura: ${error.message}`);

    // Se houver cache (mesmo expirado), devolve uma resposta para evitar "tela preta" em caso de instabilidade externa
    if (futureAnalysisCache.value) {
      logger.warn('⚠️ Falha ao recalcular análise futura; retornando cache anterior');
      return res.json(futureAnalysisCache.value);
    }

    res.status(500).json({
      success: false,
      error: 'Erro ao gerar análise futura',
      message: error.message
    });
  }
});

/**
 * Gera análise com IA usando Groq
 */
async function generateAIAnalysis(contextData) {
  try {
    const { investing, yahoo, pricePro } = contextData;
    
    // Montar prompt com dados coletados
    const dataContext = `
DADOS ATUAIS DO MERCADO DE CACAU:

1. PREÇO ATUAL:
${investing?.price ? `- Preço: $${investing.price.value}` : ''}
${investing?.price?.change ? `- Variação: ${investing.price.change}` : ''}
${yahoo?.['24h']?.currentPrice ? `- Yahoo: $${yahoo['24h'].currentPrice.toFixed(2)}` : ''}

2. INDICADORES TÉCNICOS:
${pricePro?.indicators ? `
- RSI: ${pricePro.indicators.rsi}
- CMO: ${pricePro.indicators.cmo}
- SMA20: ${pricePro.indicators.sma20}
- SMA50: ${pricePro.indicators.sma50}
- EMA9: ${pricePro.indicators.ema9}
- EMA21: ${pricePro.indicators.ema21}
` : ''}
${investing?.technical?.sentiment ? `- Sentimento Investing: ${investing.technical.sentiment}` : ''}
${investing?.technical?.oscillators ? `- Osciladores: ${investing.technical.oscillators}` : ''}
${investing?.technical?.movingAverages ? `- Médias Móveis: ${investing.technical.movingAverages}` : ''}

3. SINAL PRICEPRO:
${pricePro?.signal ? `
- Sinal: ${pricePro.signal}
- Força: ${pricePro.strength}%
- Stop Loss: $${pricePro.stopLoss}
- Take Profit: $${pricePro.takeProfit}
- Risk/Reward: ${pricePro.riskReward}
` : 'Não disponível'}

4. NÍVEIS DE SUPORTE/RESISTÊNCIA:
${pricePro?.levels ? `
- Suporte: $${pricePro.levels.support}
- Resistência: $${pricePro.levels.resistance}
- Pivot: $${pricePro.levels.pivot}
` : ''}
${pricePro?.fibonacci ? `
- Fibonacci 23.6%: $${pricePro.fibonacci['23.6%']}
- Fibonacci 38.2%: $${pricePro.fibonacci['38.2%']}
- Fibonacci 50.0%: $${pricePro.fibonacci['50.0%']}
- Fibonacci 61.8%: $${pricePro.fibonacci['61.8%']}
` : ''}

5. HISTÓRICO RECENTE:
${yahoo?.['24h']?.changePercent !== undefined ? `
- 24h: Var ${yahoo['24h'].changePercent}%, Vol ${((yahoo['24h'].volatility || 0) * 100).toFixed(2)}%
` : ''}
${yahoo?.['7d']?.changePercent !== undefined ? `
- 7 dias: Var ${yahoo['7d'].changePercent}%, Vol ${((yahoo['7d'].volatility || 0) * 100).toFixed(2)}%
` : ''}
${yahoo?.['30d']?.changePercent !== undefined ? `
- 30 dias: Var ${yahoo['30d'].changePercent}%, Vol ${((yahoo['30d'].volatility || 0) * 100).toFixed(2)}%
` : ''}

6. NOTÍCIAS RECENTES:
${investing?.news?.articles?.slice(0, 3).map(n => `- ${n.title}`).join('\n') || 'Não disponível'}
`;

    const prompt = `Você é o módulo de Análise Futura do meu SaaS. Analise EXCLUSIVAMENTE o mercado de CACAU.

${dataContext}

Com base nesses dados, gere uma análise detalhada e projeções. Responda APENAS com um JSON válido (sem markdown):

{
  "trendNow": "ALTA ou BAIXA ou LATERAL",
  "signal": "LONG ou SHORT ou NEUTRO",
  "strength": "FORTE ou MODERADO ou FRACO",
  "sl": "valor numérico do stop loss recomendado",
  "tp": "valor numérico do take profit recomendado",
  "forecast": {
    "24h": "Descrição da projeção para 24 horas",
    "1week": "Descrição da projeção para 1 semana",
    "1month": "Descrição da projeção para 1 mês"
  },
  "levels": {
    "support": "valor do suporte principal",
    "resistance": "valor da resistência principal"
  },
  "technical": {
    "rsi": "interpretação do RSI",
    "cmo": "interpretação do CMO",
    "oscillatorsSummary": "resumo dos osciladores",
    "movingAveragesSummary": "resumo das médias móveis"
  },
  "newsImpact": "análise do impacto das notícias no mercado",
  "summary": "Resumo operacional completo em 2-3 frases com recomendação clara de entrada/saída"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'Você é um analista de commodities especializado em cacau. Responda apenas com JSON válido, sem markdown ou explicações adicionais.' 
        },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 1500
    });

    const responseText = completion.choices[0]?.message?.content?.trim();
    
    // Tentar parsear JSON
    try {
      // Remover possíveis marcadores de código
      let cleanJson = responseText;
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }
      
      return JSON.parse(cleanJson);
    } catch (parseError) {
      logger.warn(`Erro ao parsear resposta da IA: ${parseError.message}`);
      return {
        trendNow: pricePro?.signal?.includes('LONG') ? 'ALTA' : pricePro?.signal?.includes('SHORT') ? 'BAIXA' : 'LATERAL',
        signal: pricePro?.signal || 'NEUTRO',
        strength: pricePro?.strength > 70 ? 'FORTE' : pricePro?.strength > 50 ? 'MODERADO' : 'FRACO',
        sl: pricePro?.stopLoss || 'N/A',
        tp: pricePro?.takeProfit || 'N/A',
        forecast: {
          '24h': 'Análise em processamento',
          '1week': 'Análise em processamento',
          '1month': 'Análise em processamento'
        },
        levels: pricePro?.levels || {},
        technical: {
          rsi: `RSI em ${pricePro?.indicators?.rsi || 'N/A'}`,
          cmo: `CMO em ${pricePro?.indicators?.cmo || 'N/A'}`,
          oscillatorsSummary: investing?.technical?.oscillators || 'N/A',
          movingAveragesSummary: investing?.technical?.movingAverages || 'N/A'
        },
        newsImpact: 'Impacto neutro baseado nas notícias recentes',
        summary: `Sinal ${pricePro?.signal || 'NEUTRO'} com força de ${pricePro?.strength || 0}%. ${pricePro?.reasoning?.join('. ') || ''}`,
        rawResponse: responseText
      };
    }
    
  } catch (error) {
    logger.error(`Erro na análise IA: ${error.message}`);
    return {
      error: true,
      message: 'Erro ao gerar análise com IA',
      detail: error.message
    };
  }
}

export default router;
