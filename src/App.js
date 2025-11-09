import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';
import MonteCarlo from './MonteCarlo';

export default function StockReturnCalculator() {
    const [activeTab, setActiveTab] = useState('historical');
    const [ticker, setTicker] = useState('');
    const [years, setYears] = useState(10);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Portfolio Management state
    const [portfolio, setPortfolio] = useState([]);
    const [newStock, setNewStock] = useState({ ticker: '', quantity: '', price: '' });

    // New state for live market price
    const [actualPrice, setActualPrice] = useState(null);
    const [priceLoading, setPriceLoading] = useState(false);
    const [priceError, setPriceError] = useState('');

    const fetchMarketPrice = async () => {
        if (!ticker || !ticker.trim()) {
            setPriceError('Please enter a stock ticker');
            return;
        }
        setPriceLoading(true);
        setPriceError('');
        setActualPrice(null);

        try {
            const resp = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=d46lcd9r01qgc9etd3k0d46lcd9r01qgc9etd3kg`
            );

            if (!resp.ok) throw new Error(`Network error: ${resp.status}`);
            const data = await resp.json();

            // Finnhub returns fields like c (current), d (change), dp (percent)
            setActualPrice({
                price: data.c ?? null,
                change: data.d ?? null,
                changePct: data.dp ?? null,
                high: data.h ?? null,
                low: data.l ?? null,
                open: data.o ?? null,
                prevClose: data.pc ?? null,
                time: new Date().toLocaleString(),
                currency: 'USD'
            });
        } catch (e) {
            setPriceError('Could not fetch live data. ' + e.message);
            setActualPrice(null);
        } finally {
            setPriceLoading(false);
        }
    };

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
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>Stock Return Calculator</h1>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
                    <button
                        onClick={() => setActiveTab('historical')}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: activeTab === 'historical' ? '#2563eb' : 'transparent',
                            color: activeTab === 'historical' ? 'white' : '#6b7280',
                            border: 'none',
                            borderRadius: '8px 8px 0 0',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Historical Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('montecarlo')}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: activeTab === 'montecarlo' ? '#2563eb' : 'transparent',
                            color: activeTab === 'montecarlo' ? 'white' : '#6b7280',
                            border: 'none',
                            borderRadius: '8px 8px 0 0',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Monte Carlo Simulation
                    </button>
                    <button
                        onClick={() => setActiveTab('portfolio')}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: activeTab === 'portfolio' ? '#2563eb' : 'transparent',
                            color: activeTab === 'portfolio' ? 'white' : '#6b7280',
                            border: 'none',
                            borderRadius: '8px 8px 0 0',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Portfolio Management
                    </button>
                </div>

                {/* Historical Analysis Tab */}
                {activeTab === 'historical' && (
                    <>
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

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
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
                                        cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {loading ? 'Calculating...' : 'Calculate Returns'}
                                </button>

                                <button
                                    onClick={fetchMarketPrice}
                                    disabled={priceLoading || !ticker.trim()}
                                    style={{
                                        padding: '10px 18px',
                                        backgroundColor: priceLoading ? '#9ca3af' : '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: priceLoading ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {priceLoading ? 'Fetching...' : 'Get Live Price'}
                                </button>
                            </div>

                            {priceError && (
                                <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#991b1b' }}>
                                    <AlertCircle size={16} /> <span style={{ marginLeft: 8 }}>{priceError}</span>
                                </div>
                            )}

                            {actualPrice && (
                                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>Current Price ({actualPrice.currency || 'USD'})</div>
                                            <div style={{ fontSize: '20px', fontWeight: '700' }}>${actualPrice.price?.toLocaleString()}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{actualPrice.time}</div>
                                            <div style={{ fontSize: '14px', fontWeight: '700', color: actualPrice.change >= 0 ? '#16a34a' : '#dc2626' }}>
                                                {actualPrice.change >= 0 ? '+' : ''}{actualPrice.change?.toFixed(2)} ({actualPrice.changePct?.toFixed(2)}%)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                    </>
                )}

                {/* Monte Carlo Tab */}
                {activeTab === 'montecarlo' && (
                    <MonteCarlo ticker={ticker} setTicker={setTicker} />
                )}

                {/* Portfolio Management Tab */}
                {activeTab === 'portfolio' && (
                    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        {/* Add New Stock Form */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Add New Position</h3>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <input
                                    type="text"
                                    placeholder="Ticker"
                                    value={newStock.ticker}
                                    onChange={(e) => setNewStock({ ...newStock, ticker: e.target.value.toUpperCase() })}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        width: '120px'
                                    }}
                                />
                                <input
                                    type="number"
                                    placeholder="Quantity"
                                    value={newStock.quantity}
                                    onChange={(e) => setNewStock({ ...newStock, quantity: e.target.value })}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        width: '120px'
                                    }}
                                />
                                <input
                                    type="number"
                                    placeholder="Price per share"
                                    value={newStock.price}
                                    onChange={(e) => setNewStock({ ...newStock, price: e.target.value })}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        width: '120px'
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        if (newStock.ticker && newStock.quantity && newStock.price) {
                                            setPortfolio([...portfolio, {
                                                ...newStock,
                                                value: newStock.quantity * newStock.price
                                            }]);
                                            setNewStock({ ticker: '', quantity: '', price: '' });
                                        }
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Add Position
                                </button>
                            </div>
                        </div>

                        {/* Portfolio Summary */}
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Portfolio Summary</h3>
                            <div style={{
                                padding: '16px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                marginBottom: '16px'
                            }}>
                                <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Portfolio Value</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                                    ${portfolio.reduce((sum, stock) => sum + (stock.quantity * stock.price), 0).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Holdings Table */}
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Current Holdings</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8fafc' }}>
                                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Ticker</th>
                                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Quantity</th>
                                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Price</th>
                                            <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Total Value</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {portfolio.map((stock, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                <td style={{ padding: '12px' }}>{stock.ticker}</td>
                                                <td style={{ padding: '12px', textAlign: 'right' }}>{Number(stock.quantity).toLocaleString()}</td>
                                                <td style={{ padding: '12px', textAlign: 'right' }}>${Number(stock.price).toFixed(2)}</td>
                                                <td style={{ padding: '12px', textAlign: 'right' }}>${(stock.quantity * stock.price).toLocaleString()}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => setPortfolio(portfolio.filter((_, i) => i !== index))}
                                                        style={{
                                                            padding: '4px 8px',
                                                            backgroundColor: '#ef4444',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
