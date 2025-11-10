export interface StationPayload {
  sno: string;
  name_zh: string;
  name_en: string;
  area_zh: string;
  area_en: string;
  address_zh: string;
  address_en: string;
  total_capacity: number;
  latitude: number;
  longitude: number;
}

export interface StatusPayload {
  station_sno: string;
  data_timestamp: string;
  available_rent_bikes: number;
  available_return_docks: number;
  is_active: boolean;
  src_update_time: string;
  api_update_time: string;
}

export interface LogPayload {
  run_started_at: string;
  run_ended_at: string;
  status: "success" | "failure";
  batch_time?: string | null;
  records_fetched?: number;
  records_inserted?: number;
  duration_ms: number;
  error_message?: string;
}

export interface IDatabaseRepository {
  upsertStations(stations: StationPayload[]): Promise<void>;
  insertStationStatus(statuses: StatusPayload[]): Promise<void>;
  insertBatchLog(log: LogPayload): Promise<void>;
  findStationsNearby(
    latitude: number,
    longitude: number,
    distanceInMeters: number,
    limit: number,
    offset: number,
  ): Promise<StationPayload[]>;
}
