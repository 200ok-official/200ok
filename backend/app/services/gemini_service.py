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
        self.model = "gemini-pro"  # 或使用 "gemini-pro-vision" 如果支援圖片
    
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
        
        return await self.generate_text(prompt, max_tokens=200, temperature=0.5)
    
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

