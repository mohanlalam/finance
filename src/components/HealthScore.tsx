import React from 'react';
import { HealthScoreBreakdown } from '../hooks/usePortfolioInsights';

interface HealthScoreProps {
  score: HealthScoreBreakdown;
}

const LABELS: { key: keyof Omit<HealthScoreBreakdown, 'total'>; label: string; max: number; color: string }[] = [
  { key: 'diversification', label: 'Diversification', max: 25, color: '#3b82f6' },
  { key: 'assetBalance', label: 'Asset Balance', max: 25, color: '#8b5cf6' },
  { key: 'concentration', label: 'Concentration', max: 25, color: '#f59e0b' },
  { key: 'insuranceCoverage', label: 'Insurance', max: 25, color: '#10b981' },
];

function scoreColor(total: number): string {
  if (total >= 80) return '#10b981';
  if (total >= 60) return '#3b82f6';
  if (total >= 40) return '#f59e0b';
  return '#ef4444';
}

function scoreLabel(total: number): string {
  if (total >= 80) return 'Excellent';
  if (total >= 60) return 'Good';
  if (total >= 40) return 'Fair';
  return 'Needs Work';
}

function HealthScore({ score }: HealthScoreProps) {
  const cx = 80;
  const cy = 80;
  const r = 64;
  const stroke = 10;
  const circumference = 2 * Math.PI * r;
  const pct = score.total / 100;
  const dashArray = `${pct * circumference} ${circumference}`;
  const color = scoreColor(score.total);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-4">Portfolio Health</h3>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Circular gauge */}
        <div className="relative shrink-0">
          <svg
            width={160}
            height={160}
            viewBox="0 0 160 160"
            role="img"
            aria-label={`Portfolio health score: ${score.total} out of 100, rated ${scoreLabel(score.total)}`}
          >
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={stroke}
              className="dark:stroke-slate-700"
            />
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeDasharray={dashArray}
              strokeDashoffset={0}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
              className="transition-all duration-700 ease-out"
            />
            <text
              x={cx}
              y={cy - 8}
              textAnchor="middle"
              fill={color}
              fontSize={28}
              fontWeight={800}
            >
              {score.total}
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize={10}
              fontWeight={600}
            >
              {scoreLabel(score.total)}
            </text>
          </svg>
        </div>

        {/* Breakdown bars */}
        <div className="flex-1 w-full space-y-3">
          {LABELS.map(({ key, label, max, color: barColor }) => {
            const val = score[key];
            const barPct = (val / max) * 100;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{val}/{max}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${barPct}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default React.memo(HealthScore);
