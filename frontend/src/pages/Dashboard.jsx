import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IndianRupee, FileText, PiggyBank, PlusCircle, Glasses, Wallet } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, savings: 0, ccDue: 0, ccCount: 0 });
  const [transactions, setTransactions] = useState([]); // Recent for calculations
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
      name: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Food',
      tag: 'Need',
      mode: 'UPI',
      cardId: ''
  });

  const fetchData = async () => {
    try {
        const [txRes, cardRes] = await Promise.all([
            axios.get('http://127.0.0.1:8000/transactions/', { params: { filter_type: 'month' } }), // Default to current month for dashboard stats
            axios.get('http://127.0.0.1:8000/cards/')
        ]);

        const txs = txRes.data;
        const crds = cardRes.data;

        // Calculate Stats
        const total = txs.reduce((acc, curr) => acc + curr.amount, 0);
        const savings = txs
            .filter(t => t.category === 'Investment' || t.tag === 'Savings')
            .reduce((acc, curr) => acc + curr.amount, 0);

        // CC Watch Logic (Simplified for now: Sum of CC spends in current view)
        // Ideally this should query *unpaid* bills, but for now we follow the prototype logic
        // which matches active spending. 
        // NOTE: The prototype logic was complex client-side. Let's do a reasonable approx here:
        // Sum of all CC transactions in the fetched period.
        
        // Actually, to replicate the prototype "Card Watch", we need to know cycle dates.
        // Let's implement that logic client side as we have the cards and recent transactions.
        // We probably need more than just "this month" transactions to calculate cycle dues correctly if the cycle started last month.
        // For accurate CC Watch, let's fetch last 2 months of transactions.
        
        const twoMonthsRes = await axios.get('http://127.0.0.1:8000/transactions/', { 
            params: { start_date: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0] } 
        });
        const allRecentTxs = twoMonthsRes.data;

        let globalCCDue = 0;
        let activeCardsCount = 0;
        const today = new Date();
        const currentDay = today.getDate();

        const cardStats = crds.map(card => {
            let lastStmtDate;
            if (currentDay >= card.stmt_date) {
                lastStmtDate = new Date(today.getFullYear(), today.getMonth(), card.stmt_date);
            } else {
                lastStmtDate = new Date(today.getFullYear(), today.getMonth() - 1, card.stmt_date);
            }

            const dueAmount = allRecentTxs
                .filter(t => t.card_id === card.id)
                .filter(t => new Date(t.date) >= lastStmtDate)
                .reduce((acc, curr) => acc + curr.amount, 0);

            if (dueAmount > 0) {
                globalCCDue += dueAmount;
                activeCardsCount++;
            }
            
            // Calculate Days Left
            let dueMonth = lastStmtDate.getMonth() + 1;
            let dueYear = lastStmtDate.getFullYear();
            if (dueMonth > 11) { dueMonth = 0; dueYear++; }
            const dueDateObj = new Date(dueYear, dueMonth, card.due_date);
            const daysLeft = Math.ceil((dueDateObj - today) / (1000 * 60 * 60 * 24));

            return { ...card, dueAmount, daysLeft, dueDateObj };
        }).filter(c => c.dueAmount > 0);


        setStats({ total, savings, ccDue: globalCCDue, ccCount: activeCardsCount });
        setCards(crds); // Store all cards for dropdown
        setTransactions(cardStats); // Abuse this state variable for the card watch list to save creating another
        setLoading(false);

    } catch (error) {
        console.error("Error fetching dashboard data", error);
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
        await axios.post('http://127.0.0.1:8000/transactions/', {
            name: formData.name,
            amount: parseFloat(formData.amount),
            date: formData.date,
            category: formData.category,
            tag: formData.tag,
            mode: formData.mode,
            card_id: formData.mode === 'Credit Card' ? parseInt(formData.cardId) : null
        });
        
        // Reset and Refresh
        setFormData({ ...formData, name: '', amount: '' });
        fetchData();
        alert("Transaction Added");
    } catch (error) {
        console.error("Add failed", error);
        alert("Failed to add transaction");
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
            <h2 className="text-xl font-bold text-gray-800">Financial Overview (This Month)</h2>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-5 rounded-xl border-l-4 border-fintech-500">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Spent</p>
                        <h3 className="text-2xl font-bold mt-1 text-gray-900">₹{stats.total.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg text-fintech-600"><IndianRupee size={20} /></div>
                </div>
            </div>
            
            <div className="glass-panel p-5 rounded-xl border-l-4 border-red-500">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Credit Card Due</p>
                        <h3 className="text-2xl font-bold mt-1 text-red-600">₹{stats.ccDue.toLocaleString('en-IN')}</h3>
                        <p className="text-xs text-red-400 mt-1">{stats.ccCount} cards with pending dues</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded-lg text-red-500"><FileText size={20} /></div>
                </div>
            </div>

            <div className="glass-panel p-5 rounded-xl border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Investments/Savings</p>
                        <h3 className="text-2xl font-bold mt-1 text-green-700">₹{stats.savings.toLocaleString('en-IN')}</h3>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg text-green-600"><PiggyBank size={20} /></div>
                </div>
            </div>
        </div>

        {/* Quick Add & CC Watch */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Add Form */}
            <div className="lg:col-span-2 glass-panel rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <PlusCircle className="text-fintech-600" size={20} /> Log Transaction
                </h3>
                <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Item Name</label>
                        <input type="text" required 
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-fintech-500 outline-none" 
                            placeholder="e.g. Grocery at DMart"
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Amount (₹)</label>
                        <input type="number" required step="0.01" 
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" 
                            placeholder="0.00"
                            value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                        <input type="date" required 
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                        <select className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
                        <label className="block text-xs font-medium text-gray-500 mb-1">Philosophy</label>
                        <select className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})}
                        >
                            <option value="Need">Need (50%)</option>
                            <option value="Want">Want (30%)</option>
                            <option value="Savings">Savings (20%)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Payment Mode</label>
                        <select className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
                        <label className="block text-xs font-medium text-gray-500 mb-1">Card (If CC)</label>
                        <select 
                            className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm ${formData.mode !== 'Credit Card' ? 'bg-gray-100 text-gray-400' : 'bg-gray-50'}`}
                            disabled={formData.mode !== 'Credit Card'}
                            value={formData.cardId} onChange={e => setFormData({...formData, cardId: e.target.value})}
                        >
                            <option value="">Select a Card...</option>
                            {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-2 mt-2">
                        <button type="submit" className="w-full bg-fintech-600 hover:bg-fintech-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition-all active:scale-95">
                            Add Transaction
                        </button>
                    </div>
                </form>
            </div>

            {/* Credit Card Watch Widget */}
            <div className="glass-panel rounded-xl p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Glasses className="text-fintech-600" size={20} /> Card Watch
                </h3>
                <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                    {loading ? <p>Loading...</p> : transactions.length === 0 ? (
                        <div className="text-center text-gray-400 py-8 text-sm">
                            No pending spending in current cycle.
                        </div>
                    ) : (
                        transactions.map((c, i) => (
                            <div key={i} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg bg-white shadow-sm">
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{c.name}</p>
                                    <p className="text-xs text-gray-500">
                                        Stmt: {c.stmt_date}{getOrdinal(c.stmt_date)} | Due: {c.dueDateObj.toLocaleDateString('en-IN', {day:'numeric', month:'short'})}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900 text-sm">₹{c.dueAmount.toLocaleString()}</p>
                                    <p className={`text-xs ${c.daysLeft < 5 ? 'text-red-500 font-bold' : 'text-green-600'}`}>{c.daysLeft} days left</p>
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
