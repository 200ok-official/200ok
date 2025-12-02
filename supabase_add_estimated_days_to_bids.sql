-- 為 bids 表添加 estimated_days 欄位
-- 執行日期: 2025-01-02

-- 添加 estimated_days 欄位
ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS estimated_days INTEGER;

-- 添加註解
COMMENT ON COLUMN public.bids.estimated_days IS '預估完成天數';

-- 驗證欄位是否添加成功
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'bids' 
-- AND column_name = 'estimated_days';

