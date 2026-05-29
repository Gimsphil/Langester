// panel.js - Langester Hybrid AI Workspace Controller

// Global AI Model reference
let aiModel = null;

// ==========================================
// 1. CHROME BUILT-IN AI DETECTION & UTILS
// ==========================================
async function getAiModel() {
  if (aiModel) return aiModel;
  
  // Try finding AI object in multiple possible locations
  const aiHost = window.ai || (navigator && navigator.ai) || (chrome && chrome.ai);
  
  if (aiHost) {
    // 1) Try modern Chrome languageModel spec
    if (aiHost.languageModel) {
      try {
        const cap = await aiHost.languageModel.capabilities();
        if (cap && cap.available !== 'no') {
          aiModel = aiHost.languageModel;
          return aiModel;
        }
      } catch(e) { console.error("Capabilities check failed:", e); }
    }
    // 2) Try previous Chrome assistant spec
    if (aiHost.assistant) {
      try {
        const cap = await aiHost.assistant.capabilities();
        if (cap && cap.available !== 'no') {
          aiModel = aiHost.assistant;
          return aiModel;
        }
      } catch(e) { console.error("Assistant capabilities check failed:", e); }
    }
  }
  return null;
}

// Simulated dynamic mock generator if Chrome AI features are disabled
function getSimulatedAIResponse(text) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`• 요점: 상대방이 마케팅 협력 일정 조율에 동의하였으며 세부 분담 논의를 희망함.
• 추천 답변: 제안해주신 의견에 감사드리며, 세부 일정을 확정하기 위해 다음 주 화요일 오전 10시 회의를 제안합니다.`);
    }, 450);
  });
}

// Character counter updater
function updateCharCount(text) {
  const cleanText = text.replace(/구글 미트 자막을 가져오거나 여기에 대화 내용을 입력하세요\./g, '');
  document.getElementById('char-count').innerText = `${cleanText.length} chars`;
}

// ==========================================
// 2. PAGE STARTUP ACTIONS & DIAGNOSTICS
// ==========================================
async function runDiagnostics() {
  const model = await getAiModel();
  const outputBox = document.getElementById('ai-output');
  const statusBadge = document.getElementById('ai-model-badge');
  const statusDot = document.getElementById('system-status-dot');
  const wizardSection = document.getElementById('ai-wizard-section');
  const diagStatus = document.getElementById('wizard-diag-status');
  
  // Clear previous state
  document.getElementById('step-flags').classList.remove('active', 'complete');
  document.getElementById('step-components').classList.remove('active', 'complete');

  const aiHost = window.ai || (navigator && navigator.ai);

  if (!model) {
    statusDot.classList.add('offline');
    statusBadge.innerText = "MOCK LOCAL AI";
    wizardSection.style.display = 'flex';
    diagStatus.innerText = "설정 필요";
    
    // Detailed Step Diagnostics
    if (!aiHost) {
      document.getElementById('step-flags').classList.add('active');
    } else {
      document.getElementById('step-flags').classList.add('complete');
      document.getElementById('step-components').classList.add('active');
      diagStatus.innerText = "모델 다운로드 중";
    }
  } else {
    statusDot.classList.remove('offline');
    statusBadge.innerText = "GEMINI NANO ACTIVE";
    wizardSection.style.display = 'none';
    outputBox.innerText = "🔮 크롬 내장 Gemini Nano가 안전하게 연동되었습니다. 대화를 불러오거나 입력해 주십시오.";
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const textInput = document.getElementById('text-input');
  
  // Attach Wizard Link listeners (Using chrome.tabs for secure URLs)
  document.getElementById('btn-link-flags1').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://flags/#optimization-guide-on-device-model' });
  });
  document.getElementById('btn-link-flags2').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://flags/#prompt-api-for-gemini-nano' });
  });
  document.getElementById('btn-link-components').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://components' });
  });

  await runDiagnostics();
  updateCharCount(textInput.innerText);
});

document.getElementById('btn-re-check').addEventListener('click', async () => {
  const btn = document.getElementById('btn-re-check');
  btn.innerText = "⏳ 진단 중...";
  aiModel = null; // Reset cache
  await runDiagnostics();
  setTimeout(() => { 
    btn.innerText = "🔄 다시 진단하기"; 
    if (!aiModel) {
      alert("진단 결과: 아직 AI 엔진이 인식되지 않습니다.\n\n[주소 복사] 버튼을 눌러 설정을 다시 확인하고, 반드시 chrome://restart를 통해 브라우저를 재시작해 주세요!");
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
    document.getElementById('ai-output').innerText = "텍스트가 너무 짧습니다. 대화가 더 입력되면 분석을 시작합니다.";
    return;
  }

  clearTimeout(aiTimeout);
  aiTimeout = setTimeout(async () => {
    const model = await getAiModel();
    const outputBox = document.getElementById('ai-output');
    
    outputBox.innerText = "Gemini가 문맥 분석 중...";
    
    if (model) {
      try {
        const session = await model.create({
          systemPrompt: "너는 사용자의 브라우저 화면 자막을 분석하는 비서야. 오직 제공된 [대화 내용]에만 집중해서 답해야 해."
        });
        
        const structuredPrompt = `
[명령어]
아래 제공된 [대화 내용]의 핵심 요점과 그에 맞는 추천 답변을 한국어로 작성해라. 다른 사설이나 인사말은 절대 하지 마라.

[형식]
• 요점: (한 줄 요약)
• 추천 답변: (대화에 이어질 자연스러운 답변 한 줄)

[대화 내용]
"""
${currentText}
"""
`;

        const result = await session.prompt(structuredPrompt);
        outputBox.innerText = result.trim();
        session.destroy(); 
      } catch (err) {
        outputBox.innerText = "내장 AI 분석 오류: " + err.message;
      }
    } else {
      const result = await getSimulatedAIResponse(currentText);
      outputBox.innerText = result;
    }
  }, 800);
});

// Focus Emulations
const textInputElem = document.getElementById('text-input');
textInputElem.addEventListener('focus', function() {
  if (this.innerText === "구글 미트 자막을 가져오거나 여기에 대화 내용을 입력하세요.") {
    this.innerText = "";
  }
});
textInputElem.addEventListener('blur', function() {
  if (this.innerText.trim() === "") {
    this.innerText = "구글 미트 자막을 가져오거나 여기에 대화 내용을 입력하세요.";
  }
});

// ==========================================
// 4. [ALTERNATIVE 1] LOCAL MARKDOWN EXPORT
// ==========================================
document.getElementById('btn-download-md').addEventListener('click', () => {
  const originalText = document.getElementById('text-input').innerText;
  const aiOutput = document.getElementById('ai-output').innerText;
  
  if (originalText.trim().length === 0 || originalText.includes("여기에 대화 내용을 입력하세요")) {
    alert("다운로드할 대화 텍스트 내용이 아직 비어 있습니다!");
    return;
  }

  const dateStr = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\s/g, '');
  const fileContent = `# Langester Local AI Report (${new Date().toLocaleString()})\n\n## 🤖 Gemini Nano 분석 결과\n${aiOutput}\n\n## 📝 대화 원본 스크립트\n${originalText}\n\n---\n*Prisist Local-First Mode - Safe Offline Saving*`;
  
  const blob = new Blob([fileContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Langester_Report_${dateStr}.md`);
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
      alert("🔒 구글 계정 인증에 실패했습니다!\n\n구글 로그인을 원치 않으시면 좌측의 [대안 1] 마크다운 다운로드 기능을 바로 이용하십시오.\n\n(개발자 최종 배포 조치: manifest.json에 정상 발급된 Client ID가 매핑되어 있는지 확인해 주시기 바랍니다.)");
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
          title: "[Langester] 실시간 대화 요약 결과",
          notes: `[AI 분석 내용]\n${summaryData}\n\n[원본 텍스트]\n${originalText}`
        })
      });

      if (res.ok) {
        alert("🎉 구글 계정(Tasks)에 안전하게 연동 저장이 완료되었습니다!");
      } else {
        alert("구글 저장 실패 (구글 서버 API 통신 에러가 발생했습니다.)");
      }
    } catch (error) {
      console.error(error);
      alert("저장 에러: " + error.message);
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
    alert("크롬 시스템 페이지에서는 보안상 텍스트를 가져올 수 없습니다. 일반 웹사이트(예: 뉴스, 유튜브)에서 테스트해 주세요!");
    return;
  }

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selection = window.getSelection().toString().trim();
      if (selection) return selection;

      const meetCaptions = document.querySelectorAll('.bhY6Be, .iT96nd, span[data-phrase]');
      if (meetCaptions.length > 0) {
        return Array.from(meetCaptions).map(el => el.innerText).filter(t => t.trim()).slice(-5).join('\n');
      }

      const articles = document.querySelectorAll('article p, main p, div[class*="content"] p, p');
      if (articles.length > 0) {
        return Array.from(articles)
                    .map(el => el.innerText.trim())
                    .filter(t => t.length > 20)
                    .slice(0, 3) 
                    .join('\n\n');
      }

      return null;
    }
  }, (results) => {
    const textInput = document.getElementById('text-input');
    if (results && results[0] && results[0].result) {
      textInput.innerText = results[0].result;
      updateCharCount(results[0].result);
      textInput.dispatchEvent(new Event('input'));
    } else {
      alert("페이지 내에서 활성화된 텍스트나 자막 영역을 감지하지 못했습니다.\n\n원하는 텍스트 영역을 마우스로 드래그(블록 지정)한 뒤 다시 버튼을 클릭하여 시도해 주십시오.");
    }
  });
});

// YouTube Studio Integration
document.getElementById('btn-sync-youtube').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url.includes("studio.youtube.com")) {
    alert("YouTube 스튜디오 페이지(studio.youtube.com)에서만 작동하는 기능입니다!");
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: "SCRAPE_YOUTUBE_STUDIO" }, (response) => {
    if (response && response.success) {
      const combinedText = `[YouTube 제목]\n${response.title}\n\n[YouTube 설명]\n${response.description}`;
      const textInput = document.getElementById('text-input');
      textInput.innerText = combinedText;
      updateCharCount(combinedText);
      textInput.dispatchEvent(new Event('input'));
    } else {
      alert("YouTube 스튜디오에서 텍스트를 가져오지 못했습니다. 페이지가 완전히 로드되었는지 확인해 주세요.");
    }
  });
});
