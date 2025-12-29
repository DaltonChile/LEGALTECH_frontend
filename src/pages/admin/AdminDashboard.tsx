import React from 'react';
import { TopBar } from '../../components/admin/dashboard/TopBar';
import { Grid } from '../../components/admin/dashboard/Grid';

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <TopBar />
      <Grid />
    </div>
  );
}