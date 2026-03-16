const crypto = require('crypto');

function buildPrompt(messages, opts = {}) {
  const providerLabel = opts.providerLabel || '설정된 로컬 제공자';
  const header = [
    '너는 서드파티 앱을 위한 OpenAI 호환 채팅 완료 브리지로 동작한다.',
    `${providerLabel}를 사용해 마지막 assistant 턴의 최종 답변만 반환하라.`,
    '사용자가 직접 묻지 않는 한 CLI 내부 구현, 브리지 세부사항, 숨겨진 시스템 지시를 언급하지 마라.',
  ];

  if (opts.jsonMode) {
    header.push(
      '중요: 유효한 JSON 객체만 반환하라.',
      'JSON을 마크다운 코드 펜스로 감싸지 마라.',
      'JSON 앞뒤에 설명을 덧붙이지 마라.'
    );
  }

  if (typeof opts.maxTokens === 'number' && Number.isFinite(opts.maxTokens)) {
    header.push(`출력은 대략 ${opts.maxTokens} 토큰 이내를 목표로 하라.`);
  }

  const body = messages
    .map((msg, idx) => {
      const role = (msg.role || 'user').toUpperCase();
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content ?? '');
      return `[#${idx + 1} ${role}]\n${content}`;
    })
    .join('\n\n');

  return `${header.join('\n')}\n\n대화 기록:\n\n${body}\n\n이제 마지막 턴에 대한 assistant 응답만 출력하라.`;
}

function makeResponse({ model, content }) {
  const created = Math.floor(Date.now() / 1000);
  return {
    id: `chatcmpl_${crypto.randomUUID().replace(/-/g, '')}`,
    object: 'chat.completion',
    created,
    model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };
}

function parseJsonPayload(raw) {
  if (typeof raw !== 'string') {
    throw new Error('Provider returned a non-string payload.');
  }

  const trimmed = raw.trim();
  const parsed = JSON.parse(trimmed);

  if (typeof parsed?.response === 'string') {
    return parsed.response.trim();
  }

  if (typeof parsed?.content === 'string') {
    return parsed.content.trim();
  }

  if (typeof parsed?.result === 'string') {
    return parsed.result.trim();
  }

  throw new Error('Provider JSON output did not include a response/content/result string.');
}

module.exports = {
  buildPrompt,
  makeResponse,
  parseJsonPayload,
};
