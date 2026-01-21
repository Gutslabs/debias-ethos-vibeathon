/**
 * Test script for Token Detector
 * Usage: npm run test:detect
 */

import { TokenDetector } from '../services/tokenDetector.js';

function testTokenDetector() {
    console.log('🔍 Testing Token Detector...\n');

    const detector = new TokenDetector();

    // Test cases
    const testTweets = [
        {
            text: 'Just bought more $SOL and $ETH! Bullish on crypto! 🚀',
            expected: ['SOL', 'ETH']
        },
        {
            text: '$BTC to 100k is inevitable. Also accumulating $PEPE for the memes',
            expected: ['BTC', 'PEPE']
        },
        {
            text: 'Check out this token: 0x1234567890abcdef1234567890abcdef12345678',
            expected: ['0x12345678...']
        },
        {
            text: 'Long SOL short everything else. Buy AVAX while its cheap!',
            expected: ['SOL', 'AVAX']
        },
        {
            text: 'The future is $ARB and $OP. Layer 2s will dominate.',
            expected: ['ARB', 'OP']
        },
        {
            text: 'GM frens! Just having coffee. No crypto talk today.',
            expected: []
        },
        {
            text: 'Bullish on $WIF and stacking $BONK! Memecoins szn 🐶',
            expected: ['WIF', 'BONK']
        }
    ];

    let passed = 0;
    let failed = 0;

    testTweets.forEach((test, index) => {
        console.log(`Test ${index + 1}: "${test.text.substring(0, 50)}..."`);

        const tokens = detector.detectTokens(test.text);
        const filtered = detector.filterSpam(tokens);
        const symbols = filtered.map(t => t.symbol);

        // Check if expected tokens were found
        const allFound = test.expected.every(exp =>
            symbols.some(s => s.includes(exp) || exp.includes(s))
        );

        if (allFound && (test.expected.length === 0 ? symbols.length === 0 : true)) {
            console.log(`   ✅ Found: [${symbols.join(', ')}]`);
            passed++;
        } else {
            console.log(`   ❌ Expected: [${test.expected.join(', ')}], Got: [${symbols.join(', ')}]`);
            failed++;
        }
        console.log('');
    });

    // Test known tokens
    console.log('Testing known token lookup...');
    const knownTokens = ['BTC', 'ETH', 'SOL', 'PEPE', 'WIF'];
    knownTokens.forEach(symbol => {
        const info = detector.getKnownToken(symbol);
        if (info) {
            console.log(`   ✅ ${symbol}: ${info.name} (${info.coingeckoId})`);
        } else {
            console.log(`   ⚠️ ${symbol}: Not found in known tokens`);
        }
    });
    console.log('');

    // Summary
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);

    if (failed === 0) {
        console.log('🎉 All Token Detector tests passed!');
    } else {
        console.log('⚠️ Some tests failed. Please review.');
    }
}

testTokenDetector();
