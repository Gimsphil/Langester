// panel.js - Langester Hybrid AI Workspace Controller (v1.3.4 Stable)

let aiModel = null;
let lastError = "";

// ==========================================
// 1. AI DETECTION (Aggressive Retry & Multi-path)
// ==========================================
async function getAiModel(retries = 3) {
  if (aiModel) return aiModel;

  for (let i = 0; i < retries; i++) {
    try {
      // 모든 가능한 AI 객체 경로 탐색
      const aiHost = window.ai || (typeof chrome !== 'undefined' && chrome.ai) || (typeof self !== 'undefined' && self.ai);
      
      if (aiHost) {
        const modelApi = aiHost.languageModel || aiHost.assistant;
        if (modelApi) {
          const cap = await modelApi.capabilities();
          if (cap && cap.available !== 'no') {
            aiModel = await modelApi.create();
            return aiModel;
          } else {
            lastError = "모델이 아직 'Ready' 상태가 아닙니다.";
          }
        } else {
          lastError = "languageModel API를 찾을 수 없습니다 (Flags 확인 필요).";
        }
      } else {
        lastError = "window.ai 객체가 존재하지 않습니다 (브라우저 재시작 필요).";
      }
    } catch (e) {
      lastError = "연동 에러: " + e.message;
      console.error("AI Detection Attempt " + (i+1) + " failed:", e);
    }
    // 실패 시 500ms 대기 후 재시도
    if (i < retries - 1) await new Promise(r => setTimeout(r, 500));
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

  statusBadge.innerText = "연결 시도 중...";
  const model = await getAiModel(5); // 5번 재시도

  if (!model) {
    statusDot.className = "status-dot offline";
    statusBadge.innerText = "AI OFFLINE";
    wizardSection.style.display = 'flex';
    outputBox.innerHTML = `<div style="color:#f87171; font-weight:600;">⚠️ AI 연결 실패: ${lastError}</div><div style="font-size:11px; margin-top:8px;">1. chrome://restart 로 브라우저를 완전히 끄고 다시 켜주세요.<br>2. Flags 설정에서 'Bypass' 옵션이 맞는지 확인하세요.</div>`;
  } else {
    statusDot.className = "status-dot";
    statusBadge.innerText = "GEMINI NANO ACTIVE";
    wizardSection.style.display = 'none';
    outputBox.innerText = "✨ Gemini Nano 연동 성공! 이제 대화를 입력해 보세요.";
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

  if (currentText.length < 5) return;

  clearTimeout(aiTimeout);
  aiTimeout = setTimeout(async () => {
    const model = await getAiModel(1);
    const outputBox = document.getElementById('ai-output');

    if (model) {
      outputBox.innerText = "분석 중...";
      try {
        const result = await model.prompt(`내용을 요약하고 추천 답변을 한 줄씩 작성해줘.\n내용: """\n${currentText}\n"""`);
        outputBox.innerText = result.trim();
      } catch (err) {
        outputBox.innerText = "AI 처리 오류: " + err.message;
        aiModel = null;
      }
    }
  }, 800);
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
    func: () => window.getSelection().toString() || document.body.innerText.slice(0, 1000)
  }, (results) => {
    if (results?.[0].result) {
      textInputElem.innerText = results[0].result;
      textInputElem.dispatchEvent(new Event('input'));
    }
  });
});
