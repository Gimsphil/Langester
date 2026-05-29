# ⚡ Langester Local AI Workspace Co-Pilot (v1.3 Hybrid)

**Langester AI Co-Pilot**은 크롬 내장 AI(Gemini Nano)와 구글 워크스페이스(Google Tasks)를 결합하여, 실시간 대화 내용을 분석하고 행동을 제안하는 프리미엄 로컬 비서 크롬 확장 프로그램(Chrome Extension)입니다.

사용자의 환경과 프라이버시 선호도에 맞춰 **오프라인 우선 로컬 마크다운 다운로드(대안 1)**와 **보안 구글 워크스페이스 계정 동기화(대안 2)**를 한 화면에서 완벽하게 지원하는 하이브리드 저장 방식으로 설계되었습니다.

---

## 🎨 주요 디자인 및 아키텍처 특징

1. **Sleek Dark Glassmorphism UI**
   * HSL 컬러 토큰 기반의 우주선 조종석 테마와 눈의 피로를 덜어주는 다크 모드.
   * `backdrop-filter: blur(10px)`와 은은한 경계 광원 효과를 입힌 최첨단 글래스모피즘 레이아웃.
   * 구글 프리미엄 타이포그래피 `Outfit` 및 `Noto Sans KR` 폰트의 완벽한 조화.
   * 버튼 호버 시 바운시 스케일링(`1.02`), 로고 펄스 네온 등 고급 마이크로 애니메이션 기본 탑재.

2. **Hybrid Storage System (대안 1 + 2)**
   * **[대안 1] Markdown (.md) 로컬 즉시 다운로드:** 번거로운 로그인이나 클라우드 전송 없이 발언 대화와 AI 분석 보고서를 로컬 PC에 안전하게 오프라인 보관합니다.
   * **[대안 2] 구글 Tasks 클라우드 동기화:** 개인 구글 계정으로 로그인하여 본인의 구글 Tasks(할 일 목록) 내로 실시간 요약 내용을 자동 등록 보존합니다.

3. **Future-Proof Chrome Built-in AI Orchestrator**
   * 최신 크롬 스펙인 `window.ai.languageModel` 및 이전 스펙인 `window.ai.assistant` 규격을 모두 교차 검증하여 에러를 예방합니다.
   * 크롬 built-in AI 플래그가 비활성화된 머신에서도 **지능형 오프라인 모의 분석 엔진(Mock AI)**으로 자동 전환되어 번역 및 3가지 톤별 추천 답변(짧은 대화형 / 정중한 격식형 / 비즈니스 협상형) 기능을 원활하게 테스트할 수 있습니다.

4. **능동적 페이지 텍스트 크롤링 스크립트**
   * 마우스로 드래그하여 블록 지정한 텍스트가 있을 경우 최우선 수집합니다.
   * 활성화된 구글 미트 자막 엘리먼트(`.bhY6Be`, `.iT96nd` 등)를 식별하여 실시간 번역 및 받아쓰기 타임라인을 구동시킵니다.

---

## 🚀 크롬 브라우저 사용 및 등록 방법 (Chrome Extension Guide)

### 1단계: 개발자 모드로 크롬에 확장 프로그램 로드하기
1. 구글 크롬 브라우저를 열고 주소창에 `chrome://extensions/`를 입력하여 접속합니다.
2. 우측 상단의 **개발자 모드(Developer Mode)** 토글 스위치를 활성화합니다.
3. 좌측 상단에 표시되는 **압축해제된 확장 프로그램 로드(Load unpacked)** 버튼을 클릭합니다.
4. 로컬 PC에 저장된 **`D:\Langester`** 폴더를 선택하여 업로드합니다.
5. 크롬 툴바의 퍼즐 조각 아이콘(확장 프로그램 메뉴)을 누르고 **Langester AI Co-Pilot**을 핀 고정하여 띄웁니다.

### 2단계: 크롬 built-in Gemini Nano 오프라인 엔진 활성화
1. 크롬 브라우저 주소창에 `chrome://flags`를 입력하고 엔터를 누릅니다.
2. 상단 검색창에 **Prompt API**를 검색하여 **Prompt API for Gemini Nano** 설정을 **Enabled**로 변경합니다.
3. **Enlistment** 검색 후 동일하게 **Enabled**로 활성화합니다.
4. 우측 하단의 **Relaunch** 버튼을 클릭하여 크롬 브라우저를 완전히 재시작합니다.
5. 확장 프로그램 창을 실행했을 때 우측 상단의 상태 점이 **초록색(GEMINI NANO ACTIVE)**으로 빛나면 오프라인 온디바이스 로컬 번역이 완벽히 켜진 것입니다. (플래그 활성이 어려운 환경은 주황색 등으로 표시되며 모의 엔진이 지능적으로 대리 구동됩니다.)

---

## 🔑 구글 연동 동기화 클라이언트 식별표 세팅 (개발자 최초 1회)

구글 보안 정책상 개개인이 발급받은 열쇠 코드(Client ID)가 `manifest.json`에 매핑되어 있어야 일반 사용자들이 로그인 버튼을 눌렀을 때 보안 경고 없이 본인의 구글 Tasks 계정으로 데이터를 자동 전송할 수 있습니다.

1. 크롬 확장 프로그램 관리 페이지(`chrome://extensions/`)에 업로드된 **Langester AI Co-Pilot**의 32자리 고유 ID(예: `abcdefghijklmnopqrstuvwxyzjhgfed`)를 복사합니다.
2. [Google Cloud Console](https://console.cloud.google.com/)에 개발자 본인의 구글 계정으로 접속합니다.
3. 새 프로젝트를 생성한 후 **사용자 인증 정보(Credentials)** 페이지로 이동합니다.
4. **사용자 인증 정보 만들기** -> **OAuth 클라이언트 ID**를 클릭합니다.
5. 애플리케이션 유형을 **Chrome 앱(Chrome Extension)**으로 지정하고, 복사한 32자리 고유 ID를 입력한 뒤 저장합니다.
6. 발급 완료된 **클라이언트 ID(Client ID)** 문자열(예: `123456789-abcdefg.apps.googleusercontent.com`)을 복사합니다.
7. 로컬 컴퓨터의 **`D:\Langester\manifest.json`** 파일을 텍스트 에디터로 열어 `"client_id"` 속성의 값 부분을 복사한 구글 클라이언트 ID로 변경한 뒤 저장합니다.
8. 크롬 확장 프로그램 관리 페이지에서 Langester의 **새로고침(Refresh) ↻** 아이콘을 클릭하면 세팅이 종료됩니다.

---

## 📁 전체 프로젝트 소스 파일 목록
* `manifest.json` : 크롬 확장 프로그램 MV3 기본 설정 정보 및 OAuth2 스코프 정의.
* `background.js` : 구글 로그인 토큰 및 캐시 관리용 백그라운드 서비스 워커.
* `content.js` : 유튜브 스튜디오 및 웹 페이지 텍스트 영역 실시간 DOM 추출 스크립트.
* `sidepanel/panel.html` : 다크 글래스모피즘 싱글스크린 하이브리드 UI 레이아웃.
* `sidepanel/panel.css` : HSL 네온 컬러 변수 및 바운시 클릭 모션, 스크롤바 디자인 CSS.
* `sidepanel/panel.js` : 비동기 Gemini API 번역 처리 및 마크다운 오프라인 파일 생성 스크립트.
