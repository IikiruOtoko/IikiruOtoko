// 画像の縦横比設定（グローバル変数）
const IMAGE_ASPECT_RATIO = 908 / 1604; // 横:縦 = 約 0.566
const IMAGE_WIDTH = 908;
const IMAGE_HEIGHT = 1604;

// 画像ファイルのリスト（プリロード用）
const IMAGE_FILES = [
    'images/image1.webp',
    'images/image2_0.webp',
    'images/image2_1.webp',
    'images/image2_2.webp',
    'images/image2_3.webp',
    'images/image2_4.webp',
    'images/image2_5.webp',
    'images/image2_6.webp',
    'images/image2_7.webp',
    'images/image2_8.webp',
    'images/image2_9.webp',
    'images/image2_10.webp',
    'images/image2_11.webp',
    'images/image2_12.webp',
    'images/image2_13.webp',
    'images/image3.webp'
];

// プリロードされた画像のキャッシュ
const imageCache = new Map();

// DOM要素の取得
const questionForm = document.getElementById('question-form');
const questionInput = document.getElementById('question-input');
const questionArea = document.getElementById('question-area');
const answerArea = document.getElementById('answer-area');
const loadingArea = document.getElementById('loading-area');
const answerText = document.getElementById('answer-text');
const newQuestionBtn = document.getElementById('new-question-btn');
const loadingImage = document.getElementById('loading-image');

// Awan LLM API設定
const AWAN_API_URL = 'https://api.awanllm.com/v1/chat/completions';

// 環境変数からAPIキーを取得（本番環境用）
// ローカル開発時は .env ファイルから読み込み
let AWAN_API_KEY = null;

// APIキーを取得する関数
function getApiKey() {
    // 設定ファイルから読み込み（存在する場合）
    if (typeof window !== 'undefined' && window.config && window.config.AWAN_API_KEY) {
        return window.config.AWAN_API_KEY;
    }
    
    // 環境変数から取得（Node.js環境の場合）
    if (typeof process !== 'undefined' && process.env && process.env.AWAN_API_KEY) {
        return process.env.AWAN_API_KEY;
    }
    
    return null;
}

// APIキーを初期化
AWAN_API_KEY = getApiKey();

// プリロードされた画像を使用して画像を設定する関数
function setImageFromCache(imgElement, imagePath) {
    if (imageCache.has(imagePath)) {
        imgElement.src = imageCache.get(imagePath).src;
    } else {
        imgElement.src = imagePath;
    }
}

// 画像をプリロードする関数
async function preloadImages() {
    console.log('🖼️ 画像のプリロードを開始...');
    let loadedCount = 0;
    const loadPromises = IMAGE_FILES.map(imagePath => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                imageCache.set(imagePath, img);
                loadedCount++;
                console.log(`✅ ${imagePath} をプリロード完了 (${loadedCount}/${IMAGE_FILES.length})`);
                resolve(imagePath);
            };
            img.onerror = () => {
                console.error(`❌ ${imagePath} のプリロードに失敗`);
                reject(new Error(`Failed to load ${imagePath}`));
            };
            img.src = imagePath;
        });
    });
    
    try {
        await Promise.all(loadPromises);
        console.log('🎉 すべての画像のプリロードが完了しました！');
    } catch (error) {
        console.error('画像のプリロード中にエラーが発生:', error);
    }
}

// 画像サイズを動的に計算する関数
function calculateImageSize() {
    const containerHeight = window.innerHeight * 0.95; // 95vh
    const containerWidth = window.innerWidth * 0.9; // 90% of viewport width
    
    // スマホ（縦）の場合は横幅いっぱいにする
    const isMobilePortrait = window.innerWidth < 768 && window.innerHeight > window.innerWidth;
    
    if (isMobilePortrait) {
        // スマホ（縦）の場合は横幅いっぱい
        const imageWidth = window.innerWidth; // 100% of viewport width
        const imageHeight = imageWidth / IMAGE_ASPECT_RATIO;
        return { width: imageWidth, height: imageHeight };
    }
    
    // 縦横比を考慮して画像サイズを計算
    let imageWidth, imageHeight;
    
    if (containerHeight * IMAGE_ASPECT_RATIO <= containerWidth) {
        // 高さに合わせる
        imageHeight = containerHeight;
        imageWidth = containerHeight * IMAGE_ASPECT_RATIO;
    } else {
        // 幅に合わせる
        imageWidth = containerWidth;
        imageHeight = containerWidth / IMAGE_ASPECT_RATIO;
    }
    
    return { width: imageWidth, height: imageHeight };
}

// 画像サイズを更新する関数
function updateImageSize() {
    const { width, height } = calculateImageSize();
    const images = document.querySelectorAll('.main-image');
    
    images.forEach(img => {
        img.style.width = `${width}px`;
        img.style.height = `${height}px`;
    });
    
    // form boxの幅も画像の幅の90%に調整
    const overlays = document.querySelectorAll('.overlay-form, .overlay-answer');
    overlays.forEach(overlay => {
        overlay.style.width = `${width * 0.9}px`;
    });
}

// ウィンドウリサイズ時に画像サイズを更新
window.addEventListener('resize', updateImageSize);

// フォーム送信処理
questionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const question = questionInput.value.trim();
    if (!question) return;
    
    // 送信ボタンを無効化
    const submitBtn = questionForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '処理中...';
    
    try {
        // 質問エリアを非表示、ローディングエリアを表示
        questionArea.classList.add('hidden');
        loadingArea.classList.remove('hidden');
        
        // ローディング画像をimage2_0.webpに設定（前回のimage3.webpを上書き）
        // プリロードされた画像を使用
        setImageFromCache(loadingImage, 'images/image2_0.webp');
        
        // APIリクエストを即座に送信（非同期で実行）
        const apiPromise = sendToAwanLLM(question);
        
        // 画像切り替えアニメーションを開始
        await performImageAnimation();
        
        // APIレスポンスを待機
        const answer = await apiPromise;
        
        // // image3.webp表示から1.0秒経過しているかチェック
        // const timeSinceImage3 = Date.now() - image3StartTime;
        // if (timeSinceImage3 >= 1000) {
        //     // 1.0秒以上経過している場合は即座に表示
        //     displayAnswer(answer);
        // } else {
        //     // 1.0秒未満の場合は残り時間待機
        //     const remainingTime = 1000 - timeSinceImage3;
        //     await sleep(remainingTime);
        //     displayAnswer(answer);
        // }

        displayAnswer(answer);
        
    } catch (error) {
        console.error('エラーが発生しました:', error);
        displayError('申し訳ございません。エラーが発生しました。もう一度お試しください。');
    } finally {
        // 送信ボタンを再有効化
        submitBtn.disabled = false;
        submitBtn.textContent = '言い切る';
    }
});

// image3.webp表示開始時刻を記録する変数
let image3StartTime = 0;

// 画像切り替えアニメーション
async function performImageAnimation() {
    const FIRST_GAP_TIME = 250;
    const GAP_TIME = 250;

    // ボタン押下から0.5秒待機
    await sleep(FIRST_GAP_TIME);
    
    // image2_2.webpに切り替え（0.5秒待機）
    setImageFromCache(loadingImage, 'images/image2_2.webp');
    await sleep(GAP_TIME);
    
    // image2_3.webpに切り替え（0.5秒待機）
    setImageFromCache(loadingImage, 'images/image2_3.webp');
    await sleep(GAP_TIME);
    
    // image2_4.webpに切り替え（0.5秒待機）
    setImageFromCache(loadingImage, 'images/image2_4.webp');
    await sleep(GAP_TIME);
    
    // image2_5.webpに切り替え（0.5秒待機）
    setImageFromCache(loadingImage, 'images/image2_5.webp');
    await sleep(GAP_TIME);
    
    // image2_6.webpに切り替え（0.5秒待機）
    setImageFromCache(loadingImage, 'images/image2_6.webp');
    await sleep(GAP_TIME);

    // image2_7.webpに切り替え（0.5秒待機）
    setImageFromCache(loadingImage, 'images/image2_7.webp');
    await sleep(GAP_TIME);
    
    // image2_8.webpに切り替え（0.5秒待機）
    setImageFromCache(loadingImage, 'images/image2_8.webp');
    await sleep(GAP_TIME);
    
    // image2_9.webpに切り替え（0.5秒待機）
    setImageFromCache(loadingImage, 'images/image2_9.webp');
    await sleep(GAP_TIME);
    
    // image2_10.webpに切り替え（0.5秒待機）
    setImageFromCache(loadingImage, 'images/image2_10.webp');
    await sleep(GAP_TIME);
    
    // image2_11.webpに切り替え（0.5秒待機）
    setImageFromCache(loadingImage, 'images/image2_11.webp');
    await sleep(GAP_TIME);

    // image2_12.webpに切り替え（0.5秒待機）
    setImageFromCache(loadingImage, 'images/image2_12.webp');
    await sleep(GAP_TIME);

    // image2_13.webpに切り替え（0.5秒待機）
    setImageFromCache(loadingImage, 'images/image2_13.webp');
    await sleep(GAP_TIME);
    
    // image3.webpに切り替え（時刻を記録）
    setImageFromCache(loadingImage, 'images/image3.webp');
    image3StartTime = Date.now();
    // await sleep(GAP_TIME);
}

// 指定時間待機する関数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Awan LLM APIにリクエスト送信
async function sendToAwanLLM(question) {
    const requestBody = {
        model: "Meta-Llama-3-8B-Instruct", // Awan LLMで利用可能なモデル
        messages: [
            {
                role: "system",
                content: "質問に対して結論を**端的に**返して。**間違っていても良いので、必ず結論を出して**。**分からない質問に対しても、曖昧な回答・無回答は絶対に禁止**。例えば「分からない」「答えられない」「言えない」などの回答は**禁止**。**長い説明も禁止**。**結論以外の文字列の出力は禁止**。「です」「ます」「。」「.」などの敬語や句読点は禁止。例：「男女の友情は成立するかしないか？」→「する」「卵が先か？鶏が先か？」→「卵」「10年後の今日の天気は？」→「晴れ」"
            },
            {
                role: "user",
                content: question
            }
        ],
        repetition_penalty: 1.1,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        MAX_TOKENS: 16,
        stream: false
    };
    
    console.log('APIリクエスト送信中...', requestBody);
    
    const response = await fetch(AWAN_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AWAN_API_KEY}`
        },
        body: JSON.stringify(requestBody)
    });
    
    console.log('APIレスポンス:', response.status, response.statusText);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('APIエラー詳細:', errorText);
        throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('APIレスポンスデータ:', data);
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
    } else {
        throw new Error('Invalid response format from API');
    }
}

// 回答を表示
function displayAnswer(answer) {
    // 語尾の「。」「.」「です」を除去
    let processedAnswer = answer;
    
    // 語尾の「。」と「.」を除去
    processedAnswer = processedAnswer.replace(/[。.]$/, '');
    
    // 語尾の「です」を除去
    processedAnswer = processedAnswer.replace(/です$/, '');
    
    // 空文字列になった場合は元の文字列を使用
    if (processedAnswer.trim() === '') {
        processedAnswer = answer;
    }
    
    answerText.textContent = processedAnswer;
    
    // ローディングエリアを非表示、回答エリアを表示
    loadingArea.classList.add('hidden');
    answerArea.classList.remove('hidden');
}

// エラーを表示
function displayError(errorMessage) {
    answerText.textContent = errorMessage;
    
    // ローディングエリアを非表示、回答エリアを表示
    loadingArea.classList.add('hidden');
    answerArea.classList.remove('hidden');
}

// 新しい質問ボタンの処理
newQuestionBtn.addEventListener('click', () => {
    // 回答エリアを非表示、質問エリアを表示
    answerArea.classList.add('hidden');
    questionArea.classList.remove('hidden');
    
    // フォームをリセット
    questionForm.reset();
    questionInput.focus();
});

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async () => {
    // 画像のプリロードを開始
    await preloadImages();
    
    questionInput.focus();
    updateImageSize(); // 画像サイズを初期化
    
    // コマンド + エンターで送信
    questionInput.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            questionForm.dispatchEvent(new Event('submit'));
        }
    });
});

// GitHub Pages環境での追加チェック
if (window.location.hostname.includes('github.io')) {
    console.log('🌐 GitHub Pages環境で実行中');
    console.log('📝 APIキーが設定されていない場合:');
    console.log('1. GitHubリポジトリのSettings → Secrets and variables → Actions');
    console.log('2. 「New repository secret」でAWAN_API_KEYを設定');
    console.log('3. GitHub Actionsが自動的にconfig.jsを生成します');
}

// 開発用のモック回答（APIキーが設定されていない場合）
if (AWAN_API_KEY === null) { // APIキーが取得できなかった場合
    console.warn('Awan LLM APIキーが設定されていません。モック回答を使用します。');
    console.warn('config.jsファイルが正しく読み込まれているか確認してください。');
    
    // モック回答用の関数を上書き
    async function sendToAwanLLM(question) {
        // 実際のAPI呼び出しをシミュレート
        await sleep(1000);
        
        const mockAnswers = [
            "これは素晴らしい質問ですね。私の見解では、この問題について深く考える必要があります。",
            "興味深い視点です。この質問に対する答えは、状況によって異なる場合があります。",
            "確かに、この問題は複雑で、簡単に答えられるものではありません。",
            "あなたの質問は非常に重要で、多くの人が同じ疑問を持っていると思います。",
            "この質問について、私は以下のように考えます：まず、問題の本質を理解することが重要です。"
        ];
        
        const randomAnswer = mockAnswers[Math.floor(Math.random() * mockAnswers.length)];
        return randomAnswer + "\n\n（これはモック回答です。実際のAPIキーを設定すると、Awan LLMからの回答が表示されます。）";
    }
} 