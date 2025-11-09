# 專案架構原則

為了保持程式碼的可維護性、可測試性與可攜性，本專案遵循以下設計原則。所有未來的開發工作都應遵循這些模式。

## 1. 依賴反轉 (Dependency Inversion)

核心業務邏輯（例如 `ingest-data` function）不應直接依賴於外部平台（如 Supabase Client）。

## 2. 倉儲模式 (Repository Pattern)

所有與外部服務（特別是資料庫）的互動都必須透過抽象介面來進行：

* **合約 (Interface):** 應在 `_shared/` 中定義一個 `*.interface.ts` 檔案，用來宣告該服務的方法（例如 `IDatabaseRepository`）。
* **實作 (Implementation):** 特定平台的實作（例如 `_shared/supabase.repository.ts`）必須實作 (implements) 該介面。
* **消費者 (Consumer):** 業務邏輯 (例如 Edge Functions) 只能依賴於「介面」，而不應知道「實作」的存在。

## 3. 共用模組 (Shared Modules)

* 所有可在 Functions 之間共用的程式碼（例如 Repository、介面、型別定義）應放置在 `supabase/functions/_shared/` 目錄下。
* 以底線 `_` 開頭的目錄不會被 Supabase CLI 部署為獨立的 Edge Function，使其成為存放共用邏輯的理想位置。
