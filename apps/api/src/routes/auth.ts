import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { RegisterSchema, LoginSchema, UserRole } from '@foa/shared';
import { validateRequest } from '../middleware/validation';
import { authenticateJwt } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'foa-super-secret-key-change-in-production-2026';

router.post('/register', validateRequest(RegisterSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName, phone, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'An account with this email already exists' }
      });
    }

    // Disallow self-assignment of administrative roles
    const safeRole = [UserRole.SUPER_ADMIN, UserRole.FOA_ADMIN].includes(role)
      ? UserRole.PARTICIPANT
      : role;

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        role: safeRole
      },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('foa_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      success: true,
      data: { user, token },
      message: 'Registration successful'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', validateRequest(LoginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('foa_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        },
        token
      },
      message: 'Login successful'
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('foa_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', authenticateJwt, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        schoolMemberships: {
          include: { school: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User record not found' }
      });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

export default router;
