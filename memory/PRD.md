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

## Feature additions (2026-02-16, session 3)
- Moved "Automatisk/Manuel" ownership from the schedule-slot level to the
  TaskItem level for Lys & Varme: TaskItem now has `is_automatic: bool`
  (backend: models.py + PUT /api/task-items/{id} accepts it).
- Opgaver tab: inline Switch per Lys & Varme row to enable/disable
  automatik directly (optimistic update, PUT on toggle).
- list-item-form.tsx: Automatisk switch shown when adding/editing a Lys &
  Varme item.
- schedule-slot-form.tsx: removed the old manual Automatisk/Manuel picker;
  now shows a read-only computed info box - slot.is_automatic is derived as
  true only if ALL selected lys items are automatic (empty selection =
  manual/unknown, prompts user to pick items first). This value is still
  what gets saved on the ScheduleSlot and used by the daily overview
  checkbox logic, so no backend/daily-overview changes were needed.

## Feature additions (2026-07-02, session 4)
- Banner image crop ratio changed from 16:9 to 4:1 ("1 høj 4 bred") in
  admin.tsx image picker (aspect: [4, 1]) and preview/PageBanner styles
  (aspectRatio: 4 instead of fixed height).
- Added fixed-palette (10 colors + "none/reset") swatch pickers in Admin >
  Banner for: baggrundsfarve (banner_bg_color, used ONLY as fallback solid
  color when no image is set) and overskriftsfarve (heading_color, applied
  to banner text in both image-overlay and solid-color fallback modes).
  No backend changes needed - AppSettings model already had these fields.
- PageBanner.tsx: now renders a solid-color banner with text when no image
  is set but a bg color/text exists (previously hidden entirely without an
  image).
- Tested via testing_agent_v4_expo: banner UI, color persistence, and
  fallback rendering across all tabs confirmed working; no regressions.

## Feature additions (2026-07-02, session 5)
- Automatisk alderskategori: fjernet manuelt "Alderskategori"-valg fra
  dragon-form.tsx. Backend (`compute_age_category()` i models.py) beregner
  nu alderskategori ud fra `birthday` hver gang en agame oprettes,
  opdateres, listes eller læses - samt i daily-overview matching, så
  ugeplanen altid følger dyrets faktiske alder. Dragoner under 2 måneder
  clampes til "2-4". DragonCreate/DragonUpdate accepterer ikke længere
  `age_category` fra klienten. Frontend viser en read-only badge
  ("beregnes automatisk") der live-opdaterer ud fra valgt fødselsdag.
- "Kopier til dage" i ugeplan: ny CopyToDaysSheet.tsx bundmenu i
  schedule-slot-form.tsx med afkrydsning for alle 7 ugedage + 4
  alderskategorier (nuværende dag/periode altid forudvalgt og låst).
  Nyt backend-endpoint POST /api/schedule-slots/bulk-copy opretter/
  overskriver (upsert på age_category+day_of_week+time_id+category) opgaven
  for hele kombinationen af valgte dage × perioder, både ved oprettelse og
  redigering (ved redigering + kopiering slettes den oprindelige slot først
  for at undgå dubletter hvis tid/kategori er ændret).
- Tested via testing_agent_v4_expo (17/17 backend tests). Fandt og fixede
  en "Vælg alle" toggle-bug i CopyToDaysSheet/schedule-slot-form (sammenlignede
  array-længde mod fuld kategori-count i stedet for count-1, da nuværende
  dag/periode er udelukket fra selection-arrayet).

## Feature additions (2026-07-02, session 6)
- Ny "App-udseende" sektion i Admin (under Banner-sektionen) med to
  farve-swatch vælgere: "App-baggrundsfarve" (app_bg_color - baggrunden på
  alle 5 faner, bag sideoverskrifterne) og "Sideoverskrift-farve"
  (page_title_color - tekstfarven på selve titlerne "Dagsoversigt",
  "Agamer", "Ugeplaner", "Opgaver", "Admin"). Har egen live preview-boks og
  egen "Gem udseende"-knap, uafhængig af Banner-sektionens gem-knap (sender
  kun de 2 nye felter, påvirker ikke banner-indstillinger).
- Backend: tilføjet app_bg_color + page_title_color til AppSettings/
  AppSettingsUpdate i models.py (ingen andre backend-ændringer nødvendige).
- AdminSettingsContext udvidet med appBgColor/pageTitleColor; alle 5
  fane-skærme (index.tsx, dragons.tsx, lists.tsx, schedule.tsx, admin.tsx)
  anvender nu betinget inline style-override på SafeAreaView baggrund og
  titel-tekstfarve når disse er sat, med graceful fallback til standard
  cremefarve/mørk tekst når ikke sat.
- Tested via testing_agent_v4_expo: 21/21 backend tests (4 nye + 17
  eksisterende regression), frontend bekræftet virker konsistent på alle 5
  faner, none/reset-fallback virker, banner-indstillinger påvirkes ikke.

## Feature additions (2026-07-02, session 7)
- Uendeligt antal agamer: fjernet MAX_DRAGONS=5 begrænsning helt (backend
  dragons.py + frontend dragons.tsx/constants). "+"-knappen er nu altid
  synlig, og header-tælleren viser "N af N" (samlet antal, ikke længere et
  fast max).
- Slet ugeplan-opgave med valg af omfang: nyt 3-knaps bekræft-flow i
  OverlayContext (secondaryLabel/onSecondaryConfirm) - "Slet kun denne dag"
  vs. "Slet for alle ugedage" (matcher age_category+time_id+category tværs
  af alle 7 dage) vs. "Annuller". Backend DELETE /api/schedule-slots/{id}
  har nu ?all_days=true query param.
- Sideoverskrift-farve (page_title_color) udvidet til også at gælde:
  datoteksten på Dagsoversigt ("Torsdag d. 2. Juli 2026"), agamens navn og
  "X af Y udført"-teksten i DragonColumn.
- Ugeplaner: den aktive ugedag-chip er ændret fra sort til lys grå
  (#D9D6D2) baggrund med mørk tekst.
- Tested via testing_agent_v4_expo: 3/3 nye backend-tests + fuld
  regression, alt bekræftet virker.

## Feature additions (2026-07-02, session 8)
- Vægtregistrering per agame: nyt vægt-ikon (skala) på hvert agame-kort i
  Agamer-fanen, før rediger/slet-ikonerne. Åbner en ny modal-skærm
  (/dragon-weight) med: sidste registrerede vægt, formular til at
  registrere ny vægt (gram) + valgfri note + dato, en linjegraf
  (react-native-gifted-charts) over de sidste 12 måneders målinger, og en
  liste over alle tidligere målinger (nyeste først) med noter og
  slet-mulighed.
- Backend: ny collection `weight_entries` {id, dragon_id, weight_grams,
  note, date, created_at}. Nye endpoints: POST/GET
  /api/dragons/{id}/weights, DELETE /api/weights/{id}. Cascade-delete af
  vægtdata når en agame slettes. Admin export/import inkluderer nu også
  weight_entries.
- Ny dependency installeret: react-native-gifted-charts + react-native-svg
  (via yarn expo install).
- Tested via testing_agent_v4_expo: 33/33 backend tests (8 nye +
  regression-fix af en forældet MAX_DRAGONS-test), fuld frontend-flow
  bekræftet inkl. graf-rendering.
- Kendt begrænsning (ikke unikt for denne feature, gælder også
  fødselsdag/tidspunkt-vælgere andre steder i appen): @react-native-
  community/datetimepicker understøtter ikke web-preview - datovælgeren
  virker fint på Android/iOS, men ikke i browser-preview.

## Prioritized backlog / next tasks
- P1: Push/local notification deep-testing on a real Android device (Expo Go
  limitations for background/killed app state).
- P1: Investigate/fix cosmetic text-node warning in schedule-slot-form.
- P2: Optional automatic age-category suggestion based on birthday (user
  declined for v1, manual only).
- P2: Weekly plan duplication ("copy Monday's plan to all days") to speed up
  setup for multiple age categories.
- P2: Offer to clear leftover "TEST_" seed data (dragons/items) still
  present in the database from earlier testing sessions, once user confirms.
