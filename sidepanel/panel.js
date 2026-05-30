// panel.js - Langester Hybrid AI Workspace Controller

// Global AI Model reference
let aiModel = null;

// ==========================================
// 1. CHROME BUILT-IN AI DETECTION & UTILS
// ==========================================
async function getAiModel() {
  if (aiModel) return aiModel;

  try {
    const aiHost = window.ai || (navigator && navigator.ai) || (chrome && chrome.ai);
    if (!aiHost || !aiHost.languageModel) return null;

    // 타임아웃이 포함된 감지 로직
    const capabilitiesPromise = aiHost.languageModel.capabilities();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000));
    
    const cap = await Promise.race([capabilitiesPromise, timeoutPromise]);
    
    if (cap && cap.available === 'readily') {
      aiModel = await aiHost.languageModel.create();
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

  const aiHost = window.ai || (navigator && navigator.ai);

  if (!model) {
    statusDot.classList.add('offline');
    statusBadge.innerText = "AI OFFLINE";
    wizardSection.style.display = 'flex';
    diagStatus.innerText = "설정 필요";

    if (!aiHost || !aiHost.languageModel) {
      document.getElementById('step-flags').classList.add('active');
    } else {
      document.getElementById('step-flags').classList.add('complete');
      document.getElementById('step-components').classList.add('active');
      diagStatus.innerText = "모델 로드 대기 중";
    }
    if (outputBox.innerText.includes("Gemini Nano")) {
       outputBox.innerText = "⚠️ 로컬 AI 모델이 감지되지 않았습니다. 상단의 마법사 가이드를 따라주세요.";
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
      alert("진단 결과: 로컬 AI 엔진이 아직 준비되지 않았습니다.\n\n[컴포넌트 페이지 열기]를 눌러 모델 상태가 'Ready'인지 다시 한 번 확인해 주세요!");
    }
  }, 800);
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
[명령어]
아래 제공된 [내용]의 핵심 요점과 추천 답변을 한국어로 작성해라.

[형식]
• 요점: (한 줄 요약)
• 추천 답변: (자연스러운 답변 한 줄)

[내용]
"""
${currentText}
"""
`;
        const result = await model.prompt(structuredPrompt);
        outputBox.innerText = result.trim();
      } catch (err) {
        outputBox.innerText = "내장 AI 분석 오류: " + err.message;
        aiModel = null; // Reset on failure
      }
    } else {
      outputBox.innerText = "⚠️ 로컬 AI 모델이 연결되지 않았습니다. 상단 마법사의 '다시 진단하기'를 클릭해 보세요.";
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

// 나머지 저장 및 스크래핑 기능 유지
document.getElementById('btn-download-md').addEventListener('click', () => { 
  const originalText = document.getElementById('text-input').innerText;
  const aiOutput = document.getElementById('ai-output').innerText;
  if (originalText.trim().length === 0 || originalText.includes("여기에 입력하세요")) return;
  const dateStr = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\s/g, '');
  const fileContent = `# Langester AI Report\n\n## 🤖 Gemini Nano 분석\n${aiOutput}\n\n## 📝 원본 텍스트\n${originalText}`;
  const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Langester_${dateStr}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

document.getElementById('btn-save-task').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: "GET_TOKEN" }, async (response) => {
    if (response.error) { alert("🔒 구글 계정 인증 실패!"); return; }
    const token = response.token;
    const summaryData = document.getElementById('ai-output').innerText;
    const originalText = document.getElementById('text-input').innerText;
    try {
      const res = await fetch('https://www.googleapis.com/tasks/v1/lists/@default/tasks', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: "[Langester] AI 요약", notes: `${summaryData}\n\n${originalText}` })
      });
      if (res.ok) alert("🎉 구글 Tasks 저장 완료!");
    } catch (error) { alert("에러: " + error.message); }
  });
});

document.getElementById('btn-sync-meet').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || tab.url.startsWith("chrome://")) return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selection = window.getSelection().toString().trim();
      if (selection) return selection;
      const meetCaptions = document.querySelectorAll('.bhY6Be, .iT96nd, span[data-phrase]');
      if (meetCaptions.length > 0) return Array.from(meetCaptions).map(el => el.innerText).filter(t => t.trim()).slice(-5).join('\n');
      return null;
    }
  }, (results) => {
    if (results && results[0] && results[0].result) {
      const textInput = document.getElementById('text-input');
      textInput.innerText = results[0].result;
      updateCharCount(results[0].result);
      textInput.dispatchEvent(new Event('input'));
    }
  });
});
