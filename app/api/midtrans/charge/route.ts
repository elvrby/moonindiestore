import { NextResponse } from 'next/server';
import MidtransClient from 'midtrans-client';

// Fungsi untuk menangani request POST
export async function POST(req: Request) {
  try {
    const { totalPrice, orderId } = await req.json();

    const snap = new MidtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY || '',
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '',
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: totalPrice,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({ token: transaction.token });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Midtrans error:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Gagal membuat transaksi' },
      { status: 500 }
    );
  }
}
