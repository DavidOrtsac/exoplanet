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

  return new Promise((resolve, reject) => {
    proxy.once('error', (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Proxy error', details: err.message });
      reject(err);
    });

    proxy.web(req, res, {
      target: API_URL,
      changeOrigin: true, // Recommended for virtual-hosted sites
      selfHandleResponse: false,
    }, (err) => {
      if (err) {
        console.error('Proxy callback error:', err);
        res.status(500).json({ error: 'Proxy callback error', details: err.message });
        return reject(err);
      }
      resolve();
    });
  });
}
