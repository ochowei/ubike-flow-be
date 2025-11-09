import { IDatabaseRepository, StationPayload, StatusPayload } from "../types/database.types.ts";
import { IYouBikeService } from "../interfaces/youbike.service.ts";

export class IngestDataUseCase {
  constructor(
    private readonly db: IDatabaseRepository,
    private readonly youbikeService: IYouBikeService,
  ) {}

  async execute(): Promise<{ status: string; inserted: number }> {
    const startTime = new Date();
    try {
      const data = await this.youbikeService.fetchData();
      const recordsFetched = data.length;

      if (recordsFetched === 0) {
        throw new Error("YouBike API returned an empty array");
      }

      const stationsUpsertPayload: StationPayload[] = data.map(s => ({
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

      const statusInsertPayload: StatusPayload[] = data.map(s => ({
        station_sno: s.sno,
        data_timestamp: s.mday,
        available_rent_bikes: s.available_rent_bikes,
        available_return_docks: s.available_return_bikes,
        is_active: s.act === "1",
        src_update_time: s.srcUpdateTime,
        api_update_time: s.updateTime,
      }));

      const apiBatchTime = statusInsertPayload[0]?.src_update_time || null;

      await Promise.all([
        this.db.upsertStations(stationsUpsertPayload),
        this.db.insertStationStatus(statusInsertPayload),
      ]);

      const endTime = new Date();
      await this.db.insertBatchLog({
        run_started_at: startTime.toISOString(),
        run_ended_at: endTime.toISOString(),
        status: "success",
        batch_time: apiBatchTime,
        records_fetched: recordsFetched,
        records_inserted: statusInsertPayload.length,
        duration_ms: endTime.getTime() - startTime.getTime(),
      });

      return { status: "success", inserted: statusInsertPayload.length };

    } catch (error) {
      const endTime = new Date();
      await this.db.insertBatchLog({
        run_started_at: startTime.toISOString(),
        run_ended_at: endTime.toISOString(),
        status: "failure",
        duration_ms: endTime.getTime() - startTime.getTime(),
        error_message: error.message,
      });

      // Re-throw the error to be handled by the caller (e.g., the Supabase function)
      throw error;
    }
  }
}
