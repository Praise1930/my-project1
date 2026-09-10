import {
  db, AncService, VhtService, AuthService, NotificationService,
  VitalsService, BloodBankService, DoctorService, WHO_ANC_CONTACTS
} from '../services/db';

const results: string[] = [];
let failed = 0;
function check(name: string, cond: boolean, extra = '') {
  if (cond) results.push(`PASS  ${name}`);
  else { failed++; results.push(`FAIL  ${name} ${extra}`); }
}

db.resetDatabase();

// ── 1. Every mother gets a full WHO plan
const motherUserId = 15;
AncService.ensureAncSchedule(motherUserId);
const schedule = AncService.getSchedule(motherUserId);
const numbered = schedule.filter(c => c.anc_visit_number);
check('8 WHO contacts exist', numbered.length === WHO_ANC_CONTACTS.length, `got ${numbered.length}`);
check('legacy seed row adopted as contact 4', numbered.some(c => c.anc_visit_number === 4 && c.status === 'completed'));

// ── 2. Progress reflects completed contacts
let progress = AncService.getProgress(motherUserId);
const baseline = progress.completed;
check('progress counts the completed seed contact', baseline >= 1, `completed=${baseline}`);

// ── 3. A doctor conducts the next due contact
const doctorUser = db.users.find(u => u.role === 'doctor')!;
const target = AncService.getSchedule(motherUserId).find(c => c.anc_visit_number === 5)!;
const notifsBefore = NotificationService.getNotificationsForUser(motherUserId).length;
const vitalsBefore = VitalsService.getVitalsForMother(motherUserId).length;

const outcome = AncService.completeVisit(target.id, doctorUser.id, {
  blood_pressure: '150/95', weight_kg: 68, fundal_height_cm: 28, fetal_heart_rate: 142,
  haemoglobin: 9.5, urine_protein: '++', temperature: 37.0,
  tt_dose_given: 'TT2', iptp_dose_given: 'IPTp3', ifa_supplied: true, llin_given: true,
  hiv_test: 'negative', syphilis_test: 'negative',
  danger_signs: ['Severe headache or blurred vision'],
  findings: 'Raised BP with proteinuria. Query pre-eclampsia.',
  advice: 'Return in one week; go to hospital if headache worsens.'
})!;

check('completeVisit returned an outcome', !!outcome);
check('contact is now completed', outcome.checkup.status === 'completed');
check('clinician recorded on contact', outcome.checkup.conducted_by === doctorUser.id && outcome.checkup.conducted_by_role === 'doctor');
check('results stored on contact', outcome.checkup.results?.blood_pressure === '150/95');

progress = AncService.getProgress(motherUserId);
check('progress increased', progress.completed === baseline + 1, `${baseline} -> ${progress.completed}`);
check('percent recomputed', progress.percent === Math.round((progress.completed / 8) * 100));

// ── 4. Vitals ledger picked it up
const vitals = VitalsService.getVitalsForMother(motherUserId);
check('vitals appended', vitals.length === vitalsBefore + 1);
check('vitals carry the BP', vitals[vitals.length - 1].systolic === 150 && vitals[vitals.length - 1].diastolic === 95);
check('vitals attributed to doctor', vitals[vitals.length - 1].recorded_by === 'doctor');

// ── 5. Mother's own record advanced
const mother = db.mothers.find(m => m.user_id === motherUserId)!;
check('anc_visits_count synced', mother.anc_visits_count === progress.completed, `count=${mother.anc_visits_count} completed=${progress.completed}`);
check('complications captured', (mother.current_complications || '').includes('Severe headache'));

// ── 6. Mother was notified
const notifsAfter = NotificationService.getNotificationsForUser(motherUserId);
check('mother notified of the visit', notifsAfter.length > notifsBefore);
check('notification names the contact', notifsAfter.some(n => n.title.includes('completed')));

// ── 7. Abnormal findings escalated to doctors
check('alerts raised for BP/Hb/proteinuria/danger sign', outcome.alerts.length >= 4, JSON.stringify(outcome.alerts));
const docNotifs = NotificationService.getNotificationsForUser(doctorUser.id);
check('doctor alerted for review', docNotifs.some(n => n.title === 'ANC finding needs review'));

// ── 8. Next contact auto-booked
check('next contact returned', !!outcome.next && outcome.next.anc_visit_number === 6);
check('next contact is upcoming', outcome.next?.status === 'upcoming');

// ── 9. VHT visit propagates to the mother and her doctor
const vhtUser = db.users.find(u => u.role === 'vht')!;
const motherNotifsBefore = NotificationService.getNotificationsForUser(motherUserId).length;
const docNotifsBefore = NotificationService.getNotificationsForUser(doctorUser.id).length;
VhtService.addVisitLog({
  vht_id: vhtUser.id, mother_id: motherUserId, visit_date: '2026-09-01',
  blood_pressure: '145/92', temperature: 38.4, fetal_movement: 'reduced',
  notes: 'Advised to attend clinic.', complications_observed: 'Swollen ankles'
});
check('mother sees the home visit', NotificationService.getNotificationsForUser(motherUserId).length > motherNotifsBefore);
check('doctor sees the VHT concern', NotificationService.getNotificationsForUser(doctorUser.id).length > docNotifsBefore);
check('visit readable by mother id', VhtService.getVisitsForMother(motherUserId).length >= 1);
check('visit readable by vht id', VhtService.getVisitsByVht(vhtUser.id).length >= 1);

// ── 10. Newly registered mother gets a real schedule
const reg = AuthService.registerMother({
  full_name: 'Test Nabirye', email: 'test.nabirye@example.com', phone: '+256700000999',
  password_hash: 'password123', date_of_birth: '1997-02-02', blood_type: 'A+',
  pregnancy_start_date: new Date(Date.now() - 150 * 86400000).toISOString().split('T')[0],
  next_of_kin_name: 'Kin', next_of_kin_phone: '+256700000998',
  next_of_kin_relationship: 'Husband', village: 'Goma', sub_county: 'Goma'
} as never) as { success: boolean; user?: { id: number } };
check('registration succeeded', reg.success === true);
if (reg.user) {
  const newSchedule = AncService.ensureAncSchedule(reg.user.id);
  check('new mother gets 8 contacts', newSchedule.filter(c => c.anc_visit_number).length === 8);
  const p = AncService.getProgress(reg.user.id);
  check('new mother starts at 0 completed', p.completed === 0);
  check('new mother has a next contact', !!p.nextContact);
  check('overdue contacts detected for a 21-week pregnancy', p.overdue.length > 0, `overdue=${p.overdue.length}`);
  check('defaulter list includes her', AncService.getDefaulters().some(d => d.mother.user_id === reg.user!.id));
}

// ── 11. Booking an appointment notifies the mother
const before = NotificationService.getNotificationsForUser(motherUserId).length;
const booked = AncService.scheduleVisit(motherUserId, {
  checkup_type: 'Ultrasound Review', scheduled_date: '2026-10-01', scheduled_time: '11:00', booked_by: doctorUser.id
});
check('appointment created', booked.status === 'upcoming');
check('mother notified of booking', NotificationService.getNotificationsForUser(motherUserId).length > before);

// ── 12. Blood request loop closes
const hospitalId = db.doctors.find(d => d.user_id === doctorUser.id)!.hospital_id;
const req = DoctorService.submitBloodRequest(doctorUser.id, hospitalId, 'O-', 3);
check('blood request pending', BloodBankService.getPending().some(r => r.id === req.id));
const adminUser = db.users.find(u => u.role === 'admin')!;
const approved = BloodBankService.updateStatus(req.id, 'approved', adminUser.id);
check('blood request approved', approved?.status === 'approved');
const delivered = BloodBankService.updateStatus(req.id, 'delivered', adminUser.id);
check('blood request delivered', delivered?.status === 'delivered');
check('doctor notified about blood', NotificationService.getNotificationsForUser(doctorUser.id).some(n => n.title.startsWith('Blood request')));

console.log(results.join('\n'));
console.log(`\n${results.length - failed}/${results.length} checks passed`);
// Exit explicitly: the sync layer keeps timers and listeners alive.
process.exit(failed > 0 ? 1 : 0);
