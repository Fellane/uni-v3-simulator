import fetch from 'cross-fetch';

const SUBGRAPH_URL = process.env.SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

type PoolInfo = {
  id: string;
  feeTier: string; // e.g. "3000"
  token0: { symbol: string };
  token1: { symbol: string };
  totalValueLockedUSD: string; // as string
};

type Swap = {
  amountUSD: string;
  timestamp: string;
  tick: string | null;
};

export async function fetchPoolAndSwaps(poolId: string, fromTs: number): Promise<{
  pool: PoolInfo | null;
  swaps: Swap[];
}> {
  const query = `
    query PoolAndSwaps($poolId: ID!, $fromTs: Int!) {
      pool(id: $poolId) {
        id
        feeTier
        token0 { symbol }
        token1 { symbol }
        totalValueLockedUSD
      }
      swaps(
        first: 1000
        orderBy: timestamp
        orderDirection: asc
        where: { pool: $poolId, timestamp_gte: $fromTs }
      ) {
        amountUSD
        timestamp
        tick
      }
    }
  `;

  const r = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables: { poolId: poolId.toLowerCase(), fromTs } })
  });

  if (!r.ok) throw new Error(`Subgraph HTTP ${r.status}`);
  const data = await r.json();
  if (data.errors) throw new Error(`Subgraph: ${JSON.stringify(data.errors)}`);

  const pool: PoolInfo | null = data?.data?.pool ?? null;
  const swaps: Swap[] = (data?.data?.swaps ?? []) as Swap[];
  return { pool, swaps };
}
