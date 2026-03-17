// 設定と定数

// 動画の縦横比設定
const VIDEO_ASPECT_RATIO = 16 / 9; // 一般的な動画のアスペクト比（必要に応じて調整）
const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;

// 実際の動画サイズ（既知）
const ACTUAL_VIDEO_WIDTH = 908;
const ACTUAL_VIDEO_HEIGHT = 1604;
const ACTUAL_VIDEO_ASPECT_RATIO = ACTUAL_VIDEO_WIDTH / ACTUAL_VIDEO_HEIGHT;

// テキスト表示の切り替え時間（秒）
const TIME_LOADING_END = 3.6; // 質問内容の表示終了時間
const TIME_ANSWER_DISPLAY = 5.0; // 回答の表示開始時間（この時点でAPI結果をチェック）

// テキスト表示のフォントサイズ
const FontSize = '32px';
const FontSizeBig = '38px';

// タブレット/モバイル表示のブレークポイント（px）
// iPad Pro 12.9" 横(1366px)、iPad Air/Pro 横(1180-1194px)、iPad Mini 横(1133px) を含む
const TABLET_MAX_WIDTH = 1366;

// overlayの位置設定（動画の上端からの相対位置のパーセンテージ）
const OVERLAY_TOP_PERCENT_ANSWER = 71.25; // 答えを表示する際の位置
const OVERLAY_TOP_PERCENT_QUESTION = 65.25; // 質問時の位置
const overlayBottomPercent_Normal = 91.75; // 動画の下端の位置
const overlayBottomPercent_LongAnswer = 97.5; // 動画の下端の位置

// API設定
const API_URL_BASE = 'https://iikiruotokoapi-1.onrender.com/';
// const API_URL_BASE = 'http://localhost:10000/';
const API_URL = API_URL_BASE + 'chat';

