// background.js - Langester Background Service Worker

// 사이드바 버튼 클릭 시 활성화 설정
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelOptions({ enabled: true });
  }
});

// 구글 OAuth2 토큰 획득 (구글 로그인)
function getGoogleAuthToken(interactive = true) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

// 구글 OAuth2 토큰 캐시 삭제
function removeCachedAuthToken(token) {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      resolve();
    });
  });
}

// 메시지 리스너 (사이드바 및 콘텐츠 스크립트 통신)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_TOKEN") {
    getGoogleAuthToken(true)
      .then(token => sendResponse({ token }))
      .catch(err => sendResponse({ error: err.message }));
    return true; // 비동기 응답 처리 허용
  }
  
  if (message.action === "LOGOUT") {
    getGoogleAuthToken(false)
      .then(token => {
        if (token) {
          removeCachedAuthToken(token).then(() => sendResponse({ success: true }));
        } else {
          sendResponse({ success: true });
        }
      })
      .catch(() => sendResponse({ success: true }));
    return true;
  }
});
