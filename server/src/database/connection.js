import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import config from '../config/index.js';

const connectDB = async () => {
  try {
    if (!config.mongo?.uri) {
      logger.warn('⚠️  MONGO_URI não configurada. Servidor iniciará sem MongoDB (modo degradado).');
      return null;
    }

    const conn = await mongoose.connect(config.mongo.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB conectado: ${conn.connection.host}`);
    
    mongoose.connection.on('error', (err) => {
      logger.error(`❌ Erro MongoDB: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB desconectado');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB reconectado');
    });

    return conn;
  } catch (error) {
    logger.error(`❌ Falha ao conectar MongoDB: ${error.message}`);
    // Não finalize o processo: mantemos o servidor online e reportamos no /health.
    return null;
  }
};

export default connectDB;
