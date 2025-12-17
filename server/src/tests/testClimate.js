/**
 * 🧪 Teste de Clima
 * Uso: node src/tests/testClimate.js
 */

import { getClimate, getAllRegionsClimate } from '../regions/climateService.js';
import { getAllRegions } from '../regions/regionList.js';

console.log('\n🌤️ TESTE DO SERVIÇO DE CLIMA\n');
console.log('='.repeat(60));

// Teste 1: Clima de Ilhéus
console.log('\n📍 Teste 1: Clima de Ilhéus');
try {
  const climate = await getClimate('ilheus');
  console.log('✅ Dados obtidos:');
  console.log(`   🌡️ Temperatura: ${climate.current.temperature}°C`);
  console.log(`   💨 Vento: ${climate.current.windSpeed} km/h`);
  console.log(`   ☁️ Condição: ${climate.current.weatherDescription}`);
  console.log(`   📊 Últimas 48h: ${climate.last48h.avgTemperature}°C média`);
  console.log(`   🌧️ Precipitação 48h: ${climate.last48h.totalPrecipitation}mm`);
  console.log(`   ⚠️ Risco: ${climate.risk.level}`);
  if (climate.risk.factors.length > 0) {
    console.log(`   📋 Fatores: ${climate.risk.factors.join(', ')}`);
  }
} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

// Teste 2: Clima da Costa do Marfim
console.log('\n🌍 Teste 2: Clima da Costa do Marfim');
try {
  const climate = await getClimate('costa_do_marfim');
  console.log('✅ Dados obtidos:');
  console.log(`   🌡️ Temperatura: ${climate.current.temperature}°C`);
  console.log(`   💧 Umidade 48h: ${climate.last48h.avgHumidity}%`);
  console.log(`   📈 Previsão 72h: ${climate.forecast72h.avgTemperature}°C média`);
  console.log(`   ⚠️ Risco: ${climate.risk.level} - ${climate.risk.summary}`);
} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

// Teste 3: Região inválida
console.log('\n❌ Teste 3: Região inválida');
try {
  await getClimate('inexistente');
  console.log('❌ Deveria ter lançado erro');
} catch (error) {
  console.log(`✅ Erro esperado: ${error.message}`);
}

// Teste 4: Clima de todas as regiões
console.log('\n🌍 Teste 4: Clima de todas as regiões');
console.log('   (Isso pode levar alguns segundos...)\n');

try {
  const startTime = Date.now();
  const allClimate = await getAllRegionsClimate();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`✅ Concluído em ${duration}s`);
  console.log(`   📊 Regiões: ${Object.keys(allClimate.data).length}`);
  console.log(`   ❌ Erros: ${allClimate.errors.length}`);
  
  console.log('\n   📋 Resumo global:');
  console.log(`   - Risco alto: ${allClimate.summary.highRiskCount} regiões`);
  console.log(`   - Risco moderado: ${allClimate.summary.moderateRiskCount} regiões`);
  console.log(`   - Risco baixo: ${allClimate.summary.lowRiskCount} regiões`);
  console.log(`   - Temperatura média: ${allClimate.summary.avgTemperature}°C`);
  console.log(`   - Risco global: ${allClimate.summary.globalRiskLevel}`);

  if (allClimate.summary.highRiskRegions.length > 0) {
    console.log(`\n   ⚠️ Regiões de alto risco: ${allClimate.summary.highRiskRegions.join(', ')}`);
  }

  // Tabela de temperaturas
  console.log('\n   📊 Temperaturas por região:');
  Object.values(allClimate.data).forEach(d => {
    const emoji = d.risk.level === 'alto' ? '🔴' : d.risk.level === 'moderado' ? '🟡' : '🟢';
    console.log(`   ${emoji} ${d.region.name.padEnd(20)} ${d.current.temperature}°C`);
  });

} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('✅ Testes de clima concluídos!\n');

process.exit(0);
