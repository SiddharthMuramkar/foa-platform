// Vercel Serverless Function to handle /api/v1/* requests seamlessly
export default function handler(req: any, res: any) {
  const { url, method } = req;
  const path = url.replace(/^\/api\/v1/, '').split('?')[0];

  // Helper response
  const json = (data: any, status = 200) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(status).json(data);
  };

  // 1. Healthcheck
  if (path === '/health' || path === '') {
    return json({ status: 'healthy', timestamp: new Date().toISOString() });
  }

  // 2. Auth: Login
  if (path === '/auth/login' && method === 'POST') {
    const { email, password } = req.body || {};
    
    // Seed credentials
    if (email === 'admin@foaglobal.org' && password === 'Admin@12345') {
      return json({
        success: true,
        data: {
          user: {
            id: 'admin-001',
            email: 'admin@foaglobal.org',
            fullName: 'FOA Central Administrator',
            role: 'SUPER_ADMIN'
          },
          token: 'mock-admin-jwt-token-foa-2026'
        },
        message: 'Login successful'
      });
    }

    if (email === 'coordinator@delhipublic.edu' && password === 'School@12345') {
      return json({
        success: true,
        data: {
          user: {
            id: 'coord-001',
            email: 'coordinator@delhipublic.edu',
            fullName: 'Meenakshi Iyer',
            role: 'SCHOOL_COORDINATOR'
          },
          token: 'mock-coordinator-jwt-token-foa-2026'
        },
        message: 'Login successful'
      });
    }

    if (email === 'aarav.sharma@example.com' && password === 'Student@12345') {
      return json({
        success: true,
        data: {
          user: {
            id: 'student-001',
            email: 'aarav.sharma@example.com',
            fullName: 'Aarav Sharma',
            role: 'PARTICIPANT'
          },
          token: 'mock-student-jwt-token-foa-2026'
        },
        message: 'Login successful'
      });
    }

    return json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
    }, 401);
  }

  // 3. Auth: Me
  if (path === '/auth/me') {
    const authHeader = req.headers.authorization || '';
    if (authHeader.includes('admin')) {
      return json({
        success: true,
        data: {
          id: 'admin-001',
          email: 'admin@foaglobal.org',
          fullName: 'FOA Central Administrator',
          role: 'SUPER_ADMIN'
        }
      });
    }
    if (authHeader.includes('coordinator')) {
      return json({
        success: true,
        data: {
          id: 'coord-001',
          email: 'coordinator@delhipublic.edu',
          fullName: 'Meenakshi Iyer',
          role: 'SCHOOL_COORDINATOR',
          schoolMemberships: [
            {
              school: {
                id: 'sch-001',
                name: 'Delhi Public International School, RK Puram',
                code: 'SCH-DEL-1001',
                verificationStatus: 'VERIFIED'
              }
            }
          ]
        }
      });
    }
    return json({
      success: true,
      data: {
        id: 'student-001',
        email: 'aarav.sharma@example.com',
        fullName: 'Aarav Sharma',
        role: 'PARTICIPANT'
      }
    });
  }

  // 4. Competitions
  if (path === '/competitions' || path.startsWith('/competitions/')) {
    const competitions = [
      {
        id: 'comp-001',
        slug: 'national-animal-compassion-art-challenge-2026',
        title: 'National School Drawing Competition: Voices of the Voiceless',
        description: 'Inspiring young artists from schools across the nation to depict empathy, rescue, kindness, and coexistence with domestic and wild animals.',
        animalWelfareTheme: 'Coexistence with Urban Community Animals & Rescue',
        competitionType: 'DRAWING',
        coverImageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80',
        eligibilityRules: 'Students of Grades 1 through 12 divided across Group A (Grades 1-4), Group B (Grades 5-8), and Group C (Grades 9-12).',
        rules: 'Artwork must be original, on standard A3/A4 drawing sheet. Mediums permitted: Watercolors, crayons, color pencils, acrylics.',
        physicalArtworkRequired: 'TOP_SHORTLISTED_ONLY',
        prizes: 'National Gold Trophy + Certificate of Merit + Artwork Listed in Fundraising Auction',
        regStartDate: '2026-10-01T00:00:00.000Z',
        regEndDate: '2026-12-15T00:00:00.000Z',
        submissionStartDate: '2026-10-15T00:00:00.000Z',
        submissionEndDate: '2026-12-20T00:00:00.000Z',
        status: 'REGISTRATION_OPEN'
      }
    ];

    if (method === 'POST') {
      return json({ success: true, message: 'Competition created/published successfully' });
    }

    if (path.includes('national-animal-compassion-art-challenge-2026') || path.includes('comp-001')) {
      return json({ success: true, data: competitions[0] });
    }

    return json({ success: true, data: competitions });
  }

  // 5. Gallery
  if (path === '/gallery' || path.startsWith('/gallery/')) {
    const items = [
      {
        id: 'art-001',
        submissionNumber: 'FOA-2026-SUB-10492',
        title: 'A Warm Corner: Shelter in the Rain',
        description: 'An evocative watercolor piece showing a schoolchild sharing an umbrella with a stray puppy during monsoon.',
        artistStatement: 'Every animal feels fear and cold just like us. If we have kindness in our hearts, there is always room under our umbrella.',
        category: 'Group B (Grades 5-8)',
        finalRank: 'National Gold 1st Prize',
        schoolRank: 1,
        participant: { fullName: 'Aarav Sharma' },
        school: { name: 'Delhi Public International School, RK Puram', city: 'New Delhi', state: 'Delhi' },
        assets: [{ id: 'ass-1', fileUrl: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&w=800&q=80', assetType: 'PREVIEW' }],
        auctionListing: {
          id: 'auc-001',
          currentPrice: 5000,
          status: 'ACTIVE'
        }
      }
    ];

    if (path.length > 9) {
      return json({ success: true, data: items[0] });
    }
    return json({ success: true, data: items });
  }

  // 6. Auctions
  if (path === '/auctions' || path.startsWith('/auctions/')) {
    const auctions = [
      {
        id: 'auc-001',
        title: 'Original Artwork: "A Warm Corner: Shelter in the Rain"',
        story: 'By Aarav Sharma (Grade 7). Proceeds fund medical treatment for community dogs in rescue shelters.',
        startingPrice: 3500,
        currentPrice: 5000,
        status: 'ACTIVE',
        endsAt: '2026-12-30T00:00:00.000Z',
        submission: {
          title: 'A Warm Corner: Shelter in the Rain',
          category: 'Group B (Grades 5-8)',
          artistStatement: 'There is always room under our umbrella.',
          participant: { fullName: 'Aarav Sharma' },
          assets: [{ fileUrl: 'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&w=800&q=80' }]
        },
        bids: [
          { id: 'b-1', amount: 5000, createdAt: new Date().toISOString() },
          { id: 'b-2', amount: 4500, createdAt: new Date().toISOString() }
        ]
      }
    ];

    if (method === 'POST') {
      const { amount } = req.body || {};
      return json({ success: true, message: `Bid of ₹${amount} placed successfully!` });
    }

    if (path.length > 10) {
      return json({ success: true, data: auctions[0] });
    }
    return json({ success: true, data: auctions });
  }

  // 7. Donations
  if (path === '/donations' && method === 'POST') {
    return json({
      success: true,
      message: 'Donation recorded successfully. Thank you for championing animal compassion!'
    });
  }

  // 8. Admin Overview
  if (path === '/admin/overview') {
    return json({
      success: true,
      data: {
        counts: {
          totalCompetitions: 3,
          draftCompetitions: 1,
          activeCompetitions: 2,
          totalSchools: 18,
          pendingSchools: 2,
          totalSubmissions: 142,
          pendingReviews: 12,
          shortlistedSubmissions: 28,
          approvedSubmissions: 15,
          totalDonationsAmount: 85000,
          donationsCount: 34
        },
        recentSubmissions: [
          {
            id: 'sub-1',
            title: 'Kindness in the Alley',
            submissionNumber: 'FOA-2026-SUB-10511',
            participant: { fullName: 'Rhea Sen' },
            school: { name: 'DPS RK Puram' }
          }
        ],
        recentAuditLogs: [
          {
            id: 'log-1',
            action: 'COMPETITION_PUBLISHED',
            user: { fullName: 'FOA Central Administrator' },
            createdAt: new Date().toISOString()
          }
        ]
      }
    });
  }

  // 9. Schools list
  if (path === '/schools') {
    if (method === 'POST') {
      return json({ success: true, message: 'School registration submitted for verification review' });
    }
    return json({
      success: true,
      data: [
        {
          id: 'sch-001',
          code: 'SCH-DEL-1001',
          name: 'Delhi Public International School, RK Puram',
          city: 'New Delhi',
          state: 'Delhi',
          authorizedPersonName: 'Meenakshi Iyer',
          authorizedPersonEmail: 'coordinator@delhipublic.edu',
          verificationStatus: 'VERIFIED'
        },
        {
          id: 'sch-002',
          code: 'SCH-MUM-2002',
          name: 'St. Xavier High School, Fort',
          city: 'Mumbai',
          state: 'Maharashtra',
          authorizedPersonName: 'Vikram Joshi',
          authorizedPersonEmail: 'vikram.joshi@stxaviers.edu',
          verificationStatus: 'PENDING'
        }
      ]
    });
  }

  // 10. Submissions list
  if (path === '/submissions') {
    if (method === 'POST') {
      const randomSeq = Math.floor(10000 + Math.random() * 90000);
      return json({
        success: true,
        submissionNumber: `FOA-2026-SUB-${randomSeq}`,
        message: 'Submission registered successfully!'
      });
    }
    return json({
      success: true,
      data: [
        {
          id: 'sub-1',
          submissionNumber: 'FOA-2026-SUB-10492',
          title: 'A Warm Corner: Shelter in the Rain',
          category: 'Group B (Grades 5-8)',
          status: 'APPROVED',
          participant: { fullName: 'Aarav Sharma' },
          school: { name: 'DPS RK Puram' }
        }
      ]
    });
  }

  // 11. Certificates
  if (path.startsWith('/certificates/verify/')) {
    const certNum = path.replace('/certificates/verify/', '');
    return json({
      success: true,
      data: {
        certificateNumber: certNum,
        recipientName: 'Aarav Sharma',
        awardTitle: 'National 1st Prize Winner',
        category: 'Group B (Grades 5-8)',
        competitionTitle: 'National School Drawing Competition: Voices of the Voiceless',
        issueDate: '2026-10-21T00:00:00.000Z',
        verified: true
      }
    });
  }

  if (path === '/certificates/my-certificates') {
    return json({
      success: true,
      data: [
        {
          id: 'cert-1',
          certificateNumber: 'FOA-CERT-2026-10492',
          type: 'WINNER',
          awardTitle: 'National 1st Prize Winner',
          competition: { title: 'National School Drawing Competition: Voices of the Voiceless' }
        }
      ]
    });
  }

  // Default fallback
  return json({ success: true, message: 'OK' });
}
