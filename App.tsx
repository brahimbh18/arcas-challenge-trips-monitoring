import React, { useEffect, useState } from 'react';
import { Trip, DashboardStats, RecentTransaction } from './types';
import { fetchDashboardData } from './services/supabaseClient';
import { TripMap } from './components/TripMap';
import { StatsCard } from './components/StatsCard';
import { RecentTransactions } from './components/RecentTransactions';
import { solveALNS, OptimizedStop, OptimizationResult } from './services/optimization';
import { Truck, Droplets, Scale, Map, RefreshCw, Route, Zap, Clock, Navigation, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ totalOlivesKg: 0, totalOilLiters: 0, activeTrips: 0 });
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Optimization State
  const [viewMode, setViewMode] = useState<'live' | 'optimized'>('live');
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedStop[] | null>(null);
  const [routeMetrics, setRouteMetrics] = useState<OptimizationResult['metrics'] | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchDashboardData();
    setTrips(data.trips);
    setStats(data.stats);
    setTransactions(data.transactions);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle Optimization Toggle
  const toggleOptimization = () => {
    if (viewMode === 'live') {
      // Run ALNS algorithm
      const result = solveALNS(trips);
      setOptimizedRoute(result.route);
      setRouteMetrics(result.metrics);
      setViewMode('optimized');
    } else {
      setViewMode('live');
      setOptimizedRoute(null);
      setRouteMetrics(null);
    }
  };

  // Helper to format total minutes to Hh Mm
  const formatDuration = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-6 z-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-lime-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/20">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white">OLEUM <span className="text-slate-500 font-light">Admin</span></h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 hidden md:flex">
             <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${loading ? 'hidden' : ''}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${loading ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            {loading ? 'Syncing...' : `Updated ${lastUpdated.toLocaleTimeString()}`}
          </div>
          <button 
            onClick={loadData}
            disabled={loading}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 p-6 grid grid-cols-12 grid-rows-[auto_1fr] gap-6 overflow-hidden">
        
        {/* KPI Row */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 h-auto flex-shrink-0">
          <StatsCard 
            title="Total Olives Collected" 
            value={`${(stats.totalOlivesKg / 1000).toFixed(1)} tons`} 
            icon={Scale} 
            trend="+12% vs last week"
            colorClass="from-emerald-900/10 to-emerald-900/5 border-emerald-500/20"
          />
          <StatsCard 
            title="Total Oil Produced" 
            value={`${(stats.totalOilLiters).toLocaleString()} L`} 
            icon={Droplets} 
            trend="High Efficiency"
            colorClass="from-amber-900/10 to-amber-900/5 border-amber-500/20"
          />
          <StatsCard 
            title="Active Shipments" 
            value={stats.activeTrips.toString()} 
            icon={Truck} 
            trend="3 trucks on road"
            colorClass="from-indigo-900/10 to-indigo-900/5 border-indigo-500/20"
          />
        </div>

        {/* Bottom Section: Map & Table */}
        <div className="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
          
          {/* Map Container */}
          <div className="lg:col-span-2 h-full min-h-[400px] flex flex-col relative">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                <Map className="w-4 h-4" /> 
                {viewMode === 'live' ? 'Live Fleet Tracking' : 'ALNS Route Optimization'}
              </h2>
              
              <div className="flex gap-2">
                <button 
                  onClick={toggleOptimization}
                  className={`flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-md border transition-all ${
                    viewMode === 'optimized' 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {viewMode === 'optimized' ? <BrainCircuit className="w-3 h-3" /> : <Route className="w-3 h-3" />}
                  {viewMode === 'optimized' ? 'ALNS Active' : 'Run ALNS'}
                </button>
              </div>
            </div>
            
            {/* Trip Estimator Panel (Visible only in Optimized Mode) */}
            {viewMode === 'optimized' && routeMetrics && (
              <div className="absolute top-12 left-4 z-[500] bg-slate-900/90 backdrop-blur-md border border-amber-500/30 rounded-xl p-4 shadow-2xl min-w-[200px] animate-in slide-in-from-left-2 fade-in duration-300">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> ALNS Trip Estimate
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400 text-xs">Total Duration</span>
                    <span className="text-slate-100 font-bold font-mono">{formatDuration(routeMetrics.totalDurationMinutes)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400 text-xs">Distance</span>
                    <span className="text-slate-100 font-bold font-mono">{routeMetrics.totalDistanceKm} km</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400 text-xs">Stops</span>
                    <span className="text-slate-100 font-bold font-mono">{routeMetrics.stopCount}</span>
                  </div>
                  <div className="h-px bg-slate-700/50 my-2"></div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    Adaptive Large Neighborhood Search<br/>
                    <span className="text-slate-600">Iterative improvement enabled</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 relative rounded-xl overflow-hidden shadow-lg border border-slate-800">
              <TripMap trips={trips} optimizedRoute={optimizedRoute} />
            </div>
          </div>

          {/* Transactions Table */}
          <div className="lg:col-span-1 h-full min-h-[400px] flex flex-col">
            <RecentTransactions transactions={transactions} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;
