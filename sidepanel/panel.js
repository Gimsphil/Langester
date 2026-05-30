// panel.js - Langester Hybrid AI Workspace Controller

// Global AI Model reference
let aiModel = null;

// ==========================================
// 1. CHROME BUILT-IN AI DETECTION & UTILS
// ==========================================
async function getAiModel() {
  if (aiModel) return aiModel;

  try {
    // 탐색 순서: chrome.aiOriginTrial (최신) > window.ai (표준) > navigator.ai
    const aiHost = (typeof chrome !== 'undefined' && chrome.aiOriginTrial) || 
                   (typeof chrome !== 'undefined' && chrome.ai) || 
                   window.ai || 
                   (navigator && navigator.ai);

    if (!aiHost || (!aiHost.languageModel && !aiHost.assistant)) {
      console.log("AI Host or languageModel API not found.");
      return null;
    }

    const modelApi = aiHost.languageModel || aiHost.assistant;
    const cap = await modelApi.capabilities();
    
    console.log("AI Capabilities:", cap.available);

    if (cap && cap.available !== 'no') {
      // 세션 생성 시도
      aiModel = await modelApi.create();
      return aiModel;
    }
  } catch(e) { 
    console.error("AI Model Bridge Error:", e); 
  }
  return null;
}

// Character counter updater
function updateCharCount(text) {
  const cleanText = text.replace(/텍스트를 가져오거나 여기에 입력하세요\./g, '');
  document.getElementById('char-count').innerText = `${cleanText.length} chars`;
}

// ==========================================
// 2. PAGE STARTUP ACTIONS & DIAGNOSTICS
// ==========================================
async function runDiagnostics() {
  const statusBadge = document.getElementById('ai-model-badge');
  const statusDot = document.getElementById('system-status-dot');
  const wizardSection = document.getElementById('ai-wizard-section');
  const diagStatus = document.getElementById('wizard-diag-status');
  const outputBox = document.getElementById('ai-output');

  statusBadge.innerText = "Detecting AI...";
  statusDot.className = "status-dot";

  const model = await getAiModel();

  document.getElementById('step-flags').classList.remove('active', 'complete');
  document.getElementById('step-components').classList.remove('active', 'complete');

  if (!model) {
    statusDot.classList.add('offline');
    statusBadge.innerText = "AI OFFLINE";
    wizardSection.style.display = 'flex';
    diagStatus.innerText = "설정 필요";

    // API 존재 여부로 단계 표시
    const aiHost = (typeof chrome !== 'undefined' && chrome.aiOriginTrial) || window.ai;
    if (!aiHost) {
      document.getElementById('step-flags').classList.add('active');
    } else {
      document.getElementById('step-flags').classList.add('complete');
      document.getElementById('step-components').classList.add('active');
      diagStatus.innerText = "모델 인식 실패";
    }
  } else {
    statusDot.classList.remove('offline');
    statusBadge.innerText = "GEMINI NANO ACTIVE";
    wizardSection.style.display = 'none';
    outputBox.innerText = "✨ 크롬 내장 Gemini Nano가 안전하게 연동되었습니다. 텍스트를 입력해 주십시오.";
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const textInput = document.getElementById('text-input');

  document.getElementById('btn-link-flags1').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://flags/#optimization-guide-on-device-model' });
  });
  document.getElementById('btn-link-flags2').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://flags/#prompt-api-for-gemini-nano' });
  });
  document.getElementById('btn-link-components').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://on-device-internals' });
  });

  const wizardHeader = document.querySelector('.wizard-header');
  if (wizardHeader) {
    wizardHeader.addEventListener('click', () => {
      document.getElementById('ai-wizard-section').classList.toggle('collapsed');
    });
  }

  await runDiagnostics();
  updateCharCount(textInput.innerText);
});

document.getElementById('btn-re-check').addEventListener('click', async () => {
  const btn = document.getElementById('btn-re-check');
  btn.innerText = "⏳ 진단 중...";
  aiModel = null;
  await runDiagnostics();
  setTimeout(() => {
    btn.innerText = "🔄 다시 진단하기";
    if (!aiModel) {
      alert("진단 결과: 로컬 AI 엔진이 아직 준비되지 않았습니다.\n\n[컴포넌트 페이지 열기]를 눌러 모델 상태가 'Ready'인지 확인하고, 크롬을 완전히 재시작해 주세요!");
    }
  }, 500);
});

// ==========================================
// 3. EDIT ACTION DEBOUNCER & AI TRIGGER
// ==========================================
let aiTimeout = null;
document.getElementById('text-input').addEventListener('input', async (e) => {
  const currentText = e.target.innerText.trim();
  updateCharCount(currentText);

  if (currentText.length < 10) {
    document.getElementById('ai-output').innerText = "텍스트가 너무 짧습니다. 분석을 위해 더 입력해 주세요.";
    return;
  }

  clearTimeout(aiTimeout);
  aiTimeout = setTimeout(async () => {
    const model = await getAiModel();
    const outputBox = document.getElementById('ai-output');

    if (model) {
      outputBox.innerText = "Gemini가 문맥 분석 중...";
      try {
        const structuredPrompt = `
아래 내용을 요약하고 답장을 추천해줘.
내용: """
${currentText}
"""
요점:
추천 답변:`;
        const result = await model.prompt(structuredPrompt);
        outputBox.innerText = result.trim();
      } catch (err) {
        outputBox.innerText = "분석 오류: " + err.message;
        aiModel = null;
      }
    } else {
      outputBox.innerText = "⚠️ 로컬 AI 모델 연결 안 됨. 상단 가이드를 확인하세요.";
    }
  }, 1000);
});

const textInputElem = document.getElementById('text-input');
textInputElem.addEventListener('focus', function() {
  if (this.innerText === "텍스트를 가져오거나 여기에 입력하세요.") {
    this.innerText = "";
  }
});
textInputElem.addEventListener('blur', function() {
  if (this.innerText.trim() === "") {
    this.innerText = "텍스트를 가져오거나 여기에 입력하세요.";
  }
});

// 저장 및 스크래핑 기능 (단순화 유지)
document.getElementById('btn-download-md').addEventListener('click', () => { 
  const originalText = document.getElementById('text-input').innerText;
  const aiOutput = document.getElementById('ai-output').innerText;
  const blob = new Blob([`# Report\n\n${aiOutput}\n\n${originalText}`], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Langester_Report.md`;
  link.click();
});

document.getElementById('btn-save-task').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: "GET_TOKEN" }, async (response) => {
    if (response.token) alert("OAuth 연동 성공 (기능 준비 중)");
    else alert("로그인 필요");
  });
});

document.getElementById('btn-sync-meet').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection().toString() || document.body.innerText.slice(0, 500)
  }, (results) => {
    if (results && results[0].result) {
      const textInput = document.getElementById('text-input');
      textInput.innerText = results[0].result;
      textInput.dispatchEvent(new Event('input'));
    }
  });
});
