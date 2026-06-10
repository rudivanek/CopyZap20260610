import React from 'react';

interface PriorityAction {
  title: string;
  reason: string;
}

interface FinalRecommendation {
  winnerId: string;
  why: string;
  nextSteps: string[];
}

interface ActionPanelProps {
  finalRecommendation?: FinalRecommendation;
  priorityActions?: PriorityAction[];
  winnerLabel: string;
}

export const ActionPanel: React.FC<ActionPanelProps> = () => {
  return null;
};
