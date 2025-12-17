import cron from 'node-cron';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import scraperService from '../services/scraperService.js';
import classifier from '../services/classifierService.js';
import { getAllRegionsClimate } from '../regions/climateService.js';
import { getAllRegionalPrices } from '../regions/priceService.js';
import { analyzeAllRegions } from '../regions/regionAnalysisService.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class CronJobs {
  constructor() {
    this.jobs = [];
    this.isRunning = {
      scraper: false,
      climate: false,
      prices: false,
      analysis: false
    };
  }

  // ═══════════════════════════════════════════════════════
  // 📰 JOBS DE NOTÍCIAS
  // ═══════════════════════════════════════════════════════

  /**
   * Job diário: Scraping + Classificação às 06:00
   */
  setupDailyScrapeJob() {
    const job = cron.schedule(config.cron.scrapeSchedule, async () => {
      if (this.isRunning.scraper) {
        logger.warn('⚠️  Job de scraping ainda em execução');
        return;
      }

      this.isRunning.scraper = true;
      logger.info('🕐 Iniciando job diário de scraping...');

      try {
        const scrapeResult = await scraperService.runFullScrape();
        logger.info(`📰 Scraping: ${scrapeResult.saved} novas notícias`);

        if (scrapeResult.saved > 0) {
          await sleep(2000);
          const classifyResult = await classifier.classifyPendingNews(50, 500);
          logger.info(`🤖 Classificação: ${classifyResult.success} notícias`);
        }

        logger.info('✅ Job diário de scraping concluído');
      } catch (error) {
        logger.error(`❌ Erro no job de scraping: ${error.message}`);
      } finally {
        this.isRunning.scraper = false;
      }
    }, {
      scheduled: false,
      timezone: 'America/Sao_Paulo'
    });

    this.jobs.push({ name: 'daily-scrape', job, schedule: config.cron.scrapeSchedule });
    return job;
  }

  /**
   * Job de retry: Reclassifica pendentes a cada 4 horas
   */
  setupRetryJob() {
    const job = cron.schedule(config.cron.retrySchedule, async () => {
      logger.info('🔄 Job de reclassificação...');

      try {
        const result = await classifier.retryFailedClassifications(10);
        logger.info(`🔄 Retry: ${result.success}/${result.retried} reclassificadas`);
      } catch (error) {
        logger.error(`❌ Erro no retry: ${error.message}`);
      }
    }, {
      scheduled: false,
      timezone: 'America/Sao_Paulo'
    });

    this.jobs.push({ name: 'retry-classification', job, schedule: config.cron.retrySchedule });
    return job;
  }

  // ═══════════════════════════════════════════════════════
  // 🌍 JOBS DE ANÁLISE REGIONAL
  // ═══════════════════════════════════════════════════════

  /**
   * Atualizar dados climáticos de todas as regiões
   */
  async updateClimateData() {
    if (this.isRunning.climate) {
      logger.warn('⚠️ Atualização de clima já em andamento');
      return;
    }

    this.isRunning.climate = true;
    logger.info('🌤️ [CRON] Iniciando atualização de dados climáticos...');

    try {
      const startTime = Date.now();
      const result = await getAllRegionsClimate();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      logger.info(`✅ [CRON] Clima atualizado: ${Object.keys(result.data).length} regiões em ${duration}s`);
      
      if (result.errors?.length > 0) {
        logger.warn(`⚠️ [CRON] Erros em ${result.errors.length} regiões`);
      }

      return result;
    } catch (error) {
      logger.error(`❌ [CRON] Erro na atualização de clima: ${error.message}`);
      throw error;
    } finally {
      this.isRunning.climate = false;
    }
  }

  /**
   * Atualizar preços regionais
   */
  async updatePriceData() {
    if (this.isRunning.prices) {
      logger.warn('⚠️ Atualização de preços já em andamento');
      return;
    }

    this.isRunning.prices = true;
    logger.info('💰 [CRON] Iniciando atualização de preços...');

    try {
      const startTime = Date.now();
      const result = await getAllRegionalPrices();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      logger.info(`✅ [CRON] Preços atualizados: ${Object.keys(result.data).length} regiões em ${duration}s`);
      
      return result;
    } catch (error) {
      logger.error(`❌ [CRON] Erro na atualização de preços: ${error.message}`);
      throw error;
    } finally {
      this.isRunning.prices = false;
    }
  }

  /**
   * Executar análise completa de todas as regiões
   */
  async runFullAnalysis() {
    if (this.isRunning.analysis) {
      logger.warn('⚠️ Análise já em andamento');
      return;
    }

    this.isRunning.analysis = true;
    logger.info('📊 [CRON] Iniciando análise completa de todas as regiões...');

    try {
      const startTime = Date.now();
      const result = await analyzeAllRegions();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      logger.info(`✅ [CRON] Análise completa: ${result.success} regiões em ${duration}s`);
      
      if (result.failed > 0) {
        logger.warn(`⚠️ [CRON] Falhas em ${result.failed} regiões`);
      }

      return result;
    } catch (error) {
      logger.error(`❌ [CRON] Erro na análise: ${error.message}`);
      throw error;
    } finally {
      this.isRunning.analysis = false;
    }
  }

  /**
   * Job diário às 07:00 - Atualização completa regional
   */
  setupDailyRegionalJob() {
    const job = cron.schedule('0 7 * * *', async () => {
      logger.info('═══════════════════════════════════════════════');
      logger.info('🌅 [CRON] Iniciando atualização diária das 07:00');
      logger.info('═══════════════════════════════════════════════');

      try {
        await this.updateClimateData();
        await sleep(5000);
        await this.updatePriceData();
        await sleep(5000);
        await this.runFullAnalysis();
        logger.info('✅ [CRON] Atualização diária das 07:00 concluída');
      } catch (error) {
        logger.error(`❌ [CRON] Erro na atualização diária: ${error.message}`);
      }
    }, {
      scheduled: false,
      timezone: 'America/Sao_Paulo'
    });

    this.jobs.push({ name: 'daily-regional', job, schedule: '0 7 * * *' });
    return job;
  }

  /**
   * Job de clima a cada 6 horas
   */
  setupClimateJob() {
    const job = cron.schedule('0 */6 * * *', async () => {
      logger.info('🌤️ [CRON] Atualização de clima programada');
      try {
        await this.updateClimateData();
      } catch (error) {
        logger.error(`Erro no cron de clima: ${error.message}`);
      }
    }, {
      scheduled: false,
      timezone: 'America/Sao_Paulo'
    });

    this.jobs.push({ name: 'climate-update', job, schedule: '0 */6 * * *' });
    return job;
  }

  /**
   * Job de preços em horário comercial (Seg-Sex, 9h-17h)
   */
  setupPricesJob() {
    const job = cron.schedule('0 9,11,13,15,17 * * 1-5', async () => {
      logger.info('💰 [CRON] Atualização de preços programada');
      try {
        await this.updatePriceData();
      } catch (error) {
        logger.error(`Erro no cron de preços: ${error.message}`);
      }
    }, {
      scheduled: false,
      timezone: 'America/Sao_Paulo'
    });

    this.jobs.push({ name: 'prices-update', job, schedule: '0 9,11,13,15,17 * * 1-5' });
    return job;
  }

  /**
   * Job de análise noturna às 19:00
   */
  setupEveningAnalysisJob() {
    const job = cron.schedule('0 19 * * *', async () => {
      logger.info('📊 [CRON] Análise noturna das 19:00');
      try {
        await this.runFullAnalysis();
      } catch (error) {
        logger.error(`Erro no cron de análise: ${error.message}`);
      }
    }, {
      scheduled: false,
      timezone: 'America/Sao_Paulo'
    });

    this.jobs.push({ name: 'evening-analysis', job, schedule: '0 19 * * *' });
    return job;
  }

  /**
   * Health check a cada 30 minutos
   */
  setupHealthCheckJob() {
    const job = cron.schedule('*/30 * * * *', () => {
      const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      logger.info(`💓 [CRON] Health check: ${now} - Sistema ativo`);
    }, {
      scheduled: false
    });

    this.jobs.push({ name: 'health-check', job, schedule: '*/30 * * * *' });
    return job;
  }

  /**
   * Inicia todos os jobs
   */
  startAll() {
    // Jobs de notícias
    this.setupDailyScrapeJob();
    this.setupRetryJob();
    
    // Jobs regionais
    this.setupDailyRegionalJob();
    this.setupClimateJob();
    this.setupPricesJob();
    this.setupEveningAnalysisJob();
    this.setupHealthCheckJob();

    this.jobs.forEach(({ name, job, schedule }) => {
      job.start();
      logger.info(`⏰ Cron "${name}" iniciado (${schedule})`);
    });

    logger.info('═══════════════════════════════════════════════');
    logger.info(`✅ ${this.jobs.length} jobs agendados:`);
    logger.info('   📰 Notícias: 06:00 (scraping) + 4h (retry)');
    logger.info('   📌 Regional: 07:00 (completo)');
    logger.info('   🌤️ Clima: a cada 6h');
    logger.info('   💰 Preços: 9h-17h (Seg-Sex)');
    logger.info('   📊 Análise: 19:00');
    logger.info('   💓 Health: a cada 30min');
    logger.info('═══════════════════════════════════════════════');
  }

  /**
   * Para todos os jobs
   */
  stopAll() {
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      logger.info(`⏹️  Cron "${name}" parado`);
    });
  }

  /**
   * Executa scraping manualmente
   */
  async runScrapeNow() {
    if (this.isRunning.scraper) {
      throw new Error('Scraping já em execução');
    }

    this.isRunning.scraper = true;

    try {
      logger.info('🚀 Executando scraping manual...');

      const scrapeResult = await scraperService.runFullScrape();
      await sleep(2000);
      const classifyResult = await classifier.classifyPendingNews(50, 500);

      return {
        scraping: scrapeResult,
        classification: classifyResult
      };
    } finally {
      this.isRunning.scraper = false;
    }
  }

  /**
   * Executa análise regional manualmente
   */
  async runRegionalNow() {
    logger.info('🚀 Executando análise regional manual...');
    
    await this.updateClimateData();
    await sleep(3000);
    await this.updatePriceData();
    await sleep(3000);
    await this.runFullAnalysis();
    
    logger.info('✅ Análise regional manual concluída');
  }

  /**
   * Status dos jobs
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobs: this.jobs.map(({ name, schedule }) => ({ name, schedule }))
    };
  }
}

const cronJobs = new CronJobs();

export default cronJobs;
