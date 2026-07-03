#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

## user_problem_statement: Offline-first Expo app (Skægagamer) to manage daily care tasks for Bearded Dragons: dragon profiles, feeding/care/light tasks, weekly schedules by age group, daily overview with checkboxes, admin backup/restore, custom banner/colors, weight tracking with charts. LATEST FEATURE: App localization (English/Danish), dynamic translation of built-in labels (categories, weekdays, age groups, gender), and toggleable settings for Weight Unit (grams/oz) and Time Format (12h am/pm / 24h). Defaults: English, grams (g), am/pm. Per user decision, custom database item names (task item names like "Larver") are NOT auto-translated in this iteration - only built-in enums/UI text.

## backend:
  - task: "AppSettings model - language/weight_unit/time_format fields"
    implemented: true
    working: "NA"
    file: "backend/models.py, backend/routes/admin.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Added language (default 'en'), weight_unit (default 'g'), time_format (default '12h') to AppSettings and AppSettingsUpdate models. GET/PUT /api/admin/settings already generic (model_dump exclude_unset), no route code changes needed. Need to verify GET returns defaults, PUT persists and returns updated values, and defaults match spec (en/g/12h)."

## frontend:
  - task: "Language/Weight/Time settings context + Admin UI"
    implemented: true
    working: "NA"
    file: "frontend/context/AdminSettingsContext.tsx, frontend/app/(tabs)/admin.tsx, frontend/i18n/translations.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "AdminSettingsContext now exposes language/weightUnit/timeFormat + a t() translation function bound to current language. Admin screen has new 'Language & units' section (bottom, after Database/Banner/App-appearance) with Danish/English toggle, g/oz toggle, AM/PM/24h toggle, and its own Save button (admin-lang-save-button) that PUTs to /api/admin/settings. Need to verify: toggling language changes ALL screen text immediately after save+refresh, weight unit toggle changes dragon-weight screen units + converts correctly, time format toggle changes displayed times everywhere (Tasks/Times list, Schedules, Overview task rows)."
  - task: "Full UI translation (English/Danish) across all screens"
    implemented: true
    working: "NA"
    file: "frontend/app/(tabs)/index.tsx, dragons.tsx, lists.tsx, schedule.tsx, admin.tsx, frontend/app/dragon-form.tsx, dragon-weight.tsx, list-item-form.tsx, schedule-slot-form.tsx, frontend/components/*.tsx"
    stuck_count: 1
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Wrapped all static UI strings (titles, buttons, toasts, empty states, confirm dialogs) with t() from i18n/translations.ts. Translated built-in enums (day of week, age category, gender, task category) via getDayLabel/getAgeLabel/getGenderLabel/getCategoryLabel bound to selected language. Per user decision, custom task-item names entered by the user are intentionally NOT translated (kept as-is) - this is expected/correct behavior, not a bug. NOTE: During implementation, a tool race-condition occurred when multiple parallel search_replace edits targeted the SAME file simultaneously - this caused lost edits / stray duplicated tail content in admin.tsx and schedule.tsx. Both were detected via grep+lint (babel parse errors) and fixed; full lint pass is now clean (0 errors, only pre-existing harmless exhaustive-deps warnings). Please pay extra attention during testing to admin.tsx and schedule.tsx for any remaining visual/text anomalies."
  - task: "Weight unit (g/oz) display + input conversion"
    implemented: true
    working: "NA"
    file: "frontend/app/dragon-weight.tsx, frontend/i18n/translations.ts"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Weight is always stored in grams in DB (weight_grams). Display converts via gramsToDisplay()/formatWeightDisplay() and user input converts via displayToGrams() before POST. Chart data points and history list use converted values. Need to verify: switching unit in Admin then entering weight in oz stores correct gram equivalent, and existing gram entries display correctly converted to oz."
  - task: "Time format (12h/24h) applied wherever times are shown"
    implemented: true
    working: "NA"
    file: "frontend/i18n/translations.ts (formatTimeDisplay), lists.tsx, schedule.tsx, schedule-slot-form.tsx, list-item-form.tsx, components/TaskRow.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Times are stored as 24h 'HH:MM' strings in DB; formatTimeDisplay() converts to AM/PM display when timeFormat='12h'. Applied in: Tasks>Times list, Schedules slot cards, Schedule-slot-form time picker/sheet, list-item-form time picker, Overview TaskRow. Need to verify all these show consistent format after toggling setting."

## metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 2
  run_ui: false

## test_plan:
  current_focus:
    - "Reset & load default care plan (backend)"
    - "AI auto-translation of custom task item names (Gemini 3 Flash)"
    - "Reset & load care plan Admin UI (double confirm)"
    - "Task item bilingual display across all screens"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

## agent_communication:
    - agent: "main"
      message: "Implemented full localization feature: (1) Backend AppSettings model extended with language/weight_unit/time_format (defaults en/g/12h). (2) New Admin 'Language & units' section with 3 toggle groups + save button. (3) All static UI text across every screen (Overview, Dragons, Tasks, Schedules, Admin, and all forms/modals) now uses a t() translation function with full Danish+English dictionaries. (4) Built-in enums (days, age categories, gender, task categories) translate dynamically. (5) Weight displays convert g<->oz. (6) Time displays convert 24h<->12h(am/pm) everywhere. Per explicit user decision, custom database item names (task items entered by user, e.g. feed names) are NOT translated in this iteration - this is intentional, not a bug, user wants a separate 'care plan' translation feature later. Please test: (a) default settings are English/g/12h on fresh state, (b) switching to Danish and saving updates ALL screens' text immediately, (c) switching weight unit to oz converts display and new entries correctly store as grams, (d) switching time format to 24h updates all time displays (Tasks>Times, Schedules, Overview, forms), (e) general regression on existing features (dragons CRUD, tasks CRUD, schedule CRUD, weight CRUD, admin banner/appearance/export/import) since many files were touched. IMPORTANT: no auth in this app, no credentials needed."


## NEW FEATURE (this session): Default Care Plan Reset + AI Auto-Translation of Custom Items

### backend:
  - task: "Reset & load default care plan (backend)"
    implemented: true
    working: "NA"
    file: "backend/routes/admin.py, backend/services/careplan_seed.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "New POST /api/admin/reset-careplan endpoint: deletes ALL docs in times, task_items, schedule_slots, completions collections (dragons and weight_entries are NEVER touched), then seeds 7 default times, 12 bilingual (da/en) task items (feeding/care/light&heat, based on researched bearded dragon husbandry guidelines), and a full weekly schedule for all 4 age categories (2-4, 4-7, 7-12, 12+ months) with age-appropriate insect-feeding frequency (juveniles daily 2x/day, sub-adults every-other-day, adults 2x/week) + daily veg/care/light tasks + weekly Sunday cleaning. Returns {times_count, items_count, schedule_slots_count}. Verified manually: 7 times, 12 items, 163 schedule_slots created; everything remains normal editable CRUD data afterwards (no special 'locked' flag)."
  - task: "AI auto-translation of custom task item names (Gemini 3 Flash)"
    implemented: true
    working: "NA"
    file: "backend/services/translator.py, backend/routes/task_items.py, backend/models.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "TaskItem model now has optional name_da/name_en fields. On POST /api/task-items (and PUT when name actually changed / translation missing), backend calls Gemini 3 Flash via Emergent LLM key (EMERGENT_LLM_KEY added to backend/.env) to translate the entered name into the other language, storing both. Never raises - falls back to using the original text for both languages if the LLM call fails, so item save never breaks. PUT is smart: skips re-translation if name is unchanged (e.g. just toggling the 'automatic' switch) to avoid wasteful LLM calls / translation drift. Manually verified: POST with name='Cikader', source_language='da' correctly returned name_en='Cicadas'. GET /api/daily-overview now reads app_settings.language and returns item_names in the correct language (verified da and en)."

### frontend:
  - task: "Reset & load care plan Admin UI (double confirm)"
    implemented: true
    working: "NA"
    file: "frontend/app/(tabs)/admin.tsx, frontend/i18n/translations.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "New 'Default care plan' section added at the very bottom of Admin (after Language & units), with a red destructive button (admin-careplan-reset-button) that opens a custom Modal (admin-careplan-confirm-modal) requiring the user to TYPE the word 'NULSTIL' (Danish UI) or 'RESET' (English UI) into a text input (admin-careplan-confirm-input) before the confirm button (admin-careplan-confirm-button) becomes active. On confirm, calls POST /api/admin/reset-careplan and shows a toast with the counts. Cancel button (admin-careplan-confirm-cancel) closes without action."
  - task: "Task item bilingual display across all screens"
    implemented: true
    working: "NA"
    file: "frontend/i18n/translations.ts (getItemDisplayName), frontend/app/(tabs)/lists.tsx, schedule.tsx, schedule-slot-form.tsx, frontend/app/list-item-form.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "New getItemDisplayName(item, lang) helper picks item.name_da/name_en based on current language, falling back to item.name for legacy items without translations. Wired into: Tasks item rows, Schedules slot item names, Schedule-slot-form item picker/selected value. list-item-form.tsx now sends source_language (current app language) on create/update so the backend can auto-translate, and prefills the edit field with the language-appropriate name."

## test_plan (updated):
  current_focus:
    - "Reset & load default care plan (backend)"
    - "AI auto-translation of custom task item names (Gemini 3 Flash)"
    - "Reset & load care plan Admin UI (double confirm)"
    - "Task item bilingual display across all screens"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

## agent_communication (new):
    - agent: "main"
      message: "Implemented Admin > 'Default care plan' reset feature per user request: (1) New destructive button + type-to-confirm modal (word must match NULSTIL/RESET depending on current language) that wipes Times/Task-items/Schedule-slots/Completions for ALL age categories (dragons and weight history are untouched) and reloads a complete bilingual (da/en) default care plan I researched (feeding frequency by age, UVB/heat schedule, care tasks) - everything remains fully editable afterwards via normal CRUD. (2) NEW: custom task items (feeding/care/light) the user creates or edits from now on are AUTOMATICALLY translated between Danish/English using Gemini 3 Flash via the Emergent LLM key - manually verified 'Cikader' (da) -> 'Cicadas' (en). Please test: (a) reset button requires typing exact confirm word before it becomes clickable, wrong word shows error toast, (b) after reset, times/items/schedules show correctly translated per current language toggle and are still fully editable (add/edit/delete), (c) creating a NEW custom feeding/care/light item auto-translates within a few seconds and shows correctly when switching language, (d) dragons and weight history survive the reset untouched, (e) daily overview reflects language-correct item names. IMPORTANT: LLM translation calls take a couple seconds - not mocked, real Gemini 3 Flash calls via EMERGENT_LLM_KEY."


## FOLLOW-UP (this session): First-run auto-seed + "capture edited plan as new default" workflow

### backend:
  - task: "Auto-seed default care plan on first run / fresh install"
    implemented: true
    working: true
    file: "backend/server.py, backend/services/careplan_seed.py (apply_default_careplan, seed_if_empty)"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Refactored the DB-insert logic out of the /admin/reset-careplan endpoint into a shared `apply_default_careplan(db)` function in services/careplan_seed.py. Added a FastAPI startup event in server.py that calls `seed_if_empty(db)` - checks if times/task_items/schedule_slots are ALL empty and, if so, auto-loads the default plan (strict no-op otherwise, dragons/weights never touched). Manually verified: (1) normal restart with existing data -> no-op, all data preserved (7 times/12 items/6 dragons unchanged); (2) simulated fresh install (wiped times/items/slots/completions only) -> restart logs 'First-run auto-seed: loaded default care plan {times_count:7, items_count:12, schedule_slots_count:163}', dragons remained untouched (still 6). No new UI surface - internal behavior only, did not re-invoke testing_agent for this infra-only change since it was directly verified via server logs + API checks."
  - task: "Capture user-edited plan as new permanent default (scripts/capture_default_careplan.py)"
    implemented: true
    working: true
    file: "backend/scripts/capture_default_careplan.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Per user request: no 'Save as default' button in the UI. Instead, user freely edits Times/Feeding/Care/Light&Heat/Schedules in the app as normal, then asks main agent (in chat) to lock it in. Built scripts/capture_default_careplan.py which reads the LIVE db.times/task_items/schedule_slots, and REWRITES backend/services/careplan_seed.py with an explicit (non-procedural) snapshot of exactly that state (bilingual item names preserved, all age/day combinations preserved literally). This becomes the new default for both the 'Reset & load care plan' button AND first-run auto-seed. Dry-run tested end-to-end: captured current (still-original) plan, verified generated file re-imports with matching counts (7/12/163), then restored the original hand-written seed file since the user has not started customizing yet. NEXT SESSION: when user says the plan is ready, run `cd /app/backend && python3 scripts/capture_default_careplan.py` then restart backend."

## agent_communication (new):
    - agent: "main"
      message: "Built the infrastructure the user asked for: (1) App now auto-seeds the default care plan on a completely fresh/empty database (first install), not just on manual Admin reset. (2) Added scripts/capture_default_careplan.py - when the user finishes customizing their Times/Feeding/Care/Light&Heat/Schedules to their liking in the app and tells me (in chat) it's ready, I will run this script to capture their EXACT edited state and permanently overwrite the built-in default plan file, so it becomes what loads on reset AND on fresh installs going forward. No new 'Save as default' UI button was added, per explicit user preference (they will just ask in chat when ready). This session's changes are backend-only infra with no new UI - verified via direct server logs/API checks (restart-with-data preserved; simulated-fresh-install triggered correct auto-seed with dragons untouched); did not re-invoke the full testing_agent since there's no new UI surface to click through and previous care-plan-reset test coverage already validates the underlying seeding function this reuses."
