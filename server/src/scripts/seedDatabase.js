import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('\n🌱 POPULANDO BANCO COM DADOS DE EXEMPLO\n');
console.log('='.repeat(50));

const { default: connectDB } = await import('../database/connection.js');
const { default: News } = await import('../models/News.js');

const sampleNews = [
  {
    title: 'Preço do cacau dispara 15% em uma semana na bolsa de Nova York',
    url: 'https://example.com/news/1',
    description: 'O preço do cacau atingiu US$ 3.200 por tonelada, maior valor em 10 anos.',
    source: { name: 'Seed Data', url: 'https://example.com' },
    publishedAt: new Date(),
    classification: { score: 3, label: 'muito relevante', model: 'seed' }
  },
  {
    title: 'Costa do Marfim anuncia previsão de safra recorde para 2025',
    url: 'https://example.com/news/2',
    description: 'Maior produtor mundial espera colher 2,5 milhões de toneladas.',
    source: { name: 'Seed Data', url: 'https://example.com' },
    publishedAt: new Date(Date.now() - 86400000),
    classification: { score: 3, label: 'muito relevante', model: 'seed' }
  },
  {
    title: 'Brasil aumenta exportações de cacau para Europa',
    url: 'https://example.com/news/3',
    description: 'Exportações cresceram 12% no último trimestre.',
    source: { name: 'Seed Data', url: 'https://example.com' },
    publishedAt: new Date(Date.now() - 172800000),
    classification: { score: 2, label: 'relevante', model: 'seed' }
  },
  {
    title: 'Nova tecnologia promete aumentar produtividade do cacau',
    url: 'https://example.com/news/4',
    description: 'Startup brasileira desenvolve sistema de irrigação inteligente.',
    source: { name: 'Seed Data', url: 'https://example.com' },
    publishedAt: new Date(Date.now() - 259200000),
    classification: { score: 2, label: 'relevante', model: 'seed' }
  },
  {
    title: 'Festival de chocolate movimenta turismo na Bahia',
    url: 'https://example.com/news/5',
    description: 'Evento reúne produtores e chocolatiers de todo o país.',
    source: { name: 'Seed Data', url: 'https://example.com' },
    publishedAt: new Date(Date.now() - 345600000),
    classification: { score: 1, label: 'pouco relevante', model: 'seed' }
  },
  {
    title: 'Chuvas atrasam colheita em Gana',
    url: 'https://example.com/news/6',
    description: 'Segundo maior produtor mundial enfrenta problemas climáticos.',
    source: { name: 'Seed Data', url: 'https://example.com' },
    publishedAt: new Date(Date.now() - 432000000),
    classification: { score: 3, label: 'muito relevante', model: 'seed' }
  }
];

try {
  console.log('\n📦 Conectando ao MongoDB...');
  await connectDB();

  console.log('\n🗑️  Limpando dados anteriores...');
  await News.deleteMany({ 'source.name': 'Seed Data' });

  console.log('\n📝 Inserindo dados de exemplo...\n');

  for (const newsData of sampleNews) {
    const news = new News(newsData);
    await news.save();
    console.log(`   ✅ ${newsData.title.substring(0, 50)}...`);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n✅ ${sampleNews.length} notícias inseridas!`);
  console.log('\n💡 Acesse http://localhost:4000/api/news para visualizar.\n');

} catch (error) {
  console.error(`\n❌ Erro: ${error.message}\n`);
  process.exit(1);
}

process.exit(0);
