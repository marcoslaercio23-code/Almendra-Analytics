/**
 * 🧪 Teste de Preços
 * Uso: node src/tests/testPrices.js
 */

import { getRegionalPrice, getAllRegionalPrices, clearPriceCache } from '../regions/priceService.js';

console.log('\n💰 TESTE DO SERVIÇO DE PREÇOS\n');
console.log('='.repeat(60));

// Limpar cache para testes frescos
clearPriceCache();

// Teste 1: Preço de Ilhéus (Brasil)
console.log('\n🇧🇷 Teste 1: Preço em Ilhéus');
try {
  const price = await getRegionalPrice('ilheus');
  console.log('✅ Dados obtidos:');
  console.log(`   💵 Preço: ${price.price} ${price.unit}`);
  console.log(`   📊 Variação dia: ${price.variation?.dayPercent || 'N/A'}`);
  console.log(`   📈 Tendência: ${price.trend}`);
  if (price.sources?.length > 0) {
    console.log(`   📰 Fontes: ${price.sources.map(s => s.name).join(', ')}`);
  }
  if (price.isReference) {
    console.log(`   ⚠️ Nota: ${price.note}`);
  }
} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

// Teste 2: Preço do Pará
console.log('\n🌴 Teste 2: Preço no Pará');
try {
  const price = await getRegionalPrice('para');
  console.log('✅ Dados obtidos:');
  console.log(`   💵 Preço: ${price.price} ${price.unit}`);
  console.log(`   📊 Variação semana: ${price.variation?.weekPercent || 'N/A'}`);
} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

// Teste 3: Preço da Costa do Marfim (Global)
console.log('\n🌍 Teste 3: Preço na Costa do Marfim');
try {
  const price = await getRegionalPrice('costa_do_marfim');
  console.log('✅ Dados obtidos:');
  console.log(`   💵 Preço: ${price.price} ${price.unit}`);
  console.log(`   📊 Preço referência NY: ${price.referencePrice?.nyCocoa || 'N/A'} USD/ton`);
  console.log(`   🚢 Preço FOB: ${price.fobPrice || 'N/A'} USD/ton`);
  console.log(`   📈 Tendência: ${price.trend}`);
} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

// Teste 4: Preço de Gana
console.log('\n🇬🇭 Teste 4: Preço em Gana');
try {
  const price = await getRegionalPrice('gana');
  console.log('✅ Dados obtidos:');
  console.log(`   💵 Preço: ${price.price} ${price.unit}`);
} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

// Teste 5: Cache
console.log('\n🗃️ Teste 5: Teste de Cache');
try {
  const start1 = Date.now();
  await getRegionalPrice('ilheus');
  const time1 = Date.now() - start1;

  const start2 = Date.now();
  const cached = await getRegionalPrice('ilheus');
  const time2 = Date.now() - start2;

  console.log(`✅ Primeira chamada: ${time1}ms`);
  console.log(`✅ Segunda chamada (cache): ${time2}ms`);
  console.log(`   Cache ativo: ${cached.fromCache ? 'SIM' : 'NÃO'}`);
} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

// Teste 6: Todos os preços
console.log('\n🌐 Teste 6: Preços de todas as regiões');
console.log('   (Isso pode levar alguns segundos...)\n');

try {
  const startTime = Date.now();
  const allPrices = await getAllRegionalPrices();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`✅ Concluído em ${duration}s`);
  console.log(`   📊 Regiões: ${Object.keys(allPrices.data).length}`);
  console.log(`   ❌ Erros: ${allPrices.errors.length}`);

  console.log('\n   📋 Resumo Brasil:');
  console.log(`   - Preço médio: ${allPrices.summary.brazil.avgPrice} R$/arroba`);
  if (allPrices.summary.brazil.highest) {
    console.log(`   - Maior: ${allPrices.summary.brazil.highest.name} (${allPrices.summary.brazil.highest.price})`);
  }
  if (allPrices.summary.brazil.lowest) {
    console.log(`   - Menor: ${allPrices.summary.brazil.lowest.name} (${allPrices.summary.brazil.lowest.price})`);
  }

  console.log('\n   📋 Resumo Global:');
  console.log(`   - Preço médio: ${allPrices.summary.global.avgPrice} USD/ton`);
  if (allPrices.summary.global.highest) {
    console.log(`   - Maior: ${allPrices.summary.global.highest.name} (${allPrices.summary.global.highest.price})`);
  }
  if (allPrices.summary.global.lowest) {
    console.log(`   - Menor: ${allPrices.summary.global.lowest.name} (${allPrices.summary.global.lowest.price})`);
  }

  console.log(`\n   📈 Tendência de mercado: ${allPrices.summary.marketTrend.toUpperCase()}`);

  // Tabela de preços
  console.log('\n   💹 Preços por região:');
  
  console.log('\n   🇧🇷 Brasil:');
  Object.values(allPrices.data)
    .filter(p => p.currency === 'BRL')
    .forEach(p => {
      const trend = p.trend === 'alta' ? '📈' : p.trend === 'queda' ? '📉' : '➡️';
      console.log(`   ${trend} ${p.region.name.padEnd(20)} R$ ${p.price}/arroba`);
    });

  console.log('\n   🌍 Global:');
  Object.values(allPrices.data)
    .filter(p => p.currency === 'USD')
    .forEach(p => {
      const trend = p.trend === 'alta' ? '📈' : p.trend === 'queda' ? '📉' : '➡️';
      console.log(`   ${trend} ${p.region.name.padEnd(20)} $${p.price}/ton`);
    });

} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

console.log('\n' + '='.repeat(60));
console.log('✅ Testes de preços concluídos!\n');

process.exit(0);
