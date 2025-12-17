import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

import config from './config/index.js';
import logger from './utils/logger.js';
import connectDB from './database/connection.js';
import cronJobs from './jobs/cronJobs.js';
// Cron jobs regionais unificados no cronJobs principal

// Routes
import newsRoutes from './routes/newsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import regionRoutes from './routes/regionRoutes.js';
import futureAnalysisRoutes from './routes/futureAnalysisRoutes.js';
import importAnalysisRoutes from './routes/importAnalysisRoutes.js';

const app = express();

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS - restrito em produção, permissivo em dev
const corsOptions = {
  origin: config.nodeEnv === 'production' 
    ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  const mongoReadyState = mongoose.connection?.readyState ?? 0;
  const mongoStatus = mongoReadyState === 1 ? 'connected' : mongoReadyState === 2 ? 'connecting' : mongoReadyState === 3 ? 'disconnecting' : 'disconnected';

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    services: {
      mongo: {
        configured: Boolean(config.mongo?.uri),
        status: mongoStatus,
        readyState: mongoReadyState,
      },
      groq: {
        configured: Boolean(config.groq?.apiKey),
        model: config.groq?.model,
      },
      cron: {
        enabled: false,
      }
    },
    missingEnvVars: config.missingEnvVars || []
  });
});

// API Routes
app.use('/api/news', newsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/analysis', futureAnalysisRoutes);
app.use('/api/import', importAnalysisRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'development' ? err.message : 'Erro interno'
  });
});

// Inicialização
const startServer = async () => {
  let cronEnabled = false;
  try {
    // MongoDB (opcional em dev)
    await connectDB();
  } catch (error) {
    logger.error(`❌ Erro ao inicializar MongoDB (modo degradado): ${error.message}`);
  }

  const mongoConnected = mongoose.connection?.readyState === 1;

  // Cron Jobs podem depender de Mongo + Groq. Em modo degradado, não iniciar.
  if (mongoConnected && config.groq?.apiKey) {
    try {
      cronJobs.startAll();
      cronEnabled = true;
    } catch (error) {
      logger.error(`❌ Falha ao iniciar cron jobs: ${error.message}`);
    }
  } else {
    logger.warn('⚠️  Cron jobs desabilitados (faltando MongoDB conectado e/ou GROQ_API_KEY)');
  }

  // HTTP Server
  app.listen(config.port, () => {
    logger.info(`
╔════════════════════════════════════════════════════╗
║  🍫 CACAU NEWS SERVER                              ║
╠════════════════════════════════════════════════════╣
║  🚀 Porta: ${String(config.port).padEnd(40)}║
║  🌍 Ambiente: ${config.nodeEnv.padEnd(37)}║
║  📊 MongoDB: ${(mongoConnected ? 'Conectado' : 'Desconectado').padEnd(36)}║
║  🤖 Groq: ${(config.groq.apiKey ? 'Configurado' : 'Não configurado').padEnd(39)}║
║  ⏰ Cron: ${(cronEnabled ? config.cron.scrapeSchedule : 'DESABILITADO').padEnd(39)}║
╠════════════════════════════════════════════════════╣
║  📰 Notícias:                                      ║
║  • GET  /api/news             - Listar             ║
║  • GET  /api/news/classified  - Por relevância     ║
║  • GET  /api/news/stats       - Estatísticas       ║
║  • POST /api/news/scrape      - Executar scraping  ║
╠════════════════════════════════════════════════════╣
║  🗺️ Análise Regional:                              ║
║  • GET  /api/regions          - Listar regiões     ║
║  • GET  /api/regions/:id/climate   - Clima         ║
║  • GET  /api/regions/:id/price     - Preço         ║
║  • GET  /api/regions/:id/analysis  - ANÁLISE FULL  ║
║  • GET  /api/regions/all/climate   - Clima global  ║
║  • GET  /api/regions/all/prices    - Preços global ║
╠════════════════════════════════════════════════════╣
║  🤖 IA:                                            ║
║  • POST /api/ai/classify      - Classificar texto  ║
║  • GET  /api/ai/test          - Testar Groq        ║
╚════════════════════════════════════════════════════╝
      `);
  });
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('⏹️  SIGTERM recebido');
  cronJobs.stopAll();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('⏹️  SIGINT recebido');
  cronJobs.stopAll();
  process.exit(0);
});

startServer();

export default app;
