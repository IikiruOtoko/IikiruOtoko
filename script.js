// 画像の縦横比設定（グローバル変数）
const IMAGE_ASPECT_RATIO = 908 / 1604; // 横:縦 = 約 0.566
const IMAGE_WIDTH = 908;
const IMAGE_HEIGHT = 1604;

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

// 環境変数からAPIキーを取得する関数
function getApiKey() {
    // 本番環境では環境変数から取得
    if (typeof process !== 'undefined' && process.env) {
        return process.env.AWAN_API_KEY;
    }
    
    // ローカル開発時は .env ファイルから読み込みを試行
    // 注意: ブラウザでは直接 .env ファイルを読み込めないため、
    // 実際の実装ではサーバーサイドで環境変数を設定する必要があります
    
    // 開発用の設定ファイルから読み込み（存在する場合）
    if (typeof window !== 'undefined' && window.config) {
        return window.config.AWAN_API_KEY;
    }
    
    return null;
}

// APIキーを初期化
AWAN_API_KEY = getApiKey();

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
        
        // ローディング画像をimage2_1.pngに設定（前回のimage3.pngを上書き）
        loadingImage.src = 'image2_1.png';
        
        // APIリクエストを即座に送信（非同期で実行）
        const apiPromise = sendToAwanLLM(question);
        
        // 画像切り替えアニメーションを開始
        await performImageAnimation();
        
        // APIレスポンスを待機
        const answer = await apiPromise;
        
        // image3.png表示から1.0秒経過しているかチェック
        const timeSinceImage3 = Date.now() - image3StartTime;
        if (timeSinceImage3 >= 1000) {
            // 1.0秒以上経過している場合は即座に表示
            displayAnswer(answer);
        } else {
            // 1.0秒未満の場合は残り時間待機
            const remainingTime = 1000 - timeSinceImage3;
            await sleep(remainingTime);
            displayAnswer(answer);
        }
        
    } catch (error) {
        console.error('エラーが発生しました:', error);
        displayError('申し訳ございません。エラーが発生しました。もう一度お試しください。');
    } finally {
        // 送信ボタンを再有効化
        submitBtn.disabled = false;
        submitBtn.textContent = '言い切る';
    }
});

// image3.png表示開始時刻を記録する変数
let image3StartTime = 0;

// 画像切り替えアニメーション
async function performImageAnimation() {
    // ボタン押下から0.5秒待機
    await sleep(500);
    
    // image2_2.pngに切り替え（0.5秒待機）
    loadingImage.src = 'image2_2.png';
    await sleep(500);
    
    // image2_3.pngに切り替え（0.5秒待機）
    loadingImage.src = 'image2_3.png';
    await sleep(500);
    
    // image2_4.pngに切り替え（0.5秒待機）
    loadingImage.src = 'image2_4.png';
    await sleep(500);
    
    // image2_5.pngに切り替え（0.5秒待機）
    loadingImage.src = 'image2_5.png';
    await sleep(500);
    
    // image2_6.pngに切り替え（0.5秒待機）
    loadingImage.src = 'image2_6.png';
    await sleep(500);

    // image2_7.pngに切り替え（0.5秒待機）
    loadingImage.src = 'image2_7.png';
    await sleep(500);
    
    // image2_8.pngに切り替え（0.5秒待機）
    loadingImage.src = 'image2_8.png';
    await sleep(500);
    
    // image3.pngに切り替え（時刻を記録）
    loadingImage.src = 'image3.png';
    image3StartTime = Date.now();
    await sleep(500);
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
                content: "質問に対して必ず結論を端的に返してください。結論が出せないような問題に対しても、必ず1つの結論を出して。曖昧な回答は禁止。長い説明は禁止。結論以外の文字列の出力は禁止。「です」「ます」「。」「.」などの敬語や句読点は禁止。例：「男女の友情は成立するかしないか？」→「する」「卵が先か？鶏が先か？」→「卵」"
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
        max_tokens: 8,
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
document.addEventListener('DOMContentLoaded', () => {
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

// 開発用のモック回答（APIキーが設定されていない場合）
if (AWAN_API_KEY === null) { // 環境変数から取得できなかった場合
    console.warn('Awan LLM APIキーが設定されていません。モック回答を使用します。');
    
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