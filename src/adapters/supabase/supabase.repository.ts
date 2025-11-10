import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { IDatabaseRepository, StationPayload, StatusPayload, LogPayload } from "../../core/types/database.types.ts";

export class SupabaseRepository implements IDatabaseRepository {
  private supabaseAdmin: SupabaseClient;

  constructor() {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase URL and service key are required.");
    }
    this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }

  async upsertStations(stations: StationPayload[]): Promise<void> {
    const { error } = await this.supabaseAdmin.from("stations").upsert(stations, { onConflict: 'sno' });
    if (error) {
      throw new Error(`Station upsert error: ${error.message}`);
    }
  }

  async insertStationStatus(statuses: StatusPayload[]): Promise<void> {
    const { error } = await this.supabaseAdmin.from("station_status").insert(statuses);
    if (error) {
      throw new Error(`Status insert error: ${error.message}`);
    }
  }

  async insertBatchLog(log: LogPayload): Promise<void> {
    const { error } = await this.supabaseAdmin.from("batch_logs").insert(log);
    if (error) {
      // Log error to console, but don't throw, as this is a logging operation
      console.error(`Batch log insert error: ${error.message}`);
    }
  }

  async findStationsNearby(
    latitude: number,
    longitude: number,
    distanceInMeters: number,
    limit: number,
    offset: number,
  ): Promise<StationPayload[]> {
    const { data, error } = await this.supabaseAdmin.rpc("find_stations_nearby", {
      latitude_input: latitude,
      longitude_input: longitude,
      distance_in_meters: distanceInMeters,
      limit_input: limit,
      offset_input: offset,
    });

    if (error) {
      throw new Error(`Find nearby stations error: ${error.message}`);
    }
    return data || [];
  }
}
