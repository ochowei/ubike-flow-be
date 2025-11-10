import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  spy,
  stub,
} from "https://deno.land/std@0.208.0/testing/mock.ts";
import { FindNearbyStationsUseCase } from "./find-nearby-stations.usecase.ts";
import { IDatabaseRepository, StationPayload } from "../types/database.types.ts";

const MOCK_STATION: StationPayload = {
  sno: "500101001",
  name_zh: "YouBike2.0_捷運科技大樓站",
  name_en: "YouBike2.0_MRT Technology Bldg. Sta.",
  area_zh: "大安區",
  area_en: "Daan Dist.",
  address_zh: "復興南路二段235號前",
  address_en: "No.235, Sec. 2, Fuxing S. Rd.",
  total_capacity: 28,
  latitude: 25.02605,
  longitude: 121.5436,
};

Deno.test("FindNearbyStationsUseCase: Happy Path", async (t) => {
  const db: IDatabaseRepository = {
    findStationsNearby: () => Promise.resolve([MOCK_STATION]),
    upsertStations: () => Promise.resolve(),
    insertStationStatus: () => Promise.resolve(),
    insertBatchLog: () => Promise.resolve(),
  };

  await t.step("should return a list of stations", async () => {
    const findStationsNearbySpy = spy(db, "findStationsNearby");
    const useCase = new FindNearbyStationsUseCase(db);
    const result = await useCase.execute(25.02605, 121.5436, 500);

    assertEquals(result, [MOCK_STATION]);
    assertEquals(findStationsNearbySpy.calls.length, 1);
    assertEquals(findStationsNearbySpy.calls[0].args, [25.02605, 121.5436, 500]);
  });
});

Deno.test("FindNearbyStationsUseCase: Invalid Parameters", async (t) => {
  const db: IDatabaseRepository = {
    findStationsNearby: () => Promise.resolve([]),
    upsertStations: () => Promise.resolve(),
    insertStationStatus: () => Promise.resolve(),
    insertBatchLog: () => Promise.resolve(),
  };

  await t.step("should throw an error for invalid latitude", async () => {
    const useCase = new FindNearbyStationsUseCase(db);
    await assertRejects(
      () => useCase.execute(91, 121.5436, 500),
      Error,
      "Invalid latitude provided.",
    );
  });

  await t.step("should throw an error for invalid longitude", async () => {
    const useCase = new FindNearbyStationsUseCase(db);
    await assertRejects(
      () => useCase.execute(25.02605, 181, 500),
      Error,
      "Invalid longitude provided.",
    );
  });

  await t.step("should throw an error for invalid distance", async () => {
    const useCase = new FindNearbyStationsUseCase(db);
    await assertRejects(
      () => useCase.execute(25.02605, 121.5436, 0),
      Error,
      "Distance must be a positive number.",
    );
  });
});

Deno.test("FindNearbyStationsUseCase: Repository Error", async (t) => {
  const db: IDatabaseRepository = {
    findStationsNearby: () => Promise.reject(new Error("DB Error")),
    upsertStations: () => Promise.resolve(),
    insertStationStatus: () => Promise.resolve(),
    insertBatchLog: () => Promise.resolve(),
  };

  await t.step("should throw an error when the repository fails", async () => {
    const useCase = new FindNearbyStationsUseCase(db);
    await assertRejects(
      () => useCase.execute(25.02605, 121.5436, 500),
      Error,
      "DB Error",
    );
  });
});
