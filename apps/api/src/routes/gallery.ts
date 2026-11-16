import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { SubmissionStatus } from '@foa/shared';

const router = Router();

// GET /gallery (Only Approved submissions with publicDisplayAllowed = true)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search } = req.query;

    const where: any = {
      status: SubmissionStatus.APPROVED,
      publicDisplayAllowed: true,
      parentConsentOnRecord: true
    };

    if (category) {
      where.category = category as string;
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { artistStatement: { contains: search as string } }
      ];
    }

    const artworks = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        submissionNumber: true,
        title: true,
        description: true,
        artistStatement: true,
        category: true,
        finalRank: true,
        schoolRank: true,
        createdAt: true,
        competition: {
          select: { id: true, title: true, slug: true, animalWelfareTheme: true }
        },
        participant: {
          // Privacy by design: Only display public name, NEVER minor's phone or email
          select: { fullName: true }
        },
        school: {
          select: { name: true, city: true, state: true }
        },
        assets: {
          where: { assetType: 'PREVIEW' },
          select: { id: true, fileUrl: true }
        }
      }
    });

    res.json({ success: true, data: artworks });
  } catch (err) {
    next(err);
  }
});

// GET /gallery/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const artwork = await prisma.submission.findFirst({
      where: {
        id,
        status: SubmissionStatus.APPROVED,
        publicDisplayAllowed: true
      },
      select: {
        id: true,
        submissionNumber: true,
        title: true,
        description: true,
        artistStatement: true,
        category: true,
        finalRank: true,
        schoolRank: true,
        createdAt: true,
        competition: {
          select: { id: true, title: true, slug: true, animalWelfareTheme: true }
        },
        participant: {
          select: { fullName: true }
        },
        school: {
          select: { name: true, city: true, state: true }
        },
        assets: {
          select: { id: true, fileUrl: true, assetType: true }
        },
        auctionListing: {
          select: { id: true, startingPrice: true, currentPrice: true, status: true, endsAt: true }
        }
      }
    });

    if (!artwork) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Artwork not found or not approved for public display' }
      });
    }

    res.json({ success: true, data: artwork });
  } catch (err) {
    next(err);
  }
});

export default router;
