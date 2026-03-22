/**
 * 智能字母对比：使用最小编辑距离（Levenshtein）的回溯路径
 * 返回每个输入字母的状态：'correct' | 'wrong' | 'extra'
 * 以及目标中被跳过（用户少写）的位置
 */

export type CharStatus = 'correct' | 'wrong' | 'extra' | 'missing';

export interface DiffResult {
  chars: { char: string; status: CharStatus }[];
}

export function diffSpelling(input: string, target: string): DiffResult {
  const a = input.toLowerCase();
  const b = target.toLowerCase();
  const m = a.length;
  const n = b.length;

  // 构建编辑距离矩阵
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯路径
  const chars: { char: string; status: CharStatus }[] = [];
  let i = m, j = n;

  const ops: { type: 'match' | 'replace' | 'insert' | 'delete'; char: string }[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.unshift({ type: 'match', char: a[i - 1] });
      i--; j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      // replace
      ops.unshift({ type: 'replace', char: a[i - 1] });
      i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      // delete (extra char in input)
      ops.unshift({ type: 'delete', char: a[i - 1] });
      i--;
    } else {
      // insert (missing char in input)
      ops.unshift({ type: 'insert', char: '' });
      j--;
    }
  }

  for (const op of ops) {
    if (op.type === 'match') {
      chars.push({ char: op.char, status: 'correct' });
    } else if (op.type === 'replace') {
      chars.push({ char: op.char, status: 'wrong' });
    } else if (op.type === 'delete') {
      chars.push({ char: op.char, status: 'extra' });
    }
    // insert: 用户少写了一个字母，不显示
  }

  return { chars };
}
