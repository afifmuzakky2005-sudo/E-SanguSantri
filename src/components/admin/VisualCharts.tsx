import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Transaction } from '../../types';

interface TransactionTrendProps {
  transactions: Transaction[];
}

export function TransactionTrendChart({ transactions }: TransactionTrendProps) {
  const monthlyData: { [key: string]: { month: string; Setor: number; Tarik: number } } = {};

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const now = new Date();
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = { month: label, Setor: 0, Tarik: 0 };
  }

  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    const key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyData[key]) {
      if (tx.type === 'Setor') {
        monthlyData[key].Setor += tx.amount;
      } else {
        monthlyData[key].Tarik += tx.amount;
      }
    }
  });

  const chartData = Object.values(monthlyData);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280" 
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#6b7280" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `Rp ${value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : (value / 1000).toFixed(0) + 'rb'}`}
          />
          <Tooltip 
            formatter={(value: any) => [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value), '']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="Setor" name="Setoran (Debit)" fill="#059669" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Tarik" name="Penarikan (Kredit)" fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface AllocationPieProps {
  tabunganTotal: number;
}

export function AllocationPieChart({ tabunganTotal }: AllocationPieProps) {
  const isZero = tabunganTotal === 0;
  
  const data = [
    { name: 'Tabungan', value: isZero ? 1 : tabunganTotal }
  ];

  const COLORS = ['#0f766e'];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
      <div className="h-44 w-44 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={isZero ? [{name: 'Empty', value: 1}] : data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              {isZero ? (
                <Cell fill="#e5e7eb" />
              ) : (
                data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))
              )}
            </Pie>
            {!isZero && (
              <Tooltip
                formatter={(value: any) => [new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value), '']}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Total Tabungan</span>
          <span className="text-sm font-bold text-gray-800">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tabunganTotal)}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-3 w-full">
        <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50/50 border border-teal-100/50">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-[#0f766e]" />
            <div className="text-xs font-bold text-gray-700">Saldo Tabungan Santri</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-black text-teal-900">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tabunganTotal)}
            </div>
            <div className="text-[10px] text-teal-600 font-bold">100% Saldo Aktif</div>
          </div>
        </div>
      </div>
    </div>
  );
}
