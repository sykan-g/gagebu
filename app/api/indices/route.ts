import { NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY!;

type StockIndex = {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
};

const SYMBOLS = [
  { name: '다우존스', symbol: '^DJI' },
  { name: 'S&P500', symbol: '^GSPC' },
  { name: 'Nasdaq', symbol: '^IXIC' },
  { name: '비트코인', symbol: 'BTCUSD' },
];

async function fetchQuote(symbol: string): Promise<StockIndex | null> {
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    console.log(`Fetching: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch ${symbol}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`Response for ${symbol}:`, data);

    const foundSymbol = SYMBOLS.find(s => s.symbol === symbol);
    if (!foundSymbol) return null;

    // 가격이 0이면 null 반환 (API 오류 표시)
    if (!data.c) {
      console.warn(`No price data for ${symbol}`);
      return null;
    }

    return {
      name: foundSymbol.name,
      symbol: symbol,
      price: data.c,
      change: data.d || 0,
      changePercent: data.dp || 0,
    };
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

export async function GET() {
  try {
    const promises = SYMBOLS.map(({ symbol }) => fetchQuote(symbol));
    const results = await Promise.all(promises);

    const indices = results.filter((result): result is StockIndex => result !== null);

    return NextResponse.json(indices);
  } catch (error) {
    console.error('Error in indices API:', error);
    return NextResponse.json({ error: 'Failed to fetch indices' }, { status: 500 });
  }
}
