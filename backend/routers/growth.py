from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import User, LearningRecord, UserAchievement, UserWordProgress
from auth import get_current_user
from services.spaced_repetition import get_total_stages

router = APIRouter(prefix="/api/growth", tags=["growth"])

LEVEL_THRESHOLDS = [0, 10, 30, 70, 150, 300, 500, 800, 1200, 2000, 3000]

ACHIEVEMENTS = {
    "deep_cultivator": {"name": "深耕者", "desc": "单日印记≥200", "icon": "🌱"},
    "high_energy": {"name": "高能反应", "desc": "累计能量≥500", "icon": "⚡"},
    "spelling_master": {"name": "拼写大师", "desc": "累计拼写正确≥100次", "icon": "🎯"},
    "century": {"name": "百词斩", "desc": "累计学习≥100个单词", "icon": "💯"},
    "tenacity": {"name": "韧性印记", "desc": "完成所有第30天复习", "icon": "🌉"},
}


def calc_energy(record: LearningRecord) -> int:
    e = 0
    if record.total_questions > 0 and record.correct_answers > record.total_questions / 2:
        e += 1
    e += record.spelling_correct * 2
    return e


def get_level(total_energy: int) -> tuple[int, str]:
    level = 0
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if total_energy >= threshold:
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

    total_imprints = len(all_records)
    today_imprints = len(today_records)
    total_energy = sum(calc_energy(r) for r in all_records)
    today_energy = sum(calc_energy(r) for r in today_records)
    level, level_name = get_level(total_energy)
    next_threshold = LEVEL_THRESHOLDS[level + 1] if level + 1 < len(LEVEL_THRESHOLDS) else None

    return {
        "today_imprints": today_imprints,
        "today_energy": today_energy,
        "total_imprints": total_imprints,
        "total_energy": total_energy,
        "level": level,
        "level_name": level_name,
        "next_level_energy": next_threshold,
    }


@router.get("/heatmap")
def get_heatmap(
    days: int = Query(default=90),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start = date.today() - timedelta(days=days - 1)
    rows = (
        db.query(
            func.date(LearningRecord.studied_at).label("day"),
            func.count(LearningRecord.id).label("count"),
        )
        .filter(LearningRecord.user_id == user.id, LearningRecord.studied_at >= datetime.combine(start, datetime.min.time()))
        .group_by(func.date(LearningRecord.studied_at))
        .all()
    )
    data = {str(r.day): r.count for r in rows}
    result = []
    for i in range(days):
        d = start + timedelta(days=i)
        result.append({"date": str(d), "count": data.get(str(d), 0)})
    return result


@router.get("/energy-curve")
def get_energy_curve(
    days: int = Query(default=30),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start = date.today() - timedelta(days=days - 1)
    records = (
        db.query(LearningRecord)
        .filter(LearningRecord.user_id == user.id, LearningRecord.studied_at >= datetime.combine(start, datetime.min.time()))
        .all()
    )
    daily = {}
    for r in records:
        d = str(r.studied_at.date())
        if d not in daily:
            daily[d] = {"energy": 0, "spelling_energy": 0}
        e = calc_energy(r)
        daily[d]["energy"] += e
        daily[d]["spelling_energy"] += r.spelling_correct * 2

    result = []
    cumulative = 0
    # get cumulative before start
    prior = (
        db.query(LearningRecord)
        .filter(LearningRecord.user_id == user.id, LearningRecord.studied_at < datetime.combine(start, datetime.min.time()))
        .all()
    )
    cumulative = sum(calc_energy(r) for r in prior)

    for i in range(days):
        d = str(start + timedelta(days=i))
        day_data = daily.get(d, {"energy": 0, "spelling_energy": 0})
        cumulative += day_data["energy"]
        result.append({
            "date": d,
            "energy": day_data["energy"],
            "spelling_energy": day_data["spelling_energy"],
            "cumulative": cumulative,
        })
    return result


@router.get("/achievements")
def get_achievements(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    unlocked = {
        a.achievement_key: str(a.unlocked_at)
        for a in db.query(UserAchievement).filter(UserAchievement.user_id == user.id).all()
    }
    all_records = db.query(LearningRecord).filter(LearningRecord.user_id == user.id).all()
    today = date.today()

    # calc progress for each achievement
    result = []
    for key, info in ACHIEVEMENTS.items():
        progress = 0.0
        target = ""

        if key == "deep_cultivator":
            today_count = sum(1 for r in all_records if r.studied_at.date() == today)
            progress = min(today_count / 200, 1.0)
            target = f"今日印记 {today_count}/200"

        elif key == "high_energy":
            total_e = sum(calc_energy(r) for r in all_records)
            progress = min(total_e / 500, 1.0)
            target = f"累计能量 {total_e}/500"

        elif key == "spelling_master":
            total_spelling = sum(r.spelling_correct for r in all_records)
            progress = min(total_spelling / 100, 1.0)
            target = f"累计拼写正确 {total_spelling}/100"

        elif key == "century":
            unique_words = len(set(r.word_id for r in all_records))
            progress = min(unique_words / 100, 1.0)
            target = f"已学 {unique_words}/100 个单词"

        elif key == "tenacity":
            total_stages = get_total_stages(user.review_intervals)
            mastered = (
                db.query(UserWordProgress)
                .filter(UserWordProgress.user_id == user.id, UserWordProgress.current_stage >= total_stages)
                .count()
            )
            total_learning = (
                db.query(UserWordProgress)
                .filter(UserWordProgress.user_id == user.id)
                .count()
            )
            progress = mastered / max(total_learning, 1)
            target = f"已掌握 {mastered}/{total_learning}"

        result.append({
            "key": key,
            "name": info["name"],
            "desc": info["desc"],
            "icon": info["icon"],
            "unlocked": key in unlocked,
            "unlocked_at": unlocked.get(key),
            "progress": round(progress, 2),
            "target": target,
        })

    # auto-unlock achievements
    for a in result:
        if not a["unlocked"] and a["progress"] >= 1.0:
            ua = UserAchievement(user_id=user.id, achievement_key=a["key"])
            db.add(ua)
            a["unlocked"] = True
            a["unlocked_at"] = str(datetime.now())
    db.commit()

    return result
