import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';

export default function StockReturnCalculator() {
    const [ticker, setTicker] = useState('');
    const [years, setYears] = useState(10);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateSampleData = (tickerSymbol, numYears) => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - numYears);

        const annualReturns = [];
        const monthlyData = [];
        let cumulativeValue = 100;

        for (let i = 0; i < numYears; i++) {
            const yearReturn = (Math.random() * 40 - 10);
            annualReturns.push({
                year: startDate.getFullYear() + i,
                return: yearReturn
            });
        }

        for (let i = 0; i < numYears * 12; i++) {
            const monthlyReturn = (Math.random() * 6 - 2);
            cumulativeValue *= (1 + monthlyReturn / 100);
            monthlyData.push({
                month: i,
                value: parseFloat(cumulativeValue.toFixed(2)),
                date: new Date(startDate.getTime() + i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
            });
        }

        const avgReturn = annualReturns.reduce((sum, r) => sum + r.return, 0) / annualReturns.length;
        const variance = annualReturns.reduce((sum, r) => sum + Math.pow(r.return - avgReturn, 2), 0) / annualReturns.length;
        const stdDev = Math.sqrt(variance);

        const finalValue = cumulativeValue;
        const initialValue = 100;
        const cagr = (Math.pow(finalValue / initialValue, 1 / numYears) - 1) * 100;

        return {
            ticker: tickerSymbol.toUpperCase(),
            annualReturns,
            monthlyData,
            metrics: {
                avgReturn: avgReturn.toFixed(2),
                stdDev: stdDev.toFixed(2),
                cagr: cagr.toFixed(2),
                totalReturn: ((finalValue - initialValue) / initialValue * 100).toFixed(2),
                bestYear: Math.max(...annualReturns.map(r => r.return)).toFixed(2),
                worstYear: Math.min(...annualReturns.map(r => r.return)).toFixed(2)
            }
        };
    };

    const handleCalculate = () => {
        if (!ticker.trim()) {
            setError('Please enter a stock ticker');
            return;
        }

        setLoading(true);
        setError('');

        setTimeout(() => {
            const data = generateSampleData(ticker, years);
            setResults(data);
            setLoading(false);
        }, 800);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <TrendingUp size={32} color="#2563eb" />
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>Historical Return Calculator</h1>
                </div>

                {/* Input Section */}
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>Stock Ticker</label>
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            placeholder="AIQ"
                            style={{
                                width: '200px',
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>Time Period (Years)</label>
                        <select
                            value={years}
                            onChange={(e) => setYears(Number(e.target.value))}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        >
                            <option value={1}>1 Year</option>
                            <option value={3}>3 Years</option>
                            <option value={5}>5 Years</option>
                            <option value={10}>10 Years</option>
                            <option value={20}>20 Years</option>
                        </select>
                    </div>

                    <button
                        onClick={handleCalculate}
                        disabled={loading}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: loading ? '#9ca3af' : '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginBottom: '16px'
                        }}
                    >
                        {loading ? 'Calculating...' : 'Calculate Returns'}
                    </button>

                    {error && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            color: '#991b1b',
                            marginBottom: '16px'
                        }}>
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div style={{
                        display: 'flex',
                        alignItems: 'start',
                        gap: '8px',
                        padding: '12px',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: '4px',
                        fontSize: '13px'
                    }}>
                        <AlertCircle size={20} color="#92400e" style={{ flexShrink: 0 }} />
                        <div>
                            <strong>Disclaimer:</strong> This calculator uses simulated historical data for demonstration purposes.
                            Past performance does not guarantee future results. Always conduct thorough research and consult
                            with financial advisors before making investment decisions.
                        </div>
                    </div>
                </div>

                {/* Results */}
                {results && (
                    <>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                            {results.ticker} - {years} Year Analysis
                        </h2>

                        {/* Metrics Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Average Annual Return</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{results.metrics.avgReturn}%</div>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>CAGR</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{results.metrics.cagr}%</div>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Return</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{results.metrics.totalReturn}%</div>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Volatility (Std Dev)</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{results.metrics.stdDev}%</div>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Best Year</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>+{results.metrics.bestYear}%</div>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Worst Year</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>{results.metrics.worstYear}%</div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Growth of $100 Investment</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={results.monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        interval={Math.floor(results.monthlyData.length / 8)}
                                    />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#2563eb"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Annual Returns */}
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Annual Returns</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                                {results.annualReturns.map((yr) => (
                                    <div
                                        key={yr.year}
                                        style={{
                                            padding: '12px',
                                            backgroundColor: yr.return >= 0 ? '#f0fdf4' : '#fef2f2',
                                            borderRadius: '8px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>{yr.year}</div>
                                        <div style={{
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            color: yr.return >= 0 ? '#16a34a' : '#dc2626'
                                        }}>
                                            {yr.return >= 0 ? '+' : ''}{yr.return.toFixed(2)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}