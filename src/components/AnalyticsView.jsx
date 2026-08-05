import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, BarChart, Bar, ScatterChart, Scatter, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell
} from 'recharts';
import { ChartBar, TrendingUp, ScatterChart as ScatterIcon, PieChart as PieIcon, Hexagon, Calendar } from 'lucide-react';

const COLORS = ['#8b5cf6', '#10b981', '#fb923c', '#2dd4bf', '#60a5fa', '#f472b6', '#818cf8', '#94a3b8'];
const WEATHER_COLORS = {
  Sunny: '#fbbf24',
  Cloudy: '#9ca3af',
  Rainy: '#3b82f6',
  Windy: '#14b8a6',
  Snowy: '#a855f7'
};

const AnalyticsView = () => {
  const { logs, checkpoints } = useContext(AppContext);
  const [selectedHabitId, setSelectedHabitId] = useState('exercise');

  // Convert logs object to ordered array of data for the last 30 days
  const logDates = Object.keys(logs).sort();
  const rawChartData = logDates.map((date) => {
    const log = logs[date];
    const vals = log.values || {};
    
    // Extract values or use default
    return {
      date: date.substring(5), // Just MM-DD for label
      fullDate: date,
      sleep: Number(vals.sleep ?? 0),
      sleep_quality: Number(vals.sleep_quality ?? 0),
      mood: Number(vals.mood ?? 0),
      stress: Number(vals.stress ?? 0),
      water: Number(vals.water ?? 0),
      weight: Number(vals.weight ?? 0),
      weather: log.weather || 'Sunny',
      moodDetail: log.moodDetail || 'Average',
      // Store habit completions as 1 or 0
      ...checkpoints.reduce((acc, c) => {
        if (c.type === 'binary') {
          acc[c.id] = vals[c.id] === true ? 1 : 0;
        }
        return acc;
      }, {})
    };
  });

  const chartData = rawChartData.slice(-30); // Take last 30 logs for analytics

  // Fallback if there is zero data logged
  if (chartData.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <Hexagon size={48} color="var(--accent-color)" style={{ marginBottom: '16px', animation: 'pulse 2s infinite' }} />
        <h2>Not Enough Data Yet</h2>
        <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>
          Please log details in the <strong>Daily Log</strong> tab to view interactive graphs, or connect custom trackers to visualize trends.
        </p>
      </div>
    );
  }

  // 1. Weather Proportion (Pie Chart)
  const weatherCounts = chartData.reduce((acc, cur) => {
    acc[cur.weather] = (acc[cur.weather] || 0) + 1;
    return acc;
  }, {});

  const weatherData = Object.keys(weatherCounts).map((key) => ({
    name: key,
    value: weatherCounts[key]
  }));

  // 2. Sleep vs Mood Correlation (Scatter Chart)
  const correlationData = chartData
    .filter((d) => d.sleep > 0 && d.mood > 0)
    .map((d) => ({
      sleep: d.sleep,
      mood: d.mood,
      stress: d.stress,
      date: d.date
    }));

  // 3. Radar Chart (Habit balance by category)
  // Aggregate completions of standard categories
  const categories = {
    vitals: { name: 'Vitals Logged', count: 0, total: 0 },
    habits: { name: 'Habits Completed', count: 0, total: 0 },
    meds: { name: 'Meds Taken', count: 0, total: 0 }
  };

  chartData.forEach((dayLog) => {
    checkpoints.forEach((c) => {
      const val = logs[dayLog.fullDate]?.values?.[c.id];
      if (c.type === 'binary') {
        categories[c.section].total += 1;
        if (val === true) categories[c.section].count += 1;
      } else {
        categories[c.section].total += 1;
        if (val !== undefined && val !== '') categories[c.section].count += 1;
      }
    });
  });

  const radarData = Object.keys(categories).map((key) => {
    const cat = categories[key];
    const percent = cat.total > 0 ? Math.round((cat.count / cat.total) * 100) : 0;
    return {
      subject: cat.name,
      percentage: percent,
      fullMark: 100
    };
  });

  // 4. Heatmap View for selected Habit
  const binaryCheckpoints = checkpoints.filter((c) => c.type === 'binary');

  return (
    <div className="container">
      <h2>Life Analytics</h2>
      
      {/* Vitals Trends: Line & Area Chart Overlay */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <TrendingUp size={18} color="var(--accent-color)" />
          <h3>Mood, Sleep & Stress Trends</h3>
        </div>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--danger-color)" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="var(--danger-color)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 10]} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '12px' }}
                labelStyle={{ fontWeight: '600', color: 'var(--text-primary)' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
              
              {/* Stress Fill */}
              <Area type="monotone" name="Stress / Anxiety" dataKey="stress" stroke="var(--danger-color)" strokeWidth={1.5} fillOpacity={1} fill="url(#colorStress)" />
              
              {/* Sleep Hours Line */}
              <Line type="monotone" name="Sleep Time (hrs)" dataKey="sleep" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 6 }} dot={{ r: 2 }} />
              
              {/* Mood Line */}
              <Line type="monotone" name="Mood Rating (1-10)" dataKey="mood" stroke="var(--mood-happy)" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Habits Completion Heatmap Grid */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Calendar size={18} color="var(--accent-color)" />
          <h3>Habits Grid Tracker</h3>
        </div>
        
        {/* Habit dropdown selector */}
        <select
          value={selectedHabitId}
          onChange={(e) => setSelectedHabitId(e.target.value)}
          style={{
            width: '100%',
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-family)',
            fontSize: '14px',
            marginBottom: '16px',
            outline: 'none'
          }}
        >
          {binaryCheckpoints.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Heatmap Grid */}
        <div className="heatmap-month">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="heatmap-day-label">{d}</div>
          ))}
          {chartData.map((dayItem, index) => {
            const completed = dayItem[selectedHabitId] === 1;
            return (
              <div
                key={dayItem.fullDate}
                className={`heatmap-cell ${completed ? 'active' : ''}`}
                style={{
                  background: completed ? 'var(--accent-color)' : '#f8fafc',
                  border: '1px solid var(--border-color)'
                }}
                title={`${dayItem.fullDate}: ${completed ? 'Completed' : 'Missed'}`}
              >
                {dayItem.fullDate.substring(8)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bar Chart: Water Volume Logs */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <ChartBar size={18} color="var(--accent-color)" />
          <h3>Water Intake (oz)</h3>
        </div>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={chartData.slice(-15)} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '12px' }}
                labelStyle={{ fontWeight: '600', color: 'var(--text-primary)' }}
              />
              <Bar dataKey="water" fill="#60a5fa" radius={[6, 6, 0, 0]}>
                {chartData.slice(-15).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.water >= 60 ? '#10b981' : '#60a5fa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar & Pie Side-by-Side Flex Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Radar chart: Health Balance */}
        <div className="glass-card" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Hexagon size={18} color="var(--accent-color)" />
            <h3>Tracker Category Balance</h3>
          </div>
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--text-muted)" fontSize={9} />
                <Radar name="Completions %" dataKey="percentage" stroke="var(--accent-color)" fill="var(--accent-color)" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Weather log */}
        <div className="glass-card" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <PieIcon size={18} color="var(--accent-color)" />
            <h3>Monthly Weather Mix</h3>
          </div>
          <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={weatherData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {weatherData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={WEATHER_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Color key legends */}
            <div style={{ width: '40%', display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '10px' }}>
              {weatherData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '20px', background: WEATHER_COLORS[entry.name] || COLORS[index % COLORS.length] }}></div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scatter Chart: sleep vs mood */}
        <div className="glass-card" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ScatterIcon size={18} color="var(--accent-color)" />
            <h3>Sleep Time vs. Mood Rating</h3>
          </div>
          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="sleep" name="Sleep" unit="h" stroke="var(--text-muted)" fontSize={11} domain={[4, 11]} tickLine={false} />
                <YAxis type="number" dataKey="mood" name="Mood" stroke="var(--text-muted)" fontSize={11} domain={[1, 10]} tickLine={false} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ background: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '12px' }}
                />
                <Scatter name="Correlation" dataKey="sleep" data={correlationData} fill="var(--accent-color)">
                  {correlationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.mood >= 8 ? 'var(--mood-happy)' : 'var(--mood-blissful)'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
            Plots your hours of sleep on the horizontal axis and your daily mood rating on the vertical axis.
          </p>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsView;
