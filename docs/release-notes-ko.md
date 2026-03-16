# 릴리즈 노트 (한국어)

## 릴리즈 요약
이번 릴리즈는 퍼블릭 올인원 저장소를 더 완전한 스타터 킷으로 확장한다.
- 로컬 브리지의 **Gemini 경로를 실제로 다시 검증**했고
- README에 **브리지 스크린샷, provider 문서, 릴리즈 링크**를 더 잘 드러냈으며
- 예시 섹션에 **3개 주제의 상세 다문서 시나리오 팩**을 추가했다

## 핵심 변경점

### 1. Gemini 경로 재검증 성공
- 유지보수 환경에서 Gemini 설정 스키마 불일치를 정리
- headless Gemini CLI 단독 호출 성공: `GEMINI_BRIDGE_SMOKE_OK`
- bridge 경유 completion 성공: `GEMINI_PUBLIC_BRIDGE_OK`
- `docs/gemini-auth-retest-2026-03-15.md` 추가

### 2. bridge UX / 문서 개선
- 브리지 playground 스크린샷을 아래 문서에 반영
  - `README.md`
  - `README.ko.md`
  - `codex-bridge/README.md`
  - `codex-bridge/README.ko.md`
- 루트 README에 릴리즈/문서 관련 배지 추가

### 3. 비-OAuth provider 설계 문서 추가
- `docs/provider-matrix.md`
- `docs/claude-api-key-provider-design.md`
- `docs/aws-bedrock-provider-design.md`
- `docs/google-vertex-provider-design.md`

### 4. 예시 자료 대폭 확장
빠른 시작용 예시를 더 구체화했고, 아래 3개 주제에 대해 상세 다문서 팩을 추가했다.
- 호르무즈 해협 / 한국 증시
- 카카오 오픈채팅 정책 공지 반발
- 테슬라 코리아 리콜 / 브랜드 신뢰 충격

상세 팩은 한국어/영어 모두 아래 경로에 있다.
- `examples/packs/ko/`
- `examples/packs/en/`

## 검증 메모
유지보수 환경에서 아래를 확인했다.
- 프론트 빌드 성공
- `codex-bridge` Node 문법 체크 성공
- Gemini bridge health 응답 성공
- Gemini bridge completion 성공

## 사용자 추천 다음 단계
1. 저장소 clone
2. `.env` 작성
3. 먼저 `examples/scenarios/`의 짧은 seed로 시작
4. 더 깊은 시뮬레이션이 필요하면 `examples/packs/`로 이동
