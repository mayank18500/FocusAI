import React, { useEffect, useState } from 'react';
import { sendMessage } from '@/services/messagingService';
import { isChromeExtension } from '@/hooks/useChrome';
import type { Achievement, AchievementCategory } from '@/types/achievements';
import { ACHIEVEMENT_TIER_COLORS } from '@/types/achievements';
import { getRelativeTime } from '@/utils/timeUtils';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  sessions: '🎯 Sessions',
  streaks: '🔥 Streaks',
  time: '⏱ Time',
  special: '⭐ Special',
};

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState<AchievementCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAchievements(); }, []);

  const loadAchievements = async () => {
    if (!isChromeExtension()) { setLoading(false); return; }
    try {
      const res = await sendMessage<any>({ type: 'GET_ACHIEVEMENTS' });
      if (res?.achievements) setAchievements(res.achievements);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? achievements : achievements.filter((a) => a.category === filter);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Achievements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unlocked} of {achievements.length} unlocked
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold gradient-text">{Math.round((unlocked / Math.max(1, achievements.length)) * 100)}%</p>
          <p className="text-xs text-muted-foreground">Completion</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary via-info to-success rounded-full transition-all duration-700"
          style={{ width: `${(unlocked / Math.max(1, achievements.length)) * 100}%` }}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <FilterBtn key={key} active={filter === key} onClick={() => setFilter(key as AchievementCategory)} label={label} />
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((achievement) => (
          <div
            key={achievement.id}
            className={`glass-card p-4 text-center transition-all ${
              achievement.unlocked
                ? 'border-primary/20 hover:border-primary/40'
                : 'opacity-60 grayscale'
            }`}
          >
            <span className="text-3xl block mb-2">{achievement.icon}</span>
            <h3 className="text-xs font-semibold mb-0.5">{achievement.title}</h3>
            <p className="text-[10px] text-muted-foreground mb-2 line-clamp-2">{achievement.description}</p>
            
            {/* Tier Badge */}
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${ACHIEVEMENT_TIER_COLORS[achievement.tier]}20`,
                color: ACHIEVEMENT_TIER_COLORS[achievement.tier],
              }}
            >
              {achievement.tier}
            </span>

            {/* Progress */}
            {!achievement.unlocked && (
              <div className="mt-2">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(achievement.progress / achievement.requirement) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">
                  {achievement.progress} / {achievement.requirement}
                </p>
              </div>
            )}

            {achievement.unlocked && achievement.unlockedAt && (
              <p className="text-[9px] text-success mt-2">
                ✓ {getRelativeTime(achievement.unlockedAt)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
