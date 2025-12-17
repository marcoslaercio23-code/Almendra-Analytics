/**
 * Teste da Análise Avançada de Mercado
 * Uso: node src/tests/testAdvancedAnalysis.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('\n🔬 TESTE DE ANÁLISE AVANÇADA DE MERCADO\n');
console.log('='.repeat(60));

const { generateAdvancedAnalysis } = await import('../services/opinionService.js');
const climateService = await import('../services/climateService.js');
const priceService = await import('../services/priceService.js');

// Teste 1: Dados de clima
console.log('\n📊 Teste 1: Buscando dados climáticos...');
try {
  const climate = await climateService.fetchAllRegionsClimate();
  const regions = Object.keys(climate);
  console.log(`✅ Dados obtidos para ${regions.length} regiões`);
  
  // Mostra uma amostra
  const sample = climate.bahia;
  if (sample?.atual) {
    console.log(`   🌡️ Bahia: ${sample.atual.temperatura}°C, ${sample.atual.umidade}% umidade`);
  }
  
  const risks = climateService.analyzeClimateRisks(climate);
  console.log(`   ⚠️ Risco global: ${risks.risco_global}`);
} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

// Teste 2: Dados de preços
console.log('\n💰 Teste 2: Verificando dados de preços...');
try {
  const prices = priceService.default.getRegionalPrices();
  console.log(`✅ Preços carregados`);
  console.log(`   📈 NY Futures: ${prices.internacional.ny_cocoa_futures.preco}`);
  console.log(`   🇧🇷 Bahia: ${prices.brasil.bahia.arroba}/arroba`);
  
  const trend = priceService.default.analyzePriceTrend();
  console.log(`   📊 Tendência global: ${trend.tendencia_global}`);
} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

// Teste 3: Análise avançada completa
console.log('\n🤖 Teste 3: Executando análise avançada com IA...');
console.log('   (Isso pode levar alguns segundos)\n');

const testNews = {
  title: 'Seca severa na Costa do Marfim reduz produção de cacau em 25%',
  content: `A Costa do Marfim, maior produtor mundial de cacau, enfrenta a pior seca em 40 anos. 
  Autoridades estimam queda de 25% na produção da safra 2024/2025. 
  O Conseil Café-Cacao alertou que os preços internacionais devem subir nas próximas semanas.
  Produtores brasileiros podem se beneficiar com aumento da demanda por cacau da Bahia e Pará.
  El Niño é apontado como principal causador das condições climáticas adversas na África Ocidental.`
};

try {
  console.log(`📰 Notícia: "${testNews.title}"\n`);
  
  const startTime = Date.now();
  const analysis = await generateAdvancedAnalysis(testNews.title, testNews.content, true);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(`✅ Análise concluída em ${duration}s\n`);
  console.log('='.repeat(60));
  
  // Mostra resultados
  console.log('\n📍 IMPACTO REGIONAL:');
  if (analysis.regionalImpact) {
    Object.entries(analysis.regionalImpact).forEach(([region, data]) => {
      const emoji = data.impacto === 'alto' ? '🔴' : data.impacto === 'moderado' ? '🟡' : '🟢';
      console.log(`   ${emoji} ${region}: ${data.impacto}`);
      if (data.explicacao) console.log(`      → ${data.explicacao.substring(0, 80)}...`);
    });
  }

  console.log('\n🌤️ RISCO CLIMÁTICO:');
  if (analysis.climateRisk) {
    console.log(`   Nível: ${analysis.climateRisk.risco_global}`);
    if (analysis.climateRisk.fatores?.length) {
      console.log(`   Fatores: ${analysis.climateRisk.fatores.slice(0, 3).join(', ')}`);
    }
  }

  console.log('\n💹 IMPACTO NOS PREÇOS:');
  if (analysis.priceImpact) {
    if (analysis.priceImpact.mercado_brasil) {
      console.log(`   Brasil: ${analysis.priceImpact.mercado_brasil.tendencia}`);
    }
    if (analysis.priceImpact.mercado_ny_futures) {
      console.log(`   NY Futures: ${analysis.priceImpact.mercado_ny_futures.tendencia}`);
    }
  }

  console.log('\n🌍 RISCO GEOPOLÍTICO:');
  if (analysis.geoPoliticalRisk) {
    console.log(`   Nível: ${analysis.geoPoliticalRisk.nivel}`);
    if (analysis.geoPoliticalRisk.eventos_relevantes?.length) {
      console.log(`   Eventos: ${analysis.geoPoliticalRisk.eventos_relevantes.slice(0, 2).join(', ')}`);
    }
  }

  console.log('\n📊 OPINIÃO GLOBAL:');
  if (analysis.globalMarketOpinion) {
    console.log(`   Impacto: ${analysis.globalMarketOpinion.impacto_geral}`);
    console.log(`   Sentimento: ${analysis.globalMarketOpinion.sentimento_do_mercado}`);
    if (analysis.globalMarketOpinion.resumo) {
      console.log(`   Resumo: ${analysis.globalMarketOpinion.resumo.substring(0, 200)}...`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Teste de análise avançada concluído com sucesso!');
  
} catch (error) {
  console.log(`❌ Erro na análise: ${error.message}`);
  console.log(error.stack);
}

process.exit(0);
