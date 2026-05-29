// panel.js - Langester Hybrid AI Workspace Controller

// Global AI Model reference
let aiModel = null;

// ==========================================
// 1. CHROME BUILT-IN AI DETECTION & UTILS
// ==========================================
async function getAiModel() {
  if (aiModel) return aiModel;
  
  if (window.ai) {
    // 1) Try modern Chrome languageModel spec
    if (window.ai.languageModel) {
      const cap = await window.ai.languageModel.capabilities();
      if (cap.available !== 'no') {
        aiModel = window.ai.languageModel;
        return aiModel;
      }
    }
    // 2) Try previous Chrome assistant spec
    if (window.ai.assistant) {
      const cap = await window.ai.assistant.capabilities();
      if (cap.available !== 'no') {
        aiModel = window.ai.assistant;
        return aiModel;
      }
    }
  }
  return null;
}

// Simulated dynamic mock generator if Chrome AI features are disabled
function getSimulatedAIResponse(text) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`[AI 요약 및 추천 답변]
대화 내용 요약: 
상대방은 오늘 발표된 마케팅 협력 일정 조율에 동의하였으며, 세부적인 작업량 분담 및 구글 Tasks 동기화 모듈 개발 일정 확정을 희망하고 있습니다.

추천 답변 3가지:
1. (짧게) 의견 주셔서 감사합니다! 구체적인 미팅 기한을 정하는 게 어떨까요?
2. (정중하게) 제안해 주신 업무 분담안을 감사히 검토하였습니다. 상호 유기적인 조율을 위해 다가오는 화요일 화상 회의 일정을 제안드리고자 합니다. 편하신 시간대를 회신해 주시면 감사하겠습니다.
3. (협상형) 일정 단축안은 긍정적입니다. 다만, 신규 모듈 개발 공수를 감안할 때 일정 조정에 따른 마케팅 예산 상향이나 범위 축소가 필요해 보입니다. 함께 의논하시죠.`);
    }, 450);
  });
}

// Character counter updater
function updateCharCount(text) {
  const cleanText = text.replace(/구글 미트 자막을 가져오거나 여기에 대화 내용을 입력하세요\./g, '');
  document.getElementById('char-count').innerText = `${cleanText.length} chars`;
}

// ==========================================
// 2. PAGE STARTUP ACTIONS
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  const model = await getAiModel();
  const outputBox = document.getElementById('ai-output');
  const textInput = document.getElementById('text-input');
  const statusBadge = document.getElementById('ai-model-badge');
  const statusDot = document.getElementById('system-status-dot');
  
  if (!model) {
    statusDot.classList.add('offline');
    statusDot.title = "Chrome 내장 AI 미감지 (오프라인 모의 분석 실행)";
    statusBadge.innerText = "MOCK LOCAL AI";
    outputBox.innerHTML = 
      "🔮 <strong>오프라인 비서가 대기 중입니다.</strong><br/>" +
      "<span style='font-size: 11px; color: var(--color-text-sub);'>" +
      "크롬 내장 Gemini Nano가 감지되지 않았으나, 하이브리드 로컬 테스트 모듈이 활성화되어 원활한 테스트가 가능합니다. 대화창에 글을 입력해 보세요.</span>";
  } else {
    statusDot.classList.remove('offline');
    statusDot.title = "Chrome Gemini Nano 활성화 완료";
    statusBadge.innerText = "GEMINI NANO ACTIVE";
    outputBox.innerText = "🔮 크롬 내장 Gemini Nano가 안전하게 연동되었습니다. 대화를 불러오거나 입력해 주십시오.";
  }
  
  // Character counter
  updateCharCount(textInput.innerText);
});

// ==========================================
// 3. EDIT ACTION DEBOUNCER & AI TRIGGER
// ==========================================
let aiTimeout = null;
document.getElementById('text-input').addEventListener('input', async (e) => {
  const currentText = e.target.innerText.trim();
  updateCharCount(currentText);
  
  if (currentText.length < 5) return;

  // Debouncing to avoid flooding the API
  clearTimeout(aiTimeout);
  aiTimeout = setTimeout(async () => {
    const model = await getAiModel();
    const outputBox = document.getElementById('ai-output');
    
    outputBox.innerText = "⚡ 실시간 의도 분석 및 맞춤형 답변 생성 중...";
    
    if (model) {
      try {
        const session = await model.create({
          systemPrompt: "너는 다국어 협상 및 업무 회의를 대행하여 조율하는 한국인 전문 통역 비서야. 대화 내용을 깔끔하게 분석하고, 내가 전송할 수 있는 상황별 답변 3가지(짧은 구어 / 정중한 격식 / 비즈니스 협상형)를 한국어로 추천해줘."
        });
        
        const prompt = `다음 대화 내용의 핵심 용도를 1줄 요약하고 추천 답변을 각각 한 줄씩 작성해줘:\n\n"${currentText}"`;
        const result = await session.prompt(prompt);
        outputBox.innerText = result;
        session.destroy();
      } catch (err) {
        outputBox.innerText = "내장 AI 분석 에러: " + err.message;
      }
    } else {
      // Fallback Mock local AI response
      const result = await getSimulatedAIResponse(currentText);
      outputBox.innerText = result;
    }
  }, 800); // 800ms debounce
});

// Focus Emulations for contenteditable placeholder
const textInput = document.getElementById('text-input');
textInput.addEventListener('focus', function() {
  if (this.innerText === "구글 미트 자막을 가져오거나 여기에 대화 내용을 입력하세요.") {
    this.innerText = "";
  }
});
textInput.addEventListener('blur', function() {
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
      alert("🔒 구글 계정 인증에 실패했습니다!\n\n구글 로그인을 원치 않으시면 좌측의 [대안 1] 마크다운 다운로드 기능을 바로 이용하십시오.\n\n(개발자 최종 배포 조치: manifest.json에 정상 발급된 Client ID가 매핑되어 있는지 확인해 주시기 바랍니다. 개발자 모드의 고유 Extension ID 등록이 선행되어야 작동합니다.)");
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

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // 1) Extract dragged/highlighted mouse text as highest priority
      const selection = window.getSelection().toString().trim();
      if (selection) return selection;

      // 2) General fallback: crawl Google Meet / DOM elements
      const captionElements = document.querySelectorAll('.bhY6Be, .iT96nd, p, span[data-phrase]');
      if (captionElements.length > 0) {
        return Array.from(captionElements)
                    .map(el => el.innerText.trim())
                    .filter(text => text.length > 0)
                    .slice(-5)
                    .join('\n');
      }
      return null;
    }
  }, (results) => {
    const textInput = document.getElementById('text-input');
    if (results && results[0] && results[0].result) {
      textInput.innerText = results[0].result;
      
      // Update counters
      updateCharCount(results[0].result);
      
      // Dispatch input event to trigger AI call immediately
      textInput.dispatchEvent(new Event('input'));
    } else {
      alert("페이지 내에서 활성화된 텍스트나 자막 영역을 감지하지 못했습니다.\n\n원하는 텍스트 영역을 마우스로 드래그(블록 지정)한 뒤 다시 버튼을 클릭하여 시도해 주십시오.");
    }
  });
});
