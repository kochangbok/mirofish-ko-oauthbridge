# 사용 가이드 (한국어)

이 저장소 하나만 clone하면 MiroFish 본체와 Codex OAuth 브리지가 모두 들어 있다.

## 1. 준비물
- Node.js 18+
- Python 3.11 또는 3.12
- `uv`
- 기본 경로용 `codex` CLI, 또는 실험적 Gemini 경로용 Gemini CLI
- 기본값 기준 `codex login` 완료 상태
- `ZEP_API_KEY`

## 2. 설정
```bash
cp .env.example .env
```

`.env` 예시:
```env
LLM_API_KEY=local-oauth-bridge
LLM_BASE_URL=http://127.0.0.1:8787/v1
LLM_MODEL_NAME=gpt-5.1-codex-mini
ZEP_API_KEY=YOUR_ZEP_API_KEY_HERE
```

## 3. 설치
```bash
npm install
npm run setup:public
```

또는:
```bash
./scripts/setup-public.sh
```

## 4. 실행
```bash
PORT=8787 \
BRIDGE_PROVIDER=codex \
CODEX_MODEL=gpt-5.1-codex-mini \
CODEX_BRIDGE_WORKDIR=$(pwd) \
npm run dev:all
```

또는:
```bash
./scripts/run-all.sh
```

실험적 Gemini 경로:
```bash
PORT=8787 \
BRIDGE_PROVIDER=gemini \
GEMINI_MODEL=gemini-2.5-flash \
CODEX_BRIDGE_WORKDIR=$(pwd) \
npm run dev:all
```

## 5. 접속
- 프론트엔드: `http://localhost:3000`
- 백엔드: `http://localhost:5001`
- 브리지 playground: `http://127.0.0.1:8787/`
- 브리지: `http://127.0.0.1:8787/health`

## 6. 첫 테스트 방법
1. `examples/scenarios/ko/`에서 시나리오 하나 선택
2. MiroFish 홈에서 해당 문서를 업로드
3. 같은 주제의 `examples/prompts/ko/` 프롬프트 하나 입력
4. Step1 → Step5 순서로 진행
5. 첫 실행은 라운드 수를 적게 잡기

## 7. 권장 팁
- 처음엔 문서 1개만 업로드
- 예측 대상이 복잡하면 2회로 나눠 실행
- Step4 보고서 생성 후 Step5에서 후속 인터뷰/설문 활용

## 8. 주의
- 브리지는 로컬 실험용
- 기본값은 ChatGPT / Codex 로그인 세션이 필요하고, Gemini 경로는 로컬 Gemini CLI 로그인이 필요
- Zep 키는 여전히 필요

## 9. provider 선택 요령
- 실행 전에 `BRIDGE_PROVIDER=codex` 또는 `BRIDGE_PROVIDER=gemini`를 지정할 수 있다
- 또는 `LLM_MODEL_NAME=gemini:gemini-2.5-flash`처럼 provider가 붙은 모델명을 사용할 수 있다
- 브리지 루트(`/`)에서 provider 상태를 보고 빠른 프롬프트 테스트를 할 수 있다
