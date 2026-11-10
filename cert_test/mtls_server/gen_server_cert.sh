#!/bin/sh
# サーバ証明書（Test Device Root CA 署名）を生成する。
# 使い方:  sh gen_server_cert.sh <このPCのLAN IP または ホスト名>
#   例:    sh gen_server_cert.sh 192.168.1.23
# iPad から https://<LAN IP>:8443/ で開くため、SAN に LAN IP を入れる。
set -e
export MSYS2_ARG_CONV_EXCL="*"
HOST="${1:-127.0.0.1}"
CA_CRT="../ca.crt"
CA_KEY="../ca.key"

if [ ! -f "$CA_KEY" ]; then
  echo "エラー: $CA_KEY が見つかりません（CA秘密鍵が必要）。cert_test フォルダ内で実行してください。"
  exit 1
fi

# HOST が IPアドレスか判定して SAN を切り替え
if echo "$HOST" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
  ALT="IP.1=$HOST
IP.2=127.0.0.1
DNS.1=localhost"
else
  ALT="DNS.1=$HOST
DNS.2=localhost
IP.1=127.0.0.1"
fi

cat > server_ext.cnf <<EOF
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=@alt
[alt]
$ALT
EOF

openssl genrsa -out server.key 2048
openssl req -new -key server.key -subj "/C=JP/O=Test/OU=mTLS/CN=$HOST" -out server.csr
openssl x509 -req -in server.csr -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
  -days 825 -sha256 -extfile server_ext.cnf -out server.crt
echo ""
echo "OK: server.crt / server.key を生成（CN=$HOST / SAN に上記ホストを含む）"
echo "次： node server.js  で起動 → iPad(同一Wi-Fi)から https://$HOST:8443/"
