/**
 * 🧪 Teste de Regiões
 * Uso: node src/tests/testRegions.js
 */

import { 
  getAllRegions, 
  getRegion, 
  getBrazilianRegions, 
  getGlobalRegions,
  findRegionByName,
  getRegionIds 
} from '../regions/regionList.js';

console.log('\n🗺️ TESTE DO MÓDULO DE REGIÕES\n');
console.log('='.repeat(60));

// Teste 1: Listar todas as regiões
console.log('\n📋 Teste 1: Todas as regiões');
const allRegions = getAllRegions();
console.log(`✅ Total: ${allRegions.length} regiões`);
allRegions.forEach(r => {
  console.log(`   - ${r.id}: ${r.name}, ${r.country} (${r.type})`);
});

// Teste 2: Regiões brasileiras
console.log('\n🇧🇷 Teste 2: Regiões brasileiras');
const brRegions = getBrazilianRegions();
console.log(`✅ Brasil: ${brRegions.length} regiões`);
brRegions.forEach(r => {
  console.log(`   - ${r.name}, ${r.state}: lat ${r.latitude}, lon ${r.longitude}`);
});

// Teste 3: Regiões globais
console.log('\n🌍 Teste 3: Regiões globais');
const globalRegions = getGlobalRegions();
console.log(`✅ Global: ${globalRegions.length} regiões`);
globalRegions.forEach(r => {
  console.log(`   - ${r.name}: ${r.description?.substring(0, 50)}...`);
});

// Teste 4: Buscar região por ID
console.log('\n🔍 Teste 4: Buscar por ID');
const ilheus = getRegion('ilheus');
if (ilheus) {
  console.log(`✅ Encontrado: ${ilheus.name}`);
  console.log(`   País: ${ilheus.country}`);
  console.log(`   Coordenadas: ${ilheus.latitude}, ${ilheus.longitude}`);
  console.log(`   Timezone: ${ilheus.timezone}`);
} else {
  console.log('❌ Região não encontrada');
}

// Teste 5: Buscar por nome
console.log('\n🔎 Teste 5: Buscar por nome');
const found = findRegionByName('costa');
if (found) {
  console.log(`✅ Encontrado: ${found.name}, ${found.country}`);
} else {
  console.log('❌ Não encontrado');
}

// Teste 6: IDs disponíveis
console.log('\n📝 Teste 6: IDs disponíveis');
const ids = getRegionIds();
console.log(`✅ IDs: ${ids.join(', ')}`);

// Teste 7: Região inexistente
console.log('\n❌ Teste 7: Região inexistente');
const notFound = getRegion('inexistente');
console.log(`✅ Resultado esperado (null): ${notFound === null ? 'PASSOU' : 'FALHOU'}`);

console.log('\n' + '='.repeat(60));
console.log('✅ Todos os testes de regiões concluídos!\n');
