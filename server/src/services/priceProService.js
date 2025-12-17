/**
 * PricePro Indicator Service
 * Implementação do indicador PricePro 1.0 para análise técnica avançada
 * Baseado em lógica de trading profissional
 */
import logger from '../utils/logger.js';

/**
 * Calcula RSI (Relative Strength Index)
 */
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calcula CMO (Chande Momentum Oscillator)
 */
function calculateCMO(prices, period = 14) {
  if (prices.length < period + 1) return 0;
  
  let sumUp = 0;
  let sumDown = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1];
    if (change > 0) sumUp += change;
    else sumDown += Math.abs(change);
  }
  
  if (sumUp + sumDown === 0) return 0;
  
  return ((sumUp - sumDown) / (sumUp + sumDown)) * 100;
}

/**
 * Calcula SMA (Simple Moving Average)
 */
function calculateSMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Calcula EMA (Exponential Moving Average)
 */
function calculateEMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(prices.slice(0, period), period);
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

/**
 * Calcula Bollinger Bands
 */
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  const sma = calculateSMA(prices, period);
  const slice = prices.slice(-period);
  
  const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
  const std = Math.sqrt(variance);
  
  return {
    upper: sma + (stdDev * std),
    middle: sma,
    lower: sma - (stdDev * std),
    bandwidth: ((sma + (stdDev * std)) - (sma - (stdDev * std))) / sma * 100
  };
}

/**
 * Identifica níveis de Suporte e Resistência usando Pivot Points
 */
function calculatePivotPoints(high, low, close) {
  const pivot = (high + low + close) / 3;
  
  return {
    pivot,
    resistance1: (2 * pivot) - low,
    resistance2: pivot + (high - low),
    resistance3: high + 2 * (pivot - low),
    support1: (2 * pivot) - high,
    support2: pivot - (high - low),
    support3: low - 2 * (high - pivot)
  };
}

/**
 * Detecta padrões ZigZag para identificar pontos de reversão
 */
function detectZigZag(prices, threshold = 5) {
  if (prices.length < 3) return { pivots: [], trend: 'indefinido' };
  
  const pivots = [];
  let lastPivot = { index: 0, price: prices[0], type: 'start' };
  
  for (let i = 1; i < prices.length - 1; i++) {
    const prev = prices[i - 1];
    const curr = prices[i];
    const next = prices[i + 1];
    
    // Detectar pico (resistência local)
    if (curr > prev && curr > next) {
      const change = ((curr - lastPivot.price) / lastPivot.price) * 100;
      if (Math.abs(change) >= threshold) {
        pivots.push({ index: i, price: curr, type: 'high', change: change.toFixed(2) });
        lastPivot = pivots[pivots.length - 1];
      }
    }
    
    // Detectar vale (suporte local)
    if (curr < prev && curr < next) {
      const change = ((curr - lastPivot.price) / lastPivot.price) * 100;
      if (Math.abs(change) >= threshold) {
        pivots.push({ index: i, price: curr, type: 'low', change: change.toFixed(2) });
        lastPivot = pivots[pivots.length - 1];
      }
    }
  }
  
  // Determinar tendência com base nos últimos pivots
  let trend = 'lateral';
  if (pivots.length >= 2) {
    const lastTwo = pivots.slice(-2);
    if (lastTwo[1].type === 'high' && lastTwo[1].price > lastTwo[0].price) trend = 'alta';
    else if (lastTwo[1].type === 'low' && lastTwo[1].price < lastTwo[0].price) trend = 'queda';
  }
  
  return { pivots: pivots.slice(-5), trend };
}

/**
 * Calcula níveis de Fibonacci Retracement
 */
function calculateFibonacciLevels(high, low, trend = 'alta') {
  const diff = high - low;
  
  if (trend === 'alta') {
    return {
      level_0: low,
      level_236: low + (diff * 0.236),
      level_382: low + (diff * 0.382),
      level_500: low + (diff * 0.500),
      level_618: low + (diff * 0.618),
      level_786: low + (diff * 0.786),
      level_100: high
    };
  } else {
    return {
      level_0: high,
      level_236: high - (diff * 0.236),
      level_382: high - (diff * 0.382),
      level_500: high - (diff * 0.500),
      level_618: high - (diff * 0.618),
      level_786: high - (diff * 0.786),
      level_100: low
    };
  }
}

/**
 * Gera sinais do indicador PricePro
 */
export function generatePriceProSignals(historicalData) {
  try {
    logger.info('🎯 Gerando sinais PricePro...');
    
    const prices = historicalData.map(d => d.close).filter(p => p > 0);
    const highs = historicalData.map(d => d.high).filter(p => p > 0);
    const lows = historicalData.map(d => d.low).filter(p => p > 0);
    
    if (prices.length < 20) {
      return {
        signal: 'AGUARDAR',
        strength: 0,
        error: 'Dados insuficientes para análise'
      };
    }
    
    const currentPrice = prices[prices.length - 1];
    const high = Math.max(...highs.slice(-30));
    const low = Math.min(...lows.slice(-30));
    
    // Calcular indicadores
    const rsi = calculateRSI(prices);
    const cmo = calculateCMO(prices);
    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);
    const ema9 = calculateEMA(prices, 9);
    const ema21 = calculateEMA(prices, 21);
    const bollinger = calculateBollingerBands(prices);
    const pivots = calculatePivotPoints(high, low, currentPrice);
    const zigzag = detectZigZag(prices, 3);
    const fibonacci = calculateFibonacciLevels(high, low, zigzag.trend);
    
    // Lógica de sinal PricePro
    let signal = 'NEUTRO';
    let strength = 50;
    let reasoning = [];
    
    // RSI
    if (rsi < 30) {
      reasoning.push('RSI em sobrevenda');
      strength += 15;
    } else if (rsi > 70) {
      reasoning.push('RSI em sobrecompra');
      strength -= 15;
    }
    
    // Cruzamento de EMAs
    if (ema9 > ema21 && prices[prices.length - 2] && calculateEMA(prices.slice(0, -1), 9) <= calculateEMA(prices.slice(0, -1), 21)) {
      reasoning.push('Cruzamento EMA bullish');
      strength += 20;
    } else if (ema9 < ema21 && prices[prices.length - 2] && calculateEMA(prices.slice(0, -1), 9) >= calculateEMA(prices.slice(0, -1), 21)) {
      reasoning.push('Cruzamento EMA bearish');
      strength -= 20;
    }
    
    // Posição em relação às médias
    if (currentPrice > sma20 && currentPrice > sma50) {
      reasoning.push('Preço acima das médias');
      strength += 10;
    } else if (currentPrice < sma20 && currentPrice < sma50) {
      reasoning.push('Preço abaixo das médias');
      strength -= 10;
    }
    
    // Bollinger Bands
    if (currentPrice <= bollinger.lower) {
      reasoning.push('Preço na banda inferior');
      strength += 15;
    } else if (currentPrice >= bollinger.upper) {
      reasoning.push('Preço na banda superior');
      strength -= 15;
    }
    
    // CMO
    if (cmo > 50) {
      reasoning.push('Momentum forte de alta');
      strength += 10;
    } else if (cmo < -50) {
      reasoning.push('Momentum forte de baixa');
      strength -= 10;
    }
    
    // Determinar sinal final
    strength = Math.max(0, Math.min(100, strength));
    
    if (strength >= 70) signal = 'LONG';
    else if (strength >= 60) signal = 'COMPRA_MODERADA';
    else if (strength <= 30) signal = 'SHORT';
    else if (strength <= 40) signal = 'VENDA_MODERADA';
    else signal = 'NEUTRO';
    
    // Calcular SL e TP baseado em ATR simplificado
    const atr = calculateATR(historicalData.slice(-14));
    const sl = signal.includes('LONG') || signal.includes('COMPRA') 
      ? currentPrice - (atr * 1.5)
      : currentPrice + (atr * 1.5);
    const tp = signal.includes('LONG') || signal.includes('COMPRA')
      ? currentPrice + (atr * 2.5)
      : currentPrice - (atr * 2.5);
    
    const result = {
      signal,
      strength,
      reasoning,
      currentPrice,
      indicators: {
        rsi: rsi.toFixed(2),
        cmo: cmo.toFixed(2),
        sma20: sma20.toFixed(2),
        sma50: sma50.toFixed(2),
        ema9: ema9.toFixed(2),
        ema21: ema21.toFixed(2)
      },
      bollinger: {
        upper: bollinger.upper.toFixed(2),
        middle: bollinger.middle.toFixed(2),
        lower: bollinger.lower.toFixed(2),
        bandwidth: bollinger.bandwidth.toFixed(2)
      },
      levels: {
        support: Math.max(pivots.support1, low).toFixed(2),
        resistance: Math.min(pivots.resistance1, high).toFixed(2),
        pivot: pivots.pivot.toFixed(2)
      },
      fibonacci: {
        '23.6%': fibonacci.level_236.toFixed(2),
        '38.2%': fibonacci.level_382.toFixed(2),
        '50.0%': fibonacci.level_500.toFixed(2),
        '61.8%': fibonacci.level_618.toFixed(2)
      },
      zigzag,
      stopLoss: sl.toFixed(2),
      takeProfit: tp.toFixed(2),
      riskReward: ((Math.abs(tp - currentPrice)) / (Math.abs(currentPrice - sl))).toFixed(2),
      timestamp: new Date().toISOString()
    };
    
    logger.info(`✅ Sinal PricePro: ${signal} (força: ${strength}%)`);
    
    return result;
    
  } catch (error) {
    logger.error(`❌ Erro ao gerar sinais PricePro: ${error.message}`);
    return {
      signal: 'ERRO',
      strength: 0,
      error: error.message
    };
  }
}

/**
 * Calcula ATR (Average True Range) simplificado
 */
function calculateATR(data) {
  if (data.length < 2) return 0;
  
  const ranges = data.map((d, i) => {
    if (i === 0) return d.high - d.low;
    const prev = data[i - 1];
    return Math.max(
      d.high - d.low,
      Math.abs(d.high - prev.close),
      Math.abs(d.low - prev.close)
    );
  });
  
  return ranges.reduce((a, b) => a + b, 0) / ranges.length;
}

export default {
  generatePriceProSignals,
  calculateRSI,
  calculateCMO,
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculatePivotPoints,
  detectZigZag,
  calculateFibonacciLevels
};
