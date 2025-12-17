import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('\n🧪 TESTE DO SCRAPER DE NOTÍCIAS\n');
console.log('='.repeat(50));

const { default: scraperService } = await import('../services/scraperService.js');
const { default: config } = await import('../config/index.js');

console.log(`📰 Fontes configuradas: ${config.newsSources.length}\n`);

config.newsSources.forEach((source, i) => {
  console.log(`   ${i + 1}. ${source.name}`);
});

console.log('\n' + '='.repeat(50));
console.log('\n🔍 Testando cada fonte...\n');

let totalArticles = 0;
let successSources = 0;

for (const source of config.newsSources) {
  console.log(`\n📡 ${source.name}`);
  console.log(`   URL: ${source.url}`);

  try {
    const articles = await scraperService.scrapeSource(source);

    if (articles.length > 0) {
      console.log(`   ✅ ${articles.length} artigos`);
      console.log(`   📰 "${articles[0].title.substring(0, 50)}..."`);
      totalArticles += articles.length;
      successSources++;
    } else {
      console.log(`   ⚠️  Nenhum artigo (verifique seletores)`);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }

  await new Promise(resolve => setTimeout(resolve, 1500));
}

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Resultado:`);
console.log(`   • Fontes com sucesso: ${successSources}/${config.newsSources.length}`);
console.log(`   • Total de artigos: ${totalArticles}`);
console.log('\n✅ Teste concluído!\n');

process.exit(0);
