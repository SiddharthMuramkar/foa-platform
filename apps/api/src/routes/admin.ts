import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { UserRole } from '@foa/shared';
import { authenticateJwt, requireRoles } from '../middleware/auth';

const router = Router();

// GET /admin/overview (Real DB metrics, never fabricated)
router.get(
  '/overview',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN, UserRole.COMPETITION_MANAGER]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [
        totalCompetitions,
        draftCompetitions,
        activeCompetitions,
        totalSchools,
        pendingSchools,
        totalSubmissions,
        pendingReviews,
        shortlistedSubmissions,
        approvedSubmissions,
        totalDonations
      ] = await Promise.all([
        prisma.competition.count(),
        prisma.competition.count({ where: { status: 'DRAFT' } }),
        prisma.competition.count({ where: { status: { in: ['ACTIVE', 'REGISTRATION_OPEN', 'UPCOMING'] } } }),
        prisma.school.count(),
        prisma.school.count({ where: { verificationStatus: 'PENDING' } }),
        prisma.submission.count(),
        prisma.submission.count({ where: { status: 'SUBMITTED' } }),
        prisma.submission.count({ where: { status: { in: ['SHORTLISTED_BY_SCHOOL', 'FOA_SHORTLISTED'] } } }),
        prisma.submission.count({ where: { status: 'APPROVED' } }),
        prisma.donation.aggregate({ _sum: { amount: true }, _count: { id: true } })
      ]);

      const recentSubmissions = await prisma.submission.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          participant: { select: { fullName: true } },
          competition: { select: { title: true } },
          school: { select: { name: true } }
        }
      });

      const recentAuditLogs = await prisma.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, role: true } }
        }
      });

      res.json({
        success: true,
        data: {
          counts: {
            totalCompetitions,
            draftCompetitions,
            activeCompetitions,
            totalSchools,
            pendingSchools,
            totalSubmissions,
            pendingReviews,
            shortlistedSubmissions,
            approvedSubmissions,
            totalDonationsAmount: totalDonations._sum.amount || 0,
            donationsCount: totalDonations._count.id
          },
          recentSubmissions,
          recentAuditLogs
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /admin/users
router.get(
  '/users',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role, search } = req.query;
      const where: any = {};
      if (role) where.role = role as string;
      if (search) {
        where.OR = [
          { email: { contains: search as string } },
          { fullName: { contains: search as string } }
        ];
      }

      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          createdAt: true
        }
      });

      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /admin/users/:id/role
router.patch(
  '/users/:id/role',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { role, status } = req.body;

      const updated = await prisma.user.update({
        where: { id },
        data: {
          role: role || undefined,
          status: status || undefined
        },
        select: { id: true, email: true, fullName: true, role: true, status: true }
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'UPDATE_USER_ROLE',
          entityType: 'User',
          entityId: id,
          details: JSON.stringify({ newRole: role, newStatus: status })
        }
      });

      res.json({ success: true, data: updated, message: 'User role updated successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /admin/audit-logs
router.get(
  '/audit-logs',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: { select: { fullName: true, email: true, role: true } }
        }
      });
      res.json({ success: true, data: logs });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
