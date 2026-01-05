import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function Reports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/transactions/', { params: { filter_type: 'month' } }); // Default Month
            setData(res.data);
        } catch (error) {
            console.error("Error fetching report data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // Process Data for Charts
  const categoryData = Object.entries(
    data.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const tagData = Object.entries(
    data.reduce((acc, curr) => {
      acc[curr.tag] = (acc[curr.tag] || 0) + curr.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const TAG_COLORS = { 'Need': '#3b82f6', 'Want': '#a855f7', 'Savings': '#22c55e' };

  if (loading) return <div>Loading reports...</div>;

  return (
    <div className="space-y-8">
        <h2 className="text-xl font-bold text-gray-800">Monthly Spending Analysis</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Pie */}
            <div className="glass-panel p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Spend by Category</h3>
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
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Philosophy Bar */}
            <div className="glass-panel p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Need vs Want vs Savings</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tagData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                            <Bar dataKey="value">
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
            <div className="text-center text-gray-500 py-10">No data available for charts. Add some transactions first.</div>
        )}
    </div>
  );
}
