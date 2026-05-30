// panel.js - Langester Hybrid AI Workspace Controller (v1.3.5 Ultimate)

let aiModel = null;
let lastError = "";

// ==========================================
// 1. AI DETECTION (Deep Search Logic)
// ==========================================
async function getAiModel(retries = 3) {
  if (aiModel) return aiModel;

  for (let i = 0; i < retries; i++) {
    try {
      // 탐색 대상 리스트 (표준 window.ai부터 엔진 내부 객체까지)
      const candidates = [
        window.ai,
        (typeof chrome !== 'undefined' && chrome.ai),
        (typeof chrome !== 'undefined' && chrome.aiOriginTrial),
        navigator.ai,
        self.ai
      ];

      for (const host of candidates) {
        if (!host) continue;

        const modelApi = host.languageModel || host.assistant;
        if (modelApi) {
          const cap = await modelApi.capabilities();
          if (cap && cap.available !== 'no') {
            aiModel = await modelApi.create();
            console.log("AI Model Found via:", host === window.ai ? "window.ai" : "engine internal");
            return aiModel;
          }
        }
      }
      lastError = "AI API 객체를 찾을 수 없습니다. (Flags 설정 재확인 필요)";
    } catch (e) {
      lastError = "검사 중 오류: " + e.message;
    }
    if (i < retries - 1) await new Promise(r => setTimeout(r, 600));
  }
  return null;
}

// 2. DIAGNOSTICS & UI
async function runDiagnostics() {
  const statusBadge = document.getElementById('ai-model-badge');
  const statusDot = document.getElementById('system-status-dot');
  const wizardSection = document.getElementById('ai-wizard-section');
  const outputBox = document.getElementById('ai-output');

  statusBadge.innerText = "연결 시도 중...";
  const model = await getAiModel(5);

  if (!model) {
    statusDot.className = "status-dot offline";
    statusBadge.innerText = "AI OFFLINE";
    wizardSection.style.display = 'flex';
    outputBox.innerHTML = `
      <div style="color:#f87171; font-weight:600; margin-bottom:8px;">⚠️ AI 연결 실패: ${lastError}</div>
      <div style="font-size:11px; color:#9ca3af; line-height:1.6;">
        <b>다음 해결 방법을 시도해 보세요:</b><br>
        1. <b>chrome://flags</b> 에서 두 설정이 모두 <b>Enabled</b> 인지 확인.<br>
        2. 브라우저 우측 상단 점 3개 -> <b>도움말 -> Chrome 정보</b>에서 최신 업데이트 확인.<br>
        3. <b>chrome://restart</b> 를 입력해 브라우저를 완전히 껐다 켜기.
      </div>
    `;
  } else {
    statusDot.className = "status-dot";
    statusBadge.innerText = "GEMINI NANO ACTIVE";
    wizardSection.style.display = 'none';
    outputBox.innerText = "✨ 로컬 AI 연동에 성공했습니다! 대화를 시작하세요.";
  }
}

// 이벤트 리스너 등록
document.addEventListener('DOMContentLoaded', async () => {
  const textInput = document.getElementById('text-input');
  
  // 마법사 링크 연결
  document.getElementById('btn-link-flags1').onclick = () => chrome.tabs.create({ url: 'chrome://flags/#optimization-guide-on-device-model' });
  document.getElementById('btn-link-flags2').onclick = () => chrome.tabs.create({ url: 'chrome://flags/#prompt-api-for-gemini-nano' });
  document.getElementById('btn-link-components').onclick = () => chrome.tabs.create({ url: 'chrome://on-device-internals' });

  const wizardHeader = document.querySelector('.wizard-header');
  if (wizardHeader) {
    wizardHeader.onclick = () => document.getElementById('ai-wizard-section').classList.toggle('collapsed');
  }

  await runDiagnostics();
});

document.getElementById('btn-re-check').onclick = async () => {
  aiModel = null;
  await runDiagnostics();
};

// 3. AI ACTION
let aiTimeout = null;
document.getElementById('text-input').oninput = async (e) => {
  const currentText = e.target.innerText.trim();
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
        outputBox.innerText = "AI 오류: " + err.message;
        aiModel = null;
      }
    }
  }, 1000);
};

// 텍스트 박스 도우미
const textInputElem = document.getElementById('text-input');
textInputElem.onfocus = function() { if (this.innerText.includes("입력하세요")) this.innerText = ""; };
textInputElem.onblur = function() { if (!this.innerText.trim()) this.innerText = "텍스트를 가져오거나 여기에 입력하세요."; };

// 스크래핑 기능
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
