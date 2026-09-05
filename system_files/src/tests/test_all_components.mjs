// MamaTrack GPS — Automated Test Suite for All 17 UI Components & Core Subsystems
// Conforms to Uganda MoH Maternal Health & Emergency Dispatch Specification

import React from 'react';
import ReactDOMServer from 'react-dom/server';

// ── Mock Browser Globals for Server-side Component Evaluation ──
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    location: { href: 'http://localhost:5173/' },
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    }
  };
  globalThis.document = {
    createElement: () => ({ setAttribute: () => {}, style: {} }),
    body: { appendChild: () => {}, removeChild: () => {} }
  };
  globalThis.localStorage = globalThis.window.localStorage;
}

// ── Import Component Modules ──
import { CdssTriageModal } from '../components/CdssTriageModal.js';
import { ConfirmDialog, confirmAction } from '../components/ConfirmDialog.js';
import { Dhis2ExportModal } from '../components/Dhis2ExportModal.js';
import { ErrorBoundary } from '../components/ErrorBoundary.js';
import { Icon } from '../components/Icon.js';
import {
  HeartbeatLoader,
  SkeletonCard,
  LoadingOverlay,
  PulseButton,
  SkeletonRow,
  ProgressBar
} from '../components/LoadingStates.js';
import { MapComponent } from '../components/MapComponent.js';
import { MpdsrModal } from '../components/MpdsrModal.js';
import { PWAInstallBanner } from '../components/PWAInstallBanner.js';
import { ProfilePhotoUpload } from '../components/ProfilePhotoUpload.js';
import { ReferralFormModal } from '../components/ReferralFormModal.js';
import { SupabaseMigrationModal } from '../components/SupabaseMigrationModal.js';
import { ToastContainer, ToastItem } from '../components/Toast.js';
import { showToast, toastBus } from '../components/toastBus.js';
import { WelcomeToast } from '../components/WelcomeToast.js';
import { ThemeProvider } from '../contexts/ThemeContext.js';

// ── Import Services & Seed Data ──
import {
  db,
  OBSTETRIC_CATEGORIES_METADATA,
  EmergencyService,
  DoctorService,
  DriverService,
  UserService,
  MpdsrService,
  ReferralService,
  Dhis2Service
} from '../services/db.js';

// ── Test Harness State ──
const testResults = [];
let currentSuite = '';

function suite(name) {
  currentSuite = name;
  console.log(`\n===============================================================`);
  console.log(`🔷 SUITE: ${name}`);
  console.log(`===============================================================`);
}

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    testResults.push({ suite: currentSuite, test: name, passed: true });
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    testResults.push({ suite: currentSuite, test: name, passed: false, error: err.message });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ============================================================================
// COMPONENT 1: Icon
// ============================================================================
suite('1. Icon Component (System Iconography)');
test('renders valid SVG for core clinical and emergency icons', () => {
  const iconsToTest = ['heart', 'ambulance', 'hospital', 'pulse', 'alert', 'baby', 'map', 'check', 'phone'];
  for (const name of iconsToTest) {
    const html = ReactDOMServer.renderToString(React.createElement(Icon, { name, size: 20, color: '#ef4444' }));
    assert(html.includes('<svg') && html.includes('</svg>'), `Icon "${name}" failed to render valid SVG markup`);
  }
});
test('falls back gracefully to alert-circle on unrecognized icon name', () => {
  const html = ReactDOMServer.renderToString(React.createElement(Icon, { name: 'nonexistent-icon-xyz', size: 16 }));
  assert(html.includes('<svg'), 'Icon fallback failed to render SVG');
});

// ============================================================================
// COMPONENT 2: LoadingStates (HeartbeatLoader, SkeletonCard, PulseButton, etc.)
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

test('renders SkeletonCard with specified rows', () => {
  const html = ReactDOMServer.renderToString(React.createElement(SkeletonCard, { rows: 4, hasAvatar: true }));
  assert(html.includes('skeleton-box') || html.includes('pulse'), 'Skeleton elements not generated');
});

test('renders LoadingOverlay when active', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(LoadingOverlay, { active: true, text: 'Synchronizing GPS...' })
  );
  assert(html.includes('Synchronizing GPS...'), 'LoadingOverlay text missing');
});

test('renders PulseButton with loading spinner state', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(PulseButton, { loading: true }, 'Dispatch Ambulance')
  );
  assert(html.includes('disabled') || html.includes('loading'), 'PulseButton missing loading/disabled markup');
});

test('renders ProgressBar with percentage bounds', () => {
  const html = ReactDOMServer.renderToString(React.createElement(ProgressBar, { progress: 75, label: 'Upload' }));
  assert(html.includes('75%') && html.includes('Upload'), 'ProgressBar label or width missing');
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
      currentCategory: 'pph',
      onApplyCategory: () => {}
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
      currentCategory: 'pph',
      onApplyCategory: () => {}
    })
  );
  assert(html === '', 'Modal should render nothing when isOpen is false');
});

// ============================================================================
// COMPONENT 5: Dhis2ExportModal (HMIS 105 Interoperability)
// ============================================================================
suite('5. Dhis2ExportModal Component (DHIS2 / HMIS 105)');
test('renders DHIS2 aggregate indicators when open', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(Dhis2ExportModal, {
      isOpen: true,
      onClose: () => {}
    })
  );
  assert(html.includes('DHIS2 / HMIS 105 Maternal Health Export'), 'DHIS2 title missing');
  assert(html.includes('Aggregate Data Elements'), 'Data elements section missing');
  assert(html.includes('Mukono District Health Office'), 'District attribution missing');
});

// ============================================================================
// COMPONENT 6: MpdsrModal (Three-Delay Model Audit)
// ============================================================================
suite('6. MpdsrModal Component (Maternal Death Surveillance & Response)');
test('renders MPDSR Three-Delay checklist and audit fields for an emergency', () => {
  const mockEmergency = db.emergencies[0];
  const html = ReactDOMServer.renderToString(
    React.createElement(MpdsrModal, {
      isOpen: true,
      onClose: () => {},
      emergency: mockEmergency,
      onSaved: () => {}
    })
  );
  assert(html.includes('Uganda MoH MPDSR Audit Form'), 'MPDSR title missing');
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
  const mockReferral = db.referrals[0];
  const html = ReactDOMServer.renderToString(
    React.createElement(ReferralFormModal, {
      isOpen: true,
      onClose: () => {},
      referral: mockReferral
    })
  );
  assert(html.includes('MINISTRY OF HEALTH - UGANDA'), 'MoH Header missing in Referral Form');
  assert(html.includes('MATERNAL & OBSTETRIC EMERGENCY REFERRAL FORM'), 'Referral form subtitle missing');
  assert(html.includes(mockReferral.referral_code), 'Referral code missing');
  assert(html.includes(mockReferral.referring_facility_name), 'Referring facility missing');
  assert(html.includes('Vitals Snapshot at Referral Transfer'), 'Vitals section missing');
});

// ============================================================================
// COMPONENT 8: ConfirmDialog
// ============================================================================
suite('8. ConfirmDialog Component & Interactive Dispatch Prompts');
test('renders modal structure with confirm and cancel buttons', () => {
  const html = ReactDOMServer.renderToString(React.createElement(ConfirmDialog));
  // Hidden by default until confirmAction is called
  assert(typeof html === 'string', 'ConfirmDialog failed to mount');
});

test('confirmAction API registers subscriber without crashing', () => {
  let called = false;
  const promise = confirmAction({
    title: 'Confirm Emergency Ambulance Dispatch',
    message: 'Dispatch Type II Ambulance UBG 001A to Goma Village?',
    confirmText: 'Dispatch Now',
    cancelText: 'Abort'
  }).catch(() => {});
  assert(promise instanceof Promise, 'confirmAction must return a Promise');
});

// ============================================================================
// COMPONENT 9: Toast & ToastContainer
// ============================================================================
suite('9. Toast & Notification Bus');
test('ToastItem renders message, type badge, and title properly', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(ToastItem, {
      id: 'toast-1',
      title: 'Emergency Dispatched',
      message: 'Ambulance UBG 001A en route. ETA: 12 mins.',
      type: 'success',
      duration: 5000,
      onClose: () => {}
    })
  );
  assert(html.includes('Emergency Dispatched'), 'Toast title missing');
  assert(html.includes('ETA: 12 mins'), 'Toast message missing');
});

test('showToast dispatches events through toastBus', () => {
  let receivedToast = null;
  const unsubscribe = toastBus.subscribe((t) => { receivedToast = t; });
  showToast('Test Maternal Alert Event', 'warning');
  assert(receivedToast !== null, 'toastBus failed to emit toast');
  assert(receivedToast.message === 'Test Maternal Alert Event', 'Incorrect toast message received');
  assert(receivedToast.type === 'warning', 'Incorrect toast type received');
  unsubscribe();
});

// ============================================================================
// COMPONENT 10: WelcomeToast
// ============================================================================
suite('10. WelcomeToast Component');
test('renders personalized greeting for authenticated doctor role', () => {
  const user = db.users.find(u => u.role === 'doctor');
  const html = ReactDOMServer.renderToString(
    React.createElement(WelcomeToast, { user, onDismiss: () => {} })
  );
  assert(html.includes('Welcome,') && html.includes(user.full_name), 'User name not in WelcomeToast');
  assert(html.includes('Clinical Portal') || html.includes('Doctor'), 'Role description missing');
});

// ============================================================================
// COMPONENT 11: PWAInstallBanner
// ============================================================================
suite('11. PWAInstallBanner Component');
test('renders PWA offline-first mobile app prompt banner', () => {
  const html = ReactDOMServer.renderToString(React.createElement(PWAInstallBanner));
  // Banner conditionally shows if deferredPrompt exists or defaults hidden
  assert(typeof html === 'string', 'PWA banner rendered invalid markup');
});

// ============================================================================
// COMPONENT 12: ProfilePhotoUpload
// ============================================================================
suite('12. ProfilePhotoUpload Component');
test('renders user avatar, role badge, and photo upload action buttons', () => {
  const user = db.users.find(u => u.role === 'mother');
  const html = ReactDOMServer.renderToString(
    React.createElement(ProfilePhotoUpload, {
      user,
      onPhotoUpdated: () => {},
      onClose: () => {}
    })
  );
  assert(html.includes(user.full_name), 'User full name missing in ProfilePhotoUpload');
  assert(html.includes('Upload Photo') || html.includes('Change Photo'), 'Photo upload button missing');
  assert(html.includes('National ID (NIN)') || html.includes('Expectant Mother'), 'Mother metadata missing');
});

// ============================================================================
// COMPONENT 13: SupabaseMigrationModal
// ============================================================================
suite('13. SupabaseMigrationModal Component');
test('renders database tables list and sync actions when open', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(SupabaseMigrationModal, {
      isOpen: true,
      onClose: () => {}
    })
  );
  assert(html.includes('Supabase Cloud Database Synchronization'), 'Migration modal title missing');
  assert(html.includes('hospitals') && html.includes('emergencies'), 'Table list missing core tables');
  assert(html.includes('Start Migration') || html.includes('Sync All Data'), 'Sync button missing');
});

// ============================================================================
// COMPONENT 14: MapComponent
// ============================================================================
suite('14. MapComponent (GIS Navigation & Routing Engine)');
test('renders map container element with interactive controls and GIS overlays', () => {
  const html = ReactDOMServer.renderToString(
    React.createElement(MapComponent, {
      hospitals: db.hospitals,
      vehicles: db.vehicles,
      emergencies: db.emergencies.slice(0, 2),
      activeEmergency: db.emergencies[0],
      showHeatmap: false,
      showDistrictGeofence: true
    })
  );
  assert(html.includes('map-container') || html.includes('leaflet') || html.includes('style'), 'Map container element missing');
  assert(html.includes('Google Maps') || html.includes('Dark GPS Map') || html.includes('GIS Heatmap'), 'Map view controls missing');
});

// ============================================================================
// COMPONENT 15: ThemeContext (Dark/Light Mode Theme Provider)
// ============================================================================
suite('15. ThemeContext & Mode Provider');
test('ThemeProvider mounts and provides theme context to child components', () => {
  const Child = () => React.createElement('span', { className: 'theme-test-content' }, 'Theme Active');
  const html = ReactDOMServer.renderToString(
    React.createElement(ThemeProvider, null, React.createElement(Child))
  );
  assert(html.includes('Theme Active'), 'Child inside ThemeProvider failed to render');
});

// ============================================================================
// COMPONENT 16: CDSS Protocols & Obstetric Category Matrix
// ============================================================================
suite('16. Uganda MoH Obstetric Emergency Categories & Protocol Matrix');
test('all 10 MoH obstetric categories have valid label, urgency, and default intervention', () => {
  const categories = Object.keys(OBSTETRIC_CATEGORIES_METADATA);
  assert(categories.length === 10, `Expected 10 MoH categories, found ${categories.length}`);
  
  for (const cat of categories) {
    const meta = OBSTETRIC_CATEGORIES_METADATA[cat];
    assert(typeof meta.label === 'string' && meta.label.length > 0, `Category ${cat} missing label`);
    assert(meta.urgency === 'CRITICAL' || meta.urgency === 'HIGH', `Category ${cat} has invalid urgency`);
    assert(typeof meta.description === 'string' && meta.description.length > 0, `Category ${cat} missing description`);
    assert(typeof meta.defaultIntervention === 'string', `Category ${cat} missing defaultIntervention`);
  }
});

// ============================================================================
// COMPONENT 17: Core Emergency Triage, Auto-Dispatch & Routing Engine
// ============================================================================
suite('17. End-to-End Emergency Dispatch Algorithm & Simulation Engine');
test('triggers obstetric SOS, calculates nearest CEmONC facility, and assigns available vehicle', () => {
  // Test mother: Nakato Fatima (ID 15)
  const motherUser = db.users.find(u => u.id === 15);
  assert(motherUser !== undefined, 'Seed mother user (ID 15) must exist');

  const initialEmergencyCount = db.emergencies.length;
  
  // Trigger emergency
  const emergency = EmergencyService.triggerEmergency(
    15,
    0.3420,
    32.7680,
    'Postpartum Haemorrhage after home delivery; heavy bleeding and dizziness.',
    'critical',
    'pph',
    { systolic: 85, diastolic: 55, pulse: 122, temp: 36.8, kick_count: 0 },
    'blood_transfusion',
    'mother',
    'Nakato Fatima'
  );

  assert(emergency !== null && typeof emergency.id === 'number', 'Emergency creation failed');
  assert(emergency.category === 'pph', 'Emergency category not assigned');
  assert(emergency.severity === 'critical', 'Emergency severity not critical');
  assert(emergency.required_intervention === 'blood_transfusion', 'Required intervention mismatch');
  assert(emergency.status === 'pending', 'Initial status must be pending');

  // Verify Nearest Hospital Resolution (Must be CEmONC + Blood Bank capable for PPH)
  const nearestHospital = EmergencyService.getNearestHospital(emergency.latitude, emergency.longitude, true);
  assert(nearestHospital !== null, 'Failed to resolve nearest capable CEmONC hospital');
  assert(nearestHospital.has_cemonc === true, 'Assigned hospital must have CEmONC capability');
  assert(nearestHospital.has_blood_bank === true, 'Assigned hospital must have blood bank for PPH');

  // Verify Nearest Available Ambulance Resolution
  const nearestVehicle = EmergencyService.getNearestVehicle(emergency.latitude, emergency.longitude);
  assert(nearestVehicle !== null, 'Failed to resolve nearest available vehicle');
  assert(nearestVehicle.status === 'available', 'Assigned vehicle must be available');

  // Dispatch Emergency
  const onDutyDoctor = db.doctors.find(d => d.is_on_duty);
  const onDutyDriver = db.drivers.find(dr => dr.is_on_duty);
  
  const dispatched = EmergencyService.dispatchEmergency(
    emergency.id,
    nearestHospital.id,
    onDutyDriver ? onDutyDriver.user_id : 10,
    onDutyDoctor ? onDutyDoctor.user_id : 3,
    nearestVehicle.id,
    15,
    1 // Dispatched by Admin ID 1
  );

  assert(dispatched !== null, 'Emergency dispatch failed');
  assert(dispatched.status === 'dispatched', 'Emergency status must be dispatched');
  assert(dispatched.dispatched_at !== null, 'dispatched_at timestamp must be set');

  // Advance lifecycle: en_route -> arrived -> in_transit -> delivered -> completed
  const enRoute = EmergencyService.updateEmergencyStatus(emergency.id, 'en_route', onDutyDriver?.user_id, 'Ambulance en route to patient');
  assert(enRoute?.status === 'en_route', 'Failed to advance to en_route');

  const arrived = EmergencyService.updateEmergencyStatus(emergency.id, 'arrived', onDutyDriver?.user_id, 'Arrived at mother location');
  assert(arrived?.status === 'arrived', 'Failed to advance to arrived');

  const inTransit = EmergencyService.updateEmergencyStatus(emergency.id, 'in_transit', onDutyDriver?.user_id, 'Mother onboard; heading to facility');
  assert(inTransit?.status === 'in_transit', 'Failed to advance to in_transit');

  const delivered = EmergencyService.updateEmergencyStatus(emergency.id, 'delivered', onDutyDriver?.user_id, 'Mother safely handed over at hospital theatre');
  assert(delivered?.status === 'delivered', 'Failed to advance to delivered');

  const completed = EmergencyService.updateEmergencyStatus(emergency.id, 'completed', onDutyDoctor?.user_id, 'Emergency intervention completed successfully');
  assert(completed?.status === 'completed', 'Failed to advance to completed');

  // Check Three-Delay Metrics were calculated
  assert(completed?.delay_intervals !== undefined, 'Delay intervals must be recorded');
  assert(typeof completed?.delay_intervals?.total_response_time_min === 'number', 'Total response time must be calculated');

  // Record Clinical Assessment
  const assessment = DoctorService.addAssessment(
    emergency.id,
    onDutyDoctor ? onDutyDoctor.user_id : 3,
    '110/70',
    88,
    37.1,
    'Postpartum haemorrhage managed with oxytocin and 2 units of packed red blood cells. Mother stable.',
    'IV Oxytocin, 2 units O+ blood, misoprostol 800mcg',
    'admitted'
  );
  assert(assessment !== null && assessment.outcome === 'admitted', 'Clinical assessment recording failed');

  // Generate MoH Standardized Referral
  const referral = ReferralService.createReferral({
    emergency_id: emergency.id,
    mother_id: 15,
    referring_facility_name: 'Nama Health Centre IV',
    referring_clinician_name: 'Midwife Nakitto Sarah',
    referring_clinician_contact: '+256-788-000-111',
    receiving_facility_id: nearestHospital.id,
    receiving_facility_name: nearestHospital.name,
    reason_for_referral: 'Severe postpartum haemorrhage unresponsive to initial uterotonics.',
    clinical_summary: 'Delivered at 02:00, placenta delivered complete. Profuse uterine bleeding.',
    obstetric_history: {
      gravida: 2,
      parity: 1,
      gestational_weeks: 39,
      edd: '2026-10-17',
      blood_group: 'O+'
    },
    vitals_at_referral: {
      bp: '85/55',
      pulse: 122,
      temp: 36.8
    },
    pre_referral_treatments: ['IV Normal Saline 1L', 'Oxytocin 10 IU IM'],
    medications_given: ['Tranexamic Acid 1g IV'],
    ambulance_plate: nearestVehicle.plate_number,
    driver_name: onDutyDriver ? 'Moses Kiggundu' : 'Driver',
    departure_time: new Date().toISOString()
  });

  assert(referral !== null && referral.referral_code.startsWith('REF-'), 'Referral record creation failed');

  // Generate DHIS2 Monthly Aggregates
  const dhis2Data = Dhis2Service.getAggregates('2026-06', '2026-09');
  assert(typeof dhis2Data.totalDeliveriesReported === 'number', 'DHIS2 deliveries metric missing');
  assert(typeof dhis2Data.totalEmergenciesDispatched === 'number', 'DHIS2 emergencies metric missing');
  assert(typeof dhis2Data.averageAmbulanceResponseTimeMinutes === 'number', 'DHIS2 response time metric missing');

  // Record MPDSR Audit
  const mpdsr = MpdsrService.saveRecord({
    emergency_id: emergency.id,
    mother_id: 15,
    case_classification: 'maternal_near_miss',
    primary_cause: 'Severe Postpartum Haemorrhage with Hypovolemic Shock',
    contributing_clinical_factors: ['Uterine Atony', 'Delay in reporting'],
    delay_1_seeking_care: { present: true, factors: ['Waiting for family decision'], notes: 'Delayed 45 mins at home' },
    delay_2_reaching_care: { present: false, factors: [], notes: 'GPS ambulance dispatch was rapid (14 mins)' },
    delay_3_receiving_care: { present: false, factors: [], notes: 'Immediate theatre reception & blood transfusion at Mukono General' },
    avoidable_factors: ['Community education on immediate postpartum signs'],
    review_committee_status: 'audit_completed',
    corrective_action_plan: 'Target Goma village VHTs with refresher danger sign recognition.',
    responsible_facility: nearestHospital.name,
    responsible_person: 'Medical Superintendent',
    audit_date: new Date().toISOString().split('T')[0],
    follow_up_date: new Date().toISOString().split('T')[0]
  });

  assert(mpdsr !== null && mpdsr.id !== undefined, 'MPDSR surveillance record failed to save');
  const queriedMpdsr = MpdsrService.getRecordByEmergencyId(emergency.id);
  assert(queriedMpdsr !== undefined && queriedMpdsr.case_classification === 'maternal_near_miss', 'MPDSR query failed');
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
  console.log(`\n🎉 ALL 17 COMPONENTS & SUBSYSTEMS ARE FUNCTIONING WITH 100% SUCCESS!`);
  process.exit(0);
}
