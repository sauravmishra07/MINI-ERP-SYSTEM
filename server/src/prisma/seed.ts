/**
 * Prisma seed — creates 3 test users + realistic dummy purchase requests
 *
 * Test credentials
 * ─────────────────────────────────────────────────────
 * EMPLOYEE  employee@k95foods.com  / password123
 * MANAGER   manager@k95foods.com   / password123
 * ADMIN     admin@k95foods.com     / password123
 * ─────────────────────────────────────────────────────
 *
 * Run:  npx ts-node src/prisma/seed.ts
 */

import bcrypt from 'bcryptjs'
import { PrismaClient, Role, Priority, Status, AuditAction } from '@prisma/client'

const prisma = new PrismaClient()

// ─── helpers ────────────────────────────────────────────────────────────────

const hash = (pw: string) => bcrypt.hash(pw, 10)

const daysFromNow = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding database…')

  // ── 1. Users ──────────────────────────────────────────────────────────────

  const [employeeUser, managerUser, adminUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'employee@k95foods.com' },
      update: {},
      create: {
        email: 'employee@k95foods.com',
        name: 'Alex Johnson',
        password: await hash('password123'),
        role: Role.EMPLOYEE,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@k95foods.com' },
      update: {},
      create: {
        email: 'manager@k95foods.com',
        name: 'Sarah Mitchell',
        password: await hash('password123'),
        role: Role.MANAGER,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@k95foods.com' },
      update: {},
      create: {
        email: 'admin@k95foods.com',
        name: 'David Chen',
        password: await hash('password123'),
        role: Role.ADMIN,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
      },
    }),
  ])

  console.log('✅  Users created')

  // ── 2. Purchase requests ──────────────────────────────────────────────────

  // Helper: create a request + its audit trail in one go
  const createRequest = async (data: {
    itemName: string
    quantity: number
    unit: string
    department: string
    requiredDate: Date
    reason: string
    priority: Priority
    status: Status
    createdById: string
    // optional: who reviewed it and when
    reviewedById?: string
    reviewRemarks?: string
    createdAt?: Date
  }) => {
    const {
      status,
      createdById,
      reviewedById,
      reviewRemarks,
      createdAt = daysAgo(7),
      ...rest
    } = data

    const req = await prisma.purchaseRequest.create({
      data: {
        ...rest,
        status,
        createdById,
        createdAt,
        updatedAt: createdAt,
      },
    })

    // CREATED audit log
    await prisma.auditLog.create({
      data: {
        requestId: req.id,
        performedById: createdById,
        action: AuditAction.CREATED,
        newStatus: Status.DRAFT,
        createdAt,
      },
    })

    // SUBMITTED audit log (for anything beyond DRAFT)
    if (status !== Status.DRAFT) {
      const submittedAt = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) // +2 h
      await prisma.auditLog.create({
        data: {
          requestId: req.id,
          performedById: createdById,
          action: AuditAction.SUBMITTED,
          oldStatus: Status.DRAFT,
          newStatus: Status.SUBMITTED,
          createdAt: submittedAt,
        },
      })
    }

    // APPROVED / REJECTED audit log
    if (
      (status === Status.APPROVED || status === Status.REJECTED) &&
      reviewedById
    ) {
      const reviewedAt = new Date(createdAt.getTime() + 5 * 60 * 60 * 1000) // +5 h
      await prisma.auditLog.create({
        data: {
          requestId: req.id,
          performedById: reviewedById,
          action:
            status === Status.APPROVED ? AuditAction.APPROVED : AuditAction.REJECTED,
          oldStatus: Status.SUBMITTED,
          newStatus: status,
          remarks: reviewRemarks,
          createdAt: reviewedAt,
        },
      })
    }

    return req
  }

  // ── DRAFT requests (employee) ─────────────────────────────────────────────
  await createRequest({
    itemName: 'Ergonomic Office Chairs',
    quantity: 5,
    unit: 'pcs',
    department: 'Operations',
    requiredDate: daysFromNow(14),
    reason: 'Current chairs are worn out and causing back pain for the team.',
    priority: Priority.MEDIUM,
    status: Status.DRAFT,
    createdById: employeeUser.id,
    createdAt: daysAgo(2),
  })

  await createRequest({
    itemName: 'Printer Ink Cartridges',
    quantity: 10,
    unit: 'pcs',
    department: 'Administration',
    requiredDate: daysFromNow(7),
    reason: 'Running low on ink for the main office printer. Need to restock.',
    priority: Priority.LOW,
    status: Status.DRAFT,
    createdById: employeeUser.id,
    createdAt: daysAgo(1),
  })

  // ── SUBMITTED requests (pending approval) ─────────────────────────────────
  await createRequest({
    itemName: 'Industrial Blender',
    quantity: 2,
    unit: 'pcs',
    department: 'Production',
    requiredDate: daysFromNow(10),
    reason: 'Required for the new kombucha batch production line expansion.',
    priority: Priority.HIGH,
    status: Status.SUBMITTED,
    createdById: employeeUser.id,
    createdAt: daysAgo(5),
  })

  await createRequest({
    itemName: 'Safety Gloves (Medium)',
    quantity: 50,
    unit: 'pairs',
    department: 'Production',
    requiredDate: daysFromNow(5),
    reason: 'Monthly safety equipment replenishment for production floor staff.',
    priority: Priority.HIGH,
    status: Status.SUBMITTED,
    createdById: employeeUser.id,
    createdAt: daysAgo(3),
  })

  await createRequest({
    itemName: 'Laptop Stand',
    quantity: 8,
    unit: 'pcs',
    department: 'Technology',
    requiredDate: daysFromNow(21),
    reason: 'Improving ergonomics for the engineering team working from office.',
    priority: Priority.LOW,
    status: Status.SUBMITTED,
    createdById: employeeUser.id,
    createdAt: daysAgo(4),
  })

  await createRequest({
    itemName: 'Stainless Steel Fermentation Tanks',
    quantity: 3,
    unit: 'units',
    department: 'Production',
    requiredDate: daysFromNow(30),
    reason: 'Scaling up kombucha production capacity to meet Q3 demand targets.',
    priority: Priority.HIGH,
    status: Status.SUBMITTED,
    createdById: managerUser.id,
    createdAt: daysAgo(6),
  })

  // ── APPROVED requests ─────────────────────────────────────────────────────
  await createRequest({
    itemName: 'Packaging Labels (500ml)',
    quantity: 5000,
    unit: 'pcs',
    department: 'Production',
    requiredDate: daysFromNow(7),
    reason: 'New batch of Toyo Kombucha 500ml bottles requires updated labels.',
    priority: Priority.HIGH,
    status: Status.APPROVED,
    createdById: employeeUser.id,
    reviewedById: managerUser.id,
    reviewRemarks: 'Approved — aligns with Q2 production schedule.',
    createdAt: daysAgo(10),
  })

  await createRequest({
    itemName: 'Office Desk Dividers',
    quantity: 12,
    unit: 'pcs',
    department: 'Administration',
    requiredDate: daysFromNow(14),
    reason: 'Creating individual workspaces in the open-plan office area.',
    priority: Priority.MEDIUM,
    status: Status.APPROVED,
    createdById: employeeUser.id,
    reviewedById: adminUser.id,
    reviewRemarks: 'Approved for office renovation budget.',
    createdAt: daysAgo(12),
  })

  await createRequest({
    itemName: 'pH Testing Strips',
    quantity: 200,
    unit: 'pcs',
    department: 'Quality Control',
    requiredDate: daysFromNow(3),
    reason: 'Essential for daily quality checks on kombucha batches.',
    priority: Priority.HIGH,
    status: Status.APPROVED,
    createdById: managerUser.id,
    reviewedById: adminUser.id,
    reviewRemarks: 'Critical supply — approved immediately.',
    createdAt: daysAgo(8),
  })

  await createRequest({
    itemName: 'Cleaning Supplies Bundle',
    quantity: 1,
    unit: 'bundle',
    department: 'Facilities',
    requiredDate: daysFromNow(5),
    reason: 'Monthly cleaning supplies for the production facility and offices.',
    priority: Priority.LOW,
    status: Status.APPROVED,
    createdById: employeeUser.id,
    reviewedById: managerUser.id,
    reviewRemarks: 'Routine approval.',
    createdAt: daysAgo(15),
  })

  // ── REJECTED requests ─────────────────────────────────────────────────────
  await createRequest({
    itemName: 'Standing Desk Converters',
    quantity: 20,
    unit: 'pcs',
    department: 'Technology',
    requiredDate: daysFromNow(30),
    reason: 'Improving posture and productivity for the development team.',
    priority: Priority.MEDIUM,
    status: Status.REJECTED,
    createdById: employeeUser.id,
    reviewedById: managerUser.id,
    reviewRemarks: 'Budget not available this quarter. Please resubmit in Q3.',
    createdAt: daysAgo(20),
  })

  await createRequest({
    itemName: 'Coffee Machine (Premium)',
    quantity: 1,
    unit: 'pcs',
    department: 'Administration',
    requiredDate: daysFromNow(14),
    reason: 'Upgrading the office kitchen with a better coffee machine for staff.',
    priority: Priority.LOW,
    status: Status.REJECTED,
    createdById: employeeUser.id,
    reviewedById: adminUser.id,
    reviewRemarks: 'Not a priority purchase at this time.',
    createdAt: daysAgo(18),
  })

  console.log('✅  Purchase requests + audit logs created')

  console.log('\n─────────────────────────────────────────────')
  console.log('  Test accounts ready:')
  console.log('  EMPLOYEE  employee@k95foods.com  / password123')
  console.log('  MANAGER   manager@k95foods.com   / password123')
  console.log('  ADMIN     admin@k95foods.com     / password123')
  console.log('─────────────────────────────────────────────\n')
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
