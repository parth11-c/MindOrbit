'use client';

import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';

interface ChartData {
  name: string;
  gross: number;
  commission: number;
  bookings: number;
}

const DEFAULT_CHART_DATA: ChartData[] = [
  { name: 'Jan', gross: 24000, commission: 3600, bookings: 16 },
  { name: 'Feb', gross: 35000, commission: 5250, bookings: 22 },
  { name: 'Mar', gross: 42000, commission: 6300, bookings: 28 },
  { name: 'Apr', gross: 60000, commission: 9000, bookings: 38 },
  { name: 'May', gross: 82000, commission: 12300, bookings: 54 },
  { name: 'Jun', gross: 95000, commission: 14250, bookings: 65 },
];

interface AnalyticsChartsProps {
  dbChartData?: ChartData[];
}

export default function AnalyticsCharts({ dbChartData }: AnalyticsChartsProps) {
  const data = dbChartData && dbChartData.length > 0 ? dbChartData : DEFAULT_CHART_DATA;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Revenue Area Chart */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-neutral-850 dark:text-white text-xs uppercase tracking-wider">Revenue Payout Growth</h3>
          <p className="text-[10px] text-neutral-450 dark:text-neutral-500 mt-0.5 font-medium">Tracking platform gross collections vs. platform commissions.</p>
        </div>
        <div className="h-72 w-full text-[10px] font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#B85042" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#B85042" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C96A5B" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#C96A5B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" className="dark:stroke-neutral-800/50" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)', 
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  fontSize: '11px',
                  fontFamily: 'sans-serif'
                }} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="gross" name="Gross Volume (INR)" stroke="#B85042" fillOpacity={1} fill="url(#colorGross)" strokeWidth={2} />
              <Area type="monotone" dataKey="commission" name="Platform Cut (INR)" stroke="#C96A5B" fillOpacity={1} fill="url(#colorComm)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bookings Count Bar Chart */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-neutral-850 dark:text-white text-xs uppercase tracking-wider">Booking Volumes</h3>
          <p className="text-[10px] text-neutral-450 dark:text-neutral-500 mt-0.5 font-medium">Tracking completed session appointments count.</p>
        </div>
        <div className="h-72 w-full text-[10px] font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" className="dark:stroke-neutral-800/50" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)', 
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  fontSize: '11px',
                  fontFamily: 'sans-serif'
                }} 
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="bookings" name="Sessions Booked" fill="#B85042" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
