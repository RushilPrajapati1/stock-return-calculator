import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';

export default function StockReturnCalculator() {
    const [activeTab, setActiveTab] = useState('historical');
    const [ticker, setTicker] = useState('');
    const [years, setYears] = useState(10);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Monte Carlo specific state
    const [mcSimulations, setMcSimulations] = useState(1000);
    const [mcYears, setMcYears] = useState(10);
    const [mcResults, setMcResults] = useState(null);

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

    const runMonteCarloSimulation = (tickerSymbol, numSimulations, numYears) => {
        // Use realistic market parameters (based on historical S&P 500)
        const avgAnnualReturn = 0.10; // 10% average return
        const annualVolatility = 0.18; // 18% volatility
        const initialInvestment = 10000;

        const simulations = [];
        const finalValues = [];

        // Run simulations
        for (let sim = 0; sim < numSimulations; sim++) {
            let value = initialInvestment;
            const path = [{ year: 0, value: value }];

            for (let year = 1; year <= numYears; year++) {
                // Generate random return using normal distribution approximation
                const u1 = Math.random();
                const u2 = Math.random();
                const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

                const yearReturn = avgAnnualReturn + (annualVolatility * z);
                value *= (1 + yearReturn);

                path.push({ year, value: parseFloat(value.toFixed(2)) });
            }

            simulations.push(path);
            finalValues.push(value);
        }

        // Calculate percentiles
        const sortedFinalValues = [...finalValues].sort((a, b) => a - b);
        const getPercentile = (p) => sortedFinalValues[Math.floor(numSimulations * p)];

        const percentiles = {
            p10: getPercentile(0.10),
            p25: getPercentile(0.25),
            p50: getPercentile(0.50),
            p75: getPercentile(0.75),
            p90: getPercentile(0.90)
        };

        // Create distribution data for histogram
        const numBins = 30;
        const min = Math.min(...finalValues);
        const max = Math.max(...finalValues);
        const binSize = (max - min) / numBins;

        const distribution = [];
        for (let i = 0; i < numBins; i++) {
            const binStart = min + (i * binSize);
            const binEnd = binStart + binSize;
            const count = finalValues.filter(v => v >= binStart && v < binEnd).length;
            distribution.push({
                range: `$${(binStart / 1000).toFixed(0)}k`,
                count: count,
                percentage: ((count / numSimulations) * 100).toFixed(1)
            });
        }

        // Select representative paths for visualization
        const selectedPaths = [
            simulations[sortedFinalValues.indexOf(percentiles.p10)],
            simulations[sortedFinalValues.indexOf(percentiles.p25)],
            simulations[sortedFinalValues.indexOf(percentiles.p50)],
            simulations[sortedFinalValues.indexOf(percentiles.p75)],
            simulations[sortedFinalValues.indexOf(percentiles.p90)]
        ];

        // Combine paths for chart
        const chartData = [];
        for (let year = 0; year <= numYears; year++) {
            const dataPoint = { year };
            selectedPaths.forEach((path, idx) => {
                const percentileNames = ['p10', 'p25', 'p50', 'p75', 'p90'];
                dataPoint[percentileNames[idx]] = path[year].value;
            });
            chartData.push(dataPoint);
        }

        return {
            ticker: tickerSymbol.toUpperCase(),
            initialInvestment,
            finalValues,
            percentiles,
            distribution,
            chartData,
            avgFinalValue: finalValues.reduce((a, b) => a + b, 0) / numSimulations,
            probProfit: (finalValues.filter(v => v > initialInvestment).length / numSimulations) * 100
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

    const handleMonteCarloSimulation = () => {
        if (!ticker.trim()) {
            setError('Please enter a stock ticker');
            return;
        }

        setLoading(true);
        setError('');

        setTimeout(() => {
            const data = runMonteCarloSimulation(ticker, mcSimulations, mcYears);
            setMcResults(data);
            setLoading(false);
        }, 1000);
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
                    </>
                )}

                {/* Monte Carlo Tab */}
                {activeTab === 'montecarlo' && (
                    <>
                        {/* Input Section */}
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>Stock Ticker</label>
                                <input
                                    type="text"
                                    value={ticker}
                                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                    placeholder="SPY"
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
                                <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>Number of Simulations</label>
                                <select
                                    value={mcSimulations}
                                    onChange={(e) => setMcSimulations(Number(e.target.value))}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value={100}>100</option>
                                    <option value={500}>500</option>
                                    <option value={1000}>1,000</option>
                                    <option value={5000}>5,000</option>
                                    <option value={10000}>10,000</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>Investment Horizon (Years)</label>
                                <select
                                    value={mcYears}
                                    onChange={(e) => setMcYears(Number(e.target.value))}
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value={5}>5 Years</option>
                                    <option value={10}>10 Years</option>
                                    <option value={15}>15 Years</option>
                                    <option value={20}>20 Years</option>
                                    <option value={30}>30 Years</option>
                                </select>
                            </div>

                            <button
                                onClick={handleMonteCarloSimulation}
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
                                {loading ? 'Running Simulation...' : 'Run Simulation'}
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
                                backgroundColor: '#dbeafe',
                                border: '1px solid #93c5fd',
                                borderRadius: '4px',
                                fontSize: '13px'
                            }}>
                                <AlertCircle size={20} color="#1e40af" style={{ flexShrink: 0 }} />
                                <div>
                                    <strong>About Monte Carlo:</strong> This simulation runs thousands of possible scenarios based on historical market returns (10% avg, 18% volatility) to show the range of potential outcomes for your investment.
                                </div>
                            </div>
                        </div>

                        {/* Monte Carlo Results */}
                        {mcResults && (
                            <>
                                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                                    {mcResults.ticker} - {mcYears} Year Projection ({mcSimulations.toLocaleString()} Simulations)
                                </h2>

                                {/* Key Metrics */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                                    <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Initial Investment</div>
                                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>${mcResults.initialInvestment.toLocaleString()}</div>
                                    </div>
                                    <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Average Final Value</div>
                                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>${mcResults.avgFinalValue.toFixed(0).toLocaleString()}</div>
                                    </div>
                                    <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Probability of Profit</div>
                                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>{mcResults.probProfit.toFixed(1)}%</div>
                                    </div>
                                </div>

                                {/* Percentiles */}
                                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Outcome Percentiles</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                                        <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>10th Percentile</div>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>${mcResults.percentiles.p10.toFixed(0).toLocaleString()}</div>
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Worst 10%</div>
                                        </div>
                                        <div style={{ padding: '12px', backgroundColor: '#fef9c3', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>25th Percentile</div>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>${mcResults.percentiles.p25.toFixed(0).toLocaleString()}</div>
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Below average</div>
                                        </div>
                                        <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>50th Percentile</div>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>${mcResults.percentiles.p50.toFixed(0).toLocaleString()}</div>
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Median</div>
                                        </div>
                                        <div style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>75th Percentile</div>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>${mcResults.percentiles.p75.toFixed(0).toLocaleString()}</div>
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Above average</div>
                                        </div>
                                        <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>90th Percentile</div>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>${mcResults.percentiles.p90.toFixed(0).toLocaleString()}</div>
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Best 10%</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Simulation Paths Chart */}
                                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Projected Growth Paths</h3>
                                    <ResponsiveContainer width="100%" height={350}>
                                        <LineChart data={mcResults.chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
                                            <YAxis label={{ value: 'Portfolio Value ($)', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip formatter={(value) => `${value.toLocaleString()}`} />
                                            <Legend />
                                            <Line type="monotone" dataKey="p10" stroke="#dc2626" strokeWidth={2} dot={false} name="10th Percentile (Worst)" />
                                            <Line type="monotone" dataKey="p25" stroke="#f59e0b" strokeWidth={2} dot={false} name="25th Percentile" />
                                            <Line type="monotone" dataKey="p50" stroke="#2563eb" strokeWidth={3} dot={false} name="50th Percentile (Median)" />
                                            <Line type="monotone" dataKey="p75" stroke="#10b981" strokeWidth={2} dot={false} name="75th Percentile" />
                                            <Line type="monotone" dataKey="p90" stroke="#059669" strokeWidth={2} dot={false} name="90th Percentile (Best)" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px', textAlign: 'center' }}>
                                        Each line represents a different outcome probability. The median (blue) is the most likely outcome.
                                    </div>
                                </div>

                                {/* Distribution Histogram */}
                                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Final Value Distribution</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={mcResults.distribution}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="range" tick={{ fontSize: 10 }} interval={2} />
                                            <YAxis label={{ value: 'Number of Simulations', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#2563eb" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px', textAlign: 'center' }}>
                                        Distribution shows how often each final value occurred across all {mcSimulations.toLocaleString()} simulations
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
