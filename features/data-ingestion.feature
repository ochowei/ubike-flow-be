# features/data-ingestion.feature
Feature: YouBike 資料擷取 (Data Ingestion)
  此功能負責從 YouBike API 獲取即時資料，並將其存入資料庫。

  Background:
    Given 一個設定好的 YouBike 服務 (IYouBikeService)
    And 一個設定好的資料庫 (IDatabaseRepository)
    And 一個資料擷取 Use Case (IngestDataUseCase)

  Scenario: 成功擷取並儲存資料 (Happy Path)
    Given YouBike API 回傳了 1 筆有效的站點資料
    When 執行 IngestDataUseCase
    Then Use Case 應呼叫 1 次 fetchData
    And Use Case 應呼叫 1 次 upsertStations
    And Use Case 應呼叫 1 次 insertStationStatus
    And Use Case 應呼叫 1 次 insertBatchLog
    And 寫入 batch_logs 的狀態應為 "success"
    And Use Case 應回傳 { status: "success", inserted: 1 }

  Scenario: YouBike API 獲取失敗
    Given YouBike API 拋出 "API Error" 錯誤
    When 執行 IngestDataUseCase
    Then Use Case 應呼叫 1 次 fetchData
    And Use Case **不應** 呼叫 upsertStations
    And Use Case **不應** 呼叫 insertStationStatus
    And Use Case 應呼叫 1 次 insertBatchLog
    And 寫入 batch_logs 的狀態應為 "failure"
    And 寫入 batch_logs 的錯誤訊息應為 "API Error"
    And Use Case 應拋出 "API Error" 錯誤

  Scenario: 資料庫寫入失敗 (Upsert Stations)
    Given YouBike API 回傳了 1 筆有效的站點資料
    And upsertStations 方法拋出 "DB Error" 錯誤
    When 執行 IngestDataUseCase
    Then Use Case 應呼叫 1 次 fetchData
    And Use Case 應呼叫 1 次 upsertStations
    And Use Case **不應** 呼叫 insertStationStatus
    And Use Case 應呼叫 1 次 insertBatchLog
    And 寫入 batch_logs 的狀態應為 "failure"
    And 寫入 batch_logs 的錯誤訊息應為 "DB Error"
    And Use Case 應拋出 "DB Error" 錯誤

  Scenario: API 回傳空陣列
    Given YouBike API 回傳了 0 筆資料 (空陣列)
    When 執行 IngestDataUseCase
    Then Use Case 應呼叫 1 次 fetchData
    And Use Case **不應** 呼叫 upsertStations
    And Use Case **不應** 呼叫 insertStationStatus
    And Use Case 應呼叫 1 次 insertBatchLog
    And 寫入 batch_logs 的狀態應為 "failure"
    And 寫入 batch_logs 的錯誤訊息應為 "YouBike API returned an empty array"
    And Use Case 應拋出 "YouBike API returned an empty array" 錯誤
