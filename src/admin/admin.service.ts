import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { SolarLead, LeadStatus } from '../solar-leads/solar-lead.entity';
import { PageView } from '../analytics/page-view.entity';

export interface LeadsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  status?: LeadStatus;
  search?: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  // Simple in-process cache for reverse-geocode results
  private readonly geocodeCache = new Map<string, string>();

  constructor(
    @InjectRepository(SolarLead)
    private readonly leadRepo: Repository<SolarLead>,
    @InjectRepository(PageView)
    private readonly pageViewRepo: Repository<PageView>,
  ) {}

  // ── Metrics ─────────────────────────────────────────────────────────────────
  async getMetrics() {
    const [total, byStatus, recentCounts, aggRow, topCities,
           totalSiteVisits, totalKalkulatorVisits,
           uniqueSiteVisitors, uniqueKalkulatorVisitors,
           visitorsLast30Days] = await Promise.all([
      this.leadRepo.count(),

      this.leadRepo
        .createQueryBuilder('l')
        .select('l.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('l.status')
        .getRawMany(),

      // leads per day for the last 30 days
      this.leadRepo
        .createQueryBuilder('l')
        .select("DATE(l.createdAt)", 'day')
        .addSelect('COUNT(*)', 'count')
        .where("l.createdAt >= NOW() - INTERVAL '30 days'")
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany(),

      // averages & sums
      this.leadRepo
        .createQueryBuilder('l')
        .select('AVG(l.recommendedSystemKw)', 'avgSystemKw')
        .addSelect('SUM(l.estimatedAnnualSavingsKm)', 'totalSavings')
        .addSelect('AVG(l.estimatedPaybackYears)', 'avgPayback')
        .addSelect('SUM(l.estimatedSystemCostKm)', 'totalSystemValue')
        .getRawOne(),

      // top cities (from locationCity or lat/lon label)
      this.leadRepo
        .createQueryBuilder('l')
        .select('COALESCE(l.locationCity, l.locationLabel)', 'city')
        .addSelect('COUNT(*)', 'count')
        .where('COALESCE(l.locationCity, l.locationLabel) IS NOT NULL')
        .groupBy('city')
        .orderBy('count', 'DESC')
        .limit(5)
        .getRawMany(),

      // total page-view rows for any page
      this.pageViewRepo.count(),

      // total page-view rows for /kalkulator
      this.pageViewRepo.count({ where: { page: '/kalkulator' } }),

      // unique sessions on the whole site
      this.pageViewRepo
        .createQueryBuilder('pv')
        .select('COUNT(DISTINCT pv.sessionId)', 'cnt')
        .getRawOne()
        .then((r: any) => r?.cnt ?? 0),

      // unique sessions on /kalkulator
      this.pageViewRepo
        .createQueryBuilder('pv')
        .select('COUNT(DISTINCT pv.sessionId)', 'cnt')
        .where('pv.page = :p', { p: '/kalkulator' })
        .getRawOne()
        .then((r: any) => r?.cnt ?? 0),

      // daily visitors (site + kalkulator) for last 30 days
      this.pageViewRepo
        .createQueryBuilder('pv')
        .select("DATE(pv.createdAt)", 'day')
        .addSelect("COUNT(*)", 'site_count')
        .addSelect("COUNT(*) FILTER (WHERE pv.page = '/kalkulator')", 'kalk_count')
        .where("pv.createdAt >= NOW() - INTERVAL '30 days'")
        .groupBy('day')
        .orderBy('day', 'ASC')
        .getRawMany(),
    ]);

    const statusMap: Record<string, number> = { new: 0, contacted: 0, closed: 0 };
    for (const row of byStatus) statusMap[row.status] = Number(row.count);

    return {
      total,
      byStatus: statusMap,
      leadsLast30Days: recentCounts.map((r) => ({
        day: r.day as string,
        count: Number(r.count),
      })),
      avgSystemKw:      Math.round((Number(aggRow?.avgSystemKw)      || 0) * 10) / 10,
      avgPaybackYears:  Math.round((Number(aggRow?.avgPayback)        || 0) * 10) / 10,
      totalSavingsKm:   Math.round( Number(aggRow?.totalSavings)      || 0),
      totalSystemValue: Math.round( Number(aggRow?.totalSystemValue)  || 0),
      topCities: topCities.map((r) => ({ city: r.city as string, count: Number(r.count) })),

      // ── Visitor stats ──────────────────────────────────────────────────────
      totalSiteVisits:           Number(totalSiteVisits),
      totalKalkulatorVisits:     Number(totalKalkulatorVisits),
      uniqueSiteVisitors:        Number(uniqueSiteVisitors),
      uniqueKalkulatorVisitors:  Number(uniqueKalkulatorVisitors),
      visitorsLast30Days: visitorsLast30Days.map((r: any) => ({
        day: r.day as string,
        siteCount: Number(r.site_count),
        kalkulatorCount: Number(r.kalk_count),
      })),
    };
  }

  // ── Paginated leads ──────────────────────────────────────────────────────────
  async getLeads(q: LeadsQuery) {
    const page  = Math.max(1, q.page  ?? 1);
    const limit = Math.min(100, Math.max(1, q.limit ?? 20));
    const skip  = (page - 1) * limit;

    const SORTABLE = ['createdAt', 'name', 'email', 'recommendedSystemKw',
                      'estimatedPaybackYears', 'status', 'locationCity'];
    const sortBy  = SORTABLE.includes(q.sortBy ?? '') ? q.sortBy! : 'createdAt';
    const sortDir = q.sortDir === 'asc' ? 'ASC' : 'DESC';

    const qb = this.leadRepo.createQueryBuilder('l');

    if (q.status) qb.andWhere('l.status = :status', { status: q.status });

    if (q.search) {
      const like = `%${q.search}%`;
      qb.andWhere(
        '(l.name ILIKE :s OR l.email ILIKE :s OR l.phone ILIKE :s OR l.locationCity ILIKE :s OR l.locationLabel ILIKE :s)',
        { s: like },
      );
    }

    const [items, total] = await qb
      .orderBy(`l.${sortBy}`, sortDir as 'ASC' | 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Enrich items that have GPS coords but no label yet (background, non-blocking)
    this.enrichGeoLabels(items).catch(() => {});

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateLeadStatus(id: number, status: LeadStatus) {
    await this.leadRepo.update(id, { status });
    return this.leadRepo.findOneByOrFail({ id });
  }

  // ── Reverse geocoding (Nominatim) ────────────────────────────────────────────
  private async enrichGeoLabels(leads: SolarLead[]): Promise<void> {
    for (const lead of leads) {
      if (lead.locationLabel || !lead.latitude || !lead.longitude) continue;
      const label = await this.reverseGeocode(
        Number(lead.latitude), Number(lead.longitude),
      );
      if (label) {
        lead.locationLabel = label;
        await this.leadRepo.update(lead.id, { locationLabel: label });
      }
    }
  }

  private async reverseGeocode(lat: number, lon: number): Promise<string | null> {
    const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (this.geocodeCache.has(key)) return this.geocodeCache.get(key)!;

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=bs`;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      let res: Response;
      try {
        res = await fetch(url, {
          signal: ctrl.signal,
          headers: { 'User-Agent': 'Prosumer.ba/1.0 admin-geocoder' },
        });
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) return null;
      const data = await res.json() as any;
      const addr = data?.address;
      if (!addr) return null;

      const city    = addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? '';
      const country = addr.country ?? '';
      const label   = [city, country].filter(Boolean).join(', ');
      if (label) this.geocodeCache.set(key, label);
      return label || null;
    } catch (err) {
      this.logger.warn(`Reverse geocode failed for (${lat},${lon}): ${err}`);
      return null;
    }
  }
}
