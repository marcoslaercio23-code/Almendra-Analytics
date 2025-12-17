import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('\n🧪 TESTE DE CONEXÃO GROQ AI\n');
console.log('='.repeat(50));

if (!process.env.GROQ_API_KEY) {
  console.log('❌ GROQ_API_KEY não encontrada no .env');
  console.log('\nAdicione ao server/.env:');
  console.log('GROQ_API_KEY=gsk_sua_chave_aqui');
  process.exit(1);
}

console.log('✅ GROQ_API_KEY encontrada');
console.log(`📍 Model: ${process.env.GROQ_MODEL || 'llama-3.1-8b-instant'}`);
console.log('='.repeat(50));

const { default: classifier } = await import('../services/classifierService.js');

// Teste 1: Conexão
console.log('\n📡 Teste 1: Verificando conexão...');
const connectionTest = await classifier.testConnection();

if (connectionTest.success) {
  console.log(`✅ Conexão OK! Resposta: "${connectionTest.response}"`);
} else {
  console.log(`❌ Falha: ${connectionTest.error}`);
  process.exit(1);
}

// Teste 2: Classificação
console.log('\n🤖 Teste 2: Classificando notícias...\n');

const testNews = [
  { title: 'Preço do cacau atinge recorde histórico na bolsa de Nova York', expected: 3 },
  { title: 'Costa do Marfim registra queda de 20% na produção de cacau', expected: 3 },
  { title: 'Nova fábrica de chocolate é inaugurada em São Paulo', expected: 2 },
  { title: 'Chuvas afetam plantações na Bahia', expected: 2 },
  { title: 'Bitcoin atinge nova máxima histórica', expected: 0 },
  { title: 'Seleção brasileira vence jogo amistoso', expected: 0 }
];

let correct = 0;

for (const news of testNews) {
  const score = await classifier.classifyNews(news.title);

  const emoji = score === news.expected ? '✅' :
                Math.abs(score - news.expected) <= 1 ? '⚠️' : '❌';

  if (score === news.expected) correct++;

  console.log(`${emoji} "${news.title.substring(0, 50)}..."`);
  console.log(`   Classificado: ${score} | Esperado: ${news.expected}\n`);

  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log('='.repeat(50));
console.log(`\n📊 Resultado: ${correct}/${testNews.length} (${((correct / testNews.length) * 100).toFixed(0)}%)`);
console.log('\n✅ Teste concluído!\n');

process.exit(0);
