import axios from 'axios';
import * as cheerio from 'cheerio';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import News from '../models/News.js';

class ScraperService {
  constructor() {
    this.httpClient = axios.create({
      timeout: config.scraper.timeout,
      headers: {
        'User-Agent': config.scraper.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      }
    });
  }

  /**
   * Faz scraping de uma única fonte
   */
  async scrapeSource(source) {
    const articles = [];

    try {
      logger.info(`🔍 Scraping: ${source.name}`);

      const response = await this.httpClient.get(source.url);
      const $ = cheerio.load(response.data);

      $(source.selectors.articles).each((index, element) => {
        try {
          const $el = $(element);

          // Extrai título
          let title = '';
          const titleEl = $el.find(source.selectors.title).first();
          title = titleEl.text().trim() || $el.find('h2, h3').first().text().trim();

          if (!title) return;

          // Filtro por keywords (se configurado)
          if (source.filterKeywords && source.filterKeywords.length > 0) {
            const titleLower = title.toLowerCase();
            const hasKeyword = source.filterKeywords.some(kw => titleLower.includes(kw.toLowerCase()));
            if (!hasKeyword) return;
          }

          // Extrai link
          let url = '';
          const linkEl = $el.find(source.selectors.link).first();
          url = linkEl.attr('href') || $el.find('a').first().attr('href') || '';

          // Normaliza URL
          if (url && !url.startsWith('http')) {
            const baseUrl = new URL(source.url);
            url = new URL(url, baseUrl.origin).href;
          }

          if (!url) return;

          // Extrai data
          let publishedAt = new Date();
          const dateEl = $el.find(source.selectors.date).first();
          const dateText = dateEl.attr('datetime') || dateEl.text().trim();
          if (dateText) {
            const parsedDate = new Date(dateText);
            if (!isNaN(parsedDate.getTime())) {
              publishedAt = parsedDate;
            }
          }

          // Extrai descrição
          let description = '';
          const descEl = $el.find('p, .excerpt, .summary, .description').first();
          description = descEl.text().trim().substring(0, 500);

          articles.push({
            title,
            url,
            description,
            publishedAt,
            source: {
              name: source.name,
              url: source.url
            }
          });
        } catch (err) {
          logger.debug(`Erro ao parsear artigo: ${err.message}`);
        }
      });

      logger.info(`✅ ${source.name}: ${articles.length} artigos`);

    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        logger.warn(`⚠️  ${source.name}: Site inacessível`);
      } else if (error.response?.status === 403) {
        logger.warn(`⚠️  ${source.name}: Bloqueado (403)`);
      } else if (error.response?.status === 404) {
        logger.warn(`⚠️  ${source.name}: Não encontrado (404)`);
      } else {
        logger.error(`❌ ${source.name}: ${error.message}`);
      }
    }

    return articles;
  }

  /**
   * Faz scraping de todas as fontes
   */
  async scrapeAllSources() {
    const allArticles = [];

    logger.info('🚀 Iniciando varredura de todas as fontes...');

    for (const source of config.newsSources) {
      const articles = await this.scrapeSource(source);
      allArticles.push(...articles);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info(`📰 Total coletado: ${allArticles.length} artigos`);

    // Remove duplicatas por URL
    const uniqueArticles = this.removeDuplicates(allArticles);
    logger.info(`📰 Após deduplicação: ${uniqueArticles.length} artigos`);

    return uniqueArticles;
  }

  /**
   * Remove duplicatas por URL
   */
  removeDuplicates(articles) {
    const seen = new Set();
    return articles.filter(article => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });
  }

  /**
   * Salva artigos no banco
   */
  async saveArticles(articles) {
    const stats = { saved: 0, duplicates: 0, errors: 0 };

    for (const article of articles) {
      try {
        const existing = await News.findOne({ url: article.url });

        if (existing) {
          stats.duplicates++;
          continue;
        }

        const news = new News(article);
        await news.save();
        stats.saved++;

      } catch (error) {
        if (error.code === 11000) {
          stats.duplicates++;
        } else {
          logger.error(`Erro ao salvar: ${error.message}`);
          stats.errors++;
        }
      }
    }

    logger.info(`💾 Salvos: ${stats.saved} | Duplicatas: ${stats.duplicates} | Erros: ${stats.errors}`);

    return stats;
  }

  /**
   * Executa scraping completo
   */
  async runFullScrape() {
    const startTime = Date.now();

    try {
      const articles = await this.scrapeAllSources();
      const stats = await this.saveArticles(articles);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      logger.info(`✅ Scraping completo em ${duration}s`);

      return {
        success: true,
        duration: `${duration}s`,
        ...stats
      };
    } catch (error) {
      logger.error(`❌ Erro no scraping: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const scraperService = new ScraperService();

export default scraperService;
