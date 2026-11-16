import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { PhysicalTrackingUpdateSchema, UserRole } from '@foa/shared';
import { validateRequest } from '../middleware/validation';
import { authenticateJwt, requireRoles } from '../middleware/auth';

const router = Router();

// GET /physical-tracking (Admin list)
router.get(
  '/',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN, UserRole.COMPETITION_MANAGER]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await prisma.physicalArtworkTracking.findMany({
        orderBy: { updatedAt: 'desc' },
        include: {
          submission: {
            include: {
              participant: { select: { fullName: true } },
              school: { select: { name: true, city: true } },
              competition: { select: { title: true } }
            }
          }
        }
      });
      res.json({ success: true, data: list });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /physical-tracking/:id/dispatch (Coordinator reports dispatch)
router.patch(
  '/:id/dispatch',
  authenticateJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { courierService, trackingNumber } = req.body;

      const updated = await prisma.physicalArtworkTracking.update({
        where: { id },
        data: {
          status: 'DISPATCHED',
          courierService,
          trackingNumber,
          dispatchedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: updated,
        message: 'Artwork dispatch details logged successfully'
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /physical-tracking/:id/verify (Admin verifies receipt & condition)
router.patch(
  '/:id/verify',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN]),
  validateRequest(PhysicalTrackingUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const updated = await prisma.physicalArtworkTracking.update({
        where: { id },
        data: {
          status: data.status,
          physicalCondition: data.physicalCondition,
          verificationNotes: data.verificationNotes,
          receivedAt: ['RECEIVED_BY_FOA', 'VERIFIED'].includes(data.status) ? new Date() : undefined,
          verifiedAt: data.status === 'VERIFIED' ? new Date() : undefined
        }
      });

      res.json({
        success: true,
        data: updated,
        message: 'Physical artwork tracking updated'
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
