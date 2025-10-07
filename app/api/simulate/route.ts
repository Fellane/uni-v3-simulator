import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchPoolAndSwaps } from '../../../lib/graph';
import { roughAprAndIl } from '../../../lib/sim';

const Body = z.object({
  pool: z.string().min(1),
  tickLower: z.number().int(),
  tickUpper: z.number().int(),
  notional: z.number().positive(),
  days: z.number().int().min(1).max(3650)
});

export async function POST(req: NextRequest) {
  try {
    const body = Body.parse(await req.json());
    const toTs = Math.floor(Date.now()/1000);
    const fromTs = toTs - body.days*24*3600;

    const { pool, swaps } = await fetchPoolAndSwaps(body.pool, fromTs);

    if (!pool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
    }

    const result = roughAprAndIl({
      pool,
      swaps,
      tickLower: body.tickLower,
      tickUpper: body.tickUpper,
      notionalUSD: body.notional,
      fromTs,
      toTs
    });

    return NextResponse.json(result);
  } catch (e:any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 400 });
  }
}
