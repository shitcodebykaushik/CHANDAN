import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Map as MapIcon, Car, AlertTriangle, Settings,
  Search, Bell, User, MapPin, Clock, ArrowUpRight, ArrowDownRight,
  Activity, Zap, ShieldAlert, Cpu,
  Ticket, CheckCircle2, XCircle, Plus, Key, Calendar
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import mockMap from './assets/mock-map.svg';

// --- Mock Data ---
const DEFAULT_OCCUPANCY_DATA = [
  { time: '06:00', occupancy: 20 },
  { time: '08:00', occupancy: 65 },
  { time: '10:00', occupancy: 85 },
  { time: '12:00', occupancy: 90 },
  { time: '14:00', occupancy: 75 },
  { time: '16:00', occupancy: 80 },
  { time: '18:00', occupancy: 60 },
  { time: '20:00', occupancy: 35 },
  { time: '22:00', occupancy: 15 },
];

const DEFAULT_ZONES = [
  { id: 'Z-Alpha', name: 'Downtown Core', total: 450, occupied: 412, status: 'critical' },
  { id: 'Z-Beta', name: 'Financial District', total: 320, occupied: 298, status: 'warning' },
  { id: 'Z-Gamma', name: 'Tech Park', total: 800, occupied: 450, status: 'good' },
  { id: 'Z-Delta', name: 'Westside Residential', total: 250, occupied: 210, status: 'warning' },
  { id: 'Z-Epsilon', name: 'Transit Hub', total: 600, occupied: 580, status: 'critical' },
];

const DEFAULT_ACTIVITY = [
  { id: 1, type: 'violation', msg: 'Overstay detected at Z-Alpha / Spot 42', time: '2 min ago' },
  { id: 2, type: 'entry', msg: 'Vehicle entered Z-Beta / Gate 2', time: '4 min ago' },
  { id: 3, type: 'alert', msg: 'Sensor offline in Z-Gamma / Level 2', time: '12 min ago' },
  { id: 4, type: 'exit', msg: 'Vehicle exited Z-Epsilon / Gate 1', time: '15 min ago' },
  { id: 5, type: 'entry', msg: 'Vehicle entered Z-Alpha / Gate 4', time: '18 min ago' },
];

const DEFAULT_VEHICLES = [
  { id: 'V-101', plate: 'XYZ-1234', status: 'parked', token: 'TKN-A1B2C3', zone: 'Z-Alpha', time: '10:42' },
  { id: 'V-102', plate: 'ABC-9876', status: 'parked', token: 'TKN-X9Y8Z7', zone: 'Z-Beta', time: '09:15' },
  { id: 'V-103', plate: 'LMN-4567', status: 'booked', token: 'TKN-QW3E4R', zone: 'Z-Gamma', time: '-' },
  { id: 'V-104', plate: 'PQR-1122', status: 'parked', token: 'TKN-H8J9K0', zone: 'Z-Alpha', time: '11:00' },
];

const DEFAULT_MARKERS = [
  { id: 'M-1', lat: 37.7849, lng: -122.4094, status: 'critical' },
  { id: 'M-2', lat: 37.7649, lng: -122.4294, status: 'warning' },
  { id: 'M-3', lat: 37.7739, lng: -122.4312, status: 'good' },
  { id: 'M-4', lat: 37.7949, lng: -122.3994, status: 'good' },
  { id: 'M-5', lat: 37.7549, lng: -122.4094, status: 'critical' },
];

type Zone = typeof DEFAULT_ZONES[number];
type ActivityItem = typeof DEFAULT_ACTIVITY[number];
type Vehicle = typeof DEFAULT_VEHICLES[number];
type OccupancyPoint = typeof DEFAULT_OCCUPANCY_DATA[number];
type MapMarker = typeof DEFAULT_MARKERS[number];

export default function App() {
  const [time, setTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [zones, setZones] = useState<Zone[]>(DEFAULT_ZONES);
  const [occupancyData, setOccupancyData] = useState<OccupancyPoint[]>(DEFAULT_OCCUPANCY_DATA);
  const [activity, setActivity] = useState<ActivityItem[]>(DEFAULT_ACTIVITY);
  const [vehicles, setVehicles] = useState<Vehicle[]>(DEFAULT_VEHICLES);
  const [markers, setMarkers] = useState<MapMarker[]>(DEFAULT_MARKERS);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchJson = async <T,>(url: string): Promise<T | null> => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        return (await res.json()) as T;
      } catch {
        return null;
      }
    };

    const loadAll = async () => {
      const [zonesData, occupancy, activityData, vehiclesData, markerData] = await Promise.all([
        fetchJson<Zone[]>('/api/zones'),
        fetchJson<OccupancyPoint[]>('/api/occupancy'),
        fetchJson<ActivityItem[]>('/api/activity'),
        fetchJson<Vehicle[]>('/api/vehicles'),
        fetchJson<MapMarker[]>('/api/markers'),
      ]);

      if (!isMounted) return;
      if (zonesData) setZones(zonesData);
      if (occupancy) setOccupancyData(occupancy);
      if (activityData) setActivity(activityData);
      if (vehiclesData) setVehicles(vehiclesData);
      if (markerData) setMarkers(markerData);
    };

    loadAll();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (res.ok) setVehicles(await res.json());
    } catch {
      return;
    }
  };

  const refreshActivity = async () => {
    try {
      const res = await fetch('/api/activity');
      if (res.ok) setActivity(await res.json());
    } catch {
      return;
    }
  };

  useEffect(() => {
    const id = setInterval(() => {
      refreshVehicles();
      refreshActivity();
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-700 font-sans overflow-hidden">
      <Sidebar active={activeTab} setActive={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav time={time} />
        <main className="flex-1 flex flex-col overflow-y-auto">
          {activeTab === 'Dashboard' ? (
            <>
              <HeroStats />
              <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-0 overflow-hidden">
                <div className="xl:col-span-8 p-6 flex flex-col gap-6 border-r border-slate-200 bg-white">
                  <ZoneGrid zones={zones} />
                  <AnalyticsChart data={occupancyData} />
                </div>
                <div className="xl:col-span-4 bg-slate-50 flex flex-col">
                  <ActivityFeed activity={activity} />
                  <SystemStatus />
                </div>
              </div>
            </>
          ) : activeTab === 'Zone Map' ? (
            <div className="flex-1 w-full h-full p-6">
              <MapPanel markers={markers} zones={zones} vehicles={vehicles} />
            </div>
          ) : activeTab === 'Vehicles' ? (
            <div className="flex-1 w-full h-full bg-slate-50 flex flex-col p-6 min-h-0">
              <VehiclesPanel
                vehicles={vehicles}
                setVehicles={setVehicles}
                refreshVehicles={refreshVehicles}
                refreshActivity={refreshActivity}
                zones={zones}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-400">View not implemented</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ active, setActive }: { active: string, setActive: (t: string) => void }) {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Zone Map', icon: MapIcon },
    { name: 'Vehicles', icon: Car },
    { name: 'Violations', icon: AlertTriangle },
    { name: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-16 md:w-64 border-r border-slate-200 bg-white flex flex-col">
      <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-200 space-x-3 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <span className="hidden md:inline-block font-bold tracking-tight text-slate-800 text-sm">NEO<span className="text-indigo-600 font-mono">CITY</span></span>
      </div>
      
      <nav className="flex-1 py-6 px-2 md:px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.name === active;
          return (
            <button
              key={item.name}
              onClick={() => setActive(item.name)}
              className={cn(
                "w-full flex items-center md:space-x-3 px-0 md:px-4 py-2.5 rounded-lg text-sm transition-all duration-200 justify-center md:justify-start",
                isActive 
                  ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              )}
              title={item.name}
            >
              <Icon className="w-5 h-5 md:w-4 md:h-4 shrink-0" />
              <span className="hidden md:inline-block font-medium">{item.name}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-200 mt-auto shrink-0 flex justify-center">
        <div className="hidden md:flex w-full flex-col items-center justify-center bg-slate-50 rounded-lg p-3 border border-slate-200">
          <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">System Status</span>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE
          </span>
        </div>
        <div className="md:hidden w-8 h-8 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100"></div>
      </div>
    </aside>
  );
}

function TopNav({ time }: { time: Date }) {
  return (
    <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 hidden md:block">
          DASHBOARD <span className="text-indigo-600 font-mono">PRK_04</span>
        </h1>
        <span className="md:hidden px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 rounded">ONLINE</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] text-slate-500 uppercase font-bold">Local Time</p>
          <p className="text-sm font-mono text-slate-700">{time.toLocaleTimeString('en-US', { hour12: false })} UTC</p>
        </div>
        <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
        <div className="flex items-center gap-4">
          <button className="text-indigo-600 hover:text-indigo-800 transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="text-indigo-600 hover:text-indigo-800 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm">
            EXPORT
          </button>
        </div>
      </div>
    </header>
  );
}

function HeroStats() {
  const stats = [
    { label: 'Total Capacity', value: '2,420', sub: 'Slots', icon: MapPin, trend: '+0%', color: 'text-slate-900', iconColor: 'text-indigo-600' },
    { label: 'Occupancy Rate', value: '80.5%', sub: 'Avg today', icon: Car, trend: '+12%', trendUp: true, color: 'text-indigo-600', iconColor: 'text-indigo-600' },
    { label: 'Revenue (24h)', value: '$14,240', sub: 'Estimated', icon: Activity, trend: '+5.2%', trendUp: true, color: 'text-emerald-600', iconColor: 'text-emerald-600' },
    { label: 'Active Alerts', value: '03', sub: 'Urgent attention', icon: AlertTriangle, trend: '2 new', trendUp: false, color: 'text-rose-600', iconColor: 'text-rose-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-4 border-b border-slate-200 bg-slate-50 shrink-0">
      {stats.map((s, i) => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          key={s.label} 
          className={cn(
            "bg-white p-4 rounded-lg border border-slate-200 shadow-sm",
            s.label === 'Active Alerts' ? 'ring-1 ring-rose-200 bg-rose-50/30' : ''
          )}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={cn("text-[10px] uppercase font-bold", s.label === 'Active Alerts' ? 'text-rose-500' : 'text-slate-500')}>{s.label}</span>
            <s.icon className={cn("w-3.5 h-3.5", s.iconColor)} />
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-bold tracking-tighter", s.color)}>{s.value}</span>
            {s.label === 'Occupancy Rate' ? (
              <div className="hidden sm:flex h-2 w-16 bg-slate-100 rounded-full overflow-hidden ml-2 shadow-inner">
                <div className="h-full bg-indigo-500 w-[80%]" />
              </div>
            ) : (
              <span className={cn("text-[10px] uppercase font-medium", s.label === 'Active Alerts' ? 'text-rose-500 animate-pulse' : 'text-slate-400')}>{s.sub}</span>
            )}
          </div>
          
          {s.label !== 'Active Alerts' && s.label !== 'Occupancy Rate' && (
            <div className="mt-2 flex items-center justify-between text-[10px] uppercase font-bold tracking-wide">
              <div className={cn("flex items-center", s.trendUp ? 'text-emerald-600' : 'text-rose-500')}>
                {s.trendUp ? '↑' : '↓'} {s.trend}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function ZoneGrid({ zones }: { zones: Zone[] }) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase">Active Zones</h3>
          <p className="text-[10px] text-slate-500 mt-1 uppercase">Real-time capacity across 5 monitored sectors</p>
        </div>
        <div className="flex gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase font-bold"><span className="w-2 h-2 rounded-full bg-slate-200"></span> Free</span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase font-bold"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Occupied</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.map((zone, i) => {
          const occupancyRate = (zone.occupied / zone.total) * 100;
          let barColor = 'bg-indigo-500';
          let textColor = 'text-indigo-700';
          let containerClass = 'bg-slate-50 border-slate-200 hover:border-slate-300';
          
          if (occupancyRate > 90) {
            barColor = 'bg-rose-500';
            textColor = 'text-rose-600';
            containerClass = 'bg-rose-50/50 border-rose-200 hover:border-rose-300';
          } else if (occupancyRate > 75) {
            barColor = 'bg-amber-500';
            textColor = 'text-amber-600';
            containerClass = 'bg-amber-50/50 border-amber-200 hover:border-amber-300';
          }

          return (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 + 0.2 }}
              key={zone.id} 
              className={cn("p-4 rounded-lg border transition-colors", containerClass)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-xs font-bold text-slate-800 uppercase">{zone.name}</div>
                  <div className="text-[10px] text-slate-500 mono mt-0.5">{zone.id}</div>
                </div>
                <div className={cn("text-lg font-bold tracking-tighter", textColor)}>
                  {occupancyRate.toFixed(1)}%
                </div>
              </div>
              
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${occupancyRate}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={cn("h-full rounded-full", barColor)}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-slate-500 uppercase font-bold">
                <span>{zone.occupied} OCC</span>
                <span>{zone.total - zone.occupied} FREE</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function AnalyticsChart({ data }: { data: OccupancyPoint[] }) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase">Occupancy Trend</h3>
        </div>
        <select className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-600 outline-none uppercase">
          <option>24 Hours</option>
          <option>7 Days</option>
        </select>
      </div>
      
      <div className="h-[200px] w-full text-[10px] font-mono">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="time" stroke="#94a3b8" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
            />
            <Area 
              type="monotone" 
              dataKey="occupancy" 
              stroke="#4f46e5" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorOccupancy)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ActivityFeed({ activity }: { activity: ActivityItem[] }) {
  const [filter, setFilter] = useState('all');

  const filteredActivity = filter === 'all' 
    ? activity 
    : activity.filter(a => a.type === filter);

  return (
    <div className="flex flex-col flex-1 min-h-0 border-b border-slate-200">
      <div className="p-4 border-b border-slate-200 shrink-0">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Real-time Log</h3>
        <div className="flex gap-2">
          {['all', 'violation', 'entry', 'alert', 'exit'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-2 py-1 text-[10px] uppercase font-bold rounded transition-colors border",
                filter === f 
                  ? "bg-slate-800 text-white border-slate-800 shadow-sm" 
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-4 flex flex-col gap-2 font-mono text-[11px] overflow-y-auto bg-slate-50/50">
        <AnimatePresence initial={false}>
          {filteredActivity.map((item, i) => {
            let containerClass = "p-3 rounded-lg bg-white border border-slate-200 shadow-sm";
            let actionColor = "text-slate-600";
            
            if (item.type === 'violation') {
              containerClass = "p-3 rounded-lg bg-rose-50 border border-rose-200 border-l-4 shadow-sm";
              actionColor = "text-rose-600 font-bold";
            } else if (item.type === 'alert') {
              containerClass = "p-3 rounded-lg bg-amber-50 border border-amber-200 border-l-4 shadow-sm";
              actionColor = "text-amber-600 font-bold";
            } else if (item.type === 'entry') {
              containerClass = "p-3 rounded-lg bg-white border border-slate-200 border-l-4 border-l-indigo-500 shadow-sm";
              actionColor = "text-emerald-600 font-bold";
            } else if (item.type === 'exit') {
              containerClass = "p-3 rounded-lg bg-white border border-slate-200 border-l-4 border-l-slate-400 shadow-sm";
              actionColor = "text-slate-500 font-bold";
            }

            return (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 8 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                key={item.id} 
                className={containerClass}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-slate-400">{item.time}</span>
                  <span className={actionColor}>{item.type.toUpperCase()}</span>
                </div>
                <div className="text-slate-700 font-sans leading-relaxed">{item.msg}</div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredActivity.length === 0 && (
          <div className="text-center text-slate-400 py-8 font-sans text-sm">
            No events match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}

function SystemStatus() {
  return (
    <div className="bg-white mt-auto shrink-0 border-t border-slate-200 flex flex-col">
      <div className="p-6">
        <h3 className="text-[10px] font-bold mb-4 text-slate-500 uppercase tracking-widest">Hardware Grid</h3>
        <div className="space-y-3">
          {[
            { label: 'Camera Networks', active: 112, total: 114 },
            { label: 'LIDAR Sensors', active: 540, total: 540 },
            { label: 'Gate Barriers', active: 48, total: 50 },
          ].map(hw => {
            const isWarning = hw.active < hw.total;
            return (
              <div key={hw.label} className="flex justify-between items-center text-[11px] font-bold uppercase text-slate-700">
                <span>{hw.label}</span>
                <div className="flex items-center gap-2">
                  <span className={cn("mono text-[10px]", isWarning ? 'text-amber-600' : 'text-emerald-600')}>
                    {hw.active}/{hw.total}
                  </span>
                  <div className={cn("w-1.5 h-1.5 rounded-full shadow-sm", isWarning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Hardware Override</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="bg-white text-slate-700 py-2 rounded text-[10px] font-bold border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-colors">OPEN BARRIERS</button>
          <button className="bg-white text-slate-700 py-2 rounded text-[10px] font-bold border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-colors">LOCKDOWN</button>
          <button className="bg-white text-slate-700 py-2 rounded text-[10px] font-bold border border-slate-200 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-colors">RESET SENSORS</button>
          <button className="bg-rose-50 text-rose-600 py-2 rounded text-[10px] font-bold border border-rose-200 shadow-sm hover:bg-rose-100 hover:border-rose-300 transition-colors">SHUTDOWN</button>
        </div>
      </div>
    </div>
  );
}

function MapPanel({
  markers,
  zones,
  vehicles,
}: {
  markers: MapMarker[];
  zones: Zone[];
  vehicles: Vehicle[];
}) {
  const fallbackMarkers = markers.length
    ? markers
    : [
        { id: 'M-1', lat: 37.7849, lng: -122.4094, status: 'critical' },
        { id: 'M-2', lat: 37.7649, lng: -122.4294, status: 'warning' },
        { id: 'M-3', lat: 37.7739, lng: -122.4312, status: 'good' },
        { id: 'M-4', lat: 37.7949, lng: -122.3994, status: 'good' },
        { id: 'M-5', lat: 37.7549, lng: -122.4094, status: 'critical' },
      ];

  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const zoneLayerRef = useRef<L.LayerGroup | null>(null);
  const zoneLabelLayerRef = useRef<L.LayerGroup | null>(null);
  const vehicleLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const width = 1000;
    const height = 1000;
    const bounds = L.latLngBounds([0, 0], [height, width]);

    if (!leafletMapRef.current) {
      const map = L.map(mapRef.current, {
        crs: L.CRS.Simple,
        zoom: 0,
        minZoom: -1,
        maxZoom: 2,
        attributionControl: false,
        zoomControl: true,
      });

      L.imageOverlay(mockMap, bounds).addTo(map);
      map.fitBounds(bounds);

      leafletMapRef.current = map;
      markerLayerRef.current = L.layerGroup().addTo(map);
      zoneLayerRef.current = L.layerGroup().addTo(map);
      zoneLabelLayerRef.current = L.layerGroup().addTo(map);
      vehicleLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = leafletMapRef.current;
    const markerLayer = markerLayerRef.current;
    const zoneLayer = zoneLayerRef.current;
    const zoneLabelLayer = zoneLabelLayerRef.current;
    const vehicleLayer = vehicleLayerRef.current;
    if (!map || !markerLayer || !zoneLayer || !zoneLabelLayer || !vehicleLayer) return;

    markerLayer.clearLayers();
    zoneLayer.clearLayers();
    zoneLabelLayer.clearLayers();
    vehicleLayer.clearLayers();

    const lats = fallbackMarkers.map((m) => m.lat);
    const lngs = fallbackMarkers.map((m) => m.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const toScaled = (value: number, min: number, max: number, scale: number) => {
      if (max === min) return scale / 2;
      return ((value - min) / (max - min)) * scale;
    };

    const layout = [
      {
        id: 'Z-Alpha',
        bounds: [[140, 140], [420, 420]],
        spots: [
          [0.22, 0.25],
          [0.52, 0.2],
          [0.75, 0.35],
          [0.3, 0.7],
          [0.68, 0.72],
        ],
      },
      {
        id: 'Z-Beta',
        bounds: [[140, 580], [420, 860]],
        spots: [
          [0.18, 0.3],
          [0.42, 0.18],
          [0.7, 0.25],
          [0.28, 0.68],
          [0.72, 0.72],
        ],
      },
      {
        id: 'Z-Gamma',
        bounds: [[460, 140], [780, 420]],
        spots: [
          [0.2, 0.25],
          [0.5, 0.2],
          [0.75, 0.35],
          [0.3, 0.7],
          [0.7, 0.75],
        ],
      },
      {
        id: 'Z-Delta',
        bounds: [[460, 460], [780, 700]],
        spots: [
          [0.2, 0.25],
          [0.5, 0.18],
          [0.78, 0.32],
          [0.3, 0.72],
          [0.7, 0.78],
        ],
      },
      {
        id: 'Z-Epsilon',
        bounds: [[460, 720], [820, 880]],
        spots: [
          [0.2, 0.28],
          [0.52, 0.2],
          [0.78, 0.34],
          [0.32, 0.7],
          [0.72, 0.72],
        ],
      },
    ] as const;

    const zoneMap = new Map(zones.map((z) => [z.id, z]));
    const vehicleCounts = new Map<string, number>();
    vehicles.forEach((v) => {
      const key = v.zone || '';
      if (!key) return;
      const count = vehicleCounts.get(key) || 0;
      vehicleCounts.set(key, count + 1);
    });

    layout.forEach((zoneLayout) => {
      const zone = zoneMap.get(zoneLayout.id);
      const total = zone?.total ?? 1;
      const occupied = vehicleCounts.get(zoneLayout.id) ?? zone?.occupied ?? 0;
      const rate = Math.min(100, Math.max(0, (occupied / total) * 100));
      let status = 'good';
      if (rate > 90) status = 'critical';
      else if (rate > 75) status = 'warning';

      let fill = '#10b981';
      let stroke = '#047857';
      if (status === 'warning') {
        fill = '#f59e0b';
        stroke = '#b45309';
      }
      if (status === 'critical') {
        fill = '#ef4444';
        stroke = '#b91c1c';
      }

      const rect = L.rectangle(zoneLayout.bounds as L.LatLngBoundsExpression, {
        color: stroke,
        weight: 2,
        fillColor: fill,
        fillOpacity: 0.18,
      });
      rect.addTo(zoneLayer);

      const center = L.latLngBounds(zoneLayout.bounds as L.LatLngBoundsExpression).getCenter();
      const label = L.marker(center, {
        icon: L.divIcon({
          className: `mock-zone-label mock-zone-label--${status}`,
          html:
            `<div class="mock-zone-label__title">${zone?.name ?? zoneLayout.id}</div>` +
            `<div class="mock-zone-label__meta">${zoneLayout.id} • ${rate.toFixed(0)}% OCC</div>`,
          iconSize: [140, 40],
          iconAnchor: [70, 20],
        }),
        interactive: false,
      });
      label.addTo(zoneLabelLayer);

      const zoneVehicles = vehicles
        .filter((v) => v.zone === zoneLayout.id && v.status === 'parked')
        .slice(0, 5);

      const [[minY, minX], [maxY, maxX]] = zoneLayout.bounds;
      const zoneWidth = maxX - minX;
      const zoneHeight = maxY - minY;

      zoneVehicles.forEach((vehicle, index) => {
        const spot = zoneLayout.spots[index] || [0.5, 0.5];
        const y = minY + zoneHeight * spot[0];
        const x = minX + zoneWidth * spot[1];
        const icon = L.divIcon({
          className: 'mock-vehicle',
          html: '<div class="mock-vehicle__body"></div><div class="mock-vehicle__roof"></div>',
          iconSize: [18, 12],
          iconAnchor: [9, 6],
        });

        L.marker([y, x], { icon })
          .bindPopup(
            `<div class="text-xs font-semibold text-slate-800">${vehicle.plate}</div>` +
            `<div class="text-[10px] uppercase text-slate-500">${zoneLayout.id}</div>`
          )
          .addTo(vehicleLayer);
      });
    });

    fallbackMarkers.forEach((marker) => {
      const x = toScaled(marker.lng, minLng, maxLng, width);
      const y = height - toScaled(marker.lat, minLat, maxLat, height);
      const status = marker.status || 'good';
      const icon = L.divIcon({
        className: `mock-marker mock-marker--${status}`,
        html: '<div class="mock-marker__dot"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker([y, x], { icon })
        .bindPopup(
          `<div class="text-xs font-semibold text-slate-800">${marker.id}</div>` +
          `<div class="text-[10px] uppercase text-slate-500">${status}</div>`
        )
        .addTo(markerLayer);
    });

    return () => {
      map.invalidateSize();
    };
  }, [fallbackMarkers, zones, vehicles]);

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 shadow-sm">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
}

function VehiclesPanel({
  vehicles,
  setVehicles,
  refreshVehicles,
  refreshActivity,
  zones,
}: {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  refreshVehicles: () => Promise<void>;
  refreshActivity: () => Promise<void>;
  zones: Zone[];
}) {
  const [search, setSearch] = useState('');
  
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookPlate, setBookPlate] = useState('');
  const [bookZone, setBookZone] = useState('Z-Alpha');
  const [generatedToken, setGeneratedToken] = useState('');
  const [bookingError, setBookingError] = useState('');

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyToken, setVerifyToken] = useState('');
  const [verifyResult, setVerifyResult] = useState<{success: boolean, msg: string} | null>(null);

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(search.toLowerCase()) || 
    v.token.toLowerCase().includes(search.toLowerCase()) ||
    v.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookPlate.trim()) return;
    try {
      const res = await fetch('/api/vehicles/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate: bookPlate, zone: bookZone }),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        setBookingError(errorBody?.error || 'Booking failed.');
        return;
      }
      const data = await res.json();
      if (data?.vehicle) {
        setVehicles((prev) => [data.vehicle, ...prev]);
      }
      if (data?.token) setGeneratedToken(data.token);
      setBookingError('');
      await refreshVehicles();
      await refreshActivity();
    } catch {
      return;
    }
  };

  const resetBooking = () => {
    setShowBookModal(false);
    setBookPlate('');
    setGeneratedToken('');
    setBookingError('');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyToken.trim()) return;
    try {
      const res = await fetch('/api/vehicles/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.vehicle) {
        setVehicles((prev) => prev.map(v => v.id === data.vehicle.id ? data.vehicle : v));
      }
      if (typeof data?.success === 'boolean' && data?.msg) {
        setVerifyResult({ success: data.success, msg: data.msg });
      }
      await refreshVehicles();
      await refreshActivity();
    } catch {
      return;
    }
  };

  const resetVerify = () => {
    setShowVerifyModal(false);
    setVerifyToken('');
    setVerifyResult(null);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-slate-200 gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Vehicle Management</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-medium">Active fleet & temporary passes</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Plate, Token, or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64 bg-slate-50 uppercase placeholder:normal-case font-mono"
            />
          </div>
          <button 
            onClick={() => setShowVerifyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">Verify Entry</span>
          </button>
          <button 
            onClick={() => setShowBookModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Book Area</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              <th className="py-4 px-6 font-semibold">Vehicle ID</th>
              <th className="py-4 px-6 font-semibold">License Plate</th>
              <th className="py-4 px-6 font-semibold">Status</th>
              <th className="py-4 px-6 font-semibold">Token</th>
              <th className="py-4 px-6 font-semibold">Zone</th>
              <th className="py-4 px-6 font-semibold text-right">Action Time</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            <AnimatePresence>
              {filteredVehicles.map((v) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  key={v.id} 
                  onClick={() => setSelectedVehicle(v)}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  <td className="py-4 px-6 font-mono text-slate-500">{v.id}</td>
                  <td className="py-4 px-6 font-bold text-slate-800">{v.plate}</td>
                  <td className="py-4 px-6">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      v.status === 'parked' 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {v.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono text-xs text-indigo-600 font-semibold">{v.token}</td>
                  <td className="py-4 px-6 text-slate-600">{v.zone}</td>
                  <td className="py-4 px-6 text-right font-mono text-xs text-slate-500">{v.time}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {filteredVehicles.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Car className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                  <p>No vehicles found matching your criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Book Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
          >
            {generatedToken ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <Ticket className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Booking Confirmed</h3>
                <p className="text-sm text-slate-500 mb-6">Present this token at the entrance gate.</p>
                
                <div className="w-full bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8 border-dashed">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">Access Token</p>
                  <p className="text-3xl font-mono text-indigo-600 font-bold tracking-widest select-all">{generatedToken}</p>
                </div>
                
                <button 
                  onClick={resetBooking}
                  className="w-full py-3 bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="py-4 px-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                     <Plus className="w-4 h-4 text-indigo-600" />
                     Book Parking Space
                  </h3>
                  <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleBook} className="p-6 flex flex-col gap-5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">License Plate</label>
                    <input 
                      type="text" 
                      required
                      value={bookPlate}
                      onChange={(e) => setBookPlate(e.target.value.toUpperCase())}
                      placeholder="e.g. ABC-1234" 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-2">Target Zone</label>
                    <select 
                      value={bookZone}
                      onChange={(e) => setBookZone(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {zones.map(z => (
                        <option key={z.id} value={z.id}>{z.name} ({z.id})</option>
                      ))}
                    </select>
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Generate Token
                  </button>
                  {bookingError && (
                    <div className="text-xs text-rose-600 font-semibold text-center">{bookingError}</div>
                  )}
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
          >
            <div className="py-4 px-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Key className="w-4 h-4 text-indigo-600" />
                 Verify Token for Entry
              </h3>
              <button onClick={resetVerify} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-5">
              {verifyResult ? (
                <div className={cn(
                  "p-6 rounded-lg text-center flex flex-col items-center border",
                  verifyResult.success ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
                )}>
                  {verifyResult.success ? (
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
                  ) : (
                    <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
                  )}
                  <p className={cn("font-bold text-lg mb-2", verifyResult.success ? "text-emerald-700" : "text-rose-700")}>
                    {verifyResult.success ? "Access Granted" : "Access Denied"}
                  </p>
                  <p className={cn("text-sm", verifyResult.success ? "text-emerald-600" : "text-rose-600")}>
                    {verifyResult.msg}
                  </p>
                  <button 
                    onClick={resetVerify}
                    className={cn(
                      "mt-6 w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm text-white",
                      verifyResult.success ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                    )}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleVerify} className="flex flex-col gap-5">
                  <div className="text-center mb-2">
                    <p className="text-sm text-slate-500 mb-6">Enter the 10-character token generated from booking to authorize entry.</p>
                    <input 
                      type="text" 
                      required
                      autoFocus
                      value={verifyToken}
                      onChange={(e) => setVerifyToken(e.target.value.toUpperCase())}
                      placeholder="TKN-XXXXXX" 
                      className="w-full text-center text-3xl tracking-widest font-mono px-4 py-6 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full mt-2 py-3 bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors shadow-sm"
                  >
                    Validate Token
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Selected Vehicle Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden relative"
          >
            <div className="py-4 px-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Car className="w-5 h-5 text-indigo-600" />
                 Vehicle Details
              </h3>
              <button onClick={() => setSelectedVehicle(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">License Plate</p>
                  <p className="text-3xl font-bold text-slate-800">{selectedVehicle.plate}</p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                  selectedVehicle.status === 'parked' 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}>
                  {selectedVehicle.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Vehicle ID</p>
                  <p className="font-mono text-slate-700 font-medium">{selectedVehicle.id}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Zone Assigned</p>
                  <p className="font-medium text-slate-700">{selectedVehicle.zone}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Access Token</p>
                  <p className="font-mono text-indigo-600 font-bold">{selectedVehicle.token}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Action Time</p>
                  <p className="font-mono text-slate-700">{selectedVehicle.time}</p>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedVehicle(null)}
                className="w-full py-3 bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors shadow-sm"
              >
                Close Details
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
