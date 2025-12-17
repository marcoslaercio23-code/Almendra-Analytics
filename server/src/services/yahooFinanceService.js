/**
 * Yahoo Finance Service
 * Obtém histórico de preços do cacau para análise
 */
import axios from 'axios';
import logger from '../utils/logger.js';

// Símbolo do cacau no Yahoo Finance
const COCOA_SYMBOL = 'CC=F';

/**
 * Busca dados históricos do Yahoo Finance
 * @param {string} period - '1d', '5d', '1mo', '3mo', '6mo', '1y'
 * @param {string} interval - '1m', '5m', '15m', '1h', '1d'
 */
export async function fetchHistoricalData(period = '1mo', interval = '1d') {
  try {
    logger.info(`📊 Buscando histórico do cacau (${period}, ${interval})...`);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${COCOA_SYMBOL}`;
    
    const response = await axios.get(url, {
      params: {
        period1: Math.floor((Date.now() - getPeriodMs(period)) / 1000),
        period2: Math.floor(Date.now() / 1000),
        interval,
        includePrePost: false
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const result = response.data?.chart?.result?.[0];
    
    if (!result) {
      throw new Error('Dados não disponíveis');
    }
    
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const { open, high, low, close, volume } = quotes;
    
    // Formatar dados
    const data = timestamps.map((ts, i) => ({
      timestamp: new Date(ts * 1000).toISOString(),
      date: new Date(ts * 1000).toLocaleDateString('pt-BR'),
      open: open?.[i] || 0,
      high: high?.[i] || 0,
      low: low?.[i] || 0,
      close: close?.[i] || 0,
      volume: volume?.[i] || 0
    })).filter(d => d.close > 0);
    
    // Calcular estatísticas
    const prices = data.map(d => d.close);
    const lastPrice = prices[prices.length - 1] || 0;
    const firstPrice = prices[0] || lastPrice;
    
    const stats = {
      currentPrice: lastPrice,
      startPrice: firstPrice,
      change: lastPrice - firstPrice,
      changePercent: firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2) : 0,
      high: Math.max(...prices),
      low: Math.min(...prices),
      average: prices.reduce((a, b) => a + b, 0) / prices.length,
      volatility: calculateVolatility(prices)
    };
    
    logger.info(`✅ Histórico obtido: ${data.length} pontos, preço atual: $${lastPrice}`);
    
    return {
      success: true,
      symbol: COCOA_SYMBOL,
      period,
      interval,
      dataPoints: data.length,
      data,
      stats,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error(`❌ Erro ao buscar histórico: ${error.message}`);
    return {
      success: false,
      error: error.message,
      data: [],
      stats: {}
    };
  }
}

/**
 * Busca dados de múltiplos períodos para análise completa
 */
export async function fetchMultiPeriodData() {
  try {
    logger.info('📊 Buscando dados multi-período...');
    
    // Buscar em paralelo
    const [data24h, data7d, data30d] = await Promise.all([
      fetchHistoricalData('1d', '15m'),   // 24h com intervalos de 15min
      fetchHistoricalData('5d', '1h'),    // 5 dias com intervalos de 1h
      fetchHistoricalData('1mo', '1d')    // 1 mês com intervalos diários
    ]);
    
    return {
      success: true,
      periods: {
        '24h': {
          ...data24h.stats,
          trend: getTrend(data24h.stats?.changePercent),
          data: data24h.data?.slice(-24) || []
        },
        '7d': {
          ...data7d.stats,
          trend: getTrend(data7d.stats?.changePercent),
          data: data7d.data || []
        },
        '30d': {
          ...data30d.stats,
          trend: getTrend(data30d.stats?.changePercent),
          data: data30d.data || []
        }
      },
      currentPrice: data24h.stats?.currentPrice || data7d.stats?.currentPrice || 0,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error(`❌ Erro ao buscar multi-período: ${error.message}`);
    return {
      success: false,
      error: error.message,
      periods: {}
    };
  }
}

/**
 * Converte período para milissegundos
 */
function getPeriodMs(period) {
  const periods = {
    '1d': 24 * 60 * 60 * 1000,
    '5d': 5 * 24 * 60 * 60 * 1000,
    '1mo': 30 * 24 * 60 * 60 * 1000,
    '3mo': 90 * 24 * 60 * 60 * 1000,
    '6mo': 180 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000
  };
  return periods[period] || periods['1mo'];
}

/**
 * Calcula volatilidade (desvio padrão)
 */
function calculateVolatility(prices) {
  if (prices.length < 2) return 0;
  
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const squaredDiffs = prices.map(p => Math.pow(p - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  
  return Math.sqrt(avgSquaredDiff).toFixed(2);
}

/**
 * Determina tendência baseado na variação
 */
function getTrend(changePercent) {
  const change = parseFloat(changePercent) || 0;
  if (change > 2) return 'alta_forte';
  if (change > 0.5) return 'alta';
  if (change < -2) return 'queda_forte';
  if (change < -0.5) return 'queda';
  return 'lateral';
}

export default {
  fetchHistoricalData,
  fetchMultiPeriodData
};
