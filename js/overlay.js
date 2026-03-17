// overlay関連の関数

/**
 * フォントサイズで答えを表示しているか判定
 * @returns {boolean} 答えを表示している場合true
 */
function isShowingAnswerText() {
    if (!answerText) return false;
    const computedFontSize = window.getComputedStyle(answerText).fontSize;
    return computedFontSize === FontSizeBig || parseFloat(computedFontSize) >= 37;
}

/**
 * overlayの幅を計算
 * @param {DOMRect} mediaRect - メディア要素のgetBoundingClientRect()の結果
 * @param {boolean} isMobilePortrait - モバイル縦向きかどうか
 * @param {number|null} calculatedVideoWidth - 計算済みの動画幅
 * @param {HTMLElement} currentMedia - 現在表示されているメディア要素
 * @returns {number} overlayの幅
 */
function calculateOverlayWidth(mediaRect, isMobilePortrait, calculatedVideoWidth, currentMedia) {
    if (fixedOverlayWidth !== null) {
        return fixedOverlayWidth;
    }
    
    let overlayWidth;
    const actualMediaHeight = mediaRect.height;
    
    if (actualMediaHeight > 0) {
        // 動画の高さから、アスペクト比を使って幅を計算
        const calculatedVideoWidthFromHeight = actualMediaHeight * ACTUAL_VIDEO_ASPECT_RATIO;
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
    return overlayWidth;
}

/**
 * overlayの位置（topPercent, bottomPercent）を計算
 * @returns {{topPercent: number, bottomPercent: number}} overlayの位置パーセンテージ
 */
function calculateOverlayPosition() {
    const formContent = overlay.querySelector('.form-content');
    const answerContent = overlay.querySelector('.answer-content');
    
    // 動画の上端からの相対位置を計算
    let overlayTopPercent = OVERLAY_TOP_PERCENT_QUESTION;
    
    if (formContent && !formContent.classList.contains('hidden')) {
        // 質問フォームが表示されている場合
        overlayTopPercent = OVERLAY_TOP_PERCENT_QUESTION;
    } else if (answerContent && !answerContent.classList.contains('hidden') && answerText) {
        // answerContentが表示されている場合は、フォントサイズで判定
        if (isShowingAnswerText()) {
            overlayTopPercent = OVERLAY_TOP_PERCENT_ANSWER;
        } else {
            overlayTopPercent = OVERLAY_TOP_PERCENT_QUESTION;
        }
    }
    
    // 答えを表示する時かつ答えが7文字以上の時は overlayBottomPercent_LongAnswer を使用
    let overlayBottomPercent = overlayBottomPercent_Normal;
    if (answerContent && !answerContent.classList.contains('hidden') && answerText && answerText.textContent && answerText.textContent.length >= 7) {
        if (isShowingAnswerText()) {
            overlayBottomPercent = overlayBottomPercent_LongAnswer;
        }
    }
    
    return { topPercent: overlayTopPercent, bottomPercent: overlayBottomPercent };
}

/**
 * overlayのサイズと位置を設定
 * @param {DOMRect} mediaRect - メディア要素のgetBoundingClientRect()の結果
 * @param {DOMRect} containerRect - コンテナ要素のgetBoundingClientRect()の結果
 * @param {number} overlayWidth - overlayの幅
 * @returns {number} overlayの高さ
 */
function updateOverlaySizeAndPosition(mediaRect, containerRect, overlayWidth) {
    // 幅を設定
    overlay.style.width = `${overlayWidth}px`;
    overlay.style.maxWidth = `${overlayWidth}px`;
    overlay.style.minWidth = `${overlayWidth}px`;
    
    // 位置と高さを計算
    const { topPercent, bottomPercent } = calculateOverlayPosition();
    const mediaHeight = mediaRect.height;
    const mediaTop = mediaRect.top;
    const containerTop = containerRect.top;
    
    const overlayHeight = mediaHeight * (bottomPercent - topPercent) / 100;
    const overlayTopInContainer = (mediaTop - containerTop) + (mediaHeight * topPercent / 100);
    const distanceFromContainerBottom = containerRect.height - (overlayTopInContainer + overlayHeight);
    
    // 位置と高さを設定
    overlay.style.bottom = `${distanceFromContainerBottom}px`;
    overlay.style.height = `${overlayHeight}px`;
    overlay.style.maxHeight = `${overlayHeight}px`;
    overlay.style.minHeight = `${overlayHeight}px`;
    
    return overlayHeight;
}

/**
 * overlayのサイズと位置を同期的に更新する（rAFやsetTimeout遅延なし）
 * overlay表示前に呼ぶことで、表示時のチカつきを防ぐ
 */
function updateOverlayPositionSync() {
    const container = contentArea.querySelector('.video-container');
    const currentMedia = displayImage.classList.contains('hidden') ? answerVideo : displayImage;
    if (!container || !currentMedia || !overlay) return;

    const mediaRect = currentMedia.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    if (mediaRect.height <= 0 || containerRect.height <= 0) return;

    const isMobilePortrait = window.innerWidth < TABLET_MAX_WIDTH && window.innerHeight > window.innerWidth;
    const overlayWidth = calculateOverlayWidth(mediaRect, isMobilePortrait, null, currentMedia);
    const overlayHeight = updateOverlaySizeAndPosition(mediaRect, containerRect, overlayWidth);
    adjustOverlayContentHeight(overlayHeight);
}

/**
 * overlayの内部要素の高さを調整
 * @param {number} overlayHeight - overlayの高さ
 */
function adjustOverlayContentHeight(overlayHeight) {
    const formContent = overlay.querySelector('.form-content');
    const answerContent = overlay.querySelector('.answer-content');
    const answerTextElement = overlay.querySelector('.answer-text');
    
    // フォーム表示時（質問時）の処理
    if (formContent && !formContent.classList.contains('hidden')) {
        const textarea = overlay.querySelector('textarea');
        if (textarea && overlayHeight > 0) {
            const contentHeight = overlayHeight * 0.425;
            textarea.style.height = `${contentHeight}px`;
            textarea.style.minHeight = `${contentHeight}px`;
            textarea.style.maxHeight = `${contentHeight}px`;
        }
    }
    
    // 回答表示時はanswer-textの高さを制限しない（中央配置のため）
    if (answerContent && !answerContent.classList.contains('hidden')) {
        if (answerTextElement) {
            answerTextElement.style.height = 'auto';
            answerTextElement.style.minHeight = 'auto';
            answerTextElement.style.maxHeight = 'none';
        }
    }
}

