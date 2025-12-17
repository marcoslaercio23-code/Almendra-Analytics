import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * Coordenadas das principais regiões produtoras de cacau
 */
const COCOA_REGIONS = {
  // Brasil
  bahia: { lat: -14.79, lon: -39.04, name: 'Bahia (Brasil)' },
  baixo_sul_bahia: { lat: -13.85, lon: -39.10, name: 'Baixo Sul da Bahia' },
  ilheus: { lat: -14.79, lon: -39.04, name: 'Ilhéus/Itabuna' },
  para: { lat: -2.50, lon: -54.70, name: 'Pará (Brasil)' },
  
  // África Ocidental
  costa_do_marfim: { lat: 6.82, lon: -5.28, name: 'Costa do Marfim' },
  gana: { lat: 6.68, lon: -1.62, name: 'Gana' },
  nigeria: { lat: 6.52, lon: 3.37, name: 'Nigéria' },
  camaroes: { lat: 4.05, lon: 9.70, name: 'Camarões' },
  
  // América Latina & Ásia
  equador: { lat: -1.83, lon: -79.53, name: 'Equador' },
  indonesia: { lat: -0.79, lon: 119.88, name: 'Indonésia (Sulawesi)' }
};

/**
 * Busca dados climáticos de uma região via Open-Meteo (API gratuita)
 * @param {string} regionKey - Chave da região
 * @returns {Promise<Object>} Dados climáticos
 */
async function fetchRegionClimate(regionKey) {
  const region = COCOA_REGIONS[regionKey];
  if (!region) return null;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${region.lat}&longitude=${region.lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum&timezone=auto&forecast_days=7`;
    
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;

    return {
      regiao: region.name,
      atual: {
        temperatura: data.current?.temperature_2m || null,
        umidade: data.current?.relative_humidity_2m || null,
        precipitacao: data.current?.precipitation || 0,
        chuva: data.current?.rain || 0,
        condicao: getWeatherCondition(data.current?.weather_code)
      },
      previsao_7dias: {
        temp_max_media: calcMedia(data.daily?.temperature_2m_max),
        temp_min_media: calcMedia(data.daily?.temperature_2m_min),
        precipitacao_total: calcSoma(data.daily?.precipitation_sum),
        chuva_total: calcSoma(data.daily?.rain_sum)
      }
    };
  } catch (error) {
    logger.warn(`⚠️ Erro ao buscar clima de ${regionKey}: ${error.message}`);
    return {
      regiao: region.name,
      erro: 'Dados indisponíveis',
      atual: null,
      previsao_7dias: null
    };
  }
}

/**
 * Busca dados climáticos de todas as regiões produtoras
 * @returns {Promise<Object>} Objeto com clima de todas as regiões
 */
export async function fetchAllRegionsClimate() {
  logger.info('🌤️ Buscando dados climáticos das regiões produtoras...');
  
  const climateData = {};
  const regionKeys = Object.keys(COCOA_REGIONS);
  
  // Busca em paralelo (com limite de 3 simultâneas)
  const batchSize = 3;
  for (let i = 0; i < regionKeys.length; i += batchSize) {
    const batch = regionKeys.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(key => fetchRegionClimate(key))
    );
    
    batch.forEach((key, index) => {
      climateData[key] = results[index];
    });
    
    // Pequeno delay entre batches
    if (i + batchSize < regionKeys.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  
  logger.info(`✅ Dados climáticos obtidos para ${regionKeys.length} regiões`);
  return climateData;
}

/**
 * Analisa riscos climáticos baseado nos dados
 */
export function analyzeClimateRisks(climateData) {
  const risks = [];
  const criticalRegions = [];

  for (const [key, data] of Object.entries(climateData)) {
    if (!data?.atual) continue;
    
    const region = COCOA_REGIONS[key];
    
    // Temperatura muito alta (estresse térmico)
    if (data.atual.temperatura > 35) {
      risks.push(`Temperatura extrema em ${region.name} (${data.atual.temperatura}°C)`);
      criticalRegions.push({ regiao: region.name, motivo: 'Estresse térmico - temperatura acima de 35°C' });
    }
    
    // Seca (pouca precipitação)
    if (data.previsao_7dias?.precipitacao_total < 5) {
      risks.push(`Baixa precipitação prevista em ${region.name}`);
      criticalRegions.push({ regiao: region.name, motivo: 'Risco de seca - precipitação < 5mm/7dias' });
    }
    
    // Excesso de chuva (pode afetar florada e colheita)
    if (data.previsao_7dias?.chuva_total > 150) {
      risks.push(`Excesso de chuva em ${region.name} (${data.previsao_7dias.chuva_total}mm)`);
      criticalRegions.push({ regiao: region.name, motivo: 'Excesso de chuva pode afetar florada e colheita' });
    }
    
    // Umidade muito baixa
    if (data.atual.umidade < 50) {
      risks.push(`Umidade baixa em ${region.name} (${data.atual.umidade}%)`);
    }
  }

  // Determina nível de risco global
  let riskLevel = 'baixo';
  if (criticalRegions.length >= 3) riskLevel = 'alto';
  else if (criticalRegions.length >= 1) riskLevel = 'moderado';

  return {
    risco_global: riskLevel,
    fatores: risks,
    regioes_criticas: criticalRegions
  };
}

// Helpers
function getWeatherCondition(code) {
  if (code === undefined || code === null) return 'desconhecido';
  if (code === 0) return 'céu limpo';
  if (code <= 3) return 'parcialmente nublado';
  if (code <= 49) return 'nevoeiro';
  if (code <= 69) return 'chuva';
  if (code <= 79) return 'neve';
  if (code <= 99) return 'tempestade';
  return 'variável';
}

function calcMedia(arr) {
  if (!arr || arr.length === 0) return null;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

function calcSoma(arr) {
  if (!arr || arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) * 10) / 10;
}

export default {
  COCOA_REGIONS,
  fetchRegionClimate,
  fetchAllRegionsClimate,
  analyzeClimateRisks
};
