/**
 * Investing.com Service
 * Serviço para buscar dados do mercado de cacau do Investing.com
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';

const INVESTING_BASE_URL = 'https://br.investing.com';
const COCOA_URL = `${INVESTING_BASE_URL}/commodities/us-cocoa`;

// Headers para simular navegador
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache'
};

/**
 * Busca o preço atual do cacau
 */
export async function fetchPrice() {
  try {
    const response = await axios.get(COCOA_URL, { 
      headers: HEADERS,
      timeout: 10000 
    });
    
    const $ = cheerio.load(response.data);
    
    // Tentar diferentes seletores
    let price = $('[data-test="instrument-price-last"]').text().trim();
    let change = $('[data-test="instrument-price-change"]').text().trim();
    let changePercent = $('[data-test="instrument-price-change-percent"]').text().trim();
    
    // Seletores alternativos
    if (!price) {
      price = $('.instrument-price_last__KQzyA').text().trim();
    }
    if (!price) {
      price = $('.text-5xl').first().text().trim();
    }
    
    // Limpar valores
    price = price.replace(/[^\d.,]/g, '').replace(',', '.');
    
    return {
      price: parseFloat(price) || null,
      change: change || '0',
      changePercent: changePercent || '0%',
      currency: 'USD',
      unit: 'ton',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.warn(`Erro ao buscar preço do Investing.com: ${error.message}`);
    return {
      price: null,
      change: '0',
      changePercent: '0%',
      currency: 'USD',
      unit: 'ton',
      error: error.message
    };
  }
}

/**
 * Busca análise técnica
 */
export async function fetchTechnicalAnalysis() {
  try {
    const url = `${COCOA_URL}-technical`;
    const response = await axios.get(url, { 
      headers: HEADERS,
      timeout: 10000 
    });
    
    const $ = cheerio.load(response.data);
    
    // Buscar resumo técnico
    let sentiment = 'neutro';
    const summaryText = $('[class*="summary"]').text().toLowerCase();
    
    if (summaryText.includes('compra forte') || summaryText.includes('strong buy')) {
      sentiment = 'compra_forte';
    } else if (summaryText.includes('compra') || summaryText.includes('buy')) {
      sentiment = 'compra';
    } else if (summaryText.includes('venda forte') || summaryText.includes('strong sell')) {
      sentiment = 'venda_forte';
    } else if (summaryText.includes('venda') || summaryText.includes('sell')) {
      sentiment = 'venda';
    }
    
    // Buscar RSI
    let rsi = null;
    $('tr').each((i, el) => {
      const text = $(el).text();
      if (text.includes('RSI')) {
        const match = text.match(/(\d+\.?\d*)/);
        if (match) rsi = parseFloat(match[1]);
      }
    });
    
    // Buscar MACD
    let macd = null;
    $('tr').each((i, el) => {
      const text = $(el).text();
      if (text.includes('MACD')) {
        const match = text.match(/([-\d]+\.?\d*)/);
        if (match) macd = parseFloat(match[1]);
      }
    });
    
    return {
      sentiment,
      rsi,
      macd,
      oscillators: {
        rsi,
        macd,
        stochastic: null
      },
      movingAverages: {
        sma20: null,
        sma50: null,
        ema20: null
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.warn(`Erro ao buscar análise técnica: ${error.message}`);
    return {
      sentiment: 'neutro',
      rsi: null,
      macd: null,
      error: error.message
    };
  }
}

/**
 * Busca notícias do mercado de cacau
 */
export async function fetchNews() {
  try {
    const url = `${INVESTING_BASE_URL}/commodities/us-cocoa-news`;
    const response = await axios.get(url, { 
      headers: HEADERS,
      timeout: 10000 
    });
    
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // Tentar diferentes seletores de artigos
    const selectors = [
      '.largeTitle .articleItem',
      '[data-test="article-item"]',
      '.js-article-item',
      'article',
      '.articleItem'
    ];
    
    for (const selector of selectors) {
      $(selector).each((i, el) => {
        if (articles.length >= 10) return false;
        
        const $el = $(el);
        let title = $el.find('a').first().text().trim();
        let url = $el.find('a').first().attr('href');
        let date = $el.find('.date, time, [class*="date"]').text().trim();
        
        if (!title) {
          title = $el.find('[class*="title"]').text().trim();
        }
        
        if (title && title.length > 10) {
          // Garantir URL completa
          if (url && !url.startsWith('http')) {
            url = INVESTING_BASE_URL + url;
          }
          
          articles.push({
            title,
            url: url || '',
            date: date || new Date().toLocaleDateString('pt-BR'),
            source: 'Investing.com'
          });
        }
      });
      
      if (articles.length > 0) break;
    }
    
    return {
      articles: articles.slice(0, 10),
      count: articles.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.warn(`Erro ao buscar notícias: ${error.message}`);
    return {
      articles: [],
      count: 0,
      error: error.message
    };
  }
}

/**
 * Busca todos os dados do Investing.com
 */
export async function fetchAllInvestingData() {
  try {
    const [price, technical, news] = await Promise.all([
      fetchPrice(),
      fetchTechnicalAnalysis(),
      fetchNews()
    ]);
    
    return {
      price,
      technical,
      news,
      source: 'Investing.com',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Erro ao buscar dados do Investing.com: ${error.message}`);
    return {
      price: null,
      technical: null,
      news: { articles: [] },
      error: error.message
    };
  }
}

export default {
  fetchPrice,
  fetchTechnicalAnalysis,
  fetchNews,
  fetchAllInvestingData
};
