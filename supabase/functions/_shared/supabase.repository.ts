import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { IDatabaseRepository, StationPayload, StatusPayload, LogPayload } from "./database.interface.ts";

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
}
