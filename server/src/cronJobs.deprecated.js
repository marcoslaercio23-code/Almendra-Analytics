/**
 * ⏰ Cron Jobs - Análise Regional do Cacau
 * Tarefas agendadas para atualização automática de dados
 */

import cron from 'node-cron';
import { getAllRegionsClimate } from './regions/climateService.js';
import { getAllRegionalPrices } from './regions/priceService.js';
import { analyzeAllRegions } from './regions/regionAnalysisService.js';
import { log } from './regions/logger.js';

let isRunning = {
  climate: false,
  prices: false,
  analysis: false
};

/**
 * Atualizar dados climáticos de todas as regiões
 */
async function updateClimateData() {
  if (isRunning.climate) {
    log('warn', '⚠️ Atualização de clima já em andamento');
    return;
  }

  isRunning.climate = true;
  log('info', '🌤️ [CRON] Iniciando atualização de dados climáticos...');

  try {
    const startTime = Date.now();
    const result = await getAllRegionsClimate();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log('info', `✅ [CRON] Clima atualizado: ${Object.keys(result.data).length} regiões em ${duration}s`);
    
    if (result.errors.length > 0) {
      log('warn', `⚠️ [CRON] Erros em ${result.errors.length} regiões: ${result.errors.map(e => e.region).join(', ')}`);
    }

    return result;
  } catch (error) {
    log('error', `❌ [CRON] Erro na atualização de clima: ${error.message}`);
    throw error;
  } finally {
    isRunning.climate = false;
  }
}

/**
 * Atualizar preços regionais
 */
async function updatePriceData() {
  if (isRunning.prices) {
    log('warn', '⚠️ Atualização de preços já em andamento');
    return;
  }

  isRunning.prices = true;
  log('info', '💰 [CRON] Iniciando atualização de preços...');

  try {
    const startTime = Date.now();
    const result = await getAllRegionalPrices();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log('info', `✅ [CRON] Preços atualizados: ${Object.keys(result.data).length} regiões em ${duration}s`);
    
    return result;
  } catch (error) {
    log('error', `❌ [CRON] Erro na atualização de preços: ${error.message}`);
    throw error;
  } finally {
    isRunning.prices = false;
  }
}

/**
 * Executar análise completa de todas as regiões
 */
async function runFullAnalysis() {
  if (isRunning.analysis) {
    log('warn', '⚠️ Análise já em andamento');
    return;
  }

  isRunning.analysis = true;
  log('info', '📊 [CRON] Iniciando análise completa de todas as regiões...');

  try {
    const startTime = Date.now();
    const result = await analyzeAllRegions();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    log('info', `✅ [CRON] Análise completa: ${result.success} regiões em ${duration}s`);
    
    if (result.failed > 0) {
      log('warn', `⚠️ [CRON] Falhas em ${result.failed} regiões`);
    }

    return result;
  } catch (error) {
    log('error', `❌ [CRON] Erro na análise: ${error.message}`);
    throw error;
  } finally {
    isRunning.analysis = false;
  }
}

/**
 * Inicializar todos os cron jobs
 */
export function initCronJobs() {
  log('info', '⏰ Inicializando cron jobs...');

  // ═══════════════════════════════════════════════════════
  // 📌 ATUALIZAÇÃO DIÁRIA COMPLETA - 07:00
  // Atualiza clima, preços e roda análise IA
  // ═══════════════════════════════════════════════════════
  cron.schedule('0 7 * * *', async () => {
    log('info', '═══════════════════════════════════════════════');
    log('info', '🌅 [CRON] Iniciando atualização diária das 07:00');
    log('info', '═══════════════════════════════════════════════');

    try {
      // 1. Atualizar clima
      await updateClimateData();
      await sleep(5000); // Esperar 5 segundos

      // 2. Atualizar preços
      await updatePriceData();
      await sleep(5000);

      // 3. Rodar análise completa
      await runFullAnalysis();

      log('info', '✅ [CRON] Atualização diária das 07:00 concluída');
    } catch (error) {
      log('error', `❌ [CRON] Erro na atualização diária: ${error.message}`);
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // ═══════════════════════════════════════════════════════
  // 🌤️ ATUALIZAÇÃO DE CLIMA - A cada 6 horas
  // ═══════════════════════════════════════════════════════
  cron.schedule('0 */6 * * *', async () => {
    log('info', '🌤️ [CRON] Atualização de clima programada');
    try {
      await updateClimateData();
    } catch (error) {
      log('error', `Erro no cron de clima: ${error.message}`);
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // ═══════════════════════════════════════════════════════
  // 💰 ATUALIZAÇÃO DE PREÇOS - A cada 2 horas (horário comercial)
  // Segunda a Sexta, das 9h às 18h
  // ═══════════════════════════════════════════════════════
  cron.schedule('0 9,11,13,15,17 * * 1-5', async () => {
    log('info', '💰 [CRON] Atualização de preços programada');
    try {
      await updatePriceData();
    } catch (error) {
      log('error', `Erro no cron de preços: ${error.message}`);
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // ═══════════════════════════════════════════════════════
  // 📊 ANÁLISE COMPLETA - 2x por dia (07:00 e 19:00)
  // ═══════════════════════════════════════════════════════
  cron.schedule('0 19 * * *', async () => {
    log('info', '📊 [CRON] Análise noturna das 19:00');
    try {
      await runFullAnalysis();
    } catch (error) {
      log('error', `Erro no cron de análise: ${error.message}`);
    }
  }, {
    timezone: 'America/Sao_Paulo'
  });

  // ═══════════════════════════════════════════════════════
  // 🔍 HEALTH CHECK - A cada 30 minutos
  // ═══════════════════════════════════════════════════════
  cron.schedule('*/30 * * * *', () => {
    const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    log('info', `💓 [CRON] Health check: ${now} - Sistema ativo`);
  });

  log('info', '✅ Cron jobs inicializados:');
  log('info', '   📌 07:00 - Atualização completa diária');
  log('info', '   🌤️ A cada 6h - Clima');
  log('info', '   💰 9h-17h (Seg-Sex) - Preços');
  log('info', '   📊 19:00 - Análise noturna');
  log('info', '   💓 A cada 30min - Health check');
}

/**
 * Executar tarefas manualmente (para testes ou forçar atualização)
 */
export const cronTasks = {
  updateClimate: updateClimateData,
  updatePrices: updatePriceData,
  runAnalysis: runFullAnalysis,
  
  // Executar todas as tarefas
  runAll: async () => {
    log('info', '🚀 Executando todas as tarefas manualmente...');
    await updateClimateData();
    await sleep(3000);
    await updatePriceData();
    await sleep(3000);
    await runFullAnalysis();
    log('info', '✅ Todas as tarefas concluídas');
  }
};

// Utilitário para delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  initCronJobs,
  cronTasks
};
