# AssertMan - 質問回答ウェブアプリ

シンプルで美しい質問回答ウェブアプリです。ユーザーが質問を入力すると、Awan LLM APIを使用して回答を生成し、画像切り替えアニメーション付きで表示します。

## 機能

- 📝 シンプルな質問入力フォーム
- 🎨 美しいUIデザイン（グラデーション背景、モダンなボタン）
- 🖼️ 画像切り替えアニメーション（image1.png → image2.png → image3.png）
- 🤖 Awan LLM APIとの連携
- 📱 レスポンシブデザイン（モバイル対応）
- ⚡ スムーズなアニメーション効果
- 🔒 セキュアなAPIキー管理

## ファイル構成

```
AssertManFrontEnd/
├── index.html          # メインHTMLファイル
├── styles.css          # CSSスタイル
├── script.js           # JavaScript機能
├── config.js           # 開発用設定ファイル（.gitignoreに含まれる）
├── image1.png          # 質問入力画面画像
├── image2.png          # 処理中画面画像
├── image3.png          # 回答画面画像
├── .gitignore          # Git除外設定
└── README.md           # このファイル
```

## セットアップ

### 1. Awan LLM APIキーの取得

1. [Awan LLM](https://awanllm.com/) にアクセス
2. アカウントを作成・ログイン
3. APIキーを取得

### 2. APIキーの設定（セキュアな方法）

#### 開発環境の場合
1. `config.js` ファイルを開く
2. `AWAN_API_KEY` を実際のAPIキーに設定：

```javascript
window.config = {
    AWAN_API_KEY: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // 実際のAPIキー
    // その他の設定...
};
```

#### 本番環境の場合
環境変数を使用してAPIキーを設定：

```bash
# 環境変数として設定
export AWAN_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 3. ローカルでの実行

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

1. **質問入力**: テキストエリアに質問を入力
2. **送信**: 「言い切る」ボタンをクリック
3. **アニメーション**: 
   - image1.png → image2.png（0.5秒）
   - image2.png → image3.png（0.5秒）
4. **回答表示**: Awan LLMからの回答が表示
5. **新しい質問**: 「新しい質問をする」ボタンでリセット

## ホスティング

このアプリは静的ファイルのみで構成されているため、以下のサービスで簡単にホスティングできます：

### Netlify
1. GitHubにリポジトリをプッシュ
2. Netlifyでリポジトリを接続
3. 環境変数で `AWAN_API_KEY` を設定
4. 自動デプロイ

### Vercel
1. GitHubにリポジトリをプッシュ
2. Vercelでリポジトリを接続
3. 環境変数で `AWAN_API_KEY` を設定
4. 自動デプロイ

### GitHub Pages
1. リポジトリのSettings → Pages
2. Sourceを「Deploy from a branch」に設定
3. ブランチを選択してデプロイ
4. **注意**: GitHub Pagesでは環境変数が使用できないため、別の方法が必要

## セキュリティ

### APIキーの安全な管理

- ✅ `config.js` は `.gitignore` に含まれているため、Gitにコミットされません
- ✅ 本番環境では環境変数を使用
- ✅ APIキーはフロントエンドのJavaScriptに直接記述されません
- ⚠️ 開発時のみ `config.js` にAPIキーを記述

### 推奨事項

1. **開発時**: `config.js` にAPIキーを設定（既にGit除外済み）
2. **本番環境**: 環境変数を使用
3. **APIキーの共有**: 絶対にGitリポジトリにコミットしない
4. **定期的な更新**: APIキーを定期的に更新する

## カスタマイズ

### 画像の変更
- `image1.png`, `image2.png`, `image3.png` を任意の画像に置き換え
- 同じファイル名で保存するか、HTML内のパスを変更

### スタイルの変更
- `styles.css` を編集して色やレイアウトをカスタマイズ
- グラデーション、フォント、サイズなどを調整可能

### API設定の変更
- `config.js` でモデル名、トークン数、温度などを調整
- 現在の設定：
  - モデル: `meta-llama/Llama-2-70b-chat-hf`
  - 最大トークン: 1000
  - 温度: 0.7

## 注意事項

- APIキーは公開リポジトリにコミットしないでください
- 本番環境では環境変数を使用することを推奨
- Awan LLM APIの利用制限と料金を確認してください
- `config.js` ファイルはGit管理から除外されています

## トラブルシューティング

### APIキーが設定されていない場合
- モック回答が表示されます
- コンソールに警告メッセージが表示されます
- `config.js` でAPIキーを設定してください

### 画像が表示されない場合
- 画像ファイルが正しいパスに配置されているか確認
- ファイル名の大文字小文字を確認

### APIエラーが発生する場合
- APIキーが正しく設定されているか確認
- ネットワーク接続を確認
- Awan LLM APIのステータスを確認

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。 