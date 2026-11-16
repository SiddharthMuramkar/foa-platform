import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { CompetitionSchema, UserRole, CompetitionStatus } from '@foa/shared';
import { validateRequest } from '../middleware/validation';
import { authenticateJwt, requireRoles, optionalAuthenticateJwt } from '../middleware/auth';

const router = Router();

// GET /competitions (Public & Admin list)
router.get('/', optionalAuthenticateJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, type } = req.query;
    const isAdmin = req.user && [UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN, UserRole.COMPETITION_MANAGER].includes(req.user.role as UserRole);

    const where: any = {};

    if (!isAdmin) {
      // Public only sees published competitions
      where.status = {
        in: [CompetitionStatus.UPCOMING, CompetitionStatus.REGISTRATION_OPEN, CompetitionStatus.ACTIVE, CompetitionStatus.SUBMISSIONS_CLOSED, CompetitionStatus.JUDGING, CompetitionStatus.COMPLETED]
      };
    } else if (status) {
      where.status = status as string;
    }

    if (type) {
      where.competitionType = type as string;
    }

    const competitions = await prisma.competition.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    });

    res.json({ success: true, data: competitions });
  } catch (err) {
    next(err);
  }
});

// GET /competitions/:slugOrId
router.get('/:slugOrId', optionalAuthenticateJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slugOrId } = req.params;
    const competition = await prisma.competition.findFirst({
      where: {
        OR: [
          { id: slugOrId },
          { slug: slugOrId }
        ]
      },
      include: {
        _count: {
          select: { submissions: true }
        }
      }
    });

    if (!competition) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Competition not found' }
      });
    }

    res.json({ success: true, data: competition });
  } catch (err) {
    next(err);
  }
});

// POST /competitions (Admin Create)
router.post(
  '/',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN, UserRole.COMPETITION_MANAGER]),
  validateRequest(CompetitionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      // Validate date sequence
      const regStart = new Date(data.regStartDate);
      const regEnd = new Date(data.regEndDate);
      const subStart = new Date(data.submissionStartDate);
      const subEnd = new Date(data.submissionEndDate);

      if (regEnd <= regStart) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_DATES', message: 'Registration closing date must be after registration opening date' }
        });
      }

      if (subEnd <= subStart) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_DATES', message: 'Submission deadline must be after submission start date' }
        });
      }

      const existingSlug = await prisma.competition.findUnique({ where: { slug: data.slug } });
      if (existingSlug) {
        return res.status(400).json({
          success: false,
          error: { code: 'SLUG_EXISTS', message: 'A competition with this URL slug already exists' }
        });
      }

      const competition = await prisma.competition.create({
        data: {
          ...data,
          regStartDate: regStart,
          regEndDate: regEnd,
          submissionStartDate: subStart,
          submissionEndDate: subEnd,
          judgingCriteria: data.judgingCriteria ? JSON.stringify(data.judgingCriteria) : null
        }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'CREATE_COMPETITION',
          entityType: 'Competition',
          entityId: competition.id,
          details: JSON.stringify({ title: competition.title, slug: competition.slug })
        }
      });

      res.status(201).json({
        success: true,
        data: competition,
        message: 'Competition created successfully'
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /competitions/:id
router.patch(
  '/:id',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN, UserRole.COMPETITION_MANAGER]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body };

      if (updates.regStartDate) updates.regStartDate = new Date(updates.regStartDate);
      if (updates.regEndDate) updates.regEndDate = new Date(updates.regEndDate);
      if (updates.submissionStartDate) updates.submissionStartDate = new Date(updates.submissionStartDate);
      if (updates.submissionEndDate) updates.submissionEndDate = new Date(updates.submissionEndDate);
      if (updates.judgingCriteria && typeof updates.judgingCriteria === 'object') {
        updates.judgingCriteria = JSON.stringify(updates.judgingCriteria);
      }

      const updated = await prisma.competition.update({
        where: { id },
        data: updates
      });

      res.json({
        success: true,
        data: updated,
        message: 'Competition updated successfully'
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /competitions/:id/publish
router.post(
  '/:id/publish',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN, UserRole.COMPETITION_MANAGER]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const comp = await prisma.competition.findUnique({ where: { id } });

      if (!comp) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Competition not found' }
        });
      }

      // Check dates to decide UPCOMING vs REGISTRATION_OPEN
      const now = new Date();
      let nextStatus = CompetitionStatus.REGISTRATION_OPEN;
      if (now < comp.regStartDate) {
        nextStatus = CompetitionStatus.UPCOMING;
      } else if (now > comp.regEndDate) {
        nextStatus = CompetitionStatus.ACTIVE;
      }

      const published = await prisma.competition.update({
        where: { id },
        data: { status: nextStatus }
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'PUBLISH_COMPETITION',
          entityType: 'Competition',
          entityId: comp.id,
          details: JSON.stringify({ previousStatus: comp.status, newStatus: nextStatus })
        }
      });

      res.json({
        success: true,
        data: published,
        message: `Competition successfully published with status: ${nextStatus}`
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
