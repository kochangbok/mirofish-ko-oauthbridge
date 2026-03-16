"""
Report AgentServe
Use LangChain+ ZepImplement simulation report generation in ReACT mode

Function:
1. Generate reports based on simulation requirements and Zep map information
2. Plan the directory structure first, and then generate it in segments
3. Each paragraph adopts ReACT multiple rounds of thinking and reflection mode
4. Support dialogue with users and autonomously call search tools during the dialogue
"""

import os
import json
import time
import re
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from ..config import Config
from ..utils.llm_client import LLMClient
from ..utils.logger import get_logger
from .zep_tools import (
    ZepToolsService,
    SearchResult,
    InsightForgeResult,
    PanoramaResult,
    InterviewResult
)

logger = get_logger('mirofish.report_agent')


class ReportLogger:
    """
    Report Agent Verbose logger

    Generate agent in report folder_log.jsonl File, record every detailed action.
    Each row is a complete JSON object, including timestamp, action type, details, etc.
    """

    def __init__(self, report_id: str):
        """
        Initialize the logger

        Args:
            report_id: Report ID, used to determine the log file path
        """
        self.report_id = report_id
        self.log_file_path = os.path.join(
            Config.UPLOAD_FOLDER, 'reports', report_id, 'agent_log.jsonl'
        )
        self.start_time = datetime.now()
        self._ensure_log_file()

    def _ensure_log_file(self):
        """Make sure the directory where the log file is located exists"""
        log_dir = os.path.dirname(self.log_file_path)
        os.makedirs(log_dir, exist_ok=True)

    def _get_elapsed_time(self) -> float:
        """Get the elapsed time from start to now (seconds)"""
        return (datetime.now() - self.start_time).total_seconds()

    def log(
        self,
        action: str,
        stage: str,
        details: Dict[str, Any],
        section_title: str = None,
        section_index: int = None
    ):
        """
        record a log

        Args:
            action: Action type, such as'start', 'tool_call', 'llm_response', 'section_complete' wait
            stage: current stage, such as'planning', 'generating', 'completed'
            details: Detailed content dictionary, no truncation
            section_title: Current chapter title (optional)
            section_index: Current chapter index (optional)
        """
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "elapsed_seconds": round(self._get_elapsed_time(), 2),
            "report_id": self.report_id,
            "action": action,
            "stage": stage,
            "section_title": section_title,
            "section_index": section_index,
            "details": details
        }

        # Append writing to JSONL file
        with open(self.log_file_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + '\n')

    def log_start(self, simulation_id: str, graph_id: str, simulation_requirement: str):
        """Logging report generation starts"""
        self.log(
            action="report_start",
            stage="pending",
            details={
                "simulation_id": simulation_id,
                "graph_id": graph_id,
                "simulation_requirement": simulation_requirement,
                "message": "Report generation task starts"
            }
        )

    def log_planning_start(self):
        """Record Outline Planning Begins"""
        self.log(
            action="planning_start",
            stage="planning",
            details={"message": "Start planning your report outline"}
        )

    def log_planning_context(self, context: Dict[str, Any]):
        """Record contextual information obtained during planning"""
        self.log(
            action="planning_context",
            stage="planning",
            details={
                "message": "Get simulation context information",
                "context": context
            }
        )

    def log_planning_complete(self, outline_dict: Dict[str, Any]):
        """Record outline planning completed"""
        self.log(
            action="planning_complete",
            stage="planning",
            details={
                "message": "Outline planning completed",
                "outline": outline_dict
            }
        )

    def log_section_start(self, section_title: str, section_index: int):
        """Record chapter generation starts"""
        self.log(
            action="section_start",
            stage="generating",
            section_title=section_title,
            section_index=section_index,
            details={"message": f"Start generating chapters: {section_title}"}
        )

    def log_react_thought(self, section_title: str, section_index: int, iteration: int, thought: str):
        """Document your ReACT thought process"""
        self.log(
            action="react_thought",
            stage="generating",
            section_title=section_title,
            section_index=section_index,
            details={
                "iteration": iteration,
                "thought": thought,
                "message": f"ReACT No.{iteration}round of thinking"
            }
        )

    def log_tool_call(
        self,
        section_title: str,
        section_index: int,
        tool_name: str,
        parameters: Dict[str, Any],
        iteration: int
    ):
        """Logging tool calls"""
        self.log(
            action="tool_call",
            stage="generating",
            section_title=section_title,
            section_index=section_index,
            details={
                "iteration": iteration,
                "tool_name": tool_name,
                "parameters": parameters,
                "message": f"Call tool: {tool_name}"
            }
        )

    def log_tool_result(
        self,
        section_title: str,
        section_index: int,
        tool_name: str,
        result: str,
        iteration: int
    ):
        """Record tool call results (complete content, not truncated)"""
        self.log(
            action="tool_result",
            stage="generating",
            section_title=section_title,
            section_index=section_index,
            details={
                "iteration": iteration,
                "tool_name": tool_name,
                "result": result,  # Complete result, no truncation
                "result_length": len(result),
                "message": f"tool{tool_name} Return results"
            }
        )

    def log_llm_response(
        self,
        section_title: str,
        section_index: int,
        response: str,
        iteration: int,
        has_tool_calls: bool,
        has_final_answer: bool
    ):
        """Logging LLM response (full content, not truncated)"""
        self.log(
            action="llm_response",
            stage="generating",
            section_title=section_title,
            section_index=section_index,
            details={
                "iteration": iteration,
                "response": response,  # Complete response, no truncation
                "response_length": len(response),
                "has_tool_calls": has_tool_calls,
                "has_final_answer": has_final_answer,
                "message": f"LLM response (tool call: {has_tool_calls}, final answer: {has_final_answer})"
            }
        )

    def log_section_content(
        self,
        section_title: str,
        section_index: int,
        content: str,
        tool_calls_count: int
    ):
        """Record chapter content generation is completed (only record content, does not mean the entire chapter is completed)"""
        self.log(
            action="section_content",
            stage="generating",
            section_title=section_title,
            section_index=section_index,
            details={
                "content": content,  # Complete content, no truncation
                "content_length": len(content),
                "tool_calls_count": tool_calls_count,
                "message": f"chapter{section_title} Content generation completed"
            }
        )

    def log_section_full_complete(
        self,
        section_title: str,
        section_index: int,
        full_content: str
    ):
        """
        Record chapter generation completed

        The front end should listen to this log to determine whether a chapter is actually completed and obtain the complete content
        """
        self.log(
            action="section_complete",
            stage="generating",
            section_title=section_title,
            section_index=section_index,
            details={
                "content": full_content,
                "content_length": len(full_content),
                "message": f"chapter{section_title} Generation completed"
            }
        )

    def log_report_complete(self, total_sections: int, total_time_seconds: float):
        """Record report generation completed"""
        self.log(
            action="report_complete",
            stage="completed",
            details={
                "total_sections": total_sections,
                "total_time_seconds": round(total_time_seconds, 2),
                "message": "Report generation completed"
            }
        )

    def log_error(self, error_message: str, stage: str, section_title: str = None):
        """Log errors"""
        self.log(
            action="error",
            stage=stage,
            section_title=section_title,
            section_index=None,
            details={
                "error": error_message,
                "message": f"An error occurred: {error_message}"
            }
        )


class ReportConsoleLogger:
    """
    Report Agent console logger

    Write console style logs (INFO, WARNING, etc.) to the console in the reports folder_log.txt document.
    These logs are related to the agent_log.jsonl Different, it is console output in plain text format.
    """

    def __init__(self, report_id: str):
        """
        Initialize the console logger

        Args:
            report_id: Report ID, used to determine the log file path
        """
        self.report_id = report_id
        self.log_file_path = os.path.join(
            Config.UPLOAD_FOLDER, 'reports', report_id, 'console_log.txt'
        )
        self._ensure_log_file()
        self._file_handler = None
        self._setup_file_handler()

    def _ensure_log_file(self):
        """Make sure the directory where the log file is located exists"""
        log_dir = os.path.dirname(self.log_file_path)
        os.makedirs(log_dir, exist_ok=True)

    def _setup_file_handler(self):
        """Set up the file processor to write logs to files at the same time"""
        import logging

        # Create file handler
        self._file_handler = logging.FileHandler(
            self.log_file_path,
            mode='a',
            encoding='utf-8'
        )
        self._file_handler.setLevel(logging.INFO)

        # Use the same concise format as the console
        formatter = logging.Formatter(
            '[%(asctime)s] %(levelname)s: %(message)s',
            datefmt='%H:%M:%S'
        )
        self._file_handler.setFormatter(formatter)

        # add to report_agent Related loggers
        loggers_to_attach = [
            'mirofish.report_agent',
            'mirofish.zep_tools',
        ]

        for logger_name in loggers_to_attach:
            target_logger = logging.getLogger(logger_name)
            # Avoid duplicate additions
            if self._file_handler not in target_logger.handlers:
                target_logger.addHandler(self._file_handler)

    def close(self):
        """Close the file handler and remove it from the logger"""
        import logging

        if self._file_handler:
            loggers_to_detach = [
                'mirofish.report_agent',
                'mirofish.zep_tools',
            ]

            for logger_name in loggers_to_detach:
                target_logger = logging.getLogger(logger_name)
                if self._file_handler in target_logger.handlers:
                    target_logger.removeHandler(self._file_handler)

            self._file_handler.close()
            self._file_handler = None

    def __del__(self):
        """Make sure to close the file handler on destruction"""
        self.close()


class ReportStatus(str, Enum):
    """Report status"""
    PENDING = "pending"
    PLANNING = "planning"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ReportSection:
    """Report Chapter"""
    title: str
    content: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "content": self.content
        }

    def to_markdown(self, level: int = 2) -> str:
        """Convert to Markdown format"""
        md = f"{'#' * level} {self.title}\n\n"
        if self.content:
            md += f"{self.content}\n\n"
        return md


@dataclass
class ReportOutline:
    """Report outline"""
    title: str
    summary: str
    sections: List[ReportSection]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "summary": self.summary,
            "sections": [s.to_dict() for s in self.sections]
        }

    def to_markdown(self) -> str:
        """Convert to Markdown format"""
        md = f"# {self.title}\n\n"
        md += f"> {self.summary}\n\n"
        for section in self.sections:
            md += section.to_markdown()
        return md


@dataclass
class Report:
    """full report"""
    report_id: str
    simulation_id: str
    graph_id: str
    simulation_requirement: str
    status: ReportStatus
    outline: Optional[ReportOutline] = None
    markdown_content: str = ""
    created_at: str = ""
    completed_at: str = ""
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "report_id": self.report_id,
            "simulation_id": self.simulation_id,
            "graph_id": self.graph_id,
            "simulation_requirement": self.simulation_requirement,
            "status": self.status.value,
            "outline": self.outline.to_dict() if self.outline else None,
            "markdown_content": self.markdown_content,
            "created_at": self.created_at,
            "completed_at": self.completed_at,
            "error": self.error
        }


# ═══════════════════════════════════════════════════════════════
# Prompt Template constants
# ═══════════════════════════════════════════════════════════════

# ── Tool description──

TOOL_DESC_INSIGHT_FORGE = """\
【심층 인사이트 검색 - 핵심 근거를 깊게 찾는 도구】
이 도구는 하나의 질문을 여러 하위 질문으로 분해해 시뮬레이션 그래프 안의 사실, 관계, 맥락을 폭넓게 모아줍니다.

【주요 역할】
1. 질문을 하위 쿼리로 분해
2. 여러 관점에서 관련 사실과 관계 검색
3. 핵심 근거를 하나의 인사이트 묶음으로 정리
4. 보고서 본문에 바로 활용할 수 있는 재료 제공

【이럴 때 사용】
- 특정 쟁점을 깊이 파고들고 싶을 때
- 하나의 현상을 여러 각도에서 해석해야 할 때
- 보고서 섹션을 뒷받침할 근거를 충분히 모아야 할 때

【반환 내용】
- 직접 인용 가능한 사실 원문
- 핵심 엔티티 인사이트
- 관계망/전개 구조 분석"""

TOOL_DESC_PANORAMA_SEARCH = """\
【파노라마 검색 - 전체 흐름과 판세를 보는 도구】
이 도구는 사건 전개의 큰 그림, 시간축 변화, 주요 엔티티의 연결 구조를 빠르게 파악할 때 사용합니다.

【주요 역할】
1. 관련 노드와 관계를 폭넓게 수집
2. 현재 유효한 사실과 과거/만료된 사실을 구분
3. 사건이 어떤 순서와 구조로 전개됐는지 파악

【이럴 때 사용】
- 사건의 전체 전개를 한 번에 보고 싶을 때
- 시점별 변화와 흐름을 비교하고 싶을 때
- 전체 판세를 먼저 이해한 뒤 세부 분석으로 들어가고 싶을 때

【반환 내용】
- 현재 유효한 사실
- 과거/만료된 사실
- 관련 엔티티 전체 맥락"""

TOOL_DESC_QUICK_SEARCH = """\
【빠른 검색 - 특정 사실을 즉시 확인하는 도구】
가볍고 직접적인 검색 도구입니다. 특정 키워드, 주장, 인물, 문장에 대한 사실 확인에 적합합니다.

【이럴 때 사용】
- 특정 사실 하나를 빠르게 확인할 때
- 이미 세운 가설을 짧게 검증할 때
- 본문에 넣기 전 표현/사실을 점검할 때

【반환 내용】
- 질의와 가장 가까운 사실 목록"""

TOOL_DESC_INTERVIEW_AGENTS = """\
【에이전트 인터뷰 - 시뮬레이션 속 인물의 직접 반응을 수집하는 도구】
OASIS 시뮬레이션 환경의 인터뷰 API를 호출해, 실제 시뮬레이션 에이전트의 답변을 받아옵니다.
기본적으로 Twitter와 Reddit 두 플랫폼을 함께 확인해 역할별 관점을 비교합니다.

【주요 역할】
1. 에이전트 프로필을 읽고 관련 인물을 고르기
2. 인터뷰 주제에 맞는 질문 구성
3. 실제 인터뷰 API 호출
4. 역할별 응답을 비교/요약

【이럴 때 사용】
- 학생/언론/공식 계정/이해관계자 시각을 나눠 보고 싶을 때
- 보고서에 생생한 1인칭 발화와 직접 인용을 넣고 싶을 때
- 다중 집단의 입장 차이를 비교하고 싶을 때

【반환 내용】
- 인터뷰 대상 에이전트 정보
- 플랫폼별 인터뷰 응답
- 직접 인용 가능한 핵심 문장
- 관점 비교 요약

【중요】이 기능은 OASIS 시뮬레이션 환경이 실행 중일 때만 사용할 수 있습니다."""

# ── Outline planning prompt──

PLAN_SYSTEM_PROMPT = """\
너는 MiroFish의 「미래 시뮬레이션 예측 보고서」를 설계하는 전문 작성자다.
너는 시뮬레이션 세계를 위에서 내려다보는 관찰자이며, 각 Agent의 반응·행동·상호작용을 미래의 징후로 읽어야 한다.

【핵심 관점】
- 시뮬레이션은 현실의 재연이 아니라, 조건을 주입한 뒤 가능한 미래를 미리 관찰하는 실험이다.
- 우리는 특정한 「시뮬레이션 요구사항」을 넣고, 그 결과로 어떤 미래가 전개되는지 보고자 한다.
- 따라서 보고서는 현황 설명이 아니라 “이 조건이면 앞으로 어떻게 흘러갈까?”에 답해야 한다.

【너의 임무】
다음 세 질문에 답하는 예측 보고서의 아웃라인을 설계하라.
1. 이 조건 아래에서 미래에 어떤 일이 벌어지는가?
2. 각 집단(Agent)은 어떻게 반응하고 움직이는가?
3. 이 시뮬레이션이 드러내는 핵심 추세·위험·기회는 무엇인가?

【보고서 원칙】
- ✅ 시뮬레이션 결과를 바탕으로 한 미래 예측 보고서여야 한다.
- ✅ 사건 전개, 집단 반응, 구조 변화, 리스크를 중심으로 설계한다.
- ✅ Agent의 말과 행동은 미래 인간 집단 반응의 신호로 해석한다.
- ✅ 문체는 분석적이고 절제된 한국어로 유지한다.
- ❌ 현실 세계 현재 상황 요약문처럼 쓰지 않는다.
- ❌ 일반론적인 여론 총평으로 흐르지 않는다.
- ❌ 추상적인 유행어, 슬로건, 과장된 표현을 남발하지 않는다.

【섹션 설계 규칙】
- 섹션은 최소 2개, 최대 5개
- 가능하면 3~4개 섹션 안에서 명확하게 끝내는 구성을 우선한다.
- 각 섹션은 하나의 핵심 예측 덩어리를 담당
- 불필요한 세부 분할 없이 간결하고 선명하게 구성
- 섹션 제목은 짧고 구체적으로 쓰고, 추상 명사만 반복하지 않는다.
- 섹션 제목만 봐도 보고서 흐름이 이해되도록 설계

아래 JSON 형식으로만 출력하라.
{
    "title": "보고서 제목",
    "summary": "핵심 예측을 한 문장으로 요약",
    "sections": [
        {
            "title": "섹션 제목",
            "description": "이 섹션이 다룰 핵심 내용"
        }
    ]
}

주의: sections 배열 길이는 반드시 2~5 사이여야 한다."""

PLAN_USER_PROMPT_TEMPLATE = """\
【예측 시나리오】
시뮬레이션 세계에 주입한 조건(시뮬레이션 요구사항): {simulation_requirement}

【시뮬레이션 세계 규모】
- 참여 엔티티 수: {total_nodes}
- 생성된 관계 수: {total_edges}
- 엔티티 유형 분포: {entity_types}
- 활성 Agent 수: {total_entities}

【미리 관찰된 미래 사실 샘플】
{related_facts_json}

이 정보를 바탕으로 미래 전개를 상위 시점에서 읽어라.
1. 이 조건 아래 미래는 어떤 상태로 전개되는가?
2. 어떤 집단이 어떤 방식으로 반응하고 움직이는가?
3. 사용자가 꼭 봐야 할 핵심 추세와 위험은 무엇인가?

위 질문에 가장 잘 답할 수 있도록, 한국어 중심의 명확한 보고서 섹션 구조를 설계하라.

추가 원칙:
- 가능하면 시간축 → 집단 반응 → 구조 변화/리스크 순으로 읽히게 설계하라.
- 제목은 짧고 분명하게 쓴다.
- 비슷한 섹션을 나눠 중복하지 않는다.

【다시 강조】섹션 수는 최소 2개, 최대 5개이며, 길게 늘이지 말고 핵심 발견 위주로 설계하라."""

# ── Chapter generation prompt──

SECTION_SYSTEM_PROMPT_TEMPLATE = """\
너는 MiroFish의 「미래 시뮬레이션 예측 보고서」를 쓰는 전문 작성자다.
지금은 전체 보고서 중 한 개 섹션만 작성한다.

보고서 제목: {report_title}
보고서 요약: {report_summary}
예측 조건(시뮬레이션 요구사항): {simulation_requirement}
현재 작성할 섹션: {section_title}

═══════════════════════════════════════════════════════════════
【핵심 관점】
═══════════════════════════════════════════════════════════════
- 시뮬레이션 세계는 미래를 미리 펼쳐본 결과다.
- Agent의 발화와 행동은 미래 집단 반응의 근거다.
- 너는 “무슨 일이 일어났는가”보다 “이 조건에서 앞으로 어떻게 전개되는가”를 써야 한다.

너의 목표는 다음 세 가지다.
- 이 조건에서 미래에 어떤 변화가 일어나는지 설명한다.
- 어떤 집단이 왜 그렇게 반응하는지 보여준다.
- 앞으로 중요해질 위험·기회·전환점을 드러낸다.

❌ 현실 현황 브리핑처럼 쓰지 마라.
✅ 미래 전개를 읽는 예측 섹션으로 작성하라.

═══════════════════════════════════════════════════════════════
【절대 규칙】
═══════════════════════════════════════════════════════════════
1. 반드시 도구를 사용해 시뮬레이션 세계를 관찰하라.
   - 모든 내용은 시뮬레이션에서 확인된 사실과 Agent 반응에 근거해야 한다.
   - 자신의 상식이나 외부 일반론으로 본문을 채우지 마라.
   - 각 섹션마다 최소 3회, 최대 5회 도구를 호출하라.

2. 반드시 원문 근거를 인용하라.
   - Agent의 발화와 행동은 미래 반응의 증거다.
   - 적절한 인용 블록(>)으로 핵심 문장을 보여줘라.

3. 언어는 한국어 중심으로 정리하라.
   - 도구 결과에 영어/혼합 언어가 섞여 있을 수 있다.
   - 한국어 사용자용 보고서이므로, 본문과 인용 설명은 자연스러운 한국어로 정리하라.
   - 인용 원문을 그대로 둘 필요가 있을 때도, 앞뒤 설명은 반드시 자연스러운 한국어로 연결하라.
   - 영어 용어가 꼭 필요하면 한국어 설명을 먼저 쓰고, 괄호로 보조 표기한다.

4. 문체를 절제하라.
   - 과도한 수사, 감탄, 슬로건식 표현을 피하라.
   - 한 문단에는 하나의 핵심 주장만 담아라.
   - 가능하면 근거 → 해석 → 전망 순서로 전개하라.

5. 존재하지 않는 사실을 만들지 마라.
   - 시뮬레이션 결과에 없는 정보는 쓰지 않는다.
   - 정보가 부족하면 부족하다고 명시한다.

═══════════════════════════════════════════════════════════════
【형식 규칙】
═══════════════════════════════════════════════════════════════
【한 섹션 = 최소 작성 단위】
- 섹션 안에서는 Markdown 제목(#, ##, ### 등)을 쓰지 마라.
- 섹션 제목은 시스템이 붙이므로, 본문 첫 줄에 제목을 다시 쓰지 마라.
- **굵은 글씨**, 문단 분리, 인용, 리스트로만 구조를 만든다.

【좋은 예시】
```
이 섹션에서는 발표 직후의 반응 구조를 본다.

**초기 확산 구간**

공식 발표 직후, 핵심 논점은 빠르게 재구성된다.

> "발표 이후 12시간 안에 관련 논의가 주요 플랫폼에서 급증했다."

- 첫 확산의 중심 집단
- 논점이 이동한 이유
```

【나쁜 예시】
```
## 실행 요약
### 1단계
#### 세부 분석
```

═══════════════════════════════════════════════════════════════
【사용 가능한 도구】(섹션당 3~5회)
═══════════════════════════════════════════════════════════════
{tools_description}

【도구 사용 팁】
- insight_forge: 하나의 쟁점을 깊이 파고들 때
- panorama_search: 전체 흐름과 시간축을 볼 때
- quick_search: 특정 사실을 빠르게 확인할 때
- interview_agents: 역할별 직접 반응을 비교할 때

═══════════════════════════════════════════════════════════════
【응답 방식】
═══════════════════════════════════════════════════════════════
한 번의 응답에서는 아래 둘 중 하나만 하라.

옵션 A - 도구 호출:
생각을 짧게 정리한 뒤 아래 형식으로 도구 하나를 호출한다.
<tool_call>
{{"name": "도구이름", "parameters": {{"파라미터명": "값"}}}}
</tool_call>

옵션 B - 최종 본문 작성:
충분한 근거를 모았다면, 반드시 "Final Answer:" 로 시작해 본문만 출력한다.

⚠️ 금지 사항
- 도구 호출과 Final Answer를 한 응답에 함께 넣지 마라.
- Observation을 스스로 지어내지 마라. 도구 결과는 시스템이 주입한다.
- 한 응답에서 도구는 최대 1개만 호출하라.

═══════════════════════════════════════════════════════════════
【섹션 본문 요구사항】
═══════════════════════════════════════════════════════════════
1. 본문은 반드시 도구로 확인한 시뮬레이션 데이터에 근거해야 한다.
2. 핵심 장면은 원문 인용으로 보여줘라.
3. Markdown은 사용하되, 제목 문법은 금지한다.
   - **굵은 글씨**로 소주제를 표시
   - 리스트(-, 1. 2. 3.)로 포인트 정리
   - 문단 사이를 충분히 띄울 것
4. 인용은 반드시 단독 문단으로 배치하라.
5. 다른 섹션과 자연스럽게 이어져야 한다.
6. 이미 작성된 섹션과 같은 정보를 반복하지 마라.
7. 문장은 짧고 단정하게 쓰고, 쓸데없는 미사여구를 줄여라.
8. 다시 강조: 어떤 제목도 추가하지 마라. 소구조는 **굵은 글씨**로만 표현하라."""

SECTION_USER_PROMPT_TEMPLATE = """\
이미 작성된 섹션 내용(반복 방지를 위해 반드시 읽을 것):
{previous_content}

═══════════════════════════════════════════════════════════════
【현재 작업】섹션 작성: {section_title}
═══════════════════════════════════════════════════════════════

【중요 체크】
1. 위 섹션들과 같은 내용을 반복하지 마라.
2. 시작 전에 반드시 도구로 근거를 수집하라.
3. 서로 다른 도구를 섞어 쓰는 편이 좋다.
4. 보고서 내용은 반드시 검색/관찰 결과에 근거해야 한다.

【형식 경고】
- ❌ 제목 문법(#, ##, ###, ####) 사용 금지
- ❌ 섹션 제목인 "{section_title}"를 본문 첫 줄에 다시 쓰지 말 것
- ✅ 제목은 시스템이 붙인다.
- ✅ 본문만 작성하고, 구조는 **굵은 글씨**로 만든다.
- ✅ 문장은 간결하게 유지하고, 한 문단에는 하나의 포인트만 담는다.

이제 시작하라.
1. 먼저 어떤 정보가 필요한지 짧게 생각한다.
2. 그 다음 도구를 호출한다.
3. 근거가 충분해지면 "Final Answer:" 로 시작하는 본문을 출력한다."""

# ── ReACT In-loop message template──

REACT_OBSERVATION_TEMPLATE = """\
Observation(도구 결과):

═══ {tool_name} 결과 ═══
{result}

═══════════════════════════════════════════════════════════════
지금까지 도구 호출 {tool_calls_count}/{max_tool_calls}회 (사용 도구: {used_tools_str}){unused_hint}
- 정보가 충분하면: 반드시 "Final Answer:" 로 시작해 섹션 본문을 작성한다.
- 정보가 부족하면: 도구 1개를 더 호출해 근거를 보강한다.
═══════════════════════════════════════════════════════════════"""

REACT_INSUFFICIENT_TOOLS_MSG = (
    "【주의】도구를 {tool_calls_count}회만 사용했습니다. 최소 {min_tool_calls}회는 필요합니다."
    "근거를 더 수집한 뒤 Final Answer를 출력하세요.{unused_hint}"
)

REACT_INSUFFICIENT_TOOLS_MSG_ALT = (
    "현재 도구 호출 수는 {tool_calls_count}회이며, 최소 {min_tool_calls}회가 필요합니다."
    "도구를 호출해 시뮬레이션 근거를 더 확보하세요.{unused_hint}"
)

REACT_TOOL_LIMIT_MSG = (
    "도구 호출 한도에 도달했습니다 ({tool_calls_count}/{max_tool_calls}). 더 이상 도구를 호출할 수 없습니다."
    '지금까지 확보한 근거를 바탕으로 즉시 "Final Answer:" 로 시작하는 섹션 본문을 작성하세요.'
)

REACT_UNUSED_TOOLS_HINT = "\n💡 아직 사용하지 않은 도구: {unused_list}. 다양한 각도 확보를 위해 섞어서 사용해 보세요."

REACT_FORCE_FINAL_MSG = "도구 호출 한도에 도달했습니다. 이제 바로 Final Answer: 로 시작하는 섹션 본문을 작성하세요."

# ── Chat prompt ──

CHAT_SYSTEM_PROMPT_TEMPLATE = """\
너는 간결하고 정확하게 답하는 MiroFish 시뮬레이션 도우미다.

【배경】
예측 조건: {simulation_requirement}

【이미 생성된 보고서】
{report_content}

【응답 규칙】
1. 먼저 위 보고서 내용을 바탕으로 답하라.
2. 쓸데없는 장황한 사고 과정을 드러내지 마라.
3. 보고서만으로 부족할 때만 도구를 호출하라.
4. 답변은 짧고, 명확하고, 구조적이어야 한다.

【사용 가능한 도구】(필요할 때만, 최대 1~2회)
{tools_description}

【도구 호출 형식】
<tool_call>
{{"name": "도구이름", "parameters": {{"파라미터명": "값"}}}}
</tool_call>

【답변 스타일】
- 먼저 결론을 한두 문장으로 말한다.
- 필요한 이유만 짧게 덧붙인다.
- 길어질 경우 최대 3개 불릿 안에서 정리한다.
- 핵심 근거는 > 인용 형식으로 보여준다.
- 한국어 사용자에게 자연스럽게 읽히는 표현을 사용한다.
- 불필요한 수사나 장식적 표현은 줄인다."""

CHAT_OBSERVATION_SUFFIX = "\n\n질문에 짧고 명확하게 답하세요."


# ═══════════════════════════════════════════════════════════════
# ReportAgent main class
# ═══════════════════════════════════════════════════════════════


class ReportAgent:
    """
    Report Agent - Simulation report generation agent

    Using ReACT (Reasoning+ Acting）model:
    1. Planning stage: analyze simulation requirements and plan the report directory structure
    2. Generation phase: Generate content chapter by chapter, and each chapter can call the tool multiple times to obtain information.
    3. Reflection phase: Check content for completeness and accuracy
    """

    # Maximum number of tool calls (per chapter)
    MAX_TOOL_CALLS_PER_SECTION = 5

    # Maximum number of reflection rounds
    MAX_REFLECTION_ROUNDS = 3

    # Maximum number of tool calls in a conversation
    MAX_TOOL_CALLS_PER_CHAT = 2

    def __init__(
        self,
        graph_id: str,
        simulation_id: str,
        simulation_requirement: str,
        llm_client: Optional[LLMClient] = None,
        zep_tools: Optional[ZepToolsService] = None
    ):
        """
        Initialize Report Agent

        Args:
            graph_id: Map ID
            simulation_id: Impersonation ID
            simulation_requirement: Simulation requirement description
            llm_client: LLMClient (optional)
            zep_tools: ZepTool services (optional)
        """
        self.graph_id = graph_id
        self.simulation_id = simulation_id
        self.simulation_requirement = simulation_requirement

        self.llm = llm_client or LLMClient()
        self.zep_tools = zep_tools or ZepToolsService()

        # Tool definition
        self.tools = self._define_tools()

        # Logger (in generate_report initialization in)
        self.report_logger: Optional[ReportLogger] = None
        # console logger (in generate_report initialization in)
        self.console_logger: Optional[ReportConsoleLogger] = None

        logger.info(f"ReportAgent Initialization completed: graph_id={graph_id}, simulation_id={simulation_id}")

    def _define_tools(self) -> Dict[str, Dict[str, Any]]:
        """Define available tools"""
        return {
            "insight_forge": {
                "name": "insight_forge",
                "description": TOOL_DESC_INSIGHT_FORGE,
                "parameters": {
                    "query": "A question or topic you would like to analyze in depth",
                    "report_context": "The context of the current report chapter (optional, helps generate more precise sub-questions)"
                }
            },
            "panorama_search": {
                "name": "panorama_search",
                "description": TOOL_DESC_PANORAMA_SEARCH,
                "parameters": {
                    "query": "Search query for relevance ranking",
                    "include_expired": "Whether to include expiration/Historical content (default True)"
                }
            },
            "quick_search": {
                "name": "quick_search",
                "description": TOOL_DESC_QUICK_SEARCH,
                "parameters": {
                    "query": "Search query string",
                    "limit": "Number of results returned (optional, default 10)"
                }
            },
            "interview_agents": {
                "name": "interview_agents",
                "description": TOOL_DESC_INTERVIEW_AGENTS,
                "parameters": {
                    "interview_topic": "Interview topic or description of needs (e.g.:'Understand students’ views on the formaldehyde incident in dormitories'）",
                    "max_agents": "Maximum number of agents to interview (optional, default 5, maximum 10)"
                }
            }
        }

    def _execute_tool(self, tool_name: str, parameters: Dict[str, Any], report_context: str = "") -> str:
        """
        Execute tool call

        Args:
            tool_name: Tool name
            parameters: Tool parameters
            report_context: Reporting context (for InsightForge)

        Returns:
            Tool execution results (text format)
        """
        logger.info(f"Execution tool: {tool_name}, parameter: {parameters}")

        try:
            if tool_name == "insight_forge":
                query = parameters.get("query", "")
                ctx = parameters.get("report_context", "") or report_context
                result = self.zep_tools.insight_forge(
                    graph_id=self.graph_id,
                    query=query,
                    simulation_requirement=self.simulation_requirement,
                    report_context=ctx
                )
                return result.to_text()

            elif tool_name == "panorama_search":
                # Breadth search - get the whole picture
                query = parameters.get("query", "")
                include_expired = parameters.get("include_expired", True)
                if isinstance(include_expired, str):
                    include_expired = include_expired.lower() in ['true', '1', 'yes']
                result = self.zep_tools.panorama_search(
                    graph_id=self.graph_id,
                    query=query,
                    include_expired=include_expired
                )
                return result.to_text()

            elif tool_name == "quick_search":
                # Simple search - quick retrieval
                query = parameters.get("query", "")
                limit = parameters.get("limit", 10)
                if isinstance(limit, str):
                    limit = int(limit)
                result = self.zep_tools.quick_search(
                    graph_id=self.graph_id,
                    query=query,
                    limit=limit
                )
                return result.to_text()

            elif tool_name == "interview_agents":
                # In-depth interview - call the real OASIS interview API to obtain the simulated Agent's answers (dual platforms)
                interview_topic = parameters.get("interview_topic", parameters.get("query", ""))
                max_agents = parameters.get("max_agents", 5)
                if isinstance(max_agents, str):
                    max_agents = int(max_agents)
                max_agents = min(max_agents, 10)
                result = self.zep_tools.interview_agents(
                    simulation_id=self.simulation_id,
                    interview_requirement=interview_topic,
                    simulation_requirement=self.simulation_requirement,
                    max_agents=max_agents
                )
                return result.to_text()

            # ========== Backward compatibility with old tools (internal redirect to new tools)==========

            elif tool_name == "search_graph":
                # Redirect to quick_search
                logger.info("search_graph Redirected to quick_search")
                return self._execute_tool("quick_search", parameters, report_context)

            elif tool_name == "get_graph_statistics":
                result = self.zep_tools.get_graph_statistics(self.graph_id)
                return json.dumps(result, ensure_ascii=False, indent=2)

            elif tool_name == "get_entity_summary":
                entity_name = parameters.get("entity_name", "")
                result = self.zep_tools.get_entity_summary(
                    graph_id=self.graph_id,
                    entity_name=entity_name
                )
                return json.dumps(result, ensure_ascii=False, indent=2)

            elif tool_name == "get_simulation_context":
                # redirect to insight_forge，because it is more powerful
                logger.info("get_simulation_context Redirected to insight_forge")
                query = parameters.get("query", self.simulation_requirement)
                return self._execute_tool("insight_forge", {"query": query}, report_context)

            elif tool_name == "get_entities_by_type":
                entity_type = parameters.get("entity_type", "")
                nodes = self.zep_tools.get_entities_by_type(
                    graph_id=self.graph_id,
                    entity_type=entity_type
                )
                result = [n.to_dict() for n in nodes]
                return json.dumps(result, ensure_ascii=False, indent=2)

            else:
                return f"unknown tool: {tool_name}。Please use one of the following tools: insight_forge, panorama_search, quick_search"

        except Exception as e:
            logger.error(f"Tool execution failed: {tool_name}, mistake: {str(e)}")
            return f"Tool execution failed: {str(e)}"

    # A collection of legal tool names for verification when parsing bare JSON
    VALID_TOOL_NAMES = {"insight_forge", "panorama_search", "quick_search", "interview_agents"}

    def _parse_tool_calls(self, response: str) -> List[Dict[str, Any]]:
        """
        Parse tool calls from LLM responses

        Supported formats (by priority):
        1. <tool_call>{"name": "tool_name", "parameters": {...}}</tool_call>
        2. Naked JSON (the response as a whole or a single line is just a tool call JSON)
        """
        tool_calls = []

        # Format 1: XMLStyle (standard format)
        xml_pattern = r'<tool_call>\s*(\{.*?\})\s*</tool_call>'
        for match in re.finditer(xml_pattern, response, re.DOTALL):
            try:
                call_data = json.loads(match.group(1))
                tool_calls.append(call_data)
            except json.JSONDecodeError:
                pass

        if tool_calls:
            return tool_calls

        # Format 2: Keep it secret - LLM directly outputs bare JSON (without packages)<tool_call> Label)
        # Only try when format 1 is not matched to avoid mismatching JSON in the body
        stripped = response.strip()
        if stripped.startswith('{') and stripped.endswith('}'):
            try:
                call_data = json.loads(stripped)
                if self._is_valid_tool_call(call_data):
                    tool_calls.append(call_data)
                    return tool_calls
            except json.JSONDecodeError:
                pass

        # Response may contain think text+ Naked JSON, attempts to extract the last JSON object
        json_pattern = r'(\{"(?:name|tool)"\s*:.*?\})\s*$'
        match = re.search(json_pattern, stripped, re.DOTALL)
        if match:
            try:
                call_data = json.loads(match.group(1))
                if self._is_valid_tool_call(call_data):
                    tool_calls.append(call_data)
            except json.JSONDecodeError:
                pass

        return tool_calls

    def _is_valid_tool_call(self, data: dict) -> bool:
        """Verify whether the parsed JSON is a legal tool call"""
        # support{"name": ..., "parameters": ...} and{"tool": ..., "params": ...} Two key names
        tool_name = data.get("name") or data.get("tool")
        if tool_name and tool_name in self.VALID_TOOL_NAMES:
            # The unified key name is name/ parameters
            if "tool" in data:
                data["name"] = data.pop("tool")
            if "params" in data and "parameters" not in data:
                data["parameters"] = data.pop("params")
            return True
        return False

    def _get_tools_description(self) -> str:
        """Generate tool description text"""
        desc_parts = ["Available tools:"]
        for name, tool in self.tools.items():
            params_desc = ", ".join([f"{k}: {v}" for k, v in tool["parameters"].items()])
            desc_parts.append(f"- {name}: {tool['description']}")
            if params_desc:
                desc_parts.append(f"  parameter: {params_desc}")
        return "\n".join(desc_parts)

    def plan_outline(
        self,
        progress_callback: Optional[Callable] = None
    ) -> ReportOutline:
        """
        Planning report outline

        Use LLM to analyze simulation requirements and plan the directory structure of the report

        Args:
            progress_callback: Progress callback function

        Returns:
            ReportOutline: Report outline
        """
        logger.info("Start planning your report outline...")

        if progress_callback:
            progress_callback("planning", 0, "Analyzing simulation requirements...")

        # First get the simulation context
        context = self.zep_tools.get_simulation_context(
            graph_id=self.graph_id,
            simulation_requirement=self.simulation_requirement
        )

        if progress_callback:
            progress_callback("planning", 30, "Generating report outline...")

        system_prompt = PLAN_SYSTEM_PROMPT
        user_prompt = PLAN_USER_PROMPT_TEMPLATE.format(
            simulation_requirement=self.simulation_requirement,
            total_nodes=context.get('graph_statistics', {}).get('total_nodes', 0),
            total_edges=context.get('graph_statistics', {}).get('total_edges', 0),
            entity_types=list(context.get('graph_statistics', {}).get('entity_types', {}).keys()),
            total_entities=context.get('total_entities', 0),
            related_facts_json=json.dumps(context.get('related_facts', [])[:10], ensure_ascii=False, indent=2),
        )

        try:
            response = self.llm.chat_json(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3
            )

            if progress_callback:
                progress_callback("planning", 80, "Parsing outline structure...")

            # Analyze the outline
            sections = []
            for section_data in response.get("sections", []):
                sections.append(ReportSection(
                    title=section_data.get("title", ""),
                    content=""
                ))

            outline = ReportOutline(
                title=response.get("title", "Simulation analysis report"),
                summary=response.get("summary", ""),
                sections=sections
            )

            if progress_callback:
                progress_callback("planning", 100, "Outline planning completed")

            logger.info(f"Outline planning completed: {len(sections)} chapters")
            return outline

        except Exception as e:
            logger.error(f"Outline planning failed: {str(e)}")
            # Return to default outline (3 chapters, as fallback)
            return ReportOutline(
                title="Future Forecast Report",
                summary="Future trend and risk analysis based on simulation forecasts",
                sections=[
                    ReportSection(title="Predictive scenarios and core findings"),
                    ReportSection(title="Predictive analysis of crowd behavior"),
                    ReportSection(title="Trend Outlook and Risk Warning")
                ]
            )

    def _generate_section_react(
        self,
        section: ReportSection,
        outline: ReportOutline,
        previous_sections: List[str],
        progress_callback: Optional[Callable] = None,
        section_index: int = 0
    ) -> str:
        """
        Generate single chapter content using ReACT mode

        ReACTcycle:
        1. Thought（Thinking) - what information is needed for analysis
        2. Action（Action) - call the tool to get the information
        3. Observation（Observation) - Analysis tool returns results
        4. Repeat until information is sufficient or maximum times reached
        5. Final Answer（Final answer) - Generate chapter content

        Args:
            section: Chapters to generate
            outline: full outline
            previous_sections: Content from previous chapters (for continuity)
            progress_callback: Progress callback
            section_index: Chapter index (for logging)

        Returns:
            Chapter content (Markdown format)
        """
        logger.info(f"ReACTGenerate chapters: {section.title}")

        # Record chapter start log
        if self.report_logger:
            self.report_logger.log_section_start(section.title, section_index)

        system_prompt = SECTION_SYSTEM_PROMPT_TEMPLATE.format(
            report_title=outline.title,
            report_summary=outline.summary,
            simulation_requirement=self.simulation_requirement,
            section_title=section.title,
            tools_description=self._get_tools_description(),
        )

        # Build user prompt - pass in a maximum of 4000 words for each completed chapter
        if previous_sections:
            previous_parts = []
            for sec in previous_sections:
                # Maximum 4,000 words per chapter
                truncated = sec[:4000] + "..." if len(sec) > 4000 else sec
                previous_parts.append(truncated)
            previous_content = "\n\n---\n\n".join(previous_parts)
        else:
            previous_content = "（This is the first chapter)"

        user_prompt = SECTION_USER_PROMPT_TEMPLATE.format(
            previous_content=previous_content,
            section_title=section.title,
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        # ReACTcycle
        tool_calls_count = 0
        max_iterations = 5  # Maximum number of iteration rounds
        min_tool_calls = int(os.environ.get('REPORT_AGENT_MIN_TOOL_CALLS', '1'))
        conflict_retries = 0  # The number of consecutive conflicts between tool calls and Final Answer at the same time
        used_tools = set()  # Record the tool name that has been called
        all_tools = {"insight_forge", "panorama_search", "quick_search", "interview_agents"}

        # Report context for sub-issue generation in InsightForge
        report_context = f"Chapter title: {section.title}\nSimulation requirements: {self.simulation_requirement}"

        for iteration in range(max_iterations):
            if progress_callback:
                progress_callback(
                    "generating",
                    int((iteration / max_iterations) * 100),
                    f"In-depth search and writing in progress ({tool_calls_count}/{self.MAX_TOOL_CALLS_PER_SECTION})"
                )

            # Call LLM
            response = self.llm.chat(
                messages=messages,
                temperature=0.5,
                max_tokens=4096
            )

            # Check if LLM return is None (API exception or empty content)
            if response is None:
                logger.warning(f"chapter{section.title} No.{iteration + 1} iterations: LLM Return None")
                # If there are still more iterations left, add a message and try again
                if iteration < max_iterations - 1:
                    messages.append({"role": "assistant", "content": "（response is empty)"})
                    messages.append({"role": "user", "content": "Please keep generating content."})
                    continue
                # The last iteration also returns None, jumping out of the loop and entering forced closing.
                break

            logger.debug(f"LLMresponse: {response[:200]}...")

            # Parse once and reuse the results
            tool_calls = self._parse_tool_calls(response)
            has_tool_calls = bool(tool_calls)
            has_final_answer = "Final Answer:" in response

            # ── Conflict handling: LLM outputs both the tool call and the Final Answer──
            if has_tool_calls and has_final_answer:
                conflict_retries += 1
                logger.warning(
                    f"chapter{section.title} No.{iteration+1} wheel: "
                    f"LLM Simultaneous output of tool calls and Final Answer (section{conflict_retries} conflict)"
                )

                if conflict_retries <= 2:
                    # The first two times: discard this response and ask LLM to reply again.
                    messages.append({"role": "assistant", "content": response})
                    messages.append({
                        "role": "user",
                        "content": (
                            "【Format error] You included both a tool call and a Final Answer in one reply, which is not allowed.\n"
                            "Each reply can only do one of two things:\n"
                            "- Call a tool (output a<tool_call> block, do not write Final Answer)\n"
                            "- Output the final content (with'Final Answer:' Beginning, do not include<tool_call>）\n"
                            "Please reply again and only do one of these things."
                        ),
                    })
                    continue
                else:
                    # The third time: downgrade processing, truncate to the first tool call, force execution
                    logger.warning(
                        f"chapter{section.title}: continuous{conflict_retries} conflict,"
                        "Downgrade to truncate execution of first tool call"
                    )
                    first_tool_end = response.find('</tool_call>')
                    if first_tool_end != -1:
                        response = response[:first_tool_end + len('</tool_call>')]
                        tool_calls = self._parse_tool_calls(response)
                        has_tool_calls = bool(tool_calls)
                    has_final_answer = False
                    conflict_retries = 0

            # Logging LLM responses
            if self.report_logger:
                self.report_logger.log_llm_response(
                    section_title=section.title,
                    section_index=section_index,
                    response=response,
                    iteration=iteration + 1,
                    has_tool_calls=has_tool_calls,
                    has_final_answer=has_final_answer
                )

            # ── Case 1: LLM outputs Final Answer──
            if has_final_answer:
                # The number of times the tool has been called is insufficient. Refuse and ask to continue adjusting the tool.
                if tool_calls_count < min_tool_calls:
                    messages.append({"role": "assistant", "content": response})
                    unused_tools = all_tools - used_tools
                    unused_hint = f"（These tools have not been used yet, it is recommended to use them: {', '.join(unused_tools)}）" if unused_tools else ""
                    messages.append({
                        "role": "user",
                        "content": REACT_INSUFFICIENT_TOOLS_MSG.format(
                            tool_calls_count=tool_calls_count,
                            min_tool_calls=min_tool_calls,
                            unused_hint=unused_hint,
                        ),
                    })
                    continue

                # End normally
                final_answer = response.split("Final Answer:")[-1].strip()
                logger.info(f"chapter{section.title} Generation completed (tool call: {tool_calls_count}Second-rate)")

                if self.report_logger:
                    self.report_logger.log_section_content(
                        section_title=section.title,
                        section_index=section_index,
                        content=final_answer,
                        tool_calls_count=tool_calls_count
                    )
                return final_answer

            # ── Case 2: LLM attempts to call the tool──
            if has_tool_calls:
                # Tool quota has been exhausted→ Clearly inform and require output of Final Answer
                if tool_calls_count >= self.MAX_TOOL_CALLS_PER_SECTION:
                    messages.append({"role": "assistant", "content": response})
                    messages.append({
                        "role": "user",
                        "content": REACT_TOOL_LIMIT_MSG.format(
                            tool_calls_count=tool_calls_count,
                            max_tool_calls=self.MAX_TOOL_CALLS_PER_SECTION,
                        ),
                    })
                    continue

                # Only execute the first tool call
                call = tool_calls[0]
                if len(tool_calls) > 1:
                    logger.info(f"LLM Try calling{len(tool_calls)} tools, only the first one is executed: {call['name']}")

                if self.report_logger:
                    self.report_logger.log_tool_call(
                        section_title=section.title,
                        section_index=section_index,
                        tool_name=call["name"],
                        parameters=call.get("parameters", {}),
                        iteration=iteration + 1
                    )

                result = self._execute_tool(
                    call["name"],
                    call.get("parameters", {}),
                    report_context=report_context
                )

                if self.report_logger:
                    self.report_logger.log_tool_result(
                        section_title=section.title,
                        section_index=section_index,
                        tool_name=call["name"],
                        result=result,
                        iteration=iteration + 1
                    )

                tool_calls_count += 1
                used_tools.add(call['name'])

                # Build unused tooltip
                unused_tools = all_tools - used_tools
                unused_hint = ""
                if unused_tools and tool_calls_count < self.MAX_TOOL_CALLS_PER_SECTION:
                    unused_hint = REACT_UNUSED_TOOLS_HINT.format(unused_list="、".join(unused_tools))

                messages.append({"role": "assistant", "content": response})
                messages.append({
                    "role": "user",
                    "content": REACT_OBSERVATION_TEMPLATE.format(
                        tool_name=call["name"],
                        result=result,
                        tool_calls_count=tool_calls_count,
                        max_tool_calls=self.MAX_TOOL_CALLS_PER_SECTION,
                        used_tools_str=", ".join(used_tools),
                        unused_hint=unused_hint,
                    ),
                })
                continue

            # ── Case 3: There is neither tool call nor Final Answer──
            messages.append({"role": "assistant", "content": response})

            if tool_calls_count < min_tool_calls:
                # The number of times the tool has been called is insufficient. Unused tools are recommended.
                unused_tools = all_tools - used_tools
                unused_hint = f"（These tools have not been used yet, it is recommended to use them: {', '.join(unused_tools)}）" if unused_tools else ""

                messages.append({
                    "role": "user",
                    "content": REACT_INSUFFICIENT_TOOLS_MSG_ALT.format(
                        tool_calls_count=tool_calls_count,
                        min_tool_calls=min_tool_calls,
                        unused_hint=unused_hint,
                    ),
                })
                continue

            # The tool call is sufficient, LLM outputs the content but does not bring"Final Answer:" prefix
            # Use this content directly as the final answer, no more idling
            logger.info(f"chapter{section.title} not detected'Final Answer:' prefix, directly adopt the LLM output as the final content (tool call: {tool_calls_count}Second-rate)")
            final_answer = response.strip()

            if self.report_logger:
                self.report_logger.log_section_content(
                    section_title=section.title,
                    section_index=section_index,
                    content=final_answer,
                    tool_calls_count=tool_calls_count
                )
            return final_answer

        # The maximum number of iterations is reached and content is forced to be generated.
        logger.warning(f"chapter{section.title} The maximum number of iterations is reached and forced generation")
        messages.append({"role": "user", "content": REACT_FORCE_FINAL_MSG})

        response = self.llm.chat(
            messages=messages,
            temperature=0.5,
            max_tokens=4096
        )

        # Check if LLM returns None when forced closing
        if response is None:
            logger.error(f"chapter{section.title} When forcing closing, LLM returns None and uses the default error prompt.")
            final_answer = f"（Generation of this chapter failed: LLM returned an empty response, please try again later)"
        elif "Final Answer:" in response:
            final_answer = response.split("Final Answer:")[-1].strip()
        else:
            final_answer = response

        # Record chapter content and generate completion log
        if self.report_logger:
            self.report_logger.log_section_content(
                section_title=section.title,
                section_index=section_index,
                content=final_answer,
                tool_calls_count=tool_calls_count
            )

        return final_answer

    def generate_report(
        self,
        progress_callback: Optional[Callable[[str, int, str], None]] = None,
        report_id: Optional[str] = None
    ) -> Report:
        """
        Generate a complete report (real-time output in chapters)

        Each chapter is saved to a folder immediately after being generated, without waiting for the entire report to be completed.
        File structure:
        reports/{report_id}/
            meta.json       - Report meta information
            outline.json    - Report outline
            progress.json   - Build progress
            section_01.md   - Chapter 1
            section_02.md   - Chapter 2
            ...
            full_report.md  - full report

        Args:
            progress_callback: Progress callback function (stage, progress, message)
            report_id: Report ID (optional, automatically generated if not passed)

        Returns:
            Report: full report
        """
        import uuid

        # If no report is passed in_id，is automatically generated
        if not report_id:
            report_id = f"report_{uuid.uuid4().hex[:12]}"
        start_time = datetime.now()

        report = Report(
            report_id=report_id,
            simulation_id=self.simulation_id,
            graph_id=self.graph_id,
            simulation_requirement=self.simulation_requirement,
            status=ReportStatus.PENDING,
            created_at=datetime.now().isoformat()
        )

        # List of completed chapter titles (for progress tracking)
        completed_section_titles = []

        try:
            # Initialization: Create report folder and save initial state
            ReportManager._ensure_report_folder(report_id)

            # Initialize the logger (structured logging agent_log.jsonl）
            self.report_logger = ReportLogger(report_id)
            self.report_logger.log_start(
                simulation_id=self.simulation_id,
                graph_id=self.graph_id,
                simulation_requirement=self.simulation_requirement
            )

            # Initialize the console logger (console_log.txt）
            self.console_logger = ReportConsoleLogger(report_id)

            ReportManager.update_progress(
                report_id, "pending", 0, "Initialization report...",
                completed_sections=[]
            )
            ReportManager.save_report(report)

            # Stage 1: Planning outline
            report.status = ReportStatus.PLANNING
            ReportManager.update_progress(
                report_id, "planning", 5, "Start planning your report outline...",
                completed_sections=[]
            )

            # Record planning start log
            self.report_logger.log_planning_start()

            if progress_callback:
                progress_callback("planning", 0, "Start planning your report outline...")

            outline = self.plan_outline(
                progress_callback=lambda stage, prog, msg:
                    progress_callback(stage, prog // 5, msg) if progress_callback else None
            )
            report.outline = outline

            # Record planning completion log
            self.report_logger.log_planning_complete(outline.to_dict())

            # Save outline to file
            ReportManager.save_outline(report_id, outline)
            ReportManager.update_progress(
                report_id, "planning", 15, f"Outline planning is completed, a total of{len(outline.sections)}chapters",
                completed_sections=[]
            )
            ReportManager.save_report(report)

            logger.info(f"Outline saved to file: {report_id}/outline.json")

            # Stage 2: Generate chapter by chapter (save in chapters)
            report.status = ReportStatus.GENERATING

            total_sections = len(outline.sections)
            generated_sections = []  # Save content for context

            for i, section in enumerate(outline.sections):
                section_num = i + 1
                base_progress = 20 + int((i / total_sections) * 70)

                # update progress
                ReportManager.update_progress(
                    report_id, "generating", base_progress,
                    f"Generating chapters: {section.title} ({section_num}/{total_sections})",
                    current_section=section.title,
                    completed_sections=completed_section_titles
                )

                if progress_callback:
                    progress_callback(
                        "generating",
                        base_progress,
                        f"Generating chapters: {section.title} ({section_num}/{total_sections})"
                    )

                # Generate main chapter content
                section_content = self._generate_section_react(
                    section=section,
                    outline=outline,
                    previous_sections=generated_sections,
                    progress_callback=lambda stage, prog, msg:
                        progress_callback(
                            stage,
                            base_progress + int(prog * 0.7 / total_sections),
                            msg
                        ) if progress_callback else None,
                    section_index=section_num
                )

                section.content = section_content
                generated_sections.append(f"## {section.title}\n\n{section_content}")

                # save chapter
                ReportManager.save_section(report_id, section_num, section)
                completed_section_titles.append(section.title)

                # Record chapter completion log
                full_section_content = f"## {section.title}\n\n{section_content}"

                if self.report_logger:
                    self.report_logger.log_section_full_complete(
                        section_title=section.title,
                        section_index=section_num,
                        full_content=full_section_content.strip()
                    )

                logger.info(f"Chapter saved: {report_id}/section_{section_num:02d}.md")

                # update progress
                ReportManager.update_progress(
                    report_id, "generating",
                    base_progress + int(70 / total_sections),
                    f"chapter{section.title} Completed",
                    current_section=None,
                    completed_sections=completed_section_titles
                )

            # Stage 3: Assemble the complete report
            if progress_callback:
                progress_callback("generating", 95, "Assembling full report...")

            ReportManager.update_progress(
                report_id, "generating", 95, "Assembling full report...",
                completed_sections=completed_section_titles
            )

            # Assemble a complete report using ReportManager
            report.markdown_content = ReportManager.assemble_full_report(report_id, outline)
            report.status = ReportStatus.COMPLETED
            report.completed_at = datetime.now().isoformat()

            # Calculate total time
            total_time_seconds = (datetime.now() - start_time).total_seconds()

            # Record report completion log
            if self.report_logger:
                self.report_logger.log_report_complete(
                    total_sections=total_sections,
                    total_time_seconds=total_time_seconds
                )

            # Save final report
            ReportManager.save_report(report)
            ReportManager.update_progress(
                report_id, "completed", 100, "Report generation completed",
                completed_sections=completed_section_titles
            )

            if progress_callback:
                progress_callback("completed", 100, "Report generation completed")

            logger.info(f"Report generation completed: {report_id}")

            # Turn off the console logger
            if self.console_logger:
                self.console_logger.close()
                self.console_logger = None

            return report

        except Exception as e:
            logger.error(f"Report generation failed: {str(e)}")
            report.status = ReportStatus.FAILED
            report.error = str(e)

            # Record error log
            if self.report_logger:
                self.report_logger.log_error(str(e), "failed")

            # Save failed status
            try:
                ReportManager.save_report(report)
                ReportManager.update_progress(
                    report_id, "failed", -1, f"Report generation failed: {str(e)}",
                    completed_sections=completed_section_titles
                )
            except Exception:
                pass  # Ignore save failed errors

            # Turn off the console logger
            if self.console_logger:
                self.console_logger.close()
                self.console_logger = None

            return report

    def chat(
        self,
        message: str,
        chat_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Talk to Report Agent

        During the conversation, the Agent can independently call the retrieval tool to answer questions.

        Args:
            message: User messages
            chat_history: Conversation history

        Returns:
            {
                "response": "Agentreply",
                "tool_calls": [List of tools called],
                "sources": [Source of information]
            }
        """
        logger.info(f"Report Agentdialogue: {message[:50]}...")

        chat_history = chat_history or []

        # Get generated report content
        report_content = ""
        try:
            report = ReportManager.get_report_by_simulation(self.simulation_id)
            if report and report.markdown_content:
                # Limit report length to avoid long context
                report_content = report.markdown_content[:15000]
                if len(report.markdown_content) > 15000:
                    report_content += "\n\n... [Report content has been truncated] ..."
        except Exception as e:
            logger.warning(f"Failed to get report content: {e}")

        system_prompt = CHAT_SYSTEM_PROMPT_TEMPLATE.format(
            simulation_requirement=self.simulation_requirement,
            report_content=report_content if report_content else "（No report yet)",
            tools_description=self._get_tools_description(),
        )

        # Build message
        messages = [{"role": "system", "content": system_prompt}]

        # Add historical conversation
        for h in chat_history[-10:]:  # Limit history length
            messages.append(h)

        # Add user message
        messages.append({
            "role": "user",
            "content": message
        })

        # ReACTLoop (simplified version)
        tool_calls_made = []
        max_iterations = 2  # Reduce the number of iteration rounds

        for iteration in range(max_iterations):
            response = self.llm.chat(
                messages=messages,
                temperature=0.5
            )

            # Parsing tool call
            tool_calls = self._parse_tool_calls(response)

            if not tool_calls:
                # There is no tool call and the response is returned directly
                clean_response = re.sub(r'<tool_call>.*?</tool_call>', '', response, flags=re.DOTALL)
                clean_response = re.sub(r'\[TOOL_CALL\].*?\)', '', clean_response)

                return {
                    "response": clean_response.strip(),
                    "tool_calls": tool_calls_made,
                    "sources": [tc.get("parameters", {}).get("query", "") for tc in tool_calls_made]
                }

            # Perform tool calls (limited number)
            tool_results = []
            for call in tool_calls[:1]:  # Execute at most 1 tool call per round
                if len(tool_calls_made) >= self.MAX_TOOL_CALLS_PER_CHAT:
                    break
                result = self._execute_tool(call["name"], call.get("parameters", {}))
                tool_results.append({
                    "tool": call["name"],
                    "result": result[:1500]  # Limit result length
                })
                tool_calls_made.append(call)

            # Add results to message
            messages.append({"role": "assistant", "content": response})
            observation = "\n".join([f"[{r['tool']}result]\n{r['result']}" for r in tool_results])
            messages.append({
                "role": "user",
                "content": observation + CHAT_OBSERVATION_SUFFIX
            })

        # Reach the maximum iteration and get the final response
        final_response = self.llm.chat(
            messages=messages,
            temperature=0.5
        )

        # Clean response
        clean_response = re.sub(r'<tool_call>.*?</tool_call>', '', final_response, flags=re.DOTALL)
        clean_response = re.sub(r'\[TOOL_CALL\].*?\)', '', clean_response)

        return {
            "response": clean_response.strip(),
            "tool_calls": tool_calls_made,
            "sources": [tc.get("parameters", {}).get("query", "") for tc in tool_calls_made]
        }


class ReportManager:
    """
    report manager

    Responsible for persistent storage and retrieval of reports

    File structure (output in chapters):
    reports/
      {report_id}/
        meta.json          - Report meta information and status
        outline.json       - Report outline
        progress.json      - Build progress
        section_01.md      - Chapter 1
        section_02.md      - Chapter 2
        ...
        full_report.md     - full report
    """

    # Report storage directory
    REPORTS_DIR = os.path.join(Config.UPLOAD_FOLDER, 'reports')

    @classmethod
    def _ensure_reports_dir(cls):
        """Make sure the report root directory exists"""
        os.makedirs(cls.REPORTS_DIR, exist_ok=True)

    @classmethod
    def _get_report_folder(cls, report_id: str) -> str:
        """Get report folder path"""
        return os.path.join(cls.REPORTS_DIR, report_id)

    @classmethod
    def _ensure_report_folder(cls, report_id: str) -> str:
        """Make sure the reports folder exists and return the path"""
        folder = cls._get_report_folder(report_id)
        os.makedirs(folder, exist_ok=True)
        return folder

    @classmethod
    def _get_report_path(cls, report_id: str) -> str:
        """Get report metainformation file path"""
        return os.path.join(cls._get_report_folder(report_id), "meta.json")

    @classmethod
    def _get_report_markdown_path(cls, report_id: str) -> str:
        """Get the full report Markdown file path"""
        return os.path.join(cls._get_report_folder(report_id), "full_report.md")

    @classmethod
    def _get_outline_path(cls, report_id: str) -> str:
        """Get outline file path"""
        return os.path.join(cls._get_report_folder(report_id), "outline.json")

    @classmethod
    def _get_progress_path(cls, report_id: str) -> str:
        """Get progress file path"""
        return os.path.join(cls._get_report_folder(report_id), "progress.json")

    @classmethod
    def _get_section_path(cls, report_id: str, section_index: int) -> str:
        """Get the chapter Markdown file path"""
        return os.path.join(cls._get_report_folder(report_id), f"section_{section_index:02d}.md")

    @classmethod
    def _get_agent_log_path(cls, report_id: str) -> str:
        """Get Agent log file path"""
        return os.path.join(cls._get_report_folder(report_id), "agent_log.jsonl")

    @classmethod
    def _get_console_log_path(cls, report_id: str) -> str:
        """Get console log file path"""
        return os.path.join(cls._get_report_folder(report_id), "console_log.txt")

    @classmethod
    def get_console_log(cls, report_id: str, from_line: int = 0) -> Dict[str, Any]:
        """
        Get console log content

        This is the console output log (INFO, WARNING, etc.) during the report generation process,
        with agent_log.jsonl Structured logs are different.

        Args:
            report_id: Report ID
            from_line: Which row to start reading from (for incremental acquisition, 0 means starting from the beginning)

        Returns:
            {
                "logs": [List of log lines],
                "total_lines": Total number of rows,
                "from_line": Starting line number,
                "has_more": Are there more logs?
            }
        """
        log_path = cls._get_console_log_path(report_id)

        if not os.path.exists(log_path):
            return {
                "logs": [],
                "total_lines": 0,
                "from_line": 0,
                "has_more": False
            }

        logs = []
        total_lines = 0

        with open(log_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                total_lines = i + 1
                if i >= from_line:
                    # Keep original log lines, remove trailing newlines
                    logs.append(line.rstrip('\n\r'))

        return {
            "logs": logs,
            "total_lines": total_lines,
            "from_line": from_line,
            "has_more": False  # Read to the end
        }

    @classmethod
    def get_console_log_stream(cls, report_id: str) -> List[str]:
        """
        Get the complete console log (get it all at once)

        Args:
            report_id: Report ID

        Returns:
            List of log lines
        """
        result = cls.get_console_log(report_id, from_line=0)
        return result["logs"]

    @classmethod
    def get_agent_log(cls, report_id: str, from_line: int = 0) -> Dict[str, Any]:
        """
        Get Agent log content

        Args:
            report_id: Report ID
            from_line: Which row to start reading from (for incremental acquisition, 0 means starting from the beginning)

        Returns:
            {
                "logs": [List of log entries],
                "total_lines": Total number of rows,
                "from_line": Starting line number,
                "has_more": Are there more logs?
            }
        """
        log_path = cls._get_agent_log_path(report_id)

        if not os.path.exists(log_path):
            return {
                "logs": [],
                "total_lines": 0,
                "from_line": 0,
                "has_more": False
            }

        logs = []
        total_lines = 0

        with open(log_path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                total_lines = i + 1
                if i >= from_line:
                    try:
                        log_entry = json.loads(line.strip())
                        logs.append(log_entry)
                    except json.JSONDecodeError:
                        # Skip lines that failed to parse
                        continue

        return {
            "logs": logs,
            "total_lines": total_lines,
            "from_line": from_line,
            "has_more": False  # Read to the end
        }

    @classmethod
    def get_agent_log_stream(cls, report_id: str) -> List[Dict[str, Any]]:
        """
        Get the complete Agent log (for getting all at once)

        Args:
            report_id: Report ID

        Returns:
            List of log entries
        """
        result = cls.get_agent_log(report_id, from_line=0)
        return result["logs"]

    @classmethod
    def save_outline(cls, report_id: str, outline: ReportOutline) -> None:
        """
        Save report outline

        Called immediately after the planning phase is complete
        """
        cls._ensure_report_folder(report_id)

        with open(cls._get_outline_path(report_id), 'w', encoding='utf-8') as f:
            json.dump(outline.to_dict(), f, ensure_ascii=False, indent=2)

        logger.info(f"Outline saved: {report_id}")

    @classmethod
    def save_section(
        cls,
        report_id: str,
        section_index: int,
        section: ReportSection
    ) -> str:
        """
        Save a single chapter

        Called immediately after each chapter is generated to achieve chapter-by-chapter output.

        Args:
            report_id: Report ID
            section_index: Chapter index (starting from 1)
            section: Chapter object

        Returns:
            Saved file path
        """
        cls._ensure_report_folder(report_id)

        # Build chapter Markdown content - clean up possible duplicate titles
        cleaned_content = cls._clean_section_content(section.content, section.title)
        md_content = f"## {section.title}\n\n"
        if cleaned_content:
            md_content += f"{cleaned_content}\n\n"

        # save file
        file_suffix = f"section_{section_index:02d}.md"
        file_path = os.path.join(cls._get_report_folder(report_id), file_suffix)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(md_content)

        logger.info(f"Chapter saved: {report_id}/{file_suffix}")
        return file_path

    @classmethod
    def _clean_section_content(cls, content: str, section_title: str) -> str:
        """
        Clean up chapter content

        1. Remove the Markdown title line that duplicates the chapter title at the beginning of the content
        2. Convert all ### and below level headings to bold text

        Args:
            content: original content
            section_title: Chapter title

        Returns:
            Cleaned content
        """
        import re

        if not content:
            return content

        content = content.strip()
        lines = content.split('\n')
        cleaned_lines = []
        skip_next_empty = False

        for i, line in enumerate(lines):
            stripped = line.strip()

            # Check if it is a Markdown header row
            heading_match = re.match(r'^(#{1,6})\s+(.+)$', stripped)

            if heading_match:
                level = len(heading_match.group(1))
                title_text = heading_match.group(2).strip()

                # Check if the title is a duplicate of the chapter title (skip duplicates within the first 5 lines)
                if i < 5:
                    if title_text == section_title or title_text.replace(' ', '') == section_title.replace(' ', ''):
                        skip_next_empty = True
                        continue

                # Change all level headings (#, ##, ###, ####etc.) converted to bold
                # Because chapter titles are added by the system, there should be no titles in the content
                cleaned_lines.append(f"**{title_text}**")
                cleaned_lines.append("")  # add blank line
                continue

            # If the previous line is a skipped title and the current line is empty, it is also skipped.
            if skip_next_empty and stripped == '':
                skip_next_empty = False
                continue

            skip_next_empty = False
            cleaned_lines.append(line)

        # Remove leading blank lines
        while cleaned_lines and cleaned_lines[0].strip() == '':
            cleaned_lines.pop(0)

        # Remove leading separator
        while cleaned_lines and cleaned_lines[0].strip() in ['---', '***', '___']:
            cleaned_lines.pop(0)
            # Also remove empty lines after separators
            while cleaned_lines and cleaned_lines[0].strip() == '':
                cleaned_lines.pop(0)

        return '\n'.join(cleaned_lines)

    @classmethod
    def update_progress(
        cls,
        report_id: str,
        status: str,
        progress: int,
        message: str,
        current_section: str = None,
        completed_sections: List[str] = None
    ) -> None:
        """
        Update report generation progress

        The front end can read progress by.jsonGet real-time progress
        """
        cls._ensure_report_folder(report_id)

        progress_data = {
            "status": status,
            "progress": progress,
            "message": message,
            "current_section": current_section,
            "completed_sections": completed_sections or [],
            "updated_at": datetime.now().isoformat()
        }

        with open(cls._get_progress_path(report_id), 'w', encoding='utf-8') as f:
            json.dump(progress_data, f, ensure_ascii=False, indent=2)

    @classmethod
    def get_progress(cls, report_id: str) -> Optional[Dict[str, Any]]:
        """Get report generation progress"""
        path = cls._get_progress_path(report_id)

        if not os.path.exists(path):
            return None

        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)

    @classmethod
    def get_generated_sections(cls, report_id: str) -> List[Dict[str, Any]]:
        """
        Get the generated chapter list

        Returns all saved chapter file information
        """
        folder = cls._get_report_folder(report_id)

        if not os.path.exists(folder):
            return []

        sections = []
        for filename in sorted(os.listdir(folder)):
            if filename.startswith('section_') and filename.endswith('.md'):
                file_path = os.path.join(folder, filename)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Parse chapter index from filename
                parts = filename.replace('.md', '').split('_')
                section_index = int(parts[1])

                sections.append({
                    "filename": filename,
                    "section_index": section_index,
                    "content": content
                })

        return sections

    @classmethod
    def assemble_full_report(cls, report_id: str, outline: ReportOutline) -> str:
        """
        Assemble the complete report

        Assemble full report from saved chapter files with title cleaning
        """
        folder = cls._get_report_folder(report_id)

        # Build report header
        md_content = f"# {outline.title}\n\n"
        md_content += f"> {outline.summary}\n\n"
        md_content += f"---\n\n"

        # Read all chapter files sequentially
        sections = cls.get_generated_sections(report_id)
        for section_info in sections:
            md_content += section_info["content"]

        # Post-processing: Clean up title issues throughout the report
        md_content = cls._post_process_report(md_content, outline)

        # Save full report
        full_path = cls._get_report_markdown_path(report_id)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(md_content)

        logger.info(f"Full report assembled: {report_id}")
        return md_content

    @classmethod
    def _post_process_report(cls, content: str, outline: ReportOutline) -> str:
        """
        Post-processing report content

        1. Remove duplicate titles
        2. Keep the main report title (#) and section titles (##), and remove other levels of titles (###, ####wait)
        3. Clean up extra blank lines and separators

        Args:
            content: Original report content
            outline: Report outline

        Returns:
            Processed content
        """
        import re

        lines = content.split('\n')
        processed_lines = []
        prev_was_heading = False

        # Collect all chapter titles in the outline
        section_titles = set()
        for section in outline.sections:
            section_titles.add(section.title)

        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()

            # Check if it is a header row
            heading_match = re.match(r'^(#{1,6})\s+(.+)$', stripped)

            if heading_match:
                level = len(heading_match.group(1))
                title = heading_match.group(2).strip()

                # Check whether it is a duplicate title (titles with the same content appear within 5 consecutive lines)
                is_duplicate = False
                for j in range(max(0, len(processed_lines) - 5), len(processed_lines)):
                    prev_line = processed_lines[j].strip()
                    prev_match = re.match(r'^(#{1,6})\s+(.+)$', prev_line)
                    if prev_match:
                        prev_title = prev_match.group(2).strip()
                        if prev_title == title:
                            is_duplicate = True
                            break

                if is_duplicate:
                    # Skip repeated headers and empty lines after them
                    i += 1
                    while i < len(lines) and lines[i].strip() == '':
                        i += 1
                    continue

                # Title level processing:
                # - # (level=1) Keep only the main report title
                # - ## (level=2) Keep chapter titles
                # - ### and below (level>=3) Convert to bold text

                if level == 1:
                    if title == outline.title:
                        # Keep report main title
                        processed_lines.append(line)
                        prev_was_heading = True
                    elif title in section_titles:
                        # Chapter title incorrectly uses #, corrected to ##
                        processed_lines.append(f"## {title}")
                        prev_was_heading = True
                    else:
                        # Other first-level headings are made bold
                        processed_lines.append(f"**{title}**")
                        processed_lines.append("")
                        prev_was_heading = False
                elif level == 2:
                    if title in section_titles or title == outline.title:
                        # Keep chapter titles
                        processed_lines.append(line)
                        prev_was_heading = True
                    else:
                        # Second-level headings that are not chapters are made bold
                        processed_lines.append(f"**{title}**")
                        processed_lines.append("")
                        prev_was_heading = False
                else:
                    # ### Titles at and below levels are converted to bold text
                    processed_lines.append(f"**{title}**")
                    processed_lines.append("")
                    prev_was_heading = False

                i += 1
                continue

            elif stripped == '---' and prev_was_heading:
                # Skip the separator immediately following the title
                i += 1
                continue

            elif stripped == '' and prev_was_heading:
                # Leave only a blank line after the title
                if processed_lines and processed_lines[-1].strip() != '':
                    processed_lines.append(line)
                prev_was_heading = False

            else:
                processed_lines.append(line)
                prev_was_heading = False

            i += 1

        # Clean multiple consecutive empty lines (keep up to 2)
        result_lines = []
        empty_count = 0
        for line in processed_lines:
            if line.strip() == '':
                empty_count += 1
                if empty_count <= 2:
                    result_lines.append(line)
            else:
                empty_count = 0
                result_lines.append(line)

        return '\n'.join(result_lines)

    @classmethod
    def save_report(cls, report: Report) -> None:
        """Save report meta information and full report"""
        cls._ensure_report_folder(report.report_id)

        # Save meta information JSON
        with open(cls._get_report_path(report.report_id), 'w', encoding='utf-8') as f:
            json.dump(report.to_dict(), f, ensure_ascii=False, indent=2)

        # save outline
        if report.outline:
            cls.save_outline(report.report_id, report.outline)

        # Save complete Markdown report
        if report.markdown_content:
            with open(cls._get_report_markdown_path(report.report_id), 'w', encoding='utf-8') as f:
                f.write(report.markdown_content)

        logger.info(f"Report saved: {report.report_id}")

    @classmethod
    def get_report(cls, report_id: str) -> Optional[Report]:
        """Get report"""
        path = cls._get_report_path(report_id)

        if not os.path.exists(path):
            # Compatible with older formats: Check files stored directly in the reports directory
            old_path = os.path.join(cls.REPORTS_DIR, f"{report_id}.json")
            if os.path.exists(old_path):
                path = old_path
            else:
                return None

        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Rebuild Report object
        outline = None
        if data.get('outline'):
            outline_data = data['outline']
            sections = []
            for s in outline_data.get('sections', []):
                sections.append(ReportSection(
                    title=s['title'],
                    content=s.get('content', '')
                ))
            outline = ReportOutline(
                title=outline_data['title'],
                summary=outline_data['summary'],
                sections=sections
            )

        # if markdown_contentis empty, try starting from full_report.mdread
        markdown_content = data.get('markdown_content', '')
        if not markdown_content:
            full_report_path = cls._get_report_markdown_path(report_id)
            if os.path.exists(full_report_path):
                with open(full_report_path, 'r', encoding='utf-8') as f:
                    markdown_content = f.read()

        return Report(
            report_id=data['report_id'],
            simulation_id=data['simulation_id'],
            graph_id=data['graph_id'],
            simulation_requirement=data['simulation_requirement'],
            status=ReportStatus(data['status']),
            outline=outline,
            markdown_content=markdown_content,
            created_at=data.get('created_at', ''),
            completed_at=data.get('completed_at', ''),
            error=data.get('error')
        )

    @classmethod
    def get_report_by_simulation(cls, simulation_id: str) -> Optional[Report]:
        """Get reports based on impersonation ID"""
        cls._ensure_reports_dir()

        for item in os.listdir(cls.REPORTS_DIR):
            item_path = os.path.join(cls.REPORTS_DIR, item)
            # New format: folder
            if os.path.isdir(item_path):
                report = cls.get_report(item)
                if report and report.simulation_id == simulation_id:
                    return report
            # Compatible with old formats: JSON files
            elif item.endswith('.json'):
                report_id = item[:-5]
                report = cls.get_report(report_id)
                if report and report.simulation_id == simulation_id:
                    return report

        return None

    @classmethod
    def list_reports(cls, simulation_id: Optional[str] = None, limit: int = 50) -> List[Report]:
        """list reports"""
        cls._ensure_reports_dir()

        reports = []
        for item in os.listdir(cls.REPORTS_DIR):
            item_path = os.path.join(cls.REPORTS_DIR, item)
            # New format: folder
            if os.path.isdir(item_path):
                report = cls.get_report(item)
                if report:
                    if simulation_id is None or report.simulation_id == simulation_id:
                        reports.append(report)
            # Compatible with old formats: JSON files
            elif item.endswith('.json'):
                report_id = item[:-5]
                report = cls.get_report(report_id)
                if report:
                    if simulation_id is None or report.simulation_id == simulation_id:
                        reports.append(report)

        # In descending order of creation time
        reports.sort(key=lambda r: r.created_at, reverse=True)

        return reports[:limit]

    @classmethod
    def delete_report(cls, report_id: str) -> bool:
        """Delete report (entire folder)"""
        import shutil

        folder_path = cls._get_report_folder(report_id)

        # New format: delete entire folder
        if os.path.exists(folder_path) and os.path.isdir(folder_path):
            shutil.rmtree(folder_path)
            logger.info(f"Report folder deleted: {report_id}")
            return True

        # Compatible with older formats: delete individual files
        deleted = False
        old_json_path = os.path.join(cls.REPORTS_DIR, f"{report_id}.json")
        old_md_path = os.path.join(cls.REPORTS_DIR, f"{report_id}.md")

        if os.path.exists(old_json_path):
            os.remove(old_json_path)
            deleted = True
        if os.path.exists(old_md_path):
            os.remove(old_md_path)
            deleted = True

        return deleted
