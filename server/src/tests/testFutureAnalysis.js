/**
 * Teste da rota de análise futura
 */
import { fetchAllInvestingData } from '../services/investingService.js';
import { fetchMultiPeriodData } from '../services/yahooFinanceService.js';
import { generatePriceProSignals } from '../services/priceProService.js';

async function test() {
  console.log('🧪 Testando serviços da Análise Futura...\n');
  
  try {
    // 1. Testar Yahoo Finance
    console.log('📊 1. Testando Yahoo Finance...');
    const yahooData = await fetchMultiPeriodData();
    console.log('   ✅ Yahoo Finance OK');
    console.log(`   - 24h: ${yahooData.periods?.['24h']?.data?.length || 0} registros`);
    console.log(`   - 7d: ${yahooData.periods?.['7d']?.data?.length || 0} registros`);
    console.log(`   - 30d: ${yahooData.periods?.['30d']?.data?.length || 0} registros`);
    console.log(`   - Preço atual: $${yahooData.currentPrice}`);
    
    // 2. Testar PricePro
    console.log('\n🎯 2. Testando PricePro...');
    if (yahooData.periods?.['30d']?.data?.length > 0) {
      const historicalData = yahooData.periods['30d'].data.map(p => ({
        close: p.close,
        high: p.high,
        low: p.low,
        open: p.open
      }));
      const signals = generatePriceProSignals(historicalData);
      console.log('   ✅ PricePro OK');
      console.log(`   - Sinal: ${signals.signal}`);
      console.log(`   - Força: ${signals.strength}%`);
      console.log(`   - SL: $${signals.stopLoss}`);
      console.log(`   - TP: $${signals.takeProfit}`);
    } else {
      console.log('   ⚠️ Dados insuficientes para PricePro');
    }
    
    // 3. Testar Investing.com (pode falhar por CAPTCHA)
    console.log('\n🌐 3. Testando Investing.com (scraping)...');
    try {
      const investingData = await fetchAllInvestingData();
      console.log('   ✅ Investing.com OK');
      console.log(`   - Preço: $${investingData.price?.value || 'N/A'}`);
      console.log(`   - Notícias: ${investingData.news?.length || 0}`);
    } catch (err) {
      console.log(`   ⚠️ Investing.com falhou: ${err.message}`);
      console.log('   (Normal se houver proteção anti-scraping)');
    }
    
    console.log('\n✅ Testes concluídos!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

test();
