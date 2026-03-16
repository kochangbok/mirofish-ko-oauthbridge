"""
온톨로지 생성 서비스
문서와 시뮬레이션 요구를 분석해 사회 시뮬레이션용 엔터티/관계 타입 정의를 생성한다.
"""

import json
from typing import Dict, Any, List, Optional
from ..utils.llm_client import LLMClient


# 온톨로지 생성 시스템 프롬프트
ONTOLOGY_SYSTEM_PROMPT = """너는 소셜 시뮬레이션용 지식그래프 온톨로지 설계 전문가다. 주어진 문서와 시뮬레이션 요구를 분석해 **한국어 중심의 엔터티 타입/관계 타입 스키마**를 설계하라.

**중요: 반드시 유효한 JSON만 출력하고, 설명문이나 마크다운을 덧붙이지 마라.**

## 핵심 배경

우리는 소셜 미디어 여론 시뮬레이션 시스템을 만들고 있다. 이 시스템에서:
- 각 엔터티는 소셜 미디어에서 발화하고 상호작용하며 정보를 전파할 수 있는 계정 또는 주체다.
- 엔터티들은 서로 영향을 주고, 게시물을 올리고, 댓글을 남기고, 반응한다.
- 특정 사건에서 정보 확산 경로와 주체별 반응을 시뮬레이션해야 한다.

따라서 엔터티는 **현실에서 실제로 발화/행동할 수 있는 주체**여야 한다.

### 포함 가능 예시
- 구체적인 개인(공직자, 기자, 전문가, 당사자, 일반 시민 등)
- 기업/기관/단체의 공식 계정
- 정부 부처, 규제기관, 공공기관
- 언론사, 플랫폼, 커뮤니티 운영 주체
- 특정 이해관계 집단을 대표하는 계정

### 포함하면 안 되는 것
- 추상 개념(예: 여론, 공포, 분위기)
- 단순 주제/토픽(예: 세금개편, 교육개혁)
- 관점 자체(예: 찬성파, 반대파)

## 출력 형식

다음 구조의 JSON을 출력하라:

```json
{
  "entity_types": [
    {
      "name": "엔터티 타입명(한국어, 짧은 명사형)",
      "description": "짧은 설명(한국어, 100자 이내)",
      "attributes": [
        {
          "name": "속성명(영문 snake_case)",
          "type": "text",
          "description": "속성 설명(한국어)"
        }
      ],
      "examples": ["예시 엔터티1", "예시 엔터티2"]
    }
  ],
  "edge_types": [
    {
      "name": "관계 타입명(한국어, 짧은 명사/동사구)",
      "description": "짧은 설명(한국어, 100자 이내)",
      "source_targets": [
        {"source": "출발 엔터티 타입", "target": "도착 엔터티 타입"}
      ],
      "attributes": []
    }
  ],
  "analysis_summary": "문서 내용의 간단한 분석 요약(자연스러운 한국어, 중국어 금지)"
}
```

## 언어 규칙

- `entity_types[].name`, `edge_types[].name`, `description`, `examples`, `analysis_summary`는 모두 **한국어**로 작성한다.
- `attributes[].name`만 영문 snake_case를 유지한다.
- 중국어를 쓰지 마라.

## 설계 규칙

### 1) 엔터티 타입 설계
- 반드시 **정확히 10개**의 엔터티 타입을 출력한다.
- 마지막 2개는 반드시 fallback 타입으로 둔다.
  - `개인`: 다른 구체 타입으로 분류되지 않는 자연인
  - `조직`: 다른 구체 타입으로 분류되지 않는 조직/기관
- 앞의 8개는 문서 내용에 맞는 구체 타입으로 설계한다.
- 각 타입은 실제 발화 주체가 되어야 하며, 서로 경계가 겹치지 않게 설계한다.

### 2) 관계 타입 설계
- 6~10개
- 소셜 미디어 상의 실제 상호작용/영향 관계를 반영한다.
- `source_targets`는 정의한 엔터티 타입을 충분히 포괄해야 한다.

### 3) 속성 설계
- 각 엔터티 타입에 1~3개의 핵심 속성만 둔다.
- 속성명은 `name`, `uuid`, `group_id`, `created_at`, `summary` 같은 예약어를 쓰지 마라.
- `full_name`, `org_name`, `role`, `position`, `location`, `description` 같은 이름을 우선 사용하라.
"""


class OntologyGenerator:
    """
    本体生成器
    分析文本内容，生成实体和关系类型定义
    """
    
    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.llm_client = llm_client or LLMClient()
    
    def generate(
        self,
        document_texts: List[str],
        simulation_requirement: str,
        additional_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        生成本体定义
        
        Args:
            document_texts: 文档文本列表
            simulation_requirement: 模拟需求描述
            additional_context: 额外上下文
            
        Returns:
            本体定义（entity_types, edge_types等）
        """
        # 构建用户消息
        user_message = self._build_user_message(
            document_texts, 
            simulation_requirement,
            additional_context
        )
        
        messages = [
            {"role": "system", "content": ONTOLOGY_SYSTEM_PROMPT},
            {"role": "user", "content": user_message}
        ]
        
        # 调用LLM
        result = self.llm_client.chat_json(
            messages=messages,
            temperature=0.3,
            max_tokens=4096
        )
        
        # 验证和后处理
        result = self._validate_and_process(result)
        
        return result
    
    # 传给 LLM 的文本最大长度（5万字）
    MAX_TEXT_LENGTH_FOR_LLM = 50000
    
    def _build_user_message(
        self,
        document_texts: List[str],
        simulation_requirement: str,
        additional_context: Optional[str]
    ) -> str:
        """构建用户消息"""
        
        # 合并文本
        combined_text = "\n\n---\n\n".join(document_texts)
        original_length = len(combined_text)
        
        # 如果文本超过5万字，截断（仅影响传给LLM的内容，不影响图谱构建）
        if len(combined_text) > self.MAX_TEXT_LENGTH_FOR_LLM:
            combined_text = combined_text[:self.MAX_TEXT_LENGTH_FOR_LLM]
            combined_text += f"\n\n...(原文共{original_length}字，已截取前{self.MAX_TEXT_LENGTH_FOR_LLM}字用于本体分析)..."
        
        message = f"""## 시뮬레이션 요구

{simulation_requirement}

## 문서 내용

{combined_text}
"""
        
        if additional_context:
            message += f"""
## 추가 설명

{additional_context}
"""
        
        message += """
위 내용을 바탕으로 사회 여론 시뮬레이션에 적합한 엔터티 타입과 관계 타입을 설계하라.

**반드시 지켜야 할 규칙**
1. 엔터티 타입은 정확히 10개여야 한다.
2. 마지막 2개는 fallback 타입 `개인`, `조직` 이어야 한다.
3. 앞의 8개는 문서 내용에 맞는 구체 타입이어야 한다.
4. 모든 엔터티 타입/관계 타입 이름은 한국어로 작성한다.
5. 속성명만 영문 snake_case를 사용한다.
6. `analysis_summary`는 자연스럽고 간결한 한국어로 작성하고 중국어를 쓰지 마라.
"""
        
        return message
    
    def _validate_and_process(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """验证和后处理结果"""
        
        # 确保必要字段存在
        if "entity_types" not in result:
            result["entity_types"] = []
        if "edge_types" not in result:
            result["edge_types"] = []
        if "analysis_summary" not in result:
            result["analysis_summary"] = ""
        
        # 验证实体类型
        for entity in result["entity_types"]:
            if "attributes" not in entity:
                entity["attributes"] = []
            if "examples" not in entity:
                entity["examples"] = []
            # 确保description不超过100字符
            if len(entity.get("description", "")) > 100:
                entity["description"] = entity["description"][:97] + "..."
        
        # 验证关系类型
        for edge in result["edge_types"]:
            if "source_targets" not in edge:
                edge["source_targets"] = []
            if "attributes" not in edge:
                edge["attributes"] = []
            if len(edge.get("description", "")) > 100:
                edge["description"] = edge["description"][:97] + "..."
        
        # Zep API 限制：最多 10 个自定义实体类型，最多 10 个自定义边类型
        MAX_ENTITY_TYPES = 10
        MAX_EDGE_TYPES = 10
        
        # 兜底类型定义
        person_fallback = {
            "name": "개인",
            "description": "다른 구체적 개인 타입에 속하지 않는 자연인",
            "attributes": [
                {"name": "full_name", "type": "text", "description": "개인의 이름"},
                {"name": "role", "type": "text", "description": "직업 또는 역할"}
            ],
            "examples": ["일반 시민", "익명 이용자"]
        }
        
        organization_fallback = {
            "name": "조직",
            "description": "다른 구체적 조직 타입에 속하지 않는 기관 또는 단체",
            "attributes": [
                {"name": "org_name", "type": "text", "description": "조직 이름"},
                {"name": "org_type", "type": "text", "description": "조직 유형"}
            ],
            "examples": ["소규모 단체", "지역 커뮤니티"]
        }
        
        # 检查是否已有兜底类型
        entity_names = {e["name"] for e in result["entity_types"]}
        has_person = "개인" in entity_names
        has_organization = "조직" in entity_names
        
        # 需要添加的兜底类型
        fallbacks_to_add = []
        if not has_person:
            fallbacks_to_add.append(person_fallback)
        if not has_organization:
            fallbacks_to_add.append(organization_fallback)
        
        if fallbacks_to_add:
            current_count = len(result["entity_types"])
            needed_slots = len(fallbacks_to_add)
            
            # 如果添加后会超过 10 个，需要移除一些现有类型
            if current_count + needed_slots > MAX_ENTITY_TYPES:
                # 计算需要移除多少个
                to_remove = current_count + needed_slots - MAX_ENTITY_TYPES
                # 从末尾移除（保留前面更重要的具体类型）
                result["entity_types"] = result["entity_types"][:-to_remove]
            
            # 添加兜底类型
            result["entity_types"].extend(fallbacks_to_add)
        
        # 最终确保不超过限制（防御性编程）
        if len(result["entity_types"]) > MAX_ENTITY_TYPES:
            result["entity_types"] = result["entity_types"][:MAX_ENTITY_TYPES]
        
        if len(result["edge_types"]) > MAX_EDGE_TYPES:
            result["edge_types"] = result["edge_types"][:MAX_EDGE_TYPES]
        
        return result
    
    def generate_python_code(self, ontology: Dict[str, Any]) -> str:
        """
        将本体定义转换为Python代码（类似ontology.py）
        
        Args:
            ontology: 本体定义
            
        Returns:
            Python代码字符串
        """
        code_lines = [
            '"""',
            '自定义实体类型定义',
            '由MiroFish自动生成，用于社会舆论模拟',
            '"""',
            '',
            'from pydantic import Field',
            'from zep_cloud.external_clients.ontology import EntityModel, EntityText, EdgeModel',
            '',
            '',
            '# ============== 实体类型定义 ==============',
            '',
        ]
        
        # 生成实体类型
        for entity in ontology.get("entity_types", []):
            name = entity["name"]
            desc = entity.get("description", f"A {name} entity.")
            
            code_lines.append(f'class {name}(EntityModel):')
            code_lines.append(f'    """{desc}"""')
            
            attrs = entity.get("attributes", [])
            if attrs:
                for attr in attrs:
                    attr_name = attr["name"]
                    attr_desc = attr.get("description", attr_name)
                    code_lines.append(f'    {attr_name}: EntityText = Field(')
                    code_lines.append(f'        description="{attr_desc}",')
                    code_lines.append(f'        default=None')
                    code_lines.append(f'    )')
            else:
                code_lines.append('    pass')
            
            code_lines.append('')
            code_lines.append('')
        
        code_lines.append('# ============== 关系类型定义 ==============')
        code_lines.append('')
        
        # 生成关系类型
        for edge in ontology.get("edge_types", []):
            name = edge["name"]
            # 转换为PascalCase类名
            class_name = ''.join(word.capitalize() for word in name.split('_'))
            desc = edge.get("description", f"A {name} relationship.")
            
            code_lines.append(f'class {class_name}(EdgeModel):')
            code_lines.append(f'    """{desc}"""')
            
            attrs = edge.get("attributes", [])
            if attrs:
                for attr in attrs:
                    attr_name = attr["name"]
                    attr_desc = attr.get("description", attr_name)
                    code_lines.append(f'    {attr_name}: EntityText = Field(')
                    code_lines.append(f'        description="{attr_desc}",')
                    code_lines.append(f'        default=None')
                    code_lines.append(f'    )')
            else:
                code_lines.append('    pass')
            
            code_lines.append('')
            code_lines.append('')
        
        # 生成类型字典
        code_lines.append('# ============== 类型配置 ==============')
        code_lines.append('')
        code_lines.append('ENTITY_TYPES = {')
        for entity in ontology.get("entity_types", []):
            name = entity["name"]
            code_lines.append(f'    "{name}": {name},')
        code_lines.append('}')
        code_lines.append('')
        code_lines.append('EDGE_TYPES = {')
        for edge in ontology.get("edge_types", []):
            name = edge["name"]
            class_name = ''.join(word.capitalize() for word in name.split('_'))
            code_lines.append(f'    "{name}": {class_name},')
        code_lines.append('}')
        code_lines.append('')
        
        # 生成边的source_targets映射
        code_lines.append('EDGE_SOURCE_TARGETS = {')
        for edge in ontology.get("edge_types", []):
            name = edge["name"]
            source_targets = edge.get("source_targets", [])
            if source_targets:
                st_list = ', '.join([
                    f'{{"source": "{st.get("source", "Entity")}", "target": "{st.get("target", "Entity")}"}}'
                    for st in source_targets
                ])
                code_lines.append(f'    "{name}": [{st_list}],')
        code_lines.append('}')
        
        return '\n'.join(code_lines)
