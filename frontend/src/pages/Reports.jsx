import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Filter, Calendar, TrendingUp, AlertCircle, Brain } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function Reports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('month'); // month, year, custom
  const [customDates, setCustomDates] = useState({ start: '', end: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
        const params = {};
        if (range !== 'custom') {
            params.filter_type = range;
        } else {
            if (customDates.start) params.start_date = customDates.start;
            if (customDates.end) params.end_date = customDates.end;
        }

        const res = await axios.get('http://127.0.0.1:8000/transactions/', { params });
        setData(res.data);
    } catch (error) {
        console.error("Error fetching report data", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [range, customDates]);

  // Process Data for Charts
  const categoryData = Object.entries(
    data.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

  const tagData = Object.entries(
    data.reduce((acc, curr) => {
      acc[curr.tag] = (acc[curr.tag] || 0) + curr.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  // Trend Data (Daily)
  const trendMap = data.reduce((acc, curr) => {
      const d = curr.date; // YYYY-MM-DD
      acc[d] = (acc[d] || 0) + curr.amount;
      return acc;
  }, {});
  const trendData = Object.keys(trendMap).sort().map(d => ({ date: format(new Date(d), 'dd MMM'), amount: trendMap[d] }));

  // Psychology Metrics
  const totalSpent = data.reduce((acc, curr) => acc + curr.amount, 0);
  const wants = data.filter(t => t.tag === 'Want').reduce((acc, curr) => acc + curr.amount, 0);
  const needs = data.filter(t => t.tag === 'Need').reduce((acc, curr) => acc + curr.amount, 0);
  const savings = data.filter(t => t.tag === 'Savings' || t.category === 'Investment').reduce((acc, curr) => acc + curr.amount, 0);

  const impulseScore = totalSpent > 0 ? Math.round((wants / totalSpent) * 100) : 0;
  const savingsRate = totalSpent > 0 ? Math.round((savings / totalSpent) * 100) : 0;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const TAG_COLORS = { 'Need': '#3b82f6', 'Want': '#a855f7', 'Savings': '#22c55e' };

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Financial Intelligence Dashboard</h2>

            <div className="flex flex-wrap items-center gap-3">
                <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-1 flex shadow-sm">
                    {['month', 'year', 'custom'].map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${range === r ? 'bg-fintech-100 text-fintech-700 dark:bg-fintech-900/40 dark:text-fintech-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
                {range === 'custom' && (
                    <div className="flex gap-2 items-center bg-white dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
                        <input type="date" className="text-xs bg-transparent border-none outline-none dark:text-gray-300"
                            onChange={e => setCustomDates({...customDates, start: e.target.value})} />
                        <span className="text-gray-400">-</span>
                        <input type="date" className="text-xs bg-transparent border-none outline-none dark:text-gray-300"
                            onChange={e => setCustomDates({...customDates, end: e.target.value})} />
                    </div>
                )}
            </div>
        </div>

        {/* Psychology Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm border-t-4 border-purple-500">
                <div className="flex items-center gap-2 mb-2">
                    <Brain className="text-purple-500" size={20} />
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Impulse Control Score</h3>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{100 - impulseScore}/100</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Health Points</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${100 - impulseScore}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {impulseScore > 40 ? "High 'Want' spending. Consider waiting 24h before purchases." : "Great job prioritizing needs!"}
                </p>
            </div>

            <div className="glass-panel p-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm border-t-4 border-green-500">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-green-500" size={20} />
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Savings Rate</h3>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{savingsRate}%</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">of income saved</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${savingsRate}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Target: 20%. {savingsRate >= 20 ? "You are hitting your financial goals!" : "Try to squeeze more into savings."}
                </p>
            </div>

            <div className="glass-panel p-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm border-t-4 border-blue-500">
                <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="text-blue-500" size={20} />
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Total Outflow</h3>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">₹{totalSpent.toLocaleString()}</span>
                </div>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    In selected period. Needs: ₹{needs.toLocaleString()}
                </p>
            </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Spending Trend */}
            <div className="glass-panel p-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Daily Spending Trend</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]}
                            />
                            <Area type="monotone" dataKey="amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmt)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Pie */}
            <div className="glass-panel p-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Spend by Category</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%" cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Philosophy Bar */}
            <div className="glass-panel p-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Need vs Want vs Savings</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tagData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `₹${val/1000}k`} />
                            <Tooltip cursor={{fill: 'transparent'}} formatter={(value) => `₹${value.toLocaleString()}`} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {tagData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={TAG_COLORS[entry.name] || '#8884d8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
        
        {categoryData.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10">No data available for charts. Add some transactions first.</div>
        )}
    </div>
  );
}
