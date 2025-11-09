import { YouBikeStation } from "../types/youbike.types.ts";

export interface IYouBikeService {
  fetchData(): Promise<YouBikeStation[]>;
}
