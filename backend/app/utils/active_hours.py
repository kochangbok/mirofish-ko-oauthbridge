import re
from typing import Iterable, List, Optional


_HOUR_PATTERN = re.compile(r'(\d{1,2})(?::\d{2})?')


def _expand_hour_range(start: int, end: int) -> List[int]:
    if start < 0 or start > 23 or end < 0 or end > 23:
        return []
    if start <= end:
        return list(range(start, end + 1))
    return list(range(start, 24)) + list(range(0, end + 1))


def _parse_hour_token(token) -> List[int]:
    if isinstance(token, int):
        return [token] if 0 <= token <= 23 else []

    if token is None:
        return []

    text = str(token).strip()
    if not text:
        return []

    if text.isdigit():
        hour = int(text)
        return [hour] if 0 <= hour <= 23 else []

    normalized = re.sub(r'\s+', '', text).replace('~', '-').replace('–', '-').replace('—', '-')

    if '-' in normalized:
        matches = _HOUR_PATTERN.findall(normalized)
        if len(matches) >= 2:
            return _expand_hour_range(int(matches[0]), int(matches[1]))

    matches = _HOUR_PATTERN.findall(normalized)
    if len(matches) == 1:
        hour = int(matches[0])
        return [hour] if 0 <= hour <= 23 else []

    return []


def normalize_active_hours(raw_active_hours, default: Optional[Iterable[int]] = None) -> List[int]:
    fallback = list(default) if default is not None else list(range(9, 23))
    if raw_active_hours is None:
        return fallback

    tokens = raw_active_hours if isinstance(raw_active_hours, list) else [raw_active_hours]
    parsed: List[int] = []

    for token in tokens:
        parsed.extend(_parse_hour_token(token))

    normalized = sorted({hour for hour in parsed if 0 <= hour <= 23})
    return normalized or fallback
