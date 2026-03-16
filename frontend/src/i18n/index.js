import { ref } from 'vue'

const STORAGE_KEY = 'mirofish-locale'
const initialLocale = (() => {
  if (typeof window === 'undefined') return 'ko'
  return window.localStorage.getItem(STORAGE_KEY) || 'ko'
})()

export const locale = ref(initialLocale)

const messages = {
  ko: {
    app: {
      title: 'MiroFish - 무엇이든 시뮬레이션',
      localeLabel: '언어',
      korean: '한국어',
      english: 'English'
    },
    common: {
      view: { graph: '그래프', split: '분할', workbench: '워크벤치' },
      status: {
        ready: '준비 완료',
        completed: '완료',
        processing: '처리 중',
        generating: '생성 중',
        running: '실행 중',
        preparing: '준비 중',
        initializing: '초기화 중',
        error: '오류'
      },
      button: {
        refresh: '새로고침',
        close: '닫기',
        back: '뒤로',
        next: '다음',
        send: '보내기',
        start: '시작',
        stop: '중지',
        selectAll: '전체 선택',
        clear: '초기화',
        show: '보기',
        hide: '숨기기'
      },
      label: {
        systemDashboard: '시스템 대시보드',
        simulationMonitor: '시뮬레이션 모니터',
        consoleOutput: '콘솔 출력',
        noProject: '프로젝트 없음',
        noSimulation: '시뮬레이션 없음',
        noReport: '리포트 없음',
        unknownProfession: '알 수 없는 직업',
        noBio: '소개 없음',
        noResponse: '응답 없음',
        noQuestion: '질문 없음',
        unnamedSimulation: '이름 없는 시뮬레이션',
        unknownFile: '알 수 없는 파일',
        noFile: '파일 없음',
        noLinkedFiles: '연결된 파일 없음'
      }
    },
    workflow: {
      graphBuild: { title: '그래프 구축' },
      envSetup: { title: '환경 구성' },
      simulationRun: { title: '시뮬레이션 시작' },
      report: { title: '보고서 생성' },
      interaction: { title: '심층 상호작용' }
    },
    home: {
      github: 'GitHub 저장소 보기',
      tag: '간결하고 범용적인 집단지성 엔진',
      version: '/ v0.1-프리뷰',
      titleLine1: '원하는 문서를 업로드하고',
      titleLine2: '미래를 즉시 시뮬레이션하세요',
      description: '단 한 단락의 텍스트만 있어도 MiroFish는 그 안의 현실 단서를 바탕으로 최대 수백만 에이전트로 이루어진 평행 세계를 자동 생성합니다. 그리고 상위 시점에서 변수를 주입해, 복잡한 집단 상호작용 속에서 동적인 환경에 맞는 “국소 최적해”를 탐색합니다.',
      slogan: '에이전트 군집 속에서 미래를 미리 실험하고, 수많은 시도 끝에 더 나은 결정을 선택하세요',
      systemStatus: '시스템 상태',
      ready: '준비 완료',
      readyDesc: '예측 엔진이 대기 중입니다. 여러 비정형 문서를 업로드해 시뮬레이션을 시작할 수 있습니다.',
      lowCost: '낮은 비용',
      lowCostDesc: '일반 시뮬레이션 평균 1회 약 $5',
      scalability: '고확장성',
      scalabilityDesc: '최대 수백만 에이전트 시뮬레이션',
      workflow: '워크플로우',
      uploadSeed: '01 / 현실 단서',
      supportedFormats: '지원 형식: PDF, MD, TXT',
      uploadTitle: '파일을 끌어다 놓아 업로드',
      uploadHint: '또는 클릭해서 파일 선택',
      inputParams: '입력 값',
      promptLabel: '>_ 02 / 시뮬레이션 프롬프트',
      promptPlaceholder: '// 자연어로 시뮬레이션 또는 예측 요청을 입력하세요. 예: 어떤 공지문을 올리면 여론이 어떻게 바뀔까?',
      engine: '엔진: MiroFish-V1.0',
      startEngine: '엔진 시작',
      starting: '초기화 중...'
    },
    history: {
      title: '시뮬레이션 기록',
      graphBuild: '그래프 구축',
      envSetup: '환경 구성',
      report: '분석 보고서',
      loading: '불러오는 중...',
      requirement: '시뮬레이션 요구사항',
      linkedFiles: '연결된 파일',
      playback: '기록 재생',
      playbackHint: 'Step3 “시뮬레이션 시작”과 Step5 “심층 상호작용”은 실행 중에만 사용할 수 있으며, 기록 재생은 지원하지 않습니다.',
      roundsBeforeStart: '시작 전',
      roundsSuffix: '라운드',
      filesSuffix: '개 파일'
    },
    step1: {
      ontology: '온톨로지 생성',
      graphBuild: 'GraphRAG 구축',
      complete: '구축 완료',
      completed: '완료',
      generating: '생성 중',
      waiting: '대기',
      inProgress: '진행 중',
      ontologyDesc: 'LLM이 문서 내용과 시뮬레이션 요구를 분석해 현실 단서를 추출하고 적절한 온톨로지 구조를 자동 생성합니다.',
      graphDesc: '생성된 온톨로지를 바탕으로 문서를 자동 분할하고 Zep으로 지식 그래프를 구축해 엔티티, 관계, 시계열 메모리, 커뮤니티 요약을 만듭니다.',
      analyzing: '문서를 분석하는 중...',
      entityNodes: '엔티티 노드',
      relationEdges: '관계 엣지',
      schemaTypes: '스키마 유형',
      completeDesc: '그래프 구축이 완료되었습니다. 다음 단계에서 시뮬레이션 환경을 구성하세요.',
      creating: '생성 중...',
      enterEnv: '환경 구성으로 이동 ➝',
      missingProject: '프로젝트 또는 그래프 정보가 없습니다',
      createFailed: '시뮬레이션 생성 실패',
      createError: '시뮬레이션 생성 중 오류'
    },
    step2: {
      initTitle: '시뮬레이션 인스턴스 초기화',
      agentTitle: '에이전트 페르소나 생성',
      configTitle: '이중 플랫폼 시뮬레이션 설정 생성',
      orchestrationTitle: '초기 활성화 시나리오 구성',
      readyTitle: '준비 완료',
      completed: '완료',
      initializing: '초기화',
      generating: '생성 중',
      orchestrating: '구성 중',
      waiting: '대기',
      inProgress: '진행 중',
      asyncDone: '비동기 작업 완료',
      initDesc: '새 simulation 인스턴스를 만들고 시뮬레이션 세계의 기본 파라미터 템플릿을 불러옵니다.',
      agentDesc: '지식 그래프에서 엔티티와 관계를 정리해 시뮬레이션 개체를 초기화하고, 현실 단서를 바탕으로 각자의 행동과 기억을 부여합니다.',
      configDesc: 'LLM이 시뮬레이션 요구와 현실 단서를 토대로 시간 흐름, 추천 알고리즘, 활동 시간대, 발언 빈도, 이벤트 트리거 등을 설정합니다.',
      orchestrationDesc: '서사 방향을 바탕으로 초기 활성화 이벤트와 핵심 화제를 생성해 시뮬레이션 초기 상태를 잡아줍니다.',
      readyDesc: '시뮬레이션 환경 준비가 완료되었습니다. 이제 실행할 수 있습니다.',
      currentAgents: '현재 에이전트 수',
      expectedAgents: '예상 전체 에이전트 수',
      topicCount: '현실 단서 연결 주제 수',
      generatedProfiles: '생성된 에이전트 페르소나',
      simulationHours: '시뮬레이션 시간',
      minutesPerRound: '라운드당 시간',
      totalRounds: '전체 라운드',
      activePerHour: '시간당 활성 수',
      peakHours: '피크 시간대',
      workHours: '업무 시간대',
      morningHours: '아침 시간대',
      offPeakHours: '비활성 시간대',
      agentConfig: '에이전트 설정',
      activeHours: '활성 시간대',
      postsPerHour: '게시/시간',
      commentsPerHour: '댓글/시간',
      responseDelay: '응답 지연',
      activityLevel: '활동성',
      sentimentBias: '감정 성향',
      influence: '영향력',
      recommenderConfig: '추천 알고리즘 설정',
      platformOne: '플랫폼 1: 광장 / 피드',
      platformTwo: '플랫폼 2: 토픽 / 커뮤니티',
      recencyWeight: '최신성 가중치',
      popularityWeight: '인기 가중치',
      relevanceWeight: '관련성 가중치',
      viralThreshold: '확산 임계치',
      echoStrength: '에코 챔버 강도',
      llmReasoning: 'LLM 설정 추론',
      narrativeDirection: '서사 유도 방향',
      initialHotTopics: '초기 핵심 화제',
      initialActivation: '초기 활성화 시퀀스',
      roundsSettings: '시뮬레이션 라운드 설정',
      roundsDescPrefix: 'MiroFish는 현실',
      roundsDescMiddle: '시간을 자동 계획하며, 각 라운드는 현실',
      roundsDescSuffix: '분을 의미합니다.',
      custom: '사용자 지정',
      recommended: '권장',
      estimatedFor100Prefix: '에이전트 100명 기준 예상 소요',
      estimatedFor100Suffix: '분',
      firstRunTip: '첫 실행이라면 “사용자 지정 모드”로 라운드 수를 줄여 빠르게 미리보기하고 오류 위험을 낮추는 것을 권장합니다. ➝',
      backToGraph: '← 그래프 구축으로 돌아가기',
      startParallel: '이중 세계 병렬 시뮬레이션 시작 ➝',
      age: '겉으로 드러난 나이',
      gender: '겉으로 드러난 성별',
      region: '국가/지역',
      mbti: '겉으로 드러난 MBTI',
      bio: '페르소나 소개',
      relatedTopics: '현실 단서 연결 주제',
      detailedPersona: '상세 페르소나 배경',
      fullExperience: '사건 전반 경험',
      fullExperienceDesc: '이 사건에서의 전체 행동 궤적',
      behaviorPattern: '행동 패턴 분석',
      behaviorPatternDesc: '경험에 기반한 행동 스타일 선호',
      uniqueMemory: '고유 기억 흔적',
      uniqueMemoryDesc: '현실 단서를 바탕으로 형성된 기억',
      socialNetwork: '사회 관계망',
      socialNetworkDesc: '개체 간 연결과 상호작용 그래프',
      male: '남성',
      female: '여성',
      other: '기타',
      yearsOld: '세',
      countSuffix: '개'
    },
    step3: {
      startReport: '결과 보고서 생성 시작',
      starting: '시작 중...',
      waitingActions: '에이전트 행동을 기다리는 중...',
      infoPlaza: '정보 광장',
      topicCommunity: '토픽 커뮤니티',
      round: '라운드',
      acts: '행동 수',
      totalEvents: '총 이벤트',
      elapsedTime: '경과 시간',
      availableActions: '가능한 행동',
      post: '게시',
      like: '좋아요',
      repost: '리포스트',
      comment: '댓글',
      quote: '인용',
      dislike: '비추천',
      search: '검색',
      trend: '트렌드',
      followAction: '팔로우',
      mute: '뮤트',
      refresh: '새로고침',
      idle: '대기',
      upvote: '추천',
      downvote: '비추천',
      upvotedPost: '게시글 추천',
      downvotedPost: '게시글 비추천',
      repostedFrom: '다음 사용자의 글을 리포스트',
      likedPost: '다음 사용자의 게시글을 좋아함',
      replyToPost: '게시글에 답글',
      searchQuery: '검색어',
      followed: '팔로우한 대상',
      actionSkipped: '행동 생략됨'
    },
    step4: {
      generatingSection: '{{title}} 생성 중...',
      reportTag: '예측 보고서',
      sectionsMetric: '섹션',
      elapsedMetric: '경과',
      toolsMetric: '도구',
      iteration: '반복',
      toolsUsed: '도구 사용',
      finalAnswer: '최종 응답',
      yes: '예',
      no: '아니오',
      sectionsPlanned: '{{count}}개 섹션 계획됨',
      sectionGenerated: '섹션 "{{title}}" 내용 생성 완료',
      enterInteraction: '심층 상호작용으로 이동',
      loadingReportAgent: 'Report Agent를 기다리는 중...',
      waitingActivity: '에이전트 활동을 기다리는 중...',
      simulation: '시뮬레이션',
      requirement: '요구사항',
      reportComplete: '보고서 생성 완료',
      showParams: '파라미터 보기',
      hideParams: '파라미터 숨기기',
      rawOutput: '원본 출력',
      structuredView: '구조화 보기',
      showResponse: '응답 보기',
      hideResponse: '응답 숨기기',
      statusWaiting: '시작 대기',
      collapse: '접기 ▲',
      deepInsight: '심층 인사이트',
      panoramaSearch: '파노라마 탐색',
      agentInterview: '에이전트 인터뷰',
      quickSearch: '빠른 검색',
      graphStats: '그래프 통계',
      entityQuery: '엔티티 조회',
      scenario: '예측 시나리오',
      facts: '사실',
      entities: '엔티티',
      currentFacts: '현재 핵심 기억',
      coreEntities: '핵심 엔티티',
      relations: '관계 체인',
      subQueries: '하위 질문',
      latestFacts: '시계열 메모리에서 연결된 최신 핵심 사실',
      currentActiveMemory: '현재 유효 기억',
      historicalMemory: '과거 기억',
      involvedEntities: '관련 엔티티',
      selectionReason: '선정 이유',
      worldOne: '세계 1',
      worldTwo: '세계 2',
      search: '검색',
      facts: '사실',
      relatedEdges: '관련 관계',
      relatedNodes: '관련 노드',
      searchResults: '검색 결과',
      interviewed: '인터뷰 완료',
      total: '전체',
      interviewer: '인터뷰어',
      showMore: '더 보기',
      showLess: '접기',
      keyQuotes: '핵심 인용문',
      interviewSummary: '인터뷰 요약',
      noResults: '관련 결과를 찾지 못했습니다',
      noCurrentFacts: '현재 핵심 기억이 없습니다',
      noCoreEntities: '핵심 엔티티가 없습니다',
      noRelations: '관계 체인이 없습니다',
      noActiveMemory: '현재 유효 기억이 없습니다',
      noHistoricalMemory: '과거 기억이 없습니다',
      noInvolvedEntities: '관련 엔티티가 없습니다'
    },
    step5: {
      generatingSection: '{{title}} 생성 중...',
      waitingForReportAgent: 'Report Agent를 기다리는 중...',
      interactiveTools: '상호작용 도구',
      agentsAvailable: '사용 가능한 에이전트 {{count}}명',
      chatWithReportAgent: 'Report Agent와 대화',
      chatWithAnyAgent: '세계 속 개체와 대화',
      selectTarget: '대화 대상 선택',
      sendSurvey: '세계에 설문 보내기',
      reportAgentChatName: 'Report Agent - 채팅',
      insightForgeName: 'InsightForge 심층 원인 분석',
      panoramaSearchName: 'PanoramaSearch 전방위 추적',
      quickSearchName: 'QuickSearch 즉시 검색',
      interviewSubAgentName: 'InterviewSubAgent 가상 인터뷰',
      reportAgentSubtitle: '보고서 생성 에이전트의 빠른 대화 버전으로, 4가지 전문 도구를 호출하고 MiroFish의 전체 기억을 활용할 수 있습니다.',
      insightForgeDesc: '현실 세계 단서와 시뮬레이션 상태를 정렬해 Global/Local Memory를 바탕으로 심층 원인 분석을 제공합니다.',
      panoramaSearchDesc: '그래프 구조 기반의 너비 우선 탐색으로 사건 전파 경로를 재구성하고 전체 정보 흐름의 위상을 추적합니다.',
      quickSearchDesc: 'GraphRAG 기반 즉시 조회 인터페이스로 특정 노드 속성과 개별 사실을 빠르게 확인합니다.',
      interviewSubAgentDesc: '자율 인터뷰 방식으로 시뮬레이션 개체와 병렬 대화를 수행해 비정형 의견과 심리 상태를 수집합니다.',
      bio: '소개',
      emptyChatReport: 'Report Agent와 대화해 보고서 내용을 더 깊이 살펴보세요.',
      emptyChatAgent: '시뮬레이션 개체와 대화해 그들의 관점을 파악하세요.',
      chatPlaceholder: '질문을 입력하세요...',
      you: '나',
      reportAgent: 'Report Agent',
      agent: '에이전트',
      sorryError: '죄송합니다. 오류가 발생했습니다: {{message}}',
      requestFailed: '요청 실패',
      chooseAgentFirst: '먼저 시뮬레이션 개체를 선택하세요',
      noResponseData: '응답 데이터가 없습니다',
      questioner: '질문자',
      selfSpeaker: '당신',
      previousConversation: '아래는 이전 대화입니다:',
      newQuestion: '이제 제 새 질문은 다음과 같습니다:',
      selectSurveyTargets: '설문 대상 선택',
      selectedCount: '선택됨 {{selected}} / {{total}}',
      surveyQuestion: '설문 문항',
      surveyPlaceholder: '선택한 모든 대상에게 물을 질문을 입력하세요...',
      sendSurveyButton: '설문 보내기',
      surveyResults: '설문 결과',
      surveyReplies: '{{count}}개의 응답'
    },
    graphPanel: {
      title: '그래프 관계 시각화',
      refreshing: '실시간 업데이트 중...',
      memoryUpdating: 'GraphRAG 장단기 메모리 실시간 업데이트 중',
      processingHint: '아직 일부 내용이 처리 중입니다. 잠시 후 수동으로 그래프를 새로고침하세요.',
      nodeDetails: '노드 상세',
      relationship: '관계',
      name: '이름',
      created: '생성 시각',
      properties: '속성',
      summary: '요약',
      labels: '라벨',
      episodes: '에피소드',
      fact: '사실',
      label: '라벨',
      type: '유형',
      validFrom: '유효 시작 시각',
      selfRelations: '자기 관계',
      loading: '그래프 데이터를 불러오는 중...',
      waiting: '온톨로지 생성을 기다리는 중...',
      entityTypes: '엔티티 유형',
      showEdgeLabels: '관계 라벨 표시'
    }
  },
  en: {
    app: {
      title: 'MiroFish - Simulate Anything',
      localeLabel: 'Language',
      korean: '한국어',
      english: 'English'
    },
    common: {
      view: { graph: 'Graph', split: 'Split', workbench: 'Workbench' },
      status: {
        ready: 'Ready',
        completed: 'Completed',
        processing: 'Processing',
        generating: 'Generating',
        running: 'Running',
        preparing: 'Preparing',
        initializing: 'Initializing',
        error: 'Error'
      },
      button: {
        refresh: 'Refresh',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        send: 'Send',
        start: 'Start',
        stop: 'Stop',
        selectAll: 'Select all',
        clear: 'Clear',
        show: 'Show',
        hide: 'Hide'
      },
      label: {
        systemDashboard: 'System Dashboard',
        simulationMonitor: 'Simulation Monitor',
        consoleOutput: 'Console Output',
        noProject: 'NO_PROJECT',
        noSimulation: 'NO_SIMULATION',
        noReport: 'NO_REPORT',
        unknownProfession: 'Unknown profession',
        noBio: 'No bio available',
        noResponse: 'No response',
        noQuestion: 'No question available',
        unnamedSimulation: 'Untitled simulation',
        unknownFile: 'Unknown file',
        noFile: 'No files',
        noLinkedFiles: 'No linked files'
      }
    },
    workflow: {
      graphBuild: { title: 'Graph Build' },
      envSetup: { title: 'Environment Setup' },
      simulationRun: { title: 'Start Simulation' },
      report: { title: 'Report Generation' },
      interaction: { title: 'Deep Interaction' }
    },
    home: {
      github: 'View GitHub Repository',
      tag: 'A concise general-purpose swarm intelligence engine',
      version: '/ v0.1-preview',
      titleLine1: 'Upload any document and',
      titleLine2: 'simulate the future instantly',
      description: 'Even a single paragraph is enough for MiroFish to build a parallel world with up to millions of agents from real-world signals hidden in the text. You can inject variables from a higher-level view and search for a local optimum inside complex collective interactions.',
      slogan: 'Preview the future through agents and let better decisions survive repeated trials',
      systemStatus: 'System Status',
      ready: 'Ready',
      readyDesc: 'The prediction engine is standing by. Upload multiple unstructured files to initialize a simulation.',
      lowCost: 'Low Cost',
      lowCostDesc: 'Typical simulation averages about $5 per run',
      scalability: 'High Scale',
      scalabilityDesc: 'Simulate up to millions of agents',
      workflow: 'Workflow',
      uploadSeed: '01 / Real-world seed',
      supportedFormats: 'Supported formats: PDF, MD, TXT',
      uploadTitle: 'Drag files here to upload',
      uploadHint: 'or click to browse files',
      inputParams: 'Input Parameters',
      promptLabel: '>_ 02 / Simulation Prompt',
      promptPlaceholder: '// Describe your simulation or prediction request in natural language. Example: How would sentiment change after posting a public notice?',
      engine: 'Engine: MiroFish-V1.0',
      startEngine: 'Start Engine',
      starting: 'Initializing...'
    },
    history: {
      title: 'Simulation History',
      graphBuild: 'Graph Build',
      envSetup: 'Environment Setup',
      report: 'Analysis Report',
      loading: 'Loading...',
      requirement: 'Simulation Requirement',
      linkedFiles: 'Linked Files',
      playback: 'Playback',
      playbackHint: 'Step 3 “Start Simulation” and Step 5 “Deep Interaction” can only be used while the simulation is running and are not available in playback mode.',
      roundsBeforeStart: 'Not started',
      roundsSuffix: 'rounds',
      filesSuffix: 'files'
    },
    step1: {
      ontology: 'Ontology Generation',
      graphBuild: 'GraphRAG Build',
      complete: 'Build Complete',
      completed: 'Completed',
      generating: 'Generating',
      waiting: 'Waiting',
      inProgress: 'In Progress',
      ontologyDesc: 'The LLM analyzes documents and simulation goals, extracts real-world seeds, and automatically creates a suitable ontology.',
      graphDesc: 'Using the generated ontology, documents are chunked and sent to Zep to build a knowledge graph with entities, relations, temporal memory, and community summaries.',
      analyzing: 'Analyzing documents...',
      entityNodes: 'Entity Nodes',
      relationEdges: 'Relation Edges',
      schemaTypes: 'Schema Types',
      completeDesc: 'Graph build is complete. Move on to environment setup.',
      creating: 'Creating...',
      enterEnv: 'Enter Environment Setup ➝',
      missingProject: 'Project or graph information is missing',
      createFailed: 'Failed to create simulation',
      createError: 'Simulation creation error'
    },
    step2: {
      initTitle: 'Simulation Instance Initialization',
      agentTitle: 'Generate Agent Personas',
      configTitle: 'Generate Dual-platform Config',
      orchestrationTitle: 'Initial Activation Orchestration',
      readyTitle: 'Ready',
      completed: 'Completed',
      initializing: 'Initializing',
      generating: 'Generating',
      orchestrating: 'Orchestrating',
      waiting: 'Waiting',
      inProgress: 'In Progress',
      asyncDone: 'Async task completed',
      initDesc: 'Create a new simulation instance and pull the template parameters for the simulated world.',
      agentDesc: 'Use the knowledge graph to initialize entities and relationships, then assign each individual distinct behavior and memory based on real-world seeds.',
      configDesc: 'The LLM configures time flow, recommendation weights, active hours, posting frequency, and event triggers from the input requirement and seed data.',
      orchestrationDesc: 'Generate initial activation events and hot topics to guide the opening state of the simulated world.',
      readyDesc: 'The simulation environment is ready. You can start the run now.',
      currentAgents: 'Current agents',
      expectedAgents: 'Expected agents',
      topicCount: 'Linked seed topics',
      generatedProfiles: 'Generated agent personas',
      simulationHours: 'Simulation duration',
      minutesPerRound: 'Minutes per round',
      totalRounds: 'Total rounds',
      activePerHour: 'Active per hour',
      peakHours: 'Peak hours',
      workHours: 'Work hours',
      morningHours: 'Morning hours',
      offPeakHours: 'Off-peak hours',
      agentConfig: 'Agent Config',
      activeHours: 'Active hours',
      postsPerHour: 'Posts / hr',
      commentsPerHour: 'Comments / hr',
      responseDelay: 'Response delay',
      activityLevel: 'Activity level',
      sentimentBias: 'Sentiment bias',
      influence: 'Influence',
      recommenderConfig: 'Recommendation Config',
      platformOne: 'Platform 1: Plaza / Feed',
      platformTwo: 'Platform 2: Topic / Community',
      recencyWeight: 'Recency weight',
      popularityWeight: 'Popularity weight',
      relevanceWeight: 'Relevance weight',
      viralThreshold: 'Viral threshold',
      echoStrength: 'Echo chamber strength',
      llmReasoning: 'LLM Configuration Reasoning',
      narrativeDirection: 'Narrative direction',
      initialHotTopics: 'Initial hot topics',
      initialActivation: 'Initial activation sequence',
      roundsSettings: 'Round Settings',
      roundsDescPrefix: 'MiroFish plans',
      roundsDescMiddle: 'hours of real-world time, and each round represents',
      roundsDescSuffix: 'minutes.',
      custom: 'Custom',
      recommended: 'Recommended',
      estimatedFor100Prefix: 'Estimated runtime for 100 agents:',
      estimatedFor100Suffix: 'min',
      firstRunTip: 'For your first run, switch to custom mode and reduce the round count to preview faster and lower the risk of runtime errors. ➝',
      backToGraph: '← Back to Graph Build',
      startParallel: 'Start Parallel Dual-world Simulation ➝',
      age: 'Visible age',
      gender: 'Visible gender',
      region: 'Country / Region',
      mbti: 'Visible MBTI',
      bio: 'Persona bio',
      relatedTopics: 'Seed-related topics',
      detailedPersona: 'Detailed persona background',
      fullExperience: 'Event journey',
      fullExperienceDesc: 'Full behavior trajectory within this event',
      behaviorPattern: 'Behavioral profile',
      behaviorPatternDesc: 'Experience-driven tendencies and action style',
      uniqueMemory: 'Distinct memory imprint',
      uniqueMemoryDesc: 'Memories formed from the real-world seed',
      socialNetwork: 'Social relationship network',
      socialNetworkDesc: 'Interaction and connection graph of the individual',
      male: 'Male',
      female: 'Female',
      other: 'Other',
      yearsOld: 'years old',
      countSuffix: 'items'
    },
    step3: {
      startReport: 'Generate Result Report',
      starting: 'Starting...',
      waitingActions: 'Waiting for agent actions...',
      infoPlaza: 'Info Plaza',
      topicCommunity: 'Topic Community',
      round: 'Round',
      acts: 'Acts',
      totalEvents: 'Total Events',
      elapsedTime: 'Elapsed Time',
      availableActions: 'Available Actions',
      post: 'Post',
      like: 'Like',
      repost: 'Repost',
      comment: 'Comment',
      quote: 'Quote',
      dislike: 'Dislike',
      search: 'Search',
      trend: 'Trend',
      followAction: 'Follow',
      mute: 'Mute',
      refresh: 'Refresh',
      idle: 'Idle',
      upvote: 'Upvote',
      downvote: 'Downvote',
      upvotedPost: 'Upvoted post',
      downvotedPost: 'Downvoted post',
      repostedFrom: 'Reposted from',
      likedPost: 'Liked post by',
      replyToPost: 'Reply to post',
      searchQuery: 'Search query',
      followed: 'Followed',
      actionSkipped: 'Action skipped'
    },
    step4: {
      generatingSection: 'Generating {{title}}...',
      reportTag: 'Prediction Report',
      sectionsMetric: 'Sections',
      elapsedMetric: 'Elapsed',
      toolsMetric: 'Tools',
      iteration: 'Iteration',
      toolsUsed: 'Tools',
      finalAnswer: 'Final',
      yes: 'Yes',
      no: 'No',
      sectionsPlanned: '{{count}} sections planned',
      sectionGenerated: 'Section "{{title}}" content generated',
      enterInteraction: 'Enter Deep Interaction',
      loadingReportAgent: 'Waiting for Report Agent...',
      waitingActivity: 'Waiting for agent activity...',
      simulation: 'Simulation',
      requirement: 'Requirement',
      reportComplete: 'Report Generation Complete',
      showParams: 'Show Params',
      hideParams: 'Hide Params',
      rawOutput: 'Raw Output',
      structuredView: 'Structured View',
      showResponse: 'Show Response',
      hideResponse: 'Hide Response',
      statusWaiting: 'Waiting to start',
      collapse: 'Collapse ▲',
      deepInsight: 'Deep Insight',
      panoramaSearch: 'Panorama Search',
      agentInterview: 'Agent Interview',
      quickSearch: 'Quick Search',
      graphStats: 'Graph Stats',
      entityQuery: 'Entity Query',
      scenario: 'Prediction Scenario',
      facts: 'Facts',
      entities: 'Entities',
      currentFacts: 'Current Key Memory',
      coreEntities: 'Core Entities',
      relations: 'Relationship Chains',
      subQueries: 'Sub-questions',
      latestFacts: 'Latest key facts linked from temporal memory',
      currentActiveMemory: 'Current active memory',
      historicalMemory: 'Historical memory',
      involvedEntities: 'Involved entities',
      selectionReason: 'Selection Reason',
      worldOne: 'World 1',
      worldTwo: 'World 2',
      search: 'Search',
      facts: 'Facts',
      relatedEdges: 'Related Edges',
      relatedNodes: 'Related Nodes',
      searchResults: 'Search Results',
      interviewed: 'Interviewed',
      total: 'Total',
      interviewer: 'Interviewer',
      showMore: 'Show More',
      showLess: 'Show Less',
      keyQuotes: 'Key Quotes',
      interviewSummary: 'Interview Summary',
      noResults: 'No related results found',
      noCurrentFacts: 'No current key memory',
      noCoreEntities: 'No core entities',
      noRelations: 'No relationship chains',
      noActiveMemory: 'No current active memory',
      noHistoricalMemory: 'No historical memory',
      noInvolvedEntities: 'No involved entities'
    },
    step5: {
      generatingSection: 'Generating {{title}}...',
      waitingForReportAgent: 'Waiting for Report Agent...',
      interactiveTools: 'Interactive Tools',
      agentsAvailable: '{{count}} agents available',
      chatWithReportAgent: 'Chat with Report Agent',
      chatWithAnyAgent: 'Chat with an individual in the world',
      selectTarget: 'Choose a target',
      sendSurvey: 'Send a survey to the world',
      reportAgentChatName: 'Report Agent - Chat',
      insightForgeName: 'InsightForge Deep Causality',
      panoramaSearchName: 'PanoramaSearch Wide Tracking',
      quickSearchName: 'QuickSearch Fast Lookup',
      interviewSubAgentName: 'InterviewSubAgent Virtual Interview',
      reportAgentSubtitle: 'A fast chat mode for the report-generation agent with access to four professional tools and full MiroFish memory.',
      insightForgeDesc: 'Align seed data from the real world with the simulation state and provide deep cross-temporal causal analysis using Global/Local Memory.',
      panoramaSearchDesc: 'Reconstruct propagation paths with graph traversal and capture the full topology of information flow.',
      quickSearchDesc: 'Use the GraphRAG query interface to quickly retrieve node attributes and discrete facts.',
      interviewSubAgentDesc: 'Run autonomous interviews with simulated individuals in parallel to collect unstructured opinions and mental states.',
      bio: 'Bio',
      emptyChatReport: 'Chat with Report Agent to explore the report in depth.',
      emptyChatAgent: 'Chat with a simulated individual to learn their perspective.',
      chatPlaceholder: 'Type your question...',
      you: 'You',
      reportAgent: 'Report Agent',
      agent: 'Agent',
      sorryError: 'Sorry, an error occurred: {{message}}',
      requestFailed: 'Request failed',
      chooseAgentFirst: 'Please select a simulated individual first',
      noResponseData: 'No response data',
      questioner: 'Questioner',
      selfSpeaker: 'You',
      previousConversation: 'Here is our previous conversation:',
      newQuestion: 'My new question is:',
      selectSurveyTargets: 'Select survey targets',
      selectedCount: 'Selected {{selected}} / {{total}}',
      surveyQuestion: 'Survey Question',
      surveyPlaceholder: 'Type the question you want to ask all selected targets...',
      sendSurveyButton: 'Send Survey',
      surveyResults: 'Survey Results',
      surveyReplies: '{{count}} replies'
    },
    graphPanel: {
      title: 'Graph Relationship Visualization',
      refreshing: 'Updating in real time...',
      memoryUpdating: 'GraphRAG short/long-term memory is updating in real time',
      processingHint: 'A small amount of content is still being processed. Refresh the graph again shortly.',
      nodeDetails: 'Node Details',
      relationship: 'Relationship',
      name: 'Name',
      created: 'Created',
      properties: 'Properties',
      summary: 'Summary',
      labels: 'Labels',
      episodes: 'Episodes',
      fact: 'Fact',
      label: 'Label',
      type: 'Type',
      validFrom: 'Valid From',
      selfRelations: 'Self Relations',
      loading: 'Loading graph data...',
      waiting: 'Waiting for ontology generation...',
      entityTypes: 'Entity Types',
      showEdgeLabels: 'Show Edge Labels'
    }
  }
}

const stepAliases = {
  '图谱构建': 'workflow.graphBuild.title',
  '그래프 구축': 'workflow.graphBuild.title',
  'Graph Build': 'workflow.graphBuild.title',
  '环境搭建': 'workflow.envSetup.title',
  '환경 구성': 'workflow.envSetup.title',
  'Environment Setup': 'workflow.envSetup.title',
  '开始模拟': 'workflow.simulationRun.title',
  '시뮬레이션 시작': 'workflow.simulationRun.title',
  'Start Simulation': 'workflow.simulationRun.title',
  '报告生成': 'workflow.report.title',
  '보고서 생성': 'workflow.report.title',
  'Report Generation': 'workflow.report.title',
  '深度互动': 'workflow.interaction.title',
  '심층 상호작용': 'workflow.interaction.title',
  'Deep Interaction': 'workflow.interaction.title'
}

function interpolate(template, params = {}) {
  if (typeof template !== 'string') return template
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => params[key] ?? '')
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
}

function stepNameForLocale(name, currentLocale) {
  const path = stepAliases[name?.trim()]
  return path ? getByPath(messages[currentLocale], path) : name
}

function prefixRule(prefix, koPrefix, enPrefix) {
  return {
    test: (text) => text.startsWith(prefix),
    transform: (text, currentLocale) => {
      const rest = text.slice(prefix.length)
      return (currentLocale === 'ko' ? koPrefix : enPrefix) + rest
    }
  }
}

const runtimeExact = {
  '未来预测报告': { ko: '미래 예측 보고서', en: 'Future Forecast Report' },
  '基于模拟预测的未来趋势与风险分析': { ko: '시뮬레이션 기반 미래 추세 및 리스크 분석', en: 'Future trend and risk analysis based on simulation forecasts' },
  '预测场景与核心发现': { ko: '예측 시나리오와 핵심 발견', en: 'Predicted Scenario & Key Findings' },
  '人群行为预测分析': { ko: '집단 행동 예측 분석', en: 'Behavioral Forecast by Group' },
  '趋势展望与风险提示': { ko: '추세 전망과 리스크 시사점', en: 'Trend Outlook & Risk Signals' },
  '报告生成任务开始': { ko: '보고서 생성 작업 시작', en: 'Report generation task started' },
  '开始规划报告大纲': { ko: '보고서 개요 계획 시작', en: 'Starting report outline planning' },
  '获取模拟上下文信息': { ko: '시뮬레이션 컨텍스트 정보 조회', en: 'Fetching simulation context' },
  '大纲规划完成': { ko: '개요 계획 완료', en: 'Outline planning complete' },
  '报告生成完成': { ko: '보고서 생성 완료', en: 'Report generation complete' },
  '正在分析文档...': { ko: '문서를 분석하는 중...', en: 'Analyzing documents...' },
  '错误：缺少 simulationId': { ko: '오류: simulationId가 없습니다', en: 'Error: missing simulationId' },
  'Project view initialized.': { ko: '프로젝트 화면을 초기화했습니다.', en: 'Project view initialized.' },
  'Error: No pending files found for new project.': { ko: '오류: 새 프로젝트에 사용할 대기 파일이 없습니다.', en: 'Error: No pending files found for new project.' },
  'Starting ontology generation: Uploading files...': { ko: '온톨로지 생성을 시작합니다: 파일 업로드 중...', en: 'Starting ontology generation: uploading files...' },
  '加载中...': { ko: '불러오는 중...', en: 'Loading...' },
  'SimulationView 初始化': { ko: 'SimulationView 초기화', en: 'SimulationView initialized' },
  'SimulationRunView 初始化': { ko: 'SimulationRunView 초기화', en: 'SimulationRunView initialized' },
  'ReportView 初始化': { ko: 'ReportView 초기화', en: 'ReportView initialized' },
  'InteractionView 初始化': { ko: 'InteractionView 초기화', en: 'InteractionView initialized' },
  'Step3 模拟运行初始化': { ko: 'Step3 시뮬레이션 실행 초기화', en: 'Step 3 simulation run initialized' },
  '正在启动双平台并行模拟...': { ko: '이중 플랫폼 병렬 시뮬레이션을 시작하는 중...', en: 'Starting parallel dual-platform simulation...' },
  '已开启动态图谱更新模式': { ko: '동적 그래프 업데이트 모드를 활성화했습니다.', en: 'Dynamic graph update mode enabled.' },
  '✓ 已清理旧的模拟日志，重新开始模拟': { ko: '✓ 이전 시뮬레이션 로그를 정리하고 새로 시작했습니다', en: '✓ Cleared old simulation logs and restarted the run' },
  '✓ 模拟引擎启动成功': { ko: '✓ 시뮬레이션 엔진이 성공적으로 시작되었습니다', en: '✓ Simulation engine started successfully' },
  '正在停止模拟...': { ko: '시뮬레이션을 중지하는 중...', en: 'Stopping simulation...' },
  '✓ 模拟已停止': { ko: '✓ 시뮬레이션이 중지되었습니다', en: '✓ Simulation stopped' },
  '✓ 检测到所有平台模拟已结束': { ko: '✓ 모든 플랫폼 시뮬레이션 종료를 감지했습니다', en: '✓ Detected that all platform simulations have finished' },
  '✓ 模拟已完成': { ko: '✓ 시뮬레이션이 완료되었습니다', en: '✓ Simulation completed' },
  '报告生成请求已发送，请稍候...': { ko: '보고서 생성 요청을 보냈습니다. 잠시만 기다려 주세요...', en: 'Report generation request sent. Please wait...' },
  '正在启动报告生成...': { ko: '보고서 생성을 시작하는 중...', en: 'Starting report generation...' },
  '准备返回 Step 2，正在关闭模拟...': { ko: 'Step 2로 돌아가기 전에 시뮬레이션을 종료하는 중...', en: 'Preparing to return to Step 2. Closing the simulation...' },
  '正在关闭模拟环境...': { ko: '시뮬레이션 환경을 종료하는 중...', en: 'Closing the simulation environment...' },
  '✓ 模拟环境已关闭': { ko: '✓ 시뮬레이션 환경이 종료되었습니다', en: '✓ Simulation environment closed' },
  '关闭模拟环境失败，尝试强制停止...': { ko: '시뮬레이션 환경 종료에 실패해 강제 중지를 시도합니다...', en: 'Failed to close the simulation environment. Trying force stop...' },
  '✓ 模拟已强制停止': { ko: '✓ 시뮬레이션이 강제로 중지되었습니다', en: '✓ Simulation force-stopped' },
  '正在停止模拟进程...': { ko: '시뮬레이션 프로세스를 중지하는 중...', en: 'Stopping simulation process...' },
  '进入 Step 4: 报告生成': { ko: 'Step 4 진입: 보고서 생성', en: 'Entering Step 4: Report Generation' },
  '图谱数据加载成功': { ko: '그래프 데이터를 불러왔습니다', en: 'Graph data loaded successfully' },
  '开启图谱实时刷新 (30s)': { ko: '그래프 실시간 새로고침 시작 (30초)', en: 'Started live graph refresh (30s)' },
  '停止图谱实时刷新': { ko: '그래프 실시간 새로고침 중지', en: 'Stopped live graph refresh' },
  '开始生成双平台模拟配置...': { ko: '이중 플랫폼 시뮬레이션 설정 생성 시작...', en: 'Starting dual-platform simulation configuration...' },
  '正在准备模拟环境...': { ko: '시뮬레이션 환경을 준비하는 중...', en: 'Preparing the simulation environment...' },
  '检测到已有完成的准备工作，直接使用': { ko: '이미 완료된 준비 결과를 감지해 그대로 사용합니다', en: 'Detected existing completed preparation and reused it' },
  '开始轮询准备进度...': { ko: '준비 진행률 폴링을 시작합니다...', en: 'Starting polling for preparation progress...' },
  '✓ 准备工作已完成': { ko: '✓ 준비 작업이 완료되었습니다', en: '✓ Preparation completed' },
  '开始生成Agent人设...': { ko: '에이전트 페르소나 생성 시작...', en: 'Starting agent persona generation...' },
  '正在生成Agent人设配置...': { ko: '에이전트 페르소나 설정을 생성하는 중...', en: 'Generating agent persona configuration...' },
  '正在调用LLM生成模拟配置参数...': { ko: 'LLM으로 시뮬레이션 설정 파라미터를 생성하는 중...', en: 'Generating simulation config parameters with the LLM...' },
  '✓ 模拟配置生成完成': { ko: '✓ 시뮬레이션 설정 생성 완료', en: '✓ Simulation configuration generated' },
  '✓ 环境搭建完成，可以开始模拟': { ko: '✓ 환경 구성이 완료되었습니다. 시뮬레이션을 시작할 수 있습니다', en: '✓ Environment setup complete. Ready to simulate' },
  '正在加载已有配置数据...': { ko: '기존 설정 데이터를 불러오는 중...', en: 'Loading existing configuration data...' },
  '✓ 模拟配置加载成功': { ko: '✓ 시뮬레이션 설정을 성공적으로 불러왔습니다', en: '✓ Simulation configuration loaded successfully' },
  '配置生成中，开始轮询等待...': { ko: '설정 생성 중입니다. 폴링을 시작해 기다립니다...', en: 'Configuration is still generating. Starting polling...' },
  '使用自动配置的模拟轮数': { ko: '자동 설정된 시뮬레이션 라운드 사용', en: 'Using auto-configured simulation rounds' },
  '检测到模拟环境正在运行，正在关闭...': { ko: '실행 중인 시뮬레이션 환경을 감지해 종료하는 중...', en: 'Detected a running simulation environment. Closing it...' },
  '检测到模拟状态为运行中，正在停止...': { ko: '시뮬레이션 상태가 실행 중이라 중지하는 중...', en: 'Detected a running simulation state. Stopping it...' },
  'Step5 深度互动初始化': { ko: 'Step5 심층 상호작용 초기화', en: 'Step 5 deep interaction initialized' },
  'Report Agent 已回复': { ko: 'Report Agent가 응답했습니다', en: 'Report Agent replied' },
  '请求失败': { ko: '요청에 실패했습니다', en: 'Request failed' },
  '请先选择一个模拟个体': { ko: '먼저 시뮬레이션 개체를 선택해 주세요', en: 'Please select a simulated individual first' },
  '无响应数据': { ko: '응답 데이터가 없습니다', en: 'No response data' },
  '报告数据加载完成': { ko: '리포트 데이터 로딩 완료', en: 'Report data loaded' }
}

const runtimeRules = [
  {
    regex: /^开始规划报告大纲\.\.\.$/,
    ko: () => '보고서 개요 계획 시작...',
    en: () => 'Starting report outline planning...'
  },
  {
    regex: /^大纲规划失败: (.+)$/,
    ko: ([, detail]) => `개요 계획 실패: ${detail}`,
    en: ([, detail]) => `Outline planning failed: ${detail}`
  },
  {
    regex: /^大纲已保存: (.+)$/,
    ko: ([, id]) => `개요가 저장되었습니다: ${id}`,
    en: ([, id]) => `Outline saved: ${id}`
  },
  {
    regex: /^大纲已保存到文件: (.+)$/,
    ko: ([, path]) => `개요가 파일로 저장되었습니다: ${path}`,
    en: ([, path]) => `Outline saved to file: ${path}`
  },
  {
    regex: /^ReACT生成章节: (.+)$/,
    ko: ([, title]) => `ReACT로 섹션 생성: ${rt(title)}`,
    en: ([, title]) => `Generating section with ReACT: ${rt(title)}`
  },
  {
    regex: /^报告生成失败: (.+)$/,
    ko: ([, detail]) => `보고서 생성 실패: ${detail}`,
    en: ([, detail]) => `Report generation failed: ${detail}`
  },
  {
    regex: /^报告已保存: (.+)$/,
    ko: ([, id]) => `보고서가 저장되었습니다: ${id}`,
    en: ([, id]) => `Report saved: ${id}`
  },
  {
    regex: /^获取模拟上下文: (.+)\.\.\.$/,
    ko: ([, text]) => `시뮬레이션 컨텍스트 조회: ${text}...`,
    en: ([, text]) => `Fetching simulation context: ${text}...`
  },
  {
    regex: /^图谱搜索: graph_id=(.+), query=(.+)\.\.\.$/,
    ko: ([, graphId, query]) => `그래프 검색: graph_id=${graphId}, query=${query}...`,
    en: ([, graphId, query]) => `Graph search: graph_id=${graphId}, query=${query}...`
  },
  {
    regex: /^Zep 图谱搜索\(graph=(.+)\) 第 (\d+) 次尝试失败: (.+), ([0-9.]+)秒后重试\.\.\.$/,
    ko: ([, graphId, attempt, detail, delay]) => `Zep 그래프 검색(graph=${graphId}) ${attempt}차 시도 실패: ${detail}, ${delay}초 후 재시도...`,
    en: ([, graphId, attempt, detail, delay]) => `Zep graph search(graph=${graphId}) attempt ${attempt} failed: ${detail}, retrying in ${delay}s...`
  },
  {
    regex: /^Zep 图谱搜索\(graph=(.+)\) 在 (\d+) 次尝试后仍失败: (.+)$/,
    ko: ([, graphId, tries, detail]) => `Zep 그래프 검색(graph=${graphId})이 ${tries}회 시도 후에도 실패했습니다: ${detail}`,
    en: ([, graphId, tries, detail]) => `Zep graph search(graph=${graphId}) still failed after ${tries} attempts: ${detail}`
  },
  {
    regex: /^Zep Search API失败，降级为本地搜索: (.+)$/,
    ko: ([, detail]) => `Zep Search API 실패, 로컬 검색으로 폴백합니다: ${detail}`,
    en: ([, detail]) => `Zep Search API failed; falling back to local search: ${detail}`
  },
  {
    regex: /^使用本地搜索: query=(.+)\.\.\.$/,
    ko: ([, query]) => `로컬 검색 사용: query=${query}...`,
    en: ([, query]) => `Using local search: query=${query}...`
  },
  {
    regex: /^获取图谱 (.+) 的所有边\.\.\.$/,
    ko: ([, graphId]) => `그래프 ${graphId}의 전체 엣지를 가져오는 중...`,
    en: ([, graphId]) => `Fetching all edges for graph ${graphId}...`
  },
  {
    regex: /^获取到 (\d+) 条边$/,
    ko: ([, count]) => `${count}개의 엣지를 가져왔습니다`,
    en: ([, count]) => `Fetched ${count} edges`
  },
  {
    regex: /^本地搜索完成: 找到 (\d+) 条相关事实$/,
    ko: ([, count]) => `로컬 검색 완료: 관련 사실 ${count}개를 찾았습니다`,
    en: ([, count]) => `Local search complete: found ${count} related facts`
  },
  {
    regex: /^获取图谱 (.+) 的统计信息\.\.\.$/,
    ko: ([, graphId]) => `그래프 ${graphId}의 통계 정보를 가져오는 중...`,
    en: ([, graphId]) => `Fetching statistics for graph ${graphId}...`
  },
  {
    regex: /^获取图谱 (.+) 的所有节点\.\.\.$/,
    ko: ([, graphId]) => `그래프 ${graphId}의 전체 노드를 가져오는 중...`,
    en: ([, graphId]) => `Fetching all nodes for graph ${graphId}...`
  },
  {
    regex: /^获取到 (\d+) 个节点$/,
    ko: ([, count]) => `${count}개의 노드를 가져왔습니다`,
    en: ([, count]) => `Fetched ${count} nodes`
  },
  {
    regex: /^大纲规划完成，共(\d+)个章节$/,
    ko: ([, count]) => `개요 계획 완료, 총 ${count}개 섹션`,
    en: ([, count]) => `Outline planning complete, ${count} sections`
  },
  {
    regex: /^进入 Step (\d+): (.+)$/,
    ko: ([, n, name]) => `Step ${n} 진입: ${stepNameForLocale(name, 'ko')}`,
    en: ([, n, name]) => `Entering Step ${n}: ${stepNameForLocale(name, 'en')}`
  },
  {
    regex: /^返回 Step (\d+): (.+)$/,
    ko: ([, n, name]) => `Step ${n} 복귀: ${stepNameForLocale(name, 'ko')}`,
    en: ([, n, name]) => `Returning to Step ${n}: ${stepNameForLocale(name, 'en')}`
  },
  {
    regex: /^自定义模拟轮数: (\d+) 轮$/,
    ko: ([, n]) => `사용자 지정 시뮬레이션 라운드: ${n} 라운드`,
    en: ([, n]) => `Custom simulation rounds: ${n} rounds`
  },
  {
    regex: /^开始模拟，自定义轮数: (\d+) 轮$/,
    ko: ([, n]) => `시뮬레이션 시작, 사용자 지정 라운드: ${n} 라운드`,
    en: ([, n]) => `Starting simulation with custom rounds: ${n} rounds`
  },
  {
    regex: /^开始模拟，使用自动配置轮数: (\d+) 轮$/,
    ko: ([, n]) => `시뮬레이션 시작, 자동 설정 라운드 사용: ${n} 라운드`,
    en: ([, n]) => `Starting simulation with auto-configured rounds: ${n} rounds`
  },
  prefixRule('加载模拟数据: ', '시뮬레이션 데이터 불러오는 중: ', 'Loading simulation data: '),
  prefixRule('加载报告数据: ', '리포트 데이터 불러오는 중: ', 'Loading report data: '),
  prefixRule('项目加载成功: ', '프로젝트 로드 성공: ', 'Project loaded: '),
  prefixRule('图谱加载失败: ', '그래프 로드 실패: ', 'Graph load failed: '),
  prefixRule('加载异常: ', '로드 예외: ', 'Load exception: '),
  prefixRule('加载模拟数据失败: ', '시뮬레이션 데이터 로드 실패: ', 'Failed to load simulation data: '),
  prefixRule('获取报告信息失败: ', '리포트 정보 조회 실패: ', 'Failed to get report information: '),
  prefixRule('加载配置失败: ', '설정 로드 실패: ', 'Failed to load configuration: '),
  prefixRule('设置最大模拟轮数: ', '최대 시뮬레이션 라운드 설정: ', 'Set maximum simulation rounds: '),
  prefixRule('  └─ 实体类型: ', '  └─ 엔티티 유형: ', '  └─ Entity types: '),
  prefixRule('  ├─ PID: ', '  ├─ PID: ', '  ├─ PID: '),
  prefixRule('✗ 启动失败: ', '✗ 시작 실패: ', '✗ Start failed: '),
  prefixRule('✗ 启动异常: ', '✗ 시작 예외: ', '✗ Start exception: '),
  prefixRule('✗ 启动报告生成失败: ', '✗ 보고서 생성 시작 실패: ', '✗ Failed to start report generation: '),
  prefixRule('✗ 启动报告生成异常: ', '✗ 보고서 생성 시작 예외: ', '✗ Report generation start exception: '),
  prefixRule('停止失败: ', '중지 실패: ', 'Stop failed: '),
  prefixRule('停止异常: ', '중지 예외: ', 'Stop exception: '),
  prefixRule('检查模拟状态失败: ', '시뮬레이션 상태 확인 실패: ', 'Failed to check simulation status: '),
  prefixRule('时间配置: 每轮 ', '시간 설정: 라운드당 ', 'Time config: each round '),
  prefixRule('获取时间配置失败，使用默认值: ', '시간 설정 조회 실패, 기본값 사용: ', 'Failed to get time config, using default: '),
  prefixRule('关闭模拟环境异常: ', '시뮬레이션 환경 종료 예외: ', 'Simulation environment close exception: '),
  prefixRule('关闭模拟环境失败: ', '시뮬레이션 환경 종료 실패: ', 'Failed to close simulation environment: '),
  prefixRule('强制停止失败: ', '강제 중지 실패: ', 'Force stop failed: '),
  prefixRule('强制停止模拟失败: ', '강제 중지 실패: ', 'Force stop simulation failed: '),
  prefixRule('强制停止模拟异常: ', '강제 중지 예외: ', 'Force stop simulation exception: '),
  prefixRule('模拟实例已创建: ', '시뮬레이션 인스턴스 생성됨: ', 'Simulation instance created: '),
  prefixRule('准备任务已启动', '준비 작업이 시작되었습니다', 'Preparation task started'),
  prefixRule('从Zep图谱读取到 ', 'Zep 그래프에서 읽은 엔티티 수: ', 'Entities read from Zep graph: '),
  prefixRule('  └─ 实体类型: ', '  └─ 엔티티 유형: ', '  └─ Entity types: '),
  prefixRule('准备失败: ', '준비 실패: ', 'Preparation failed: '),
  prefixRule('准备异常: ', '준비 예외: ', 'Preparation exception: '),
  prefixRule('✗ 准备失败: ', '✗ 준비 실패: ', '✗ Preparation failed: '),
  prefixRule('→ Agent人设 ', '→ 에이전트 페르소나 ', '→ Agent persona '),
  prefixRule('✓ 全部 ', '✓ 총 ', '✓ All '),
  prefixRule('  ├─ Agent数量: ', '  ├─ 에이전트 수: ', '  ├─ Agent count: '),
  prefixRule('  ├─ 模拟时长: ', '  ├─ 시뮬레이션 시간: ', '  ├─ Simulation duration: '),
  prefixRule('  ├─ 初始帖子: ', '  ├─ 초기 게시물: ', '  ├─ Initial posts: '),
  prefixRule('  ├─ 热点话题: ', '  ├─ 핵심 화제: ', '  ├─ Hot topics: '),
  prefixRule('  └─ 平台配置: ', '  └─ 플랫폼 설정: ', '  └─ Platform config: '),
  prefixRule('叙事方向: ', '서사 방향: ', 'Narrative direction: '),
  prefixRule('已加载 ', '불러온 페르소나 수: ', 'Loaded '),
  prefixRule('加载了 ', '불러온 시뮬레이션 개체 수: ', 'Loaded simulated individuals: '),
  prefixRule('选择对话对象: ', '대화 대상 선택: ', 'Selected chat target: '),
  prefixRule('发送失败: ', '전송 실패: ', 'Send failed: '),
  prefixRule('向 Report Agent 发送: ', 'Report Agent에게 전송: ', 'Sending to Report Agent: '),
  prefixRule('发送问卷给 ', '설문 전송 대상: ', 'Sending survey to '),
  prefixRule('收到 ', '수신된 응답: ', 'Received '),
  prefixRule('问卷发送失败: ', '설문 전송 실패: ', 'Survey failed: '),
  prefixRule('加载报告失败: ', '리포트 로드 실패: ', 'Failed to load report: '),
  prefixRule('加载报告日志失败: ', '리포트 로그 로드 실패: ', 'Failed to load report logs: '),
  prefixRule('加载模拟个体失败: ', '시뮬레이션 개체 로드 실패: ', 'Failed to load simulated individuals: '),
  prefixRule('Report Agent initialized: ', 'Report Agent 초기화: ', 'Report Agent initialized: ')
  ,
  {
    regex: /^向 (.+) 发送: (.+)\.\.\.$/,
    ko: ([, target, message]) => `${target}에게 전송: ${message}...`,
    en: ([, target, message]) => `Sending to ${target}: ${message}...`
  },
  {
    regex: /^(.+) 已回复$/,
    ko: ([, target]) => `${target} 응답 완료`,
    en: ([, target]) => `${target} replied`
  },
  {
    regex: /^✓ 报告生成任务已启动: (.+)$/,
    ko: ([, id]) => `✓ 보고서 생성 작업이 시작되었습니다: ${id}`,
    en: ([, id]) => `✓ Report generation task started: ${id}`
  }
]

function normalizeRuntimeResult(text, currentLocale) {
  let result = text
  result = result
    .replace(/(\d+) 轮/g, currentLocale === 'ko' ? '$1 라운드' : '$1 rounds')
    .replace(/(\d+) 个/g, currentLocale === 'ko' ? '$1개' : '$1 items')
    .replace(/(\d+) 条/g, currentLocale === 'ko' ? '$1개' : '$1 items')
    .replace(/(\d+) 小时/g, currentLocale === 'ko' ? '$1시간' : '$1 hours')
    .replace(/(\d+) 分钟/g, currentLocale === 'ko' ? '$1분' : '$1 minutes')
    .replace(/未知错误/g, currentLocale === 'ko' ? '알 수 없는 오류' : 'Unknown error')
    .replace(/未知职业/g, currentLocale === 'ko' ? '알 수 없는 직업' : 'Unknown profession')
    .replace(/暂无简介/g, currentLocale === 'ko' ? '소개 없음' : 'No bio available')
    .replace(/无响应/g, currentLocale === 'ko' ? '응답 없음' : 'No response')
    .replace(/提问者/g, currentLocale === 'ko' ? '질문자' : 'Questioner')
    .replace(/你/g, currentLocale === 'ko' ? '당신' : 'You')
  return result
}

export function setLocale(nextLocale) {
  locale.value = nextLocale
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, nextLocale)
  }
}

export function t(path, params = {}) {
  const template = getByPath(messages[locale.value], path) ?? getByPath(messages.en, path) ?? path
  return interpolate(template, params)
}

export function rt(text) {
  if (text === null || text === undefined) return text
  const raw = String(text)

  const consoleMatch = raw.match(/^(\[[^\]]+\]\s+(?:INFO|WARNING|ERROR):\s+)(.*)$/)
  if (consoleMatch) {
    const [, prefix, body] = consoleMatch
    const translatedBody = rt(body)
    return prefix + translatedBody
  }

  const exact = runtimeExact[raw]
  if (exact) return exact[locale.value]

  for (const rule of runtimeRules) {
    if ('regex' in rule) {
      const match = raw.match(rule.regex)
      if (match) {
        return normalizeRuntimeResult((locale.value === 'ko' ? rule.ko(match) : rule.en(match)), locale.value)
      }
    } else if (rule.test(raw)) {
      return normalizeRuntimeResult(rule.transform(raw, locale.value), locale.value)
    }
  }

  return normalizeRuntimeResult(raw, locale.value)
}

export function useLocale() {
  return { locale, setLocale, t, rt }
}
