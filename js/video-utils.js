// 動画サイズ計算などのユーティリティ

/**
 * 動画サイズを動的に計算する関数
 * @returns {{width: number, height: number}} 動画の幅と高さ
 */
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

/**
 * 動画・画像サイズを更新する関数
 * @param {boolean} [immediate=false] - trueの場合、overlayの高さ計算を遅延なしで即時実行（回答表示時のチカつき防止）
 */
function updateVideoSize(immediate = false) {
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
    
    // 動画・画像のサイズ設定後にテキストボックスの幅と位置を調整
    // 回答表示時(immediate)は遅延なしで即時実行し、チカつきを防ぐ
    const overlayDelay = immediate ? 0 : 50;
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
                
                // overlayの幅を計算
                const overlayWidth = calculateOverlayWidth(mediaRect, isMobilePortrait, calculatedVideoWidth, currentMedia);
                
                // overlayのサイズと位置を設定
                if (containerRect && mediaRect) {
                    const overlayHeight = updateOverlaySizeAndPosition(mediaRect, containerRect, overlayWidth);
                    adjustOverlayContentHeight(overlayHeight);
                }
            }, overlayDelay);
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

