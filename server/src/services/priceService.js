import logger from '../utils/logger.js';

/**
 * Dados de preços regionais do cacau
 * Em produção, isso viria de APIs como:
 * - ICE Futures (NY Cocoa)
 * - CEPEA (preços Brasil)
 * - Trading Economics
 * - Quandl / Nasdaq Data Link
 */

// Preços de referência (atualizados manualmente ou via API)
// Última atualização: Dezembro 2024
const PRICE_REFERENCES = {
  // Preços internacionais
  ny_futures: {
    preco_usd_ton: 8200,
    variacao_24h: '+1.2%',
    tendencia: 'alta',
    ultima_atualizacao: '2024-12-11',
    fonte: 'ICE Futures US (CC1)'
  },
  
  london_futures: {
    preco_gbp_ton: 6500,
    variacao_24h: '+0.8%',
    tendencia: 'alta',
    ultima_atualizacao: '2024-12-11',
    fonte: 'ICE Futures Europe'
  },

  // Preços Brasil (por arroba = 15kg)
  bahia: {
    preco_arroba_brl: 680,
    preco_kg_brl: 45.33,
    variacao_semanal: '+3.5%',
    tendencia: 'alta',
    qualidade: 'Tipo Comercial',
    fonte: 'CEPEA/ESALQ'
  },
  
  para: {
    preco_arroba_brl: 620,
    preco_kg_brl: 41.33,
    variacao_semanal: '+2.8%',
    tendencia: 'alta',
    qualidade: 'Tipo Amazônia',
    fonte: 'CEPEA/ESALQ'
  },

  // Preços África (FOB)
  costa_do_marfim: {
    preco_usd_ton: 7800,
    preco_cfa_kg: 4800,
    tendencia: 'alta',
    fonte: 'CCC (Conseil Café-Cacao)'
  },
  
  gana: {
    preco_usd_ton: 7900,
    preco_ghs_kg: 95,
    tendencia: 'alta',
    fonte: 'COCOBOD'
  }
};

/**
 * Obtém dados de preços regionais
 * @returns {Object} Dados de preços formatados
 */
export function getRegionalPrices() {
  const now = new Date().toISOString();
  
  return {
    timestamp: now,
    internacional: {
      ny_cocoa_futures: {
        preco: `$${PRICE_REFERENCES.ny_futures.preco_usd_ton}/ton`,
        variacao: PRICE_REFERENCES.ny_futures.variacao_24h,
        tendencia: PRICE_REFERENCES.ny_futures.tendencia
      },
      london_cocoa: {
        preco: `£${PRICE_REFERENCES.london_futures.preco_gbp_ton}/ton`,
        variacao: PRICE_REFERENCES.london_futures.variacao_24h,
        tendencia: PRICE_REFERENCES.london_futures.tendencia
      }
    },
    brasil: {
      bahia: {
        arroba: `R$ ${PRICE_REFERENCES.bahia.preco_arroba_brl}`,
        kg: `R$ ${PRICE_REFERENCES.bahia.preco_kg_brl}`,
        variacao: PRICE_REFERENCES.bahia.variacao_semanal,
        tendencia: PRICE_REFERENCES.bahia.tendencia
      },
      para: {
        arroba: `R$ ${PRICE_REFERENCES.para.preco_arroba_brl}`,
        kg: `R$ ${PRICE_REFERENCES.para.preco_kg_brl}`,
        variacao: PRICE_REFERENCES.para.variacao_semanal,
        tendencia: PRICE_REFERENCES.para.tendencia
      }
    },
    africa: {
      costa_do_marfim: {
        preco: `$${PRICE_REFERENCES.costa_do_marfim.preco_usd_ton}/ton FOB`,
        tendencia: PRICE_REFERENCES.costa_do_marfim.tendencia
      },
      gana: {
        preco: `$${PRICE_REFERENCES.gana.preco_usd_ton}/ton FOB`,
        tendencia: PRICE_REFERENCES.gana.tendencia
      }
    },
    observacao: 'Preços de referência. Consulte fontes oficiais para operações.'
  };
}

/**
 * Analisa tendência de preços
 * @returns {Object} Análise de tendência
 */
export function analyzePriceTrend() {
  const tendencias = Object.values(PRICE_REFERENCES)
    .filter(p => p.tendencia)
    .map(p => p.tendencia);
  
  const alta = tendencias.filter(t => t === 'alta').length;
  const baixa = tendencias.filter(t => t === 'queda').length;
  
  let tendenciaGeral = 'estabilidade';
  if (alta > baixa * 2) tendenciaGeral = 'alta';
  else if (baixa > alta * 2) tendenciaGeral = 'queda';

  return {
    tendencia_global: tendenciaGeral,
    mercados_em_alta: alta,
    mercados_em_queda: baixa,
    fator_principal: tendenciaGeral === 'alta' 
      ? 'Oferta restrita na África Ocidental e demanda aquecida'
      : tendenciaGeral === 'queda'
        ? 'Aumento de estoques e menor demanda sazonal'
        : 'Mercado aguardando novos dados de safra'
  };
}

/**
 * Obtém preço estimado por região
 * @param {string} region - Chave da região
 * @returns {Object|null} Dados de preço
 */
export function getRegionPrice(region) {
  return PRICE_REFERENCES[region] || null;
}

/**
 * Formata dados de preço para o prompt da IA
 * @returns {string} JSON formatado
 */
export function formatPriceDataForAI() {
  const prices = getRegionalPrices();
  const trend = analyzePriceTrend();
  
  return JSON.stringify({
    ...prices,
    analise_tendencia: trend
  }, null, 2);
}

export default {
  PRICE_REFERENCES,
  getRegionalPrices,
  analyzePriceTrend,
  getRegionPrice,
  formatPriceDataForAI
};
