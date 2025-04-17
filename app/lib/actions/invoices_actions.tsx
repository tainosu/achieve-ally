'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// 型チェック
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// 新規作成
export async function createInvoice(formData: FormData) {
  // TODO：node_modules
  const { customerId, amount, status } =  CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100; //セントに変換
  // 日本時間を取得
  const now = new Date();
  const date = new Date(now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));

  try {
    const invoice = await prisma.invoices.create({
      data: {
        customerId: String(customerId),
        amount: amountInCents,
        status: String(status),
        date: date,
      },
    });

    console.log('+++created invoice+++', invoice);
  } catch (error: any) {
    console.error('---Error creating invoice---', error);
    throw new Error('Failed to create invoice');
  }

  revalidatePath('/home/invoices');
  redirect('/home/invoices');
}

// 更新
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100; //セントに変換
  // 日本時間を取得
  const now = new Date();
  const date = new Date(now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));

  try {
    const invoice = await prisma.invoices.update({
      where: {
        id: id,
      },
      data: {
        customerId: String(customerId),
        amount: amountInCents,
        status: String(status),
        date: date,
      },
    });

    console.log('+++updated invoice+++', invoice);
  } catch (error) {
    console.error('---Error updating invoice---', error);
    throw new Error('Failed to update invoice');
  }

  revalidatePath('/home/invoices');
  redirect('/home/invoices');
}

// 削除
export async function deleteInvoice(id: string) {
  try {
    await prisma.invoices.delete({
      where: {
        id: id,
      },
    });
    console.log('+++deleted invoice+++');
  } catch (error) {
    console.error('---Error deleting invoice---', error);
    throw new Error('Failed to delete invoice');
  }

  revalidatePath('/home/invoices');
  redirect('/home/invoices');
}