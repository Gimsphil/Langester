// panel.js - Langester Hybrid AI Workspace Controller (v1.4.0 Final)

let aiSession = null;

async function getAiModel() {
  if (aiSession) return aiSession;
  try {
    // 사이드바에서 직접 접근 가능한 AI 객체 확인
    const modelApi = window.ai?.languageModel || window.ai?.assistant;
    if (!modelApi) return null;

    const cap = await modelApi.capabilities();
    if (cap.available !== 'no') {
      aiSession = await modelApi.create();
      return aiSession;
    }
  } catch (e) { console.error("AI Init Error:", e); }
  return null;
}

async function runDiagnostics() {
  const statusBadge = document.getElementById('ai-model-badge');
  const statusDot = document.getElementById('system-status-dot');
  const wizardSection = document.getElementById('ai-wizard-section');
  const outputBox = document.getElementById('ai-output');

  const model = await getAiModel();

  if (model) {
    statusDot.className = "status-dot";
    statusBadge.innerText = "GEMINI NANO ACTIVE";
    wizardSection.style.display = 'none';
    outputBox.innerText = "✨ 로컬 AI 연동 성공! 분석을 시작해 보세요.";
  } else {
    statusDot.className = "status-dot offline";
    statusBadge.innerText = "AI OFFLINE";
    wizardSection.style.display = 'flex';
    outputBox.innerText = "⚠️ AI가 응답하지 않습니다. 다시 진단하기를 눌러주세요.";
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // 마법사 및 UI 리스너
  document.getElementById('btn-link-flags1').onclick = () => chrome.tabs.create({ url: 'chrome://flags/#optimization-guide-on-device-model' });
  document.getElementById('btn-link-flags2').onclick = () => chrome.tabs.create({ url: 'chrome://flags/#prompt-api-for-gemini-nano' });
  document.getElementById('btn-link-components').onclick = () => chrome.tabs.create({ url: 'chrome://on-device-internals' });
  const wizardHeader = document.querySelector('.wizard-header');
  if (wizardHeader) wizardHeader.onclick = () => document.getElementById('ai-wizard-section').classList.toggle('collapsed');
  
  await runDiagnostics();
});

document.getElementById('btn-re-check').onclick = async () => { aiSession = null; await runDiagnostics(); };

document.getElementById('text-input').oninput = async (e) => {
  const currentText = e.target.innerText.trim();
  if (currentText.length < 10) return;

  const outputBox = document.getElementById('ai-output');
  const model = await getAiModel();

  if (model) {
    outputBox.innerText = "Gemini Nano가 분석 중...";
    try {
      const response = await model.prompt(`다음 내용을 한국어로 요약하고 한 줄 추천 답변을 작성해줘.\n내용: """\n${currentText}\n"""`);
      outputBox.innerText = response.trim();
    } catch (err) {
      outputBox.innerText = "분석 오류: " + err.message;
      aiSession = null;
    }
  }
};

// UI 기능
const textInputElem = document.getElementById('text-input');
textInputElem.onfocus = function() { if (this.innerText.includes("입력하세요")) this.innerText = ""; };
textInputElem.onblur = function() { if (!this.innerText.trim()) this.innerText = "텍스트를 가져오거나 여기에 입력하세요."; };

document.getElementById('btn-sync-meet').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || tab.url.startsWith("chrome://")) return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection().toString() || document.body.innerText.slice(0, 1000)
  }, (results) => {
    if (results?.[0].result) {
      textInputElem.innerText = results[0].result;
      textInputElem.dispatchEvent(new Event('input'));
    }
  });
};
