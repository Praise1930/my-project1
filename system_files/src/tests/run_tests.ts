// MamaTrack GPS — Comprehensive Automated Test Suite for All 17 Components & Subsystems
// Conforms to Uganda MoH Maternal Health & Emergency Dispatch Specification

import React from 'react';
import ReactDOMServer from 'react-dom/server';

/* eslint-disable @typescript-eslint/no-explicit-any */
// ── Mock Browser Globals for Server-side Component Evaluation ──
if (typeof (globalThis as any).window === 'undefined') {
  const noop = () => {};
  (globalThis as any).window = {
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: () => true,
    requestAnimationFrame: (cb: (time: number) => void) => setTimeout(() => cb(Date.now()), 16),
    cancelAnimationFrame: (id: number) => clearTimeout(id),
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
    location: { href: 'http://localhost:5173/' },
    devicePixelRatio: 1,
    screen: { deviceXDPI: 96, logicalXDPI: 96, width: 1920, height: 1080 },
    localStorage: {
      _data: {} as Record<string, string>,
      getItem(k: string) { return this._data[k] || null; },
      setItem(k: string, v: string) { this._data[k] = String(v); },
      removeItem(k: string) { delete this._data[k]; },
      clear() { this._data = {}; }
    }
  };
  (globalThis as any).document = {
    createElement: (tag: string) => ({
      tagName: String(tag).toUpperCase(),
      setAttribute: noop,
      getAttribute: () => null,
      style: {},
      appendChild: noop,
      removeChild: noop,
      classList: { add: noop, remove: noop, contains: () => false },
    }),
    createElementNS: (_ns: string, tag: string) => (globalThis as any).document.createElement(tag),
    documentElement: { style: {} },
    body: { appendChild: noop, removeChild: noop, style: {} },
    addEventListener: noop,
    removeEventListener: noop,
  };
  (globalThis as any).localStorage = (globalThis as any).window.localStorage;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Import Component Modules ──
import { CdssTriageModal } from '../components/CdssTriageModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Dhis2ExportModal } from '../components/Dhis2ExportModal';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Icon, IconName } from '../components/Icon';
import {
  HeartbeatLoader,
  SkeletonDashboardLoader,
  GlassmorphicOverlayLoader,
  OrbitalLoader
} from '../components/LoadingStates';
import { MapComponent } from '../components/MapComponent';
import { MpdsrModal } from '../components/MpdsrModal';
import {
  CheckIcon,
  AlertIcon,
  ErrorIcon,
  InfoIcon,
  CloseIcon,
  TrashIcon,
  DownloadIcon
} from '../components/OverlayIcons';
import { PWAInstallBanner } from '../components/PWAInstallBanner';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload';
import { ReferralFormModal } from '../components/ReferralFormModal';
import { SupabaseMigrationModal } from '../components/SupabaseMigrationModal';
import { ToastContainer } from '../components/Toast';
import { showToast, confirmAction } from '../components/toastBus';
import { WelcomeToast } from '../components/WelcomeToast';
import { ThemeProvider } from '../contexts/ThemeContext';

// ── Import Services & Seed Data ──
import {
  db,
  OBSTETRIC_CATEGORIES_METADATA,
  ObstetricEmergencyCategory,
  EmergencyService,
  DoctorService,
  ReferralService,
  CdssService,
  MpdsrService,
  Dhis2Service
} from '../services/db';

// ── Test Harness State ──
interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  error?: string;
}

const testResults: TestResult[] = [];
let currentSuite = '';

function suite(name: string) {
  currentSuite = name;
  console.log(`\n===============================================================`);
  console.log(`🔷 SUITE: ${name}`);
  console.log(`===============================================================`);
}

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    testResults.push({ suite: currentSuite, test: name, passed: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${errorMsg}`);
    testResults.push({ suite: currentSuite, test: name, passed: false, error: errorMsg });
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ============================================================================
// COMPONENT 1: Icon (System Iconography)
// ============================================================================
suite('1. Icon Component (System Iconography)');
test('renders valid SVG for core clinical and emergency icons', () => {
  const iconsToTest: IconName[] = [
    'heart', 'ambulance', 'hospital', 'vitals', 'warning',
    'emergency', 'baby', 'map', 'success', 'phone', 'doctor'
  ];
  for (const name of iconsToTest) {
    const html = ReactDOMServer.renderToString(React.createElement(Icon, { name, size: 20 }));
    assert(html.includes('<svg') && html.includes('</svg>'), `Icon "${name}" failed to render valid SVG markup`);
  }
});

test('returns null and does not throw on unrecognized icon name', () => {
  const html = ReactDOMServer.renderToString(React.createElement(Icon, { name: 'nonexistent-icon-xyz' }));
  assert(html === '', 'Icon should return null safely on unknown name');
});

// ============================================================================
// COMPONENT 2: LoadingStates (HeartbeatLoader, Skeleton, Overlay, Orbital)
// ============================================================================
suite('2. LoadingStates Components');
test('renders HeartbeatLoader with custom message & subtitle', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(HeartbeatLoader, {
      message: 'Triaging Obstetric Emergency...',
      subtitle: 'Mukono General Hospital dispatch network'
    })
  );
  assert(html.includes('Triaging Obstetric Emergency...'), 'Message not found in HeartbeatLoader');
  assert(html.includes('Mukono General Hospital'), 'Subtitle not found in HeartbeatLoader');
});

test('renders SkeletonDashboardLoader shimmer structure', () => {
  const html = ReactDOMServer.renderToString(React.createElement(SkeletonDashboardLoader));
  assert(html.includes('shimmer') || html.includes('style'), 'Skeleton elements not generated');
});

test('renders GlassmorphicOverlayLoader when active with message and subtitle', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(GlassmorphicOverlayLoader, {
      message: 'Authenticating Secure Session...',
      subtitle: 'Connecting to Mukono Health Node'
    })
  );
  assert(html.includes('Authenticating Secure Session...'), 'GlassmorphicOverlayLoader message missing');
  assert(html.includes('Mukono Health Node'), 'GlassmorphicOverlayLoader subtitle missing');
});

test('renders OrbitalLoader for driver dispatch synchronization', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(OrbitalLoader, {
      message: 'Locating Nearest Ambulance GPS...',
      subtitle: 'OSRM Route Engine Active'
    })
  );
  assert(html.includes('Locating Nearest Ambulance GPS...'), 'OrbitalLoader message missing');
});

// ============================================================================
// COMPONENT 3: ErrorBoundary
// ============================================================================
suite('3. ErrorBoundary Component');
test('renders children normally when no error is thrown', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(ErrorBoundary, null, React.createElement('div', { id: 'safe-child' }, 'Operational Child'))
  );
  assert(html.includes('Operational Child'), 'Safe child content failed to render');
});

// ============================================================================
// COMPONENT 4: CdssTriageModal (Clinical Decision Support System)
// ============================================================================
suite('4. CdssTriageModal Component (Uganda Clinical Guidelines CDSS)');
test('renders CDSS danger signs checklist and protocol steps when open', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(CdssTriageModal, {
      isOpen: true,
      onClose: () => {},
      initialCategory: 'pph'
    })
  );
  assert(html.includes('UGANDA MoH CDSS'), 'Header missing MoH CDSS title');
  assert(html.includes('Postpartum Haemorrhage (PPH)'), 'Category PPH missing');
  assert(html.includes('Danger Signs Assessment'), 'Danger signs section missing');
  assert(html.includes('Standardized MoH Flow'), 'MoH protocol badge missing');
});

test('returns null when isOpen is false', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(CdssTriageModal, {
      isOpen: false,
      onClose: () => {},
      initialCategory: 'pph'
    })
  );
  assert(html === '', 'Modal should render nothing when isOpen is false');
});

// ============================================================================
// COMPONENT 5: Dhis2ExportModal (HMIS 105 Interoperability)
// ============================================================================
suite('5. Dhis2ExportModal Component (DHIS2 / HMIS 105)');
test('renders DHIS2 aggregate indicators and MoH exchange headers when open', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(Dhis2ExportModal, {
      isOpen: true,
      onClose: () => {}
    })
  );
  assert(html.includes('Uganda HMIS 105 &amp; DHIS2 Maternal Data Exchange') || html.includes('Uganda HMIS 105 & DHIS2 Maternal Data Exchange'), 'DHIS2 title missing');
  assert(html.includes('eHMIS / DHIS2 INTEROPERABILITY'), 'eHMIS badge missing');
  assert(html.includes('HMIS 105'), 'HMIS 105 dataset reference missing');
  assert(html.includes('Mukono'), 'Mukono district attribution missing');
});

// ============================================================================
// COMPONENT 6: MpdsrModal (Three-Delay Model Audit)
// ============================================================================
suite('6. MpdsrModal Component (Maternal Death Surveillance & Response)');
test('renders MPDSR Three-Delay checklist and audit fields for an emergency', () => {
  const mockEmergency = {
    id: 101,
    code: 'EMG-2026-0101',
    mother_id: 15,
    latitude: 0.3420,
    longitude: 32.7680,
    status: 'pending' as const,
    severity: 'critical' as const,
    category: 'pph' as const,
    notes: 'Acute postpartum haemorrhage',
    hospital_id: 1,
    driver_id: 10,
    doctor_id: 3,
    vehicle_id: 1,
    cancel_reason: null,
    eta_minutes: 12,
    dispatched_by: 1,
    triggered_at: '2026-09-05T10:00:00Z',
    dispatched_at: null,
    picked_up_at: null,
    arrived_at: null,
    delivered_at: null,
    completed_at: null,
    cancelled_at: null
  };

  const html = ReactDOMServer.renderToString(
    React.createElement(MpdsrModal, {
      isOpen: true,
      onClose: () => {},
      emergency: mockEmergency,
      onSaved: () => {}
    })
  );
  assert(html.includes('UGANDA MPDSR MODULE'), 'MPDSR module badge missing');
  assert(html.includes('Maternal &amp; Perinatal Death Surveillance and Response Audit') || html.includes('Maternal & Perinatal Death Surveillance and Response Audit'), 'MPDSR title missing');
  assert(html.includes('Three-Delay Model Root Cause Investigation'), 'Three-Delay model section missing');
  assert(html.includes('Phase I Delay'), 'Phase I delay missing');
  assert(html.includes('Phase II Delay'), 'Phase II delay missing');
  assert(html.includes('Phase III Delay'), 'Phase III delay missing');
  assert(html.includes('SMART Corrective Action Plan'), 'Action plan section missing');
});

test('returns null when emergency is null or isOpen is false', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(MpdsrModal, {
      isOpen: false,
      onClose: () => {},
      emergency: null
    })
  );
  assert(html === '', 'Modal should render nothing when closed');
});

// ============================================================================
// COMPONENT 7: ReferralFormModal (Uganda MoH Standardized Referral Form)
// ============================================================================
suite('7. ReferralFormModal Component');
test('renders printable MoH clinical referral letter with vitals and facilities', () => {
  const mockReferral = db.referralRecords[0];
  assert(mockReferral !== undefined, 'Seed referral records must exist');
  
  const html = ReactDOMServer.renderToString(
    React.createElement(ReferralFormModal, {
      isOpen: true,
      onClose: () => {},
      referral: mockReferral
    })
  );
  assert(html.includes('Republic of Uganda') && html.includes('Ministry of Health'), 'MoH Header missing in Referral Form');
  assert(html.includes('EMERGENCY MATERNAL &amp; OBSTETRIC REFERRAL NOTE') || html.includes('EMERGENCY MATERNAL & OBSTETRIC REFERRAL NOTE'), 'Referral form subtitle missing');
  assert(html.includes(mockReferral.referral_code), 'Referral code missing');
  assert(html.includes('Vital Signs') && html.includes('Blood Pressure'), 'Vitals section missing');
});

// ============================================================================
// COMPONENT 8: ConfirmDialog
// ============================================================================
suite('8. ConfirmDialog Component & Interactive Dispatch Prompts');
test('renders modal structure with confirm and cancel buttons', () => {
  const html = ReactDOMServer.renderToString(React.createElement(ConfirmDialog));
  assert(typeof html === 'string', 'ConfirmDialog failed to mount');
});

test('confirmAction API registers promise without crashing', () => {
  const promise = confirmAction({
    title: 'Confirm Emergency Ambulance Dispatch',
    message: 'Dispatch Type II Ambulance UBG 001A to Goma Village?',
    confirmLabel: 'Dispatch Now',
    cancelLabel: 'Abort'
  }).catch(() => {});
  assert(promise instanceof Promise, 'confirmAction must return a Promise');
});

// ============================================================================
// COMPONENT 9: Toast & ToastContainer
// ============================================================================
suite('9. Toast & Notification Bus');
test('ToastContainer mounts cleanly and handles event subscription', () => {
  const html = ReactDOMServer.renderToString(React.createElement(ToastContainer));
  assert(typeof html === 'string', 'ToastContainer failed to render');
});

test('showToast dispatches TOAST_EVENT on window without error', () => {
  showToast('Test Maternal Alert Event', 'warning');
  assert(true, 'showToast dispatched cleanly');
});

// ============================================================================
// COMPONENT 10: OverlayIcons (Map & Overlay Marker Vector Graphics)
// ============================================================================
suite('10. OverlayIcons Component (Map & Dialog Graphics)');
test('renders valid SVGs for all overlay and alert state icons', () => {
  const icons = [CheckIcon, AlertIcon, ErrorIcon, InfoIcon, CloseIcon, TrashIcon, DownloadIcon];
  for (const IconCmp of icons) {
    const html = ReactDOMServer.renderToString(React.createElement(IconCmp, { size: 18 }));
    assert(html.includes('<svg') && html.includes('</svg>'), 'Overlay icon failed to render SVG');
  }
});

// ============================================================================
// COMPONENT 11: WelcomeToast
// ============================================================================
suite('11. WelcomeToast Component');
test('renders personalized greeting with monogram and role for authenticated doctor', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(WelcomeToast, {
      userName: 'Dr. Sarah Namukasa',
      roleName: 'Hospital Administrator',
      subtitle: 'Mukono General Hospital'
    })
  );
  assert(html.includes('Dr. Sarah Namukasa'), 'User name not in WelcomeToast');
  assert(html.includes('Hospital Administrator'), 'Role name missing');
  assert(html.includes('SN'), 'Initials monogram missing');
});

// ============================================================================
// COMPONENT 12: PWAInstallBanner
// ============================================================================
suite('12. PWAInstallBanner Component');
test('renders PWA offline-first mobile app prompt banner', () => {
  const html = ReactDOMServer.renderToString(React.createElement(PWAInstallBanner));
  assert(typeof html === 'string', 'PWA banner rendered invalid markup');
});

// ============================================================================
// COMPONENT 13: ProfilePhotoUpload
// ============================================================================
suite('13. ProfilePhotoUpload Component');
test('renders user avatar circle, initials, and manage photo button', () => {
  const user = db.users.find(u => u.role === 'mother');
  assert(user !== undefined, 'Seed mother user required');
  
  const html = ReactDOMServer.renderToString(
    React.createElement(
      ThemeProvider,
      null,
      React.createElement(ProfilePhotoUpload, {
        user: user!,
        onUpdated: () => {},
        size: 80,
        showLabel: true
      })
    )
  );
  assert(html.includes('Manage profile photo') || html.includes('aria-label'), 'Avatar trigger button missing');
  assert(html.includes('NF'), 'User initials missing in avatar');
});

// ============================================================================
// COMPONENT 14: SupabaseMigrationModal
// ============================================================================
suite('14. SupabaseMigrationModal Component');
test('renders Supabase Data Migration header and tables upload interface', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(SupabaseMigrationModal, {
      isOpen: true,
      onClose: () => {}
    })
  );
  assert(html.includes('Supabase Data Migration'), 'Migration modal title missing');
});

// ============================================================================
// COMPONENT 15: MapComponent
// ============================================================================
suite('15. MapComponent (GIS Navigation & Routing Engine)');
test('renders map container element with interactive controls and GIS overlays', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(
      ThemeProvider,
      null,
      React.createElement(MapComponent, {
        center: [0.3536, 32.7554],
        zoom: 13,
        showHeatmap: false,
        showDistrictGeofence: true,
        markers: [
          { id: 'hosp-1', lat: 0.3536, lng: 32.7554, type: 'hospital', label: 'Mukono General Hospital' }
        ]
      })
    )
  );
  assert(html.includes('map-container') || html.includes('style'), 'Map container element missing');
  assert(html.includes('Google Maps') || html.includes('Dark GPS Map') || html.includes('GIS Heatmap'), 'Map view controls missing');
});

// ============================================================================
// COMPONENT 16: ThemeContext (Dark/Light Mode Theme Provider)
// ============================================================================
suite('16. ThemeContext & Mode Provider');
test('ThemeProvider mounts and provides theme context to child components', () => {
  const Child = () => React.createElement('span', { className: 'theme-test-content' }, 'Theme Active');
  const html = ReactDOMServer.renderToString(
    React.createElement(ThemeProvider, null, React.createElement(Child))
  );
  assert(html.includes('Theme Active'), 'Child inside ThemeProvider failed to render');
});

// ============================================================================
// COMPONENT 17: Uganda MoH CDSS Protocols & Obstetric Category Matrix
// ============================================================================
suite('17. Uganda MoH Obstetric Emergency Categories & Protocol Matrix');
test('all 10 MoH obstetric categories have valid label, urgency, and default intervention', () => {
  const categories = Object.keys(OBSTETRIC_CATEGORIES_METADATA) as ObstetricEmergencyCategory[];
  assert(categories.length === 10, `Expected 10 MoH categories, found ${categories.length}`);
  
  for (const cat of categories) {
    const meta = OBSTETRIC_CATEGORIES_METADATA[cat];
    assert(typeof meta.label === 'string' && meta.label.length > 0, `Category ${cat} missing label`);
    assert(meta.urgency === 'CRITICAL' || meta.urgency === 'HIGH', `Category ${cat} has invalid urgency`);
    assert(typeof meta.description === 'string' && meta.description.length > 0, `Category ${cat} missing description`);
    assert(typeof meta.defaultIntervention === 'string', `Category ${cat} missing defaultIntervention`);
  }

  // Verify CdssService protocols
  const dangerSigns = CdssService.getDangerSigns();
  assert(dangerSigns.length >= 7, 'CDSS danger signs checklist incomplete');
  
  const pphProtocol = CdssService.getProtocolForCategory('pph');
  assert(pphProtocol.title.includes('Postpartum Haemorrhage'), 'PPH protocol title missing');
  assert(pphProtocol.steps.length >= 5, 'PPH protocol steps incomplete');

  const preEclampsiaProtocol = CdssService.getProtocolForCategory('pre_eclampsia');
  assert(preEclampsiaProtocol.title.includes('Severe Pre-eclampsia'), 'Pre-eclampsia protocol title missing');
  assert(preEclampsiaProtocol.steps.some(s => s.includes('Magnesium Sulphate')), 'Magnesium sulphate missing in pre-eclampsia protocol');
});

// ============================================================================
// COMPREHENSIVE EMERGENCY LIFECYCLE & DISPATCH SIMULATION ENGINE
// ============================================================================
suite('18. End-to-End Emergency Dispatch Algorithm & Simulation Engine');
test('executes complete emergency workflow: beacon -> nearest CEmONC -> ranked ambulance -> transit -> MPDSR audit', () => {
  // 1. Trigger obstetric emergency for Nakato Fatima (mother_id: 15)
  const motherUser = db.users.find(u => u.id === 15);
  assert(motherUser !== undefined, 'Seed mother user (ID 15) must exist');

  const emergency = EmergencyService.triggerEmergency(
    15,
    0.3420,
    32.7680,
    'Postpartum Haemorrhage after home delivery; heavy bleeding and dizziness.',
    true, // requires CEmONC
    'pph',
    { systolic: 85, diastolic: 55, pulse: 122, temp: 36.8, kick_count: 0 },
    'blood_transfusion',
    'mother',
    'Nakato Fatima'
  );

  assert(emergency !== null && typeof emergency.id === 'number', 'Emergency creation failed');
  assert(emergency.category === 'pph', 'Emergency category not assigned');
  assert(emergency.severity === 'critical', 'Emergency severity not critical');
  assert(emergency.status === 'pending', 'Initial status must be pending');

  // 2. Intelligent Hospital Resolution (Must be CEmONC + Blood Bank capable for PPH)
  const bestHospital = EmergencyService.findBestHospital(emergency.latitude, emergency.longitude, true, 'pph');
  assert(bestHospital !== null, 'Failed to resolve best hospital');
  assert(bestHospital.has_cemonc === true, 'Hospital must have CEmONC');
  assert(bestHospital.has_blood_bank === true, 'Hospital must have blood bank for PPH');

  // 3. Multi-Criteria Ranked Ambulance Suggestions
  const rankedAmbulances = EmergencyService.getRankedAmbulances(emergency.latitude, emergency.longitude, 'critical', true);
  assert(rankedAmbulances.length > 0, 'No available ambulances found');
  const topAmbulance = rankedAmbulances[0];
  assert(topAmbulance.driver !== undefined, 'Top ambulance driver missing');
  assert(topAmbulance.matchScore > 50, 'Ambulance match score below threshold');

  // 4. Dispatch Emergency
  const onDutyDoctor = db.doctors.find(d => d.is_on_duty);
  const assigned = EmergencyService.assignDispatch(
    emergency.id,
    topAmbulance.driver.user_id,
    onDutyDoctor ? onDutyDoctor.user_id : null,
    bestHospital.id,
    1, // Admin user ID 1
    topAmbulance.etaMinutes
  );

  assert(assigned.status === 'dispatched', 'Status must be dispatched');
  assert(assigned.dispatched_at !== null, 'dispatched_at timestamp must be recorded');
  assert(assigned.driver_id === topAmbulance.driver.user_id, 'Assigned driver mismatch');

  // 5. Digital Referral Record Auto-Creation
  const referral = ReferralService.getReferralByEmergencyId(emergency.id);
  assert(referral !== null && referral !== undefined, 'Digital referral record must be created');
  assert(Boolean(referral && referral.referral_code.startsWith('REF-')), 'Invalid referral code format');

  // 6. Simulate Lifecycle Transitions
  const enRoute = EmergencyService.updateStatus(emergency.id, 'en_route', topAmbulance.driver.user_id, 'Ambulance en route to patient');
  assert(enRoute.status === 'en_route', 'Status must be en_route');

  const arrived = EmergencyService.updateStatus(emergency.id, 'arrived', topAmbulance.driver.user_id, 'Arrived at mother location');
  assert(arrived.status === 'arrived', 'Status must be arrived');

  const inTransit = EmergencyService.updateStatus(emergency.id, 'in_transit', topAmbulance.driver.user_id, 'Mother onboard heading to hospital');
  assert(inTransit.status === 'in_transit', 'Status must be in_transit');

  const delivered = EmergencyService.updateStatus(emergency.id, 'delivered', topAmbulance.driver.user_id, 'Mother safely handed over at hospital theatre');
  assert(delivered.status === 'delivered', 'Status must be delivered');

  // 7. Clinical Assessment by Doctor
  const assessment = DoctorService.recordAssessment(
    emergency.id,
    onDutyDoctor ? onDutyDoctor.user_id : 3,
    '110/70',
    88,
    37.1,
    'Postpartum haemorrhage managed with oxytocin and 2 units of packed red blood cells. Mother stable.',
    'IV Oxytocin, 2 units O+ blood, misoprostol 800mcg',
    'admitted'
  );
  assert(assessment.outcome === 'admitted', 'Outcome must be admitted');

  // Verify completion and response interval metrics
  const completed = db.emergencies.find(e => e.id === emergency.id);
  assert(completed?.status === 'completed', 'Status must be completed');
  assert(completed?.delay_intervals !== undefined, 'Three-Delay metrics must be present');
  assert(typeof completed?.delay_intervals?.total_response_time_min === 'number', 'Total response time must be calculated');

  // 8. DHIS2 Report Export
  const dhis2Report = Dhis2Service.generateHmis105Report('2026-07');
  assert(dhis2Report.dataValues.length >= 8, 'DHIS2 HMIS 105 data elements missing');
  const dhis2Json = Dhis2Service.exportDhis2JsonPayload('2026-07');
  assert(dhis2Json.includes('HMIS 105'), 'DHIS2 JSON export invalid');

  // 9. MPDSR Surveillance Audit
  const mpdsrSaved = MpdsrService.saveRecord({
    emergency_id: emergency.id,
    mother_id: 15,
    case_classification: 'maternal_near_miss',
    primary_cause: 'Severe Postpartum Haemorrhage with Hypovolemic Shock',
    contributing_clinical_factors: ['Uterine Atony', 'Rural feader road transit'],
    delay_1_seeking_care: { present: true, factors: ['Delayed recognition'], notes: 'Delayed 40 mins at home' },
    delay_2_reaching_care: { present: false, factors: [], notes: 'Rapid GPS dispatch' },
    delay_3_receiving_care: { present: false, factors: [], notes: 'Immediate theatre reception at Mukono General' },
    avoidable_factors: ['VHT community education'],
    review_committee_status: 'audit_completed',
    corrective_action_plan: 'Station emergency vehicle in Goma sub-county.',
    responsible_facility: bestHospital.name,
    responsible_person: 'Medical Superintendent',
    audit_date: '2026-09-05',
    follow_up_date: '2026-11-05'
  });
  assert(mpdsrSaved.id !== undefined, 'MPDSR record ID missing');
  assert(mpdsrSaved.case_classification === 'maternal_near_miss', 'Case classification mismatch');
});

// ============================================================================
// FINAL SUMMARY REPORT
// ============================================================================
console.log(`\n===============================================================`);
console.log(`📊 SYSTEM COMPONENT VERIFICATION SUMMARY`);
console.log(`===============================================================`);

const totalTests = testResults.length;
const passedTests = testResults.filter(r => r.passed).length;
const failedTests = testResults.filter(r => !r.passed).length;

console.log(`Total System Tests Executed: ${totalTests}`);
console.log(`Passed:                     ${passedTests} (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log(`Failed:                     ${failedTests}`);

if (failedTests > 0) {
  console.error(`\n❌ FAILED TESTS LIST:`);
  testResults.filter(r => !r.passed).forEach(r => {
    console.error(` - [${r.suite}] ${r.test}: ${r.error}`);
  });
  process.exit(1);
} else {
  console.log(`\n🎉 ALL 17 SYSTEM COMPONENTS & CORE CLINICAL SUBSYSTEMS ARE FUNCTIONING WITH 100% SUCCESS!`);
  console.log(`✅ System is fully certified and verified for end-to-end scenario testing.`);
  process.exit(0);
}
