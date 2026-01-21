/**
 * Test CoinGecko Pro API
 */

import { getCoinGeckoService } from '../services/historicalPrice.js';

async function test() {
    const cg = getCoinGeckoService();

    // Test Meteora - 2 months ago
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    console.log('🧪 Testing CoinGecko Pro API');
    console.log('============================\n');

    // Test 1: Current price
    console.log('1. Current Price Test:');
    const currentMET = await cg.getCurrentPrice('MET');
    console.log(`   MET Current: $${currentMET?.toFixed(4) || 'N/A'}`);

    const currentETH = await cg.getCurrentPrice('ETH');
    console.log(`   ETH Current: $${currentETH?.toFixed(2) || 'N/A'}`);

    // Test 2: Historical price
    console.log('\n2. Historical Price Test (2 months ago):');
    const histMET = await cg.getHistoricalPrice('MET', twoMonthsAgo);
    console.log(`   MET Historical: $${histMET.price?.toFixed(4) || 'N/A'} (${histMET.date})`);

    // Test 3: Price comparison
    console.log('\n3. Price Comparison Test:');
    const comparison = await cg.getPriceComparison('MET', twoMonthsAgo);

    if (comparison.success && comparison.price && comparison.currentPrice) {
        const roi = ((comparison.currentPrice - comparison.price) / comparison.price) * 100;
        console.log(`   MET: $${comparison.price.toFixed(4)} → $${comparison.currentPrice.toFixed(4)}`);
        console.log(`   ROI: ${roi.toFixed(2)}% ${roi >= 0 ? '📈' : '📉'}`);
    } else {
        console.log(`   Error: ${comparison.error}`);
    }

    console.log('\n✅ Test complete!');
}

test().catch(console.error);
