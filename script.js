// 動画の縦横比設定（グローバル変数）
const VIDEO_ASPECT_RATIO = 16 / 9; // 一般的な動画のアスペクト比（必要に応じて調整）
const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;

// 実際の動画サイズ（既知）
const ACTUAL_VIDEO_WIDTH = 908;
const ACTUAL_VIDEO_HEIGHT = 1604;
const ACTUAL_VIDEO_ASPECT_RATIO = ACTUAL_VIDEO_WIDTH / ACTUAL_VIDEO_HEIGHT; // 約0.566

// テキスト表示の切り替え時間（秒）
const TIME_LOADING_END = 7.18; // 質問内容の表示終了時間
const TIME_ANSWER_DISPLAY = 8.37; // 回答の表示開始時間（この時点でAPI結果をチェック）

// テキスト表示のフォントサイズ
const FontSize = '32px';
const FontSizeBig = '40px';

// DOM要素の取得
const questionForm = document.getElementById('question-form');
const questionInput = document.getElementById('question-input');
const contentArea = document.getElementById('content-area');
const answerText = document.getElementById('answer-text');
const newQuestionBtn = document.getElementById('new-question-btn');
const displayImage = document.getElementById('display-image');
const answerVideo = document.getElementById('answer-video');
const overlay = document.getElementById('overlay');
const formContent = document.getElementById('form-content');
const answerContent = document.getElementById('answer-content');

// エラー状態を追跡（グローバル）
let globalErrorState = false;

// 答えを表示しているかどうかを追跡（グローバル）
let isShowingAnswer = false;

// API設定
// const API_URL_BASE = 'https://iikiruotokoapi-1.onrender.com/';
const API_URL_BASE = 'http://localhost:10000/';
const API_URL = API_URL_BASE + 'chat';

// overlayの固定width（一度設定したら変更しない）
let fixedOverlayWidth = null;

// 動画サイズを動的に計算する関数
function calculateVideoSize() {
    const containerHeight = window.innerHeight * 0.98; // 98vh
    const containerWidth = window.innerWidth * 0.9; // 90% of viewport width
    
    // スマホ（縦）の場合は横幅いっぱいにする
    const isMobilePortrait = window.innerWidth < 768 && window.innerHeight > window.innerWidth;
    
    if (isMobilePortrait) {
        // スマホ（縦）の場合は横幅いっぱい、高さは画面に収まる範囲で最大に
        const videoWidth = window.innerWidth; // 100% of viewport width
        const calculatedHeight = videoWidth / VIDEO_ASPECT_RATIO;
        // 画面の高さを超えないようにする
        const videoHeight = Math.min(calculatedHeight, containerHeight);
        return { width: videoWidth, height: videoHeight };
    }
    
    // 縦横比を考慮して動画サイズを計算
    let videoWidth, videoHeight;
    
    if (containerHeight * VIDEO_ASPECT_RATIO <= containerWidth) {
        // 高さに合わせる
        videoHeight = containerHeight;
        videoWidth = containerHeight * VIDEO_ASPECT_RATIO;
    } else {
        // 幅に合わせる
        videoWidth = containerWidth;
        videoHeight = containerWidth / VIDEO_ASPECT_RATIO;
    }
    
    return { width: videoWidth, height: videoHeight };
}

// 動画・画像サイズを更新する関数
function updateVideoSize() {
    const isMobilePortrait = window.innerWidth < 768 && window.innerHeight > window.innerWidth;
    const mediaElements = document.querySelectorAll('.main-video');
    
    // 動画サイズを計算（デスクトップの場合）
    let calculatedVideoWidth = null;
    let calculatedVideoHeight = null;
    if (!isMobilePortrait) {
        const { width, height } = calculateVideoSize();
        calculatedVideoWidth = width;
        calculatedVideoHeight = height;
        mediaElements.forEach(element => {
            element.style.width = `${width}px`;
            element.style.height = `${height}px`;
        });
    } else {
        // スマホの場合はCSSで制御（JavaScriptでサイズを設定しない）
        mediaElements.forEach(element => {
            element.style.width = '';
            element.style.height = '';
        });
    }
    
    // 動画・画像のサイズ設定後にテキストボックスの幅と位置を調整（少し遅延を入れる）
    // calculatedVideoWidthを確実に参照できるように、クロージャで保持
    // requestAnimationFrameを使って、レンダリング後に確実に高さを取得
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            setTimeout(() => {
        const container = contentArea.querySelector('.video-container');
        if (!container || !overlay) return;
        
        // 現在表示されているメディア（画像または動画）を取得
        const currentMedia = displayImage.classList.contains('hidden') ? answerVideo : displayImage;
        
        if (!currentMedia) return;
        
        const mediaRect = currentMedia.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // 幅の設定（固定widthが設定されている場合はそれを使用、そうでない場合は計算）
        let overlayWidth;
        if (fixedOverlayWidth !== null) {
            // 固定widthが設定されている場合はそれを使用
            overlayWidth = fixedOverlayWidth;
        } else {
            // 固定widthが設定されていない場合は計算
            // 動画の高さから横幅を計算（動画サイズ: 908 * 1604）
            const actualMediaHeight = mediaRect.height;
            if (actualMediaHeight > 0) {
                // 動画の高さから、アスペクト比を使って幅を計算
                const calculatedVideoWidthFromHeight = actualMediaHeight * ACTUAL_VIDEO_ASPECT_RATIO;
                // その幅の0.965倍をoverlayの幅とする
                overlayWidth = calculatedVideoWidthFromHeight * 0.965;
            } else {
                // フォールバック: 従来の方法
                if (!isMobilePortrait) {
                    const videoWidth = calculatedVideoWidth !== null && calculatedVideoWidth > 0 
                        ? calculatedVideoWidth 
                        : calculateVideoSize().width;
                    overlayWidth = videoWidth * 0.965;
                } else {
                    const actualMediaWidth = currentMedia.offsetWidth || currentMedia.clientWidth;
                    overlayWidth = actualMediaWidth * 0.965;
                }
            }
            // 計算したwidthを固定widthとして保存
            fixedOverlayWidth = overlayWidth;
        }
        
        overlay.style.width = `${overlayWidth}px`;
        overlay.style.maxWidth = `${overlayWidth}px`;
        overlay.style.minWidth = `${overlayWidth}px`;
        
        // 動画の高さを基準に位置と高さを設定
        if (containerRect && mediaRect) {
            const mediaHeight = mediaRect.height;
            const mediaTop = mediaRect.top;
            const containerTop = containerRect.top;
            
            // textareaやanswer-textの高さを調整
            const textarea = overlay.querySelector('textarea');
            const answerText = overlay.querySelector('.answer-text');
            const formContent = overlay.querySelector('.form-content');
            const answerContent = overlay.querySelector('.answer-content');
            
            // 動画の上端からの相対位置を計算
            // 答えを表示する際は 72、質問時は 66
            const overlayTopPercent = isShowingAnswer ? 72 : 66;
            const overlayBottomPercent = 90;
            
            const overlayHeight = mediaHeight * (overlayBottomPercent - overlayTopPercent) / 100;
            
            // コンテナ内でのテキストボックスの上端位置
            const overlayTopInContainer = (mediaTop - containerTop) + (mediaHeight * overlayTopPercent / 100);
            
            // コンテナの下端からの距離 = コンテナの高さ - (上端位置 + 高さ)
            const distanceFromContainerBottom = containerRect.height - (overlayTopInContainer + overlayHeight);
            
            overlay.style.bottom = `${distanceFromContainerBottom}px`;
            overlay.style.height = `${overlayHeight}px`;
            overlay.style.maxHeight = `${overlayHeight}px`;
            overlay.style.minHeight = `${overlayHeight}px`;
            
            // 内部要素の高さを調整
            const overlayPadding = 15; // padding: 15px（上下）
            
            // フォーム表示時（質問時）の処理
            if (formContent && !formContent.classList.contains('hidden')) {
                const inputGroupGap = 5; // gap: 5px（テキストボックスとボタンの間）
                const questionFormGap = 8; // gap: 8px（question-formのgap、input-groupとterms-noticeの間）
                
                // ボタンの高さを取得
                const submitBtn = overlay.querySelector('.submit-btn');
                let buttonHeight = 36; // デフォルト36px
                if (submitBtn) {
                    buttonHeight = submitBtn.offsetHeight || submitBtn.clientHeight || 36;
                }
                
                // terms-noticeの高さを直接取得
                const termsNotice = overlay.querySelector('.terms-notice');
                let termsNoticeHeight = 0;
                if (termsNotice) {
                    // 複数の方法で高さを取得して、最も確実な値を使用
                    const termsNoticeStyle = window.getComputedStyle(termsNotice);
                    const termsNoticeRect = termsNotice.getBoundingClientRect();
                    
                    // offsetHeight、scrollHeight、getBoundingClientRect()の高さを比較
                    const offsetHeight = termsNotice.offsetHeight || 0;
                    const scrollHeight = termsNotice.scrollHeight || 0;
                    const rectHeight = termsNoticeRect.height || 0;
                    
                    // 最も大きい値を使用（テキストが折り返されている場合を考慮）
                    termsNoticeHeight = Math.max(offsetHeight, scrollHeight, rectHeight);
                    
                    // マージンも考慮
                    const termsNoticeMarginTop = parseFloat(termsNoticeStyle.marginTop) || 0;
                    const termsNoticeMarginBottom = parseFloat(termsNoticeStyle.marginBottom) || 0;
                    termsNoticeHeight += termsNoticeMarginTop + termsNoticeMarginBottom;
                    
                    // 高さが0の場合は、question-form全体から計算（フォールバック）
                    if (termsNoticeHeight <= 0) {
                        const questionForm = overlay.querySelector('.question-form');
                        const inputGroup = overlay.querySelector('.input-group');
                        if (questionForm && inputGroup) {
                            const questionFormRect = questionForm.getBoundingClientRect();
                            const inputGroupRect = inputGroup.getBoundingClientRect();
                            termsNoticeHeight = questionFormRect.height - inputGroupRect.height - questionFormGap;
                        }
                    }
                }
                
                // テキストボックスの高さ = overlayの高さの50%
                const contentHeight = overlayHeight * 0.425;
                
                const textarea = overlay.querySelector('textarea');
                if (textarea && contentHeight > 0) {
                    textarea.style.height = `${contentHeight}px`;
                    textarea.style.minHeight = `${contentHeight}px`;
                    textarea.style.maxHeight = `${contentHeight}px`;
                }
            }
            
            // 回答表示時はanswer-textの高さを制限しない（中央配置のため）
            if (answerContent && !answerContent.classList.contains('hidden')) {
                if (answerText) {
                    // 中央配置のため、高さは自動
                    answerText.style.height = 'auto';
                    answerText.style.minHeight = 'auto';
                    answerText.style.maxHeight = 'none';
                }
            }
        }
            }, 50); // 遅延を増やして、要素が確実にレンダリングされた後に高さを取得
        });
    });
}

// リサイズ処理をデバウンスする関数
let resizeTimeout;
function debouncedUpdateVideoSize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // リサイズ時は固定widthをリセットして再計算
        fixedOverlayWidth = null;
        updateVideoSize();
    }, 100); // 100ms待機してから実行
}

// ウィンドウリサイズ時に動画サイズを更新
window.addEventListener('resize', debouncedUpdateVideoSize);

// 画面の向きが変わった時にも更新
window.addEventListener('orientationchange', () => {
    // 向きが変わった後、レイアウトが確定するまで少し待つ
    setTimeout(() => {
        // 向きが変わった時は固定widthをリセットして再計算
        fixedOverlayWidth = null;
        updateVideoSize();
    }, 200);
});

// フォーム送信処理
questionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const question = questionInput.value.trim();
    if (!question) return;
    
    // 送信ボタンを無効化
    const submitBtn = questionForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    
    try {
        // オーバーレイの位置情報を保存（切り替え前に）
        let savedBottom = null;
        let savedHeight = null;
        let savedWidth = null;
        
        if (overlay) {
            // getComputedStyleで実際の値を取得
            const computedStyle = window.getComputedStyle(overlay);
            savedBottom = computedStyle.bottom;
            savedHeight = computedStyle.height;
            savedWidth = computedStyle.width;
        }
        
        // 画像を非表示、動画を表示
        displayImage.classList.add('hidden');
        answerVideo.classList.remove('hidden');
        
        // フォームコンテンツを非表示、回答コンテンツを表示
        formContent.classList.add('hidden');
        answerContent.classList.remove('hidden');
        
        // 回答エリアに質問内容を初期表示
        answerText.textContent = question;
        answerText.style.fontSize = '32px';
        
        // オーバーレイの位置を即座に設定（一瞬の位置ずれを防ぐ）
        if (overlay && savedBottom && savedBottom !== 'auto') {
            overlay.style.bottom = savedBottom;
            if (savedHeight && savedHeight !== 'auto') overlay.style.height = savedHeight;
            if (savedWidth && savedWidth !== 'auto') {
                // widthを固定値として保存
                const widthValue = parseFloat(savedWidth);
                if (!isNaN(widthValue)) {
                    fixedOverlayWidth = widthValue;
                    overlay.style.width = savedWidth;
                    overlay.style.maxWidth = savedWidth;
                    overlay.style.minWidth = savedWidth;
                }
            }
        }
        
        // 回答エリアが表示された後、動画サイズと位置を更新
        // requestAnimationFrameでレイアウト確定後に実行
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                updateVideoSize();
            });
        });
        
        // APIリクエストを開始（Promiseを保存）
        let apiPromise = sendToAPI(question).then(answerData => {
            return { success: true, answerData: answerData };
        }).catch(error => {
            console.error('エラーが発生しました:', error);
            // エラーコードとメッセージを返す
            const errorCode = error.status || error.code || 'UNKNOWN';
            const errorMessage = error.message || '申し訳ございません。エラーが発生しました。';
            return { 
                success: false, 
                error: errorMessage,
                errorCode: errorCode
            };
        });
        
        // API結果の状態を管理
        let apiResult = null;
        let hasReachedAnswerDisplay = false;
        let retryPlayHandlers = []; // 再試行イベントハンドラーを保存
        // エラー状態をリセット
        globalErrorState = false;
        // 答え表示状態をリセット（質問内容を表示するので false）
        isShowingAnswer = false;
        // 質問内容を保存
        const savedQuestion = question;
        
        // 動画の再生時間に応じてテキストを更新する関数
        const changeTextAndFontSizeImmediately = (text, fontSize) => {
            answerText.textContent = text;
            const originalTransition = answerText.style.transition;
            answerText.style.transition = 'none';
            answerText.style.fontSize = fontSize;
            requestAnimationFrame(() => {
                answerText.style.transition = originalTransition;
            });
        };
        
        // 動画の再生時間に応じてテキストとoverlayの表示を更新する関数
        const updateAnswerTextByTime = (currentTime, answerData) => {
            if (currentTime < TIME_LOADING_END) {
                // TIME_LOADING_END までは質問内容を表示
                changeTextAndFontSizeImmediately(savedQuestion, FontSize);
                // overlay は表示（質問内容を見せるため）
                overlay.style.display = 'block';
                isShowingAnswer = false; // 質問内容を表示しているので false
            } else if (currentTime < TIME_ANSWER_DISPLAY) {
                // TIME_ANSWER_DISPLAY までは overlay を非表示（動画だけ表示）
                overlay.style.display = 'none';
                isShowingAnswer = true; // overlay を消した時点で true に設定（答え表示の準備）
                updateVideoSize();
            } else {
                // TIME_ANSWER_DISPLAY 以降
                if (answerData) {
                    // API結果が返ってきている場合、overlay を表示し、答えを表示
                    // まず overlay を表示状態にしてから位置を更新する
                    overlay.style.display = 'block';
                    isShowingAnswer = true; // 答えを表示しているので true
                    // overlay の位置を更新（72% の位置に）
                    updateVideoSize();
                    changeTextAndFontSizeImmediately(answerData, FontSizeBig);
                    
                    // 回答表示後、ボタンを段階的に表示
                    setTimeout(() => {
                        newQuestionBtn.style.display = 'block';
                        // 少し遅延を入れてからフェードイン
                        setTimeout(() => {
                            newQuestionBtn.classList.add('visible');
                        }, 100);
                    }, 1500);
                } else {
                    // API結果がまだ返ってきていない場合、overlay は非表示のまま
                    overlay.style.display = 'none';
                    isShowingAnswer = false; // まだ答えを表示していないので false
                }
            }
        };
        
        // API結果を取得（非同期で実行）
        apiPromise.then(result => {
            apiResult = result;
            
            // APIエラーが発生した場合
            if (!result.success) {
                // timeupdateイベントリスナーを削除
                answerVideo.removeEventListener('timeupdate', checkTimeUpdate);
                // フォーム表示に戻してエラーを表示
                resetToFormWithError(result.error, retryPlayHandlers);
                return;
            }
            
            // TIME_ANSWER_DISPLAY を過ぎていれば、すぐに動画を再開（成功時のみ）
            if (hasReachedAnswerDisplay) {
                // 現在の時刻に応じてテキストを更新
                updateAnswerTextByTime(answerVideo.currentTime, result.answerData);
                // 動画が停止している場合は再開して最後まで再生
                if (answerVideo.paused) {
                    answerVideo.play().catch(error => {
                        console.error('動画の再開に失敗しました:', error);
                    });
                }
            }
        });
        
        // 動画を最初から再生開始
        answerVideo.currentTime = 0;
        
        // スマホでの再生を確実にするため、Promiseで処理
        answerVideo.play().catch(error => {
            console.error('動画の再生に失敗しました:', error);
            // 再生が拒否された場合、ユーザーインタラクション後に再試行
            const retryPlay = () => {
                // エラー状態の場合は再生しない
                if (globalErrorState) return;
                answerVideo.play().catch(err => console.error('再試行も失敗:', err));
            };
            // タッチイベントで再試行（ハンドラーを保存）
            document.addEventListener('touchstart', retryPlay, { once: true });
            document.addEventListener('click', retryPlay, { once: true });
            retryPlayHandlers.push(retryPlay);
        });
        
        // 動画の再生時間を監視してテキストを更新
        const checkTimeUpdate = () => {
            const currentTime = answerVideo.currentTime;
            
            // APIエラーが既に返ってきている場合、動画を停止して処理を終了
            if (apiResult && !apiResult.success) {
                answerVideo.removeEventListener('timeupdate', checkTimeUpdate);
                // フォーム表示に戻してエラーを表示
                resetToFormWithError(apiResult.error, retryPlayHandlers);
                return;
            }
            
            // TIME_ANSWER_DISPLAY に達したらAPI結果をチェック
            if (currentTime >= TIME_ANSWER_DISPLAY && !hasReachedAnswerDisplay) {
                hasReachedAnswerDisplay = true;
                
                if (apiResult) {
                    // API結果が既に返ってきている場合
                    if (apiResult.success) {
                        updateAnswerTextByTime(currentTime, apiResult.answerData);
                        // 動画は続行（最後まで再生）
                    } else {
                        // エラーの場合
                        answerVideo.removeEventListener('timeupdate', checkTimeUpdate);
                        // フォーム表示に戻してエラーを表示
                        resetToFormWithError(apiResult.error, retryPlayHandlers);
                        return;
                    }
                } else {
                    // API結果がまだ返ってきていない場合、動画を停止して待機
                    answerVideo.pause();
                }
            }
            
            // 時間に応じてテキストとoverlayを更新
            if (apiResult && apiResult.success) {
                updateAnswerTextByTime(currentTime, apiResult.answerData);
            } else {
                // API結果がまだない場合でも、時間に応じて更新
                updateAnswerTextByTime(currentTime, null);
            }
        };
        
        answerVideo.addEventListener('timeupdate', checkTimeUpdate);
        
        // 最初はボタンを完全に非表示
        newQuestionBtn.style.display = 'none';
        newQuestionBtn.classList.remove('visible');
        
        // 動画の最後で固定する処理
        answerVideo.addEventListener('ended', () => {
            // 動画の最後のフレームで固定
            answerVideo.pause();
            // 最後のフレームを確実に表示するため、durationの直前を設定
            if (answerVideo.duration) {
                answerVideo.currentTime = answerVideo.duration - 0.1;
            }
            // timeupdateイベントリスナーを削除
            answerVideo.removeEventListener('timeupdate', checkTimeUpdate);
            // ボタンがまだ表示されていない場合は表示（フォールバック）
            if (newQuestionBtn.style.display === 'none') {
                newQuestionBtn.style.display = 'block';
                setTimeout(() => {
                    newQuestionBtn.classList.add('visible');
                }, 100);
            }
        }, { once: true });
        
    } catch (error) {
        console.error('エラーが発生しました:', error);
        // フォーム表示に戻してエラーを表示
        resetToFormWithError('申し訳ございません。エラーが発生しました。', []);
    } finally {
        // 送信ボタンを再有効化
        submitBtn.disabled = false;
    }
});

// APIにリクエスト送信
async function sendToAPI(question) {
    const requestBody = {
        message: question
    };
    
    let response;
    try {
        response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    } catch (error) {
        // ネットワークエラーなどの場合
        const networkError = new Error(`ネットワークエラー: ${error.message}`);
        networkError.status = 'NETWORK_ERROR';
        networkError.code = 'NETWORK_ERROR';
        throw networkError;
    }
    
    if (!response.ok) {
        const errorText = await response.text();
        const httpError = new Error(`API request failed: ${response.status} - ${response.statusText}`);
        httpError.status = response.status;
        httpError.code = `HTTP_${response.status}`;
        throw httpError;
    }
    
    let data;
    try {
        data = await response.json();
    } catch (error) {
        // JSONパースエラーの場合
        const parseError = new Error('Invalid response format from API');
        parseError.status = 'PARSE_ERROR';
        parseError.code = 'PARSE_ERROR';
        throw parseError;
    }
    
    // JSON形式のレスポンスをパース
    if (data.answer) {
        return data.answer;
    } else {
        const formatError = new Error('Invalid response format from API');
        formatError.status = 'INVALID_FORMAT';
        formatError.code = 'INVALID_FORMAT';
        throw formatError;
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
    answerText.style.fontSize = '40px';
    answerText.style.fontWeight = 'bold';
}

// エラーを表示
function displayError(errorMessage) {
    answerText.textContent = errorMessage;
    answerText.style.fontSize = '32px';
    answerText.style.fontWeight = 'bold';
}

// エラー時にフォーム表示に戻す関数
function resetToFormWithError(errorMessage, retryPlayHandlers) {
    // エラー状態を設定（グローバル）
    globalErrorState = true;
    // 答え表示状態をリセット
    isShowingAnswer = false;
    
    // 動画を停止
    if (answerVideo) {
        answerVideo.pause();
        answerVideo.currentTime = 0;
    }
    
    // 再試行イベントリスナーを削除
    if (retryPlayHandlers) {
        retryPlayHandlers.forEach(handler => {
            document.removeEventListener('touchstart', handler);
            document.removeEventListener('click', handler);
        });
    }
    
    // 動画を非表示、画像を表示
    answerVideo.classList.add('hidden');
    displayImage.classList.remove('hidden');
    
    // フォームコンテンツを非表示、回答コンテンツを表示
    formContent.classList.add('hidden');
    answerContent.classList.remove('hidden');
    
    // エラーメッセージを表示
    displayError(errorMessage);
    
    // 固定widthをリセット
    fixedOverlayWidth = null;
    
    // overlay の位置を即座に66%の位置に設定
    requestAnimationFrame(() => {
        const container = contentArea.querySelector('.video-container');
        if (container && overlay && displayImage) {
            const mediaRect = displayImage.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            if (mediaRect && containerRect) {
                const mediaHeight = mediaRect.height;
                const mediaTop = mediaRect.top;
                const containerTop = containerRect.top;
                
                // 66%の位置に設定（質問時）
                const overlayTopPercent = 66;
                const overlayBottomPercent = 90;
                const overlayHeight = mediaHeight * (overlayBottomPercent - overlayTopPercent) / 100;
                const overlayTopInContainer = (mediaTop - containerTop) + (mediaHeight * overlayTopPercent / 100);
                const distanceFromContainerBottom = containerRect.height - (overlayTopInContainer + overlayHeight);
                
                overlay.style.bottom = `${distanceFromContainerBottom}px`;
                overlay.style.height = `${overlayHeight}px`;
                overlay.style.maxHeight = `${overlayHeight}px`;
                overlay.style.minHeight = `${overlayHeight}px`;
            }
        }
        // 最終的な位置調整
        updateVideoSize();
    });
    
    // overlayを表示
    overlay.style.display = 'block';
    
    // 「新しい言い切り」ボタンを表示（右下に配置）
    newQuestionBtn.style.display = 'block';
    setTimeout(() => {
        newQuestionBtn.classList.add('visible');
    }, 100);
}

// 新しい質問ボタンの処理
newQuestionBtn.addEventListener('click', () => {
    // エラー状態をリセット
    globalErrorState = false;
    // 答え表示状態をリセット（即座に false に設定）
    isShowingAnswer = false;
    
    // ボタンを完全に非表示にする
    newQuestionBtn.style.display = 'none';
    newQuestionBtn.classList.remove('visible');
    
    // 動画を非表示、画像を表示
    answerVideo.classList.add('hidden');
    displayImage.classList.remove('hidden');
    
    // 回答コンテンツを非表示、フォームコンテンツを表示
    answerContent.classList.add('hidden');
    formContent.classList.remove('hidden');
    
    // 回答エリアの動画をリセット
    if (answerVideo) {
        answerVideo.pause();
        answerVideo.currentTime = 0;
    }
    
    // 固定widthをリセット（新しい質問時は再計算可能にする）
    fixedOverlayWidth = null;
    
    // overlay の位置を即座に66%の位置に設定（一瞬の72%表示を防ぐ）
    // updateVideoSize() の非同期処理が完了する前に、正しい位置を設定
    requestAnimationFrame(() => {
        const container = contentArea.querySelector('.video-container');
        if (container && overlay && displayImage) {
            const mediaRect = displayImage.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            if (mediaRect && containerRect) {
                const mediaHeight = mediaRect.height;
                const mediaTop = mediaRect.top;
                const containerTop = containerRect.top;
                
                // 66%の位置に設定（質問時）
                const overlayTopPercent = 66;
                const overlayBottomPercent = 90;
                const overlayHeight = mediaHeight * (overlayBottomPercent - overlayTopPercent) / 100;
                const overlayTopInContainer = (mediaTop - containerTop) + (mediaHeight * overlayTopPercent / 100);
                const distanceFromContainerBottom = containerRect.height - (overlayTopInContainer + overlayHeight);
                
                overlay.style.bottom = `${distanceFromContainerBottom}px`;
                overlay.style.height = `${overlayHeight}px`;
                overlay.style.maxHeight = `${overlayHeight}px`;
                overlay.style.minHeight = `${overlayHeight}px`;
            }
        }
    });
    
    // overlay の位置を即座に更新（66% の位置に戻す）
    // isShowingAnswer = false の状態で updateVideoSize() を呼ぶ
    updateVideoSize();
    
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
        // console.log(error);
    }
}

// 動画の読み込みエラーハンドリング
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

// ページ読み込み時の初期化
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
});
