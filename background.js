// background.js - Langester Background Service Worker (AI Proxy v1.3.8 Stable)

let aiSession = null;

async function initAi() {
  try {
    // 백그라운드 전용 AI 객체 탐색 (window 제거)
    const aiHost = (typeof chrome !== 'undefined' && chrome.aiOriginTrial) || 
                   (typeof chrome !== 'undefined' && chrome.ai) || 
                   (typeof self !== 'undefined' && self.ai);
                   
    if (!aiHost) return { error: "AI 엔진을 찾을 수 없습니다. (Flags 설정 확인)" };

    const modelApi = aiHost.languageModel || aiHost.assistant;
    if (!modelApi) return { error: "AI API가 비활성화되어 있습니다." };

    const cap = await modelApi.capabilities();
    if (cap.available === 'no') return { error: "모델 설치가 완료되지 않았습니다." };

    // 세션 생성
    aiSession = await modelApi.create();
    return { success: true };
  } catch (e) {
    return { error: "초기화 에러: " + e.message };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_TOKEN") {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      sendResponse({ token, error: chrome.runtime.lastError?.message });
    });
    return true;
  }

  if (message.action === "PROMPT_AI") {
    (async () => {
      // 세션이 없으면 초기화 시도
      if (!aiSession) {
        const initResult = await initAi();
        if (initResult.error) {
          sendResponse({ error: initResult.error });
          return;
        }
      }

      try {
        const response = await aiSession.prompt(message.text);
        sendResponse({ result: response });
      } catch (err) {
        aiSession = null; // 실패 시 세션 파기
        sendResponse({ error: "AI 응답 오류: " + err.message });
      }
    })();
    return true;
  }
});
