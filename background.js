// background.js - Langester Background Service Worker (AI Proxy v1.3.7)

let aiSession = null;

// AI 세션 초기화 함수
async function initAi() {
  try {
    const aiHost = (typeof chrome !== 'undefined' && chrome.aiOriginTrial) || (typeof chrome !== 'undefined' && chrome.ai) || window.ai;
    if (!aiHost) return { error: "AI Host not found" };

    const modelApi = aiHost.languageModel || aiHost.assistant;
    if (!modelApi) return { error: "languageModel API not found" };

    const cap = await modelApi.capabilities();
    if (cap.available === 'no') return { error: "Model not ready" };

    aiSession = await modelApi.create();
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 1. 구글 로그인 관련 (기존 기능 유지)
  if (message.action === "GET_TOKEN") {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      sendResponse({ token, error: chrome.runtime.lastError?.message });
    });
    return true;
  }

  // 2. AI 분석 요청 (사이드바 대행)
  if (message.action === "PROMPT_AI") {
    (async () => {
      if (!aiSession) {
        const res = await initAi();
        if (res.error) {
          sendResponse({ error: "AI 연동 실패: " + res.error });
          return;
        }
      }
      try {
        const response = await aiSession.prompt(message.text);
        sendResponse({ result: response });
      } catch (err) {
        aiSession = null; // 에러 시 세션 리셋
        sendResponse({ error: "AI 실행 중 오류: " + err.message });
      }
    })();
    return true;
  }
});
