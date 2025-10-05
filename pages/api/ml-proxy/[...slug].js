import httpProxy from 'http-proxy';

const API_URL = 'http://127.0.0.1:5001'; // Force IPv4 to match Flask's bind address
const proxy = httpProxy.createProxyServer();

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default function handler(req, res) {
  // Rewrite the request URL to remove the /api/ml-proxy prefix
  req.url = req.url.replace(/^\/api\/ml-proxy/, '');
  
  console.log(`[PROXY] ${req.method} ${req.url} -> ${API_URL}${req.url}`);

  return new Promise((resolve, reject) => {
    // Set longer timeout for split operations
    const timeout = setTimeout(() => {
      console.error('[PROXY] Request timeout after 60s');
      if (!res.headersSent) {
        res.status(504).json({ error: 'Gateway timeout' });
      }
      reject(new Error('Timeout'));
    }, 60000);

    proxy.once('error', (err, req, res) => {
      clearTimeout(timeout);
      console.error('[PROXY] Proxy error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Proxy error', details: err.message });
      }
      reject(err);
    });

    proxy.web(req, res, {
      target: API_URL,
      changeOrigin: true,
      selfHandleResponse: false,
      timeout: 60000,
    }, (err) => {
      clearTimeout(timeout);
      if (err) {
        console.error('[PROXY] Proxy callback error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Proxy callback error', details: err.message });
        }
        return reject(err);
      }
      console.log(`[PROXY] Success: ${req.method} ${req.url}`);
      resolve();
    });
  });
}
