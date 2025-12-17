/**
 * 🧪 Teste de Análise Regional Completa
 * Uso: node src/tests/testRegionalAnalysis.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('\n📊 TESTE DE ANÁLISE REGIONAL COMPLETA\n');
console.log('='.repeat(60));

// Conectar ao MongoDB
console.log('\n🔌 Conectando ao MongoDB...');
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cocoa_news');
  console.log('✅ MongoDB conectado');
} catch (error) {
  console.log(`⚠️ MongoDB não conectado: ${error.message}`);
  console.log('   Continuando sem persistência...');
}

// Importar serviços
const { generateRegionalAnalysis, analyzeAllRegions } = await import('../regions/regionAnalysisService.js');
const { getGeopoliticalRisk } = await import('../regions/geopoliticalService.js');

// Teste 1: Análise de Ilhéus
console.log('\n📍 Teste 1: Análise completa de Ilhéus');
console.log('   (Isso pode levar 10-15 segundos...)\n');

try {
  const startTime = Date.now();
  const analysis = await generateRegionalAnalysis('ilheus');
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`✅ Análise concluída em ${duration}s\n`);
  
  // Região
  console.log('📌 REGIÃO:');
  console.log(`   Nome: ${analysis.region.name}`);
  console.log(`   País: ${analysis.region.country}`);
  console.log(`   Tipo: ${analysis.region.type}`);

  // Clima
  console.log('\n🌤️ CLIMA:');
  if (analysis.climate.error) {
    console.log(`   ❌ ${analysis.climate.error}`);
  } else {
    console.log(`   Temperatura: ${analysis.climate.current?.temperature}°C`);
    console.log(`   Condição: ${analysis.climate.current?.weatherDescription}`);
    console.log(`   Risco: ${analysis.climate.risk?.level}`);
  }

  // Preço
  console.log('\n💰 PREÇO:');
  if (analysis.price.error) {
    console.log(`   ❌ ${analysis.price.error}`);
  } else {
    console.log(`   Valor: ${analysis.price.value} ${analysis.price.unit}`);
    console.log(`   Tendência: ${analysis.price.trend}`);
  }

  // Geopolítica
  console.log('\n🌍 GEOPOLÍTICA:');
  if (analysis.geopolitical.error) {
    console.log(`   ❌ ${analysis.geopolitical.error}`);
  } else {
    console.log(`   Risco geral: ${analysis.geopolitical.risk?.overall}`);
    console.log(`   Risco logístico: ${analysis.geopolitical.risk?.logistics}`);
  }

  // Análise IA
  console.log('\n🤖 ANÁLISE DA IA:');
  console.log(`   Nível de risco: ${analysis.analysis.riskLevel?.toUpperCase()}`);
  console.log(`   Tendência: ${analysis.analysis.priceTrend}`);
  console.log(`   Confiança: ${analysis.analysis.confidenceLevel}`);
  console.log(`\n   📝 Resumo:`);
  console.log(`   ${analysis.analysis.summary}`);
  console.log(`\n   🌤️ Impacto climático:`);
  console.log(`   ${analysis.analysis.climateImpact}`);
  console.log(`\n   💡 Recomendação:`);
  console.log(`   ${analysis.analysis.recommendation}`);

  // Metadados
  console.log('\n📊 METADADOS:');
  console.log(`   Tempo de processamento: ${analysis.metadata.processingTime}`);
  console.log(`   Qualidade dos dados: ${analysis.metadata.dataQuality.percentage}%`);

} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
  console.log(error.stack);
}

// Teste 2: Análise de região de alto risco
console.log('\n' + '='.repeat(60));
console.log('\n🌍 Teste 2: Análise da Costa do Marfim (alto risco)');
console.log('   (Isso pode levar 10-15 segundos...)\n');

try {
  const startTime = Date.now();
  const analysis = await generateRegionalAnalysis('costa_do_marfim');
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`✅ Análise concluída em ${duration}s\n`);
  
  console.log('📌 REGIÃO:');
  console.log(`   Nome: ${analysis.region.name}`);
  console.log(`   País: ${analysis.region.country}`);

  console.log('\n🤖 ANÁLISE DA IA:');
  console.log(`   Nível de risco: ${analysis.analysis.riskLevel?.toUpperCase()}`);
  console.log(`   Tendência: ${analysis.analysis.priceTrend}`);
  console.log(`\n   📝 Resumo:`);
  console.log(`   ${analysis.analysis.summary}`);
  console.log(`\n   🌍 Impacto geopolítico:`);
  console.log(`   ${analysis.analysis.geopoliticalImpact}`);

  if (analysis.analysis.outlook) {
    console.log(`\n   📈 Perspectivas:`);
    console.log(`   Curto prazo: ${analysis.analysis.outlook.shortTerm}`);
    console.log(`   Médio prazo: ${analysis.analysis.outlook.mediumTerm}`);
  }

  if (analysis.analysis.keyFactors?.length > 0) {
    console.log(`\n   🔑 Fatores-chave:`);
    analysis.analysis.keyFactors.forEach(f => console.log(`   - ${f}`));
  }

} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

// Teste 3: Geopolítica com IA
console.log('\n' + '='.repeat(60));
console.log('\n🌐 Teste 3: Análise geopolítica com IA (Nigéria)');

try {
  const geo = await getGeopoliticalRisk('nigeria', true);
  
  console.log('✅ Análise concluída\n');
  console.log(`   Risco geral: ${geo.risk.overall}`);
  console.log(`   Risco de conflito: ${geo.risk.conflict}`);
  console.log(`   Risco logístico: ${geo.risk.logistics}`);
  
  if (geo.factors?.length > 0) {
    console.log(`\n   📋 Fatores:`);
    geo.factors.slice(0, 5).forEach(f => console.log(`   - ${f}`));
  }

  if (geo.aiAnalysis) {
    console.log(`\n   🤖 Análise IA:`);
    console.log(`   ${geo.aiAnalysis.summary}`);
    if (geo.aiAnalysis.threats?.length > 0) {
      console.log(`\n   ⚠️ Ameaças:`);
      geo.aiAnalysis.threats.forEach(t => console.log(`   - ${t}`));
    }
  }

} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

// Fechar conexão
console.log('\n' + '='.repeat(60));
console.log('\n🔌 Fechando conexões...');

try {
  await mongoose.connection.close();
  console.log('✅ MongoDB desconectado');
} catch (e) {
  // Ignorar
}

console.log('\n✅ Testes de análise regional concluídos!\n');

process.exit(0);
