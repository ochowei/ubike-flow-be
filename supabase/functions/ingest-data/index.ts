import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SupabaseRepository } from "../../../src/adapters/supabase/supabase.repository.ts";
import { YouBikeService } from "../../../src/adapters/youbike/youbike.service.ts";
import { IngestDataUseCase } from "../../../src/core/usecases/ingest-data.usecase.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const db = new SupabaseRepository();
    const youbikeService = new YouBikeService();
    const ingestUseCase = new IngestDataUseCase(db, youbikeService);

    const result = await ingestUseCase.execute();

    return new Response(
      JSON.stringify(result),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ status: "failure", error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
