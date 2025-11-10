import { IDatabaseRepository, StationPayload } from "../types/database.types.ts";

export class FindNearbyStationsUseCase {
  constructor(private readonly db: IDatabaseRepository) {}

  async execute(
    latitude: number,
    longitude: number,
    distanceInMeters: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<StationPayload[]> {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new Error("Invalid latitude provided.");
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error("Invalid longitude provided.");
    }
    if (!Number.isFinite(distanceInMeters) || distanceInMeters <= 0) {
      throw new Error("Distance must be a positive number.");
    }
    if (!Number.isInteger(page) || page <= 0) {
      throw new Error("Page must be a positive number.");
    }
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new Error("Limit must be a positive number.");
    }

    const offset = (page - 1) * limit;

    return this.db.findStationsNearby(
      latitude,
      longitude,
      distanceInMeters,
      limit,
      offset,
    );
  }
}
