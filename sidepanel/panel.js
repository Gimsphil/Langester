// panel.js - Langester Hybrid AI Workspace Controller

let aiModel = null;

// ==========================================
// 1. AI DETECTION (Simplified & Robust)
// ==========================================
async function getAiModel() {
  if (aiModel) return aiModel;

  try {
    // 일반 크롬에서 가장 표준적인 접근 방식
    const modelApi = window.ai?.languageModel || window.ai?.assistant;
    
    if (!modelApi) return null;

    const cap = await modelApi.capabilities();
    if (cap && cap.available !== 'no') {
      aiModel = await modelApi.create();
      return aiModel;
    }
  } catch(e) {
    console.error("AI Bridge Error:", e);
  }
  return null;
}

function updateCharCount(text) {
  const cleanText = text.replace(/텍스트를 가져오거나 여기에 입력하세요\./g, '');
  document.getElementById('char-count').innerText = `${cleanText.length} chars`;
}

// ==========================================
// 2. DIAGNOSTICS
// ==========================================
async function runDiagnostics() {
  const statusBadge = document.getElementById('ai-model-badge');
  const statusDot = document.getElementById('system-status-dot');
  const wizardSection = document.getElementById('ai-wizard-section');
  const outputBox = document.getElementById('ai-output');

  const model = await getAiModel();

  if (!model) {
    statusDot.className = "status-dot offline";
    statusBadge.innerText = "AI OFFLINE";
    wizardSection.style.display = 'flex';
    outputBox.innerText = "⚠️ 로컬 AI 모델을 불러올 수 없습니다. Flags 설정을 확인해 주세요.";
  } else {
    statusDot.className = "status-dot";
    statusBadge.innerText = "GEMINI NANO ACTIVE";
    wizardSection.style.display = 'none';
    outputBox.innerText = "✨ Gemini Nano 연동 완료! 대화 분석이 가능합니다.";
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const textInput = document.getElementById('text-input');

  document.getElementById('btn-link-flags1').addEventListener('click', () => chrome.tabs.create({ url: 'chrome://flags/#optimization-guide-on-device-model' }));
  document.getElementById('btn-link-flags2').addEventListener('click', () => chrome.tabs.create({ url: 'chrome://flags/#prompt-api-for-gemini-nano' }));
  document.getElementById('btn-link-components').addEventListener('click', () => chrome.tabs.create({ url: 'chrome://on-device-internals' }));

  const wizardHeader = document.querySelector('.wizard-header');
  if (wizardHeader) {
    wizardHeader.addEventListener('click', () => document.getElementById('ai-wizard-section').classList.toggle('collapsed'));
  }

  await runDiagnostics();
  updateCharCount(textInput.innerText);
});

document.getElementById('btn-re-check').addEventListener('click', async () => {
  aiModel = null;
  await runDiagnostics();
});

// ==========================================
// 3. AI ACTION
// ==========================================
let aiTimeout = null;
document.getElementById('text-input').addEventListener('input', async (e) => {
  const currentText = e.target.innerText.trim();
  updateCharCount(currentText);

  if (currentText.length < 10) return;

  clearTimeout(aiTimeout);
  aiTimeout = setTimeout(async () => {
    const model = await getAiModel();
    const outputBox = document.getElementById('ai-output');

    if (model) {
      outputBox.innerText = "분석 중...";
      try {
        const result = await model.prompt(`내용을 요약하고 추천 답변을 한 줄씩 작성해줘.\n내용: """\n${currentText}\n"""`);
        outputBox.innerText = result.trim();
      } catch (err) {
        outputBox.innerText = "오류: " + err.message;
        aiModel = null;
      }
    }
  }, 1000);
});

// UI helpers
const textInputElem = document.getElementById('text-input');
textInputElem.addEventListener('focus', function() { if (this.innerText.includes("여기에 입력하세요")) this.innerText = ""; });
textInputElem.addEventListener('blur', function() { if (!this.innerText.trim()) this.innerText = "텍스트를 가져오거나 여기에 입력하세요."; });

document.getElementById('btn-download-md').addEventListener('click', () => {
  const blob = new Blob([document.getElementById('text-input').innerText], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "Langester_Report.md"; link.click();
});

document.getElementById('btn-sync-meet').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection().toString() || document.body.innerText.slice(0, 800)
  }, (results) => {
    if (results?.[0].result) {
      textInputElem.innerText = results[0].result;
      textInputElem.dispatchEvent(new Event('input'));
    }
  });
});
