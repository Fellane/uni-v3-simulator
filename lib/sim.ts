type PoolInfo = {
  id: string;
  feeTier: string; // "500" | "3000" | "10000"
  token0: { symbol: string };
  token1: { symbol: string };
  totalValueLockedUSD: string;
};
type Swap = { amountUSD: string; timestamp: string; tick: string | null };

function feeTierToRate(feeTier: string): number {
  const n = Number(feeTier);
  if (!Number.isFinite(n)) return 0.003;
  return n / 1_000_000;
}

function ilV2Like(r: number): number {
  if (r <= 0) return 0;
  const v = (2 * Math.sqrt(r)) / (1 + r) - 1;
  return v;
}

export function roughAprAndIl(args: {
  pool: PoolInfo;
  swaps: Swap[];
  tickLower: number;
  tickUpper: number;
  notionalUSD: number;
  fromTs: number;
  toTs: number;
}) {
  const { pool, swaps, tickLower, tickUpper, notionalUSD, fromTs, toTs } = args;

  const feeRate = feeTierToRate(pool.feeTier);
  const tvlUSD = Math.max(1, Number(pool.totalValueLockedUSD) || 1);

  let volumeUSD = 0;
  let volumeUSDInRange = 0;
  let swapsCount = 0;
  let firstTick: number | null = null;
  let lastTick: number | null = null;

  for (const s of swaps) {
    const amt = Number(s.amountUSD) || 0;
    const tick = s.tick === null ? null : Number(s.tick);
    volumeUSD += Math.max(0, amt);
    if (tick !== null) {
      if (firstTick === null) firstTick = tick;
      lastTick = tick;
      if (tick >= tickLower && tick <= tickUpper) {
        volumeUSDInRange += Math.max(0, amt);
      }
    }
    swapsCount++;
  }

  if (swapsCount === 0 || volumeUSD === 0) {
    return {
      poolAddress: pool.id,
      token0: pool.token0.symbol,
      token1: pool.token1.symbol,
      feeBps: Math.round(feeRate * 10000),
      swapsCount,
      fromTs,
      toTs,
      feesUSD: 0,
      aprFees: 0,
      ilPct: 0,
      token0FinalShare: 0.5,
      token1FinalShare: 0.5
    };
  }

  const totalFeesUSD = volumeUSD * feeRate;

  const shareNotional = Math.min(1, Math.max(0, notionalUSD / tvlUSD));

  const inRangeRatio = Math.min(1, Math.max(0, volumeUSDInRange / volumeUSD));

  const feesUSD = totalFeesUSD * shareNotional * inRangeRatio;

  const days = Math.max(1, Math.round((toTs - fromTs) / 86400));
  const aprFees = (feesUSD / notionalUSD) * (365 / days);

  let ilPct = 0;
  if (firstTick !== null && lastTick !== null) {
    const p0 = Math.pow(1.0001, firstTick);
    const p1 = Math.pow(1.0001, lastTick);
    const r = p1 / p0;
    ilPct = ilV2Like(r);
  }

  let token0FinalShare = 0.5;
  let token1FinalShare = 0.5;
  if (lastTick !== null) {
    if (lastTick <= tickLower) {
      token0FinalShare = 1;
      token1FinalShare = 0;
    } else if (lastTick >= tickUpper) {
      token0FinalShare = 0;
      token1FinalShare = 1;
    } else {
      const t = (lastTick - tickLower) / (tickUpper - tickLower);
      token0FinalShare = 1 - t;
      token1FinalShare = t;
    }
  }

  return {
    poolAddress: pool.id,
    token0: pool.token0.symbol,
    token1: pool.token1.symbol,
    feeBps: Math.round(feeRate * 10000),
    swapsCount,
    fromTs,
    toTs,
    feesUSD,
    aprFees,
    ilPct,
    token0FinalShare,
    token1FinalShare
  };
}
