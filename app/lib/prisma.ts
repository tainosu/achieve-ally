// https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-management

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export default prisma;