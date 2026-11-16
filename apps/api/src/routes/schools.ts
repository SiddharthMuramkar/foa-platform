import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { SchoolRegisterSchema, UserRole, SchoolStatus } from '@foa/shared';
import { validateRequest } from '../middleware/validation';
import { authenticateJwt, requireRoles } from '../middleware/auth';

const router = Router();

// GET /schools (Admin filterable list)
router.get(
  '/',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN, UserRole.COMPETITION_MANAGER]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, search } = req.query;
      const where: any = {};

      if (status) {
        where.verificationStatus = status as string;
      }
      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { code: { contains: search as string } },
          { city: { contains: search as string } }
        ];
      }

      const schools = await prisma.school.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { submissions: true, memberships: true }
          }
        }
      });

      res.json({ success: true, data: schools });
    } catch (err) {
      next(err);
    }
  }
);

// GET /schools/:id
router.get('/:id', authenticateJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            user: { select: { id: true, fullName: true, email: true, role: true } }
          }
        },
        _count: {
          select: { submissions: true }
        }
      }
    });

    if (!school) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'School record not found' }
      });
    }

    res.json({ success: true, data: school });
  } catch (err) {
    next(err);
  }
});

// POST /schools (Register new school)
router.post('/', validateRequest(SchoolRegisterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const randomCode = `SCH-${data.city.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const school = await prisma.school.create({
      data: {
        ...data,
        code: randomCode,
        verificationStatus: SchoolStatus.PENDING
      }
    });

    res.status(201).json({
      success: true,
      data: school,
      message: 'School registration submitted for FOA verification review'
    });
  } catch (err) {
    next(err);
  }
});

// POST /schools/:id/approve (Admin)
router.post(
  '/:id/approve',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const school = await prisma.school.update({
        where: { id },
        data: {
          verificationStatus: SchoolStatus.VERIFIED,
          verificationNotes: notes || 'Verified and approved by FOA Administrator',
          verifiedAt: new Date()
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'APPROVE_SCHOOL',
          entityType: 'School',
          entityId: school.id,
          details: JSON.stringify({ name: school.name, code: school.code })
        }
      });

      res.json({
        success: true,
        data: school,
        message: `School ${school.name} successfully approved and verified`
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /schools/:id/reject (Admin)
router.post(
  '/:id/reject',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const school = await prisma.school.update({
        where: { id },
        data: {
          verificationStatus: SchoolStatus.REJECTED,
          verificationNotes: reason || 'Registration rejected'
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'REJECT_SCHOOL',
          entityType: 'School',
          entityId: school.id,
          details: JSON.stringify({ reason })
        }
      });

      res.json({
        success: true,
        data: school,
        message: 'School registration rejected'
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
