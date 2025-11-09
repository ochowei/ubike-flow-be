# 專案架構原則

為了保持程式碼的可維護性、可測試性與可攜性，本專案遵循以下設計原則。所有未來的開發工作都應遵循這些模式。

## 1. 核心原則：平台無關性

為了實現真正的平台無關性，並為未來可能替換 Supabase 做準備，核心業務邏輯已從 `supabase/` 目錄移至 `src/` 目錄。

### `src` 目錄：核心業務邏輯

*   **定義：** 一個新的最上層目錄，用以存放所有平台無關的程式碼。
*   **結構：**
    *   `src/core/interfaces/`: 存放抽象介面 (例如 `IDatabaseRepository`)。
    *   `src/core/usecases/`: 存放核心業務邏輯流程 (例如 `IngestDataUseCase`)。
    *   `src/core/entities/` (或 `types/`): 存放共用型別與資料結構 (例如 `StationPayload`, `StatusPayload`)。

### `supabase` 目錄：適配器 (Adapter)

*   **角色：** `supabase/` 目錄現在被視為一個「適配器 (Adapter)」或「基礎設施 (Infrastructure)」層。
*   **職責：**
    *   `supabase/functions/`: 作為 HTTP 的「入口點 (Entry Point)」，負責接收請求並調用 `src/` 中的核心邏輯。
    *   `supabase/functions/_shared/`: 只用於存放 Supabase 平台相關且需共用的程式碼 (例如 Supabase Client 的特定輔助函式)，**不應包含業務邏輯**。

## 2. 依賴反轉 (Dependency Inversion)

*   **依賴方向：** 依賴方向**必須**是 `supabase/` -> `src/`。
*   **嚴格禁止：** `src/` 目錄中的程式碼**絕不能** `import` 任何 `supabase/` 目錄中的檔案。

核心業務邏輯（`src/core/usecases/`）不應直接依賴於外部平台（如 Supabase Client）。

## 3. 倉儲模式 (Repository Pattern)

所有與外部服務（特別是資料庫）的互動都必須透過抽象介面來進行：

*   **合約 (Interface):** 介面定義於 `src/core/interfaces/` 目錄（例如 `database.interface.ts`）。
*   **實作 (Implementation):** 特定平台的實作應存放在平台相關的目錄，例如 `supabase/functions/_shared/supabase.repository.ts`。此實作必須 `implements` `src/core/interfaces/` 中定義的介面。
*   **消費者 (Consumer):** 業務邏輯 (Use Cases) 只能依賴於「介面」，而不應知道「實作」的存在。

## 4. 測試原則 (Testing Principles)

### 單元測試 (Unit Tests)

所有在 `src/core/usecases/` 中的核心業務邏輯 (Use Cases) 必須有對應的單元測試。

測試檔案應與被測試的檔案放在同一目錄下，並以 `.test.ts` 結尾 (例如 `ingest-data.usecase.test.ts`)。

單元測試必須模擬 (Mock) 所有外部依賴（例如 `IDatabaseRepository`, `IYouBikeService`），僅專注於測試 Use Case 本身的邏輯。

### 測試框架 (Testing Stack)

*   **測試運行器 (Runner):** `Deno.test` (Deno 內建)
*   **斷言 (Assertions):** `deno.land/std/assert` (Deno 標準庫)
*   **模擬 (Mocks):** `deno.land/std/testing/mock.ts` (Deno 標準庫)
