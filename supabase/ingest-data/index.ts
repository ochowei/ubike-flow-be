import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// --- 常數設定 ---
const YBIKE_API_URL = "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json"
const INGEST_SECRET_KEY = Deno.env.get("INGEST_SECRET_KEY") // 我們稍後會在 Supabase 儀表板設定這個金鑰
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_KEY")

// --- TypeScript 類型 (根據您的 JSON) ---
interface YouBikeStation {
  sno: string;
  sna: string;
  sarea: string;
  mday: string;
  ar: string;
  sareaen: string;
  snaen: string;
  aren: string;
  act: string;
  srcUpdateTime: string;
  updateTime: string;
  infoTime: string;
  infoDate: string;
  Quantity: number;
  available_rent_bikes: number;
  latitude: number;
  longitude: number;
  available_return_bikes: number;
}

// --- 主要的 Function 邏輯 ---
serve(async (req) => {
  // 1. 處理 CORS Preflight 請求
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  // 2. 
  // 這是最重要的安全檢查！
  // 確保只有知道秘密金鑰的服務 (例如我們的 GitHub Action) 才能觸發此 Fucntion
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    if (token !== INGEST_SECRET_KEY) {
      throw new Error("Invalid authorization token");
    }
  } catch (error) {
    console.error(error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. 初始化 Supabase Admin Client
  // 我們使用 SERVICE_KEY，因為這個 Function 需要完整的資料庫寫入權限
  const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
  
  // 4. 
  // 向 batch_logs 寫入「開始執行」的日誌
  const startTime = new Date();
  const { data: logEntry, error: logStartError } = await supabaseAdmin
    .from("batch_logs")
    .insert({
      run_started_at: startTime.toISOString(),
      status: "running"
    })
    .select()
    .single();

  if (logStartError) {
    return new Response(JSON.stringify({ error: "Failed to create log entry", details: logStartError.message }), { status: 500 });
  }

  // 5. 執行資料抓取與儲存
  try {
    // --- 抓取 YouBike API ---
    const response = await fetch(YBIKE_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch YouBike API: ${response.statusText}`);
    }
    const data: YouBikeStation[] = await response.json();
    const recordsFetched = data.length;
    
    if (recordsFetched === 0) {
      throw new Error("YouBike API returned an empty array");
    }

    // --- 準備資料 (轉換) ---
    const stationsUpsertPayload = data.map(s => ({
      sno: s.sno,
      name_zh: s.sna,
      name_en: s.snaen,
      area_zh: s.sarea,
      area_en: s.sareaen,
      address_zh: s.ar,
      address_en: s.aren,
      total_capacity: s.Quantity,
      latitude: s.latitude,
      longitude: s.longitude,
    }));

    const statusInsertPayload = data.map(s => ({
      station_sno: s.sno,
      data_timestamp: s.mday, // 場站資料時間
      available_rent_bikes: s.available_rent_bikes,
      available_return_docks: s.available_return_bikes,
      is_active: s.act === "1",
      src_update_time: s.srcUpdateTime, // API 來源更新時間
      api_update_time: s.updateTime,   // 平台介接更新時間
    }));
    
    const apiBatchTime = statusInsertPayload[0]?.src_update_time || null;

    // --- 寫入資料庫 (並行執行) ---
    const [stationsResult, statusResult] = await Promise.all([
      // (a) 更新 `stations` 表 (使用 upsert 確保資料最新，若 sno 已存在則更新)
      supabaseAdmin.from("stations").upsert(stationsUpsertPayload, { onConflict: 'sno' }),
      
      // (b) 插入 `station_status` 表 (總是新增，以保留歷史紀錄)
      supabaseAdmin.from("station_status").insert(statusInsertPayload)
    ]);

    if (stationsResult.error) throw new Error(`Station upsert error: ${stationsResult.error.message}`);
    if (statusResult.error) throw new Error(`Status insert error: ${statusResult.error.message}`);

    // --- 更新 Log (成功) ---
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    
    await supabaseAdmin.from("batch_logs").update({
      run_ended_at: endTime.toISOString(),
      status: "success",
      batch_time: apiBatchTime,
      records_fetched: recordsFetched,
      records_inserted: statusInsertPayload.length,
      duration_ms: durationMs,
    }).eq("id", logEntry.id);

    // --- 回傳成功訊息 ---
    return new Response(
      JSON.stringify({ status: "success", inserted: statusInsertPayload.length }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    // --- 捕捉錯誤並更新 Log (失敗) ---
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    
    await supabaseAdmin.from("batch_logs").update({
      run_ended_at: endTime.toISOString(),
      status: "failure",
      duration_ms: durationMs,
      error_message: error.message
    }).eq("id", logEntry.id);

    // --- 回傳失敗訊息 ---
    return new Response(
      JSON.stringify({ status: "failure", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
