/**
 * Teste do módulo de Opinião de Mercado
 * Uso: node src/tests/testOpinion.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('\n🧪 TESTE DE OPINIÃO DE MERCADO (GROQ AI)\n');
console.log('='.repeat(50));

const { generateOpinion, testConnection } = await import('../services/classifierService.js');

// Teste de conexão
console.log('\n📡 Verificando conexão...');
const connResult = await testConnection();

if (!connResult.success) {
  console.error('❌ Falha na conexão:', connResult.error);
  process.exit(1);
}

console.log('✅ Conexão OK!\n');

// Notícias de teste
const testNews = [
  {
    title: 'Preço do cacau atinge recorde histórico na bolsa de Nova York',
    description: 'O preço do cacau subiu 15% esta semana, atingindo US$ 8.000 por tonelada, o maior valor em 46 anos. Analistas apontam para a seca na Costa do Marfim como principal fator.',
    expectedImpact: 'alto'
  },
  {
    title: 'Costa do Marfim registra queda de 30% na produção de cacau',
    description: 'O maior produtor mundial de cacau enfrenta crise sem precedentes. Mudanças climáticas e doenças nas plantações causam perdas significativas na safra 2024/2025.',
    expectedImpact: 'alto'
  },
  {
    title: 'Dólar sobe 2% frente ao real após decisão do Fed',
    description: 'O Federal Reserve manteve juros elevados, fortalecendo o dólar globalmente. Commodities denominadas em dólar podem sofrer pressão.',
    expectedImpact: 'moderado'
  },
  {
    title: 'Nova tecnologia de fermentação melhora qualidade do cacau brasileiro',
    description: 'Pesquisadores da Ceplac desenvolvem técnica que aumenta teor de flavonoides no cacau da Bahia.',
    expectedImpact: 'baixo'
  }
];

console.log('🤖 Testando geração de opiniões...\n');

let passed = 0;
let failed = 0;

for (const news of testNews) {
  console.log(`📰 "${news.title.substring(0, 50)}..."`);
  
  try {
    const opinion = await generateOpinion(`${news.title}. ${news.description}`);
    
    if (opinion) {
      console.log(`   ✅ Score: ${opinion.opinionScore}/3`);
      console.log(`   📊 Impacto: ${opinion.globalImpact} (esperado: ${news.expectedImpact})`);
      console.log(`   💬 Opinião: ${opinion.opinionText.substring(0, 100)}...`);
      
      // Valida campos
      if (
        typeof opinion.opinionScore === 'number' &&
        opinion.opinionScore >= 0 &&
        opinion.opinionScore <= 3 &&
        typeof opinion.opinionText === 'string' &&
        opinion.opinionText.length > 0 &&
        ['baixo', 'moderado', 'alto'].includes(opinion.globalImpact)
      ) {
        passed++;
      } else {
        console.log('   ⚠️  Campos inválidos');
        failed++;
      }
    } else {
      console.log('   ❌ Falha ao gerar opinião');
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    failed++;
  }
  
  console.log();
  
  // Delay entre chamadas
  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log('='.repeat(50));
console.log(`\n📊 Resultado: ${passed}/${testNews.length} (${Math.round(passed/testNews.length*100)}%)`);

if (failed === 0) {
  console.log('\n✅ Todos os testes passaram!');
} else {
  console.log(`\n⚠️  ${failed} teste(s) falharam`);
}

process.exit(failed > 0 ? 1 : 0);
