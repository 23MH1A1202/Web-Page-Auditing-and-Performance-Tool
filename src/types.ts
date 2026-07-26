export interface AuditScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export interface AuditMetric {
  title: string;
  value: string;
  status: 'pass' | 'average' | 'fail';
  description?: string;
}

export interface AuditItem {
  category: 'performance' | 'accessibility' | 'bestPractices' | 'seo';
  title: string;
  description: string;
  displayValue: string;
  status: 'pass' | 'average' | 'fail';
}

export interface AuditResult {
  scores: AuditScore;
  metrics?: AuditMetric[];
  audits: AuditItem[];
}

export interface HistoryItem {
  _id: string;
  url: string;
  result: AuditResult;
  createdAt: string;
}
