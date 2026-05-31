import React, { useEffect, useState } from 'react';
import { sendMessage } from '@/services/messagingService';
import { isChromeExtension } from '@/hooks/useChrome';
import type { Pet, XPEvent } from '@/types/pet';
import { PET_STAGE_EMOJI, PET_STAGE_LABELS, PET_STAGES_ORDER, PET_STAGE_THRESHOLDS } from '@/types/pet';
import { getXPForNextStage, getXPForNextLevel } from '@/utils/xpCalculator';
import { getRelativeTime } from '@/utils/timeUtils';

export default function FocusPet() {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPet(); }, []);

  const loadPet = async () => {
    if (!isChromeExtension()) { setLoading(false); return; }
    try {
      const res = await sendMessage<any>({ type: 'GET_PET' });
      if (res?.pet) setPet(res.pet);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading || !pet) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  const stageProgress = getXPForNextStage(pet.xp);
  const levelProgress = getXPForNextLevel(pet.totalXpEarned);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Focus Pet</h1>
        <p className="text-sm text-muted-foreground mt-1">Your virtual productivity companion</p>
      </div>

      {/* Pet Display */}
      <div className="glass-card p-8 text-center">
        <div className="text-8xl mb-4 animate-[float_3s_ease-in-out_infinite]">
          {PET_STAGE_EMOJI[pet.stage]}
        </div>
        <h2 className="text-2xl font-bold">{pet.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {PET_STAGE_LABELS[pet.stage]} · Level {pet.level}
        </p>

        {/* Streak */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">🔥 {pet.streak}</p>
            <p className="text-[10px] text-muted-foreground">Current Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">⭐ {pet.bestStreak}</p>
            <p className="text-[10px] text-muted-foreground">Best Streak</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-info">{pet.totalXpEarned}</p>
            <p className="text-[10px] text-muted-foreground">Total XP</p>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stage Progress */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-3">Evolution Progress</h3>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>{PET_STAGE_LABELS[pet.stage]}</span>
            <span>{stageProgress.nextStage ? PET_STAGE_LABELS[stageProgress.nextStage] : 'Max!'}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-info rounded-full transition-all duration-700"
              style={{ width: `${stageProgress.progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {stageProgress.xpProgress} / {stageProgress.xpNeeded} XP
          </p>
        </div>

        {/* Level Progress */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-3">Level Progress</h3>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Level {levelProgress.currentLevel}</span>
            <span>Level {levelProgress.currentLevel + 1}</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-warning to-amber-400 rounded-full transition-all duration-700"
              style={{ width: `${levelProgress.progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {Math.round(levelProgress.progress)} / {levelProgress.nextLevelXP} XP
          </p>
        </div>
      </div>

      {/* Evolution Path */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4">Evolution Path</h3>
        <div className="flex items-center justify-between">
          {PET_STAGES_ORDER.map((stage, i) => {
            const isReached = PET_STAGES_ORDER.indexOf(pet.stage) >= i;
            const isCurrent = pet.stage === stage;
            return (
              <React.Fragment key={stage}>
                <div className={`flex flex-col items-center gap-1 ${isCurrent ? 'scale-110' : ''} transition-transform`}>
                  <span className={`text-3xl ${isReached ? '' : 'opacity-30 grayscale'} ${isCurrent ? 'animate-[pulse-glow_2s_ease-in-out_infinite]' : ''}`}>
                    {PET_STAGE_EMOJI[stage]}
                  </span>
                  <span className={`text-[10px] font-medium ${isReached ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {PET_STAGE_LABELS[stage].replace(/^[^ ]+\s+/, '')}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    {PET_STAGE_THRESHOLDS[stage]} XP
                  </span>
                </div>
                {i < PET_STAGES_ORDER.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${isReached ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Evolution History */}
      {pet.evolutionHistory.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-3">Evolution History</h3>
          <div className="space-y-2">
            {pet.evolutionHistory.map((evo, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                <span>{PET_STAGE_EMOJI[evo.fromStage]}</span>
                <span className="text-muted-foreground">→</span>
                <span>{PET_STAGE_EMOJI[evo.toStage]}</span>
                <span className="text-xs text-muted-foreground flex-1">{getRelativeTime(evo.date)}</span>
                <span className="text-xs text-primary">{evo.xpAtEvolution} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
