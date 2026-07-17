export type Language = 'da' | 'en';
export type WeightUnit = 'g' | 'oz';
export type TimeFormat = '24h' | '12h';

// ---------------------------------------------------------------------------
// Flat UI text dictionary. Access via t('namespace.key', language, vars?).
// ---------------------------------------------------------------------------
export const UI_TEXT: Record<Language, Record<string, string>> = {
  da: {
    'common.save': 'Gem',
    'common.cancel': 'Annuller',
    'common.delete': 'Slet',
    'common.edit': 'Rediger',
    'common.add': 'Tilføj',
    'common.close': 'Luk',
    'common.of': 'af',
    'common.done': 'udført',
    'common.select': 'Vælg',
    'common.confirm': 'Bekræft',

    'selectSheet.empty': 'Ingen muligheder tilføjet endnu',

    'tabs.overview': 'Dagsoversigt',
    'tabs.dragons': 'Agamer',
    'tabs.schedule': 'Ugeplaner',
    'tabs.tasks': 'Opgaver',
    'tabs.admin': 'Admin',

    'overview.title': 'Dagsoversigt',
    'overview.today': 'I dag',
    'overview.fetchError': 'Kunne ikke hente dagsoversigt',
    'overview.updateError': 'Kunne ikke opdatere opgave',
    'overview.emptyTitle': 'Ingen agamer endnu',
    'overview.emptySubtitle': 'Tilføj din første agame for at se dagsoversigten',
    'overview.addDragon': 'Tilføj agame',

    'dragons.title': 'Agamer',
    'dragons.fetchError': 'Kunne ikke hente agamer',
    'dragons.deleteTitle': 'Slet {{name}}?',
    'dragons.deleteMessage': 'Alle registreringer for denne agame vil blive fjernet. Dette kan ikke fortrydes.',
    'dragons.deleteSuccess': 'Agame slettet',
    'dragons.deleteError': 'Kunne ikke slette agame',
    'dragons.emptyText': 'Ingen agamer tilføjet endnu',
    'dragons.weightCareplanButton': 'Vægt',

    'tasks.title': 'Opgaver',
    'tasks.tabTider': 'Tider',
    'tasks.tabFodring': 'Fodring',
    'tasks.tabPleje': 'Pleje',
    'tasks.tabLys': 'Lys & Varme',
    'tasks.fetchError': 'Kunne ikke hente lister',
    'tasks.notifDevBuildRequired': 'Notifikationer kræver en udviklings-build (ikke tilgængelig i Expo Go)',
    'tasks.notifPermissionDenied': 'Tilladelse til notifikationer blev afvist',
    'tasks.notifEnabled': 'Notifikationer aktiveret',
    'tasks.notifDisabled': 'Notifikationer slået fra',
    'tasks.notifUpdateError': 'Kunne ikke opdatere notifikationer',
    'tasks.deleteTimeTitle': 'Slet {{time}}?',
    'tasks.timeDeletedSuccess': 'Tidspunkt slettet',
    'tasks.timeDeleteError': 'Kunne ikke slette tidspunkt',
    'tasks.deleteItemTitle': 'Slet "{{name}}"?',
    'tasks.deleteItemMessage': 'Emnet fjernes også fra alle ugeplaner, hvor det er brugt.',
    'tasks.itemDeletedSuccess': 'Emne slettet',
    'tasks.itemDeleteError': 'Kunne ikke slette emne',
    'tasks.autoUpdateError': 'Kunne ikke opdatere automatik',
    'tasks.emptyTimes': 'Ingen tidspunkter tilføjet endnu',
    'tasks.emptyItems': 'Ingen emner tilføjet endnu',
    'tasks.automatic': 'Automatisk',
    'tasks.winterColumnHeader': 'Vinter',
    'tasks.winterTimeAuto': 'Auto (+30 min)',
    'tasks.settingsTitle': 'Indstillinger',
    'tasks.remindersLabel': 'Påmindelser',
    'tasks.remindersSubLabel': 'Få lokale notifikationer for planlagte opgaver',
    'tasks.feedingSuggestionsButton': 'Se foderforslag',

    'schedule.title': 'Ugeplaner',
    'schedule.fetchError': 'Kunne ikke hente ugeplan',
    'schedule.deleteTitle': 'Slet opgave',
    'schedule.deleteMessage':
      'Skal opgaven kun slettes for denne dag, eller for alle ugedage hvor samme opgave er oprettet på samme tidspunkt?',
    'schedule.deleteThisDayOnly': 'Slet kun denne dag',
    'schedule.deleteAllDays': 'Slet for alle ugedage',
    'schedule.deleteSuccess': 'Opgave slettet',
    'schedule.deleteAllSuccess': 'Opgave slettet for {{n}} ugedage',
    'schedule.deleteError': 'Kunne ikke slette opgave',
    'schedule.emptyText': 'Ingen opgaver planlagt for denne dag endnu',
    'schedule.automatic': 'Automatisk',
    'schedule.manual': 'Manuel',

    'dragonForm.editTitle': 'Rediger agame',
    'dragonForm.newTitle': 'Ny agame',
    'dragonForm.fetchError': 'Kunne ikke hente agame',
    'dragonForm.permissionError': 'Tilladelse er nødvendig for at tilføje billede',
    'dragonForm.validationError': 'Udfyld venligst alle felter',
    'dragonForm.updateSuccess': 'Agame opdateret',
    'dragonForm.addSuccess': 'Agame tilføjet',
    'dragonForm.saveError': 'Kunne ikke gemme agame',
    'dragonForm.nameLabel': 'Navn',
    'dragonForm.namePlaceholder': 'F.eks. Spike',
    'dragonForm.genderLabel': 'Køn',
    'dragonForm.genderPlaceholder': 'Vælg køn',
    'dragonForm.colorLabel': 'Farve',
    'dragonForm.colorPlaceholder': 'F.eks. Orange',
    'dragonForm.morphLabel': 'Morph',
    'dragonForm.morphPlaceholder': 'F.eks. Hypo Leatherback',
    'dragonForm.birthdayLabel': 'Fødselsdag',
    'dragonForm.ageAutoLabel': 'Alderskategori (beregnes automatisk)',
    'dragonForm.saveChanges': 'Gem ændringer',
    'dragonForm.addDragon': 'Tilføj agame',
    'dragonForm.addPhotoTitle': 'Tilføj billede',
    'dragonForm.takePhoto': 'Tag foto',
    'dragonForm.chooseFromGallery': 'Vælg fra galleri',

    'slotForm.editTitle': 'Rediger opgave',
    'slotForm.newTitle': 'Ny opgave',
    'slotForm.fetchError': 'Kunne ikke hente data',
    'slotForm.validationError': 'Vælg venligst kategori og tidspunkt',
    'slotForm.updateSuccess': 'Opgave opdateret',
    'slotForm.addSuccess': 'Opgave tilføjet til ugeplan',
    'slotForm.copySuccess': 'Opgave kopieret til {{d}} dage × {{p}} perioder',
    'slotForm.saveError': 'Kunne ikke gemme opgave',
    'slotForm.categoryLabel': 'Kategori',
    'slotForm.categoryPlaceholder': 'Vælg kategori',
    'slotForm.timeLabel': 'Tidspunkt',
    'slotForm.timeAddUnderLists': 'Tilføj tider under Opgaver',
    'slotForm.timePlaceholder': 'Vælg tidspunkt',
    'slotForm.itemsLabel': 'Emner',
    'slotForm.itemsAddUnderLists': 'Tilføj emner under Opgaver',
    'slotForm.itemsPlaceholder': 'Vælg et eller flere emner',
    'slotForm.autoInfoNone': 'Vælg emner for at se om opgaven bliver automatisk eller manuel',
    'slotForm.autoInfoAuto': 'Automatisk - kræver ikke afkrydsning på dagsoversigten',
    'slotForm.autoInfoManual': 'Manuel - kræver afkrydsning på dagsoversigten',
    'slotForm.copyButton': 'Kopier til dage',
    'slotForm.copySubtext': '{{d}} dage × {{p}} perioder = {{total}} opgaver',
    'slotForm.saveChanges': 'Gem ændringer',
    'slotForm.addTask': 'Tilføj opgave',
    'slotForm.selectCategoryTitle': 'Vælg kategori',
    'slotForm.selectTimeTitle': 'Vælg tidspunkt',
    'slotForm.selectItemsTitle': 'Vælg emner',

    'listItemForm.editPrefix': 'Rediger',
    'listItemForm.addPrefix': 'Tilføj',
    'listItemForm.timeWord': 'tidspunkt',
    'listItemForm.timeLabel': 'Tidspunkt',
    'listItemForm.winterTimeToggleLabel': 'Speciel vintertid',
    'listItemForm.winterTimeToggleSubLabel':
      'Angiv et andet tidspunkt der bruges i vinterperioden. Slået fra: opgaven starter automatisk 30 min. efter dagens lys tændt-tidspunkt i vinterperioden.',
    'listItemForm.winterTimeLabel': 'Vintertid',
    'listItemForm.namePlaceholder': 'F.eks. Larver',
    'listItemForm.nameLabel': 'Navn',
    'listItemForm.automaticLabel': 'Automatisk',
    'listItemForm.automaticSubLabel': 'Ingen afkrydsning nødvendig på dagsoversigten',
    'listItemForm.nameRequired': 'Angiv venligst et navn',
    'listItemForm.timeUpdated': 'Tidspunkt opdateret',
    'listItemForm.timeAdded': 'Tidspunkt tilføjet',
    'listItemForm.itemUpdated': 'Emne opdateret',
    'listItemForm.itemAdded': 'Emne tilføjet',
    'listItemForm.saveError': 'Kunne ikke gemme',
    'listItemForm.saveChanges': 'Gem ændringer',
    'listItemForm.add': 'Tilføj',

    'weight.headerSuffix': 'Vægt',
    'weight.fetchError': 'Kunne ikke hente vægtmålinger',
    'weight.latestLabel': 'Sidste registrerede vægt',
    'weight.noneYet': 'Ingen vægt registreret endnu',
    'weight.registerNew': 'Registrer ny vægt',
    'weight.weightLabel': 'Vægt ({{unit}})',
    'weight.weightPlaceholder': 'F.eks. {{example}}',
    'weight.dateLabel': 'Dato',
    'weight.noteLabel': 'Note (valgfri)',
    'weight.notePlaceholder': 'F.eks. Efter skifte af hud',
    'weight.registerButton': 'Registrer vægt',
    'weight.invalidWeight': 'Angiv venligst en gyldig vægt',
    'weight.registerSuccess': 'Vægt registreret',
    'weight.registerError': 'Kunne ikke registrere vægt',
    'weight.chartTitle': 'Udvikling - sidste 12 måneder',
    'weight.chartEmpty': 'Ikke nok data endnu - registrer mindst 2 vægtmålinger for at se en graf',
    'weight.historyTitle': 'Tidligere målinger',
    'weight.historyEmpty': 'Ingen målinger registreret endnu',
    'weight.deleteTitle': 'Slet vægtmåling?',
    'weight.deleteMessage': '{{weight}} fra {{date}} bliver slettet.',
    'weight.deleteSuccess': 'Vægtmåling slettet',
    'weight.deleteError': 'Kunne ikke slette',
    'weight.exportPdfButton': 'Eksporter PDF',
    'weight.exportPdfSuccess': 'PDF-rapport oprettet',
    'weight.exportPdfError': 'Kunne ikke oprette PDF-rapport',
    'weight.exportPdfNoData': 'Registrer mindst én vægt for at eksportere en rapport',
    'weight.exportPdfWebUnsupported': 'PDF-eksport kræver Expo Go eller en installeret app på din telefon',
    'weight.pdfBirthdayLabel': 'Fødselsdag',
    'weight.pdfAgeLabel': 'Nuværende alder',
    'weight.pdfAgeYears': 'år',
    'weight.pdfAgeMonths': 'måneder',
    'weight.pdfAgeMonth': 'måned',
    'weight.pdfAgeUnderMonth': 'Under 1 måned',
    'weight.pdfTableDate': 'Dato',
    'weight.pdfTableWeight': 'Vægt',
    'weight.pdfTableNotes': 'Note',
    'weight.pdfNoEntries': 'Ingen vægtmålinger registreret',
    'weight.pdfChartTitle': 'Vægtudvikling',
    'weight.pdfHistoryTitle': 'Vægtmålinger',
    'weight.pdfChartEmpty': 'Ikke nok data til at vise en graf (min. 2 målinger)',
    'weight.pdfGeneratedOn': 'Rapport genereret',

    'admin.title': 'Admin',
    'admin.dbSectionTitle': 'Database',
    'admin.dbSectionSubtitle':
      'Eksporter alle dine data til en fil, som du kan gemme og importere igen ved skift til en ny enhed.',
    'admin.exportButton': 'Eksporter database',
    'admin.importButton': 'Importer database',
    'admin.exportError': 'Kunne ikke eksportere database',
    'admin.webUnsupported': 'Denne funktion kræver Expo Go eller en installeret app på din telefon',
    'admin.exportSuccess': 'Database eksporteret',
    'admin.importInvalidFile': 'Ugyldig backup-fil',
    'admin.importConfirmTitle': 'Importer database?',
    'admin.importConfirmMessage':
      'Dette overskriver ALLE nuværende agamer, opgaver og ugeplaner med indholdet af filen. Kan ikke fortrydes.',
    'admin.importConfirmButton': 'Importer og overskriv',
    'admin.importSuccess': 'Database importeret',
    'admin.importError': 'Kunne ikke importere database',
    'admin.importReadError': 'Kunne ikke læse filen',
    'admin.bannerSectionTitle': 'Banner',
    'admin.bannerSectionSubtitle':
      'Vælg et billede der vises som banner i toppen af alle sider, og en valgfri tekst der lægges over billedet.',
    'admin.bannerPermissionError': 'Tilladelse er nødvendig for at vælge billede',
    'admin.bannerSaveSuccess': 'Banner gemt',
    'admin.bannerSaveError': 'Kunne ikke gemme banner',
    'admin.bannerChoosePlaceholder': 'Vælg banner-billede',
    'admin.bannerRemoveImage': 'Fjern billede',
    'admin.bannerTextLabel': 'Bannertekst (valgfri)',
    'admin.bannerTextPlaceholder': 'F.eks. Velkommen til vores skægagamer',
    'admin.bgColorLabel': 'Baggrundsfarve (kun når intet billede er valgt)',
    'admin.headingColorLabel': 'Overskriftsfarve',
    'admin.saveBannerButton': 'Gem banner',
    'admin.appearanceSectionTitle': 'App-udseende',
    'admin.appearanceSectionSubtitle':
      'Vælg appens baggrundsfarve (bag sideoverskrifterne) og tekstfarven på titlerne "Dagsoversigt", "Agamer", "Ugeplaner" osv.',
    'admin.appBgColorLabel': 'App-baggrundsfarve',
    'admin.pageTitleColorLabel': 'Sideoverskrift-farve',
    'admin.saveAppearanceButton': 'Gem udseende',
    'admin.appearanceSaveSuccess': 'Udseende gemt',
    'admin.appearanceSaveError': 'Kunne ikke gemme udseende',
    'admin.langSectionTitle': 'Sprog & enheder',
    'admin.langSectionSubtitle':
      'Vælg app-sprog, vægt-enhed og tidsformat. Ændringer træder først i kraft når du trykker Gem.',
    'admin.languageLabel': 'Sprog',
    'admin.weightUnitLabel': 'Vægt-enhed',
    'admin.timeFormatLabel': 'Tidsformat',
    'admin.saveLangButton': 'Gem indstillinger',
    'admin.langSaveSuccess': 'Indstillinger gemt',
    'admin.langSaveError': 'Kunne ikke gemme indstillinger',
    'admin.languageDanish': 'Dansk',
    'admin.languageEnglish': 'English',
    'admin.timeFormat24h': '24-timer',
    'admin.timeFormat12h': 'AM/PM',

    'admin.careplanSectionTitle': 'Standard plejeplan',
    'admin.careplanSectionSubtitle':
      'Nulstil alle Tider, Fodring/Pleje/Lys-emner og Ugeplaner (alle aldre) og indlæs en komplet, tosproget standard-plejeplan. Dine agamer og deres vægthistorik påvirkes IKKE. Alt forbliver frit redigerbart bagefter.',
    'admin.careplanResetButton': 'Nulstil & indlæs plejeplan',
    'admin.careplanConfirmTitle': 'Er du helt sikker?',
    'admin.careplanConfirmMessage':
      'Dette sletter permanent ALLE nuværende Tider, Fodring/Pleje/Lys-emner og Ugeplaner for alle alderskategorier, og erstatter dem med en standard-plejeplan. Kan ikke fortrydes. Agamer og vægthistorik berøres ikke.',
    'admin.careplanConfirmWord': 'NULSTIL',
    'admin.careplanConfirmPlaceholder': 'Skriv NULSTIL',
    'admin.careplanConfirmMismatch': 'Du skal skrive "NULSTIL" for at bekræfte',
    'admin.careplanResetSuccess': 'Plejeplan indlæst: {{times}} tider, {{items}} emner, {{slots}} ugeplan-opgaver',
    'admin.careplanResetError': 'Kunne ikke nulstille plejeplan',

    'admin.seasonSectionTitle': 'Sæsonperiode',
    'admin.seasonSectionSubtitle':
      'Angiv hvornår vinterperioden starter og slutter. I vinterperioden bruger Dagsoversigten automatisk de vintertider, du sætter under Opgaver → Tider.',
    'admin.seasonSummerLabel': 'Sommer starter (dag-måned)',
    'admin.seasonWinterLabel': 'Vinter starter (dag-måned)',
    'admin.seasonUpdateSuccess': 'Sæsonindstilling opdateret',
    'admin.seasonUpdateError': 'Kunne ikke opdatere sæsonindstilling',
    'admin.seasonWinterBadge': 'Vinterperiode - vintertider aktive',

    'admin.helpSectionTitle': 'Hjælp & FAQ',
    'admin.helpSectionSubtitle':
      'Find svar på almindelige spørgsmål, eller download en komplet PDF-vejledning til hele appen.',
    'admin.helpFaqButton': 'Åbn FAQ / Hjælp',
    'admin.helpPdfButton': 'Download PDF vejledning',
    'admin.helpPdfError': 'Kunne ikke oprette PDF-vejledning',

    'copyToDays.title': 'Kopier til dage & perioder',
    'copyToDays.subtitle':
      'Opgaven oprettes automatisk for alle valgte dage og perioder. Den nuværende dag og periode er altid inkluderet.',
    'copyToDays.daysGroupTitle': 'Ugedage',
    'copyToDays.agesGroupTitle': 'Alderskategorier',
    'copyToDays.selectAll': 'Vælg alle',
    'copyToDays.deselectAll': 'Fjern alle',
    'copyToDays.current': 'Nuværende',
    'copyToDays.done': 'Færdig',

    'dragonColumn.emptyTasks': 'Ingen opgaver i dag for {{age}}',

    'overview.activeState': 'Aktiv',
    'overview.brumationState': 'Dvale',
    'overview.brumationToastOn': '{{name}} er nu i dvale - fodring skjules indtil aktiveret igen',
    'overview.brumationToastOff': '{{name}} er aktiv igen - fodring vises som normalt',
    'overview.activityUpdateError': 'Kunne ikke opdatere status',
    'overview.calendarButton': 'Vælg dato i kalender',
    'overview.calendarTitle': 'Vælg dato',
    'overview.calendarFetchError': 'Kunne ikke indlæse kalenderdata',
    'overview.calendarLegendDone': 'Fuldført',
    'overview.calendarLegendPartial': 'Delvist',
    'overview.calendarLegendNone': 'Intet registreret',
    'overview.calendarToday': 'I dag',

    'taskRow.automatic': 'Automatisk',
  },
  en: {
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.close': 'Close',
    'common.of': 'of',
    'common.done': 'done',
    'common.select': 'Select',
    'common.confirm': 'Confirm',

    'selectSheet.empty': 'No options added yet',

    'tabs.overview': 'Overview',
    'tabs.dragons': 'Dragons',
    'tabs.schedule': 'Schedules',
    'tabs.tasks': 'Tasks',
    'tabs.admin': 'Admin',

    'overview.title': 'Overview',
    'overview.today': 'Today',
    'overview.fetchError': 'Could not load overview',
    'overview.updateError': 'Could not update task',
    'overview.emptyTitle': 'No dragons yet',
    'overview.emptySubtitle': 'Add your first dragon to see the daily overview',
    'overview.addDragon': 'Add dragon',

    'dragons.title': 'Dragons',
    'dragons.fetchError': 'Could not load dragons',
    'dragons.deleteTitle': 'Delete {{name}}?',
    'dragons.deleteMessage': 'All records for this dragon will be removed. This cannot be undone.',
    'dragons.deleteSuccess': 'Dragon deleted',
    'dragons.deleteError': 'Could not delete dragon',
    'dragons.emptyText': 'No dragons added yet',
    'dragons.weightCareplanButton': 'Weight',

    'tasks.title': 'Tasks',
    'tasks.tabTider': 'Times',
    'tasks.tabFodring': 'Feeding',
    'tasks.tabPleje': 'Care',
    'tasks.tabLys': 'Light & Heat',
    'tasks.fetchError': 'Could not load lists',
    'tasks.notifDevBuildRequired': 'Notifications require a development build (not available in Expo Go)',
    'tasks.notifPermissionDenied': 'Notification permission was denied',
    'tasks.notifEnabled': 'Notifications enabled',
    'tasks.notifDisabled': 'Notifications turned off',
    'tasks.notifUpdateError': 'Could not update notifications',
    'tasks.deleteTimeTitle': 'Delete {{time}}?',
    'tasks.timeDeletedSuccess': 'Time deleted',
    'tasks.timeDeleteError': 'Could not delete time',
    'tasks.deleteItemTitle': 'Delete "{{name}}"?',
    'tasks.deleteItemMessage': 'The item will also be removed from all schedules where it is used.',
    'tasks.itemDeletedSuccess': 'Item deleted',
    'tasks.itemDeleteError': 'Could not delete item',
    'tasks.autoUpdateError': 'Could not update automation',
    'tasks.emptyTimes': 'No times added yet',
    'tasks.emptyItems': 'No items added yet',
    'tasks.automatic': 'Automatic',
    'tasks.winterColumnHeader': 'Winter',
    'tasks.winterTimeAuto': 'Auto (+30 min)',
    'tasks.settingsTitle': 'Settings',
    'tasks.remindersLabel': 'Reminders',
    'tasks.remindersSubLabel': 'Get local notifications for scheduled tasks',
    'tasks.feedingSuggestionsButton': 'View feeding suggestions',

    'schedule.title': 'Schedules',
    'schedule.fetchError': 'Could not load schedule',
    'schedule.deleteTitle': 'Delete task',
    'schedule.deleteMessage':
      'Should the task only be deleted for this day, or for all weekdays where the same task is created at the same time?',
    'schedule.deleteThisDayOnly': 'Delete only this day',
    'schedule.deleteAllDays': 'Delete for all weekdays',
    'schedule.deleteSuccess': 'Task deleted',
    'schedule.deleteAllSuccess': 'Task deleted for {{n}} weekdays',
    'schedule.deleteError': 'Could not delete task',
    'schedule.emptyText': 'No tasks scheduled for this day yet',
    'schedule.automatic': 'Automatic',
    'schedule.manual': 'Manual',

    'dragonForm.editTitle': 'Edit dragon',
    'dragonForm.newTitle': 'New dragon',
    'dragonForm.fetchError': 'Could not load dragon',
    'dragonForm.permissionError': 'Permission is required to add a photo',
    'dragonForm.validationError': 'Please fill in all fields',
    'dragonForm.updateSuccess': 'Dragon updated',
    'dragonForm.addSuccess': 'Dragon added',
    'dragonForm.saveError': 'Could not save dragon',
    'dragonForm.nameLabel': 'Name',
    'dragonForm.namePlaceholder': 'e.g. Spike',
    'dragonForm.genderLabel': 'Gender',
    'dragonForm.genderPlaceholder': 'Select gender',
    'dragonForm.colorLabel': 'Color',
    'dragonForm.colorPlaceholder': 'e.g. Orange',
    'dragonForm.morphLabel': 'Morph',
    'dragonForm.morphPlaceholder': 'e.g. Hypo Leatherback',
    'dragonForm.birthdayLabel': 'Birthday',
    'dragonForm.ageAutoLabel': 'Age category (calculated automatically)',
    'dragonForm.saveChanges': 'Save changes',
    'dragonForm.addDragon': 'Add dragon',
    'dragonForm.addPhotoTitle': 'Add photo',
    'dragonForm.takePhoto': 'Take photo',
    'dragonForm.chooseFromGallery': 'Choose from gallery',

    'slotForm.editTitle': 'Edit task',
    'slotForm.newTitle': 'New task',
    'slotForm.fetchError': 'Could not load data',
    'slotForm.validationError': 'Please select a category and a time',
    'slotForm.updateSuccess': 'Task updated',
    'slotForm.addSuccess': 'Task added to schedule',
    'slotForm.copySuccess': 'Task copied to {{d}} days × {{p}} periods',
    'slotForm.saveError': 'Could not save task',
    'slotForm.categoryLabel': 'Category',
    'slotForm.categoryPlaceholder': 'Select category',
    'slotForm.timeLabel': 'Time',
    'slotForm.timeAddUnderLists': 'Add times under Tasks',
    'slotForm.timePlaceholder': 'Select time',
    'slotForm.itemsLabel': 'Items',
    'slotForm.itemsAddUnderLists': 'Add items under Tasks',
    'slotForm.itemsPlaceholder': 'Select one or more items',
    'slotForm.autoInfoNone': 'Select items to see if the task becomes automatic or manual',
    'slotForm.autoInfoAuto': 'Automatic - does not require checking off on the overview',
    'slotForm.autoInfoManual': 'Manual - requires checking off on the overview',
    'slotForm.copyButton': 'Copy to days',
    'slotForm.copySubtext': '{{d}} days × {{p}} periods = {{total}} tasks',
    'slotForm.saveChanges': 'Save changes',
    'slotForm.addTask': 'Add task',
    'slotForm.selectCategoryTitle': 'Select category',
    'slotForm.selectTimeTitle': 'Select time',
    'slotForm.selectItemsTitle': 'Select items',

    'listItemForm.editPrefix': 'Edit',
    'listItemForm.addPrefix': 'Add',
    'listItemForm.timeWord': 'time',
    'listItemForm.timeLabel': 'Time',
    'listItemForm.winterTimeToggleLabel': 'Special winter time',
    'listItemForm.winterTimeToggleSubLabel':
      'Set a different time to use during the winter period. Off: the task automatically starts 30 min after the day\'s light-on time during winter.',
    'listItemForm.winterTimeLabel': 'Winter time',
    'listItemForm.namePlaceholder': 'e.g. Mealworms',
    'listItemForm.nameLabel': 'Name',
    'listItemForm.automaticLabel': 'Automatic',
    'listItemForm.automaticSubLabel': 'No checking off needed on the overview',
    'listItemForm.nameRequired': 'Please enter a name',
    'listItemForm.timeUpdated': 'Time updated',
    'listItemForm.timeAdded': 'Time added',
    'listItemForm.itemUpdated': 'Item updated',
    'listItemForm.itemAdded': 'Item added',
    'listItemForm.saveError': 'Could not save',
    'listItemForm.saveChanges': 'Save changes',
    'listItemForm.add': 'Add',

    'weight.headerSuffix': 'Weight',
    'weight.fetchError': 'Could not load weight entries',
    'weight.latestLabel': 'Last recorded weight',
    'weight.noneYet': 'No weight recorded yet',
    'weight.registerNew': 'Register new weight',
    'weight.weightLabel': 'Weight ({{unit}})',
    'weight.weightPlaceholder': 'e.g. {{example}}',
    'weight.dateLabel': 'Date',
    'weight.noteLabel': 'Note (optional)',
    'weight.notePlaceholder': 'e.g. After shedding',
    'weight.registerButton': 'Register weight',
    'weight.invalidWeight': 'Please enter a valid weight',
    'weight.registerSuccess': 'Weight registered',
    'weight.registerError': 'Could not register weight',
    'weight.chartTitle': 'Trend - last 12 months',
    'weight.chartEmpty': 'Not enough data yet - register at least 2 weight entries to see a graph',
    'weight.historyTitle': 'Previous measurements',
    'weight.historyEmpty': 'No measurements recorded yet',
    'weight.deleteTitle': 'Delete weight entry?',
    'weight.deleteMessage': '{{weight}} from {{date}} will be deleted.',
    'weight.deleteSuccess': 'Weight entry deleted',
    'weight.deleteError': 'Could not delete',
    'weight.exportPdfButton': 'Export PDF',
    'weight.exportPdfSuccess': 'PDF report created',
    'weight.exportPdfError': 'Could not create PDF report',
    'weight.exportPdfNoData': 'Log at least one weight to export a report',
    'weight.exportPdfWebUnsupported': 'PDF export requires Expo Go or an installed app on your phone',
    'weight.pdfBirthdayLabel': 'Birthday',
    'weight.pdfAgeLabel': 'Current age',
    'weight.pdfAgeYears': 'years',
    'weight.pdfAgeMonths': 'months',
    'weight.pdfAgeMonth': 'month',
    'weight.pdfAgeUnderMonth': 'Under 1 month',
    'weight.pdfTableDate': 'Date',
    'weight.pdfTableWeight': 'Weight',
    'weight.pdfTableNotes': 'Note',
    'weight.pdfNoEntries': 'No weight entries recorded',
    'weight.pdfChartTitle': 'Weight trend',
    'weight.pdfHistoryTitle': 'Weight measurements',
    'weight.pdfChartEmpty': 'Not enough data to show a chart (min. 2 entries)',
    'weight.pdfGeneratedOn': 'Report generated',

    'admin.title': 'Admin',
    'admin.dbSectionTitle': 'Database',
    'admin.dbSectionSubtitle':
      'Export all your data to a file that you can keep and import again when switching to a new device.',
    'admin.exportButton': 'Export database',
    'admin.importButton': 'Import database',
    'admin.exportError': 'Could not export database',
    'admin.webUnsupported': 'This feature requires Expo Go or an installed app on your phone',
    'admin.exportSuccess': 'Database exported',
    'admin.importInvalidFile': 'Invalid backup file',
    'admin.importConfirmTitle': 'Import database?',
    'admin.importConfirmMessage':
      'This will overwrite ALL current dragons, tasks, and schedules with the contents of the file. This cannot be undone.',
    'admin.importConfirmButton': 'Import and overwrite',
    'admin.importSuccess': 'Database imported',
    'admin.importError': 'Could not import database',
    'admin.importReadError': 'Could not read the file',
    'admin.bannerSectionTitle': 'Banner',
    'admin.bannerSectionSubtitle':
      'Choose an image to show as a banner at the top of every page, and optional text to overlay on the image.',
    'admin.bannerPermissionError': 'Permission is required to select an image',
    'admin.bannerSaveSuccess': 'Banner saved',
    'admin.bannerSaveError': 'Could not save banner',
    'admin.bannerChoosePlaceholder': 'Choose banner image',
    'admin.bannerRemoveImage': 'Remove image',
    'admin.bannerTextLabel': 'Banner text (optional)',
    'admin.bannerTextPlaceholder': 'e.g. Welcome to our bearded dragons',
    'admin.bgColorLabel': 'Background color (only when no image is selected)',
    'admin.headingColorLabel': 'Heading color',
    'admin.saveBannerButton': 'Save banner',
    'admin.appearanceSectionTitle': 'App appearance',
    'admin.appearanceSectionSubtitle':
      'Choose the app\'s background color (behind the page titles) and the text color of titles like "Overview", "Dragons", "Schedules" etc.',
    'admin.appBgColorLabel': 'App background color',
    'admin.pageTitleColorLabel': 'Page title color',
    'admin.saveAppearanceButton': 'Save appearance',
    'admin.appearanceSaveSuccess': 'Appearance saved',
    'admin.appearanceSaveError': 'Could not save appearance',
    'admin.langSectionTitle': 'Language & units',
    'admin.langSectionSubtitle':
      'Choose the app language, weight unit, and time format. Changes only take effect when you press Save.',
    'admin.languageLabel': 'Language',
    'admin.weightUnitLabel': 'Weight unit',
    'admin.timeFormatLabel': 'Time format',
    'admin.saveLangButton': 'Save settings',
    'admin.langSaveSuccess': 'Settings saved',
    'admin.langSaveError': 'Could not save settings',
    'admin.languageDanish': 'Dansk',
    'admin.languageEnglish': 'English',
    'admin.timeFormat24h': '24-hour',
    'admin.timeFormat12h': 'AM/PM',

    'admin.careplanSectionTitle': 'Default care plan',
    'admin.careplanSectionSubtitle':
      'Reset all Times, Feeding/Care/Light&Heat items, and Schedules (all ages) and load a complete, bilingual default care plan. Your dragons and their weight history are NOT affected. Everything remains freely editable afterwards.',
    'admin.careplanResetButton': 'Reset & load care plan',
    'admin.careplanConfirmTitle': 'Are you absolutely sure?',
    'admin.careplanConfirmMessage':
      'This permanently deletes ALL current Times, Feeding/Care/Light&Heat items, and Schedules for every age category, and replaces them with a default care plan. This cannot be undone. Dragons and weight history are not affected.',
    'admin.careplanConfirmWord': 'RESET',
    'admin.careplanConfirmPlaceholder': 'Type RESET',
    'admin.careplanConfirmMismatch': 'You must type "RESET" to confirm',
    'admin.careplanResetSuccess': 'Care plan loaded: {{times}} times, {{items}} items, {{slots}} schedule tasks',
    'admin.careplanResetError': 'Could not reset care plan',

    'admin.seasonSectionTitle': 'Season period',
    'admin.seasonSectionSubtitle':
      'Set when the winter period starts and ends. During the winter period, the Daily Overview automatically uses the winter times you set under Tasks → Times.',
    'admin.seasonSummerLabel': 'Summer starts (day-month)',
    'admin.seasonWinterLabel': 'Winter starts (day-month)',
    'admin.seasonUpdateSuccess': 'Season setting updated',
    'admin.seasonUpdateError': 'Could not update season setting',
    'admin.seasonWinterBadge': 'Winter period - winter times active',

    'admin.helpSectionTitle': 'Help & FAQ',
    'admin.helpSectionSubtitle':
      'Find answers to common questions, or download a complete PDF guide for the whole app.',
    'admin.helpFaqButton': 'Open FAQ / Help',
    'admin.helpPdfButton': 'Download PDF guide',
    'admin.helpPdfError': 'Could not generate PDF guide',

    'copyToDays.title': 'Copy to days & periods',
    'copyToDays.subtitle':
      'The task is automatically created for all selected days and periods. The current day and period are always included.',
    'copyToDays.daysGroupTitle': 'Weekdays',
    'copyToDays.agesGroupTitle': 'Age categories',
    'copyToDays.selectAll': 'Select all',
    'copyToDays.deselectAll': 'Deselect all',
    'copyToDays.current': 'Current',
    'copyToDays.done': 'Done',

    'dragonColumn.emptyTasks': 'No tasks today for {{age}}',

    'overview.activeState': 'Active',
    'overview.brumationState': 'Brumation',
    'overview.brumationToastOn': '{{name}} is now in brumation - feeding is hidden until reactivated',
    'overview.brumationToastOff': '{{name}} is active again - feeding shows as normal',
    'overview.activityUpdateError': 'Could not update status',
    'overview.calendarButton': 'Pick a date on the calendar',
    'overview.calendarTitle': 'Select date',
    'overview.calendarFetchError': 'Could not load calendar data',
    'overview.calendarLegendDone': 'Completed',
    'overview.calendarLegendPartial': 'Partial',
    'overview.calendarLegendNone': 'Nothing logged',
    'overview.calendarToday': 'Today',

    'taskRow.automatic': 'Automatic',
  },
};

export function t(key: string, lang: Language, vars?: Record<string, string | number>): string {
  let str = UI_TEXT[lang]?.[key] ?? UI_TEXT.da[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    }
  }
  return str;
}

// ---------------------------------------------------------------------------
// Data-driven label maps (categories, age brackets, days, genders)
// ---------------------------------------------------------------------------
const AGE_LABELS: Record<Language, Record<string, string>> = {
  da: { '2-4': '2-4 måneder', '4-7': '4-7 måneder', '7-12': '7-12 måneder', '12+': '12+ måneder' },
  en: { '2-4': '2-4 months', '4-7': '4-7 months', '7-12': '7-12 months', '12+': '12+ months' },
};
export const AGE_CATEGORY_VALUES = ['2-4', '4-7', '7-12', '12+'] as const;

export function getAgeCategories(lang: Language) {
  return AGE_CATEGORY_VALUES.map((value) => ({ value, label: AGE_LABELS[lang][value] }));
}
export function getAgeLabel(value: string, lang: Language): string {
  return AGE_LABELS[lang]?.[value] || value;
}

const CATEGORY_LABELS_I18N: Record<Language, Record<string, string>> = {
  da: { fodring: 'Fodring', pleje: 'Pleje', lys: 'Lys & Varme' },
  en: { fodring: 'Feeding', pleje: 'Care', lys: 'Light & Heat' },
};
export const TASK_CATEGORY_VALUES = ['fodring', 'pleje', 'lys'] as const;
const CATEGORY_ICONS_MAP: Record<string, string> = { fodring: 'leaf', pleje: 'water', lys: 'sunny' };

export function getTaskCategories(lang: Language) {
  return TASK_CATEGORY_VALUES.map((value) => ({
    value,
    label: CATEGORY_LABELS_I18N[lang][value],
    icon: CATEGORY_ICONS_MAP[value],
  }));
}
export function getCategoryLabel(value: string, lang: Language): string {
  return CATEGORY_LABELS_I18N[lang]?.[value] || value;
}

const DAY_VALUES = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag'] as const;
const DAY_LABELS_I18N: Record<Language, Record<string, string>> = {
  da: {
    mandag: 'Mandag',
    tirsdag: 'Tirsdag',
    onsdag: 'Onsdag',
    torsdag: 'Torsdag',
    fredag: 'Fredag',
    lørdag: 'Lørdag',
    søndag: 'Søndag',
  },
  en: {
    mandag: 'Monday',
    tirsdag: 'Tuesday',
    onsdag: 'Wednesday',
    torsdag: 'Thursday',
    fredag: 'Friday',
    lørdag: 'Saturday',
    søndag: 'Sunday',
  },
};
const DAY_LABELS_SHORT_I18N: Record<Language, Record<string, string>> = {
  da: { mandag: 'Man', tirsdag: 'Tir', onsdag: 'Ons', torsdag: 'Tor', fredag: 'Fre', lørdag: 'Lør', søndag: 'Søn' },
  en: { mandag: 'Mon', tirsdag: 'Tue', onsdag: 'Wed', torsdag: 'Thu', fredag: 'Fri', lørdag: 'Sat', søndag: 'Sun' },
};

export function getDayLabel(value: string, lang: Language): string {
  return DAY_LABELS_I18N[lang]?.[value] || value;
}
export function getDayLabelShort(value: string, lang: Language): string {
  return DAY_LABELS_SHORT_I18N[lang]?.[value] || value;
}

const GENDER_LABELS: Record<Language, Record<string, string>> = {
  da: { Han: 'Han', Hun: 'Hun', Ukendt: 'Ukendt' },
  en: { Han: 'Male', Hun: 'Female', Ukendt: 'Unknown' },
};
export const GENDER_VALUES = ['Han', 'Hun', 'Ukendt'] as const;

export function getGenders(lang: Language) {
  return GENDER_VALUES.map((value) => ({ value, label: GENDER_LABELS[lang][value] }));
}
export function getGenderLabel(value: string, lang: Language): string {
  return GENDER_LABELS[lang]?.[value] || value;
}

// ---------------------------------------------------------------------------
// Known vocabulary dictionary - translates common bearded-dragon care terms
// (case-insensitive exact match). Custom/unknown text is left untouched.
// ---------------------------------------------------------------------------
const ITEM_DICTIONARY_DA_TO_EN: Record<string, string> = {
  'grøntsager': 'Vegetables',
  'grøntsag': 'Vegetable',
  'bladgrønt': 'Leafy greens',
  'foderdyr m. ben': 'Feeder insects w. legs (crickets/roaches)',
  'foderdyr m ben': 'Feeder insects w. legs (crickets/roaches)',
  'foderdyr u. ben': 'Feeder insects w/o legs (mealworms)',
  'foderdyr u ben': 'Feeder insects w/o legs (mealworms)',
  'kalk': 'Calcium',
  'kalcium': 'Calcium',
  'vitaminer': 'Vitamins',
  'larver': 'Mealworms',
  'melbøller': 'Mealworms',
  'krickets': 'Crickets',
  'liljekonval': 'Dubia roaches',
  'dubia': 'Dubia roaches',
  'frugt': 'Fruit',
  'insekter': 'Insects',
  'vand': 'Water',
  'uvb': 'UVB light',
  'uvb lys': 'UVB light',
  'varmelampe': 'Heat lamp',
  'keramisk varmelampe': 'Ceramic heat lamp',
  'keramisk pære': 'Ceramic bulb',
  'termometer': 'Thermometer',
  'hygrometer': 'Hygrometer',
  'fugtighed': 'Humidity',
  'rengøring': 'Cleaning',
  'bad': 'Bath',
  'badning': 'Bathing',
  'sand': 'Sand',
  'substrat': 'Substrate',
  'kloprydning': 'Nail trimming',
  'kloklip': 'Nail trimming',
};
const ITEM_DICTIONARY_EN_TO_DA: Record<string, string> = Object.fromEntries(
  Object.entries(ITEM_DICTIONARY_DA_TO_EN).map(([da, en]) => [en.toLowerCase(), da])
);

/** Translate a user-entered item name using the built-in vocabulary dictionary.
 * Unknown/custom text is returned unchanged (no AI translation is performed). */
export function translateItemName(name: string, lang: Language): string {
  if (!name) return name;
  const lower = name.trim().toLowerCase();
  if (lang === 'en') {
    const match = ITEM_DICTIONARY_DA_TO_EN[lower];
    if (match) return match;
  } else if (lang === 'da') {
    const match = ITEM_DICTIONARY_EN_TO_DA[lower];
    if (match) return match;
  }
  return name;
}

// ---------------------------------------------------------------------------
// Weight unit helpers - grams is always the canonical stored unit.
// ---------------------------------------------------------------------------
const GRAMS_PER_OZ = 28.3495;

export function gramsToDisplay(grams: number, unit: WeightUnit): number {
  if (unit === 'oz') return Math.round((grams / GRAMS_PER_OZ) * 10) / 10;
  return Math.round(grams);
}

export function displayToGrams(value: number, unit: WeightUnit): number {
  if (unit === 'oz') return Math.round(value * GRAMS_PER_OZ * 10) / 10;
  return value;
}

export function weightUnitLabel(unit: WeightUnit): string {
  return unit === 'oz' ? 'oz' : 'g';
}

export function formatWeightDisplay(grams: number, unit: WeightUnit): string {
  return `${gramsToDisplay(grams, unit)} ${weightUnitLabel(unit)}`;
}

// ---------------------------------------------------------------------------
// Time format helpers
// ---------------------------------------------------------------------------
export function formatTimeDisplay(hhmm: string, format: TimeFormat): string {
  if (!hhmm || !hhmm.includes(':')) return hhmm;
  if (format === '24h') return hhmm;
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${suffix}`;
}

// ---------------------------------------------------------------------------
// Date formatting (language-aware)
// ---------------------------------------------------------------------------
const MONTH_NAMES: Record<Language, string[]> = {
  da: ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const JS_WEEKDAY_TO_DAY = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'] as const;

export function formatFullDate(d: Date, lang: Language): string {
  const dayLabel = getDayLabel(JS_WEEKDAY_TO_DAY[d.getDay()], lang);
  return `${dayLabel} ${d.getDate()}. ${MONTH_NAMES[lang][d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateLabel(d: Date, lang: Language): string {
  return `${d.getDate()}. ${MONTH_NAMES[lang][d.getMonth()]} ${d.getFullYear()}`;
}

export function getMonthYearLabel(d: Date, lang: Language): string {
  return `${MONTH_NAMES[lang][d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// ---------------------------------------------------------------------------
// Task item display name - prefers the bilingual name_da/name_en fields
// (populated by the backend on create/update, incl. AI-translated custom
// items and the seeded default care plan). Falls back to the raw `name`
// field for older items that predate this feature.
// ---------------------------------------------------------------------------
export function getItemDisplayName(
  item: { name: string; name_da?: string | null; name_en?: string | null },
  lang: Language
): string {
  if (lang === 'da') return item.name_da || item.name;
  return item.name_en || item.name;
}
