import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { UserRole } from '@foa/shared';
import { authenticateJwt, requireRoles } from '../middleware/auth';

const router = Router();

// GET /certificates/my-certificates (Logged-in user certificates)
router.get('/my-certificates', authenticateJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const certs = await prisma.certificate.findMany({
      where: { userId: req.user!.id, isRevoked: false },
      include: {
        competition: { select: { title: true, slug: true } },
        submission: { select: { submissionNumber: true, title: true } }
      }
    });

    res.json({ success: true, data: certs });
  } catch (err) {
    next(err);
  }
});

// GET /certificates/verify/:certificateNumber (Public QR verification endpoint)
router.get('/verify/:certificateNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { certificateNumber } = req.params;
    const cert = await prisma.certificate.findUnique({
      where: { certificateNumber },
      include: {
        competition: { select: { title: true } },
        submission: { select: { submissionNumber: true, title: true } }
      }
    });

    if (!cert || cert.isRevoked) {
      return res.status(404).json({
        success: false,
        error: { code: 'INVALID_CERTIFICATE', message: 'Certificate not found or has been revoked' }
      });
    }

    res.json({
      success: true,
      data: {
        certificateNumber: cert.certificateNumber,
        recipientName: cert.recipientName,
        awardTitle: cert.awardTitle,
        category: cert.category,
        competitionTitle: cert.competition.title,
        issueDate: cert.issueDate,
        verified: true
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /certificates/issue (Admin issue certificate)
router.post(
  '/issue',
  authenticateJwt,
  requireRoles([UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { submissionId, userId, competitionId, recipientName, type, awardTitle, category } = req.body;

      const certNumber = `FOA-CERT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const qrCode = `https://foaglobal.org/verify/${certNumber}`;

      const certificate = await prisma.certificate.create({
        data: {
          certificateNumber: certNumber,
          submissionId: submissionId || null,
          userId,
          competitionId,
          recipientName,
          type: type || 'PARTICIPATION',
          awardTitle: awardTitle || 'Certificate of Participation',
          category,
          verificationQrCode: qrCode
        }
      });

      res.status(201).json({
        success: true,
        data: certificate,
        message: 'Certificate issued successfully'
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
