import { z } from 'zod';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  FOA_ADMIN = 'FOA_ADMIN',
  COMPETITION_MANAGER = 'COMPETITION_MANAGER',
  JUDGE = 'JUDGE',
  SCHOOL_COORDINATOR = 'SCHOOL_COORDINATOR',
  TEACHER = 'TEACHER',
  PARTICIPANT = 'PARTICIPANT',
  DONOR = 'DONOR',
  PUBLIC = 'PUBLIC'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED'
}

export enum SchoolStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

export enum CompetitionStatus {
  DRAFT = 'DRAFT',
  UPCOMING = 'UPCOMING',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  ACTIVE = 'ACTIVE',
  SUBMISSIONS_CLOSED = 'SUBMISSIONS_CLOSED',
  JUDGING = 'JUDGING',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum CompetitionType {
  DRAWING = 'DRAWING',
  PAINTING = 'PAINTING',
  ART_CRAFT = 'ART_CRAFT',
  ESSAY = 'ESSAY',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  VIDEOGRAPHY = 'VIDEOGRAPHY'
}

export enum PhysicalArtworkRequirement {
  NOT_REQUIRED = 'NOT_REQUIRED',
  OPTIONAL = 'OPTIONAL',
  TOP_SHORTLISTED_ONLY = 'TOP_SHORTLISTED_ONLY',
  ALL_WINNERS = 'ALL_WINNERS'
}

export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED_BY_SCHOOL = 'SHORTLISTED_BY_SCHOOL',
  FOA_SHORTLISTED = 'FOA_SHORTLISTED',
  CORRECTION_REQUESTED = 'CORRECTION_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum PhysicalTrackingStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  AWAITING_SELECTION = 'AWAITING_SELECTION',
  REQUESTED = 'REQUESTED',
  AWAITING_DISPATCH = 'AWAITING_DISPATCH',
  DISPATCHED = 'DISPATCHED',
  RECEIVED_BY_FOA = 'RECEIVED_BY_FOA',
  VERIFICATION_IN_PROGRESS = 'VERIFICATION_IN_PROGRESS',
  VERIFIED = 'VERIFIED',
  RETURNED = 'RETURNED'
}

export enum CertificateType {
  PARTICIPATION = 'PARTICIPATION',
  SCHOOL_MERIT = 'SCHOOL_MERIT',
  FINALIST = 'FINALIST',
  WINNER = 'WINNER',
  RUNNER_UP = 'RUNNER_UP',
  SPECIAL_MENTION = 'SPECIAL_MENTION',
  TEACHER_COORDINATOR = 'TEACHER_COORDINATOR'
}

export enum AuctionStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  EXTENDED = 'EXTENDED',
  CLOSED_SOLD = 'CLOSED_SOLD',
  CLOSED_UNSOLD = 'CLOSED_UNSOLD',
  CANCELLED = 'CANCELLED'
}

// Zod Schemas for Validation
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name must have at least 2 characters'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.PARTICIPANT),
  // Additional profile fields
  schoolName: z.string().optional(),
  grade: z.string().optional(),
  age: z.number().int().min(4).max(100).optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianConsent: z.boolean().default(false)
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const CompetitionSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug must be lower-case alphanumeric with dashes'),
  description: z.string().min(10, 'Description must have at least 10 characters'),
  animalWelfareTheme: z.string().min(3, 'Theme is required'),
  competitionType: z.nativeEnum(CompetitionType),
  coverImageUrl: z.string().optional(),
  eligibilityRules: z.string().optional(),
  rules: z.string().optional(),
  judgingCriteria: z.record(z.any()).optional(),
  allowIndividualParticipation: z.boolean().default(true),
  allowSchoolParticipation: z.boolean().default(true),
  schoolShortlistLimit: z.number().int().min(1).max(50).default(5),
  physicalArtworkRequired: z.nativeEnum(PhysicalArtworkRequirement).default(PhysicalArtworkRequirement.TOP_SHORTLISTED_ONLY),
  prizes: z.string().optional(),
  regStartDate: z.string(),
  regEndDate: z.string(),
  submissionStartDate: z.string(),
  submissionEndDate: z.string(),
  status: z.nativeEnum(CompetitionStatus).default(CompetitionStatus.DRAFT)
});

export const SchoolRegisterSchema = z.object({
  name: z.string().min(3, 'School name is required'),
  addressLine1: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(3, 'Postal/Pin code is required'),
  country: z.string().default('India'),
  principalName: z.string().min(2, 'Principal name is required'),
  principalEmail: z.string().email('Invalid principal email'),
  principalPhone: z.string().min(7, 'Principal phone is required'),
  authorizedPersonName: z.string().min(2, 'Coordinator/Authorized person name is required'),
  authorizedPersonEmail: z.string().email('Invalid coordinator email'),
  authorizedPersonPhone: z.string().min(7, 'Coordinator phone is required'),
  expectedParticipants: z.number().int().min(1).default(50)
});

export const SubmissionCreateSchema = z.object({
  competitionId: z.string().uuid('Valid competition ID required'),
  schoolId: z.string().uuid().optional(),
  category: z.string().min(1, 'Category is required'),
  title: z.string().min(2, 'Artwork title is required'),
  description: z.string().optional(),
  artistStatement: z.string().optional(),
  parentConsentOnRecord: z.boolean().default(true),
  publicDisplayAllowed: z.boolean().default(true),
  auctionAllowed: z.boolean().default(true),
  schoolRank: z.number().int().optional(),
  fileDataUrl: z.string().min(10, 'Artwork image data or URL is required')
});

export const ReviewSubmissionSchema = z.object({
  status: z.nativeEnum(SubmissionStatus),
  score: z.number().min(0).max(100).optional(),
  reviewNotes: z.string().optional(),
  finalRank: z.string().optional()
});

export const PhysicalTrackingUpdateSchema = z.object({
  status: z.nativeEnum(PhysicalTrackingStatus),
  courierService: z.string().optional(),
  trackingNumber: z.string().optional(),
  physicalCondition: z.string().optional(),
  verificationNotes: z.string().optional()
});

export const AuctionBidSchema = z.object({
  amount: z.number().positive('Bid amount must be greater than zero')
});

export const DonationSchema = z.object({
  amount: z.number().positive('Donation amount must be greater than zero'),
  donorName: z.string().min(2, 'Donor name is required'),
  donorEmail: z.string().email('Valid email is required'),
  donorPhone: z.string().optional(),
  purpose: z.string().default('General Animal Welfare & Rescue Fund'),
  isAnonymous: z.boolean().default(false)
});
