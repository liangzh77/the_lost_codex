from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, LearningRecord, UserAchievement, UserWordProgress
from auth import get_current_user

router = APIRouter(prefix="/api/growth", tags=["growth"])

LEVEL_THRESHOLDS = [0, 10, 30, 70, 150, 300, 500, 800, 1200, 2000, 3000]

ACHIEVEMENTS = {
    "deep_cultivator": {
        "icon": "🌱",
        "tiers": [
            {"name": "晨读", "desc": "单日印记≥20", "threshold": 20},
            {"name": "苦读", "desc": "单日印记≥50", "threshold": 50},
            {"name": "夜读", "desc": "单日印记≥100", "threshold": 100},
            {"name": "通宵达旦", "desc": "单日印记≥200", "threshold": 200},
            {"name": "废寝忘食", "desc": "单日印记≥500", "threshold": 500},
        ],
    },
    "imprint_collector": {
        "icon": "✒️",
        "tiers": [
            {"name": "墨点", "desc": "累计印记≥50", "threshold": 50},
            {"name": "墨痕", "desc": "累计印记≥200", "threshold": 200},
            {"name": "墨迹", "desc": "累计印记≥500", "threshold": 500},
            {"name": "墨卷", "desc": "累计印记≥1000", "threshold": 1000},
            {"name": "墨海", "desc": "累计印记≥3000", "threshold": 3000},
        ],
    },
    "spelling_master": {
        "icon": "🖊️",
        "tiers": [
            {"name": "描红", "desc": "累计拼写正确≥20次", "threshold": 20},
            {"name": "临帖", "desc": "累计拼写正确≥50次", "threshold": 50},
            {"name": "挥毫", "desc": "累计拼写正确≥100次", "threshold": 100},
            {"name": "泼墨", "desc": "累计拼写正确≥300次", "threshold": 300},
            {"name": "入木三分", "desc": "累计拼写正确≥1000次", "threshold": 1000},
        ],
    },
    "century": {
        "icon": "📖",
        "tiers": [
            {"name": "识字", "desc": "掌握≥20个单词", "threshold": 20},
            {"name": "识文", "desc": "累计学习≥50个单���", "threshold": 50},
            {"name": "通文", "desc": "掌握≥100个单词", "threshold": 100},
            {"name": "博文", "desc": "掌握≥300个单词", "threshold": 300},
            {"name": "万卷", "desc": "掌握≥1000个单词", "threshold": 1000},
        ],
    },
}


def calc_imprints(record: LearningRecord) -> int:
    """答对一题+1印���，拼写对+2印记"""
    imprints = 0
    if record.total_questions > 0:
        imprints += record.correct_answers
    imprints += record.spelling_correct * 2
    return imprints


def get_level(total_imprints: int) -> tuple[int, str]:
    level = 0
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if total_imprints >= threshold:
            level = i
    names = ["初学者", "入门", "进阶", "熟练", "精通", "大师", "宗师", "传奇", "神话", "至尊", "无上"]
    return level, names[min(level, len(names) - 1)]


@router.get("/stats")
def get_growth_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    all_records = db.query(LearningRecord).filter(LearningRecord.user_id == user.id).all()
    today_records = [r for r in all_records if r.studied_at.date() == today]

    total_imprints = sum(calc_imprints(r) for r in all_records)
    today_imprints = sum(calc_imprints(r) for r in today_records)
    level, level_name = get_level(total_imprints)
    next_threshold = LEVEL_THRESHOLDS[level + 1] if level + 1 < len(LEVEL_THRESHOLDS) else None

    return {
        "today_imprints": today_imprints,
        "total_imprints": total_imprints,
        "level": level,
        "level_name": level_name,
        "next_level_imprints": next_threshold,
    }


@router.get("/heatmap")
def get_heatmap(
    days: int = Query(default=90),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start = date.today() - timedelta(days=days - 1)
    records = (
        db.query(LearningRecord)
        .filter(LearningRecord.user_id == user.id, LearningRecord.studied_at >= datetime.combine(start, datetime.min.time()))
        .all()
    )
    daily: dict[str, int] = {}
    for r in records:
        d = str(r.studied_at.date())
        daily[d] = daily.get(d, 0) + calc_imprints(r)
    result = []
    for i in range(days):
        d = str(start + timedelta(days=i))
        result.append({"date": d, "count": daily.get(d, 0)})
    return result


@router.get("/imprint-curve")
def get_imprint_curve(
    days: int = Query(default=30),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    all_records = db.query(LearningRecord).filter(LearningRecord.user_id == user.id).all()

    if days <= 0 and all_records:
        # 全部：从最早记录日期到今天
        earliest = min(r.studied_at.date() for r in all_records)
        start = earliest
        actual_days = (date.today() - earliest).days + 1
    else:
        start = date.today() - timedelta(days=days - 1)
        actual_days = days

    daily: dict[str, dict] = {}
    for r in all_records:
        d = str(r.studied_at.date())
        if d not in daily:
            daily[d] = {"imprints": 0, "spelling_imprints": 0}
        daily[d]["imprints"] += calc_imprints(r)
        daily[d]["spelling_imprints"] += r.spelling_correct * 2

    result = []
    for i in range(actual_days):
        d = str(start + timedelta(days=i))
        day_data = daily.get(d, {"imprints": 0, "spelling_imprints": 0})
        result.append({
            "date": d,
            "imprints": day_data["imprints"],
            "spelling_imprints": day_data["spelling_imprints"],
        })
    return result


def _calc_achievement_value(key: str, all_records: list[LearningRecord], today: date, user: User = None, db: Session = None) -> tuple[int, str]:
    """计算成就的当前数值和单位"""
    if key == "deep_cultivator":
        return sum(calc_imprints(r) for r in all_records if r.studied_at.date() == today), "今日印记"
    elif key == "imprint_collector":
        return sum(calc_imprints(r) for r in all_records), "累计印记"
    elif key == "spelling_master":
        return sum(r.spelling_correct for r in all_records), "拼写正确"
    elif key == "century":
        from services.spaced_repetition import get_total_stages
        total_stages = get_total_stages(user.review_intervals)
        mastered = (
            db.query(UserWordProgress)
            .filter(UserWordProgress.user_id == user.id, UserWordProgress.current_stage >= total_stages)
            .count()
        )
        return mastered, "已掌握单词"
    return 0, ""


@router.get("/achievements")
def get_achievements(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 已解锁的成就 key 格式: "deep_cultivator_0", "deep_cultivator_1", ...
    unlocked_rows = db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()
    unlocked = {a.achievement_key: str(a.unlocked_at) for a in unlocked_rows}

    all_records = db.query(LearningRecord).filter(LearningRecord.user_id == user.id).all()
    today = date.today()

    result = []
    for key, info in ACHIEVEMENTS.items():
        value, unit = _calc_achievement_value(key, all_records, today, user, db)
        tiers = info["tiers"]

        # 找到当前已达到的最高阶梯
        current_tier = -1
        for i, tier in enumerate(tiers):
            if value >= tier["threshold"]:
                current_tier = i

        # 下一个要解锁的阶梯
        next_tier = current_tier + 1
        if next_tier < len(tiers):
            tier = tiers[next_tier]
            progress = min(value / tier["threshold"], 0.99)
            target = f"{unit} {value}/{tier['threshold']}"
        else:
            tier = tiers[-1]
            progress = 1.0
            target = f"{unit} {value}/{tiers[-1]['threshold']}"

        # 显示名 = 当前已解锁的阶梯名，未解锁任何则显示下一个
        display_tier = tiers[current_tier] if current_tier >= 0 else tiers[0]

        result.append({
            "key": key,
            "name": display_tier["name"],
            "desc": display_tier["desc"],
            "icon": info["icon"],
            "tier": current_tier + 1,  # 1-based, 0=未解锁
            "max_tier": len(tiers),
            "next_name": tiers[next_tier]["name"] if next_tier < len(tiers) else None,
            "unlocked": current_tier >= 0,
            "progress": round(progress, 2),
            "target": target,
            "value": value,
            "all_tiers": [{"name": t["name"], "desc": t["desc"], "threshold": t["threshold"]} for t in tiers],
        })

        # auto-unlock new tiers
        for i in range(current_tier + 1):
            ak = f"{key}_{i}"
            if ak not in unlocked:
                ua = UserAchievement(user_id=user.id, achievement_key=ak, unlocked_at=datetime.now())
                db.add(ua)
                unlocked[ak] = str(datetime.now())

    db.commit()
    return result
