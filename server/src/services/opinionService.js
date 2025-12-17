import Groq from 'groq-sdk';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import climateService from './climateService.js';
import priceService from './priceService.js';

// Cliente Groq
const client = config.groq.apiKey ? new Groq({
  apiKey: config.groq.apiKey
}) : null;

/**
 * Análise avançada de impacto no mercado de cacau
 * @param {string} text - Texto da notícia
 * @returns {Promise<{nota: number, tendencia: string, impacto: string, analise: string}>}
 */
export async function analyzeCocoaImpact(text) {
  if (!client) {
    throw new Error('Groq não configurado');
  }

  const prompt = `Você é um analista econômico especializado em CACAU e commodities agrícolas.

Avalie a seguinte notícia considerando:
- Geopolítica global (especialmente Costa do Marfim, Gana, Nigéria, Camarões)
- Oferta e demanda do cacau mundial
- Riscos climáticos (El Niño, La Niña, secas, chuvas)
- Situação econômica dos países produtores
- Tendências de preços e mercado futuro
- Impacto na indústria de chocolate
- Eventos recentes que possam influenciar

Retorne APENAS um JSON válido no formato:
{
  "nota": <número de 0 a 100 indicando relevância para investidores>,
  "tendencia": "<alta | baixa | neutro>",
  "impacto": "<positivo | negativo | neutro>",
  "analise": "<texto de 2-3 parágrafos explicando a análise detalhada>"
}

Notícia para análise:
"""
${text}
"""

JSON:`;

  try {
    const response = await client.chat.completions.create({
      model: config.groq.model,
      messages: [
        {
          role: 'system',
          content: 'Você é um analista financeiro especializado em commodities agrícolas, especialmente cacau. Sempre responda em JSON válido.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content.trim();
    
    // Tenta extrair JSON da resposta
    let jsonStr = content;
    
    // Se a resposta contiver texto antes/depois do JSON, extrai apenas o JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const result = JSON.parse(jsonStr);

    // Validação dos campos
    if (typeof result.nota !== 'number' || result.nota < 0 || result.nota > 100) {
      result.nota = 50;
    }

    if (!['alta', 'baixa', 'neutro'].includes(result.tendencia)) {
      result.tendencia = 'neutro';
    }

    if (!['positivo', 'negativo', 'neutro'].includes(result.impacto)) {
      result.impacto = 'neutro';
    }

    if (!result.analise || typeof result.analise !== 'string') {
      result.analise = 'Análise não disponível.';
    }

    logger.info(`📊 Análise de impacto: nota=${result.nota}, tendência=${result.tendencia}`);

    return result;
  } catch (error) {
    logger.error(`❌ Erro na análise de impacto: ${error.message}`);
    throw error;
  }
}

/**
 * Gera resumo executivo de múltiplas notícias
 * @param {Array<string>} headlines - Lista de títulos de notícias
 * @returns {Promise<{resumo: string, sentimento: string, recomendacao: string}>}
 */
export async function generateMarketSummary(headlines) {
  if (!client) {
    throw new Error('Groq não configurado');
  }

  const prompt = `Você é um analista de mercado de commodities.

Analise estas manchetes recentes sobre cacau e gere um resumo executivo:

${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Retorne APENAS um JSON válido:
{
  "resumo": "<resumo executivo de 2-3 parágrafos>",
  "sentimento": "<bullish | bearish | neutro>",
  "recomendacao": "<texto curto com recomendação para investidores>"
}

JSON:`;

  try {
    const response = await client.chat.completions.create({
      model: config.groq.model,
      messages: [
        {
          role: 'system',
          content: 'Você é um analista financeiro. Sempre responda em JSON válido.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return JSON.parse(content);
  } catch (error) {
    logger.error(`❌ Erro no resumo de mercado: ${error.message}`);
    throw error;
  }
}

/**
 * Análise AVANÇADA de mercado de cacau com dados de clima e preços
 * @param {string} title - Título da notícia
 * @param {string} content - Conteúdo da notícia
 * @param {boolean} includeClimate - Se deve buscar dados de clima (demora mais)
 * @returns {Promise<Object>} Análise completa estruturada
 */
export async function generateAdvancedAnalysis(title, content, includeClimate = true) {
  if (!client) {
    throw new Error('Groq não configurado');
  }

  logger.info('🔬 Iniciando análise avançada de mercado...');

  // Busca dados de clima se solicitado
  let climateData = {};
  let climateRisks = { risco_global: 'indisponível', fatores: [], regioes_criticas: [] };
  
  if (includeClimate) {
    try {
      climateData = await climateService.fetchAllRegionsClimate();
      climateRisks = climateService.analyzeClimateRisks(climateData);
    } catch (err) {
      logger.warn(`⚠️ Erro ao buscar clima: ${err.message}`);
    }
  }

  // Busca dados de preços
  const priceData = priceService.formatPriceDataForAI();

  const prompt = `Você é um ANALISTA ESPECIALISTA em mercado global de cacau, focado em:
- Preços regionais (Brasil, África, Ásia, América Latina)
- Clima e impacto na produção
- Geopolítica do cacau
- Oferta e demanda internacional
- Risco climático e agrícola
- Produção e exportação por regiões

====================================================================
NOTÍCIA
Título: ${title}
Conteúdo:
${content || 'Não disponível - analise apenas pelo título.'}
====================================================================

====================================================================
DADOS DE CLIMA POR REGIÃO (Open-Meteo)
${JSON.stringify(climateData, null, 2)}
====================================================================

====================================================================
DADOS DE PREÇO REGIONAL DO CACAU
${priceData}
====================================================================

🎯 SUA MISSÃO:
Gerar análise COMPLETA em JSON PURO seguindo EXATAMENTE este formato:

{
  "regionalImpact": {
    "bahia": { "impacto": "baixo|moderado|alto", "explicacao": "..." },
    "baixo_sul_bahia": { "impacto": "...", "explicacao": "..." },
    "ilheus": { "impacto": "...", "explicacao": "..." },
    "para": { "impacto": "...", "explicacao": "..." },
    "costa_do_marfim": { "impacto": "...", "explicacao": "..." },
    "gana": { "impacto": "...", "explicacao": "..." },
    "nigeria": { "impacto": "...", "explicacao": "..." },
    "camaroes": { "impacto": "...", "explicacao": "..." },
    "equador": { "impacto": "...", "explicacao": "..." },
    "indonesia": { "impacto": "...", "explicacao": "..." }
  },
  "climateRisk": {
    "risco_global": "baixo|moderado|alto",
    "fatores": ["fator1", "fator2"],
    "regioes_criticas": [{"regiao": "nome", "motivo": "..."}]
  },
  "priceImpact": {
    "mercado_brasil": { "tendencia": "queda|estabilidade|alta", "motivo": "..." },
    "mercado_ny_futures": { "tendencia": "queda|estabilidade|alta", "motivo": "..." },
    "arroba_bahia": { "preco_estimado": "R$ XXX ou indisponível", "tendencia": "..." }
  },
  "geoPoliticalRisk": {
    "nivel": "baixo|moderado|alto",
    "eventos_relevantes": ["evento1", "evento2"]
  },
  "globalMarketOpinion": {
    "resumo": "Resumo analítico de até 5 linhas sobre a situação global do cacau.",
    "impacto_geral": "baixo|moderado|alto",
    "sentimento_do_mercado": "bearish|neutro|bullish"
  }
}

🔒 REGRAS:
- Responda SOMENTE com JSON VÁLIDO.
- NÃO adicione textos fora do JSON.
- Use os dados de clima e preço fornecidos como base.
- Seja específico nas explicações regionais.`;

  try {
    const response = await client.chat.completions.create({
      model: config.groq.model,
      messages: [
        {
          role: 'system',
          content: 'Você é um analista especializado em mercado de cacau. Responda APENAS com JSON válido, sem markdown ou texto extra.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 2000
    });

    const responseContent = response.choices[0].message.content.trim();
    
    // Limpa e extrai JSON
    let jsonStr = responseContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const analysis = JSON.parse(jsonStr);

    // Adiciona dados brutos de clima e preço
    analysis._metadata = {
      timestamp: new Date().toISOString(),
      model: config.groq.model,
      climate_data_available: Object.keys(climateData).length > 0,
      price_data_source: 'CEPEA/ICE Futures'
    };

    // Usa análise de clima do serviço se a IA não retornou
    if (!analysis.climateRisk || !analysis.climateRisk.fatores?.length) {
      analysis.climateRisk = climateRisks;
    }

    logger.info(`✅ Análise avançada concluída: impacto=${analysis.globalMarketOpinion?.impacto_geral}`);
    return analysis;

  } catch (error) {
    logger.error(`❌ Erro na análise avançada: ${error.message}`);
    throw error;
  }
}

/**
 * Chamada genérica ao Groq para prompts customizados
 * @param {string} prompt - Prompt a ser enviado
 * @param {number} maxTokens - Máximo de tokens na resposta
 * @returns {Promise<string>} - Resposta da IA
 */
export async function callGroq(prompt, maxTokens = 500) {
  if (!client) {
    throw new Error('Groq não configurado');
  }

  try {
    const completion = await client.chat.completions.create({
      model: config.groq.model,
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em mercado de commodities, focado em cacau. Responda sempre em português brasileiro de forma clara e profissional.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    logger.error(`❌ Erro ao chamar Groq: ${error.message}`);
    throw error;
  }
}

export default {
  analyzeCocoaImpact,
  generateMarketSummary,
  generateAdvancedAnalysis,
  callGroq
};
