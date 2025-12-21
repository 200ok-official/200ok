"""
Google Gemini AI 服務
用於生成專案摘要、技能標籤提取等功能
"""
from typing import Optional, List
import httpx
from app.config import settings


class GeminiService:
    """Google Gemini API 服務"""
    
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.model = "gemini-2.5-flash"  # 或使用 "gemini-pro-vision" 如果支援圖片
    
    def _get_headers(self) -> dict:
        """取得 API 請求 headers"""
        return {
            "Content-Type": "application/json",
        }
    
    async def generate_text(
        self, 
        prompt: str, 
        max_tokens: Optional[int] = 1000,
        temperature: float = 0.7
    ) -> Optional[str]:
        """
        生成文字內容
        
        Args:
            prompt: 提示詞
            max_tokens: 最大 token 數量
            temperature: 溫度參數 (0.0-1.0)，越高越創意，越低越確定
            
        Returns:
            生成的文字內容，失敗時返回 None
        """
        if not self.api_key:
            # 如果沒有設定 API key，返回 None（不影響主要功能）
            return None
        
        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload, headers=self._get_headers())
                response.raise_for_status()
                data = response.json()
                
                # 提取生成的文字
                if "candidates" in data and len(data["candidates"]) > 0:
                    candidate = data["candidates"][0]
                    if "content" in candidate and "parts" in candidate["content"]:
                        parts = candidate["content"]["parts"]
                        if len(parts) > 0 and "text" in parts[0]:
                            return parts[0]["text"]
                
                return None
        except Exception as e:
            # 記錄錯誤但不中斷主要功能
            print(f"Gemini API 錯誤: {str(e)}")
            return None
    
    async def generate_project_summary(self, project_data: dict) -> Optional[str]:
        """
        生成專案摘要
        
        Args:
            project_data: 專案資料字典
            
        Returns:
            生成的專案摘要
        """
        # 構建提示詞
        prompt = f"""請為以下專案生成一個簡潔的摘要（100-150字），摘要應包含：
1. 專案的核心目標
2. 主要功能或需求
3. 技術要求（如果有）

專案標題：{project_data.get('title', '')}
專案描述：{project_data.get('description', '')}
專案類型：{project_data.get('project_type', '')}
預算範圍：NT$ {project_data.get('budget_min', 0):,.0f} - NT$ {project_data.get('budget_max', 0):,.0f}

請生成摘要："""
        
        return await self.generate_text(prompt, max_tokens=1000, temperature=0.5)
    
    async def generate_project_title(self, project_data: dict) -> Optional[str]:
        """
        根據專案類型和內容生成合適的專案標題
        
        Args:
            project_data: 專案資料字典，包含 project_type, description 等
            
        Returns:
            生成的專案標題（5-15字）
        """
        project_type = project_data.get('project_type', '')
        description = project_data.get('description', '')
        usage_scenario = project_data.get('new_usage_scenario', '')
        goals = project_data.get('new_goals', '')
        system_name = project_data.get('maint_system_name', '')
        
        # 構建提示詞
        if system_name:
            # 修改維護專案
            prompt = f"""請為以下系統維護專案生成一個簡潔明確的標題。

⚠️ 重要限制：
- 標題必須是 5-15 個繁體中文字（不含標點符號和空格）
- 超過 15 字將被視為無效
- 請直接輸出標題，不要加引號、說明或任何額外文字

專案要求：
1. 包含系統名稱
2. 簡要說明維護/改善的重點

系統名稱：{system_name}
專案類型：{project_type}
專案描述：{description[:200]}

請只輸出標題："""
        else:
            # 全新開發專案
            prompt = f"""請為以下軟體開發專案生成一個簡潔明確的標題。

⚠️ 重要限制：
- 標題必須是 5-15 個繁體中文字（不含標點符號和空格）
- 超過 15 字將被視為無效
- 請直接輸出標題，不要加引號、說明或任何額外文字

專案要求：
1. 體現專案類型（{project_type}）
2. 說明核心功能或目標
3. 專業且清楚明瞭

專案類型：{project_type}
使用場景：{usage_scenario[:150]}
專案目標：{goals[:150]}
專案描述：{description[:200]}

請只輸出標題："""
        
        result = await self.generate_text(prompt, max_tokens=50, temperature=0.5)
        
        if result:
            # 清理結果，移除可能的引號、換行和多餘空白
            title = result.strip().strip('"').strip("'").strip()
            # 移除換行符號
            title = title.replace('\n', '').replace('\r', '')
            
            # 計算實際字數（排除標點符號和空格）
            import re
            clean_title = re.sub(r'[，。、；：！？\s\.,;:!?]', '', title)
            char_count = len(clean_title)
            
            # 如果超過 15 字，智能截斷
            if char_count > 15:
                # 嘗試保留完整的詞彙
                truncated = ''
                current_count = 0
                for char in title:
                    # 跳過標點符號和空格
                    if char not in '，。、；：！？\s\.,;:!? ':
                        current_count += 1
                        if current_count > 15:
                            break
                    truncated += char
                
                # 移除末尾的標點符號
                title = truncated.rstrip('，。、；：！？\.,;:!? ')
                
                # 如果截斷後太短，使用簡單截斷
                if len(title) < 5:
                    title = result[:15].strip()
            
            # 最終確保長度不超過 50 字元（包含標點）
            if len(title) > 50:
                title = title[:47] + "..."
            
            return title
        
        return None
    
    async def extract_skills(self, project_description: str) -> List[str]:
        """
        從專案描述中提取技能標籤
        
        Args:
            project_description: 專案描述
            
        Returns:
            技能標籤列表
        """
        prompt = f"""請從以下專案描述中提取相關的技術技能標籤（最多 5 個），每個標籤用一行列出：

專案描述：
{project_description}

請只列出技術技能標籤，每個標籤一行，不要編號或額外說明："""
        
        result = await self.generate_text(prompt, max_tokens=200, temperature=0.3)
        
        if result:
            # 解析結果，每行一個標籤
            skills = [
                skill.strip() 
                for skill in result.split('\n') 
                if skill.strip() and not skill.strip().startswith('#')
            ]
            return skills[:5]  # 最多 5 個
        
        return []


# 全局實例
gemini_service = GeminiService()

