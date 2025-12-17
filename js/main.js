// 初期化処理

/**
 * 動画の読み込みエラーハンドリング
 * @param {HTMLVideoElement} video - 動画要素
 * @param {string} videoName - 動画の名前（ログ用）
 */
function setupVideoErrorHandling(video, videoName) {
    video.addEventListener('error', (e) => {
        console.error(`${videoName}の読み込みエラー:`, e);
        const error = video.error;
        if (error) {
            console.error('エラーコード:', error.code);
            console.error('エラーメッセージ:', error.message);
        }
        // 動画のパスを再試行
        const currentSrc = video.src;
        video.src = '';
        video.load();
        setTimeout(() => {
            video.src = currentSrc;
            video.load();
        }, 100);
    });
    
    video.addEventListener('loadstart', () => {
        // console.log(`${videoName}の読み込み開始`);
    });
    
    video.addEventListener('loadeddata', () => {
        // console.log(`${videoName}のデータ読み込み完了`);
    });
    
    video.addEventListener('canplay', () => {
        // console.log(`${videoName}の再生準備完了`);
    });
}

/**
 * ページ読み込み時の初期化
 */
document.addEventListener('DOMContentLoaded', async () => {
    warmupAPI();
    
    // 画像の読み込みエラーハンドリング
    if (displayImage) {
        displayImage.addEventListener('error', (e) => {
            console.error('display-imageの読み込みエラー:', e);
        });
        
        // 画像のロード後にサイズ計算を行う
        const initializeAfterImageLoad = () => {
            // 画像がロードされた後にサイズ計算を実行
            updateVideoSize();
            questionInput.focus();
        };
        
        if (displayImage.complete && displayImage.naturalHeight !== 0) {
            // 既にロードされている場合
            initializeAfterImageLoad();
        } else {
            // まだロードされていない場合、loadイベントを待つ
            displayImage.addEventListener('load', initializeAfterImageLoad, { once: true });
        }
    } else {
        // 画像要素がない場合（通常はないが、念のため）
        updateVideoSize();
        questionInput.focus();
    }
    
    if (answerVideo) {
        setupVideoErrorHandling(answerVideo, 'answer-video');
        // answer-videoは事前にメタデータを読み込む（preload="metadata"）
        // メタデータの読み込みを明示的に開始
        answerVideo.load();
        
        // エラー状態の時は動画のクリック/タッチで再生されないようにする（一度だけ追加）
        const preventPlayOnError = (e) => {
            if (globalErrorState) {
                e.preventDefault();
                e.stopPropagation();
                answerVideo.pause();
            }
        };
        answerVideo.addEventListener('click', preventPlayOnError);
        answerVideo.addEventListener('touchstart', preventPlayOnError);
    }
    
    // コマンド + エンターで送信
    questionInput.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            questionForm.dispatchEvent(new Event('submit'));
        }
    });
    
    // イベントハンドラーを設定
    setupFormSubmitHandler();
    setupNewQuestionButtonHandler();
});

