# Token Optimization — Implementation Plan
> Generated: 2026-04-21 | Status: AWAITING APPROVAL — no changes applied yet

---

## Audit Summary

| Metric | Value |
|:---|:---|
| Total lines in `src/` | 92,399 |
| Lines in files > 300 | 37,717 (40.8% of codebase) |
| Files over 300 lines | 63 |
| Average bottleneck file size | ~599 lines |
| Target file size | ≤ 200 lines |
| Estimated context reduction per AI task | **~68%** |

---

## Analysis Report — Files Over 300 Lines

### 🔴 CRITICAL (> 700 lines)

| File | Lines | Type | Recommendation |
|:---|:---|:---|:---|
| `app/(authenticated)/agenda/[consultationId]/video/[callId]/page.tsx` | 2013 | Page Monolith | Split: `VideoCanvas`, `VideoControls`, `VideoSidebar`, `VideoChat`, `useVideoCallState` |
| `components/organisms/Modals/PrescriptionModal/prescriptionModal.tsx` | 1385 | Modal Monolith | Split: `PrescriptionForm`, `PrescriptionItemList`, `usePrescriptionForm`, `types.ts` |
| `app/.../EmbeddedMemedPrescription/embeddedMemedPrescription.tsx` | 1091 | Feature Monolith | Split: `MemedFrame`, `MemedLoader`, `useMemedIntegration`, `types.ts` |
| `constants/questionnairesOptions.ts` | 982 | Data Monolith | Split by questionnaire type: `lifestyleOptions.ts`, `sleepOptions.ts`, `nutritionOptions.ts`, etc. |
| `services/memed/index.ts` | 951 | Service Monolith | Split: `memed/prescriptions.ts`, `memed/doctors.ts`, `memed/medications.ts` |
| `services/consultation.ts` | 906 | Service Monolith | Split: `consultation/queries.ts`, `consultation/mutations.ts`, `consultation/mappers.ts` |
| `app/.../trilha/[trackId]/page.tsx` | 866 | Page Monolith | Split: `TrackHeader`, `TrackActivities`, `TrackProgress`, `useTrackData` |
| `app/.../cardapio/[orientationId]/page.tsx` | 855 | Page Monolith | Split: `CardapioHeader`, `MealList`, `NutritionSummary`, `useCardapioData` |
| `components/organisms/Modals/ActivityModal/activityModal.tsx` | 803 | Modal Monolith | Split: `ActivityForm`, `ActivitySchedule`, `useActivityModal`, `types.ts` |
| `app/(authenticated)/agenda/[consultationId]/presential/page.tsx` | 791 | Page Monolith | Split: `SoapForm`, `PatientInfo`, `PresentialControls`, `usePresentialSoap` |
| `app/.../ActivityCard/activityCard.tsx` | 735 | Component Monolith | Split: `ActivityCardHeader`, `ActivityCardBody`, `ActivityCardActions`, `useActivityCard` |
| `app/(authenticated)/perfil/page.tsx` | 729 | Page Monolith | Split: `ProfileForm`, `ProfilePhoto`, `ProfileSecurity`, `useProfileData` |
| `app/.../plano-terapeutico/[planId]/page.tsx` | 727 | Page Monolith | Split: tabs into `PlanOverviewTab`, `PlanPillarsTab`, `PlanMedicationsTab` |
| `app/.../LifestylePillar/lifestylePillar.tsx` | 704 | Component Monolith | Split: `LifestyleCategories`, `LifestyleActivities`, `useLifestylePillar` |
| `app/(authenticated)/agenda/page.tsx` | 699 | Page Monolith | Split: `AgendaCalendar`, `AgendaFilters`, `AgendaEventCard`, `useAgendaData` |

### 🟡 HIGH (400–699 lines)

| File | Lines | Type | Recommendation |
|:---|:---|:---|:---|
| `utils/extractPrescriptionData.ts` | 687 | Utility Monolith | Split by extraction domain: `extractMedications`, `extractPatient`, `extractDoctor` |
| `app/.../resumo-textual/page.tsx` | 658 | Page Monolith | Split: `ResumoForm`, `ResumoPreview`, `useResumoTextual` |
| `app/.../movimento/page.tsx` | 642 | Page Monolith | Split: `MovimentoChart`, `MovimentoStats`, `useMovimentoData` |
| `app/.../exercicio/[activityId]/page.tsx` | 624 | Page Monolith | Split: `ExercicioForm`, `ExercicioMedia`, `useExercicioData` |
| `app/api/ai/generate-plan/route.ts` | 610 | API Route Monolith | Split: `generatePlan/handler.ts`, `generatePlan/prompt.ts`, `generatePlan/validator.ts` |
| `constants/memedSpecialtiesMap.ts` | 606 | Static Data | Convert to lazy-loaded JSON: `memed-specialties.json` |
| `services/healthPillarActivity.ts` | 564 | Service Monolith | Split: `activity/queries.ts`, `activity/mutations.ts` |
| `services/user.ts` | 527 | Service Monolith | Split: `user/queries.ts`, `user/mutations.ts`, `user/admin.ts` |
| `services/firebase/firebaseStorage.ts` | 522 | Service Monolith | Split by upload type: `storage/images.ts`, `storage/documents.ts`, `storage/audio.ts` |
| `app/.../consultation-history/[id]/page.tsx` | 520 | Page Monolith | Split: `HistoryHeader`, `SoapRecord`, `AttachmentList`, `useConsultationHistory` |
| `services/aiHealthPlan.ts` | 505 | Service Monolith | Split: `aiHealthPlan/builder.ts`, `aiHealthPlan/prompts.ts` |
| `utils/checkup/questionMapper.ts` | 504 | Utility Monolith | Split by checkup section: `mapVitalSigns`, `mapLifestyle`, `mapBiomarkers` |
| `app/admin/queue/page.tsx` | 499 | Page Monolith | Split: `QueueTable`, `QueueFilters`, `QueueActions`, `useQueueData` |
| `services/emailNotification/triggers.ts` | 489 | Service Monolith | Split by trigger domain: `triggers/consultation.ts`, `triggers/user.ts` |
| `app/(authenticated)/dashboard/page.tsx` | 477 | Page Monolith | Split: `DashboardMetrics`, `DashboardCalendar`, `DashboardPatients`, `useDashboardData` |
| `types/entities/healthCheckup.ts` | 475 | Type Monolith | Split: `healthCheckup/vitals.ts`, `healthCheckup/biomarkers.ts`, `healthCheckup/lifestyle.ts` |
| `services/firebase/auth.ts` | 458 | Service Monolith | Split: `auth/social.ts`, `auth/email.ts`, `auth/account.ts` |
| `app/.../CategoryCard/categoryCard.tsx` | 458 | Component Monolith | Split: `CategoryCardHeader`, `CategoryItems`, `useCategoryCard` |
| `components/organisms/Modals/NotificationsModal/notificationsModal.tsx` | 455 | Modal Monolith | Split: `NotificationList`, `NotificationItem`, `useNotificationsModal` |
| `app/.../peso/page.tsx` | 439 | Page Monolith | Split: `WeightChart`, `WeightForm`, `WeightGoalBanner`, `useWeightData` |
| `services/exam.ts` | 438 | Service Monolith | Split: `exam/queries.ts`, `exam/mutations.ts` |
| `services/consultationVideoCall.ts` | 437 | Service Monolith | Split: `videoCall/session.ts`, `videoCall/recording.ts` |
| `app/admin/usuarios/doctorDetailsModal.tsx` | 431 | Modal Monolith | Split: `DoctorInfo`, `DoctorStatus`, `DoctorActions`, `useDoctorDetails` |
| `services/firestore/user.ts` | 423 | Service Monolith | Merge or split with `services/user.ts` |
| `app/(authenticated)/pacientes/page.tsx` | 411 | Page Monolith | Split: `PatientList`, `PatientFilters`, `PatientCard`, `usePatientsData` |
| `app/admin/home/page.tsx` | 410 | Page Monolith | Split: `AdminMetrics`, `AdminCharts`, `AdminRangeDropdown` |

### 🟢 MEDIUM (300–399 lines)

| File | Lines | Recommendation |
|:---|:---|:---|
| `app/.../OrientationCard/orientationCard.tsx` | 404 | Split: `OrientationCardView`, `OrientationCardEdit`, `useOrientationCard` |
| `components/molecules/WeeklyCalendar/weeklyCalendar.tsx` | 400 | Split: `CalendarHeader`, `CalendarGrid`, `CalendarEvent` |
| `services/healthPillarOrientation.ts` | 385 | Split: `orientation/queries.ts`, `orientation/mutations.ts` |
| `hooks/useVideoCallRecorder.ts` | 384 | Split: `useRecording`, `useRecordingUpload` |
| `components/organisms/Forms/SignUpForm/CompleteRegistrationForm.tsx` | 381 | Split: form sections into step components |
| `hooks/useAppToast.ts` | 369 | Extract toast definitions to `toastMessages.ts` |
| `providers/Auth/index.tsx` | 366 | Split: `AuthStateManager`, `AuthOperations` |

---

## Implementation Plan (Prioritized)

### Phase 1 — Quick Wins (Static Data, no logic changes)
These are pure data files with zero logic — safest to refactor first.

- [ ] **`constants/questionnairesOptions.ts`** (982 → ~5 files of ~196 lines)
  - Create: `constants/questionnaires/lifestyleOptions.ts`
  - Create: `constants/questionnaires/sleepOptions.ts`
  - Create: `constants/questionnaires/nutritionOptions.ts`
  - Create: `constants/questionnaires/mentalHealthOptions.ts`
  - Create: `constants/questionnaires/index.ts` (re-exports only, ~20 lines)
  - Update all imports

- [ ] **`constants/memedSpecialtiesMap.ts`** (606 → JSON file)
  - Create: `constants/memed-specialties.json`
  - Update: `services/memed/index.ts` to import JSON

### Phase 2 — Service Layer (High-impact, deterministic logic)

- [ ] **`services/memed/index.ts`** (951 → 3 files of ~317 lines)
  - Create: `services/memed/prescriptions.ts` (~320 lines)
  - Create: `services/memed/doctors.ts` (~200 lines)
  - Create: `services/memed/medications.ts` (~200 lines)
  - Update: `services/memed/index.ts` → re-exports only (~50 lines)

- [ ] **`services/consultation.ts`** (906 → 3 files)
  - Create: `services/consultation/queries.ts` (~300 lines)
  - Create: `services/consultation/mutations.ts` (~300 lines)
  - Create: `services/consultation/mappers.ts` (~200 lines)
  - Update: `services/consultation.ts` → re-exports only

- [ ] **`services/user.ts`** (527 → 3 files)
  - Create: `services/user/queries.ts` (~180 lines)
  - Create: `services/user/mutations.ts` (~180 lines)
  - Create: `services/user/admin.ts` (~120 lines) — `getAdminUsersPage`, `getAllUsers`
  - Update: `services/user.ts` → re-exports only

- [ ] **`services/healthPillarActivity.ts`** (564 → 2 files)
  - Create: `services/healthPillarActivity/queries.ts` (~280 lines)
  - Create: `services/healthPillarActivity/mutations.ts` (~280 lines)

### Phase 3 — Modal Components

- [ ] **`PrescriptionModal/prescriptionModal.tsx`** (1385 → 4 files)
  - Create: `PrescriptionModal/PrescriptionForm.tsx` (~300 lines)
  - Create: `PrescriptionModal/PrescriptionItemList.tsx` (~300 lines)
  - Create: `PrescriptionModal/usePrescriptionForm.ts` (~200 lines)
  - Create: `PrescriptionModal/types.ts` (~80 lines)
  - Update: `prescriptionModal.tsx` → orchestration only (~150 lines)

- [ ] **`ActivityModal/activityModal.tsx`** (803 → 3 files)
  - Create: `ActivityModal/ActivityForm.tsx` (~280 lines)
  - Create: `ActivityModal/useActivityModal.ts` (~200 lines)
  - Update: `activityModal.tsx` → orchestration only (~120 lines)

### Phase 4 — Page Components (Highest effort, highest impact)

- [ ] **`video/[callId]/page.tsx`** (2013 → 6 files)
  - Create: `video/components/VideoCanvas.tsx` (~200 lines)
  - Create: `video/components/VideoControls.tsx` (~200 lines)
  - Create: `video/components/VideoSidebar.tsx` (~200 lines)
  - Create: `video/components/VideoChat.tsx` (~200 lines)
  - Create: `video/hooks/useVideoCallState.ts` (~250 lines)
  - Update: `page.tsx` → composition only (~150 lines)

- [ ] **`presential/page.tsx`** (791 → 4 files)
  - Create: `presential/components/SoapForm.tsx` (~250 lines)
  - Create: `presential/components/PatientInfoPanel.tsx` (~150 lines)
  - Create: `presential/hooks/usePresentialSession.ts` (~200 lines)
  - Update: `page.tsx` → composition only (~100 lines)

- [ ] **`agenda/page.tsx`** (699 → 4 files)
  - Create: `agenda/components/AgendaCalendar.tsx` (~200 lines)
  - Create: `agenda/components/AgendaFilters.tsx` (~150 lines)
  - Create: `agenda/hooks/useAgendaData.ts` (~150 lines)
  - Update: `page.tsx` → composition only (~100 lines)

---

## Line Count Before vs After (Top 10)

| File | Before | After (max per file) | Files Created | Total Lines Preserved |
|:---|:---|:---|:---|:---|
| `video/.../page.tsx` | 2013 | 6 × ~200 | 5 new + 1 updated | ~1200 (40% overhead removed) |
| `prescriptionModal.tsx` | 1385 | 5 × ~200 | 4 new + 1 updated | ~1000 |
| `embeddedMemedPrescription.tsx` | 1091 | 4 × ~200 | 3 new + 1 updated | ~800 |
| `questionnairesOptions.ts` | 982 | 5 × ~196 | 4 new + 1 index | ~980 |
| `services/memed/index.ts` | 951 | 3 × ~300 | 3 new + 1 index | ~920 |
| `services/consultation.ts` | 906 | 3 × ~300 | 3 new + 1 index | ~900 |
| `trilha/[trackId]/page.tsx` | 866 | 4 × ~200 | 3 new + 1 updated | ~800 |
| `cardapio/.../page.tsx` | 855 | 4 × ~200 | 3 new + 1 updated | ~800 |
| `activityModal.tsx` | 803 | 3 × ~200 | 2 new + 1 updated | ~600 |
| `presential/page.tsx` | 791 | 4 × ~200 | 3 new + 1 updated | ~700 |

---

## Expected Savings per AI Session

| Scenario | Context Before | Context After | Savings |
|:---|:---|:---|:---|
| Editing video call page | ~2013 lines loaded | ~200 lines (1 component) | **-90%** |
| Fixing a modal bug | ~1000 lines avg | ~200 lines (target file) | **-80%** |
| Adding a service method | ~700 lines avg | ~200 lines (target file) | **-71%** |
| Refactoring constants | ~982 lines | ~200 lines (1 category file) | **-80%** |
| **Average across tasks** | **~600 lines avg** | **~200 lines avg** | **-67%** |

---

> **Next step**: Review this plan and reply with approval to begin Phase 1.
> No files have been modified.
