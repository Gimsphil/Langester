// panel.js - Langester Hybrid AI Workspace Controller (v1.3.6 Diagnostic)

let aiModel = null;
let diagLog = [];

async function getAiModel() {
  if (aiModel) return aiModel;
  diagLog = []; // 초기화

  try {
    const aiHost = window.ai || (typeof chrome !== 'undefined' && chrome.ai);
    
    if (!aiHost) {
      diagLog.push("❌ window.ai 객체를 찾을 수 없음");
    } else {
      diagLog.push("✅ AI 객체 감지됨");
      const modelApi = aiHost.languageModel || aiHost.assistant;
      if (!modelApi) {
        diagLog.push("❌ languageModel API가 누락됨 (Flags 확인 필요)");
      } else {
        diagLog.push("✅ API 구조 확인됨");
        const cap = await modelApi.capabilities();
        diagLog.push(`ℹ️ 모델 가용성: ${cap.available}`);
        if (cap.available !== 'no') {
          aiModel = await modelApi.create();
          return aiModel;
        }
      }
    }
  } catch (e) {
    diagLog.push(`❌ 에러 발생: ${e.message}`);
  }
  return null;
}

async function runDiagnostics() {
  const statusBadge = document.getElementById('ai-model-badge');
  const statusDot = document.getElementById('system-status-dot');
  const outputBox = document.getElementById('ai-output');

  statusBadge.innerText = "진단 중...";
  const model = await getAiModel();

  if (!model) {
    statusDot.className = "status-dot offline";
    statusBadge.innerText = "AI OFFLINE";
    outputBox.innerHTML = `
      <div style="color:#f87171; font-weight:600; margin-bottom:10px;">⚠️ AI 연동 실패 상세 로그:</div>
      <div style="font-family:monospace; font-size:11px; background:rgba(0,0,0,0.2); padding:10px; border-radius:6px; color:#ddd; line-height:1.6;">
        ${diagLog.join("<br>")}
      </div>
      <div style="margin-top:10px; font-size:11px; color:#9ca3af;">
        * 모든 로그가 ✅인데 안 된다면 크롬을 완전히 종료 후 다시 실행해 보세요.
      </div>
    `;
  } else {
    statusDot.className = "status-dot";
    statusBadge.innerText = "GEMINI NANO ACTIVE";
    document.getElementById('ai-wizard-section').classList.add('collapsed');
    outputBox.innerText = "✨ 연동 성공! 이제 대화를 입력하시면 실시간 분석을 시작합니다.";
  }
}

// 이벤트 및 기본 기능
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('btn-link-flags1').onclick = () => chrome.tabs.create({ url: 'chrome://flags/#optimization-guide-on-device-model' });
  document.getElementById('btn-link-flags2').onclick = () => chrome.tabs.create({ url: 'chrome://flags/#prompt-api-for-gemini-nano' });
  document.getElementById('btn-link-components').onclick = () => chrome.tabs.create({ url: 'chrome://on-device-internals' });
  const wizardHeader = document.querySelector('.wizard-header');
  if (wizardHeader) wizardHeader.onclick = () => document.getElementById('ai-wizard-section').classList.toggle('collapsed');
  
  await runDiagnostics();
});

document.getElementById('btn-re-check').onclick = async () => { aiModel = null; await runDiagnostics(); };

document.getElementById('text-input').oninput = async (e) => {
  const currentText = e.target.innerText.trim();
  if (currentText.length < 5) return;
  const model = await getAiModel();
  const outputBox = document.getElementById('ai-output');
  if (model) {
    outputBox.innerText = "분석 중...";
    try {
      const result = await model.prompt(`내용을 요약하고 추천 답변을 한 줄씩 작성해줘.\n내용: """\n${currentText}\n"""`);
      outputBox.innerText = result.trim();
    } catch (err) { outputBox.innerText = "분석 오류: " + err.message; aiModel = null; }
  }
};

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

document.getElementById('btn-download-md').onclick = () => {
  const blob = new Blob([document.getElementById('text-input').innerText], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "Langester_Report.md"; link.click();
};
