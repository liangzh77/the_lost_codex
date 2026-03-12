from datetime import date, timedelta

# 艾宾浩斯间隔重复：累计天数
REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30]
TOTAL_STAGES = len(REVIEW_INTERVALS)


def get_next_review_date(current_stage: int, today: date | None = None) -> date:
    """根据当前阶段计算下次复习日期"""
    if today is None:
        today = date.today()
    if current_stage >= TOTAL_STAGES:
        return today  # 已完成全部复习
    if current_stage == 0:
        days = REVIEW_INTERVALS[0]
    else:
        days = REVIEW_INTERVALS[current_stage] - REVIEW_INTERVALS[current_stage - 1]
    return today + timedelta(days=days)


def is_mastered(current_stage: int) -> bool:
    """是否已掌握（完成全部复习轮次）"""
    return current_stage >= TOTAL_STAGES
