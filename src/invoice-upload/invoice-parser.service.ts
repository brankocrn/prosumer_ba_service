import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require('pdf-parse');
import * as fs from 'fs';

export interface ParsedInvoice {
  text: string;
  kwh: number | null;
  month: number | null;
  year: number | null;
}

const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, maj: 5, may: 5, jun: 6,
  jul: 7, avg: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, dec: 12,
};

@Injectable()
export class InvoiceParserService {
  private readonly logger = new Logger(InvoiceParserService.name);

  async parse(filePath: string, mimeType: string): Promise<ParsedInvoice> {
    let text = '';
    try {
      if (mimeType === 'application/pdf') {
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        text = data.text;
      } else if (mimeType.startsWith('text/')) {
        text = fs.readFileSync(filePath, 'utf8');
      } else {
        this.logger.warn(`Image OCR not yet enabled for ${mimeType}`);
        return { text: '', kwh: null, month: null, year: null };
      }
    } catch (err) {
      this.logger.error('Failed to read/parse file', err);
      throw err;
    }

    return {
      text,
      kwh: this.extractKwh(text),
      ...this.extractDate(text),
    };
  }

  private extractKwh(text: string): number | null {
    // ── Strategy 1: total kWh explicitly stated inline ────────────────────────
    // e.g. "OIEiUKkWh301 " or "total 301 kWh" or "ukupno 301 kWh"
    const totalPatterns = [
      /kWh\s*(\d{2,6})\b/gi,                                    // "kWh301"
      /\b(\d{2,6})\s*kWh/gi,                                    // "301 kWh"
      /ukupno[^0-9]{0,30}(\d{2,6})/gi,                         // "ukupno ... 301"
      /total\s+(?:energy|consumption)[^0-9]{0,20}(\d{2,6})/gi,
      /consumption[:\s]+(\d[\d.,]+)/gi,
      /energy used[:\s]+(\d[\d.,]+)/gi,
      /potro[šs]nja[:\s]+(\d[\d.,]+)/gi,
      /utro[šs]ak[:\s]+(\d[\d.,]+)/gi,
    ];

    const directCandidates: number[] = [];
    for (const re of totalPatterns) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const v = this.parseNumber(m[1]);
        if (v !== null && v >= 5 && v < 50_000) directCandidates.push(v);
      }
    }

    if (directCandidates.length > 0) {
      // Prefer values in the plausible monthly range (10–3000 kWh)
      const monthly = directCandidates.filter((v) => v >= 10 && v <= 3000);
      if (monthly.length > 0) return Math.max(...monthly);
      return Math.max(...directCandidates);
    }

    // ── Strategy 2: VT + NT tariff pair (day + night) ────────────────────────
    // Many Balkan invoices list two rows: higher tariff (VT) and lower tariff (NT).
    // Look for the "Utrošak" column header then grab the two integer values after it.
    const vtNtPatterns = [
      // "Utrošak" or similar as column header, integers on following lines
      /Utro[šs]ak[^\n]*\n[\s\S]{0,200}/gi,
      /30\.\d{2}\.\d{4}(\d{3,4})\n(\d{3,4})/g,   // "30.04.2026119\n182"
    ];

    const tariffPairs: number[] = [];

    // Special pattern for "30.04.2026119\n182" — meter reading date glued to value
    const dateGluedRe = /\d{2}\.\d{2}\.\d{4}(\d{2,5})\n(\d{2,5})/g;
    let dg: RegExpExecArray | null;
    while ((dg = dateGluedRe.exec(text)) !== null) {
      const a = parseInt(dg[1]);
      const b = parseInt(dg[2]);
      if (a >= 5 && a <= 9999) tariffPairs.push(a);
      if (b >= 5 && b <= 9999) tariffPairs.push(b);
    }

    if (tariffPairs.length >= 2) {
      const sum = tariffPairs.slice(0, 2).reduce((s, v) => s + v, 0);
      if (sum >= 10 && sum <= 6000) return sum;
    }

    // ── Strategy 3: lines that are purely a number in kWh range ──────────────
    const lines = text.split('\n');
    const standalonNums: number[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^\d{2,5}$/.test(trimmed)) {
        const v = parseInt(trimmed);
        if (v >= 10 && v <= 9999) standalonNums.push(v);
      }
    }

    if (standalonNums.length >= 2) {
      const sum = standalonNums[0] + standalonNums[1];
      if (sum >= 10 && sum <= 6000) return sum;
    }
    if (standalonNums.length === 1) return standalonNums[0];

    return null;
  }

  private parseNumber(raw: string): number | null {
    const cleaned = raw.includes(',') && raw.includes('.')
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(',', '.');
    const v = parseFloat(cleaned);
    return isNaN(v) || v <= 0 ? null : v;
  }

  private extractDate(text: string): { month: number | null; year: number | null } {
    const patterns = [
      /za\s+mjesec\s+(\d{1,2})[\/.\-](\d{4})/i,          // Bosnian "za mjesec 4/2026"
      /for\s+(?:the\s+)?month\s+(\d{1,2})[\/.\-](\d{4})/i,
      /\b(0?[1-9]|1[0-2])[\/](20\d{2})\b/,               // 04/2026
      /\b(0?[1-9]|1[0-2])\.(20\d{2})\b/,                  // 04.2026
      /\b(20\d{2})[\/.\-](0?[1-9]|1[0-2])\b/,            // 2026/04
    ];

    for (const re of patterns) {
      const m = text.match(re);
      if (m) {
        const a = parseInt(m[1]);
        const b = parseInt(m[2]);
        const year = a > 12 ? a : b;
        const month = a > 12 ? b : a;
        if (year >= 2000 && month >= 1 && month <= 12) return { month, year };
      }
    }

    // Month name fallback
    for (const [abbr, month] of Object.entries(MONTH_MAP)) {
      const re = new RegExp(`\\b${abbr}[a-z]*[\\s.,]+?(20\\d{2})\\b`, 'i');
      const m = text.match(re);
      if (m) return { month, year: parseInt(m[1]) };
    }

    return { month: null, year: null };
  }
}
