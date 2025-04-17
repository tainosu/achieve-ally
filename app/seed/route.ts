import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';
import postgres from 'postgres';

const prisma = new PrismaClient();

async function seedUsers() {
  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const seedUser = await prisma.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: hashedPassword,
        },
      });
      return seedUser;
    }),
  );

  return insertedUsers;
}

async function seedInvoices() {
  // const deleteInvoices = await prisma.invoices.deleteMany({});
  // const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
  // await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  // await sql`
  //   CREATE TABLE IF NOT EXISTS invoices (
  //     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  //     customer_id UUID NOT NULL,
  //     amount INT NOT NULL,
  //     status VARCHAR(255) NOT NULL,
  //     date DATE NOT NULL
  //   );
  // `;
  const insertedInvoices = await Promise.all(
    invoices.map(async (invoice) => {
      const seedInvoices = await prisma.invoices.create({
        data: {
          customerId: invoice.customer_id,
          amount: invoice.amount,
          status: invoice.status,
          date: new Date(invoice.date),
        },
      });
      return seedInvoices;
    }),
  );

  // return insertedInvoices;
}

async function seedCustomers() {
  const insertedCustomers = await Promise.all(
    customers.map(async (customer) => {
      const seedCustomers = await prisma.customers.create({
        data: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          image_url: customer.image_url,
        },
      });
      return seedCustomers;
    }),
  );

  return insertedCustomers;
}

async function seedRevenue() {
  const insertedRevenue = await Promise.all(
    revenue.map(async (rev) => {
      const seedRevenue = await prisma.revenue.create({
        data: {
          month: rev.month,
          revenue: rev.revenue,
        },
      });
      return seedRevenue;
    }),
  );

  return insertedRevenue;
}

export async function GET() {
  try {
    const result = await prisma.$transaction(async () => {
      // await seedUsers();
      // await seedCustomers();
      await seedInvoices();
      // await seedRevenue();
  });

    return new Response(JSON.stringify({ message: 'Database seeded successfully' }), {
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}