import React from 'react';
import { StatCards } from './StatCards';
import { ActivityGraph } from './ActivityGraph';
import { UsageRadar } from './UsageRadar';
import { RecentTransactions } from './RecentTransactions';

export const Grid = () => {
  return (
    <div className="grid grid-cols-12 gap-4">
      <StatCards />
      <ActivityGraph />
      <UsageRadar />
      <RecentTransactions />
    </div>
  );
};