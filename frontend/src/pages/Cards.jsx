import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, CreditCard as CardIcon, Info } from 'lucide-react';

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [stmtDate, setStmtDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchCards = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/cards/');
      setCards(res.data);
    } catch (error) {
      console.error("Error fetching cards", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/cards/', {
        name,
        stmt_date: parseInt(stmtDate),
        due_date: parseInt(dueDate)
      });
      // Reset
      setName('');
      setStmtDate('');
      setDueDate('');
      fetchCards();
    } catch (error) {
      console.error("Error adding card", error);
      alert("Failed to add card");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? Associated transactions will remain but lose their card link.")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/cards/${id}`);
      fetchCards();
    } catch (error) {
      console.error("Error deleting card", error);
    }
  };

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <div className="space-y-6">
       <h1 className="text-2xl font-bold text-gray-800">Manage Cards</h1>
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Add Card Form */}
          <div className="glass-panel rounded-xl p-6 h-fit">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Add New Card</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Card Name</label>
                    <input 
                      type="text" required 
                      className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-fintech-500 focus:border-fintech-500 outline-none" 
                      placeholder="e.g. HDFC Regalia"
                      value={name} onChange={e => setName(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Statement Date (Day)</label>
                        <input 
                          type="number" min="1" max="31" required 
                          className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                          placeholder="e.g. 12"
                          value={stmtDate} onChange={e => setStmtDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Due Date (Day)</label>
                        <input 
                          type="number" min="1" max="31" required 
                          className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                          placeholder="e.g. 2"
                          value={dueDate} onChange={e => setDueDate(e.target.value)}
                        />
                    </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-700 border border-yellow-200 flex items-start gap-2">
                    <Info size={14} className="mt-0.5" />
                    <span>Note: We assume the Due Date is in the <strong>next month</strong> relative to the Statement Date.</span>
                </div>
                <button type="submit" className="w-full bg-fintech-600 hover:bg-fintech-700 text-white font-semibold py-2 rounded-lg transition-colors">
                    Save Card
                </button>
            </form>
          </div>

          {/* Card List */}
          <div className="space-y-4">
              <h3 className="font-bold text-gray-800 text-lg">Your Cards</h3>
              
              {loading ? (
                <div className="text-gray-400">Loading...</div>
              ) : cards.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">No cards added.</div>
              ) : (
                <div className="space-y-3">
                  {cards.map(card => (
                    <div key={card.id} className="bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl p-5 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="text-lg font-bold tracking-wide">{card.name}</div>
                            <div className="opacity-80"><CardIcon size={28} /></div>
                        </div>
                        <div className="flex justify-between items-end text-sm text-gray-300">
                            <div>
                                <p className="text-xs opacity-60 uppercase">Statement Date</p>
                                <p className="font-mono text-white">{card.stmt_date}{getOrdinal(card.stmt_date)}</p>
                            </div>
                             <div>
                                <p className="text-xs opacity-60 uppercase">Pay By</p>
                                <p className="font-mono text-white">{card.due_date}{getOrdinal(card.due_date)} Next Mo</p>
                            </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(card.id)}
                          className="absolute bottom-2 right-2 p-2 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
       </div>
    </div>
  );
}
