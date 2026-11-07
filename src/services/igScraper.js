const axios = require('axios');

async function getDynamicApiKey() {
    const htmlRes = await axios.get('https://instaddl.com/');
    const scriptMatch = htmlRes.data.match(/src="([^"]*assets\/index-[^"]*\.js)"/);
    if (!scriptMatch) throw new Error('Failed to find script URL');
    const jsUrl = 'https://instaddl.com' + scriptMatch[1];
    
    const jsRes = await axios.get(jsUrl);
    const keyMatch = jsRes.data.match(/(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[^"'\s]+)/);
    if (!keyMatch) throw new Error('Failed to extract API key');
    
    return keyMatch[1];
}

async function downloaderIg(url) {
    try {
        const apiKey = await getDynamicApiKey();
        const authorization = `Bearer ${apiKey}`;
        const headers = {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
            'origin': 'https://instaddl.com',
            'referer': 'https://instaddl.com/',
            'content-type': 'application/json',
            'x-client-info': 'supabase-js-web/2.58.0',
            'apikey': apiKey,
            'authorization': authorization
        };
        
        const { data: create } = await axios.post('https://eoehwyffvhpmvpeblkbi.supabase.co/functions/v1/instagram-fetch', { url }, { headers });
        
        if (!create.success) {
            return { status: false, message: 'Gagal memproses URL Instagram.' };
        }
        
        // Polling hasil request
        for (let i = 0; i < 20; ++i) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const { data: result } = await axios.post('https://eoehwyffvhpmvpeblkbi.supabase.co/functions/v1/instagram-poll',
                { "runId": create.runId, "datasetId": create.datasetId, url }, { headers }
            );
            
            if (result.data && !result.pending) {
                return {
                    status: true,
                    data: result.data
                };
            }
        }
        return { status: false, message: 'Proses unduh timeout (terlalu lama).' };
    } catch (error) {
        return { status: false, message: error.message || 'Terjadi kesalahan sistem.' };
    }
}

module.exports = { downloaderIg };
