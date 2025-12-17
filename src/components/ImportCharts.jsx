import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

export function ImportBarChart({ data, xKey, barKey, color }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3E352F" />
        <XAxis dataKey={xKey} stroke="#D4AF37" />
        <YAxis stroke="#D4AF37" />
        <Tooltip contentStyle={{ background: '#231A14', border: '1px solid #D4AF37', color: '#F5F5F0' }} />
        <Bar dataKey={barKey} fill={color || '#D4AF37'} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ImportPieChart({ data, dataKey, nameKey, colors }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={80} label>
          {data.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: '#231A14', border: '1px solid #D4AF37', color: '#F5F5F0' }} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ImportLineChart({ data, xKey, lineKey, color }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3E352F" />
        <XAxis dataKey={xKey} stroke="#D4AF37" />
        <YAxis stroke="#D4AF37" />
        <Tooltip contentStyle={{ background: '#231A14', border: '1px solid #D4AF37', color: '#F5F5F0' }} />
        <Line type="monotone" dataKey={lineKey} stroke={color || '#D4AF37'} strokeWidth={3} dot={{ r: 4 }} />
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  );
}
