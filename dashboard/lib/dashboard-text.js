const EXACT_REPLACEMENTS = [
  ['基于seed文档，周末韩国岛内以总统실의 신중 메시지为核心，媒体/시장/시민단체按照安保、공포、물가三条主轴展开agent diffusion，体现政府、정유·방산、개인커뮤니티的层层传导及政策消息能否压制공포。',
    'seed 문서를 기반으로, 주말 한국 내부에서는 대통령실의 신중 메시지를 중심으로 언론·시장·시민단체가 안보·공포·물가 세 축으로 agent diffusion을 전개하며, 정부·정유/방산·개인 커뮤니티의 단계적 전파와 정책 메시지가 공포를 누를 수 있는지를 보여준다.'],
  ['本文围绕2026年5月9日后韩国产业税务调整，强调多住宅持有者的交易税恢复、保有税的价格与政策双重驱动以及地方与实居一户之差异化优待，描绘了官媒、研究者、媒体与投资者之间的舆论互動及政策监测重点。',
    '이 문서는 2026년 5월 9일 이후 한국의 부동산 세제 조정을 중심으로, 다주택자의 거래세 복원과 보유세의 가격·정책 이중 압력, 그리고 지방과 실거주 1주택자 사이의 차등 우대가 어떻게 작동하는지를 요약한다. 또한 관영 매체, 연구자, 언론, 투자자 사이의 여론 상호작용과 정책 모니터링 핵심 지점을 함께 보여준다.'],
  ['时间配置:', '시간 구성:'],
  ['事件配置:', '이벤트 구성:'],
  ['Agent配置:', 'Agent 구성:'],
  ['初始帖子分配:', '초기 게시물 배정:'],
  ['使用默认中国人作息配置（每轮1小时）', '기본 활동 시간 설정 사용(라운드당 1시간)'],
  ['使用默认配置', '기본 설정 사용'],
  ['个帖子已分配发布者', '개 게시물에 게시자 배정 완료'],
  ['已分配发布者', '게시자 배정 완료'],
  ['成功生成', '생성 완료'],
  ['每轮1小时', '라운드당 1시간'],
  ['中国人作息配置', '기본 활동 시간 설정'],
  ['帖子', '게시물'],
  ['Blue House (靑)', '대통령실'],
  ['Blue House', '대통령실'],
  ['靑', '대통령실'],
  ['基于seed文档', 'seed 문서를 기반으로'],
  ['周末韩国岛内', '주말 한국 내부에서는'],
  ['按照安保、공포、물가三条主轴展开agent diffusion', '안보·공포·물가 세 축으로 agent diffusion을 전개하며'],
  ['体现政府、정유·방산、개인커뮤니티的层层传导及政策消息能否压制공포。', '정부, 정유·방산, 개인 커뮤니티의 단계적 전파와 정책 메시지가 공포를 누를 수 있는지를 보여준다.'],
  ['媒体/시장/시민단체', '언론/시장/시민단체'],
  ['为核心', '를 중심으로'],
  ['层层传导', '단계적 전파'],
  ['政策消息', '정책 메시지'],
  ['压制공포', '공포를 누르다'],
  ['韩国岛内', '한국 내부'],
  ['周末韩国', '주말 한국'],
  ['岛内', '내부'],
  ['媒体', '언론']
]

const IDENTIFIER_REPLACEMENTS = new Map([
  ['Entity', '엔터티'],
  ['Person', '개인'],
  ['Organization', '조직'],
  ['MinistrySpokesperson', '부처 대변인'],
  ['GovernmentAgencyAccount', '정부기관 계정'],
  ['RealEstateJournalist', '부동산 기자'],
  ['PropertyMarketResearcher', '부동산 시장 연구자'],
  ['MultiHomeInvestor', '다주택 투자자'],
  ['RealEstateDeveloperAccount', '부동산 개발사 계정'],
  ['MortgageLenderAccount', '주택담보대출 기관 계정'],
  ['LocalCommunityGroup', '지역 커뮤니티 단체'],
  ['POLICY_ANNOUNCES', '정책 발표'],
  ['REPORTS_ON', '보도'],
  ['CITES_RESEARCH', '연구 인용'],
  ['INFLUENCES_POLICY', '정책 영향'],
  ['FACILITATES_FINANCE', '금융 지원'],
  ['ADVOCATES_FOR', '정책 촉구'],
  ['SHARES_INSIGHTS', '인사이트 공유'],
  ['RELATED_TO', '관련됨'],
  ['Unknown', '알 수 없음']
])

const REGEX_REPLACEMENTS = [
  [/生成 완료\s*(\d+)개/g, (_, count) => `${count}개 생성 완료`],
  [/(\d+)개개/g, '$1개'],
  [/(\d+)\s*个/g, '$1개'],
  [/以([^，。,]+?)를 중심으로/g, (_, phrase) => `${phrase}를 중심으로`],
  [/seed 문서를 기반으로，?/g, 'seed 문서를 기반으로 '],
  [/주말 한국 내부에서는\s*/g, '주말 한국 내부에서는 '],
  [/\s+\|\s+/g, ' | '],
  [/，/g, ', '],
  [/。/g, '. ']
]

export function normalizeDashboardText(input) {
  if (input == null) return ''

  let text = `${input}`

  for (const [from, to] of EXACT_REPLACEMENTS) {
    text = text.split(from).join(to)
  }

  for (const [pattern, replacement] of REGEX_REPLACEMENTS) {
    text = text.replace(pattern, replacement)
  }

  text = text
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ \./g, '.')
    .replace(/ ,/g, ',')
    .trim()

  return text
}

export function normalizeConfigReasoning(reasoning) {
  return normalizeDashboardText(reasoning)
}

export function translateDashboardIdentifier(input) {
  if (input == null) return ''
  const text = `${input}`.trim()
  return IDENTIFIER_REPLACEMENTS.get(text) || text
}
