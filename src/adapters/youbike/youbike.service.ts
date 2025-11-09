import { IYouBikeService } from "../../core/interfaces/youbike.service.ts";
import { YouBikeStation } from "../../core/types/youbike.types.ts";

const YBIKE_API_URL = "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json";

export class YouBikeService implements IYouBikeService {
  async fetchData(): Promise<YouBikeStation[]> {
    const response = await fetch(YBIKE_API_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch YouBike API: ${response.statusText}`);
    }
    return await response.json();
  }
}
