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
    'images/image2_14.webp',
    'images/image2_15.webp',
    'images/image2_16.webp',
    'images/image2_17.webp',
    'images/image2_18.webp',
    'images/image2_19.webp',
    'images/image2_20.webp',
    'images/image2_21.webp',
    'images/image2_22.webp',
    'images/image2_23.webp',
    'images/image2_24.webp',
    'images/image2_25.webp',
    'images/image2_26.webp',
    'images/image2_27.webp',
    'images/image2_28.webp',
    'images/image2_29.webp',
    'images/image2_30.webp',
    'images/image2_31.webp',
    'images/image2_32.webp',
    'images/image2_33.webp',
    'images/image2_34.webp',
    'images/image2_35.webp',
    'images/image2_36.webp',
    'images/image2_37.webp',
    'images/image2_38.webp',
    'images/image2_39.webp',
    'images/image2_40.webp',
    'images/image2_41.webp',
    'images/image2_42.webp',
    'images/image2_43.webp',
    'images/image2_44.webp',
    'images/image2_45.webp',
    'images/image2_46.webp',
    'images/image2_47.webp',
    'images/image3.webp'
];
const IMAGE2_MAX_INDEX_BEFORE_GET_ANSWER = 39;
const IMAGE2_MAX_INDEX = 47;
let currentImage2Index = 0;

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
        currentImage2Index = 0;
        setImageFromCache(loadingImage, 'images/image2_0.webp');
        
        // APIリクエストを即座に送信（非同期で実行）
        const apiPromise = sendToAPI(question);
        
        // 画像切り替えアニメーションを開始
        await performImageAnimation_before_get_answer();
        
        // APIレスポンスを待機
        const answer = await apiPromise;

        // 画像切り替えアニメーションを開始
        await performImageAnimation_after_get_answer();

        displayAnswer(answer);
        
    } catch (error) {
        console.error('エラーが発生しました:', error);
        await performImageAnimation_after_get_answer();
        displayError('申し訳ございません。エラーが発生しました。もう一度お試しください。');
    } finally {
        // 送信ボタンを再有効化
        submitBtn.disabled = false;
        submitBtn.textContent = '言い切る';
    }
});

// 画像切り替えアニメーション
const FIRST_GAP_TIME = 0;
const GAP_TIME = 75;
async function performImageAnimation_before_get_answer() {
    await sleep(FIRST_GAP_TIME);
    for (; currentImage2Index <= IMAGE2_MAX_INDEX_BEFORE_GET_ANSWER; currentImage2Index++) {
        setImageFromCache(loadingImage, `images/image2_${currentImage2Index}.webp`);
        await sleep(GAP_TIME);
    }
}

async function performImageAnimation_after_get_answer() {
    for (; currentImage2Index <= IMAGE2_MAX_INDEX; currentImage2Index++) {
        setImageFromCache(loadingImage, `images/image2_${currentImage2Index}.webp`);
        await sleep(GAP_TIME);
    }
    setImageFromCache(loadingImage, 'images/image3.webp');
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
    let processedAnswer = answer;
    
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
