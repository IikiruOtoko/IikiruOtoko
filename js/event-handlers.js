// イベントハンドラー

/**
 * フォーム送信処理を初期化
 */
function setupFormSubmitHandler() {
    questionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const question = questionInput.value.trim();
        if (!question) return;
        
        // 送信ボタンを無効化
        const submitBtn = questionForm.querySelector('.submit-btn');
        submitBtn.disabled = true;

        if (typeof gtag === 'function') {
            gtag('event', 'iikiru_otoko_submit_question', {
                event_category: 'engagement',
                event_label: 'question_form'
            });
        }
        
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
            answerText.style.fontSize = FontSize;
            
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
            let hasTrackedAnswerDisplay = false; // 回答表示完了のイベント送信を追跡
            let retryPlayHandlers = []; // 再試行イベントハンドラーを保存
            // エラー状態をリセット
            globalErrorState = false;
            // 答え表示状態をリセット（質問内容を表示するので false）
            isShowingAnswer = false;
            // 質問内容を保存
            const savedQuestion = question;
            
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
                    // overlayが非表示なので、updateVideoSize()は不要
                } else {
                    // TIME_ANSWER_DISPLAY 以降
                    if (answerData) {
                        // overlay表示前に状態とテキストを更新し、正しい高さを同期計算する
                        isShowingAnswer = true;
                        changeTextAndFontSizeImmediately(answerData, FontSizeBig);
                        updateOverlayPositionSync();
                        // 正しい高さがセットされた状態で表示（チカつき防止）
                        overlay.style.display = 'block';
                        
                        // 回答表示完了のイベントを送信（一度だけ）
                        if (!hasTrackedAnswerDisplay) {
                            hasTrackedAnswerDisplay = true;
                            if (typeof gtag === 'function') {
                                gtag('event', 'iikiru_otoko_answer_displayed', {
                                    event_category: 'engagement',
                                    event_label: 'answer_complete'
                                });
                            }
                        }
                        
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
}

/**
 * 新しい質問ボタンの処理を初期化
 */
function setupNewQuestionButtonHandler() {
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
        
        // isShowingAnswer = false の状態で updateVideoSize() を呼ぶ
        updateVideoSize();
        
        // フォームをリセット
        questionForm.reset();
        questionInput.focus();
    });
}

