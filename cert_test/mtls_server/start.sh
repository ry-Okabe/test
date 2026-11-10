#!/bin/sh
# ワンコマンド起動： LAN IP 自動検出 → サーバ証明書生成 → mTLS サーバ起動
# 使い方（Git Bash など）:  sh start.sh
cd "$(dirname "$0")" || exit 1

# LAN IP を Node で検出（192.168.* > 10.* > 172.16-31.* を優先／仮想・リンクローカルは除外）
IP=$(node -e '
const os=require("os");
const cand=[];
for(const list of Object.values(os.networkInterfaces())){
  for(const a of list){
    if(a.family!=="IPv4"||a.internal) continue;
    if(a.address.startsWith("169.254")) continue; // link-local
    cand.push(a.address);
  }
}
const score=ip=> ip.startsWith("192.168.")?0 : ip.startsWith("10.")?1 :
  (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)?2:3);
cand.sort((x,y)=>score(x)-score(y));
console.log(cand[0]||"127.0.0.1");
')

echo "検出した LAN IP: $IP"
echo "サーバ証明書を生成中..."
sh gen_server_cert.sh "$IP" >/dev/null 2>&1 || { echo "証明書生成に失敗（../ca.key があるか確認）"; exit 1; }

echo ""
echo "=================================================="
echo " ✅ 準備OK。iPad(同一Wi-Fi)の Safari で開く:"
echo ""
echo "        https://$IP:8443/"
echo ""
echo " （cert_test の「④」にこのURLを入れて『開く』でもOK）"
echo " 停止: Ctrl+C"
echo "=================================================="
echo ""
node server.js
