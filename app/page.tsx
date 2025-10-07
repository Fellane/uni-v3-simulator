'use client';

import { useState } from 'react';

type SimResult = {
  poolAddress: string;
  token0: string;
  token1: string;
  feeBps: number;
  swapsCount: number;
  fromTs: number;
  toTs: number;
  feesUSD: number;
  aprFees: number;   // fraction, e.g. 0.27 = 27%
  ilPct: number;     // fraction
  token0FinalShare: number; // 0..1
  token1FinalShare: number; // 0..1
};

export default function Page() {
  const [pool, setPool] = useState('0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8'); // USDC/ETH 0.3%
  const [tickLower, setTickLower] = useState(-276330); // пример
  const [tickUpper, setTickUpper] = useState(-230280); // пример
  const [notional, setNotional] = useState(10000);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<SimResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setRes(null);
    try {
      const r = await fetch('/api/simulate', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ pool, tickLower, tickUpper, notional, days })
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json() as SimResult;
      setRes(data);
    } catch (e:any) {
      setError(e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1 style={{marginBottom: 6}}>Uniswap v3 LP Simulator (MVP)</h1>
      <p className="small">Укажи адрес пула, диапазон в тиках, капитал и период. Мы приблизим комиссии и APR, посчитаем IL и финальный сплит.</p>

      <div className="grid" style={{marginTop: 16}}>
        <div className="card grid">
          <label className="label">Адрес пула (Uniswap v3)</label>
          <input className="input" value={pool} onChange={e=>setPool(e.target.value.trim())} />

          <div className="grid-2">
            <div>
              <label className="label">tickLower</label>
              <input type="number" className="input" value={tickLower} onChange={e=>setTickLower(parseInt(e.target.value))}/>
            </div>
            <div>
              <label className="label">tickUpper</label>
              <input type="number" className="input" value={tickUpper} onChange={e=>setTickUpper(parseInt(e.target.value))}/>
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label className="label">Капитал, USD</label>
              <input type="number" className="input" value={notional} onChange={e=>setNotional(parseFloat(e.target.value))}/>
            </div>
            <div>
              <label className="label">Период, дней</label>
              <input type="number" className="input" value={days} onChange={e=>setDays(parseInt(e.target.value))}/>
            </div>
          </div>

          <button className="btn" onClick={run} disabled={loading}>{loading ? 'Считаем…' : 'Симулировать'}</button>
          {!!error && <div style={{color:'#ff6666'}}>Ошибка: {error}</div>}
        </div>

        {res && (
          <div className="grid">
            <div className="kpi">
              <div className="card">
                <div className="small">Комиссии, $</div>
                <div style={{fontSize: 24, fontWeight: 700}}>{res.feesUSD.toFixed(2)}</div>
              </div>
              <div className="card">
                <div className="small">APR (fees)</div>
                <div style={{fontSize: 24, fontWeight: 700}}>{(res.aprFees*100).toFixed(2)}%</div>
              </div>
              <div className="card">
                <div className="small">IL (оценка)</div>
                <div style={{fontSize: 24, fontWeight: 700}}>{(res.ilPct*100).toFixed(2)}%</div>
              </div>
              <div className="card">
                <div className="small">Token split</div>
                <div style={{fontSize: 24, fontWeight: 700}}>
                  {(res.token0FinalShare*100).toFixed(0)}% / {(res.token1FinalShare*100).toFixed(0)}%
                </div>
                <div className="small">{res.token0} / {res.token1}</div>
              </div>
            </div>

            <div className="card">
              <div className="small">Пул</div>
              <div style={{fontWeight:700}}>{res.poolAddress}</div>
              <div className="small">Fee tier: {(res.feeBps/100).toFixed(2)}%</div>
              <div className="small">Свопов за период: {res.swapsCount}</div>
              <div className="small">Период: {new Date(res.fromTs*1000).toLocaleString()} — {new Date(res.toTs*1000).toLocaleString()}</div>
            </div>

            <div className="card small">
              Примечание: это MVP-оценка. Комиссии масштабируются от TVL пула, факт участия в диапазоне — по доле свопов внутри диапазона.
              Для продакшена стоит перейти на срезы ликвидности по тикам и точные формулы v3.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
