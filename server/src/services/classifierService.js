import Groq from 'groq-sdk';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import News from '../models/News.js';

// Cliente Groq
const client = config.groq.apiKey ? new Groq({
  apiKey: config.groq.apiKey
}) : null;

/**
 * Classifica a importância de uma notícia para o mercado de cacau
 * @param {string} title - Título da notícia
 * @returns {Promise<number|null>} - Score de 0 a 3
 */
export async function classifyNews(title) {
  if (!client) {
    logger.warn('⚠️  Groq não configurado');
    return null;
  }

  const prompt = `Classifique a importância desta notícia para o mercado de cacau.
Responda APENAS com um único dígito (0, 1, 2 ou 3), sem nenhum texto adicional.

0 = não relevante
1 = pouco relevante  
2 = relevante
3 = muito relevante

Notícia: "${title}"

Resposta (apenas o número):`;

  try {
    const response = await client.chat.completions.create({
      model: config.groq.model,
      messages: [
        { role: 'system', content: 'Você é um classificador. Responda APENAS com um número de 0 a 3, sem explicações.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0,
      max_tokens: 5
    });

    const content = response.choices[0].message.content.trim();
    
    // Extrai apenas o primeiro dígito encontrado
    const match = content.match(/[0-3]/);
    if (!match) {
      logger.warn(`⚠️  Resposta inválida: "${content}"`);
      return null;
    }
    
    const score = parseInt(match[0], 10);
    const labels = ['não relevante', 'pouco relevante', 'relevante', 'muito relevante'];
    logger.debug(`📊 Classificado: "${title.substring(0, 50)}..." => ${score} (${labels[score]})`);

    return score;
  } catch (error) {
    logger.error(`❌ Erro ao classificar: ${error.message}`);
    return null;
  }
}

/**
 * Testa conexão com a API Groq
 */
export async function testConnection() {
  if (!client) {
    return { success: false, error: 'Groq não configurado' };
  }

  try {
    const response = await client.chat.completions.create({
      model: config.groq.model,
      messages: [{ role: 'user', content: 'Responda apenas: OK' }],
      max_tokens: 5
    });

    return {
      success: true,
      response: response.choices[0]?.message?.content,
      model: config.groq.model
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Gera opinião de mercado para uma notícia
 * @param {string} text - Texto da notícia (título + conteúdo)
 * @returns {Promise<{opinionScore: number, opinionText: string, globalImpact: string}|null>}
 */
export async function generateOpinion(text) {
  if (!client) {
    logger.warn('⚠️  Groq não configurado para opinião');
    return null;
  }

  const prompt = `Você é um analista de mercado de commodities especializado em CACAU.

Analise esta notícia considerando:
• Geopolítica internacional (especialmente Costa do Marfim, Gana, Nigéria, Camarões)
• Produção de cacau na África Ocidental
• Oferta e demanda global de cacau
• Preço do dólar e câmbio
• Perspectiva de mercado futuro
• Impacto na cadeia produtiva do cacau (produtores, indústria, exportadores)

Retorne APENAS um JSON válido (sem markdown, sem explicações) no formato:
{
  "opinionScore": <0-3>,
  "opinionText": "<explicação curta do impacto no mercado de cacau>",
  "globalImpact": "<baixo|moderado|alto>"
}

Onde opinionScore:
0 = Sem impacto no mercado
1 = Impacto leve/indireto
2 = Impacto moderado
3 = Impacto significativo

Notícia:
"${text.substring(0, 1500)}"

JSON:`;

  try {
    const response = await client.chat.completions.create({
      model: config.groq.model,
      messages: [
        {
          role: 'system',
          content: 'Você é um analista de mercado. Responda APENAS com JSON válido, sem markdown, sem texto extra.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 300
    });

    const content = response.choices[0].message.content.trim();
    
    // Limpa possíveis marcadores de código
    let jsonStr = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    
    // Tenta extrair JSON da resposta
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const result = JSON.parse(jsonStr);

    // Validação e normalização
    const opinion = {
      opinionScore: typeof result.opinionScore === 'number' && result.opinionScore >= 0 && result.opinionScore <= 3
        ? result.opinionScore
        : 0,
      opinionText: typeof result.opinionText === 'string' && result.opinionText.length > 0
        ? result.opinionText.substring(0, 500)
        : 'Análise não disponível',
      globalImpact: ['baixo', 'moderado', 'alto'].includes(result.globalImpact)
        ? result.globalImpact
        : 'baixo'
    };

    logger.debug(`💡 Opinião gerada: score=${opinion.opinionScore}, impacto=${opinion.globalImpact}`);
    return opinion;

  } catch (error) {
    logger.error(`❌ Erro ao gerar opinião: ${error.message}`);
    return null;
  }
}

/**
 * Classifica múltiplas notícias em lote
 */
export async function classifyBatch(items, delayMs = 500) {
  const results = [];
  const labels = ['não relevante', 'pouco relevante', 'relevante', 'muito relevante'];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    logger.info(`🔄 Classificando ${i + 1}/${items.length}: ${item.title.substring(0, 40)}...`);

    const score = await classifyNews(item.title);

    results.push({
      ...item,
      classification: {
        score,
        label: score !== null ? labels[score] : 'pendente'
      }
    });

    if (i < items.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Classifica todas as notícias pendentes no banco
 */
export async function classifyPendingNews(batchSize = 20, delayMs = 500) {
  const labels = ['não relevante', 'pouco relevante', 'relevante', 'muito relevante'];

  try {
    const pendingNews = await News.find({
      'classification.score': null,
      status: 'active'
    })
      .sort({ publishedAt: -1 })
      .limit(batchSize);

    if (pendingNews.length === 0) {
      logger.info('✅ Nenhuma notícia pendente para classificar');
      return { processed: 0, success: 0, errors: 0 };
    }

    logger.info(`🔄 Classificando ${pendingNews.length} notícias...`);

    const stats = { processed: 0, success: 0, errors: 0 };

    for (const news of pendingNews) {
      const score = await classifyNews(news.title);

      if (score !== null) {
        news.classification = {
          score,
          label: labels[score],
          classifiedAt: new Date(),
          model: config.groq.model
        };

        // Gera opinião de mercado
        const textForOpinion = `${news.title}${news.description ? ' ' + news.description : ''}`;
        const opinion = await generateOpinion(textForOpinion);

        if (opinion) {
          news.opinion = {
            score: opinion.opinionScore,
            text: opinion.opinionText,
            globalImpact: opinion.globalImpact,
            generatedAt: new Date(),
            model: config.groq.model
          };
        } else {
          news.opinion = {
            error: 'Falha ao gerar opinião',
            generatedAt: new Date()
          };
        }

        await news.save();
        stats.success++;
      } else {
        news.classification.error = 'Falha na classificação';
        await news.save();
        stats.errors++;
      }

      stats.processed++;

      if (stats.processed < pendingNews.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    logger.info(`✅ Classificação: ${stats.success} sucesso, ${stats.errors} erros`);
    return stats;
  } catch (error) {
    logger.error(`❌ Erro na classificação em lote: ${error.message}`);
    throw error;
  }
}

/**
 * Reclassifica notícias com erro
 */
export async function retryFailedClassifications(limit = 10) {
  const labels = ['não relevante', 'pouco relevante', 'relevante', 'muito relevante'];

  try {
    const failedNews = await News.find({
      'classification.error': { $exists: true, $ne: null },
      'classification.score': null
    }).limit(limit);

    if (failedNews.length === 0) {
      return { retried: 0, success: 0 };
    }

    logger.info(`🔄 Retentando ${failedNews.length} classificações...`);

    let success = 0;

    for (const news of failedNews) {
      const score = await classifyNews(news.title);

      if (score !== null) {
        news.classification = {
          score,
          label: labels[score],
          classifiedAt: new Date(),
          model: config.groq.model
        };
        news.classification.error = undefined;
        await news.save();
        success++;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { retried: failedNews.length, success };
  } catch (error) {
    logger.error(`❌ Erro ao retentar: ${error.message}`);
    throw error;
  }
}

/**
 * Obtém estatísticas de classificação
 */
export async function getClassificationStats() {
  try {
    const total = await News.countDocuments({ status: 'active' });
    const classified = await News.countDocuments({
      status: 'active',
      'classification.score': { $ne: null }
    });
    const pending = await News.countDocuments({
      status: 'active',
      'classification.score': null
    });

    const distribution = await News.aggregate([
      { $match: { status: 'active', 'classification.score': { $ne: null } } },
      { $group: { _id: '$classification.score', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const labels = ['não relevante', 'pouco relevante', 'relevante', 'muito relevante'];
    const scores = {};
    distribution.forEach(d => {
      scores[labels[d._id]] = d.count;
    });

    return {
      total,
      classified,
      pending,
      percentClassified: total > 0 ? ((classified / total) * 100).toFixed(1) : 0,
      distribution: scores
    };
  } catch (error) {
    logger.error(`❌ Erro ao obter estatísticas: ${error.message}`);
    throw error;
  }
}

/**
 * Gera opinião para uma notícia específica por ID
 */
export async function generateOpinionForNews(newsId) {
  try {
    const news = await News.findById(newsId);
    if (!news) {
      return { success: false, error: 'Notícia não encontrada' };
    }

    const textForOpinion = `${news.title}${news.description ? ' ' + news.description : ''}`;
    const opinion = await generateOpinion(textForOpinion);

    if (opinion) {
      news.opinion = {
        score: opinion.opinionScore,
        text: opinion.opinionText,
        globalImpact: opinion.globalImpact,
        generatedAt: new Date(),
        model: config.groq.model
      };
      await news.save();
      return { success: true, data: news.opinion };
    }

    return { success: false, error: 'Falha ao gerar opinião' };
  } catch (error) {
    logger.error(`❌ Erro ao gerar opinião para notícia: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default {
  classifyNews,
  testConnection,
  classifyBatch,
  classifyPendingNews,
  retryFailedClassifications,
  getClassificationStats,
  generateOpinion,
  generateOpinionForNews,
  isEnabled: !!client
};
