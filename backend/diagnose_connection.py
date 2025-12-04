#!/usr/bin/env python3
"""
診斷 Supabase 連接問題
"""
import socket
import sys
from urllib.parse import urlparse
from app.config import settings


def diagnose_connection():
    """診斷連接問題"""
    print("🔍 Supabase 連接診斷工具")
    print("=" * 50)
    print()
    
    # 1. 檢查 DATABASE_URL 格式
    print("1️⃣ 檢查 DATABASE_URL 格式...")
    try:
        db_url = settings.DATABASE_URL
        parsed = urlparse(db_url)
        
        print(f"   ✅ URL 格式正確")
        print(f"   📋 協議: {parsed.scheme}")
        print(f"   📋 主機: {parsed.hostname}")
        print(f"   📋 端口: {parsed.port}")
        print(f"   📋 資料庫: {parsed.path.lstrip('/')}")
        print(f"   📋 使用者: {parsed.username}")
        
        if not parsed.hostname:
            print("   ❌ 主機名稱缺失！")
            return False
            
    except Exception as e:
        print(f"   ❌ URL 格式錯誤: {e}")
        return False
    print()
    
    # 2. DNS 解析測試
    print("2️⃣ DNS 解析測試...")
    hostname = parsed.hostname
    try:
        ip_address = socket.gethostbyname(hostname)
        print(f"   ✅ DNS 解析成功")
        print(f"   📋 IP 地址: {ip_address}")
    except socket.gaierror as e:
        print(f"   ❌ DNS 解析失敗: {e}")
        print()
        print("   💡 可能的原因：")
        print("      - Supabase 專案可能已暫停或刪除")
        print("      - 主機名稱不正確")
        print("      - 網路連接問題")
        print()
        print("   🔧 建議檢查：")
        print("      1. 登入 Supabase Dashboard 確認專案狀態")
        print("      2. 檢查專案設定 > Database > Connection string")
        print("      3. 確認專案沒有被暫停")
        return False
    print()
    
    # 3. 端口連接測試
    print("3️⃣ 端口連接測試...")
    port = parsed.port or 5432
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((ip_address, port))
        sock.close()
        
        if result == 0:
            print(f"   ✅ 端口 {port} 可連接")
        else:
            print(f"   ❌ 端口 {port} 無法連接")
            return False
    except Exception as e:
        print(f"   ❌ 連接測試失敗: {e}")
        return False
    print()
    
    print("✅ 基本連接測試通過！")
    print()
    print("💡 如果仍然無法連接，請檢查：")
    print("   1. Supabase 專案是否啟用")
    print("   2. 資料庫密碼是否正確")
    print("   3. IP 白名單設定（如果有的話）")
    return True


if __name__ == "__main__":
    try:
        success = diagnose_connection()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  診斷被中斷")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 發生錯誤: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

