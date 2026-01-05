import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IndianRupee, FileText, PiggyBank, PlusCircle, Glasses, Wallet, Save, Edit2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, savings: 0, ccDue: 0, ccCount: 0 });
  const [cardWatchData, setCardWatchData] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
      id: null,
      name: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Food',
      tag: 'Need',
      mode: 'UPI',
      cardId: '',
      comment: ''
  });

  // Check for Edit Mode on Mount
  useEffect(() => {
    if (location.state && location.state.transaction) {
        const t = location.state.transaction;
        setFormData({
            id: t.id,
            name: t.name,
            amount: t.amount,
            date: t.date,
            category: t.category,
            tag: t.tag,
            mode: t.mode,
            cardId: t.card_id || '',
            comment: t.comment || ''
        });
        // Clear state so refresh doesn't keep it
        window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchData = async () => {
    try {
        const [txRes, cardRes] = await Promise.all([
            axios.get('http://127.0.0.1:8000/transactions/', { params: { filter_type: 'month' } }),
            axios.get('http://127.0.0.1:8000/cards/')
        ]);

        const txs = txRes.data;
        const crds = cardRes.data;

        // Calculate Stats
        const total = txs.reduce((acc, curr) => acc + curr.amount, 0);
        const savings = txs
            .filter(t => t.category === 'Investment' || t.tag === 'Savings')
            .reduce((acc, curr) => acc + curr.amount, 0);

        // --- Improved Card Watch Logic ---
        // Fetch 2 months history to calculate cycles correctly
        const twoMonthsRes = await axios.get('http://127.0.0.1:8000/transactions/', { 
            params: { start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0] } 
        });
        const allRecentTxs = twoMonthsRes.data;

        let globalCCDue = 0;
        let activeCardsCount = 0;
        const today = new Date();
        const currentDay = today.getDate();

        const cardStats = crds.map(card => {
            // Determine "Current Cycle" and "Previous Cycle"

            // Previous Statement Date (The bill we might owe now)
            // If today is 5th, and stmt is 10th -> Last stmt was 10th of LAST month.
            // If today is 15th, and stmt is 10th -> Last stmt was 10th of THIS month.

            let lastStmtDate;
            if (currentDay >= card.stmt_date) {
                lastStmtDate = new Date(today.getFullYear(), today.getMonth(), card.stmt_date);
            } else {
                lastStmtDate = new Date(today.getFullYear(), today.getMonth() - 1, card.stmt_date);
            }

            // The Cycle before that (The one that is definitely due)
            const prevStmtDate = new Date(lastStmtDate);
            prevStmtDate.setMonth(prevStmtDate.getMonth() - 1);

            // Due Date Calculation
            let dueMonth = lastStmtDate.getMonth() + 1; // Month after statement
            let dueYear = lastStmtDate.getFullYear();
            if (dueMonth > 11) { dueMonth = 0; dueYear++; }

            // If due_date < stmt_date, it usually means next month.
            // e.g. Stmt 20th, Due 5th (of next month).
            // Most cards work this way.

            const dueDateObj = new Date(dueYear, dueMonth, card.due_date);
            // However, verify logic: if Due is 5th Nov, Stmt was 20th Oct.
            // If Stmt was 20th Nov, Due is 5th Dec.
            // Our lastStmtDate is correct.

            // Calculate "Statement Balance" (Transactions UP TO lastStmtDate)
            // But usually APIs give us transaction lists.
            // "Due Balance" = Txs between (prevStmtDate) and (lastStmtDate).
            // "Unbilled" = Txs > lastStmtDate.

            const dueBalance = allRecentTxs
                .filter(t => t.card_id === card.id)
                .filter(t => {
                    const d = new Date(t.date);
                    return d > prevStmtDate && d <= lastStmtDate;
                })
                .reduce((acc, curr) => acc + curr.amount, 0);

            const unbilledAmount = allRecentTxs
                .filter(t => t.card_id === card.id)
                .filter(t => new Date(t.date) > lastStmtDate)
                .reduce((acc, curr) => acc + curr.amount, 0);
            
            const daysLeft = Math.ceil((dueDateObj - today) / (1000 * 60 * 60 * 24));

            if (dueBalance > 0) {
                globalCCDue += dueBalance;
                activeCardsCount++;
            }

            return {
                ...card,
                dueBalance,
                unbilledAmount,
                daysLeft,
                dueDateObj,
                stmtDateObj: lastStmtDate
            };
        }).filter(c => c.dueBalance > 0 || c.unbilledAmount > 0);


        setStats({ total, savings, ccDue: globalCCDue, ccCount: activeCardsCount });
        setCards(crds);
        setCardWatchData(cardStats);
        setLoading(false);

    } catch (error) {
        console.error("Error fetching dashboard data", error);
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const payload = {
            name: formData.name,
            amount: parseFloat(formData.amount),
            date: formData.date,
            category: formData.category,
            tag: formData.tag,
            mode: formData.mode,
            card_id: formData.mode === 'Credit Card' ? parseInt(formData.cardId) : null,
            comment: formData.comment
        };

        if (formData.id) {
            await axios.put(`http://127.0.0.1:8000/transactions/${formData.id}`, payload);
        } else {
            await axios.post('http://127.0.0.1:8000/transactions/', payload);
        }
        
        // Reset
        setFormData({
            id: null, name: '', amount: '', date: new Date().toISOString().split('T')[0],
            category: 'Food', tag: 'Need', mode: 'UPI', cardId: '', comment: ''
        });
        fetchData();
        alert(formData.id ? "Transaction Updated" : "Transaction Added");
    } catch (error) {
        console.error("Operation failed", error);
        alert("Failed to save transaction");
    }
  };

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Financial Overview (This Month)</h2>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-5 rounded-xl border-l-4 border-fintech-500 bg-white dark:bg-gray-800 dark:border-fintech-600 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Spent</p>
                        <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">₹{stats.total.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-fintech-600 dark:text-fintech-400"><IndianRupee size={20} /></div>
                </div>
            </div>
            
            <div className="glass-panel p-5 rounded-xl border-l-4 border-red-500 bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Credit Card Due</p>
                        <h3 className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">₹{stats.ccDue.toLocaleString('en-IN')}</h3>
                        <p className="text-xs text-red-400 dark:text-red-300 mt-1">{stats.ccCount} cards with pending dues</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-lg text-red-500 dark:text-red-400"><FileText size={20} /></div>
                </div>
            </div>

            <div className="glass-panel p-5 rounded-xl border-l-4 border-green-500 bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Investments/Savings</p>
                        <h3 className="text-2xl font-bold mt-1 text-green-700 dark:text-green-400">₹{stats.savings.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded-lg text-green-600 dark:text-green-400"><PiggyBank size={20} /></div>
                </div>
            </div>
        </div>

        {/* Quick Add & CC Watch */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Add Form */}
            <div className="lg:col-span-2 glass-panel rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    {formData.id ? <Edit2 className="text-fintech-600" size={20} /> : <PlusCircle className="text-fintech-600" size={20} />}
                    {formData.id ? 'Edit Transaction' : 'Log Transaction'}
                </h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Item Name</label>
                        <input type="text" required 
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fintech-500 outline-none dark:text-white"
                            placeholder="e.g. Grocery at DMart"
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount (₹)</label>
                        <input type="number" required step="0.01" 
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-mono dark:text-white"
                            placeholder="0.00"
                            value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
                        <input type="date" required 
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white"
                            value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                        <select className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white"
                            value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                        >
                            <option value="Food">Food & Dining</option>
                            <option value="Travel">Travel & Commute</option>
                            <option value="Rent">Rent & Housing</option>
                            <option value="Utilities">Utilities (Bills)</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Medical">Medical</option>
                            <option value="Investment">Investment</option>
                            <option value="EMI">EMI / Loan</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Philosophy</label>
                        <select className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white"
                            value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})}
                        >
                            <option value="Need">Need (50%)</option>
                            <option value="Want">Want (30%)</option>
                            <option value="Savings">Savings (20%)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Payment Mode</label>
                        <select className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white"
                            value={formData.mode} onChange={e => setFormData({...formData, mode: e.target.value})}
                        >
                            <option value="UPI">UPI</option>
                            <option value="Credit Card">Credit Card</option>
                            <option value="Debit Card">Debit Card</option>
                            <option value="Cash">Cash</option>
                            <option value="NetBanking">NetBanking</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Card (If CC)</label>
                        <select 
                            className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-white ${formData.mode !== 'Credit Card' ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-gray-50 dark:bg-gray-700'}`}
                            disabled={formData.mode !== 'Credit Card'}
                            value={formData.cardId} onChange={e => setFormData({...formData, cardId: e.target.value})}
                        >
                            <option value="">Select a Card...</option>
                            {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Comment (Optional)</label>
                        <textarea
                            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fintech-500 outline-none dark:text-white"
                            rows="2"
                            placeholder="Add notes..."
                            value={formData.comment} onChange={e => setFormData({...formData, comment: e.target.value})}
                        />
                    </div>

                    <div className="md:col-span-2 mt-2 flex gap-3">
                         {formData.id && (
                             <button type="button" onClick={() => setFormData({
                                id: null, name: '', amount: '', date: new Date().toISOString().split('T')[0],
                                category: 'Food', tag: 'Need', mode: 'UPI', cardId: '', comment: ''
                             })} className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2.5 rounded-lg transition-colors">
                                 Cancel
                             </button>
                         )}
                        <button type="submit" className="flex-1 bg-fintech-600 hover:bg-fintech-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2">
                            {formData.id ? <Save size={18} /> : <PlusCircle size={18} />}
                            {formData.id ? 'Update Transaction' : 'Add Transaction'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Credit Card Watch Widget */}
            <div className="glass-panel rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Glasses className="text-fintech-600" size={20} /> Card Watch
                </h3>
                <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
                    {loading ? <p className="text-gray-500 dark:text-gray-400">Loading...</p> : cardWatchData.length === 0 ? (
                        <div className="text-center text-gray-400 py-8 text-sm">
                            No pending spending in current cycle.
                        </div>
                    ) : (
                        cardWatchData.map((c, i) => (
                            <div key={i} className="flex flex-col gap-2 p-3 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50 shadow-sm">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{c.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Stmt: {c.stmtDateObj.toLocaleDateString('en-IN', {day:'numeric', month:'short'})}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${c.daysLeft < 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            Due {c.dueDateObj.toLocaleDateString('en-IN', {day:'numeric', month:'short'})}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-gray-400">Bill Due</p>
                                        <p className="font-bold text-red-600 dark:text-red-400 text-sm">₹{c.dueBalance.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-400">Unbilled</p>
                                        <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">₹{c.unbilledAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}
