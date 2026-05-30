// panel.js - Langester Hybrid AI Workspace Controller (v1.3.7 Proxy Mode)

let isAiActive = false;

// ==========================================
// 1. AI 연동 (Background Proxy 방식)
// ==========================================
async function runDiagnostics() {
  const statusBadge = document.getElementById('ai-model-badge');
  const statusDot = document.getElementById('system-status-dot');
  const wizardSection = document.getElementById('ai-wizard-section');
  const outputBox = document.getElementById('ai-output');

  statusBadge.innerText = "연결 시도 중...";
  
  // 백그라운드에 테스트 신호 전송
  chrome.runtime.sendMessage({ action: "PROMPT_AI", text: "Connection Test" }, (response) => {
    if (response && (response.result || !response.error.includes("not found"))) {
      statusDot.className = "status-dot";
      statusBadge.innerText = "GEMINI NANO ACTIVE";
      wizardSection.style.display = 'none';
      outputBox.innerText = "✨ 백그라운드 AI 엔진 연동 성공! 이제 분석이 가능합니다.";
      isAiActive = true;
    } else {
      statusDot.className = "status-dot offline";
      statusBadge.innerText = "AI OFFLINE";
      wizardSection.style.display = 'flex';
      outputBox.innerHTML = `<div style="color:#f87171; font-weight:600;">⚠️ AI 연동 실패: 백그라운드 연결 불가</div><div style="font-size:11px; margin-top:8px;">크롬을 완전히 종료 후 다시 실행해 보세요.</div>`;
      isAiActive = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-link-flags1').onclick = () => chrome.tabs.create({ url: 'chrome://flags/#optimization-guide-on-device-model' });
  document.getElementById('btn-link-flags2').onclick = () => chrome.tabs.create({ url: 'chrome://flags/#prompt-api-for-gemini-nano' });
  document.getElementById('btn-link-components').onclick = () => chrome.tabs.create({ url: 'chrome://on-device-internals' });
  
  const wizardHeader = document.querySelector('.wizard-header');
  if (wizardHeader) wizardHeader.onclick = () => document.getElementById('ai-wizard-section').classList.toggle('collapsed');
  
  runDiagnostics();
});

document.getElementById('btn-re-check').onclick = () => runDiagnostics();

// AI 처리 실행
let aiTimeout = null;
document.getElementById('text-input').oninput = async (e) => {
  const currentText = e.target.innerText.trim();
  if (currentText.length < 10) return;

  clearTimeout(aiTimeout);
  aiTimeout = setTimeout(() => {
    const outputBox = document.getElementById('ai-output');
    outputBox.innerText = "Gemini Nano가 백그라운드에서 분석 중...";

    chrome.runtime.sendMessage({ 
      action: "PROMPT_AI", 
      text: `다음 내용을 한국어로 요약하고 한 줄의 추천 답변을 작성해줘.\n내용: """\n${currentText}\n"""`
    }, (response) => {
      if (response && response.result) {
        outputBox.innerText = response.result.trim();
      } else {
        outputBox.innerText = "분석 실패: " + (response?.error || "응답 없음");
      }
    });
  }, 1000);
};

// 기타 UI 기능 유지
const textInputElem = document.getElementById('text-input');
textInputElem.onfocus = function() { if (this.innerText.includes("입력하세요")) this.innerText = ""; };
textInputElem.onblur = function() { if (!this.innerText.trim()) this.innerText = "텍스트를 가져오거나 여기에 입력하세요."; };

document.getElementById('btn-sync-meet').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || tab.url.startsWith("chrome://")) return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection().toString() || document.body.innerText.slice(0, 800)
  }, (results) => {
    if (results?.[0].result) {
      textInputElem.innerText = results[0].result;
      textInputElem.dispatchEvent(new Event('input'));
    }
  });
};
