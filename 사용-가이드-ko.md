# 사용 가이드 (빠른 링크)

이 파일은 루트에서 바로 보기 위한 한국어 안내 링크야.

자세한 설명은 아래 문서를 봐:
- `docs/usage-guide-ko.md`

빠른 시작:
```bash
cp .env.example .env
npm install
npm run setup:public
PORT=8787 CODEX_MODEL=gpt-5.1-codex-mini CODEX_BRIDGE_WORKDIR=$(pwd) npm run dev:all
```
