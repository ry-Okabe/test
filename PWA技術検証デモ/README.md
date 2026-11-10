# PWA技術検証デモ

**検証対象**：① 全画面 / スタンドアロン表示　② ホーム画面インストール
**対象端末**：iPad（Safari）／ Android（Chrome）

## ファイル構成
| ファイル | 役割 |
|---|---|
| `index.html` | 検証画面本体。開いた端末の対応状況をその場で表示＋全画面/インストールを試せる |
| `manifest.webmanifest` | PWA定義（`display:fullscreen`・アイコン・名前）。インストールに必須 |
| `sw.js` | 最小 Service Worker。Androidのインストール要件を満たす（外殻キャッシュ付き） |
| `icon-192.png` / `icon-512.png` | ホーム画面/スプラッシュ用アイコン |

## 動かし方

### A. 同一PCで確認（かんたん）
```
cd output/PWA技術検証デモ
python -m http.server 8000
```
→ ブラウザで `http://localhost:8000/` を開く（`localhost` はHTTPS扱いでSW/PWAが動く）。
※ ただし **別端末（iPad/Android実機）からは見えません**。実機検証は下記Bへ。

### B. 実機（iPad / Android）で検証 ★合意用はこちら
Service Worker と Androidのインストールは **HTTPS が必須**です。どれかで公開してURLを実機で開きます。
- **静的ホスティング**：このフォルダをそのまま GitHub Pages / Netlify Drop / Cloudflare Pages に置く（最速）
- **トンネル**：`python -m http.server 8000` を起動 → 別窓で `ngrok http 8000` → 発行された `https://◯◯.ngrok.io` を実機で開く

> iOSの「ホーム画面に追加 → スタンドアロン表示」は http でも試せますが、**AndroidのインストールバナーとSWはHTTPS必須**です。合意用は必ずHTTPSで。

## 端末ごとの検証手順

### iPad（Safari）
1. 共有ボタン → **「ホーム画面に追加」**
2. ホーム画面のアイコンから起動
3. **アドレスバーが消え、スタンドアロン表示**になればOK（画面上部カードの「表示モード」が `standalone`）

### Android（Chrome）
1. 画面上の **「ホーム画面にインストール」** ボタン（または ⋮ →「アプリをインストール」）
2. インストール後、アイコンから起動
3. **全画面（`display:fullscreen`）で開けばOK**。「全画面にする」ボタン（Fullscreen API）も動作

## 合意のための確認ポイント（まとめ）
| 項目 | iPad(Safari) | Android(Chrome) |
|---|---|---|
| 全画面API（`requestFullscreen`） | **非対応**（iOS標準仕様） | 対応 |
| アドレスバー等を隠す | **ホーム画面追加 → スタンドアロン**で実現 | `display:fullscreen` で実現（＋全画面API） |
| ホーム画面インストール | 共有 →「ホーム画面に追加」（手動） | インストールバナー/メニューから |
| Service Worker | 対応（HTTPS必須） | 対応（HTTPS必須） |

→ **結論の方向性**：どちらの端末も「全画面相当の表示」と「ホーム画面からのアプリ起動」は実現可能。
iOSのみ Fullscreen API が使えないため、**全画面はホーム画面追加→スタンドアロン方式で合意**するのが現実解。
