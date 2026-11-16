import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting Friends of Animals (FOA) seed script...');

  const passwordHash = await bcrypt.hash('Admin@12345', 10);
  const userPasswordHash = await bcrypt.hash('Student@12345', 10);
  const schoolPasswordHash = await bcrypt.hash('School@12345', 10);

  // 1. Create Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@foaglobal.org' },
    update: {},
    create: {
      email: 'admin@foaglobal.org',
      passwordHash,
      fullName: 'FOA Central Administrator',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    }
  });
  console.log(`[Seed] Super Admin created: ${admin.email}`);

  // 2. Create Competition Manager
  const compManager = await prisma.user.upsert({
    where: { email: 'competitions@foaglobal.org' },
    update: {},
    create: {
      email: 'competitions@foaglobal.org',
      passwordHash,
      fullName: 'Ananya Roy',
      role: 'COMPETITION_MANAGER',
      status: 'ACTIVE'
    }
  });

  // 3. Create Sample Schools
  const school1 = await prisma.school.upsert({
    where: { code: 'SCH-DEL-1001' },
    update: {},
    create: {
      code: 'SCH-DEL-1001',
      name: 'Delhi Public International School, RK Puram',
      addressLine1: 'Sector 12, RK Puram',
      city: 'New Delhi',
      state: 'Delhi',
      postalCode: '110022',
      country: 'India',
      principalName: 'Dr. Sunita Sharma',
      principalEmail: 'principal@delhipublic.edu',
      principalPhone: '+91 9811023456',
      authorizedPersonName: 'Meenakshi Iyer',
      authorizedPersonEmail: 'coordinator@delhipublic.edu',
      authorizedPersonPhone: '+91 9811098765',
      expectedParticipants: 150,
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date()
    }
  });

  const school2 = await prisma.school.upsert({
    where: { code: 'SCH-MUM-2002' },
    update: {},
    create: {
      code: 'SCH-MUM-2002',
      name: 'St. Xavier High School, Fort',
      addressLine1: '5 Mahapalika Marg, Dhobi Talao',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
      principalName: 'Fr. Jude Fernandes',
      principalEmail: 'principal@stxaviers.edu',
      principalPhone: '+91 9820011223',
      authorizedPersonName: 'Vikram Joshi',
      authorizedPersonEmail: 'vikram.joshi@stxaviers.edu',
      authorizedPersonPhone: '+91 9820044556',
      expectedParticipants: 80,
      verificationStatus: 'PENDING'
    }
  });

  // 4. Create Coordinator User
  const coordinatorUser = await prisma.user.upsert({
    where: { email: 'coordinator@delhipublic.edu' },
    update: {},
    create: {
      email: 'coordinator@delhipublic.edu',
      passwordHash: schoolPasswordHash,
      fullName: 'Meenakshi Iyer',
      role: 'SCHOOL_COORDINATOR',
      status: 'ACTIVE'
    }
  });

  await prisma.schoolMembership.upsert({
    where: {
      userId_schoolId: {
        userId: coordinatorUser.id,
        schoolId: school1.id
      }
    },
    update: {},
    create: {
      userId: coordinatorUser.id,
      schoolId: school1.id,
      role: 'COORDINATOR'
    }
  });

  // 5. Create Student / Participant
  const student = await prisma.user.upsert({
    where: { email: 'aarav.sharma@example.com' },
    update: {},
    create: {
      email: 'aarav.sharma@example.com',
      passwordHash: userPasswordHash,
      fullName: 'Aarav Sharma',
      role: 'PARTICIPANT',
      status: 'ACTIVE'
    }
  });

  // 6. Create Competitions
  const now = new Date();
  const comp1 = await prisma.competition.upsert({
    where: { slug: 'national-animal-compassion-art-challenge-2026' },
    update: {},
    create: {
      slug: 'national-animal-compassion-art-challenge-2026',
      title: 'National School Drawing Competition: Voices of the Voiceless',
      description: 'Inspiring young artists from schools across the nation to depict empathy, rescue, kindness, and coexistence with domestic and wild animals.',
      animalWelfareTheme: 'Coexistence with Urban Community Animals & Rescue',
      competitionType: 'DRAWING',
      coverImageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80',
      eligibilityRules: 'Students of Grades 1 through 12 divided across Group A (Grades 1-4), Group B (Grades 5-8), and Group C (Grades 9-12).',
      rules: 'Artwork must be original, on standard A3/A4 drawing sheet. Mediums permitted: Watercolors, crayons, color pencils, acrylics.',
      allowIndividualParticipation: true,
      allowSchoolParticipation: true,
      schoolShortlistLimit: 5,
      physicalArtworkRequired: 'TOP_SHORTLISTED_ONLY',
      prizes: 'National Gold Trophy + Certificate of Merit + Artwork Listed in Fundraising Auction',
      regStartDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      regEndDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      submissionStartDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      submissionEndDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      status: 'REGISTRATION_OPEN'
    }
  });

  // 7. Create Submissions
  const sub1 = await prisma.submission.upsert({
    where: { submissionNumber: 'FOA-2026-SUB-10492' },
    update: {},
    create: {
      submissionNumber: 'FOA-2026-SUB-10492',
      competitionId: comp1.id,
      participantId: student.id,
      schoolId: school1.id,
      category: 'Group B (Grades 5-8)',
      title: 'A Warm Corner: Shelter in the Rain',
      description: 'An evocative watercolor piece showing a schoolchild sharing an umbrella with a stray puppy during monsoon.',
      artistStatement: 'Every animal feels fear and cold just like us. If we have kindness in our hearts, there is always room under our umbrella.',
      status: 'APPROVED',
      schoolRank: 1,
      finalRank: 'National Gold 1st Prize',
      parentConsentOnRecord: true,
      publicDisplayAllowed: true,
      auctionAllowed: true,
      score: 96.5,
      assets: {
        create: [
          {
            assetType: 'PREVIEW',
            fileUrl: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&w=800&q=80'
          }
        ]
      },
      physicalTracking: {
        create: {
          status: 'VERIFIED',
          courierService: 'BlueDart Express',
          trackingNumber: 'BD-88991234',
          physicalCondition: 'Pristine condition, mounted on archival backing board',
          verificationNotes: 'Verified against digital entry. Guardian consent form attached.'
        }
      }
    }
  });

  // 8. Create Auction for sub1
  await prisma.auctionListing.upsert({
    where: { submissionId: sub1.id },
    update: {},
    create: {
      submissionId: sub1.id,
      title: 'Original Artwork: "A Warm Corner: Shelter in the Rain"',
      story: 'By Aarav Sharma (Grade 7). Proceeds fund medical treatment for community dogs in rescue shelters.',
      startingPrice: 3500,
      currentPrice: 5000,
      status: 'ACTIVE',
      startsAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  // 9. Create Certificate
  await prisma.certificate.upsert({
    where: { certificateNumber: 'FOA-CERT-2026-10492' },
    update: {},
    create: {
      certificateNumber: 'FOA-CERT-2026-10492',
      submissionId: sub1.id,
      userId: student.id,
      competitionId: comp1.id,
      recipientName: 'Aarav Sharma',
      type: 'WINNER',
      awardTitle: 'National 1st Prize Winner',
      category: 'Group B (Grades 5-8)',
      verificationQrCode: 'https://foaglobal.org/verify/FOA-CERT-2026-10492'
    }
  });

  // 10. Sample Donation
  await prisma.donation.upsert({
    where: { transactionReference: 'FOA-DON-2026-SEED-01' },
    update: {},
    create: {
      transactionReference: 'FOA-DON-2026-SEED-01',
      donorName: 'Pooja Hegde',
      donorEmail: 'pooja.hegde@example.org',
      amount: 10000,
      currency: 'INR',
      purpose: 'Emergency Mobile Ambulance & Medical Kits',
      status: 'COMPLETED'
    }
  });

  console.log('[Seed] Database successfully seeded with authentic demonstration data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
