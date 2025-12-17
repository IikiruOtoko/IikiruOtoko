// API関連の関数

/**
 * APIにリクエスト送信
 * @param {string} question - 質問内容
 * @returns {Promise<string>} APIからの回答
 */
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

/**
 * コールドスタート対策: APIを叩いてサーバーを起動状態に保つ
 */
async function warmupAPI() {
    try {
        const response = await fetch(API_URL_BASE, {
            method: 'GET'
        });
    } catch (error) {
        // console.log(error);
    }
}

