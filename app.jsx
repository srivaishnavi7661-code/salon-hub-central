import React, { useState, useEffect } from 'react';
import SalonDashboard from './SalonDashboard'; // Importing the frontend component provided earlier

export default function App() {
  // Live State management synchronized with the backend DB
  const [stats, setStats] = useState({
    todaysRevenue: 0,
    appointmentCount: 0,
    newClientsCount: 0,
    avgTicket: 0
  });
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define API base url (Update this to your production backend domain when deployed)
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-salon-backend.up.railway.app/api' 
    : 'http://localhost:5000/api';

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // Concurrent fetching for low latency data synchronization
        const [statsResponse, scheduleResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/dashboard/stats`),
          fetch(`${API_BASE_URL}/appointments/today`)
        ]);

        if (!statsResponse.ok || !scheduleResponse.ok) {
          throw new Error('Failed to fetch data updates from salon server database.');
        }

        const statsData = await statsResponse.json();
        const scheduleData = await scheduleResponse.json();

        setStats(statsData);
        setSchedule(scheduleData);
        setError(null);
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
    
    // Auto-refresh the live dashboard data every 60 seconds
    const intervalId = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // 1. Loading Fallback Screen
  if (loading && schedule.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#043326] flex-col gap-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-200 font-medium tracking-wide text-sm">Syncing Gloss Studio Records...</p>
      </div>
    );
  }

  // 2. Error Fallback Screen 
  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 flex-col p-6 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-full mb-3 font-bold text-xl">⚠️</div>
        <h3 className="text-lg font-bold text-slate-800">Connection Interrupted</h3>
        <p className="text-slate-500 text-sm max-w-md mt-1">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-[#043326] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#084433] transition-colors shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // 3. Render Dashboard with live connected props
  return (
    <SalonDashboard 
      liveStats={stats} 
      liveSchedule={schedule} 
    />
  );
}