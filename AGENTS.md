# 給 AI Agent 的指令 (Instructions for AI Agents)

在您開始任何編碼、重構或文件撰寫任務之前，您 **必須** 閱讀並嚴格遵守我們在架構文件中定義的設計原則。

1.  **首要任務：** 請務必閱讀 `docs/ARCHITECTURE.md` 檔案。
2.  **嚴格遵守：** 確保您的所有產出（程式碼、修改）都符合 `docs/ARCHITECTURE.md` 中定義的原則，特別是：
    * **依賴反轉：** 業務邏輯必須與 Supabase 等特定平台解耦。
    * **倉儲模式：** 必須透過介面 (Interface) 存取資料庫。
    * **Supabase 共用模組：** 專門供 **Supabase Edge Functions** 共用的程式碼應放置於 `supabase/functions/_shared/` 目錄。

感謝您的配合！
