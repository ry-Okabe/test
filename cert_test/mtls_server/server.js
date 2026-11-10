// COTA 端末認証 検証用 mTLS サーバ
// クライアント証明書（COTA Device Root CA 署名）が無いとアクセスできない保護ページ。
// 使い方:  node server.js        （デフォルト 0.0.0.0:8443）
//   先に gen_server_cert.sh <LAN-IP> で server.crt / server.key を作成しておくこと。
const https = require('https');
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const PORT = process.env.PORT || 8443;

function read(p){ return fs.readFileSync(path.join(dir, p)); }

let opts;
try {
  opts = {
    key:  read('server.key'),
    cert: read('server.crt'),
    ca:   read('../ca.crt'),       // このCAで署名されたクライアント証明書だけ有効
    requestCert: true,             // クライアント証明書を要求
    rejectUnauthorized: false,     // 手動判定して分かりやすい 403 を返す（true にすると TLS 段階で遮断）
  };
} catch (e) {
  console.error('証明書の読み込みに失敗:', e.message);
  console.error('→ まず  sh gen_server_cert.sh <このPCのLAN IP>  を実行してください。');
  process.exit(1);
}

const esc = s => String(s==null?'':s).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

const server = https.createServer(opts, (req, res) => {
  const cert = req.socket.getPeerCertificate();
  const ok = req.client.authorized && cert && cert.subject;
  if (!ok) {
    res.writeHead(403, {'Content-Type':'text/html; charset=utf-8'});
    res.end(`<!doctype html><html lang="ja"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<body style="font-family:-apple-system,'Hiragino Kaku Gothic ProN',sans-serif;background:#2a1113;color:#ffd9dc;padding:32px;line-height:1.7">
<h1>⛔ アクセス拒否（要クライアント証明書）</h1>
<p>この端末には有効なクライアント証明書がありません。</p>
<p>理由：<code>${esc(req.client.authorizationError||'no client certificate')}</code></p>
<p><b>COTA端末証明書（COTA Device Root CA 署名）をインストールした端末のみ</b>アクセスできます。</p>
</body></html>`);
    return;
  }
  res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
  res.end(`<!doctype html><html lang="ja"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<body style="font-family:-apple-system,'Hiragino Kaku Gothic ProN',sans-serif;background:#0f2016;color:#d6f5e0;padding:32px;line-height:1.7">
<h1>✅ アクセス許可（端末認証 成功）</h1>
<p>この端末は<b>クライアント証明書を提示</b>しました＝証明書で端末を認証できています。</p>
<ul>
  <li>CN（端末）：<b>${esc(cert.subject.CN)}</b></li>
  <li>発行者（CA）：${esc(cert.issuer && cert.issuer.CN)}</li>
  <li>有効期限：${esc(cert.valid_to)}</li>
</ul>
<p>＝「証明書が入っていない端末はこのページに来られない」ことの実証です。</p>
</body></html>`);
});

server.on('tlsClientError', (err) => {
  // rejectUnauthorized=false なので通常ここには来ないが、ハンドシェイク異常のログ用
  // console.log('tlsClientError:', err.message);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`mTLS 保護サーバ起動： https://0.0.0.0:${PORT}/  （要クライアント証明書）`);
  console.log(`iPad からは  https://<このPCのLAN IP>:${PORT}/  を開く（同一Wi-Fi）。`);
  console.log(`停止： Ctrl+C`);
});
