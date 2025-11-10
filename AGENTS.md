# 給 AI Agent 的指令 (Instructions for AI Agents)

## 核心原則 (Core Principles)

### 1. 遵循行為規格 (BDD) - 最高優先級

在您開始任何編碼或重構任務之前，您 **必須** 優先查閱 `features/` 目錄下對應的 `.feature` 檔案。

* `.feature` 檔案是**唯一的真相來源 (Single Source of Truth)**，定義了系統的業務行為。
* 您的程式碼實作 (包含 `src/core/usecases/` 邏輯) **必須** 完整覆蓋 `.feature` 檔案中描述的所有情境 (Scenarios)。
* 您撰寫的單元測試 (`.test.ts`) **必須** 驗證 `.feature` 檔案中描述的 "Given / When / Then" 流程。

---

### 2. 閱讀架構文件

在您開始任何編碼、重構或文件撰寫任務之前，您 **必須** 閱讀並嚴格遵守我們在架構文件中定義的設計原則。

1.  **首要任務：** 請務必閱讀 `docs/ARCHITECTURE.md` 檔案，以了解我們最新的平台無關性架構。

2.  **嚴格遵守：** 確保您的所有產出（程式碼、修改）都符合 `docs/ARCHITECTURE.md` 中定義的原則，特別是：
    *   **依賴方向 (`supabase/` -> `src/`)：** `src/` 中的程式碼**絕不能** `import` 任何 `supabase/` 目錄中的檔案。
    *   **倉儲模式：**
        *   介面 (Interfaces) 必須定義在 `src/core/interfaces/`。
        *   實作 (Implementations) 應放置在 `supabase/functions/_shared/`。
    *   **新業務邏輯：** 所有新的業務邏輯都**必須**建立在 `src/core/usecases/` 中，且**只能**依賴 `src/core/interfaces/` 中的介面。


「測試要求： 當您被指派新增或修改 src/core/usecases/ 中的業務邏輯時，您 必須 同時建立或更新對應的單元測試 (.test.ts) 檔案。您必須使用 Deno.test, std/assert 和 std/testing/mock.ts 來撰寫測試，並確保所有依賴都被正確模擬。」
