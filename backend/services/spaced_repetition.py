from datetime import date, timedelta

# 默认艾宾浩斯间隔重复：累计天数
DEFAULT_INTERVALS = [1, 2, 4, 7, 15, 30]


def parse_intervals(intervals_str: str) -> list[int]:
    """解析逗号分隔的间隔字符串"""
    try:
        return [int(x.strip()) for x in intervals_str.split(",")]
    except Exception:
        return DEFAULT_INTERVALS


def get_total_stages(intervals_str: str = None) -> int:
    intervals = parse_intervals(intervals_str) if intervals_str else DEFAULT_INTERVALS
    return len(intervals)


TOTAL_STAGES = len(DEFAULT_INTERVALS)


def get_next_review_date(current_stage: int, today: date | None = None, intervals_str: str = None) -> date:
    """根据当前阶段计算下次复习日期"""
    if today is None:
        today = date.today()
    intervals = parse_intervals(intervals_str) if intervals_str else DEFAULT_INTERVALS
    total = len(intervals)
    if current_stage >= total:
        return today
    if current_stage == 0:
        days = intervals[0]
    else:
        days = intervals[current_stage] - intervals[current_stage - 1]
    return today + timedelta(days=days)


def is_mastered(current_stage: int, intervals_str: str = None) -> bool:
    """是否已掌握（完成全部复习轮次）"""
    intervals = parse_intervals(intervals_str) if intervals_str else DEFAULT_INTERVALS
    return current_stage >= len(intervals)
