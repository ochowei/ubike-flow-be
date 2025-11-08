import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// --- 常數設定 ---
const YBIKE_API_URL = "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json"
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_ANON_KEY")

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

// --- CORS 標頭 ---
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- 主要的 Function 邏輯 ---
serve(async (req) => {
  // 1. 處理 CORS Preflight 請求
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 2. 
  // (已移除安全驗證)
  // 

  const startTime = new Date();
  const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  try {
    // 3. --- 抓取 YouBike API ---
    const response = await fetch(YBIKE_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch YouBike API: ${response.statusText}`);
    }
    const data: YouBikeStation[] = await response.json();
    const recordsFetched = data.length;
    
    if (recordsFetched === 0) {
      throw new Error("YouBike API returned an empty array");
    }

    // 4. --- 準備資料 (轉換) ---
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
      data_timestamp: s.mday,
      available_rent_bikes: s.available_rent_bikes,
      available_return_docks: s.available_return_bikes,
      is_active: s.act === "1",
      src_update_time: s.srcUpdateTime,
      api_update_time: s.updateTime,
    }));
    
    const apiBatchTime = statusInsertPayload[0]?.src_update_time || null;

    // 5. --- 寫入資料庫 (並行執行) ---
    const [stationsResult, statusResult] = await Promise.all([
      supabaseAdmin.from("stations").upsert(stationsUpsertPayload, { onConflict: 'sno' }),
      supabaseAdmin.from("station_status").insert(statusInsertPayload)
    ]);

    if (stationsResult.error) throw new Error(`Station upsert error: ${stationsResult.error.message}`);
    if (statusResult.error) throw new Error(`Status insert error: ${statusResult.error.message}`);

    // 6. --- 寫入 Log (成功) ---
    const endTime = new Date();
    await supabaseAdmin.from("batch_logs").insert({
      run_started_at: startTime.toISOString(),
      run_ended_at: endTime.toISOString(),
      status: "success",
      batch_time: apiBatchTime,
      records_fetched: recordsFetched,
      records_inserted: statusInsertPayload.length,
      duration_ms: endTime.getTime() - startTime.getTime(),
    });

    // 7. --- 回傳成功訊息 ---
    return new Response(
      JSON.stringify({ status: "success", inserted: statusInsertPayload.length }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    // 8. --- 捕捉錯誤並更新 Log (失敗) ---
    const endTime = new Date();
    await supabaseAdmin.from("batch_logs").insert({
      run_started_at: startTime.toISOString(),
      run_ended_at: endTime.toISOString(),
      status: "failure",
      duration_ms: endTime.getTime() - startTime.getTime(),
      error_message: error.message
    });

    return new Response(
      JSON.stringify({ status: "failure", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});