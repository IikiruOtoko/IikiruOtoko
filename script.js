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

// API設定
const API_URL_BASE = 'https://iikiruotokoapi-1.onrender.com/';
const API_URL = API_URL_BASE + 'chat';

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
    let loadedCount = 0;
    const loadPromises = IMAGE_FILES.map(imagePath => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                imageCache.set(imagePath, img);
                loadedCount++;
                resolve(imagePath);
            };
            img.onerror = () => {
                reject(new Error(`Failed to load ${imagePath}`));
            };
            img.src = imagePath;
        });
    });
    
    try {
        await Promise.all(loadPromises);
    } catch (error) {
        console.log(error);
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
        const apiPromise = sendToAPI(question);
        
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

// APIにリクエスト送信
async function sendToAPI(question) {
    const requestBody = {
        message: question
    };
    
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.log(errorText);
        throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.answer) {
        return data.answer;
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

// コールドスタート対策: APIを叩いてサーバーを起動状態に保つ
async function warmupAPI() {
    try {
        const response = await fetch(API_URL_BASE, {
            method: 'GET'
        });
    } catch (error) {
        console.log(error);
    }
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async () => {
    warmupAPI();
    
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
