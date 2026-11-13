import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

/** Load test data from data/<file>.csv (header row = field names) or data/<file>.json */
export function loadData<T = Record<string, string>>(file: string): T[] {
  const raw = readFileSync(join(__dirname, '..', 'data', file), 'utf-8');
  return file.endsWith('.json')
    ? JSON.parse(raw)
    : (parse(raw, { columns: true, skip_empty_lines: true, trim: true }) as T[]);
}
