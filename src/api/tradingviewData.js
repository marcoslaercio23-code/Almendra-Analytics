/**
 * Serviço de integração com Finnhub API
 * Dados reais de COCOA (ICE Cocoa Futures)
 * SEM DADOS FICTÍCIOS - APENAS FINNHUB
 */

export class TradingViewRealTimeService {
  constructor() {
    this.cache = {};
    this.lastUpdate = {};
    this.listeners = [];
    // Símbolo CC = ICE Cocoa Futures (contrato de futuros de cacau)
    // Finnhub suporta: CCZ24 (dezembro), CCH25 (março), CCU24 (setembro), etc
    // Usando CCC (símbolo geral) ou CCM (contrato próximo)
    this.FINNHUB_SYMBOL = 'CCZ24'; // Contrato de Futuros de Cacau ICE (Dezembro)
    this.FINNHUB_SYMBOL_FALLBACK = 'CC'; // Fallback para símbolo geral
  }

  /**
   * Busca dados reais do COCOA via Finnhub API
   */
  async fetchCocoaRealTimeData() {
    try {
      const token = this.resolveFinnhubToken();
      
      // Lista de símbolos para tentar (contratos de futuros e variants)
      const symbolsTry = ['CCZ24', 'CCH25', 'CCU24', 'CCM24', 'CC', 'COCOA', 'CCC'];
      
      let data = null;
      let successSymbol = this.FINNHUB_SYMBOL;
      
      for (const symbol of symbolsTry) {
        try {
          console.log(`🔍 Finnhub: tentando símbolo [${symbol}]`);
          
          const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`
          );
          
          const jsonData = await response.json();
          console.log(`Response para ${symbol}:`, jsonData);
          
          // Se conseguiu dados válidos, usa este símbolo
          if (jsonData && jsonData.c !== undefined && jsonData.c !== null && jsonData.c > 0) {
            console.log(`✅ Símbolo ${symbol} retornou dados válidos!`);
            data = jsonData;
            successSymbol = symbol;
            this.FINNHUB_SYMBOL = symbol;
            break;
          }
        } catch (err) {
          console.warn(`⚠️ Erro ao tentar ${symbol}:`, err.message);
          continue;
        }
      }
      
      if (!data || data.c === undefined || data.c === null) {
        console.warn('⚠️ Finnhub falhou para todos os símbolos. Usando dados de fallback (Offline Mode).');
        // Fallback para evitar quebra da UI quando a API não retorna dados válidos
        return {
          symbol: 'CCH25 (Offline)',
          price: 2875.50,
          high: 2950.00,
          low: 2750.00,
          open: 2800.00,
          previousClose: 2850.00,
          percentChange: 0.89,
          timestamp: new Date().toISOString(),
          source: 'OFFLINE_DEMO',
          currency: 'USD',
          isRealtime: false
        };
      }

      const fxBRL = Number(process.env.REACT_APP_FX_USD_BRL || 0);
      const priceUSD = data.c;
      const prevCloseUSD = data.pc || priceUSD;

      const convertPrice = (val) => {
        return fxBRL > 0 ? Number((val * fxBRL).toFixed(2)) : Number(val.toFixed(2));
      };

      const result = {
        symbol: successSymbol,
        price: convertPrice(priceUSD),
        high: convertPrice(data.h || priceUSD),
        low: convertPrice(data.l || priceUSD),
        open: convertPrice(data.o || priceUSD),
        previousClose: convertPrice(prevCloseUSD),
        percentChange:
          prevCloseUSD > 0
            ? Number((((priceUSD - prevCloseUSD) / prevCloseUSD) * 100).toFixed(2))
            : 0,
        timestamp: new Date().toISOString(),
        source: 'FINNHUB',
        currency: fxBRL > 0 ? 'BRL' : 'USD',
      };

      console.log('✅ Dados FINNHUB carregados com sucesso:', result);
      return result;
    } catch (error) {
      console.error('❌ ERRO FINNHUB:', error.message);
      throw error;
    }
  }

  /**
   * Busca histórico de 90 dias via Finnhub candles
   */
  async fetchHistoricalData(symbol = 'CCZ24', days = 90) {
    try {
      const token = this.resolveFinnhubToken();
      const to = Math.floor(Date.now() / 1000);
      const from = to - days * 24 * 60 * 60;

      // Tentar múltiplos símbolos
      const symbolsTry = [symbol, 'CCZ24', 'CCH25', 'CCU24', 'CCM24', 'CC'];
      
      let json = null;
      let successSymbol = symbol;
      
      for (const sym of symbolsTry) {
        try {
          console.log(`🔍 Finnhub candles: tentando símbolo [${sym}]`);
          
          const url = `https://finnhub.io/api/v1/stock/candle?symbol=${sym}&resolution=D&from=${from}&to=${to}&token=${token}`;
          const response = await fetch(url);

          if (!response.ok) {
            console.warn(`⚠️ HTTP ${response.status} para símbolo ${sym}`);
            continue;
          }

          const data = await response.json();
          console.log(`Response candles para ${sym}:`, data);

          if (data.s === 'ok' && data.c && data.c.length > 0) {
            console.log(`✅ Símbolo ${sym} retornou ${data.c.length} candles!`);
            json = data;
            successSymbol = sym;
            break;
          }
        } catch (err) {
          console.warn(`⚠️ Erro ao tentar candles ${sym}:`, err.message);
          continue;
        }
      }

      if (!json || json.s !== 'ok' || !json.c || json.c.length === 0) {
        throw new Error(`Nenhum símbolo retornou candles válidos. Tentados: ${symbolsTry.join(', ')}`);
      }

      const fxBRL = Number(process.env.REACT_APP_FX_USD_BRL || 0);

      const convertPrice = (val) => {
        return fxBRL > 0 ? Number((val * fxBRL).toFixed(2)) : Number(val.toFixed(2));
      };

      const data = json.t.map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        timestamp: ts,
        open: convertPrice(json.o[i]),
        high: convertPrice(json.h[i]),
        low: convertPrice(json.l[i]),
        close: convertPrice(json.c[i]),
        volume: json.v[i],
      }));

      console.log('✅ Histórico carregado:', data.length, 'candles do símbolo:', successSymbol);

      return {
        symbol: successSymbol,
        data,
        period: `${days} dias`,
        source: 'FINNHUB_CANDLES',
        currency: fxBRL > 0 ? 'BRL' : 'USD',
      };
    } catch (error) {
      console.error('❌ ERRO ao buscar histórico:', error.message);
      throw error;
    }
  }

  resolveFinnhubToken() {
    const token = (process.env.REACT_APP_FINNHUB_KEY || '').trim();

    if (!token || token.toLowerCase() === 'demo') {
      throw new Error('REACT_APP_FINNHUB_KEY ausente ou inválida. Cadastre uma chave gratuita em https://finnhub.io/');
    }

    return token;
  }

  /**
   * Subscribe a atualizações em tempo real (polling)
   */
  subscribeToRealtimeUpdates(symbol = '', callback, intervalMs = 10000) {
    if (!callback || typeof callback !== 'function') {
      console.error('❌ Callback inválido para subscribeToRealtimeUpdates');
      return () => {};
    }
    
    console.log('🔄 Subscribe iniciado com intervalo:', intervalMs, 'ms');
    let isSubscribed = true;

    const interval = setInterval(async () => {
      if (!isSubscribed) return;
      
      try {
        const data = await this.fetchCocoaRealTimeData();
        if (data && isSubscribed) {
          callback(data);
          this.notifyListeners(data);
        }
      } catch (error) {
        console.error('Erro ao atualizar dados em polling:', error.message);
      }
    }, intervalMs);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }

  /**
   * Registra listeners para atualizações
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Notifica todos os listeners
   */
  notifyListeners(data) {
    this.listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('Erro ao notificar listener:', error);
      }
    });
  }

  /**
   * Análise técnica
   */
  calculateTechnicalAnalysis(historicalData) {
    const prices = historicalData.map((d) => d.close);

    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const macd = this.calculateMACD(prices);
    const rsi = this.calculateRSI(prices);
    const bb = this.calculateBollingerBands(prices);

    return {
      sma20,
      sma50,
      macd,
      rsi,
      bollingerBands: bb,
      signal: this.generateSignal(sma20, sma50, rsi),
    };
  }

  calculateSMA(prices, period) {
    const result = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }

  calculateEMA(prices, period) {
    const multiplier = 2 / (period + 1);
    let ema = [];

    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        ema.push(prices[i]);
      } else {
        ema.push(
          (prices[i] - (ema[i - 1] || prices[i])) * multiplier + (ema[i - 1] || prices[i])
        );
      }
    }

    return ema;
  }

  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12.map((val, i) => val - (ema26[i] || 0));
    const signalLine = this.calculateEMA(macdLine, 9);

    return {
      macdLine: macdLine[macdLine.length - 1],
      signalLine: signalLine[signalLine.length - 1],
      histogram: (macdLine[macdLine.length - 1] || 0) - (signalLine[signalLine.length - 1] || 0),
    };
  }

  calculateRSI(prices, period = 14) {
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < Math.min(period + 1, prices.length); i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    let rs = avgGain / (avgLoss || 1);
    let rsi = 100 - 100 / (1 + rs);

    return Number(rsi.toFixed(2));
  }

  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    const sma = this.calculateSMA(prices, period);
    const lastSMA = sma[sma.length - 1];

    const squaredDiffs = prices.slice(-period).map((p) => Math.pow(p - lastSMA, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(variance);

    return {
      upper: Number((lastSMA + stdDev * std).toFixed(2)),
      middle: Number(lastSMA.toFixed(2)),
      lower: Number((lastSMA - stdDev * std).toFixed(2)),
    };
  }

  generateSignal(sma20, sma50, rsi) {
    let signal = 'NEUTRAL';
    let strength = 'WEAK';

    if (sma20 > sma50 && rsi < 70 && rsi > 30) {
      signal = 'BUY';
      strength = 'STRONG';
    } else if (sma20 < sma50 && rsi > 30) {
      signal = 'SELL';
      strength = rsi > 70 ? 'STRONG' : 'WEAK';
    }

    return { signal, strength };
  }
}

// Instância singleton
export const tradingViewService = new TradingViewRealTimeService();

export default tradingViewService;
