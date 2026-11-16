import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/Home';
import { CompetitionsPage } from './pages/Competitions';
import { CompetitionDetailPage } from './pages/CompetitionDetail';
import { GalleryPage } from './pages/Gallery';
import { ArtworkDetailPage } from './pages/ArtworkDetail';
import { AuctionsPage } from './pages/Auctions';
import { AuctionDetailPage } from './pages/AuctionDetail';
import { DonatePage } from './pages/Donate';
import { AboutPage } from './pages/About';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { VerifyCertificatePage } from './pages/VerifyCertificate';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SchoolDashboard } from './pages/SchoolDashboard';
import { ParticipantDashboard } from './pages/ParticipantDashboard';
import { StaticInfoPage } from './pages/StaticInfoPage';

// Protected Route wrappers
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-10 text-center text-slate-500">Checking credentials...</div>;
  if (!user || !['SUPER_ADMIN', 'FOA_ADMIN', 'COMPETITION_MANAGER'].includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const ProtectedSchoolRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-10 text-center text-slate-500">Checking credentials...</div>;
  if (!user || !['SCHOOL_COORDINATOR', 'TEACHER', 'SUPER_ADMIN'].includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const ProtectedParticipantRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-10 text-center text-slate-500">Checking credentials...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Core Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/competitions" element={<CompetitionsPage />} />
              <Route path="/competitions/:slug" element={<CompetitionDetailPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/gallery/:id" element={<ArtworkDetailPage />} />
              <Route path="/auctions" element={<AuctionsPage />} />
              <Route path="/auctions/:id" element={<AuctionDetailPage />} />
              <Route path="/donate" element={<DonatePage />} />
              <Route path="/verify/:certificateNumber" element={<VerifyCertificatePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Informational Ecosystem Pages */}
              <Route
                path="/animal-welfare"
                element={
                  <StaticInfoPage
                    tag="Awareness & Education"
                    title="Animal Welfare Guidelines for Young People"
                    subtitle="Fostering kindness, safe street coexistence, and humane attitudes towards all living beings."
                    content="Friends of Animals creates interactive curriculum modules, school assembly presentations, and creative workshops focused on preventing cruelty, reporting injured animals, and understanding urban wildlife."
                    items={[
                      { title: "Summer Water Pots", desc: "Setting up clean clay water pots for birds and community dogs in summer heat." },
                      { title: "First-Aid for Injured Stray Animals", desc: "Safe rescue protocols, contacting local animal ambulances, and basic care." },
                      { title: "Anti-Cruelty Education", desc: "Teaching empathy, understanding animal emotions, and responsible pet ownership." },
                      { title: "Coexistence in Urban India", desc: "De-escalating street dog conflicts through sterilization, vaccination, and food." }
                    ]}
                  />
                }
              />
              <Route
                path="/community"
                element={
                  <StaticInfoPage
                    tag="Community Network"
                    title="FOA Youth & Volunteer Movement"
                    subtitle="Converting one-time competition entrants into a lifelong community of animal advocates."
                    content="Our community connects student artists, teachers, veterinary doctors, foster parents, and rescuers across India. We organize campus awareness campaigns, local rescue drives, and creative art exhibitions."
                    items={[
                      { title: "Campus Chapters", desc: "Start an FOA Compassion Club in your school or college campus." },
                      { title: "Young Ambassadors", desc: "Leadership opportunities for competition winners to lead outreach drives." }
                    ]}
                  />
                }
              />
              <Route
                path="/volunteer"
                element={
                  <StaticInfoPage
                    tag="Get Involved"
                    title="Volunteer for Animal Welfare"
                    subtitle="Contribute your skills in technology, artwork curation, community outreach, and school coordination."
                    content="We welcome passionate students, educators, and professionals to join our nationwide volunteer circle. Help coordinate school drawing challenges, assist in physical artwork logistics, or photograph local rescued animals."
                  />
                }
              />
              <Route
                path="/organizations"
                element={
                  <StaticInfoPage
                    tag="Rescuer Network"
                    title="Animal Welfare NGO Directory"
                    subtitle="A structured, searchable registry of animal shelters, mobile rescue vans, and veterinary care centers."
                    content="FOA collaborates with verified grassroots animal welfare non-profits across India. All fundraising auctions and donation campaigns channel assistance to these verified partners."
                  />
                }
              />
              <Route
                path="/impact"
                element={
                  <StaticInfoPage
                    tag="Transparency"
                    title="Measured Impact & Governance"
                    subtitle="Transparent reporting on schools engaged, young artists recognized, and animal medical cases funded."
                    content="FOA publishes audited utilization reports. All auction proceeds directly benefit animal rescue, sterilization, emergency medical kits, and educational workshops."
                  />
                }
              />
              <Route
                path="/events"
                element={
                  <StaticInfoPage
                    tag="Campaigns"
                    title="Upcoming Events & Exhibitions"
                    subtitle="Art exhibitions, awareness workshops, and fundraising auctions in major cities."
                    content="Join us for physical exhibitions of winning student artworks, panel discussions on urban animal welfare, and live charity galas."
                  />
                }
              />
              <Route
                path="/stories"
                element={
                  <StaticInfoPage
                    tag="Inspiration"
                    title="Rescue Stories & Creative Journeys"
                    subtitle="Heartwarming journeys of rescued animals and the young artists who championed them."
                    content="Read real stories of street dogs, injured calves, and urban birds who received life-saving surgery thanks to funds raised through student art competitions."
                  />
                }
              />
              <Route
                path="/contact"
                element={
                  <StaticInfoPage
                    tag="Get in Touch"
                    title="Contact Friends of Animals"
                    subtitle="We are eager to partner with schools, colleges, donors, and animal welfare organizations."
                    content="Send your queries regarding school registrations, art submissions, or auction listings to contact@foaglobal.org or reach our central coordinator office in New Delhi."
                  />
                }
              />
              <Route
                path="/privacy"
                element={
                  <StaticInfoPage
                    tag="Legal Notice"
                    title="Privacy Policy & Minor Safeguarding"
                    subtitle="Placeholder policy subject to formal organizational review."
                    content="Friends of Animals is strictly committed to protecting the privacy of child participants. We never publish phone numbers, residential addresses, or dates of birth of minor students on public web pages. All public exhibitions require parental or legal guardian consent."
                  />
                }
              />
              <Route
                path="/terms"
                element={
                  <StaticInfoPage
                    tag="Terms & Conditions"
                    title="Platform Terms of Service"
                    subtitle="Terms governing participation, artwork submission, and auction bidding."
                    content="All competition entries must be original works. By entering, guardians grant FOA non-exclusive rights to showcase artwork in digital galleries and list verified physical pieces in charity fundraising auctions."
                  />
                }
              />

              {/* Protected Dashboards */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/school-dashboard/*"
                element={
                  <ProtectedSchoolRoute>
                    <SchoolDashboard />
                  </ProtectedSchoolRoute>
                }
              />
              <Route
                path="/participant-dashboard/*"
                element={
                  <ProtectedParticipantRoute>
                    <ParticipantDashboard />
                  </ProtectedParticipantRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
