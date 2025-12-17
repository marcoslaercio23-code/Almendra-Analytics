import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  // Identificação
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // URL única (evita duplicatas)
  url: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Fonte da notícia
  source: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      trim: true
    }
  },
  
  // Conteúdo
  description: {
    type: String,
    trim: true,
    default: ''
  },
  
  imageUrl: {
    type: String,
    trim: true
  },
  
  // Data da publicação
  publishedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Classificação IA
  classification: {
    score: {
      type: Number,
      min: 0,
      max: 3,
      default: null
    },
    label: {
      type: String,
      enum: ['não relevante', 'pouco relevante', 'relevante', 'muito relevante', 'pendente'],
      default: 'pendente'
    },
    classifiedAt: {
      type: Date
    },
    model: {
      type: String
    },
    error: {
      type: String
    }
  },

  // Opinião de Mercado (IA)
  opinion: {
    score: {
      type: Number,
      min: 0,
      max: 3,
      default: null
    },
    text: {
      type: String,
      trim: true
    },
    globalImpact: {
      type: String,
      enum: ['baixo', 'moderado', 'alto', null],
      default: null
    },
    generatedAt: {
      type: Date
    },
    model: {
      type: String
    },
    error: {
      type: String
    }
  },
  
  // Metadados
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  
  // Keywords detectadas
  keywords: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compostos para queries eficientes
newsSchema.index({ 'classification.score': -1, publishedAt: -1 });
newsSchema.index({ 'source.name': 1, publishedAt: -1 });
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ title: 'text', description: 'text' });

// Virtual para verificar se está classificado
newsSchema.virtual('isClassified').get(function() {
  return this.classification.score !== null;
});

// Método estático para buscar não classificadas
newsSchema.statics.findUnclassified = function(limit = 50) {
  return this.find({ 
    'classification.score': null,
    status: 'active'
  })
  .sort({ publishedAt: -1 })
  .limit(limit);
};

// Método estático para buscar por relevância
newsSchema.statics.findByRelevance = function(minScore = 2, limit = 20) {
  return this.find({
    'classification.score': { $gte: minScore },
    status: 'active'
  })
  .sort({ 'classification.score': -1, publishedAt: -1 })
  .limit(limit);
};

// Método de instância para classificar
newsSchema.methods.classify = async function(score, model) {
  const labels = ['não relevante', 'pouco relevante', 'relevante', 'muito relevante'];
  
  this.classification = {
    score: score,
    label: labels[score] || 'pendente',
    classifiedAt: new Date(),
    model: model
  };
  
  return this.save();
};

// Middleware pre-save para extrair keywords
newsSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    const cacauKeywords = ['cacau', 'cocoa', 'chocolate', 'amêndoa', 'commodity', 'safra', 'exportação', 'preço', 'mercado'];
    const titleLower = this.title.toLowerCase();
    
    this.keywords = cacauKeywords.filter(keyword => titleLower.includes(keyword));
  }
  next();
});

const News = mongoose.model('News', newsSchema);

export default News;
