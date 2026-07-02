# Bearded Dragon Care (Skægagame Pasning) - PRD

## Original problem statement (Danish)
Program til at holde styr på daglige pasningsopgaver for op til 5 skægagamer.
Hver agame: køn, farve, morph, fødselsdag, billede, manuel alderskategori
(2-4, 4-7, 7-12, 12+ måneder). Tre opgave-kategorier: Fodring, Pleje, Lys &
Varme/UVB (automatisk/manuel). Tidspunkter administreres separat ("Tider").
Ugentlige planer bygges pr. alderskategori x ugedag x tidspunkt, med et eller
flere emner valgt fra den relevante kategori. Dagsoversigt viser dagens
opgaver pr. agame side-by-side i kolonner, med afkrydsning for
fodring/pleje/manuel-lys (automatiske lys-opgaver kræver ikke afkrydsning).
Lokale push-notifikationer som påmindelser. Database lokalt (MongoDB, med
mulighed for cloud-backup senere). Al UI på dansk. Ingen standard skabeloner -
bruger opretter alt selv.

## User choices (from initial clarification)
- Database: lokal, med mulighed for cloud-backup senere (MongoDB via FastAPI)
- Notifikationer: lokale påmindelser (expo-notifications, weekly recurring)
- Alderskategori: manuelt valgt pr. agame (ikke automatisk fra fødselsdag)
- Ingen forudindstillede skabeloner - bruger opretter alt fra bunden
- Billede: kamera eller galleri

## Architecture
- Backend: FastAPI + MongoDB (Motor), modular routes (dragons, task_items,
  times, schedule_slots, overview/completions). PyObjectId/BaseDocument
  pattern for Mongo ObjectId <-> str serialization (response_model_by_alias=False).
- Frontend: Expo Router (TypeScript, .tsx), 4-tab bottom nav (Dagsoversigt,
  Agamer, Ugeplaner, Lister), 3 modal stack screens (dragon-form,
  schedule-slot-form, list-item-form). Custom SelectSheet (bottom sheet
  single/multi picker) and OverlayContext (Toast + Confirm bottom sheet,
  replacing native Alert). Colors/typography per design_guidelines.json
  (Organic & Earthy palette, category color-coding: Fodring=green,
  Pleje=sand, Lys=navy). Local fonts Nunito/Manrope bundled via expo-font.

## Data model
- Dragon: name, gender, color, morph, birthday, age_category, photo_base64
- TaskItem: category (fodring/pleje/lys), name
- TimeSlot: time (HH:MM)
- ScheduleSlot: age_category, day_of_week, time_id, category, item_ids[],
  is_automatic (only meaningful for lys)
- Completion: dragon_id, schedule_slot_id, date, completed

## What's been implemented (2026-02-16, initial build)
- Backend: full CRUD for dragons (max 5 enforced), task-items, times,
  schedule-slots; GET /api/daily-overview?date= (resolves day_of_week,
  times, item names, completion state per dragon); POST
  /api/completions/toggle. Deletion safeguards: time in-use blocked,
  task-item deletion pulls from schedule_slots.item_ids.
- Frontend: all 4 tabs + 3 modal forms fully functional. Daily overview
  with horizontal snap-scroll dragon columns, date navigation, optimistic
  checkbox toggle. Dragon photo picker (camera/gallery) with expo-image-picker.
  Birthday/time pickers via @react-native-community/datetimepicker.
  Local notification scheduling (weekly recurring, excludes automatic lys
  tasks) with AsyncStorage-persisted toggle in Lister tab.
- Tested via testing_agent_v3_expo: 15/15 backend pytest passed; all core
  frontend flows passed (dragon CRUD + max-5 limit, lists CRUD, schedule
  builder, daily overview multi-dragon columns + checkbox toggle).
  Minor known items: DateTimePicker has limited interactivity on web preview
  only (native Android unaffected); a cosmetic RN text-node console warning
  in schedule-slot-form's SelectSheet; camera/gallery capture not testable
  in browser automation.

## Bug fixes (2026-02-16)
- Fixed critical Android/Expo Go boot crash/splash-lock: removed unused
  custom font loading (Nunito/Manrope useFonts call in _layout.tsx) that
  could hang `customFontsLoaded` forever on native Android since the fonts
  were never actually applied anywhere in styles. App now only depends on
  icon font loading (already had robust error fallback), so splash always
  hides.
- Hardened expo-notifications usage: lazy dynamic `import('expo-notifications')`
  wrapped in try/catch in utils/notifications.ts (Expo Go on Android SDK53+
  removed push-token support there; this prevents any future related error
  from throwing uncaught).

## Feature additions (2026-02-16, session 2)
- Edit support added for Tider (times) and Fodring/Pleje/Lys emner
  (task-items): new PUT /api/times/{id} and PUT /api/task-items/{id}
  backend endpoints; list-item-form.tsx now supports isEdit mode
  (prefilled via currentName/currentTime params passed from lists.tsx);
  edit (pencil) icon added next to delete icon on every row in Lister tab.
- Renamed "Lister" tab/screen to "Opgaver" (title + tab bar label).
- Added 5th bottom tab "Admin" (app/(tabs)/admin.tsx) with two sections:
  - Database: "Eksporter database" (GET /api/admin/export -> writes JSON
    file via expo-file-system's new File/Paths API -> shares via
    expo-sharing) and "Importer database" (expo-document-picker -> reads
    JSON -> confirm bottom sheet warns of full overwrite -> POST
    /api/admin/import, which replaces all collections: dragons, task_items,
    times, schedule_slots, completions, app_settings).
  - Banner: pick + crop an image (expo-image-picker, aspect 16:9) and an
    optional overlay text, saved via PUT /api/admin/settings. New
    AdminSettingsContext (root-level provider) + PageBanner component
    (renders image+overlay text at top of every screen if configured, else
    renders nothing) - inserted into all 5 tab screens.
- New backend collection `app_settings` (singleton doc keyed by
  "app_settings_singleton") for banner_image_base64/banner_text.
- Packages added: expo-document-picker, expo-sharing (expo-file-system v19
  already present, using new File/Paths class API).

## Prioritized backlog / next tasks
- P1: Push/local notification deep-testing on a real Android device (Expo Go
  limitations for background/killed app state).
- P1: Investigate/fix cosmetic text-node warning in schedule-slot-form.
- P2: Optional automatic age-category suggestion based on birthday (user
  declined for v1, manual only).
- P2: Weekly plan duplication ("copy Monday's plan to all days") to speed up
  setup for multiple age categories.
