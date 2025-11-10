CREATE OR REPLACE FUNCTION find_stations_nearby(
    latitude_input float,
    longitude_input float,
    distance_in_meters int
)
RETURNS SETOF public.stations
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.stations
    WHERE st_dwithin(
        location,
        extensions.st_setsrid(extensions.st_makepoint(longitude_input, latitude_input), 4326),
        distance_in_meters
    );
END;
$$;