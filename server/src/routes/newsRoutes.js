import express from 'express';
import News from '../models/News.js';
import classifier from '../services/classifierService.js';
import scraperService from '../services/scraperService.js';
import cronJobs from '../jobs/cronJobs.js';
import logger from '../utils/logger.js';

const router = express.Router();

/* ============================================
   GET /api/news - Lista todas as notícias
   ============================================ */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      source,
      minScore,
      maxScore,
      status = 'active',
      sort = '-publishedAt',
      search
    } = req.query;

    const query = { status };

    if (source) {
      query['source.name'] = { $regex: source, $options: 'i' };
    }

    if (minScore !== undefined) {
      query['classification.score'] = { ...query['classification.score'], $gte: parseInt(minScore) };
    }

    if (maxScore !== undefined) {
      query['classification.score'] = { ...query['classification.score'], $lte: parseInt(maxScore) };
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await News.countDocuments(query);

    const news = await News.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    res.json({
      success: true,
      data: news,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Erro ao listar: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   GET /api/news/classified - Por relevância
   ============================================ */
router.get('/classified', async (req, res) => {
  try {
    const { minScore = 2, limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const news = await News.find({
      'classification.score': { $gte: parseInt(minScore) },
      status: 'active'
    })
      .sort({ 'classification.score': -1, publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await News.countDocuments({
      'classification.score': { $gte: parseInt(minScore) },
      status: 'active'
    });

    res.json({
      success: true,
      data: news,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   GET /api/news/stats - Estatísticas
   ============================================ */
router.get('/stats', async (req, res) => {
  try {
    const stats = await classifier.getClassificationStats();

    const bySource = await News.aggregate([
      { $match: { status: 'active' } },
      { $group: {
        _id: '$source.name',
        count: { $sum: 1 },
        avgScore: { $avg: '$classification.score' }
      }},
      { $sort: { count: -1 } }
    ]);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentCount = await News.countDocuments({
      status: 'active',
      publishedAt: { $gte: weekAgo }
    });

    res.json({
      success: true,
      data: {
        ...stats,
        bySource,
        lastWeek: recentCount
      }
    });
  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   GET /api/news/opinion/:id - Opinião de mercado
   ============================================ */
router.get('/opinion/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id).select('title opinion classification');

    if (!news) {
      return res.status(404).json({ success: false, error: 'Notícia não encontrada' });
    }

    // Se não tem opinião, gera uma
    if (!news.opinion || news.opinion.score === null || news.opinion.score === undefined) {
      logger.info(`💡 Gerando opinião para: ${news.title.substring(0, 40)}...`);
      const result = await classifier.generateOpinionForNews(req.params.id);
      
      if (result.success) {
        return res.json({
          success: true,
          data: {
            newsId: news._id,
            title: news.title,
            opinionScore: result.data.score,
            opinionText: result.data.text,
            globalImpact: result.data.globalImpact,
            generatedAt: result.data.generatedAt,
            classification: news.classification
          }
        });
      } else {
        return res.status(500).json({ success: false, error: result.error });
      }
    }

    res.json({
      success: true,
      data: {
        newsId: news._id,
        title: news.title,
        opinionScore: news.opinion.score,
        opinionText: news.opinion.text,
        globalImpact: news.opinion.globalImpact,
        generatedAt: news.opinion.generatedAt,
        classification: news.classification
      }
    });
  } catch (error) {
    logger.error(`Erro ao buscar opinião: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   GET /api/news/:id - Detalhes
   ============================================ */
router.get('/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id).select('-__v');

    if (!news) {
      return res.status(404).json({ success: false, error: 'Não encontrada' });
    }

    res.json({ success: true, data: news });
  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   POST /api/news/scrape - Executar scraping
   ============================================ */
router.post('/scrape', async (req, res) => {
  try {
    const result = await scraperService.runFullScrape();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   POST /api/news/classify-pending - Classificar pendentes
   ============================================ */
router.post('/classify-pending', async (req, res) => {
  try {
    const { limit = 20, delay = 500 } = req.body;
    const result = await classifier.classifyPendingNews(parseInt(limit), parseInt(delay));
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   POST /api/news/run-job - Job completo
   ============================================ */
router.post('/run-job', async (req, res) => {
  try {
    const result = await cronJobs.runNow();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ============================================
   DELETE /api/news/:id - Remover
   ============================================ */
router.delete('/:id', async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { status: 'deleted' },
      { new: true }
    );

    if (!news) {
      return res.status(404).json({ success: false, error: 'Não encontrada' });
    }

    res.json({ success: true, message: 'Removida' });
  } catch (error) {
    logger.error(`Erro: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
