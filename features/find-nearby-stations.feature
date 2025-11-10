Feature: 查詢附近 YouBike 站點 (Find Nearby Stations)
  此功能負責根據使用者提供的經緯度、距離和分頁參數，回傳附近的 YouBike 站點。

  Background:
    Given 一個設定好的資料庫 (IDatabaseRepository)
    And 一個查詢附近站點 Use Case (FindNearbyStationsUseCase)

  Scenario: 成功查詢附近的站點 (Happy Path, 無分頁)
    Given 使用者提供了有效的座標 (緯度 25.02605, 經度 121.5436)
    And 搜尋距離為 500 公尺
    And IDatabaseRepository.findStationsNearby 準備回傳 1 筆站點資料
    When 執行 FindNearbyStationsUseCase (不帶分頁參數)
    Then Use Case 應呼叫 1 次 IDatabaseRepository.findStationsNearby
    And 傳遞給 findStationsNearby 的參數應為 (lat: 25.02605, lon: 121.5436, dist: 500, limit: 預設值, offset: 0)
    And Use Case 應回傳 1 筆站點資料

  Scenario: 成功查詢附近的站點 (使用分頁)
    Given 使用者提供了有效的座標 (緯度 25.0339, 經度 121.5644)
    And 搜尋距離為 1000 公尺
    And 使用者請求第 2 頁，每頁 10 筆 (page: 2, limit: 10)
    And IDatabaseRepository.findStationsNearby 準備回傳 10 筆站點資料
    When 執行 FindNearbyStationsUseCase
    Then Use Case 應呼叫 1 次 IDatabaseRepository.findStationsNearby
    And 傳遞給 findStationsNearby 的參數應為 (lat: 25.0339, lon: 121.5644, dist: 1000, limit: 10, offset: 10)
    And Use Case 應回傳 10 筆站點資料

  Scenario: 處理無效的座標或距離
    Given 一個 FindNearbyStationsUseCase
    When 執行 Use Case 時提供了無效的緯度 (例如 91)
    Then Use Case 應拋出 "Invalid latitude provided." 錯誤
    And Use Case **不應** 呼叫 IDatabaseRepository.findStationsNearby

    When 執行 Use Case 時提供了無效的經度 (例如 181)
    Then Use Case 應拋出 "Invalid longitude provided." 錯誤
    And Use Case **不應** 呼叫 IDatabaseRepository.findStationsNearby

    When 執行 Use Case 時提供了無效的距離 (例如 0 或 -100)
    Then Use Case 應拋出 "Distance must be a positive number." 錯誤
    And Use Case **不應** 呼叫 IDatabaseRepository.findStationsNearby

  Scenario: 處理無效的分頁參數
    Given 一個 FindNearbyStationsUseCase
    And 使用者提供了有效的座標和距離
    When 執行 Use Case 時提供了無效的 page 參數 (例如 0 或 -1)
    Then Use Case 應拋出 "Page must be a positive number." 錯誤
    And Use Case **不應** 呼叫 IDatabaseRepository.findStationsNearby

    When 執行 Use Case 時提供了無效的 limit 參數 (例如 0 或 -5)
    Then Use Case 應拋出 "Limit must be a positive number." 錯誤
    And Use Case **不應** 呼叫 IDatabaseRepository.findStationsNearby
