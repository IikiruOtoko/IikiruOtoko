# AssertMan - 言い切り男

このプロジェクトは、[言い切り男](https://iikiruotoko.github.io/IikiruOtoko/)のためのコードです。

シンプルで美しい質問回答ウェブアプリです。ユーザーが質問を入力すると、バックエンドAPIを使用して回答を生成し、画像切り替えアニメーション付きで表示します。

## 機能

- 📝 シンプルな質問入力フォーム
- 🎨 美しいUIデザイン（グラデーション背景、モダンなボタン）
- 🖼️ 画像切り替えアニメーション（image1.webp → image2_*.webp → image3.webp）
- 🤖 バックエンドAPIとの連携
- 📱 レスポンシブデザイン（モバイル対応）
- ⚡ スムーズなアニメーション効果

## ファイル構成

```
IikiruOtoko/
├── index.html          # メインHTMLファイル
├── styles.css          # CSSスタイル
├── script.js           # JavaScript機能
├── images/             # 画像ファイル
│   ├── image1.webp      # 言い切り入力画面画像
│   ├── image2_0.webp    # 処理中画面画像0
│   ├── image2_1.webp    # 処理中画面画像1
│   ├── image2_2.webp    # 処理中画面画像2
│   ├── image2_3.webp    # 処理中画面画像3
│   ├── image2_4.webp    # 処理中画面画像4
│   ├── image2_5.webp    # 処理中画面画像5
│   ├── image2_6.webp    # 処理中画面画像6
│   ├── image2_7.webp    # 処理中画面画像7
│   ├── image2_8.webp    # 処理中画面画像8
│   ├── image2_9.webp    # 処理中画面画像9
│   ├── image2_10.webp   # 処理中画面画像10
│   ├── image2_11.webp   # 処理中画面画像11
│   ├── image2_12.webp   # 処理中画面画像12
│   ├── image2_13.webp   # 処理中画面画像13
│   ├── image3.webp      # 回答画面画像
│   └── icon.png        # ファビコン
├── robots.txt          # 検索エンジン向け設定
├── sitemap.xml         # サイトマップ
└── README.md           # このファイル
```

## デモサイト

- **本番環境**: [言い切り男](https://iikiruotoko.github.io/IikiruOtoko/)

## セットアップ

### ローカルでの実行

1. すべてのファイルを同じディレクトリに配置
2. `index.html` をブラウザで開く

または、ローカルサーバーを使用：

```bash
# Python 3の場合
python -m http.server 8000

# Node.jsの場合（http-serverが必要）
npx http-server
```

その後、ブラウザで `http://localhost:8000` にアクセス

## 使用方法

1. **言い切り入力**: テキストエリアに言い切りたいことを入力
2. **送信**: 「言い切る」ボタンをクリック（または Cmd/Ctrl + Enter）
3. **アニメーション**: 
   - image1.webp → image2_0.webp → image2_2.webp → ... → image2_13.webp → image3.webp
   - 各画像が0.25秒間隔で切り替わります
4. **回答表示**: バックエンドAPIからの回答が表示されます
5. **新しい言い切り**: 「新しい言い切りをする」ボタンでリセット

## ホスティング

このアプリは静的ファイルのみで構成されているため、以下のサービスで簡単にホスティングできます：

### GitHub Pages
1. リポジトリのSettings → Pages
2. Sourceを「Deploy from a branch」に設定
3. ブランチとディレクトリを選択
4. 自動デプロイ

### Netlify
1. GitHubにリポジトリをプッシュ
2. Netlifyでリポジトリを接続
3. 自動デプロイ

### Vercel
1. GitHubにリポジトリをプッシュ
2. Vercelでリポジトリを接続
3. 自動デプロイ

**注意**: このアプリはバックエンドAPI（`https://iikiruotokoapi.onrender.com/chat`）を使用します。APIキーの設定は不要です。

## アーキテクチャ

このアプリは以下の構成で動作します：

- **フロントエンド**: 静的HTML/CSS/JavaScript（このリポジトリ）
- **バックエンドAPI**: `https://iikiruotokoapi.onrender.com/chat`
  - FastAPIで実装されたREST API
  - OpenAI GPT-4.1-miniを使用して回答を生成
  - 同じ質問に対する回答をキャッシュして高速化

APIキーなどの機密情報はバックエンドで管理されているため、フロントエンド側での設定は不要です。

## カスタマイズ

### 画像の変更
- `image1.webp`, `image2.webp`, `image3.webp` を任意の画像に置き換え
- 同じファイル名で保存するか、HTML内のパスを変更

### スタイルの変更
- `styles.css` を編集して色やレイアウトをカスタマイズ
- グラデーション、フォント、サイズなどを調整可能

### APIエンドポイントの変更
- `script.js` の `API_URL` 定数を変更することで、別のAPIエンドポイントを使用できます
- 現在の設定：
  - API URL: `https://iikiruotokoapi.onrender.com/chat`

## 注意事項

- バックエンドAPIが正常に動作していることを確認してください
- APIエンドポイントが変更された場合は、`script.js`の`API_URL`を更新してください

## トラブルシューティング

### APIエラーが発生する場合
1. ブラウザのコンソール（F12）でエラーメッセージを確認
2. ネットワーク接続を確認
3. バックエンドAPI（`https://iikiruotokoapi.onrender.com/chat`）が正常に動作しているか確認
4. CORSエラーが発生している場合は、バックエンドAPIの設定を確認

### 画像が表示されない場合
- 画像ファイルが正しいパスに配置されているか確認
- ファイル名の大文字小文字を確認
- ブラウザのコンソールで画像の読み込みエラーを確認

### 回答が表示されない場合
- APIレスポンスの形式が正しいか確認（`{ answer: "..." }`形式である必要があります）
- ブラウザのコンソールでAPIレスポンスを確認

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。 