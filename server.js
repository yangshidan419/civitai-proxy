const http = require('http');
const https = require('https');

const server = http.createServer((req, res) => {
  const raw = req.url;
  const idx = raw.indexOf('/proxy/');
  let target = '';
  if (idx >= 0) {
    target = raw.slice(idx + 7);
  } else {
    target = new URL(req.url, 'http://localhost').searchParams.get('url') || '';
  }
  if (!target) return res.end('Missing url');
  if (!target.startsWith('https://')) return res.end('Invalid url');
  let t;
  try {
    t = new URL(target);
  } catch {
    return res.end('Invalid url');
  }
  const allowed = ['b2.civitai.com', 'image.civitai.com', 'blobs-b2.civitai.com'];
  if (!allowed.includes(t.hostname)) return res.end('Forbidden');
  const headers = Object.assign({}, req.headers);
  delete headers.host;
  const client = t.protocol === 'https:' ? https : http;
  const preq = client.request(t.href, { method: req.method, headers }, (pres) => {
    res.writeHead(pres.statusCode, pres.headers);
    pres.pipe(res);
  });
  preq.on('error', (e) => {
    try { res.end('Proxy error: ' + e.message); } catch {}
  });
  req.pipe(preq);
});

server.listen(process.env.PORT || 3000);
console.log('civitai proxy listening on', process.env.PORT || 3000);
