/**
 * Test script to check if API returns "Items" or "items"
 * Uses Node 18+ built-in fetch
 */

const API_ENDPOINT = 'https://rlyhccdr2g.execute-api.us-west-2.amazonaws.com/default/keyValueStore';
const LEADERBOARD_KEY = 'museumcheck-leaderboard';

async function testAPIResponse() {
    console.log('Testing API response structure...\n');
    
    try {
        const url = `${API_ENDPOINT}?key=${encodeURIComponent(LEADERBOARD_KEY)}`;
        console.log('Fetching:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('\nResponse keys:', Object.keys(data));
        console.log('\nFull response:', JSON.stringify(data, null, 2));
        
        // Check for different possible keys
        if (data.items !== undefined) {
            console.log('\n✅ Found "items" (lowercase)');
            console.log('   Type:', typeof data.items);
            console.log('   Is array:', Array.isArray(data.items));
            if (Array.isArray(data.items)) {
                console.log('   Length:', data.items.length);
            }
        } else {
            console.log('\n❌ NO "items" (lowercase) found');
        }
        
        if (data.Items !== undefined) {
            console.log('\n✅ Found "Items" (CAPITAL I)');
            console.log('   Type:', typeof data.Items);
            console.log('   Is array:', Array.isArray(data.Items));
            if (Array.isArray(data.Items)) {
                console.log('   Length:', data.Items.length);
            }
        } else {
            console.log('\n❌ NO "Items" (CAPITAL I) found');
        }
        
        // Additional checks
        if (data.results) console.log('\n⚠️  Found "results" key');
        if (data.data) console.log('\n⚠️  Found "data" key');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

testAPIResponse();
