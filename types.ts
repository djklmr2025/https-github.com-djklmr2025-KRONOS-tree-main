
export interface KeyEntry {
  id: string;
  key: string;
  code: string;
  timestamp: number;
  interval: number;
  type: 'alpha' | 'numeric' | 'special' | 'command';
}

export interface SessionStats {
  totalKeys: number;
  wpm: number;
  accuracy: number;
  averageInterval: number;
  startTime: number;
}

export interface AnalysisResult {
  summary: string;
  patterns: string[];
  recommendations: string;
}
