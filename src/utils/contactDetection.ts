/**
 * 聯絡方式檢測工具
 * 用於檢查文字中是否包含任何形式的聯絡方式
 */

export interface ContactPattern {
  type: string;
  pattern: RegExp;
  description: string;
}

export const contactPatterns: ContactPattern[] = [
  {
    type: 'email',
    pattern: /\b[\w\.-]+@[\w\.-]+\.\w{2,}\b/gi,
    description: 'Email 地址',
  },
  {
    type: 'phone',
    pattern: /\b0\d{1,3}[-\s]?\d{3,4}[-\s]?\d{3,4}\b/g,
    description: '電話號碼',
  },
  {
    type: 'mobile',
    pattern: /\b09\d{8}\b/g,
    description: '手機號碼',
  },
  {
    type: 'line_id',
    pattern: /(line\s*[:：]\s*[@]?[a-zA-Z0-9_-]+|@line\s*[:：]?\s*[a-zA-Z0-9_-]+|line\s+id\s*[:：]\s*[@]?[a-zA-Z0-9_-]+)/gi,
    description: 'LINE ID',
  },
  {
    type: 'social',
    pattern: /(whatsapp|telegram|wechat|微信|ig|instagram|facebook|fb|推特|twitter)\s*[:：]\s*[@]?[a-zA-Z0-9._-]+/gi,
    description: '社群媒體帳號',
  },
  {
    type: 'url',
    pattern: /(https?:\/\/[^\s]+|www\.[^\s]+)/gi,
    description: '網址連結',
  },
  {
    type: 'skype',
    pattern: /skype[\s:@][\w.-]+/gi,
    description: 'Skype 帳號',
  },
  {
    type: 'discord',
    pattern: /discord[\s:@#][\w.-]+/gi,
    description: 'Discord 帳號',
  },
];

/**
 * 檢查文字是否包含任何聯絡方式
 */
export function containsContactInfo(text: string): boolean {
  if (!text) return false;
  
  return contactPatterns.some(({ pattern }) => {
    // 重置 RegExp 的 lastIndex
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

/**
 * 偵測並返回所有找到的聯絡方式
 */
export function detectContactInfo(text: string): Array<{
  type: string;
  description: string;
  matches: string[];
}> {
  if (!text) return [];
  
  const detected: Array<{
    type: string;
    description: string;
    matches: string[];
  }> = [];
  
  contactPatterns.forEach(({ type, pattern, description }) => {
    // 重置 RegExp 的 lastIndex
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      detected.push({
        type,
        description,
        matches: [...new Set(matches)], // 去重
      });
    }
  });
  
  return detected;
}

/**
 * 移除文字中的聯絡方式（用於過濾）
 */
export function removeContactInfo(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  contactPatterns.forEach(({ pattern }) => {
    pattern.lastIndex = 0;
    cleaned = cleaned.replace(pattern, '[已移除聯絡方式]');
  });
  
  return cleaned;
}

/**
 * 取得檢測結果的摘要訊息
 */
export function getDetectionSummary(text: string): string {
  const detected = detectContactInfo(text);
  
  if (detected.length === 0) {
    return '';
  }
  
  const messages = detected.map(({ description, matches }) => 
    `• ${description}：${matches.join(', ')}`
  );
  
  return `偵測到以下聯絡方式：\n\n${messages.join('\n')}`;
}

