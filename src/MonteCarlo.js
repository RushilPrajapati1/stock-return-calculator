import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { AlertCircle } from 'lucide-react';

export default function MonteCarlo({ ticker, setTicker }) {
    const [mcSimulations, setMcSimulations] = useState(1000);
    const [mcYears, setMcYears] = useState(10);
    const [mcResults, setMcResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const runMonteCarloSimulation = (tickerSymbol, numSimulations, numYears) => {
        // realistic market params
        const avgAnnualReturn = 0.10; // 10%
        const annualVolatility = 0.18; // 18%
        const initialInvestment = 10000;

        const simulations = [];
        const finalValues = [];

        for (let sim = 0; sim < numSimulations; sim++) {
            let value = initialInvestment;
            const path = [{ year: 0, value }];

            for (let year = 1; year <= numYears; year++) {
                // Box-Muller to get standard normal
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

        const sortedFinalValues = [...finalValues].sort((a, b) => a - b);
        const getPercentile = (p) => sortedFinalValues[Math.floor(numSimulations * p)];

        const percentiles = {
            p10: getPercentile(0.10),
            p25: getPercentile(0.25),
            p50: getPercentile(0.50),
            p75: getPercentile(0.75),
            p90: getPercentile(0.90)
        };

        const numBins = 30;
        const min = Math.min(...finalValues);
        const max = Math.max(...finalValues);
        const binSize = (max - min) / numBins || 1;

        const distribution = [];
        for (let i = 0; i < numBins; i++) {
            const binStart = min + (i * binSize);
            const binEnd = binStart + binSize;
            const count = finalValues.filter(v => v >= binStart && v < binEnd).length;
            distribution.push({
                range: `$${(binStart / 1000).toFixed(0)}k`,
                count,
                percentage: ((count / numSimulations) * 100).toFixed(1)
            });
        }

        // pick representative paths (find index of percentile values in sorted array, then map to simulations)
        const indices = [percentiles.p10, percentiles.p25, percentiles.p50, percentiles.p75, percentiles.p90].map(v => sortedFinalValues.indexOf(v));
        const selectedPaths = indices.map(i => (i >= 0 && i < simulations.length ? simulations[i] : null));

        const chartData = [];
        for (let year = 0; year <= numYears; year++) {
            const point = { year };
            ['p10', 'p25', 'p50', 'p75', 'p90'].forEach((name, idx) => {
                const path = selectedPaths[idx];
                point[name] = path ? path[year].value : null;
            });
            chartData.push(point);
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

    const handleRun = () => {
        if (!ticker || !ticker.trim()) {
            setError('Please enter a stock ticker');
            return;
        }
        setLoading(true);
        setError('');

        setTimeout(() => {
            const data = runMonteCarloSimulation(ticker, mcSimulations, mcYears);
            setMcResults(data);
            setLoading(false);
        }, 800);
    };

    return (
        <>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>Stock Ticker</label>
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        placeholder="SPY"
                        style={{ width: '200px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>Number of Simulations</label>
                    <select value={mcSimulations} onChange={(e) => setMcSimulations(Number(e.target.value))} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                        <option value={100}>100</option>
                        <option value={500}>500</option>
                        <option value={1000}>1,000</option>
                        <option value={5000}>5,000</option>
                        <option value={10000}>10,000</option>
                    </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>Investment Horizon (Years)</label>
                    <select value={mcYears} onChange={(e) => setMcYears(Number(e.target.value))} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                        <option value={5}>5 Years</option>
                        <option value={10}>10 Years</option>
                        <option value={15}>15 Years</option>
                        <option value={20}>20 Years</option>
                        <option value={30}>30 Years</option>
                    </select>
                </div>

                <button onClick={handleRun} disabled={loading} style={{ padding: '10px 24px', backgroundColor: loading ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: '4px' }}>
                    {loading ? 'Running Simulation...' : 'Run Simulation'}
                </button>

                {error && (
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '4px', color: '#991b1b' }}>
                        <AlertCircle size={16} /> <span style={{ marginLeft: 8 }}>{error}</span>
                    </div>
                )}
            </div>

            {mcResults && (
                <>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                        {mcResults.ticker} - {mcYears} Year Projection ({mcSimulations.toLocaleString()} Simulations)
                    </h2>

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
    );
}

