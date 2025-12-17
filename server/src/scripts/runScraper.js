import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('\n🚀 EXECUTANDO SCRAPING MANUAL\n');
console.log('='.repeat(50));

const { default: connectDB } = await import('../database/connection.js');
const { default: scraperService } = await import('../services/scraperService.js');
const { default: classifier } = await import('../services/classifierService.js');

try {
  console.log('\n📦 Conectando ao MongoDB...');
  await connectDB();

  console.log('\n🔍 Iniciando varredura...\n');
  const scrapeResult = await scraperService.runFullScrape();

  console.log('\n📊 Resultado do Scraping:');
  console.log(`   ✅ Salvas: ${scrapeResult.saved}`);
  console.log(`   🔁 Duplicatas: ${scrapeResult.duplicates}`);
  console.log(`   ❌ Erros: ${scrapeResult.errors}`);
  console.log(`   ⏱️  Duração: ${scrapeResult.duration}`);

  if (scrapeResult.saved > 0) {
    console.log('\n🤖 Iniciando classificação...\n');

    const classifyResult = await classifier.classifyPendingNews(
      Math.min(scrapeResult.saved, 30),
      500
    );

    console.log('\n📊 Resultado da Classificação:');
    console.log(`   ✅ Sucesso: ${classifyResult.success}`);
    console.log(`   ❌ Erros: ${classifyResult.errors}`);
  }

  const stats = await classifier.getClassificationStats();

  console.log('\n📈 Estatísticas do Banco:');
  console.log(`   📰 Total: ${stats.total}`);
  console.log(`   ✅ Classificadas: ${stats.classified} (${stats.percentClassified}%)`);
  console.log(`   ⏳ Pendentes: ${stats.pending}`);

  if (Object.keys(stats.distribution).length > 0) {
    console.log('\n   Distribuição:');
    Object.entries(stats.distribution).forEach(([label, count]) => {
      console.log(`      • ${label}: ${count}`);
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Scraping concluído!\n');

} catch (error) {
  console.error(`\n❌ Erro: ${error.message}\n`);
  process.exit(1);
}

process.exit(0);
