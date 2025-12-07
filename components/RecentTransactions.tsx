import React from 'react';
import { RecentTransaction } from '../types';
import { ArrowRight, Package, Droplets, Truck } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
}

const TransactionIcon = ({ type }: { type: RecentTransaction['type'] }) => {
  switch (type) {
    case 'Collection': return <Package className="w-4 h-4 text-amber-500" />;
    case 'Production': return <Droplets className="w-4 h-4 text-emerald-500" />;
    case 'Shipment': return <Truck className="w-4 h-4 text-blue-500" />;
    default: return <div className="w-4 h-4" />;
  }
};

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col h-full">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
          Recent Activity
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-slate-400 border border-slate-700">Live</span>
        </h3>
        <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">View All</button>
      </div>
      
      <div className="overflow-y-auto flex-1 p-0">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-950/50 text-xs uppercase font-medium text-slate-500 sticky top-0 backdrop-blur-sm z-10">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Flow</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-4 py-3 font-mono text-xs text-slate-500 group-hover:text-slate-300">{tx.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <TransactionIcon type={tx.type} />
                    {tx.type}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="truncate max-w-[80px] text-slate-400" title={tx.source}>{tx.source}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="truncate max-w-[80px] text-slate-200" title={tx.destination}>{tx.destination}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-200">{tx.amount}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                    tx.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    tx.status === 'In Transit' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};