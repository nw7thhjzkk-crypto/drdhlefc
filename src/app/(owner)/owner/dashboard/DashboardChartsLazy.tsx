"use client";

import dynamic from "next/dynamic";

const DashboardCharts = dynamic(() => import("./DashboardCharts"), {
  ssr: false,
  loading: () => <div className="dashboard-chart-loading">Loading charts...</div>,
});

export default DashboardCharts;
