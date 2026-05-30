// background.js - Langester Background Service Worker (AI Proxy v1.3.9 Ultimate)

let aiSession = null;

async function initAi() {
  try {
    // 가장 넓은 범위에서 AI 객체 탐색 (Service Worker 최적화)
    const aiHost = (typeof chrome !== 'undefined' && chrome.aiOriginTrial) || 
                   (typeof chrome !== 'undefined' && chrome.ai) || 
                   (typeof globalThis !== 'undefined' && globalThis.ai) ||
                   (typeof self !== 'undefined' && self.ai);
                   
    if (!aiHost) {
      console.log("Searching AI in all namespaces failed.");
      return { error: "AI 엔진 감지 실패 (브라우저가 백그라운드 AI를 지원하지 않음)" };
    }

    const modelApi = aiHost.languageModel || aiHost.assistant;
    if (!modelApi) return { error: "languageModel API를 찾을 수 없습니다." };

    const cap = await modelApi.capabilities();
    if (cap.available === 'no') return { error: "모델이 준비되지 않았습니다 (on-device-internals 확인)" };

    aiSession = await modelApi.create();
    return { success: true };
  } catch (e) {
    return { error: "초기화 예외: " + e.message };
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
        aiSession = null;
        sendResponse({ error: "AI 답변 생성 중 오류: " + err.message });
      }
    })();
    return true;
  }
});
