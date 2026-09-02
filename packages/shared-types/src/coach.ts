export interface Coach {
  id: string;
  name: string;
  // Minimal placeholder - will be expanded later by ai-coaching
  offensiveStyle: string;
  defensiveStyle: string;
  /** Optional development influence: positive values accelerate player growth */
  developmentFactor?: number;
}
