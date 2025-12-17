/**
 * 📊 Regional Analysis Service - Análise Regional do Cacau
 * Serviço principal que combina clima, preço, geopolítica e IA
 */

import Groq from 'groq-sdk';
import { getRegion, getAllRegions, getRegionIds } from './regionList.js';
import { getClimate, getAllRegionsClimate } from './climateService.js';
import { getRegionalPrice, getAllRegionalPrices } from './priceService.js';
import { getGeopoliticalRisk, getAllGeopoliticalRisks } from './geopoliticalService.js';
import { log } from './logger.js';
import News from '../models/News.js';
import RegionalAnalysis from '../models/RegionalAnalysis.js';
import { calculateMovementCertificate } from '../services/movementCertificateService.js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

/**
 * Gerar análise regional completa para uma região
 * @param {string} regionId - ID da região
 * @returns {Promise<Object>} Análise completa
 */
export async function generateRegionalAnalysis(regionId) {
  const region = getRegion(regionId);
  if (!region) {
    throw new Error(`Região não encontrada: ${regionId}`);
  }

  log('info', `📊 Iniciando análise regional completa para ${region.name}...`);
  const startTime = Date.now();

  try {
    // 1. Buscar todos os dados em paralelo
    const [climate, price, geopolitical, recentNews] = await Promise.all([
      getClimate(regionId).catch(e => ({ error: e.message })),
      getRegionalPrice(regionId).catch(e => ({ error: e.message })),
      getGeopoliticalRisk(regionId, true).catch(e => ({ error: e.message })),
      getRecentNewsForRegion(region)
    ]);

    // 2. Gerar análise com IA
    const aiAnalysis = await generateAIRegionalReport({
      region,
      climate,
      price,
      geopolitical,
      recentNews
    });

    const movementCertificate = calculateMovementCertificate({
      // `variation.week` no serviço regional é percentual (ex: 3.69 significa +3.69%)
      changePercent7d: price?.variation?.week,
      volatility7d: null,
      zigzagTrend: null
    });

    // 3. Montar resultado final
    const result = {
      region: {
        id: region.id,
        name: region.name,
        state: region.state,
        country: region.country,
        type: region.type,
        coordinates: {
          latitude: region.latitude,
          longitude: region.longitude
        }
      },
      climate: climate.error ? { error: climate.error } : {
        current: climate.current,
        last48h: climate.last48h,
        forecast72h: climate.forecast72h,
        risk: climate.risk
      },
      price: price.error ? { error: price.error } : {
        value: price.price,
        unit: price.unit,
        currency: price.currency,
        variation: price.variation,
        trend: price.trend,
        sources: price.sources
      },
      geopolitical: geopolitical.error ? { error: geopolitical.error } : {
        risk: geopolitical.risk,
        factors: geopolitical.factors,
        exports: geopolitical.exports
      },
      news: {
        count: recentNews.length,
        recent: recentNews.slice(0, 5).map(n => ({
          title: n.title,
          source: n.source,
          date: n.createdAt
        }))
      },
      movementCertificate,
      analysis: aiAnalysis,
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
        dataQuality: calculateDataQuality({ climate, price, geopolitical })
      }
    };

    // 4. Salvar no banco de dados
    await saveAnalysis(result);

    log('info', `✅ Análise completa: ${region.name} - Risco ${aiAnalysis.riskLevel} em ${result.metadata.processingTime}`);

    return result;

  } catch (error) {
    log('error', `❌ Erro na análise regional ${region.name}: ${error.message}`);
    throw error;
  }
}

/**
 * Buscar notícias recentes relacionadas à região
 */
async function getRecentNewsForRegion(region) {
  try {
    const searchTerms = [region.name, region.country];
    if (region.state) searchTerms.push(region.state);

    const news = await News.find({
      $or: searchTerms.map(term => ({
        $or: [
          { title: { $regex: term, $options: 'i' } },
          { content: { $regex: term, $options: 'i' } }
        ]
      })),
      createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } // 14 dias
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    return news;
  } catch (error) {
    log('warn', `Erro ao buscar notícias: ${error.message}`);
    return [];
  }
}

/**
 * Gerar relatório de análise com IA
 */
async function generateAIRegionalReport({ region, climate, price, geopolitical, recentNews }) {
  // Construir contexto para a IA
  const climateContext = climate.error 
    ? 'Dados climáticos indisponíveis'
    : `Temperatura: ${climate.current?.temperature}°C, ${climate.current?.weatherDescription}. 
       Últimas 48h: média ${climate.last48h?.avgTemperature}°C, precipitação ${climate.last48h?.totalPrecipitation}mm.
       Risco climático: ${climate.risk?.level} - ${climate.risk?.summary}`;

  const priceContext = price.error
    ? 'Dados de preço indisponíveis'
    : `Preço atual: ${price.price} ${price.unit}.
       Variação diária: ${price.variation?.dayPercent || 'N/A'}.
       Tendência: ${price.trend}`;

  const geoContext = geopolitical.error
    ? 'Dados geopolíticos indisponíveis'
    : `Risco geral: ${geopolitical.risk?.overall}.
       Risco logístico: ${geopolitical.risk?.logistics}.
       Risco de conflito: ${geopolitical.risk?.conflict}.
       Fatores: ${geopolitical.factors?.slice(0, 3).join('; ') || 'N/A'}`;

  const newsContext = recentNews.length > 0
    ? `Notícias recentes:\n${recentNews.slice(0, 5).map(n => `- ${n.title}`).join('\n')}`
    : 'Sem notícias recentes relevantes';

  const prompt = `Você é um analista especializado no mercado global de cacau. Analise a região ${region.name}, ${region.country} e forneça um relatório completo.

DADOS DISPONÍVEIS:

📌 REGIÃO: ${region.name} (${region.type === 'BR' ? 'Brasil' : 'Global'})
Descrição: ${region.description || 'N/A'}

🌤️ CLIMA:
${climateContext}

💰 PREÇO:
${priceContext}

🌍 GEOPOLÍTICA:
${geoContext}

📰 NOTÍCIAS:
${newsContext}

INSTRUÇÕES:
Analise todos os dados e forneça um JSON com a seguinte estrutura:

{
  "region": "${region.name}",
  "riskLevel": "alto | moderado | baixo",
  "summary": "Resumo executivo de 3-4 frases sobre a situação atual da região",
  "climateImpact": "Impacto do clima na produção de cacau (1-2 frases)",
  "geopoliticalImpact": "Impacto geopolítico no mercado (1-2 frases)",
  "priceTrend": "alta | queda | estável",
  "priceJustification": "Justificativa para a tendência de preço",
  "recommendation": "Recomendação estratégica para traders/compradores",
  "outlook": {
    "shortTerm": "Perspectiva para 1-2 semanas",
    "mediumTerm": "Perspectiva para 1-3 meses"
  },
  "keyFactors": ["Lista de 3-4 fatores principais que influenciam o mercado"],
  "confidenceLevel": "alto | médio | baixo"
}

Considere:
- Impacto na cadeia de suprimentos global
- Sazonalidade da produção
- Eventos climáticos (El Niño, secas, chuvas excessivas)
- Tensões políticas e sociais
- Demanda global por cacau/chocolate

Responda APENAS com o JSON válido.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 800
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Extrair JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ...parsed,
        generatedBy: 'groq-llama-3.1-8b',
        timestamp: new Date().toISOString()
      };
    }

    // Fallback se não conseguir parsear
    return generateFallbackAnalysis(region, climate, price, geopolitical);

  } catch (error) {
    log('error', `Erro Groq análise regional: ${error.message}`);
    return generateFallbackAnalysis(region, climate, price, geopolitical);
  }
}

/**
 * Análise fallback quando IA falha
 */
function generateFallbackAnalysis(region, climate, price, geopolitical) {
  const climateRisk = climate.risk?.level || 'desconhecido';
  const geoRisk = geopolitical.risk?.overall || 'desconhecido';
  const priceTrend = price.trend || 'estável';

  // Calcular risco geral
  const riskScores = { alto: 3, moderado: 2, baixo: 1, desconhecido: 2 };
  const avgRisk = (riskScores[climateRisk] + riskScores[geoRisk]) / 2;
  const riskLevel = avgRisk >= 2.5 ? 'alto' : avgRisk >= 1.5 ? 'moderado' : 'baixo';

  return {
    region: region.name,
    riskLevel,
    summary: `${region.name} apresenta risco ${riskLevel} para o mercado de cacau. Condições climáticas com risco ${climateRisk} e situação geopolítica com risco ${geoRisk}.`,
    climateImpact: climate.risk?.summary || 'Análise climática indisponível',
    geopoliticalImpact: `Risco geopolítico ${geoRisk} na região`,
    priceTrend,
    priceJustification: `Tendência baseada em condições atuais de mercado`,
    recommendation: riskLevel === 'alto' 
      ? 'Monitorar de perto. Considerar diversificação de fontes.'
      : 'Condições favoráveis para operações normais.',
    outlook: {
      shortTerm: 'Sem mudanças significativas esperadas',
      mediumTerm: 'Depende de fatores climáticos e geopolíticos'
    },
    keyFactors: ['Clima', 'Preço internacional', 'Logística', 'Demanda global'],
    confidenceLevel: 'baixo',
    generatedBy: 'fallback',
    timestamp: new Date().toISOString()
  };
}

/**
 * Calcular qualidade dos dados
 */
function calculateDataQuality({ climate, price, geopolitical }) {
  let score = 0;
  let total = 3;

  if (!climate.error) score++;
  if (!price.error) score++;
  if (!geopolitical.error) score++;

  const percentage = Math.round((score / total) * 100);
  
  return {
    score: `${score}/${total}`,
    percentage,
    level: percentage >= 80 ? 'alta' : percentage >= 50 ? 'média' : 'baixa'
  };
}

/**
 * Salvar análise no MongoDB
 */
async function saveAnalysis(analysis) {
  try {
    await RegionalAnalysis.findOneAndUpdate(
      { 'region.id': analysis.region.id },
      analysis,
      { upsert: true, new: true }
    );
    log('info', `💾 Análise salva: ${analysis.region.name}`);
  } catch (error) {
    log('warn', `Erro ao salvar análise: ${error.message}`);
  }
}

/**
 * Gerar análise para todas as regiões
 */
export async function analyzeAllRegions() {
  const regionIds = getRegionIds();
  const results = {};
  const errors = [];

  log('info', `📊 Iniciando análise de ${regionIds.length} regiões...`);
  const startTime = Date.now();

  for (const regionId of regionIds) {
    try {
      const analysis = await generateRegionalAnalysis(regionId);
      results[regionId] = analysis;
      
      // Delay entre análises para não sobrecarregar APIs
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      errors.push({ region: regionId, error: error.message });
      log('error', `Erro em ${regionId}: ${error.message}`);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  log('info', `✅ Análise global completa em ${duration}s - ${Object.keys(results).length}/${regionIds.length} regiões`);

  return {
    success: Object.keys(results).length,
    failed: errors.length,
    results,
    errors,
    summary: generateGlobalSummary(results),
    metadata: {
      totalRegions: regionIds.length,
      processingTime: `${duration}s`,
      completedAt: new Date().toISOString()
    }
  };
}

/**
 * Gerar resumo global
 */
function generateGlobalSummary(analyses) {
  const regions = Object.values(analyses);
  
  const byRisk = {
    alto: regions.filter(r => r.analysis?.riskLevel === 'alto'),
    moderado: regions.filter(r => r.analysis?.riskLevel === 'moderado'),
    baixo: regions.filter(r => r.analysis?.riskLevel === 'baixo')
  };

  const byTrend = {
    alta: regions.filter(r => r.analysis?.priceTrend === 'alta'),
    estavel: regions.filter(r => r.analysis?.priceTrend === 'estável'),
    queda: regions.filter(r => r.analysis?.priceTrend === 'queda')
  };

  // Calcular médias
  const brazilRegions = regions.filter(r => r.region.type === 'BR');
  const globalRegions = regions.filter(r => r.region.type === 'GLOBAL');

  const avgBrazilPrice = brazilRegions.length > 0
    ? Math.round(brazilRegions.reduce((a, b) => a + (b.price?.value || 0), 0) / brazilRegions.length)
    : 0;

  const avgGlobalPrice = globalRegions.length > 0
    ? Math.round(globalRegions.reduce((a, b) => a + (b.price?.value || 0), 0) / globalRegions.length)
    : 0;

  return {
    overview: {
      totalAnalyzed: regions.length,
      highRiskCount: byRisk.alto.length,
      moderateRiskCount: byRisk.moderado.length,
      lowRiskCount: byRisk.baixo.length
    },
    riskDistribution: {
      high: byRisk.alto.map(r => r.region.name),
      moderate: byRisk.moderado.map(r => r.region.name),
      low: byRisk.baixo.map(r => r.region.name)
    },
    priceTrends: {
      rising: byTrend.alta.map(r => r.region.name),
      stable: byTrend.estavel.map(r => r.region.name),
      falling: byTrend.queda.map(r => r.region.name)
    },
    averagePrices: {
      brazil: { value: avgBrazilPrice, unit: 'R$/arroba' },
      global: { value: avgGlobalPrice, unit: 'USD/ton' }
    },
    globalRiskLevel: byRisk.alto.length >= 3 ? 'alto' : byRisk.moderado.length >= 5 ? 'moderado' : 'baixo',
    marketOutlook: byTrend.alta.length > byTrend.queda.length ? 'bullish' : byTrend.queda.length > byTrend.alta.length ? 'bearish' : 'neutro'
  };
}

/**
 * Obter última análise salva de uma região
 */
export async function getLastAnalysis(regionId) {
  try {
    const analysis = await RegionalAnalysis.findOne({ 'region.id': regionId })
      .sort({ 'metadata.generatedAt': -1 })
      .lean();
    return analysis;
  } catch (error) {
    log('error', `Erro ao buscar análise: ${error.message}`);
    return null;
  }
}

/**
 * Obter todas as análises salvas
 */
export async function getAllSavedAnalyses() {
  try {
    const analyses = await RegionalAnalysis.find({})
      .sort({ 'metadata.generatedAt': -1 })
      .lean();
    return analyses;
  } catch (error) {
    log('error', `Erro ao buscar análises: ${error.message}`);
    return [];
  }
}

export default {
  generateRegionalAnalysis,
  analyzeAllRegions,
  getLastAnalysis,
  getAllSavedAnalyses
};
