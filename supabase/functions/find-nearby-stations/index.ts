import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { SupabaseRepository } from "../../../src/adapters/supabase/supabase.repository.ts";
import { FindNearbyStationsUseCase } from "../../../src/core/usecases/find-nearby-stations.usecase.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const url = new URL(req.url);
    const latStr = url.searchParams.get("lat");
    const lonStr = url.searchParams.get("lon");
    const distStr = url.searchParams.get("dist");

    if (!latStr) {
      return new Response(JSON.stringify({ error: "Query parameter 'lat' is missing." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    if (!lonStr) {
      return new Response(JSON.stringify({ error: "Query parameter 'lon' is missing." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    if (!distStr) {
      return new Response(JSON.stringify({ error: "Query parameter 'dist' is missing." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    const dist = parseInt(distStr, 10);
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);

    if (isNaN(lat)) {
      return new Response(JSON.stringify({ error: "Query parameter 'lat' must be a valid number." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    if (isNaN(lon)) {
      return new Response(JSON.stringify({ error: "Query parameter 'lon' must be a valid number." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    if (isNaN(dist)) {
      return new Response(JSON.stringify({ error: "Query parameter 'dist' must be a valid number." }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const db = new SupabaseRepository();
    const useCase = new FindNearbyStationsUseCase(db);
    const stations = await useCase.execute(lat, lon, dist, page, limit);

    return new Response(JSON.stringify(stations), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    if (
      error.message.includes("Page must be a positive number.") ||
      error.message.includes("Limit must be a positive number.")
    ) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "An internal server error occurred." }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
