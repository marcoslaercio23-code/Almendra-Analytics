/**
 * 📦 RegionalAnalysis Model - Análise Regional do Cacau
 * Schema MongoDB para armazenar análises regionais
 */

import mongoose from 'mongoose';

const RegionalAnalysisSchema = new mongoose.Schema({
  // Identificação da região
  region: {
    id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    state: { type: String },
    country: { type: String, required: true },
    type: { type: String, enum: ['BR', 'GLOBAL'], required: true },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },

  // Dados climáticos
  climate: {
    current: {
      temperature: { type: Number },
      windSpeed: { type: Number },
      windDirection: { type: Number },
      weatherCode: { type: Number },
      weatherDescription: { type: String },
      time: { type: String }
    },
    last48h: {
      avgTemperature: { type: Number },
      minTemperature: { type: Number },
      maxTemperature: { type: Number },
      totalPrecipitation: { type: Number },
      avgHumidity: { type: Number }
    },
    forecast72h: {
      avgTemperature: { type: Number },
      minTemperature: { type: Number },
      maxTemperature: { type: Number },
      totalPrecipitation: { type: Number }
    },
    risk: {
      level: { type: String, enum: ['alto', 'moderado', 'baixo'] },
      score: { type: Number },
      factors: [{ type: String }],
      summary: { type: String }
    },
    error: { type: String }
  },

  // Dados de preço
  price: {
    value: { type: Number },
    unit: { type: String },
    currency: { type: String, enum: ['BRL', 'USD'] },
    variation: {
      day: { type: Number },
      week: { type: Number },
      dayPercent: { type: String },
      weekPercent: { type: String }
    },
    trend: { type: String, enum: ['alta', 'queda', 'estável'] },
    sources: [{
      name: { type: String },
      price: { type: Number },
      unit: { type: String }
    }],
    error: { type: String }
  },

  // Dados geopolíticos
  geopolitical: {
    risk: {
      overall: { type: String, enum: ['alto', 'moderado', 'baixo', 'desconhecido'] },
      logistics: { type: String },
      conflict: { type: String },
      trade: { type: String }
    },
    factors: [{ type: String }],
    exports: {
      main: { type: String },
      international: { type: String }
    },
    error: { type: String }
  },

  // Notícias relacionadas
  news: {
    count: { type: Number, default: 0 },
    recent: [{
      title: { type: String },
      source: { type: mongoose.Schema.Types.Mixed },
      date: { type: Date }
    }]
  },

  // ✅ Certificado de Movimento do Cacau
  movementCertificate: {
    status: { type: String },
    direction: { type: String },
    score: { type: Number },
    label: { type: String },
    message: { type: String },
    metrics: {
      changePercent7d: { type: Number },
      volatilityPercent7d: { type: Number },
      zigzagTrend: { type: String }
    },
    generatedAt: { type: Date }
  },

  // Análise da IA
  analysis: {
    region: { type: String },
    riskLevel: { type: String, enum: ['alto', 'moderado', 'baixo'] },
    summary: { type: String },
    climateImpact: { type: String },
    geopoliticalImpact: { type: String },
    priceTrend: { type: String, enum: ['alta', 'queda', 'estável'] },
    priceJustification: { type: String },
    recommendation: { type: String },
    outlook: {
      shortTerm: { type: String },
      mediumTerm: { type: String }
    },
    keyFactors: [{ type: String }],
    confidenceLevel: { type: String, enum: ['alto', 'médio', 'baixo'] },
    generatedBy: { type: String },
    timestamp: { type: Date }
  },

  // Metadados
  metadata: {
    generatedAt: { type: Date, default: Date.now, index: true },
    processingTime: { type: String },
    dataQuality: {
      score: { type: String },
      percentage: { type: Number },
      level: { type: String }
    }
  }
}, {
  timestamps: true,
  collection: 'regional_analyses'
});

// Índices compostos
RegionalAnalysisSchema.index({ 'region.id': 1, 'metadata.generatedAt': -1 });
RegionalAnalysisSchema.index({ 'region.type': 1 });
RegionalAnalysisSchema.index({ 'analysis.riskLevel': 1 });
RegionalAnalysisSchema.index({ 'analysis.priceTrend': 1 });

// Método estático para buscar última análise de uma região
RegionalAnalysisSchema.statics.getLatest = function(regionId) {
  return this.findOne({ 'region.id': regionId })
    .sort({ 'metadata.generatedAt': -1 })
    .lean();
};

// Método estático para buscar análises por nível de risco
RegionalAnalysisSchema.statics.getByRiskLevel = function(riskLevel) {
  return this.find({ 'analysis.riskLevel': riskLevel })
    .sort({ 'metadata.generatedAt': -1 })
    .lean();
};

// Método estático para resumo global
RegionalAnalysisSchema.statics.getGlobalSummary = async function() {
  const pipeline = [
    {
      $group: {
        _id: '$analysis.riskLevel',
        count: { $sum: 1 },
        regions: { $push: '$region.name' }
      }
    }
  ];
  return this.aggregate(pipeline);
};

// Virtual para idade da análise
RegionalAnalysisSchema.virtual('ageMinutes').get(function() {
  if (!this.metadata?.generatedAt) return null;
  return Math.round((Date.now() - new Date(this.metadata.generatedAt).getTime()) / 60000);
});

// Garantir que virtuals sejam incluídos no JSON
RegionalAnalysisSchema.set('toJSON', { virtuals: true });
RegionalAnalysisSchema.set('toObject', { virtuals: true });

const RegionalAnalysis = mongoose.model('RegionalAnalysis', RegionalAnalysisSchema);

export default RegionalAnalysis;
