import { Injectable, Logger } from '@nestjs/common';

export interface PvgisResult {
  /** Daily in-plane irradiation in kWh/m²/day — equivalent to peak sun hours */
  peakSunHoursPerDay: number;
  /** Annual in-plane irradiation in kWh/m²/year */
  annualIrradianceKwhM2: number;
  /** Annual AC energy output for a 1 kWp system (kWh/kWp/year), losses included */
  annualEnergyKwhPerKwp: number;
}

interface PvgisApiResponse {
  outputs: {
    totals: {
      fixed: {
        'E_d': number;   // daily energy output kWh/kWp
        'E_y': number;   // yearly energy output kWh/kWp
        'H(i)_d': number; // daily in-plane irradiation kWh/m²
        'H(i)_y': number; // yearly in-plane irradiation kWh/m²
      };
    };
  };
}

const PVGIS_BASE = 'https://re.jrc.ec.europa.eu/api/v5_2/PVcalc';
const TIMEOUT_MS = 7_000;

@Injectable()
export class PvgisService {
  private readonly logger = new Logger(PvgisService.name);

  /**
   * Fetches real solar irradiance data from the EU JRC PVGIS API.
   *
   * @param lat       Latitude (-90 … 90)
   * @param lon       Longitude (-180 … 180)
   * @param tiltDeg   Roof tilt in degrees (default 30)
   * @param azimuthDeg  Azimuth from south in degrees; south=0, east=-90, west=90 (default 0)
   * @returns Parsed irradiance data, or null if the API is unreachable / returns an error.
   */
  async fetchIrradiance(
    lat: number,
    lon: number,
    tiltDeg = 30,
    azimuthDeg = 0,
  ): Promise<PvgisResult | null> {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      peakpower: '1',
      loss: '20',           // matches our SYSTEM_EFFICIENCY 0.8 (1 - 0.20 = 0.80)
      angle: String(tiltDeg),
      aspect: String(azimuthDeg),
      outputformat: 'json',
    });

    const url = `${PVGIS_BASE}?${params.toString()}`;
    this.logger.debug(`PVGIS request: ${url}`);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      let res: Response;
      try {
        res = await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        this.logger.warn(`PVGIS returned HTTP ${res.status} — falling back to latitude-band model`);
        return null;
      }

      const data: PvgisApiResponse = await res.json() as PvgisApiResponse;
      const fixed = data?.outputs?.totals?.fixed;

      if (!fixed || typeof fixed['H(i)_d'] !== 'number') {
        this.logger.warn('PVGIS response missing expected fields — falling back to latitude-band model');
        return null;
      }

      const result: PvgisResult = {
        peakSunHoursPerDay: fixed['H(i)_d'],
        annualIrradianceKwhM2: fixed['H(i)_y'],
        annualEnergyKwhPerKwp: fixed['E_y'],
      };

      this.logger.debug(
        `PVGIS result — H(i)_d: ${result.peakSunHoursPerDay} kWh/m²/day, E_y: ${result.annualEnergyKwhPerKwp} kWh/kWp/year`,
      );

      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`PVGIS fetch failed (${message}) — falling back to latitude-band model`);
      return null;
    }
  }
}
