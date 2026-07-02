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
  test_sequence: 1
  run_ui: false

## test_plan:
  current_focus:
    - "Language/Weight/Time settings context + Admin UI"
    - "Full UI translation (English/Danish) across all screens"
    - "Weight unit (g/oz) display + input conversion"
    - "Time format (12h/24h) applied wherever times are shown"
    - "AppSettings model - language/weight_unit/time_format fields"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

## agent_communication:
    - agent: "main"
      message: "Implemented full localization feature: (1) Backend AppSettings model extended with language/weight_unit/time_format (defaults en/g/12h). (2) New Admin 'Language & units' section with 3 toggle groups + save button. (3) All static UI text across every screen (Overview, Dragons, Tasks, Schedules, Admin, and all forms/modals) now uses a t() translation function with full Danish+English dictionaries. (4) Built-in enums (days, age categories, gender, task categories) translate dynamically. (5) Weight displays convert g<->oz. (6) Time displays convert 24h<->12h(am/pm) everywhere. Per explicit user decision, custom database item names (task items entered by user, e.g. feed names) are NOT translated in this iteration - this is intentional, not a bug, user wants a separate 'care plan' translation feature later. Please test: (a) default settings are English/g/12h on fresh state, (b) switching to Danish and saving updates ALL screens' text immediately, (c) switching weight unit to oz converts display and new entries correctly store as grams, (d) switching time format to 24h updates all time displays (Tasks>Times, Schedules, Overview, forms), (e) general regression on existing features (dragons CRUD, tasks CRUD, schedule CRUD, weight CRUD, admin banner/appearance/export/import) since many files were touched. IMPORTANT: no auth in this app, no credentials needed."
