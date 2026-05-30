// panel.js - Langester Hybrid AI Workspace Controller

// Global AI Model reference
let aiModel = null;

// ==========================================
// 1. CHROME BUILT-IN AI DETECTION & UTILS
// ==========================================
async function getAiModel() {
  if (aiModel) return aiModel;

  const aiHost = window.ai || (navigator && navigator.ai) || (chrome && chrome.ai);

  if (aiHost) {
    if (aiHost.languageModel) {
      try {
        const cap = await aiHost.languageModel.capabilities();
        if (cap && cap.available !== 'no') {
          aiModel = await aiHost.languageModel.create(); // Create session immediately
          return aiModel;
        }
      } catch(e) { console.error("Capabilities check failed:", e); }
    }
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

  // Set detecting state
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

    if (!aiHost) {
      document.getElementById('step-flags').classList.add('active');
    } else {
      document.getElementById('step-flags').classList.add('complete');
      document.getElementById('step-components').classList.add('active');
      diagStatus.innerText = "모델 다운로드 중";
    }
    outputBox.innerText = "⚠️ 로컬 AI 모델이 감지되지 않았습니다. 상단의 마법사 가이드에 따라 설정을 완료해 주세요.";
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
    chrome.tabs.create({ url: 'chrome://components' });
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
      alert("진단 결과: 아직 AI 엔진이 인식되지 않습니다.\n\n[주소 복사] 버튼을 눌러 설정을 다시 확인하고, 반드시 브라우저를 재시작해 주세요!");
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
        aiModel = null; // Reset on error
      }
    } else {
      outputBox.innerText = "⚠️ 로컬 AI 모델이 감지되지 않았습니다. 상단의 마법사 가이드에 따라 AI를 활성화해 주세요.";
    }
  }, 800);
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

// ==========================================
// 4. [ALTERNATIVE 1] LOCAL MARKDOWN EXPORT
// ==========================================
document.getElementById('btn-download-md').addEventListener('click', () => { 
  const originalText = document.getElementById('text-input').innerText;
  const aiOutput = document.getElementById('ai-output').innerText;

  if (originalText.trim().length === 0 || originalText.includes("여기에 입력하세요")) {
    alert("내용이 비어 있습니다!");
    return;
  }

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

// ==========================================
// 5. [ALTERNATIVE 2] GOOGLE TASKS OAUTH SYNC
// ==========================================
document.getElementById('btn-save-task').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: "GET_TOKEN" }, async (response) => {
    if (response.error) {
      alert("🔒 구글 계정 인증 실패!");
      return;
    }
    const token = response.token;
    const summaryData = document.getElementById('ai-output').innerText;
    const originalText = document.getElementById('text-input').innerText;

    try {
      const res = await fetch('https://www.googleapis.com/tasks/v1/lists/@default/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: "[Langester] AI 요약 결과",
          notes: `[AI 분석]\n${summaryData}\n\n[원본]\n${originalText}`
        })
      });
      if (res.ok) alert("🎉 구글 Tasks 저장 완료!");
      else alert("저장 실패");
    } catch (error) {
      alert("에러: " + error.message);
    }
  });
});

// ==========================================
// 6. DOM / ACTIVE TAB SCRAPING
// ==========================================
document.getElementById('btn-sync-meet').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  if (tab.url && (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:"))) {
    alert("크롬 시스템 페이지에서는 보안상 텍스트를 가져올 수 없습니다.");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selection = window.getSelection().toString().trim();
      if (selection) return selection;
      const meetCaptions = document.querySelectorAll('.bhY6Be, .iT96nd, span[data-phrase]');
      if (meetCaptions.length > 0) return Array.from(meetCaptions).map(el => el.innerText).filter(t => t.trim()).slice(-5).join('\n');
      const articles = document.querySelectorAll('article p, main p, div[class*="content"] p, p');
      if (articles.length > 0) return Array.from(articles).map(el => el.innerText.trim()).filter(t => t.length > 20).slice(0, 3).join('\n\n');
      return null;
    }
  }, (results) => {
    const textInput = document.getElementById('text-input');
    if (results && results[0] && results[0].result) {
      textInput.innerText = results[0].result;
      updateCharCount(results[0].result);
      textInput.dispatchEvent(new Event('input'));
    } else {
      alert("텍스트를 감지하지 못했습니다. 원하는 영역을 마우스로 드래그한 뒤 다시 시도해 주세요.");
    }
  });
});

document.getElementById('btn-sync-youtube').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url.includes("studio.youtube.com")) {
    alert("YouTube 스튜디오 페이지에서만 작동합니다!");
    return;
  }
  chrome.tabs.sendMessage(tab.id, { action: "SCRAPE_YOUTUBE_STUDIO" }, (response) => {
    if (response && response.success) {
      const combinedText = `[제목]\n${response.title}\n\n[설명]\n${response.description}`;
      const textInput = document.getElementById('text-input');
      textInput.innerText = combinedText;
      updateCharCount(combinedText);
      textInput.dispatchEvent(new Event('input'));
    } else {
      alert("YouTube 스튜디오 텍스트 추출 실패");
    }
  });
});
