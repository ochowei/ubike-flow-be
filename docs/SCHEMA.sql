create table public.stations (
  sno text not null,
  name_zh text null,
  name_en text null,
  area_zh text null,
  area_en text null,
  address_zh text null,
  address_en text null,
  total_capacity integer null,
  latitude double precision null,
  longitude double precision null,
  location USER - DEFINED GENERATED ALWAYS as (
    extensions.st_setsrid (
      extensions.st_makepoint (longitude, latitude),
      4326
    )
  ) STORED null,
  created_at timestamp with time zone null default now(),
  constraint stations_pkey primary key (sno)
) TABLESPACE pg_default;

create table public.station_status (
  id uuid not null default gen_random_uuid (),
  station_sno text not null,
  data_timestamp timestamp with time zone not null,
  available_rent_bikes integer null,
  available_return_docks integer null,
  is_active boolean null,
  src_update_time timestamp with time zone null,
  api_update_time timestamp with time zone null,
  constraint station_status_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_station_status_sno on public.station_status using btree (station_sno) TABLESPACE pg_default;

create index IF not exists idx_station_status_sno_timestamp on public.station_status using btree (station_sno, data_timestamp desc) TABLESPACE pg_default;


create table public.batch_logs (
  id uuid not null default gen_random_uuid (),
  run_started_at timestamp with time zone null default now(),
  run_ended_at timestamp with time zone null,
  status text not null,
  batch_time timestamp with time zone null,
  records_fetched integer null,
  records_inserted integer null,
  duration_ms bigint null,
  error_message text null,
  constraint batch_logs_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_batch_logs_run_started_at on public.batch_logs using btree (run_started_at desc) TABLESPACE pg_default;
