// UI表示関連のヘルパー関数

/**
 * 回答を表示
 * @param {string} answer - 回答内容
 */
function displayAnswer(answer) {
    let processedAnswer = answer;
    
    // 空文字列になった場合は元の文字列を使用
    if (processedAnswer.trim() === '') {
        processedAnswer = answer;
    }
    
    answerText.textContent = processedAnswer;
    answerText.style.fontSize = FontSizeBig;
    answerText.style.fontWeight = 'bold';
}

/**
 * エラーを表示
 * @param {string} errorMessage - エラーメッセージ
 */
function displayError(errorMessage) {
    answerText.textContent = errorMessage;
    answerText.style.fontSize = FontSize;
    answerText.style.fontWeight = 'bold';
}

/**
 * テキストとフォントサイズを即座に更新
 * @param {string} text - 表示するテキスト
 * @param {string} fontSize - フォントサイズ
 */
function changeTextAndFontSizeImmediately(text, fontSize) {
    answerText.textContent = text;
    const originalTransition = answerText.style.transition;
    answerText.style.transition = 'none';
    answerText.style.fontSize = fontSize;
    requestAnimationFrame(() => {
        answerText.style.transition = originalTransition;
    });
}

/**
 * エラー時にフォーム表示に戻す関数
 * @param {string} errorMessage - エラーメッセージ
 * @param {Array<Function>} retryPlayHandlers - 再試行イベントハンドラーの配列
 */
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
    
    // 最終的な位置調整
    requestAnimationFrame(() => {
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

