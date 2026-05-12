'use client';

import { useMemo, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type EntryType = 'income' | 'expense';

type Entry = {
  id: string;
  date: string;
  type: EntryType;
  amount: number;
  category: string;
  memo: string;
  created_at: string;
};

const categoryOptions: Record<EntryType, string[]> = {
  income: ['급여', '부수입', '용돈', '기타'],
  expense: ['식비', '교통', '쇼핑', '문화/여가', '공과금', '의료', '기타'],
};

type StockIndex = {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
};

const mockIndices: StockIndex[] = [
  { name: '다우존스', symbol: 'DJI', price: 40856.23, change: 156.42, changePercent: 0.39 },
  { name: 'S&P500', symbol: 'GSPC', price: 5432.11, change: 32.87, changePercent: 0.61 },
  { name: 'Nasdaq', symbol: 'IXIC', price: 17245.63, change: -98.54, changePercent: -0.57 },
  { name: 'BTC/USD', symbol: 'BTCUSD', price: 63450.85, change: 1250.32, changePercent: 2.01 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);

const todayString = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

export default function HomePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState(todayString());
  const [type, setType] = useState<EntryType>('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categoryOptions.income[0]);
  const [memo, setMemo] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [indices, setIndices] = useState<StockIndex[]>(mockIndices);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEntries(data || []);
      } catch (err) {
        console.error('데이터 로드 실패:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    const darkModeSaved = localStorage.getItem('gagebu-darkmode') === 'true';
    setIsDarkMode(darkModeSaved);
    if (darkModeSaved) {
      document.documentElement.classList.add('dark');
    }
  }, []);


  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEntries((current) => current.filter((entry) => entry.id !== id));
    } catch (err) {
      console.error('데이터 삭제 실패:', err);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('gagebu-darkmode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const categories = useMemo(() => categoryOptions[type], [type]);

  const handleTypeChange = (value: EntryType) => {
    setType(value);
    setCategory(categoryOptions[value][0]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedAmount = Number(amount.replace(/,/g, ''));
    if (!date || !parsedAmount || parsedAmount <= 0) {
      alert('날짜와 0보다 큰 금액을 입력하세요');
      return;
    }

    try {
      console.log('저장 중:', { date, type, amount: parsedAmount, category, memo });

      const { data, error } = await supabase
        .from('entries')
        .insert([
          {
            date,
            type,
            amount: parsedAmount,
            category,
            memo,
          },
        ])
        .select();

      console.log('응답:', { data, error });

      if (error) {
        console.error('Supabase 오류:', error);
        alert(`저장 실패: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        console.log('새 항목 추가:', data[0]);
        setEntries((current) => [data[0], ...current]);
        setAmount('');
        setMemo('');
        setDate(todayString());
        alert('✅ 저장되었습니다!');
      }
    } catch (err) {
      console.error('에러 발생:', err);
      alert(`오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    }
  };

  const monthlyEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    return entryDate.getFullYear() === selectedYear && entryDate.getMonth() === selectedMonth;
  });

  const totalIncome = monthlyEntries
    .filter((entry) => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalExpense = monthlyEntries
    .filter((entry) => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 px-3 py-3 sm:py-4 text-slate-900 dark:text-slate-100">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-3 sm:mb-4 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-600 dark:from-slate-800 dark:to-slate-900 p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-white">💰 가계부</h1>
                <p className="mt-1 text-xs sm:text-sm text-indigo-100 dark:text-slate-400">이번 달 수입, 지출, 잔액을 기록하고 관리하세요.</p>
              </div>
              <button
                onClick={toggleDarkMode}
                className="rounded-lg p-2 text-xl transition hover:bg-white/20 active:scale-90"
                title={isDarkMode ? '라이트 모드' : '다크 모드'}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 bg-white/20 rounded-xl px-3 py-2 backdrop-blur">
              <button
                onClick={handlePrevMonth}
                className="text-white hover:text-indigo-100 transition font-semibold text-lg"
              >
                ◀️
              </button>
              <span className="text-white font-bold text-sm sm:text-lg min-w-max">
                {selectedYear}년 {String(selectedMonth + 1).padStart(2, '0')}월
              </span>
              <button
                onClick={handleNextMonth}
                className="text-white hover:text-indigo-100 transition font-semibold text-lg"
              >
                ▶️
              </button>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3 grid-cols-3">
            <div className="rounded-xl sm:rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur p-3 sm:p-4 shadow hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">📈</span>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">이번 달 수입</p>
              </div>
              <p className="mt-2 sm:mt-3 text-lg sm:text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur p-3 sm:p-4 shadow hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">📉</span>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">이번 달 지출</p>
              </div>
              <p className="mt-2 sm:mt-3 text-lg sm:text-2xl font-extrabold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur p-3 sm:p-4 shadow hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">💰</span>
                <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">잔액</p>
              </div>
              <p className="mt-2 sm:mt-3 text-lg sm:text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                {formatCurrency(totalIncome - totalExpense)}
              </p>
            </div>
          </div>
        </header>

        <section className="mb-4 sm:mb-5">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mb-2">📊 주요 지수</h2>
          <div className="grid gap-2 sm:gap-2 grid-cols-2 sm:grid-cols-4">
            {indices.map((index) => (
              <div
                key={index.symbol}
                className="rounded-lg sm:rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur p-2 sm:p-3 shadow hover:shadow-md transition-shadow"
              >
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{index.name}</p>
                <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{index.price.toLocaleString('ko-KR')}</p>
                <div className="mt-1 flex items-center gap-1">
                  <span className={`text-xs sm:text-sm font-bold ${index.change >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {index.change >= 0 ? '▲' : '▼'} {Math.abs(index.change).toFixed(2)}
                  </span>
                  <span className={`text-xs font-semibold ${index.changePercent >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    ({index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur p-4 sm:p-6 shadow-lg border border-white/20 dark:border-slate-700/50">
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">✏️ 수입/지출 입력</h2>
            <form className="mt-3 sm:mt-4 space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
                <label className="space-y-0.5 sm:space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  날짜
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-600 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-blue-400/50"
                  />
                </label>
                <label className="space-y-0.5 sm:space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  타입
                  <select
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value as EntryType)}
                    className="w-full rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-600 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-blue-400/50"
                  >
                    <option value="income">수입</option>
                    <option value="expense">지출</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
                <label className="space-y-0.5 sm:space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  금액
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="예: 50000"
                    className="w-full rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-600 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-blue-400/50"
                  />
                </label>
                <label className="space-y-0.5 sm:space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                  카테고리
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-600 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-blue-400/50"
                  >
                    {categories.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-0.5 sm:space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                메모
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="간단한 설명을 입력하세요"
                  className="w-full rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-600 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700 dark:to-slate-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-blue-400/50"
                  rows={2}
                />
              </label>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 sm:py-2.5 text-xs font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105 active:scale-95 touch-manipulation"
              >
                ✨ 내역 추가
              </button>
            </form>
          </div>

          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-800 p-4 sm:p-6 shadow-lg border border-purple-100 dark:border-slate-700">
            <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">📊 이번 달 요약</h2>
            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
              <div className="rounded-lg sm:rounded-xl bg-white/80 dark:bg-slate-700/80 backdrop-blur border border-purple-100 dark:border-slate-600 hover:shadow-lg transition-shadow p-3 sm:p-4">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">📝 기록된 전체 내역</p>
                <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{monthlyEntries.length}건</p>
              </div>
              <div className="rounded-lg sm:rounded-xl bg-white/80 dark:bg-slate-700/80 backdrop-blur border border-pink-100 dark:border-slate-600 hover:shadow-lg transition-shadow p-3 sm:p-4">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">⭐ 최근 추가된 항목</p>
                <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 font-medium">{entries[0] ? `${entries[0].date} • ${entries[0].category}` : '내역이 아직 없습니다.'}</p>
                <p className="mt-1 text-sm sm:text-base font-bold text-pink-600 dark:text-pink-400">{entries[0] ? formatCurrency(entries[0].amount) : ''}</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">📋 내역 목록</h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">최신순 정렬</span>
          </div>
          <div className="space-y-2 sm:space-y-2">
            {isLoading ? (
              <div className="rounded-lg sm:rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur p-6 sm:p-8 text-center text-slate-500 dark:text-slate-400">
                <p className="text-sm sm:text-base">📂 데이터를 불러오는 중...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="rounded-lg sm:rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 backdrop-blur p-6 sm:p-8 text-center text-slate-500 dark:text-slate-400">
                <p className="text-sm sm:text-base">아직 기록된 내역이 없습니다.</p>
                <p className="mt-1 text-xs">수입/지출을 추가해보세요 💳</p>
              </div>
            ) : (
              entries.map((entry) => (
                <article key={entry.id} className="group rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur p-3 sm:p-4 shadow-md hover:shadow-lg transition-all hover:border-indigo-200 dark:hover:border-blue-400">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{entry.category}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{entry.date} {entry.memo ? `• ${entry.memo}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-bold shadow-md whitespace-nowrap ${
                          entry.type === 'income' ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-white' : 'bg-gradient-to-r from-rose-400 to-pink-400 text-white'
                        }`}
                      >
                        {entry.type === 'income' ? '💰 수입' : '💸 지출'}
                      </span>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2 py-1 text-xs font-semibold transition-colors"
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <p className={`text-base sm:text-lg font-bold ${entry.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
