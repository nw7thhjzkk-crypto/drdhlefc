"use client";

import { PieChart, Pie, Cell, Tooltip as PieTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#3b82f6", "#ec4899", "#8b5cf6"];

export default function DashboardCharts({ genderData, revenueData }: { genderData: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */, revenueData: any[] /* eslint-disable-line @typescript-eslint/no-explicit-any */ }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-80">

      {/* Gender Ratio Donut Chart */}
      <div className="h-full flex flex-col items-center">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Active Member Gender Ratio</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={genderData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {genderData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <PieTooltip />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Bar Chart */}
      <div className="h-full flex flex-col items-center">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
            <BarTooltip formatter={(value) => [`$${value}`, "Revenue"]} />
            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
