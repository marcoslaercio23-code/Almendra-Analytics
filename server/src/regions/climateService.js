/**
 * 🌤️ Climate Service - Análise Regional do Cacau
 * Busca dados climáticos da API Open-Meteo para cada região
 */

import { getRegion, getAllRegions } from './regionList.js';
import { log } from './logger.js';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

/**
 * Buscar clima atual de uma região específica
 * @param {string} regionId - ID da região
 * @returns {Promise<Object>} Dados climáticos
 */
export async function getClimate(regionId) {
  const region = getRegion(regionId);
  if (!region) {
    throw new Error(`Região não encontrada: ${regionId}`);
  }

  try {
    const url = `${OPEN_METEO_BASE}?latitude=${region.latitude}&longitude=${region.longitude}&hourly=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,cloud_cover&current_weather=true&timezone=${encodeURIComponent(region.timezone || 'auto')}&past_days=2&forecast_days=3`;
    
    log('info', `🌤️ Buscando clima para ${region.name}...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro na API Open-Meteo: ${response.status}`);
    }

    const data = await response.json();
    
    // Processar dados
    const result = processClimateData(data, region);
    
    log('info', `✅ Clima obtido: ${region.name} - ${result.current.temperature}°C`);
    
    return result;
    
  } catch (error) {
    log('error', `❌ Erro ao buscar clima para ${region.name}: ${error.message}`);
    throw error;
  }
}

/**
 * Processar dados brutos da API em formato útil
 */
function processClimateData(data, region) {
  const { current_weather, hourly } = data;
  const now = new Date();
  
  // Encontrar índice da hora atual
  const currentHourIndex = hourly.time.findIndex(t => {
    const time = new Date(t);
    return time.getHours() === now.getHours() && 
           time.getDate() === now.getDate();
  }) || hourly.time.length - 24;

  // Últimas 48 horas
  const last48hStart = Math.max(0, currentHourIndex - 48);
  const last48h = {
    temperatures: hourly.temperature_2m.slice(last48hStart, currentHourIndex),
    humidity: hourly.relative_humidity_2m.slice(last48hStart, currentHourIndex),
    precipitation: hourly.precipitation.slice(last48hStart, currentHourIndex),
    rain: hourly.rain?.slice(last48hStart, currentHourIndex) || []
  };

  // Próximas 72 horas (3 dias)
  const next72h = {
    temperatures: hourly.temperature_2m.slice(currentHourIndex, currentHourIndex + 72),
    humidity: hourly.relative_humidity_2m.slice(currentHourIndex, currentHourIndex + 72),
    precipitation: hourly.precipitation.slice(currentHourIndex, currentHourIndex + 72)
  };

  // Calcular médias e totais
  const avgTemp48h = average(last48h.temperatures);
  const totalPrecip48h = sum(last48h.precipitation);
  const avgHumidity48h = average(last48h.humidity);
  
  const avgTempNext72h = average(next72h.temperatures);
  const totalPrecipNext72h = sum(next72h.precipitation);

  // Análise de risco climático
  const climateRisk = analyzeClimateRisk({
    temperature: current_weather.temperature,
    avgTemp48h,
    totalPrecip48h,
    avgHumidity48h,
    region
  });

  return {
    region: {
      id: region.id,
      name: region.name,
      country: region.country,
      coordinates: {
        latitude: region.latitude,
        longitude: region.longitude
      }
    },
    current: {
      temperature: current_weather.temperature,
      windSpeed: current_weather.windspeed,
      windDirection: current_weather.winddirection,
      weatherCode: current_weather.weathercode,
      weatherDescription: getWeatherDescription(current_weather.weathercode),
      time: current_weather.time
    },
    last48h: {
      avgTemperature: round(avgTemp48h),
      minTemperature: Math.min(...last48h.temperatures),
      maxTemperature: Math.max(...last48h.temperatures),
      totalPrecipitation: round(totalPrecip48h),
      avgHumidity: round(avgHumidity48h)
    },
    forecast72h: {
      avgTemperature: round(avgTempNext72h),
      minTemperature: Math.min(...next72h.temperatures),
      maxTemperature: Math.max(...next72h.temperatures),
      totalPrecipitation: round(totalPrecipNext72h)
    },
    risk: climateRisk,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Analisar risco climático para produção de cacau
 */
function analyzeClimateRisk({ temperature, avgTemp48h, totalPrecip48h, avgHumidity48h, region }) {
  let riskLevel = 'baixo';
  const factors = [];
  let score = 0;

  // Temperatura ideal para cacau: 20-30°C
  if (temperature > 35) {
    factors.push('Temperatura muito alta (>35°C) - stress térmico');
    score += 3;
  } else if (temperature > 32) {
    factors.push('Temperatura elevada (>32°C)');
    score += 1;
  } else if (temperature < 18) {
    factors.push('Temperatura baixa (<18°C) - crescimento reduzido');
    score += 2;
  }

  // Precipitação ideal: 1500-2500mm/ano (~4-7mm/dia)
  const dailyPrecip = totalPrecip48h / 2;
  if (dailyPrecip < 1) {
    factors.push('Seca - precipitação muito baixa');
    score += 3;
  } else if (dailyPrecip < 3) {
    factors.push('Precipitação abaixo do ideal');
    score += 1;
  } else if (dailyPrecip > 15) {
    factors.push('Chuva excessiva - risco de doenças fúngicas');
    score += 2;
  }

  // Umidade ideal: 70-80%
  if (avgHumidity48h < 60) {
    factors.push('Umidade baixa');
    score += 1;
  } else if (avgHumidity48h > 90) {
    factors.push('Umidade muito alta - risco de fungos');
    score += 2;
  }

  // Determinar nível de risco
  if (score >= 4) {
    riskLevel = 'alto';
  } else if (score >= 2) {
    riskLevel = 'moderado';
  }

  return {
    level: riskLevel,
    score,
    factors,
    summary: factors.length > 0 
      ? factors.join('; ')
      : 'Condições climáticas favoráveis para cacau'
  };
}

/**
 * Buscar clima de todas as regiões
 */
export async function getAllRegionsClimate() {
  const regions = getAllRegions();
  const results = {};
  const errors = [];

  log('info', `🌍 Buscando clima para ${regions.length} regiões...`);

  // Processar em paralelo com limite de 3 requisições simultâneas
  const batchSize = 3;
  for (let i = 0; i < regions.length; i += batchSize) {
    const batch = regions.slice(i, i + batchSize);
    const promises = batch.map(async (region) => {
      try {
        const climate = await getClimate(region.id);
        return { id: region.id, data: climate, error: null };
      } catch (error) {
        return { id: region.id, data: null, error: error.message };
      }
    });

    const batchResults = await Promise.all(promises);
    
    for (const result of batchResults) {
      if (result.data) {
        results[result.id] = result.data;
      } else {
        errors.push({ region: result.id, error: result.error });
      }
    }

    // Delay entre batches para não sobrecarregar a API
    if (i + batchSize < regions.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  log('info', `✅ Clima obtido para ${Object.keys(results).length}/${regions.length} regiões`);
  
  if (errors.length > 0) {
    log('warn', `⚠️ Erros em ${errors.length} regiões`);
  }

  return {
    data: results,
    errors,
    summary: generateClimateSummary(results),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Gerar resumo climático global
 */
function generateClimateSummary(climateData) {
  const regions = Object.values(climateData);
  const highRisk = regions.filter(r => r.risk.level === 'alto');
  const moderateRisk = regions.filter(r => r.risk.level === 'moderado');

  return {
    totalRegions: regions.length,
    highRiskCount: highRisk.length,
    moderateRiskCount: moderateRisk.length,
    lowRiskCount: regions.length - highRisk.length - moderateRisk.length,
    highRiskRegions: highRisk.map(r => r.region.name),
    avgTemperature: round(average(regions.map(r => r.current.temperature))),
    globalRiskLevel: highRisk.length >= 3 ? 'alto' : moderateRisk.length >= 4 ? 'moderado' : 'baixo'
  };
}

/**
 * Descrição do código de clima (WMO)
 */
function getWeatherDescription(code) {
  const descriptions = {
    0: 'Céu limpo',
    1: 'Predominantemente limpo',
    2: 'Parcialmente nublado',
    3: 'Nublado',
    45: 'Neblina',
    48: 'Neblina com geada',
    51: 'Garoa leve',
    53: 'Garoa moderada',
    55: 'Garoa intensa',
    61: 'Chuva leve',
    63: 'Chuva moderada',
    65: 'Chuva forte',
    71: 'Neve leve',
    73: 'Neve moderada',
    75: 'Neve forte',
    80: 'Pancadas leves',
    81: 'Pancadas moderadas',
    82: 'Pancadas fortes',
    95: 'Tempestade',
    96: 'Tempestade com granizo leve',
    99: 'Tempestade com granizo forte'
  };
  return descriptions[code] || 'Desconhecido';
}

// Utilitários
function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function sum(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0);
}

function round(num, decimals = 1) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export default {
  getClimate,
  getAllRegionsClimate
};
