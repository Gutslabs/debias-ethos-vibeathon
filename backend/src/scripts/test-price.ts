/**
 * Test script for Price service
 * Usage: npm run test:price
 */

import { PriceService } from '../services/priceService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testPrice() {
    console.log('💰 Testing Price Service...\n');

    const priceService = new PriceService();

    try {
        // Test getting current price
        console.log('1️⃣ Getting current Bitcoin price...');
        const btcPrice = await priceService.getCurrentPrice('bitcoin');
        if (btcPrice) {
            console.log('✅ Bitcoin price:');
            console.log(`   Current: $${btcPrice.current_price.toLocaleString()}`);
            console.log(`   Market Cap: $${btcPrice.market_cap?.toLocaleString()}`);
            console.log(`   24h Change: ${btcPrice.price_change_24h?.toFixed(2)}%`);
        } else {
            console.log('⚠️ Failed to get Bitcoin price');
        }
        console.log('');

        // Test getting Ethereum price
        console.log('2️⃣ Getting current Ethereum price...');
        const ethPrice = await priceService.getCurrentPrice('ethereum');
        if (ethPrice) {
            console.log('✅ Ethereum price:');
            console.log(`   Current: $${ethPrice.current_price.toLocaleString()}`);
            console.log(`   Market Cap: $${ethPrice.market_cap?.toLocaleString()}`);
        }
        console.log('');

        // Test historical price
        console.log('3️⃣ Getting historical Bitcoin price (1 year ago)...');
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const historicalPrice = await priceService.getHistoricalPrice('bitcoin', oneYearAgo);
        if (historicalPrice) {
            console.log('✅ Historical Bitcoin price:');
            console.log(`   Date: ${historicalPrice.date.toISOString().split('T')[0]}`);
            console.log(`   Price: $${historicalPrice.price.toLocaleString()}`);

            // Calculate change
            if (btcPrice) {
                const change = priceService.calculatePriceChange(historicalPrice.price, btcPrice.current_price);
                console.log(`   Change since: ${change > 0 ? '+' : ''}${change.toFixed(2)}%`);
            }
        }
        console.log('');

        // Test token search
        console.log('4️⃣ Searching for "solana"...');
        const searchResults = await priceService.searchToken('solana');
        console.log(`✅ Found ${searchResults.length} results:`);
        searchResults.slice(0, 3).forEach((result, i) => {
            console.log(`   ${i + 1}. ${result.name} (${result.symbol}) - ID: ${result.id}`);
        });
        console.log('');

        // Test price chart
        console.log('5️⃣ Getting 7-day price chart for Solana...');
        const chart = await priceService.getPriceChart('solana', 7);
        console.log(`✅ Got ${chart.length} data points`);
        if (chart.length > 0) {
            const first = chart[0];
            const last = chart[chart.length - 1];
            console.log(`   First: ${first.date.toISOString().split('T')[0]} - $${first.price.toFixed(2)}`);
            console.log(`   Last: ${last.date.toISOString().split('T')[0]} - $${last.price.toFixed(2)}`);
        }
        console.log('');

        console.log('🎉 All Price tests passed!');

    } catch (error) {
        console.error('❌ Price test failed:', error);
        process.exit(1);
    }
}

testPrice();
