import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

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

interface ApiResponse {
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

// Simple Moving Average calculation
function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// RSI calculation
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const gains = changes.slice(-period).map(c => c > 0 ? c : 0);
  const losses = changes.slice(-period).map(c => c < 0 ? -c : 0);

  const avgGain = gains.reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Momentum calculation
function calculateMomentum(prices: number[], period: number = 10): number {
  if (prices.length < period) return 0;
  return ((prices[prices.length - 1] - prices[prices.length - period]) / prices[prices.length - period]) * 100;
}

// Generate trading signal
function generateSignal(data: MarketDataPoint[], timeframe: string): TradingSignal {
  const closes = data.map(d => d.close);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const rsi = calculateRSI(closes, 14);
  const momentum = calculateMomentum(closes, 10);

  const currentPrice = closes[closes.length - 1];

  // Signal logic
  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let strength = 0;

  // Trend following strategy
  if (currentPrice > sma20 && sma20 > sma50 && rsi < 70 && momentum > 0) {
    signal = 'BUY';
    strength = Math.min(100, (rsi < 30 ? 90 : 70) + (momentum > 5 ? 20 : 10));
  } else if (currentPrice < sma20 && sma20 < sma50 && rsi > 30 && momentum < 0) {
    signal = 'SELL';
    strength = Math.min(100, (rsi > 70 ? 90 : 70) + (momentum < -5 ? 20 : 10));
  } else {
    strength = 40;
  }

  return {
    timeframe,
    signal,
    strength,
    indicators: {
      sma20: Math.round(sma20 * 100) / 100,
      sma50: Math.round(sma50 * 100) / 100,
      rsi: Math.round(rsi * 100) / 100,
      momentum: Math.round(momentum * 100) / 100
    }
  };
}

// Combine signals from multiple timeframes
function combineSignals(dailySignal: TradingSignal, intradaySignal: TradingSignal): TradingSignal {
  const dailyWeight = 0.6;
  const intradayWeight = 0.4;

  const combinedStrength = (dailySignal.strength * dailyWeight) + (intradaySignal.strength * intradayWeight);

  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';

  if (dailySignal.signal === intradaySignal.signal) {
    signal = dailySignal.signal;
  } else if (dailySignal.signal === 'BUY' && intradaySignal.signal !== 'SELL') {
    signal = 'BUY';
  } else if (dailySignal.signal === 'SELL' && intradaySignal.signal !== 'BUY') {
    signal = 'SELL';
  }

  return {
    timeframe: 'combined',
    signal,
    strength: Math.round(combinedStrength),
    indicators: dailySignal.indicators
  };
}

// Generate synthetic data (Yahoo Finance API alternative for demo)
function generateSyntheticData(basePrice: number, periods: number, interval: number): MarketDataPoint[] {
  const data: MarketDataPoint[] = [];
  let price = basePrice;
  const now = Date.now();

  for (let i = periods; i >= 0; i--) {
    const timestamp = now - (i * interval);
    const volatility = 0.02;
    const trend = 0.0001;

    const change = (Math.random() - 0.5) * volatility * price + trend * price;
    const open = price;
    price = price + change;
    const high = Math.max(open, price) * (1 + Math.random() * 0.005);
    const low = Math.min(open, price) * (1 - Math.random() * 0.005);
    const close = price;
    const volume = Math.floor(1000000 + Math.random() * 5000000);

    data.push({
      timestamp,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume
    });
  }

  return data;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol = 'AAPL' } = req.query;

  try {
    // Generate synthetic data for demo
    // In production, replace with actual Yahoo Finance API calls
    const basePrice = 150 + Math.random() * 50;

    // 15-minute data (last 100 periods = ~25 hours)
    const data15m = generateSyntheticData(basePrice, 100, 15 * 60 * 1000);

    // Daily data (last 100 days)
    const dataDaily = generateSyntheticData(basePrice, 100, 24 * 60 * 60 * 1000);

    // Generate signals
    const dailySignal = generateSignal(dataDaily, 'daily');
    const intradaySignal = generateSignal(data15m, '15min');
    const combinedSignal = combineSignals(dailySignal, intradaySignal);

    // Generate recommendation
    let recommendation = '';
    if (combinedSignal.signal === 'BUY') {
      recommendation = `Strong ${combinedSignal.strength > 80 ? 'BUY' : 'Moderate BUY'} signal. Daily trend is ${dailySignal.signal} with ${dailySignal.strength}% confidence. 15-min trend shows ${intradaySignal.signal} with ${intradaySignal.strength}% confidence.`;
    } else if (combinedSignal.signal === 'SELL') {
      recommendation = `Strong ${combinedSignal.strength > 80 ? 'SELL' : 'Moderate SELL'} signal. Daily trend is ${dailySignal.signal} with ${dailySignal.strength}% confidence. 15-min trend shows ${intradaySignal.signal} with ${intradaySignal.strength}% confidence.`;
    } else {
      recommendation = `HOLD position. Market conditions are mixed. Daily: ${dailySignal.signal} (${dailySignal.strength}%), 15-min: ${intradaySignal.signal} (${intradaySignal.strength}%). Wait for clearer signals.`;
    }

    const response: ApiResponse = {
      symbol: symbol as string,
      data15m: data15m.slice(-50), // Return last 50 points
      dataDaily: dataDaily.slice(-50),
      signals: {
        daily: dailySignal,
        intraday: intradaySignal,
        combined: combinedSignal
      },
      recommendation
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching market data:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
}
