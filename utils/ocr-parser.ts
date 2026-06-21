import type { Category, Member, RecognizeResult } from "~/types";

export function parseOcrTextLocally(
  text: string,
  categories: Category[],
  members: Member[],
  categoryKeywords: Record<string, string[]>
): RecognizeResult {
  const cleanText = text.trim();

  // 1. 提取金额 (Amount)
  const amount = extractAmount(cleanText);

  // 2. 提取日期 (Date)
  const date = extractDate(cleanText);

  // 3. 提取时间 (Time)
  const time = extractTime(cleanText);

  // 4. 提取成员 (Members)
  const memberInfo = extractMember(cleanText, members);

  // 5. 提取分类 (Category)
  const categoryInfo = extractCategory(cleanText, categories, categoryKeywords);

  // 6. 提取描述 (Description)
  const description = extractDescription(cleanText);

  return {
    amount,
    category: categoryInfo.category,
    subcategory: categoryInfo.subcategory,
    date,
    time,
    members: memberInfo.names,
    description,
    confidence: 0.9, // 本地启发式匹配给出较高基础置信度
    category_id: categoryInfo.category_id,
    member_ids: memberInfo.ids,
  };
}

function extractAmount(text: string): number | null {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 金额正则匹配规则
  const amountRegexes = [
    // 合计/实付/支付等引导的金额
    /(?:合计|实付|应付|付款|支付|实收|交易金额|消费金额|总计|总额|金额|应收|总额|付款金额|total|amount|pay|sum)[:：\s]*(?:￥|¥|\$|元)?\s*([0-9]+\.[0-9]{2})\b/i,
    /(?:合计|实付|应付|付款|支付|实收|交易金额|消费金额|总计|总额|金额|应收|总额|付款金额|total|amount|pay|sum)[:：\s]*(?:￥|¥|\$|元)?\s*([0-9]+\.[0-9]{1,2})\b/i,
    /(?:合计|实付|应付|付款|支付|实收|交易金额|消费金额|总计|总额|金额|应收|总额|付款金额|total|amount|pay|sum)[:：\s]*(?:￥|¥|\$|元)?\s*([0-9]+)\b/i,
    // 带有货币符号的金额
    /(?:￥|¥|\$)\s*([0-9]+\.[0-9]{2})\b/,
    /(?:￥|¥|\$)\s*([0-9]+\.[0-9]{1,2})\b/,
    /(?:￥|¥|\$)\s*([0-9]+)\b/,
    // 带有“元”后缀的金额
    /([0-9]+\.[0-9]{2})\s*元/,
    /([0-9]+\.[0-9]{1,2})\s*元/,
    /([0-9]+)\s*元/
  ];

  // 1. 尝试按正则规则匹配每一行
  for (const line of lines) {
    for (const regex of amountRegexes) {
      const match = line.match(regex);
      if (match) {
        const val = parseFloat(match[1]);
        if (!isNaN(val) && val > 0 && val < 1000000) {
          return Math.round(val * 100) / 100;
        }
      }
    }
  }

  // 2. 如果规则匹配失败，扫描全文所有可能的浮点数
  const floatRegex = /\b[0-9]+\.[0-9]{1,2}\b/g;
  const matches = text.match(floatRegex);
  if (matches) {
    const candidates = matches
      .map(parseFloat)
      .filter(val => !isNaN(val) && val > 0 && val < 50000); // 排除过大的非法数
    
    if (candidates.length > 0) {
      // 账单收据中的最大数值通常是合计值
      return Math.max(...candidates);
    }
  }

  return null;
}

function extractDate(text: string): string | null {
  const fullDateRegex = /\b(20\d{2})[-/年.](0?[1-9]|1[0-2])[-/月.](0?[1-9]|[12]\d|3[01])日?\b/;
  const shortDateRegex = /\b(0?[1-9]|1[0-2])[-/月.](0?[1-9]|[12]\d|3[01])日?\b/;

  let match = text.match(fullDateRegex);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, "0");
    const day = match[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  match = text.match(shortDateRegex);
  if (match) {
    const year = new Date().getFullYear().toString();
    const month = match[1].padStart(2, "0");
    const day = match[2].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return null;
}

function extractTime(text: string): string | null {
  const timeRegex = /\b([01]?\d|2[0-3])[:：]([0-5]\d)(?:[:：]([0-5]\d))?\b/;
  const match = text.match(timeRegex);
  if (match) {
    const hour = match[1].padStart(2, "0");
    const minute = match[2].padStart(2, "0");
    const second = match[3] ? match[3].padStart(2, "0") : "00";
    return `${hour}:${minute}:${second}`;
  }
  return null;
}

function extractMember(text: string, members: Member[]): { names: string[]; ids: number[] } {
  const foundNames: string[] = [];
  const foundIds: number[] = [];

  for (const m of members) {
    if (m.name && text.includes(m.name)) {
      foundNames.push(m.name);
      foundIds.push(m.id);
    }
  }

  // 常见亲属称谓代称映射
  const mapping: Record<string, string> = {
    "老婆": "妻子",
    "老公": "丈夫",
    "媳妇": "妻子",
    "儿子": "孩子",
    "女儿": "孩子"
  };

  for (const [key, val] of Object.entries(mapping)) {
    if (text.includes(key)) {
      const match = members.find(m => m.name === val || m.name === key);
      if (match && !foundIds.includes(match.id)) {
        foundNames.push(match.name);
        foundIds.push(match.id);
      }
    }
  }

  return { names: foundNames, ids: foundIds };
}

function extractCategory(
  text: string,
  categories: Category[],
  categoryKeywords: Record<string, string[]>
): { category: string | null; subcategory: string | null; category_id: number | null } {
  let bestMatchSubcategory: string | null = null;
  let bestMatchCategory: string | null = null;
  let maxKeywordLength = 0;

  // 1. 扫描关键字字典进行匹配
  for (const [subcatName, keywords] of Object.entries(categoryKeywords)) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        if (kw.length > maxKeywordLength) {
          maxKeywordLength = kw.length;
          bestMatchSubcategory = subcatName;
        }
      }
    }
  }

  // 2. 如果关键字匹配失败，直接扫描子分类名称
  if (!bestMatchSubcategory) {
    for (const cat of categories) {
      if (cat.parent_id !== null && text.includes(cat.name)) {
        if (cat.name.length > maxKeywordLength) {
          maxKeywordLength = cat.name.length;
          bestMatchSubcategory = cat.name;
        }
      }
    }
  }

  // 3. 如果子分类名称未匹配到，扫描父分类名称
  if (!bestMatchSubcategory) {
    for (const cat of categories) {
      if (cat.parent_id === null && text.includes(cat.name)) {
        bestMatchCategory = cat.name;
        // 尝试匹配其下子分类
        const subcats = categories.filter(c => c.parent_id === cat.id);
        const matchedSubcat = subcats.find(s => text.includes(s.name));
        if (matchedSubcat) {
          bestMatchSubcategory = matchedSubcat.name;
        } else {
          return {
            category: cat.name,
            subcategory: null,
            category_id: cat.id
          };
        }
      }
    }
  }

  // 根据最终匹配到的子分类名称查找完整信息
  if (bestMatchSubcategory) {
    const subcat = categories.find(c => c.name === bestMatchSubcategory && c.parent_id !== null)
      || categories.find(c => c.name.includes(bestMatchSubcategory) && c.parent_id !== null)
      || categories.find(c => c.name === bestMatchSubcategory);

    if (subcat) {
      if (subcat.parent_id !== null) {
        const parent = categories.find(c => c.id === subcat.parent_id);
        return {
          category: parent ? parent.name : null,
          subcategory: subcat.name,
          category_id: subcat.id
        };
      } else {
        return {
          category: subcat.name,
          subcategory: null,
          category_id: subcat.id
        };
      }
    }
  }

  return {
    category: bestMatchCategory,
    subcategory: null,
    category_id: null
  };
}

function extractDescription(text: string): string {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 常见商户/店名识别词
  const merchantKeywords = ["店", "铺", "商户", "商行", "百货", "超市", "公司", "餐饮", "酒楼", "饭店", "馆", "坊", "阁", "厅", "吧", "庄", "社", "中心"];
  for (const line of lines) {
    if (line.length >= 3 && line.length <= 25) {
      // 排除包含特定单据特征的行
      if (merchantKeywords.some(kw => line.includes(kw)) 
          && !line.includes("单号") 
          && !line.includes("日期") 
          && !line.includes("电话") 
          && !line.includes("时间")
          && !line.includes("合计")
      ) {
        return line;
      }
    }
  }

  // 兜底返回第一行
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length > 25) {
      return firstLine.substring(0, 25) + "...";
    }
    return firstLine;
  }

  return "图片识别消费";
}
