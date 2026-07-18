/**
 * similarity.mjs —— 新增网站「智能分组」的核心相似度算法（纯函数、零依赖、可单测）。
 *
 * 思路：把每条链接的 name + description + hostname 当作一篇「文档」，
 * 按二级分类（subCategory）聚合成员文档，构建 TF-IDF 代表向量；
 * 候选网页同样向量化后，与各二级分类向量求余弦相似度，取最高者作为最匹配分组。
 * 当最高相似度低于阈值时，仅给出「建议新建二级分类」的父级分类，不写入任何数据。
 *
 * 该模块不含任何 IO，可被 CLI（suggest-category.mjs）与单元测试直接复用。
 */

// ---------------------------------------------------------------------------
// 可调参数（满足「可扩展性」：分词策略、阈值均集中于此，便于后续调优）
// ---------------------------------------------------------------------------

/** 相似度阈值：最高相似度低于此值即视为「无匹配分组」，仅建议新建。 */
export const SIMILARITY_THRESHOLD = 0.12;

/**
 * 停用词表：仅收录真正无区分度的功能词、代词、助词与域名后缀，
 * 刻意保留「平台 / 工具 / 模型 / 智能 / 教程」等带分类信号的词，避免误伤归类。
 */
const STOPWORDS = new Set([
  // 中文功能词 / 代词 / 助词
  '的',
  '了',
  '和',
  '与',
  '及',
  '是',
  '在',
  '我',
  '你',
  '他',
  '她',
  '它',
  '这',
  '那',
  '有',
  '为',
  '对',
  '等',
  '也',
  '都',
  '就',
  '还',
  '很',
  '更',
  '最',
  '不',
  '无',
  '个',
  '种',
  '类',
  '些',
  '如',
  '或',
  '并',
  '且',
  '但',
  '而',
  '其',
  '该',
  '各',
  '全',
  '多',
  '小',
  '大',
  '上',
  '下',
  '中',
  '内',
  '外',
  '一',
  '二',
  '三',
  '四',
  '五',
  '之',
  '于',
  // 英文 filler
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'for',
  'to',
  'of',
  'in',
  'on',
  'at',
  'by',
  'with',
  'from',
  'into',
  'via',
  'is',
  'are',
  'be',
  'will',
  'can',
  'may',
  'this',
  'that',
  'these',
  'those',
  'your',
  'you',
  'we',
  'they',
  'it',
  // 域名 / 协议噪声
  'http',
  'https',
  'www',
  'com',
  'net',
  'org',
  'cn',
  'io',
  'app',
  'api',
]);

// ---------------------------------------------------------------------------
// 文本特征提取
// ---------------------------------------------------------------------------

/**
 * 从文本中提取关键词 token：
 *  - 拉丁/数字连续串（≥2 字符）作为一个 token（小写）；
 *  - 中文（CJK）按相邻二元文法（bigram）切分，无需分词库即可捕捉组合语义；
 *  - 过滤停用词。
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  if (!text) return [];
  const lower = String(text).toLowerCase();
  const tokens = [];

  // 拉丁 / 数字 token
  const latinRe = /[a-z0-9]{2,}/g;
  let m;
  while ((m = latinRe.exec(lower)) !== null) {
    const tok = m[0];
    if (!STOPWORDS.has(tok)) tokens.push(tok);
  }

  // 中文二元文法
  const cjkChars = [...lower].filter((ch) => /[一-鿿]/.test(ch));
  for (let i = 0; i + 1 < cjkChars.length; i++) {
    const bg = cjkChars[i] + cjkChars[i + 1];
    if (!STOPWORDS.has(bg)) tokens.push(bg);
  }

  return tokens;
}

/** 提取 URL 的主机名（去掉 www. 前缀），失败返回空串。 */
export function hostnameOf(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// TF-IDF 向量
// ---------------------------------------------------------------------------

/** 词频统计：token -> count */
function termFreq(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

/**
 * 计算逆文档频 IDF。documents 是一组 token 数组（每个二级分类 / 分类为一篇文档）。
 * 采用平滑公式 ln((N+1)/(df+1)) + 1，避免全文档共现词权重归零。
 * @param {string[][]} documents
 * @returns {Map<string, number>}
 */
export function computeIdf(documents) {
  const N = documents.length;
  const df = new Map();
  for (const tokens of documents) {
    const seen = new Set(tokens);
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const idf = new Map();
  for (const [t, d] of df) idf.set(t, Math.log((N + 1) / (d + 1)) + 1);
  return idf;
}

/** 由 token 列表与 IDF 表构建 TF-IDF 向量（term -> weight）。 */
function tfidf(tokens, idf) {
  const tf = termFreq(tokens);
  const vec = new Map();
  for (const [t, f] of tf) {
    const w = f * (idf.get(t) ?? 0);
    if (w > 0) vec.set(t, w);
  }
  return vec;
}

/** 余弦相似度（稀疏向量）。任一向量为空返回 0。 */
export function cosine(a, b) {
  let dot = 0;
  for (const [t, w] of a) {
    const bw = b.get(t);
    if (bw) dot += w * bw;
  }
  if (dot === 0) return 0;
  let na = 0;
  for (const w of a.values()) na += w * w;
  let nb = 0;
  for (const w of b.values()) nb += w * w;
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ---------------------------------------------------------------------------
// 语料构建与归类建议
// ---------------------------------------------------------------------------

/**
 * 构建语料：按二级分类聚合成员链接文本，同时按顶级分类聚合（用于无匹配时建议父分类）。
 * @param {Array<{categoryId:string, subCategoryId?:string, name:string, url:string, description?:string}>} links
 * @param {Array<{id:string, name:string, subCategories?:Array<{id:string, name:string}>}>} categories
 */
export function buildCorpus(links, categories) {
  const textOf = (l) => `${l.name} ${l.description ?? ''} ${hostnameOf(l.url)}`;

  const subGroups = [];
  for (const cat of categories) {
    for (const sub of cat.subCategories ?? []) {
      const members = links.filter((l) => l.categoryId === cat.id && l.subCategoryId === sub.id);
      const tokens = [];
      for (const m of members) tokens.push(...tokenize(textOf(m)));
      subGroups.push({
        categoryId: cat.id,
        categoryName: cat.name,
        subCategoryId: sub.id,
        subCategoryName: sub.name,
        tokens,
      });
    }
  }

  const catGroups = [];
  for (const cat of categories) {
    const members = links.filter((l) => l.categoryId === cat.id);
    const tokens = [];
    for (const m of members) tokens.push(...tokenize(textOf(m)));
    catGroups.push({ categoryId: cat.id, categoryName: cat.name, tokens });
  }

  return { subGroups, catGroups };
}

/**
 * 计算候选网页最匹配的功能分组。
 * @param {{name:string, url:string, description?:string}} candidate
 * @param {Array<{categoryId:string, subCategoryId?:string, name:string, url:string, description?:string}>} links
 * @param {Array<{id:string, name:string, subCategories?:Array<{id:string, name:string}>}>} categories
 * @param {number} [threshold]
 * @returns {{
 *   best: {categoryId:string, categoryName:string, subCategoryId:string, subCategoryName:string, score:number} | null,
 *   secondBest: {categoryId:string, categoryName:string, subCategoryId:string, subCategoryName:string, score:number} | null,
 *   belowThreshold: boolean,
 *   suggestedNewParent: {categoryId:string, categoryName:string, score:number} | null
 * }}
 */
export function suggestCategory(candidate, links, categories, threshold = SIMILARITY_THRESHOLD) {
  const { subGroups } = buildCorpus(links, categories);
  const idf = computeIdf(subGroups.map((g) => g.tokens));

  const subVecs = subGroups.map((g) => tfidf(g.tokens, idf));

  const candTokens = tokenize(
    `${candidate.name} ${candidate.description ?? ''} ${hostnameOf(candidate.url)}`
  );
  const candVec = tfidf(candTokens, idf);

  const subScores = subGroups
    .map((g, i) => ({
      categoryId: g.categoryId,
      categoryName: g.categoryName,
      subCategoryId: g.subCategoryId,
      subCategoryName: g.subCategoryName,
      score: cosine(candVec, subVecs[i]),
    }))
    .sort((a, b) => b.score - a.score);

  const best = subScores[0] ?? null;
  const secondBest = subScores[1] ?? null;
  const belowThreshold = !best || best.score < threshold;
  // 无匹配时，以「最接近的分组」所属顶级分类作为建议新建二级分类的父级，
  // 保证建议归属与最相似分组保持一致（而非另算一套分类级向量）。
  const suggestedNewParent =
    belowThreshold && best
      ? { categoryId: best.categoryId, categoryName: best.categoryName, score: best.score }
      : null;

  return { best, secondBest, belowThreshold, suggestedNewParent };
}
