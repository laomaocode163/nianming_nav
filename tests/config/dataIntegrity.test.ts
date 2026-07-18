import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateReferentialIntegrity } from '../../src/config/loadConfig';
import type { Category, Link } from '../../src/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

// 直接加载仓库中已提交的真实数据，确保「重复 id / 引用失效」等问题在
// 提交前（husky 预提交跑 vitest）与 CI 中被自动捕获，而不是等到运行时才报错。
const categories = JSON.parse(
  readFileSync(resolve(ROOT, 'src/config/data/categories.json'), 'utf-8')
) as unknown as Category[];
const links = JSON.parse(
  readFileSync(resolve(ROOT, 'src/config/data/links.json'), 'utf-8')
) as unknown as Link[];

describe('已提交站点数据的完整性 (links.json / categories.json)', () => {
  it('链接 id 全局唯一（无重复）', () => {
    const ids = links.map((l) => l.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dup, `发现重复链接 id: ${[...new Set(dup)].join(', ')}`).toEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('通过 validateReferentialIntegrity 的全部引用与唯一性校验', () => {
    expect(() => validateReferentialIntegrity(categories, links)).not.toThrow();
  });
});
