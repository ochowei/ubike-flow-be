# 給 AI Agent 的指令 (Instructions for AI Agents)

在您開始任何編碼、重構或文件撰寫任務之前，您 **必須** 閱讀並嚴格遵守我們在架構文件中定義的設計原則。

1.  **首要任務：** 請務必閱讀 `docs/ARCHITECTURE.md` 檔案，以了解我們最新的平台無關性架構。

2.  **嚴格遵守：** 確保您的所有產出（程式碼、修改）都符合 `docs/ARCHITECTURE.md` 中定義的原則，特別是：
    *   **依賴方向 (`supabase/` -> `src/`)：** `src/` 中的程式碼**絕不能** `import` 任何 `supabase/` 目錄中的檔案。
    *   **倉儲模式：**
        *   介面 (Interfaces) 必須定義在 `src/core/interfaces/`。
        *   實作 (Implementations) 應放置在 `supabase/functions/_shared/`。
    *   **新業務邏輯：** 所有新的業務邏輯都**必須**建立在 `src/core/usecases/` 中，且**只能**依賴 `src/core/interfaces/` 中的介面。

感謝您的配合！
