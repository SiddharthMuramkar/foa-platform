import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('FOA Platform Backend API Integration Tests', () => {
  let adminToken: string;
  let participantToken: string;
  let testCompetitionId: string;

  beforeAll(async () => {
    // 1. Log in as Super Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@foaglobal.org',
        password: 'Admin@12345'
      });

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
    expect(adminRes.body.data.user.role).toBe('SUPER_ADMIN');
    adminToken = adminRes.body.data.token;

    // 2. Log in as Participant
    const partRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'aarav.sharma@example.com',
        password: 'Student@12345'
      });

    expect(partRes.status).toBe(200);
    participantToken = partRes.body.data.token;
  });

  it('Healthcheck returns healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('Rejects unauthorized users from creating competitions', async () => {
    const res = await request(app)
      .post('/api/v1/competitions')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({
        title: 'Unauthorized Art Challenge',
        slug: 'unauthorized-challenge',
        description: 'Testing RBAC',
        animalWelfareTheme: 'Kindness',
        competitionType: 'DRAWING',
        regStartDate: new Date().toISOString(),
        regEndDate: new Date(Date.now() + 86400000).toISOString(),
        submissionStartDate: new Date().toISOString(),
        submissionEndDate: new Date(Date.now() + 86400000).toISOString()
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('Allows Admin to create a draft competition with date validation', async () => {
    const now = new Date();
    const res = await request(app)
      .post('/api/v1/competitions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Wild Birds & Community Feeder Art Fest 2026',
        slug: `wild-birds-art-fest-${Date.now()}`,
        description: 'Drawing and craft contest celebrating avian biodiversity in cities.',
        animalWelfareTheme: 'Water and grain pots for thirsty summer birds',
        competitionType: 'DRAWING',
        regStartDate: new Date(now.getTime() + 86400000).toISOString(),
        regEndDate: new Date(now.getTime() + 10 * 86400000).toISOString(),
        submissionStartDate: new Date(now.getTime() + 2 * 86400000).toISOString(),
        submissionEndDate: new Date(now.getTime() + 15 * 86400000).toISOString(),
        status: 'DRAFT'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DRAFT');
    testCompetitionId = res.body.data.id;
  });

  it('Allows Admin to publish the competition and confirms it becomes live', async () => {
    const res = await request(app)
      .post(`/api/v1/competitions/${testCompetitionId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it appears in public list
    const publicList = await request(app).get('/api/v1/competitions');
    expect(publicList.status).toBe(200);
    const found = publicList.body.data.find((c: any) => c.id === testCompetitionId);
    expect(found).toBeDefined();
  });

  it('Protects minors privacy: Gallery excludes minor private contact info', async () => {
    const galleryRes = await request(app).get('/api/v1/gallery');
    expect(galleryRes.status).toBe(200);
    expect(galleryRes.body.success).toBe(true);
    if (galleryRes.body.data.length > 0) {
      const item = galleryRes.body.data[0];
      expect(item.participant.fullName).toBeDefined();
      expect(item.participant.email).toBeUndefined();
      expect(item.participant.phone).toBeUndefined();
    }
  });

  it('Allows public certificate verification via unique serial number', async () => {
    const certRes = await request(app).get('/api/v1/certificates/verify/FOA-CERT-2026-10492');
    expect(certRes.status).toBe(200);
    expect(certRes.body.success).toBe(true);
    expect(certRes.body.data.recipientName).toBe('Aarav Sharma');
    expect(certRes.body.data.verified).toBe(true);
  });
});
