import { NextResponse } from 'next/server';
import { Order } from '@/types';

// In-memory store for POC (replace with DB in production)
const orders: Order[] = [];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const order: Order = {
      ...body,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    };
    orders.push(order);
    console.log(`[Order] ${order.id} confirmed — ${order.items.length} item(s) — ₹${order.total}`);
    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET() {
  // Simple admin endpoint — list all orders (without design images to keep it readable)
  const summary = orders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    status: o.status,
    total: o.total,
    itemCount: o.items.length,
    customer: { name: o.customer.fullName, email: o.customer.email },
  }));
  return NextResponse.json(summary);
}
