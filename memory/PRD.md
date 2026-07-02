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

## Prioritized backlog / next tasks
- P1: Push/local notification deep-testing on a real Android device (Expo Go
  limitations for background/killed app state).
- P1: Investigate/fix cosmetic text-node warning in schedule-slot-form.
- P2: Optional automatic age-category suggestion based on birthday (user
  declined for v1, manual only).
- P2: Cloud backup/sync of MongoDB data (explicitly deferred by user for v1).
- P2: Weekly plan duplication ("copy Monday's plan to all days") to speed up
  setup for multiple age categories.
