/**
 * 🛣️ Region Routes - Análise Regional do Cacau
 * Endpoints da API para dados regionais
 */

import express from 'express';
import { getAllRegions, getRegion, getBrazilianRegions, getGlobalRegions } from '../regions/regionList.js';
import { getClimate, getAllRegionsClimate } from '../regions/climateService.js';
import { getRegionalPrice, getAllRegionalPrices } from '../regions/priceService.js';
import { getGeopoliticalRisk, getAllGeopoliticalRisks } from '../regions/geopoliticalService.js';
import { generateRegionalAnalysis, analyzeAllRegions, getLastAnalysis, getAllSavedAnalyses } from '../regions/regionAnalysisService.js';
import { log } from '../regions/logger.js';

const router = express.Router();

/**
 * GET /api/regions
 * Lista todas as regiões disponíveis
 */
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    
    let regions;
    if (type === 'BR' || type === 'brazil') {
      regions = getBrazilianRegions();
    } else if (type === 'GLOBAL' || type === 'global') {
      regions = getGlobalRegions();
    } else {
      regions = getAllRegions();
    }

    res.json({
      success: true,
      count: regions.length,
      data: regions.map(r => ({
        id: r.id,
        name: r.name,
        country: r.country,
        state: r.state,
        type: r.type,
        coordinates: {
          latitude: r.latitude,
          longitude: r.longitude
        },
        priceUnit: r.priceUnit
      }))
    });
  } catch (error) {
    log('error', `Erro ao listar regiões: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/regions/:id
 * Obter detalhes de uma região específica
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const region = getRegion(id);

    if (!region) {
      return res.status(404).json({
        success: false,
        error: `Região não encontrada: ${id}`
      });
    }

    res.json({
      success: true,
      data: region
    });
  } catch (error) {
    log('error', `Erro ao obter região: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/regions/:id/climate
 * Obter dados climáticos de uma região
 */
router.get('/:id/climate', async (req, res) => {
  try {
    const { id } = req.params;
    const climate = await getClimate(id);

    res.json({
      success: true,
      data: climate
    });
  } catch (error) {
    log('error', `Erro ao obter clima: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/regions/:id/price
 * Obter preço de cacau de uma região
 */
router.get('/:id/price', async (req, res) => {
  try {
    const { id } = req.params;
    const price = await getRegionalPrice(id);

    res.json({
      success: true,
      data: price
    });
  } catch (error) {
    log('error', `Erro ao obter preço: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/regions/:id/geopolitical
 * Obter análise geopolítica de uma região
 */
router.get('/:id/geopolitical', async (req, res) => {
  try {
    const { id } = req.params;
    const { ai } = req.query;
    const useAI = ai !== 'false';
    
    const geopolitical = await getGeopoliticalRisk(id, useAI);

    res.json({
      success: true,
      data: geopolitical
    });
  } catch (error) {
    log('error', `Erro ao obter geopolítica: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/regions/:id/analysis
 * 📌 ANÁLISE COMPLETA - Combina clima + preço + geopolítica + IA
 */
router.get('/:id/analysis', async (req, res) => {
  try {
    const { id } = req.params;
    const { refresh } = req.query;

    // Se não for refresh, tentar buscar análise salva (menos de 1 hora)
    if (refresh !== 'true') {
      const saved = await getLastAnalysis(id);
      if (saved && saved.metadata) {
        const age = Date.now() - new Date(saved.metadata.generatedAt).getTime();
        if (age < 60 * 60 * 1000) { // 1 hora
          return res.json({
            success: true,
            fromCache: true,
            cacheAge: `${Math.round(age / 60000)} minutos`,
            data: saved
          });
        }
      }
    }

    // Gerar nova análise
    const analysis = await generateRegionalAnalysis(id);

    res.json({
      success: true,
      fromCache: false,
      data: analysis
    });
  } catch (error) {
    log('error', `Erro na análise regional: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/regions/analyze-all
 * Gerar análise para todas as regiões
 * ⚠️ Operação demorada - pode levar vários minutos
 */
router.get('/analyze-all', async (req, res) => {
  try {
    log('info', '🚀 Iniciando análise de todas as regiões...');
    
    // Responder imediatamente que a análise foi iniciada
    // Em produção, usar job queue (Bull, Agenda, etc.)
    res.json({
      success: true,
      message: 'Análise iniciada. Isso pode levar alguns minutos.',
      endpoint: '/api/regions/analysis-status'
    });

    // Executar em background (simplificado - em produção usar job queue)
    analyzeAllRegions().then(result => {
      log('info', `✅ Análise global completa: ${result.success}/${result.success + result.failed} regiões`);
    }).catch(err => {
      log('error', `❌ Erro na análise global: ${err.message}`);
    });

  } catch (error) {
    log('error', `Erro ao iniciar análise: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/regions/all/climate
 * Obter clima de todas as regiões
 */
router.get('/all/climate', async (req, res) => {
  try {
    const climate = await getAllRegionsClimate();
    res.json({
      success: true,
      ...climate
    });
  } catch (error) {
    log('error', `Erro ao obter clima global: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/regions/all/prices
 * Obter preços de todas as regiões
 */
router.get('/all/prices', async (req, res) => {
  try {
    const prices = await getAllRegionalPrices();
    res.json({
      success: true,
      ...prices
    });
  } catch (error) {
    log('error', `Erro ao obter preços: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/regions/all/geopolitical
 * Obter análise geopolítica de todas as regiões
 */
router.get('/all/geopolitical', async (req, res) => {
  try {
    const { ai } = req.query;
    const useAI = ai === 'true';
    
    const geopolitical = await getAllGeopoliticalRisks(useAI);
    res.json({
      success: true,
      ...geopolitical
    });
  } catch (error) {
    log('error', `Erro ao obter geopolítica global: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/regions/all/analysis
 * Obter todas as análises salvas
 */
router.get('/all/analysis', async (req, res) => {
  try {
    const analyses = await getAllSavedAnalyses();
    
    res.json({
      success: true,
      count: analyses.length,
      data: analyses
    });
  } catch (error) {
    log('error', `Erro ao obter análises: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/regions/analyze-batch
 * Analisar um lote de regiões específicas
 */
router.post('/analyze-batch', async (req, res) => {
  try {
    const { regions } = req.body;
    
    if (!regions || !Array.isArray(regions)) {
      return res.status(400).json({
        success: false,
        error: 'Envie um array de IDs de regiões no body: { "regions": ["ilheus", "bahia"] }'
      });
    }

    const results = {};
    const errors = [];

    for (const regionId of regions) {
      try {
        const analysis = await generateRegionalAnalysis(regionId);
        results[regionId] = analysis;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay
      } catch (err) {
        errors.push({ region: regionId, error: err.message });
      }
    }

    res.json({
      success: true,
      analyzed: Object.keys(results).length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    log('error', `Erro no batch: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
