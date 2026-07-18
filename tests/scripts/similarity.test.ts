import { describe, it, expect } from 'vitest';
import {
  tokenize,
  hostnameOf,
  computeIdf,
  cosine,
  suggestCategory,
  SIMILARITY_THRESHOLD,
} from '../../scripts/lib/similarity.mjs';

const categories = [
  {
    id: 'ai',
    name: '人工智能',
    subCategories: [
      { id: 'ai-tutorial', name: '工具教程' },
      { id: 'ai-coding', name: '代码编程' },
    ],
  },
  {
    id: 'dev',
    name: '开发工具',
    subCategories: [{ id: 'dev-proxy', name: '科学上网' }],
  },
];

const links = [
  {
    id: '1',
    name: 'Claude 教程',
    url: 'https://claude.com',
    categoryId: 'ai',
    subCategoryId: 'ai-tutorial',
    description: 'Claude 使用教程与指南',
  },
  {
    id: '2',
    name: 'GPT 教程',
    url: 'https://gpt.com',
    categoryId: 'ai',
    subCategoryId: 'ai-tutorial',
    description: 'GPT 使用教程与指南',
  },
  {
    id: '3',
    name: 'VS Code',
    url: 'https://code.visualstudio.com',
    categoryId: 'ai',
    subCategoryId: 'ai-coding',
    description: '代码编辑器编程工具',
  },
  {
    id: '4',
    name: 'Clash',
    url: 'https://clash.verge.dev',
    categoryId: 'dev',
    subCategoryId: 'dev-proxy',
    description: '代理客户端科学上网',
  },
];

describe('tokenize', () => {
  it('提取拉丁词并小写化、过滤停用词', () => {
    const tokens = tokenize('Claude Code 官方文档 https://www.anthropic.com');
    expect(tokens).toContain('claude');
    expect(tokens).toContain('code');
    expect(tokens).toContain('anthropic');
    // 停用词 / 域名噪声应被剔除
    expect(tokens).not.toContain('https');
    expect(tokens).not.toContain('www');
    expect(tokens).not.toContain('com');
  });

  it('中文按二元文法切分', () => {
    const tokens = tokenize('模型平台');
    expect(tokens).toContain('模型');
    expect(tokens).toContain('型平');
    expect(tokens).toContain('平台');
  });

  it('空文本返回空数组', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize(undefined as unknown as string)).toEqual([]);
  });
});

describe('hostnameOf', () => {
  it('去掉 www. 前缀', () => {
    expect(hostnameOf('https://www.example.com/path')).toBe('example.com');
    expect(hostnameOf('not-a-url')).toBe('');
  });
});

describe('computeIdf', () => {
  it('共现于所有文档的词 IDF 更低', () => {
    const docs = [
      ['alpha', 'beta'],
      ['alpha', 'gamma'],
      ['alpha', 'delta'],
    ];
    const idf = computeIdf(docs);
    expect(idf.get('alpha')!).toBeLessThan(idf.get('beta')!);
  });
});

describe('cosine', () => {
  it('相同向量相似度为 1，正交为 0', () => {
    const a = new Map([
      ['x', 1],
      ['y', 2],
    ]);
    expect(cosine(a, a)).toBeCloseTo(1, 5);
    const b = new Map([['z', 1]]);
    expect(cosine(a, b)).toBe(0);
  });
});

describe('suggestCategory', () => {
  it('将功能相近的候选归入最匹配二级分类（ai-tutorial）', () => {
    const result = suggestCategory(
      {
        name: 'Claude 入门',
        url: 'https://learn-claude.com',
        description: 'Claude 新手教程与指南',
      },
      links,
      categories
    );
    expect(result.best?.subCategoryId).toBe('ai-tutorial');
    expect(result.belowThreshold).toBe(false);
    if (result.secondBest) {
      expect(result.best!.score).toBeGreaterThanOrEqual(result.secondBest.score);
    }
  });

  it('无匹配分组时 belowThreshold 为真，并建议归属到最相近分组的父分类', () => {
    const result = suggestCategory(
      { name: '宠物猫', url: 'https://cutecats.example.com', description: '可爱猫咪日常照片' },
      links,
      categories
    );
    expect(result.belowThreshold).toBe(true);
    expect(result.best?.score ?? 0).toBeLessThan(SIMILARITY_THRESHOLD);
    // 建议父分类应与最接近分组同属一个顶级分类
    expect(result.suggestedNewParent?.categoryId).toBe(result.best?.categoryId);
  });

  it('导出了可调的相似度阈值常量', () => {
    expect(typeof SIMILARITY_THRESHOLD).toBe('number');
    expect(SIMILARITY_THRESHOLD).toBeGreaterThan(0);
  });
});
