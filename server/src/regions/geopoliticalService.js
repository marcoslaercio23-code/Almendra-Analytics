/**
 * 🌍 Geopolitical Service - Análise Regional do Cacau
 * Análise de riscos geopolíticos por região usando IA
 */

import Groq from 'groq-sdk';
import { getRegion, getAllRegions } from './regionList.js';
import { log } from './logger.js';
import News from '../models/News.js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Cache de análise geopolítica (válido por 6 horas)
let geoCache = {
  data: {},
  timestamp: {},
  TTL: 6 * 60 * 60 * 1000 // 6 horas
};

/**
 * Dados geopolíticos estáticos por região
 */
const geopoliticalData = {
  // Brasil
  ilheus: {
    baseRisk: 'baixo',
    factors: ['Estabilidade política regional', 'Infraestrutura portuária limitada'],
    exports: { main: 'São Paulo, Rio de Janeiro', international: 'EUA, Europa' },
    logisticsRisk: 'baixo',
    conflictRisk: 'muito baixo',
    tradeBarriers: 'baixo'
  },
  itabuna: {
    baseRisk: 'baixo',
    factors: ['Centro comercial estabelecido', 'Boa rede de compradores'],
    exports: { main: 'Ilhéus (porto)', international: 'Via Ilhéus' },
    logisticsRisk: 'baixo',
    conflictRisk: 'muito baixo',
    tradeBarriers: 'baixo'
  },
  bahia: {
    baseRisk: 'baixo',
    factors: ['Maior produtor nacional', 'Infraestrutura em desenvolvimento'],
    exports: { main: 'Nacional', international: 'EUA, Europa, Ásia' },
    logisticsRisk: 'baixo',
    conflictRisk: 'muito baixo',
    tradeBarriers: 'baixo'
  },
  para: {
    baseRisk: 'baixo',
    factors: ['Produção em expansão', 'Desafios logísticos na Amazônia'],
    exports: { main: 'Belém', international: 'EUA, Europa' },
    logisticsRisk: 'moderado',
    conflictRisk: 'muito baixo',
    tradeBarriers: 'baixo'
  },
  espirito_santo: {
    baseRisk: 'baixo',
    factors: ['Produção especializada (fino)', 'Boa infraestrutura portuária'],
    exports: { main: 'Vitória', international: 'Europa (chocolate premium)' },
    logisticsRisk: 'baixo',
    conflictRisk: 'muito baixo',
    tradeBarriers: 'baixo'
  },
  
  // África
  costa_do_marfim: {
    baseRisk: 'moderado',
    factors: [
      'Maior produtor mundial (45%)',
      'Histórico de instabilidade política',
      'Dependência de trabalho infantil (controverso)',
      'Eleições podem gerar tensões',
      'Influência francesa significativa'
    ],
    exports: { main: 'Abidjan, San Pedro', international: 'Europa, EUA, Ásia' },
    logisticsRisk: 'moderado',
    conflictRisk: 'moderado',
    tradeBarriers: 'baixo',
    sanctions: [],
    recentEvents: ['Reforma do setor cacaueiro', 'Pressão por sustentabilidade']
  },
  gana: {
    baseRisk: 'baixo',
    factors: [
      'Segundo maior produtor mundial',
      'COCOBOD regula mercado (estabilidade)',
      'Democracia estável',
      'Economia em crescimento'
    ],
    exports: { main: 'Tema, Takoradi', international: 'Europa, EUA' },
    logisticsRisk: 'baixo',
    conflictRisk: 'baixo',
    tradeBarriers: 'baixo',
    sanctions: [],
    recentEvents: ['Living Income Differential (LID)', 'Investimentos em processamento local']
  },
  nigeria: {
    baseRisk: 'alto',
    factors: [
      'Conflitos internos (Boko Haram, bandidos)',
      'Infraestrutura deficiente',
      'Corrupção sistêmica',
      'Volatilidade cambial',
      'Produção fragmentada'
    ],
    exports: { main: 'Lagos, Calabar', international: 'Europa' },
    logisticsRisk: 'alto',
    conflictRisk: 'alto',
    tradeBarriers: 'moderado',
    sanctions: [],
    recentEvents: ['Insegurança no norte', 'Desafios de energia elétrica']
  },
  camaroes: {
    baseRisk: 'moderado',
    factors: [
      'Conflito na região anglófona',
      'Tensões separatistas',
      'Infraestrutura limitada',
      'Produção concentrada no sudoeste'
    ],
    exports: { main: 'Douala', international: 'Europa' },
    logisticsRisk: 'moderado',
    conflictRisk: 'moderado',
    tradeBarriers: 'baixo',
    sanctions: [],
    recentEvents: ['Crise anglófona continua', 'Investimentos chineses']
  },
  
  // Ásia e Américas
  indonesia: {
    baseRisk: 'baixo',
    factors: [
      'Terceiro maior produtor',
      'Produção em Sulawesi',
      'Governo estável',
      'Desafios de qualidade do cacau'
    ],
    exports: { main: 'Makassar', international: 'Ásia, Europa' },
    logisticsRisk: 'baixo',
    conflictRisk: 'baixo',
    tradeBarriers: 'baixo',
    sanctions: [],
    recentEvents: ['Foco em processamento local', 'Competição com palma']
  },
  equador: {
    baseRisk: 'moderado',
    factors: [
      'Maior produtor de cacau fino',
      'Aumento da violência relacionada a drogas',
      'Instabilidade política recente',
      'Premium por qualidade (Nacional)'
    ],
    exports: { main: 'Guayaquil', international: 'Europa, EUA (chocolate premium)' },
    logisticsRisk: 'baixo',
    conflictRisk: 'moderado',
    tradeBarriers: 'baixo',
    sanctions: [],
    recentEvents: ['Crise de segurança 2024', 'Demanda crescente por fino de aroma']
  }
};

/**
 * Obter análise geopolítica de uma região
 * @param {string} regionId - ID da região
 * @param {boolean} useAI - Usar IA para análise detalhada
 */
export async function getGeopoliticalRisk(regionId, useAI = true) {
  const region = getRegion(regionId);
  if (!region) {
    throw new Error(`Região não encontrada: ${regionId}`);
  }

  // Verificar cache
  if (geoCache.data[regionId] && (Date.now() - geoCache.timestamp[regionId]) < geoCache.TTL) {
    return { ...geoCache.data[regionId], fromCache: true };
  }

  log('info', `🌍 Analisando risco geopolítico para ${region.name}...`);

  // Dados base
  const baseData = geopoliticalData[regionId] || {
    baseRisk: 'desconhecido',
    factors: [],
    logisticsRisk: 'desconhecido',
    conflictRisk: 'desconhecido'
  };

  // Buscar notícias recentes do banco
  let recentNews = [];
  try {
    recentNews = await News.find({
      $or: [
        { title: { $regex: region.name, $options: 'i' } },
        { title: { $regex: region.country, $options: 'i' } },
        { content: { $regex: region.name, $options: 'i' } }
      ],
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Últimos 7 dias
    }).limit(10).lean();
  } catch (e) {
    log('warn', `Erro ao buscar notícias: ${e.message}`);
  }

  let aiAnalysis = null;
  
  if (useAI && process.env.GROQ_API_KEY) {
    try {
      aiAnalysis = await generateAIGeopoliticalAnalysis(region, baseData, recentNews);
    } catch (e) {
      log('warn', `Erro na análise IA: ${e.message}`);
    }
  }

  const result = {
    region: {
      id: region.id,
      name: region.name,
      country: region.country,
      type: region.type
    },
    risk: {
      overall: aiAnalysis?.overallRisk || baseData.baseRisk,
      logistics: baseData.logisticsRisk,
      conflict: baseData.conflictRisk,
      trade: baseData.tradeBarriers || 'baixo'
    },
    factors: baseData.factors,
    exports: baseData.exports,
    sanctions: baseData.sanctions || [],
    recentEvents: baseData.recentEvents || [],
    newsAnalysis: recentNews.length > 0 ? {
      count: recentNews.length,
      titles: recentNews.slice(0, 5).map(n => n.title)
    } : null,
    aiAnalysis: aiAnalysis ? {
      summary: aiAnalysis.summary,
      threats: aiAnalysis.threats,
      opportunities: aiAnalysis.opportunities,
      outlook: aiAnalysis.outlook
    } : null,
    updatedAt: new Date().toISOString()
  };

  // Atualizar cache
  geoCache.data[regionId] = result;
  geoCache.timestamp[regionId] = Date.now();

  log('info', `✅ Análise geopolítica: ${region.name} - Risco ${result.risk.overall}`);

  return result;
}

/**
 * Gerar análise geopolítica com IA
 */
async function generateAIGeopoliticalAnalysis(region, baseData, recentNews) {
  const newsContext = recentNews.length > 0
    ? `\n\nNotícias recentes da região:\n${recentNews.map(n => `- ${n.title}`).join('\n')}`
    : '';

  const prompt = `Você é um analista de risco geopolítico especializado no mercado de cacau.

Analise a região: ${region.name}, ${region.country}

Dados base:
- Risco base: ${baseData.baseRisk}
- Fatores conhecidos: ${baseData.factors.join(', ')}
- Risco logístico: ${baseData.logisticsRisk}
- Risco de conflito: ${baseData.conflictRisk}
${newsContext}

Forneça uma análise JSON com:
{
  "overallRisk": "alto | moderado | baixo",
  "summary": "Resumo de 2-3 frases sobre a situação geopolítica atual",
  "threats": ["lista de 2-3 principais ameaças"],
  "opportunities": ["lista de 1-2 oportunidades"],
  "outlook": "Perspectiva para os próximos 3-6 meses"
}

Considere:
- Estabilidade política
- Conflitos e tensões
- Infraestrutura de exportação
- Políticas comerciais
- Eventos climáticos extremos
- Greves e protestos
- Sanções internacionais

Responda APENAS com o JSON válido.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Extrair JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    log('error', `Erro Groq geopolítica: ${error.message}`);
    return null;
  }
}

/**
 * Obter análise geopolítica de todas as regiões
 */
export async function getAllGeopoliticalRisks(useAI = false) {
  const regions = getAllRegions();
  const results = {};
  const errors = [];

  log('info', `🌍 Analisando risco geopolítico de ${regions.length} regiões...`);

  for (const region of regions) {
    try {
      // Usar AI apenas para regiões de alto risco para economizar tokens
      const shouldUseAI = useAI && ['costa_do_marfim', 'nigeria', 'camaroes', 'equador'].includes(region.id);
      const analysis = await getGeopoliticalRisk(region.id, shouldUseAI);
      results[region.id] = analysis;
      
      // Delay para não sobrecarregar
      if (shouldUseAI) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      errors.push({ region: region.id, error: error.message });
    }
  }

  log('info', `✅ Análise geopolítica completa para ${Object.keys(results).length} regiões`);

  return {
    data: results,
    errors,
    summary: generateGeopoliticalSummary(results),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Gerar resumo geopolítico global
 */
function generateGeopoliticalSummary(geoData) {
  const regions = Object.values(geoData);
  
  const highRisk = regions.filter(r => r.risk.overall === 'alto');
  const moderateRisk = regions.filter(r => r.risk.overall === 'moderado');
  const lowRisk = regions.filter(r => r.risk.overall === 'baixo');

  // Calcular risco global ponderado pela produção
  const productionWeights = {
    costa_do_marfim: 0.45,
    gana: 0.15,
    indonesia: 0.10,
    nigeria: 0.05,
    camaroes: 0.05,
    equador: 0.05,
    bahia: 0.08,
    para: 0.04,
    ilheus: 0.02,
    itabuna: 0.005,
    espirito_santo: 0.005
  };

  let weightedRisk = 0;
  for (const region of regions) {
    const weight = productionWeights[region.region.id] || 0.01;
    const riskScore = region.risk.overall === 'alto' ? 3 : region.risk.overall === 'moderado' ? 2 : 1;
    weightedRisk += weight * riskScore;
  }

  const globalRisk = weightedRisk > 2.2 ? 'alto' : weightedRisk > 1.5 ? 'moderado' : 'baixo';

  return {
    globalRisk,
    weightedRiskScore: Math.round(weightedRisk * 100) / 100,
    breakdown: {
      high: highRisk.map(r => r.region.name),
      moderate: moderateRisk.map(r => r.region.name),
      low: lowRisk.map(r => r.region.name)
    },
    majorConcerns: [
      highRisk.length > 0 ? `${highRisk.length} região(ões) com risco alto` : null,
      'Instabilidade na África Ocidental',
      'Crise de segurança no Equador'
    ].filter(Boolean),
    positiveFactors: [
      'Brasil com risco baixo',
      'Gana mantém estabilidade',
      'Indonésia estável'
    ]
  };
}

/**
 * Limpar cache
 */
export function clearGeopoliticalCache() {
  geoCache = { data: {}, timestamp: {}, TTL: 6 * 60 * 60 * 1000 };
  log('info', '🗑️ Cache geopolítico limpo');
}

export default {
  getGeopoliticalRisk,
  getAllGeopoliticalRisks,
  clearGeopoliticalCache
};
