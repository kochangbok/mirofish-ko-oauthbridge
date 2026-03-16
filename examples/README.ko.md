# 예시 파일 안내

이 저장소의 예시는 이제 **2단계 구조**로 제공된다.

1. `scenarios/` + `prompts/`의 **빠른 시작용 예시**
   - 짧은 seed 문서
   - 첫 10~20 라운드 테스트에 적합
2. `packs/`의 **상세 시나리오 팩**
   - 여러 배경 문서로 구성
   - 실제 리서치 메모처럼 stakeholder, 시간축, 쟁점을 더 촘촘하게 넣은 형태

## 빠른 시작 경로
- `scenarios/ko/`, `scenarios/en/`
- `prompts/ko/`, `prompts/en/`

## 상세 팩 경로
- `packs/ko/hormuz-korea-2026-03-15/`
- `packs/en/hormuz-korea-2026-03-15/`
- `packs/ko/kakao-openchat-policy-2026-03-15/`
- `packs/en/kakao-openchat-policy-2026-03-15/`
- `packs/ko/tesla-korea-recall-2026-03-15/`
- `packs/en/tesla-korea-recall-2026-03-15/`

## 추천 사용 순서
1. 먼저 `scenarios/...`에서 파일 1개만 업로드
2. `prompts/...`에서 대응 프롬프트 1개 붙여넣기
3. 첫 실행은 짧게 돌리기
4. 더 깊은 시뮬레이션이 필요할 때 `packs/...`의 다문서 세트를 사용하기
