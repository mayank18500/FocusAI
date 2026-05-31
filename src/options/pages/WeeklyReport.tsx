import React, { useEffect, useState } from 'react';
import { sendMessage } from '@/services/messagingService';
import { isChromeExtension } from '@/hooks/useChrome';
import { formatDuration } from '@/utils/timeUtils';
import type { WeeklyReport as WeeklyReportType } from '@/types/tracking';
import { generateWeeklyReportPDF, downloadBlob } from '@/services/pdfService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function WeeklyReport() {
  const [report, setReport] = useState<WeeklyReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => { loadReport(); }, []);

  const loadReport = async () => {
    if (!isChromeExtension()) { setLoading(false); return; }
    try {
      const res = await sendMessage<any>({ type: 'GET_WEEKLY_REPORT' });
      if (res?.report) setReport(res.report);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDownloadPDF = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      const blob = await generateWeeklyReportPDF(report);
      downloadBlob(blob, `focusguard-report-${report.weekStart}.pdf`);
    } catch (err) { console.error('PDF generation failed:', err); }
    finally { setDownloading(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!report) {
    return <div className="text-center py-20 text-muted-foreground"><p className="text-4xl mb-3">📋</p><p>No report data available yet.</p></div>;
  }

  const chartData = report.dailyStats.map((d) => ({
    date: d.date.slice(5),
    focus: Math.round(d.focusTime / 60),
    distraction: Math.round(d.distractionTime / 60),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Weekly Report</h1>
          <p className="text-sm text-muted-foreground mt-1">{report.weekStart} — {report.weekEnd}</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {downloading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
          ) : (
            <>📥 Download PDF</>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SumCard label="Focus Time" value={formatDuration(report.totalFocusTime)} icon="⏱" />
        <SumCard label="Distraction" value={formatDuration(report.totalDistractionTime)} icon="📱" />
        <SumCard label="Focus Score" value={`${report.focusScore}/100`} icon="⚡" />
        <SumCard label="Completion" value={`${report.completionRate}%`} icon="✅" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SumCard label="Sessions" value={`${report.sessionsCompleted}/${report.sessionsTotal}`} icon="🎯" />
        <SumCard label="Streak" value={`${report.streakDays} days`} icon="🔥" />
      </div>

      {/* Chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4">Daily Breakdown (minutes)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} />
            <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} />
            <Tooltip contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '8px', color: '#fafafa', fontSize: 12 }} />
            <Bar dataKey="focus" fill="#10b981" radius={[4, 4, 0, 0]} name="Focus" />
            <Bar dataKey="distraction" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.7} name="Distraction" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Sites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-success mb-3">✅ Most Productive</h3>
          {report.topProductiveSites.length === 0 ? (
            <p className="text-xs text-muted-foreground">No data</p>
          ) : report.topProductiveSites.slice(0, 5).map((s) => (
            <div key={s.domain} className="flex justify-between py-1.5">
              <span className="text-xs">{s.domain}</span>
              <span className="text-xs text-muted-foreground">{formatDuration(s.totalTime)}</span>
            </div>
          ))}
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-destructive mb-3">⚠️ Most Distracting</h3>
          {report.topDistractingSites.length === 0 ? (
            <p className="text-xs text-muted-foreground">No data</p>
          ) : report.topDistractingSites.slice(0, 5).map((s) => (
            <div key={s.domain} className="flex justify-between py-1.5">
              <span className="text-xs">{s.domain}</span>
              <span className="text-xs text-muted-foreground">{formatDuration(s.totalTime)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SumCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="glass-card p-3 text-center">
      <span className="text-lg block">{icon}</span>
      <p className="text-lg font-bold mt-1">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}
