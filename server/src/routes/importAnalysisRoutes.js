// Rotas para análise de importação profunda
import express from 'express';
import { fetchComexStat } from '../integrations/comexstatService.js';
import { fetchCotacaoDolarDia } from '../integrations/ptaxService.js';
import { fetchComtrade } from '../integrations/comtradeService.js';
import { fetchFrete } from '../integrations/fretebrasService.js';

const router = express.Router();

// Exemplo: GET /api/import/comexstat?ano=2024&ncm=18010000&tipo=importacao
router.get('/comexstat', async (req, res) => {
  try {
    const data = await fetchComexStat(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Exemplo: GET /api/import/ptax?data=12-17-2025
router.get('/ptax', async (req, res) => {
  try {
    const data = await fetchCotacaoDolarDia(req.query.data);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Exemplo: GET /api/import/comtrade?period=2024&hs=1801
router.get('/comtrade', async (req, res) => {
  try {
    const data = await fetchComtrade(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Exemplo: GET /api/import/frete?origem=Ilheus&destino=Vitoria&peso=1000
router.get('/frete', async (req, res) => {
  try {
    const data = await fetchFrete(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
