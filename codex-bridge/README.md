# codex-bridge

`codex-bridge`는 **로컬에 로그인된 Codex / ChatGPT 세션**을 이용해서, 일부 **OpenAI Chat Completions API 호환 엔드포인트**를 제공하는 **로컬 브리지**입니다.

즉, 다른 앱이 `POST /v1/chat/completions` 형태로 요청하면 내부에서 `codex exec`를 호출해 응답을 돌려주는 구조입니다.

## 지원 범위
- `GET /health`
- `POST /v1/chat/completions`
- **비스트리밍 텍스트 응답**
- `response_format.type=json_object`일 때 **프롬프트 기반의 best-effort JSON 모드**

## 중요한 제한사항
- **완전한 OpenAI API 구현이 아닙니다.**
- JSON 모드는 **보장되지 않으며**, 엄격한 프롬프트 유도에 의존합니다.
- 기본적으로 **한 번에 한 요청만** 처리합니다. 동시에 요청하면 `503`을 반환합니다.
- 응답의 `usage` 토큰 값은 실제 계산값이 아니라 **placeholder(`0`)** 입니다.
- 이 브리지는 **로컬 Codex 로그인 세션**에 의존하므로, **신뢰 가능한 개인/내부 머신에서만** 쓰는 것을 권장합니다.

## 설치
```bash
cd codex-bridge
npm install
```

## 실행
```bash
PORT=8787 \
CODEX_MODEL=gpt-5.1-codex-mini \
CODEX_BRIDGE_WORKDIR=/Users/george/.superset/projects/mirofishi-test/MiroFish \
npm start
```

## 빠른 테스트
```bash
curl -s http://127.0.0.1:8787/health | jq

curl -s http://127.0.0.1:8787/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{
    "model": "gpt-5.1-codex-mini",
    "messages": [
      {"role": "system", "content": "짧게 답해."},
      {"role": "user", "content": "한국어로 안녕하세요라고 말해."}
    ]
  }' | jq
```

## MiroFish `.env` 예시
```env
LLM_API_KEY=local-codex-bridge
LLM_BASE_URL=http://127.0.0.1:8787/v1
LLM_MODEL_NAME=gpt-5.1-codex-mini
ZEP_API_KEY=...
```

## 권장 사용처
- 개인 실험
- 내부용 프로토타입
- “ChatGPT/Codex 로그인 세션으로 MiroFish를 한 번 붙여보는” 테스트

## 비권장 사용처
- 퍼블릭 SaaS
- 다중 사용자 서비스
- 고신뢰 프로덕션 환경
- 엄격한 JSON/토큰 사용량 보장이 필요한 워크로드
