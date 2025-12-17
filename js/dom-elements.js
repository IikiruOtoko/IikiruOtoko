// DOM要素の取得とグローバル変数

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

// overlayの固定width（一度設定したら変更しない）
let fixedOverlayWidth = null;

