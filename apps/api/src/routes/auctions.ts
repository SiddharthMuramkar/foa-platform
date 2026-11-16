import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { AuctionBidSchema, DonationSchema } from '@foa/shared';
import { validateRequest } from '../middleware/validation';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

// ================= AUCTIONS =================
router.get('/auctions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auctions = await prisma.auctionListing.findMany({
      where: { status: 'ACTIVE' },
      include: {
        submission: {
          select: {
            title: true,
            category: true,
            artistStatement: true,
            participant: { select: { fullName: true } },
            assets: { select: { fileUrl: true } }
          }
        },
        _count: { select: { bids: true } }
      }
    });
    res.json({ success: true, data: auctions });
  } catch (err) {
    next(err);
  }
});

router.get('/auctions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const auction = await prisma.auctionListing.findUnique({
      where: { id },
      include: {
        submission: {
          select: {
            title: true,
            category: true,
            artistStatement: true,
            participant: { select: { fullName: true } },
            assets: { select: { fileUrl: true } }
          }
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, amount: true, createdAt: true }
        }
      }
    });

    if (!auction) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Auction listing not found' }
      });
    }

    res.json({ success: true, data: auction });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/auctions/:id/bid',
  authenticateJwt,
  validateRequest(AuctionBidSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      const userId = req.user!.id;

      const auction = await prisma.auctionListing.findUnique({ where: { id } });
      if (!auction || auction.status !== 'ACTIVE') {
        return res.status(400).json({
          success: false,
          error: { code: 'AUCTION_CLOSED', message: 'This auction is not accepting bids' }
        });
      }

      if (amount <= auction.currentPrice) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BID_TOO_LOW',
            message: `Your bid must exceed the current highest bid of ₹${auction.currentPrice}`
          }
        });
      }

      // Record bid and update current price transactionally
      const [bid, updatedAuction] = await prisma.$transaction([
        prisma.bid.create({
          data: {
            auctionId: id,
            bidderId: userId,
            amount
          }
        }),
        prisma.auctionListing.update({
          where: { id },
          data: {
            currentPrice: amount,
            winningBidderId: userId
          }
        })
      ]);

      res.status(201).json({
        success: true,
        data: { bid, updatedAuction },
        message: `Bid of ₹${amount} successfully placed!`
      });
    } catch (err) {
      next(err);
    }
  }
);

// ================= DONATIONS =================
router.post('/donations', validateRequest(DonationSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const ref = `FOA-DON-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const donation = await prisma.donation.create({
      data: {
        transactionReference: ref,
        donorName: data.donorName,
        donorEmail: data.donorEmail,
        donorPhone: data.donorPhone,
        amount: data.amount,
        currency: 'INR',
        purpose: data.purpose,
        isAnonymous: data.isAnonymous,
        status: 'COMPLETED' // Recorded via mock payment adapter
      }
    });

    res.status(201).json({
      success: true,
      data: donation,
      message: 'Donation recorded successfully. Thank you for championing animal compassion!'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/donations/transparency', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalDonations = await prisma.donation.aggregate({
      _sum: { amount: true },
      _count: { id: true }
    });

    res.json({
      success: true,
      data: {
        totalRaised: totalDonations._sum.amount || 0,
        donationCount: totalDonations._count.id,
        impactInitiatives: [
          { name: 'Stray Animal Medical Rescue & Care', allocationPercent: 40 },
          { name: 'Shelter Support & Treatment Center Operations', allocationPercent: 30 },
          { name: 'School Animal Compassion Clubs & Creative Outreach', allocationPercent: 20 },
          { name: 'Emergency Sterilization & Vaccination Drives', allocationPercent: 10 }
        ]
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
