import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface MarketDataPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingSignal {
  timeframe: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number;
  indicators: {
    sma20: number;
    sma50: number;
    rsi: number;
    momentum: number;
  };
}

interface MarketData {
  symbol: string;
  data15m: MarketDataPoint[];
  dataDaily: MarketDataPoint[];
  signals: {
    daily: TradingSignal;
    intraday: TradingSignal;
    combined: TradingSignal;
  };
  recommendation: string;
}

export default function Home() {
  const [symbol, setSymbol] = useState('AAPL');
  const [inputSymbol, setInputSymbol] = useState('AAPL');
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'15m' | 'daily'>('15m');

  const fetchData = async (ticker: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/market-data?symbol=${ticker}`);
      setData(response.data);
      setSymbol(ticker);
    } catch (err) {
      setError('Failed to fetch market data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(symbol);
    const interval = setInterval(() => fetchData(symbol), 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [symbol]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSymbol.trim()) {
      fetchData(inputSymbol.toUpperCase());
    }
  };

  const formatChartData = (rawData: MarketDataPoint[]) => {
    return rawData.map(point => ({
      time: new Date(point.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: activeTab === '15m' ? '2-digit' : undefined,
        minute: activeTab === '15m' ? '2-digit' : undefined
      }),
      price: point.close,
      volume: point.volume,
      high: point.high,
      low: point.low
    }));
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return '#10b981';
      case 'SELL': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getSignalBgColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'rgba(16, 185, 129, 0.1)';
      case 'SELL': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(245, 158, 11, 0.1)';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Trading Data Testing Platform
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            Real-time market analysis with 15-minute and daily timeframes
          </p>

          {/* Search Form */}
          <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <input
                type="text"
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value)}
                placeholder="Enter stock symbol (e.g., AAPL, GOOGL, TSLA)"
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'white',
                  background: loading ? '#9ca3af' : '#667eea',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Loading...' : 'Analyze'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Signal Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* Daily Signal */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  DAILY TIMEFRAME
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: getSignalColor(data.signals.daily.signal),
                  marginBottom: '0.5rem'
                }}>
                  {data.signals.daily.signal}
                </div>
                <div style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  Strength: {data.signals.daily.strength}%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  <div>RSI: {data.signals.daily.indicators.rsi}</div>
                  <div>Momentum: {data.signals.daily.indicators.momentum.toFixed(2)}%</div>
                </div>
              </div>

              {/* 15-min Signal */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  15-MINUTE TIMEFRAME
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: getSignalColor(data.signals.intraday.signal),
                  marginBottom: '0.5rem'
                }}>
                  {data.signals.intraday.signal}
                </div>
                <div style={{ color: '#6b7280', marginBottom: '1rem' }}>
                  Strength: {data.signals.intraday.strength}%
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  <div>RSI: {data.signals.intraday.indicators.rsi}</div>
                  <div>Momentum: {data.signals.intraday.indicators.momentum.toFixed(2)}%</div>
                </div>
              </div>

              {/* Combined Signal */}
              <div style={{
                background: getSignalBgColor(data.signals.combined.signal),
                border: `3px solid ${getSignalColor(data.signals.combined.signal)}`,
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  COMBINED SIGNAL
                </div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: getSignalColor(data.signals.combined.signal),
                  marginBottom: '0.5rem'
                }}>
                  {data.signals.combined.signal}
                </div>
                <div style={{
                  color: '#1f2937',
                  fontWeight: '600',
                  fontSize: '1.1rem'
                }}>
                  Confidence: {data.signals.combined.strength}%
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '1rem'
              }}>
                Trading Recommendation
              </h3>
              <p style={{ color: '#4b5563', lineHeight: '1.6', fontSize: '1rem' }}>
                {data.recommendation}
              </p>
            </div>

            {/* Charts */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              {/* Tabs */}
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                borderBottom: '2px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setActiveTab('15m')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: activeTab === '15m' ? '#667eea' : '#6b7280',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === '15m' ? '3px solid #667eea' : 'none',
                    cursor: 'pointer',
                    marginBottom: '-2px'
                  }}
                >
                  15-Minute Chart
                </button>
                <button
                  onClick={() => setActiveTab('daily')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: activeTab === 'daily' ? '#667eea' : '#6b7280',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'daily' ? '3px solid #667eea' : 'none',
                    cursor: 'pointer',
                    marginBottom: '-2px'
                  }}
                >
                  Daily Chart
                </button>
              </div>

              {/* Price Chart */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '1rem'
                }}>
                  {symbol} - Price Movement ({activeTab === '15m' ? '15 Minutes' : 'Daily'})
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={formatChartData(activeTab === '15m' ? data.data15m : data.dataDaily)}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke="#667eea"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Volume Chart */}
              <div>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  marginBottom: '1rem'
                }}>
                  Volume
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={formatChartData(activeTab === '15m' ? data.data15m : data.dataDaily)}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorVolume)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Technical Indicators */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  SMA 20
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  ${data.signals[activeTab === '15m' ? 'intraday' : 'daily'].indicators.sma20}
                </div>
              </div>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  SMA 50
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                  ${data.signals[activeTab === '15m' ? 'intraday' : 'daily'].indicators.sma50}
                </div>
              </div>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  RSI (14)
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: data.signals[activeTab === '15m' ? 'intraday' : 'daily'].indicators.rsi > 70
                    ? '#ef4444'
                    : data.signals[activeTab === '15m' ? 'intraday' : 'daily'].indicators.rsi < 30
                      ? '#10b981'
                      : '#1f2937'
                }}>
                  {data.signals[activeTab === '15m' ? 'intraday' : 'daily'].indicators.rsi}
                </div>
              </div>
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Momentum (10)
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: data.signals[activeTab === '15m' ? 'intraday' : 'daily'].indicators.momentum > 0
                    ? '#10b981'
                    : '#ef4444'
                }}>
                  {data.signals[activeTab === '15m' ? 'intraday' : 'daily'].indicators.momentum.toFixed(2)}%
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
