/**
 * 统一随机工具函数
 * 所有页面的随机操作都从这里引入，避免各处重复实现 + 保证均匀分布。
 */

/** Fisher-Yates 洗牌（均匀分布，原地不修改原数组） */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** [min, max) 范围内的随机整数 */
export function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min));
}

/** 从数组中均匀随机取一个元素 */
export function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length)];
}
