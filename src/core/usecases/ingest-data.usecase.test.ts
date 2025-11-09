import {
  assertEquals,
  assertRejects,
  assertMatch,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  spy,
  stub,
  assertSpyCall,
  assertSpyCalls,
} from "https://deno.land/std@0.208.0/testing/mock.ts";
import { IngestDataUseCase } from "./ingest-data.usecase.ts";
import { IDatabaseRepository } from "../types/database.types.ts";
import { IYouBikeService } from "../interfaces/youbike.service.ts";
import { YouBikeStation } from "../types/youbike.types.ts";

const MOCK_YOUBIKE_STATION: YouBikeStation = {
  sno: "500101001",
  sna: "YouBike2.0_捷運科技大樓站",
  sarea: "大安區",
  mday: "2024-05-23 10:50:20",
  ar: "復興南路二段235號前",
  sareaen: "Daan Dist.",
  snaen: "YouBike2.0_MRT Technology Bldg. Sta.",
  aren: "No.235， Sec. 2， Fuxing S. Rd.",
  act: "1",
  srcUpdateTime: "2024-05-23 10:50:20",
  updateTime: "2024-05-23 10:51:22",
  infoTime: "2024-05-23 10:50:20",
  infoDate: "2024-05-23",
  Quantity: 28,
  available_rent_bikes: 25,
  latitude: 25.02605,
  longitude: 121.5436,
  available_return_bikes: 3,
};

Deno.test("IngestDataUseCase: Happy Path", async (t) => {
  const youbikeService: IYouBikeService = {
    fetchData: () => Promise.resolve([MOCK_YOUBIKE_STATION]),
  };
  const db: IDatabaseRepository = {
    upsertStations: () => Promise.resolve(),
    insertStationStatus: () => Promise.resolve(),
    insertBatchLog: () => Promise.resolve(),
  };

  await t.step("should ingest data successfully", async () => {
    const fetchDataSpy = spy(youbikeService, "fetchData");
    const upsertStationsSpy = spy(db, "upsertStations");
    const insertStationStatusSpy = spy(db, "insertStationStatus");
    const insertBatchLogSpy = spy(db, "insertBatchLog");

    const useCase = new IngestDataUseCase(db, youbikeService);
    const result = await useCase.execute();

    assertSpyCalls(fetchDataSpy, 1);
    assertSpyCalls(upsertStationsSpy, 1);
    assertSpyCalls(insertStationStatusSpy, 1);
    assertSpyCalls(insertBatchLogSpy, 1);

    assertEquals(result.status, "success");
    assertEquals(result.inserted, 1);

     assertSpyCall(upsertStationsSpy, 0, {
      args: [[{
        sno: "500101001",
        name_zh: "YouBike2.0_捷運科技大樓站",
        name_en: "YouBike2.0_MRT Technology Bldg. Sta.",
        area_zh: "大安區",
        area_en: "Daan Dist.",
        address_zh: "復興南路二段235號前",
        address_en: "No.235， Sec. 2， Fuxing S. Rd.",
        total_capacity: 28,
        latitude: 25.02605,
        longitude: 121.5436,
      }]],
    });

    assertSpyCall(insertStationStatusSpy, 0, {
        args: [[{
            station_sno: "500101001",
            data_timestamp: "2024-05-23 10:50:20",
            available_rent_bikes: 25,
            available_return_docks: 3,
            is_active: true,
            src_update_time: "2024-05-23 10:50:20",
            api_update_time: "2024-05-23 10:51:22",
        }]],
    });

    assertSpyCall(insertBatchLogSpy, 0, {
        args: [{
            status: "success",
            records_fetched: 1,
            records_inserted: 1,
        }],
    });
  });
});

Deno.test("IngestDataUseCase: YouBike API fetch failure", async (t) => {
  const youbikeService: IYouBikeService = {
    fetchData: () => Promise.reject(new Error("API Error")),
  };
  const db: IDatabaseRepository = {
    upsertStations: () => Promise.resolve(),
    insertStationStatus: () => Promise.resolve(),
    insertBatchLog: () => Promise.resolve(),
  };

  await t.step("should handle API fetch failure", async () => {
    const insertBatchLogSpy = spy(db, "insertBatchLog");

    const useCase = new IngestDataUseCase(db, youbikeService);
    await assertRejects(
      () => useCase.execute(),
      Error,
      "API Error",
    );

    assertSpyCalls(insertBatchLogSpy, 1);
    assertSpyCall(insertBatchLogSpy, 0, {
        args: [{
            status: "failure",
            error_message: "API Error",
        }],
    });
  });
});

Deno.test("IngestDataUseCase: Database write failure", async (t) => {
  const youbikeService: IYouBikeService = {
    fetchData: () => Promise.resolve([MOCK_YOUBIKE_STATION]),
  };
  const db: IDatabaseRepository = {
    upsertStations: () => Promise.reject(new Error("DB Error")),
    insertStationStatus: () => Promise.resolve(),
    insertBatchLog: () => Promise.resolve(),
  };

  await t.step("should handle database write failure", async () => {
    const insertBatchLogSpy = spy(db, "insertBatchLog");

    const useCase = new IngestDataUseCase(db, youbikeService);
    await assertRejects(
      () => useCase.execute(),
      Error,
      "DB Error",
    );

    assertSpyCalls(insertBatchLogSpy, 1);
    assertSpyCall(insertBatchLogSpy, 0, {
        args: [{
            status: "failure",
            error_message: "DB Error",
        }],
    });
  });
});

Deno.test("IngestDataUseCase: YouBike API returns an empty array", async (t) => {
  const youbikeService: IYouBikeService = {
    fetchData: () => Promise.resolve([]),
  };
  const db: IDatabaseRepository = {
    upsertStations: () => Promise.resolve(),
    insertStationStatus: () => Promise.resolve(),
    insertBatchLog: () => Promise.resolve(),
  };

  await t.step("should handle empty array from YouBike API", async () => {
    const insertBatchLogSpy = spy(db, "insertBatchLog");

    const useCase = new IngestDataUseCase(db, youbikeService);
    await assertRejects(
      () => useCase.execute(),
      Error,
      "YouBike API returned an empty array",
    );

    assertSpyCalls(insertBatchLogSpy, 1);
    assertSpyCall(insertBatchLogSpy, 0, {
        args: [{
            status: "failure",
            error_message: "YouBike API returned an empty array",
        }],
    });
  });
});
