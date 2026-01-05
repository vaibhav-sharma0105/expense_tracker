import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Trash2, Filter, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('month'); // day, week, month, year, all
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const navigate = useNavigate();

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (['day', 'week', 'month', 'year'].includes(filter)) {
        params.filter_type = filter;
      }
      if (filter === 'custom' && customRange.start) params.start_date = customRange.start;
      if (filter === 'custom' && customRange.end) params.end_date = customRange.end;

      const res = await axios.get('http://127.0.0.1:8000/transactions/', { params });
      setTransactions(res.data);
    } catch (error) {
      console.error("Error fetching transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter, customRange]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/transactions/${id}`);
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting", error);
    }
  };

  const handleEdit = (transaction) => {
      navigate('/dashboard', { state: { transaction } });
  };

  const exportCSV = () => {
    const rows = [
        ['Date', 'Item Name', 'Category', 'Mode', 'Tag', 'Amount', 'Card ID', 'Comment']
    ];
    
    transactions.forEach(t => {
        rows.push([
            t.date,
            `"${t.name}"`, 
            t.category,
            t.mode,
            t.tag,
            t.amount,
            t.card_id || '',
            t.comment || ''
        ]);
    });

    let csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fintrack_export_${filter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Transaction History</h2>
        
        <div className="flex flex-wrap items-center gap-2">
            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-1 flex shadow-sm">
                {['day', 'week', 'month', 'year', 'all'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${filter === f ? 'bg-fintech-100 text-fintech-700 dark:bg-fintech-900/40 dark:text-fintech-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg text-sm font-medium transition-colors border border-green-200 dark:border-green-800">
                <Download size={16} /> Export CSV
            </button>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold">Item</th>
                        <th className="px-6 py-4 font-semibold">Category</th>
                        <th className="px-6 py-4 font-semibold">Mode</th>
                        <th className="px-6 py-4 font-semibold">Tag</th>
                        <th className="px-6 py-4 font-semibold text-right">Amount</th>
                        <th className="px-6 py-4 font-semibold text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {loading ? (
                        <tr><td colSpan="7" className="text-center py-8 text-gray-400">Loading...</td></tr>
                    ) : transactions.length === 0 ? (
                        <tr><td colSpan="7" className="text-center py-8 text-gray-400">No transactions found for this period.</td></tr>
                    ) : (
                        transactions.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono text-xs">{format(new Date(t.date), 'dd MMM yyyy')}</td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                    {t.name}
                                    {t.comment && <p className="text-[10px] text-gray-400 italic mt-0.5">{t.comment}</p>}
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs"><span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">{t.category}</span></td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">{t.mode}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold 
                                        ${t.tag === 'Need' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                                          t.tag === 'Want' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' :
                                          'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'}`}>
                                        {t.tag}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">₹{t.amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => handleEdit(t)} className="text-gray-300 hover:text-fintech-600 transition-colors" title="Edit">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(t.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
