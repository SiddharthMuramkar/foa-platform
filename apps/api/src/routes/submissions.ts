import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { SubmissionCreateSchema, ReviewSubmissionSchema, UserRole, SubmissionStatus } from '@foa/shared';
import { validateRequest } from '../middleware/validation';
import { authenticateJwt, requireRoles } from '../middleware/auth';

const router = Router();

// GET /submissions (List submissions based on permissions)
router.get('/', authenticateJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { competitionId, schoolId, status } = req.query;
    const user = req.user!;

    const where: any = {};

    if (user.role === UserRole.PARTICIPANT) {
      where.participantId = user.id;
    } else if (user.role === UserRole.SCHOOL_COORDINATOR || user.role === UserRole.TEACHER) {
      // Find school this user belongs to
      const membership = await prisma.schoolMembership.findFirst({
        where: { userId: user.id }
      });
      if (membership) {
        where.schoolId = membership.schoolId;
      } else {
        return res.json({ success: true, data: [] });
      }
    } else if (user.role === UserRole.JUDGE) {
      // Judges only see submissions under review or shortlisted
      where.status = { in: [SubmissionStatus.UNDER_REVIEW, SubmissionStatus.SHORTLISTED_BY_SCHOOL, SubmissionStatus.FOA_SHORTLISTED] };
    }

    if (competitionId) where.competitionId = competitionId as string;
    if (schoolId && [UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN, UserRole.COMPETITION_MANAGER].includes(user.role as UserRole)) {
      where.schoolId = schoolId as string;
    }
    if (status) where.status = status as string;

    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        competition: { select: { id: true, title: true, slug: true } },
        participant: { select: { id: true, fullName: true, email: true } },
        school: { select: { id: true, name: true, code: true } },
        assets: true,
        reviews: true,
        physicalTracking: true
      }
    });

    res.json({ success: true, data: submissions });
  } catch (err) {
    next(err);
  }
});

// GET /submissions/:id
router.get('/:id', authenticateJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        competition: true,
        participant: { select: { id: true, fullName: true, email: true } },
        school: true,
        assets: true,
        reviews: {
          include: {
            judge: { select: { id: true, fullName: true } }
          }
        },
        physicalTracking: true
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Submission not found' }
      });
    }

    // Role-based IDOR prevention
    if (user.role === UserRole.PARTICIPANT && submission.participantId !== user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You cannot view another participant’s private submission' }
      });
    }

    res.json({ success: true, data: submission });
  } catch (err) {
    next(err);
  }
});

// POST /submissions (Create submission)
router.post(
  '/',
  authenticateJwt,
  validateRequest(SubmissionCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const user = req.user!;

      // Generate unique submission number
      const randomSeq = Math.floor(10000 + Math.random() * 90000);
      const submissionNumber = `FOA-2026-SUB-${randomSeq}`;

      // Check if school coordinator submitting for school
      let effectiveSchoolId = data.schoolId;
      if (!effectiveSchoolId && (user.role === UserRole.SCHOOL_COORDINATOR || user.role === UserRole.TEACHER)) {
        const mem = await prisma.schoolMembership.findFirst({ where: { userId: user.id } });
        if (mem) effectiveSchoolId = mem.schoolId;
      }

      const initialStatus = effectiveSchoolId && data.schoolRank
        ? SubmissionStatus.SHORTLISTED_BY_SCHOOL
        : SubmissionStatus.SUBMITTED;

      const submission = await prisma.submission.create({
        data: {
          submissionNumber,
          competitionId: data.competitionId,
          participantId: user.id,
          schoolId: effectiveSchoolId || null,
          category: data.category,
          title: data.title,
          description: data.description,
          artistStatement: data.artistStatement,
          parentConsentOnRecord: data.parentConsentOnRecord,
          publicDisplayAllowed: data.publicDisplayAllowed,
          auctionAllowed: data.auctionAllowed,
          schoolRank: data.schoolRank,
          status: initialStatus,
          assets: {
            create: [
              {
                assetType: 'PREVIEW',
                fileUrl: data.fileDataUrl
              }
            ]
          },
          physicalTracking: {
            create: {
              status: 'NOT_REQUIRED'
            }
          }
        },
        include: {
          assets: true,
          competition: true,
          school: true
        }
      });

      res.status(201).json({
        success: true,
        data: submission,
        message: `Submission registered successfully! Submission ID: ${submissionNumber}`
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /submissions/:id/review (Admin / Judge review)
router.post(
  '/:id/review',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN, UserRole.JUDGE, UserRole.COMPETITION_MANAGER]),
  validateRequest(ReviewSubmissionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, score, reviewNotes, finalRank } = req.body;

      const updated = await prisma.submission.update({
        where: { id },
        data: {
          status,
          score: score !== undefined ? score : undefined,
          reviewNotes: reviewNotes !== undefined ? reviewNotes : undefined,
          finalRank: finalRank !== undefined ? finalRank : undefined
        }
      });

      if (score !== undefined) {
        await prisma.review.create({
          data: {
            submissionId: id,
            judgeId: req.user!.id,
            score,
            feedback: reviewNotes
          }
        });
      }

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'REVIEW_SUBMISSION',
          entityType: 'Submission',
          entityId: id,
          details: JSON.stringify({ status, score, finalRank })
        }
      });

      res.json({
        success: true,
        data: updated,
        message: 'Submission review recorded successfully'
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /submissions/:id/approve
router.post(
  '/:id/approve',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updated = await prisma.submission.update({
        where: { id },
        data: {
          status: SubmissionStatus.APPROVED,
          publicDisplayAllowed: true
        }
      });

      res.json({
        success: true,
        data: updated,
        message: 'Submission approved for public showcase'
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
