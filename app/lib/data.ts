import postgres from 'postgres';
import prisma from '@/app/lib/prisma';
import {
  CustomersTableType,
  InvoiceForm,
  LatestInvoice,
  LatestInvoiceRaw,
} from './definitions';
import { formatCurrency } from './utils';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export async function fetchRevenue() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await prisma.revenue.findMany({
      orderBy: { month: 'asc' },
    });

    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await prisma.invoices.findMany({
      select: {
        id: true,
        amount: true,
        customers: {
          select: {
            name: true,
            email: true,
            image_url: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 5,
    });

    const latestInvoices: LatestInvoice[] = data.map((invoice: LatestInvoiceRaw) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const invoiceCountPromise = await prisma.invoices.count();
    const customerCountPromise = await prisma.customers.count();
    const invoiceStatusPromise = await Promise.all([
      prisma.invoices.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: 'paid',
        },
      }),
      prisma.invoices.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: 'pending',
        },
      }),
    ]);

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0] ?? '0');
    const numberOfCustomers = Number(data[1] ?? '0');
    const totalPaidInvoices = formatCurrency(data[2][0]._sum.amount || 0);
    const totalPendingInvoices = formatCurrency(data[2][1]._sum.amount || 0);

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await prisma.invoices.findMany({
      select: {
        id: true,
        amount: true,
        date: true,
        status: true,
        customers: {
          select: {
            name: true,
            email: true,
            image_url: true,
          },
        },
      },
      where: {
        OR: [
          {
            customers: {
              name: {
                contains: query,
                mode: 'insensitive',  //大文字小文字を区別しない
              },
            },
          },
          {
            customers: {
              email: {
                contains: query,
              },
            },
          },
          // {
          //   amount: {
          //     contains: query,
          //   },
          // },
          // {
          //   date: {
          //     equals: new Date(query),
          //   },
          // },
          {
            status: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      orderBy: { date: 'desc' },
      take: ITEMS_PER_PAGE,
      skip: offset,
    });

    // const formattedInvoices = invoices.map((invoice) => ({
    //   ...invoice,
    //   date: invoice.date
    // }));

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const data = await prisma.invoices.count({
      where: {
        OR: [
          {
            customers: {
              name: {
                contains: query,
                mode: 'insensitive',  //大文字小文字を区別しない
              },
            },
          },
          {
            customers: {
              email: {
                contains: query,
              },
            },
          },
          // {
          //   amount: {
          //     contains: query,
          //   },
          // },
          // {
          //   date: {
          //     equals: new Date(query),
          //   },
          // },
          {
            status: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      }
    });

    const totalPages = Math.ceil(Number(data) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await prisma.invoices.findMany({
      select: {
        id: true,
        customerId: true,
        amount: true,
        status: true,
      },
      where: {
        id: id,
      },
    });

    const invoice: InvoiceForm[] = data.map((invoice: InvoiceForm) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));
    console.log('invoice', invoice);
    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const customers = await prisma.customers.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const data = await sql<CustomersTableType[]>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
