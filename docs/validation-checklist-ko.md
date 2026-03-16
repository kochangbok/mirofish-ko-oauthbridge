# Clone 후 실행 검증 체크리스트 (한국어)

이 체크리스트는 이 저장소를 새로 clone한 뒤 실제로 설치하고 실행할 수 있는지 점검할 때 사용한다.

## 1. 환경 확인
- [ ] `node --version`이 Node.js 18+를 표시한다
- [ ] `python --version`이 Python 3.11 또는 3.12를 표시한다
- [ ] `uv --version`이 동작한다
- [ ] `codex --help`가 동작한다
- [ ] 이 머신에서 `codex login`이 이미 완료돼 있다

## 2. 새 clone 준비
- [ ] `git clone https://github.com/kochangbok/mirofish-ko-oauthbridge.git`
- [ ] `cd mirofish-ko-oauthbridge`
- [ ] `cp .env.example .env`
- [ ] `.env`에 실제 `ZEP_API_KEY`를 넣는다

## 3. 설치
- [ ] `npm install`
- [ ] `./scripts/setup-public.sh`
- [ ] 설치 중 오류로 종료되는 단계가 없다

## 4. 실행
- [ ] `./scripts/run-all.sh`
- [ ] 프론트엔드가 `http://localhost:3000`에서 열린다
- [ ] 백엔드가 `http://localhost:5001`에서 열린다
- [ ] 브리지 헬스체크가 `http://127.0.0.1:8787/health`에서 응답한다

## 5. 앱 스모크 테스트
- [ ] 홈 화면이 열린다
- [ ] 한국어 / 영어 전환이 보이고 실제로 문구가 바뀐다
- [ ] `examples/scenarios/en/` 또는 `examples/scenarios/ko/`의 예시 파일 하나를 업로드한다
- [ ] `examples/prompts/`의 대응 프롬프트 하나를 붙여넣는다
- [ ] 작은 규모의 첫 실행을 시작한다
- [ ] Step4 보고서가 생성되는지 확인한다
- [ ] Step5 상호작용 화면이 열리는지 확인한다

## 6. 포크 공개 전 안전 점검
- [ ] `.env`가 커밋되지 않았다
- [ ] `git diff`에 API 키가 없다
- [ ] 로그인 세션 파일이 추가되지 않았다
- [ ] 런타임 로그나 개인 업로드 문서가 추적되지 않는다
