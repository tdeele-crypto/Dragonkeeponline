import { formatDateLabel } from '@/i18n/translations';

type GuideLang = 'da' | 'en';

interface GuideChapter {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

interface GuideContent {
  docTitle: string;
  docSubtitle: string;
  generatedOnLabel: string;
  intro: string;
  chapters: GuideChapter[];
  footer: string;
}

const GUIDE: Record<GuideLang, GuideContent> = {
  da: {
    docTitle: 'Brugervejledning',
    docSubtitle: 'Komplet guide til din Skægagame Pleje-app',
    generatedOnLabel: 'Genereret',
    intro:
      'Denne vejledning giver dig et samlet overblik over alle appens funktioner - fra den daglige oversigt til opsætning af opgaver, ugeplaner og administrator-indstillinger. Du kan altid finde en kortere spørgsmål/svar-udgave under Admin → Hjælp & FAQ direkte i appen.',
    footer: 'Skægagame Pleje-app - Brugervejledning',
    chapters: [
      {
        title: '1. Kom godt i gang',
        paragraphs: [
          'Appen er bygget til at gøre den daglige pleje af dine skægagamer så enkel som muligt. Al data gemmes lokalt på din telefon, så appen fungerer fuldt ud uden internetforbindelse.',
          'Første gang du åbner appen, vil du typisk gøre følgende: (1) Tilføj dine agamer under fanen "Agamer", (2) Gennemgå den indbyggede standard-plejeplan under fanen "Opgaver" og "Ugeplaner", og (3) Begynd at bruge "Dagsoversigt" til den daglige registrering.',
          'Appen leveres med en komplet, tosproget standard-plejeplan, som du frit kan tilpasse eller til enhver tid nulstille til fra Admin-siden.',
        ],
      },
      {
        title: '2. Agamer - profiler og vægt',
        paragraphs: [
          'Under fanen "Agamer" opretter, redigerer og sletter du dine agame-profiler. Hver profil indeholder navn, køn og fødselsdato. Alderskategorien (f.eks. baby, juvenil, voksen "12+") beregnes automatisk ud fra fødselsdatoen og bestemmer, hvilke opgaver fra ugeplanen der vises på Dagsoversigten for den pågældende agame.',
          'Vægtregistrering: Tryk på "Vægt"-knappen på en agames kort for at åbne vægtsiden. Her kan du tilføje nye vejninger med dato og valgfri note, se udviklingen visualiseret som en graf over tid, samt redigere eller slette tidligere målinger.',
          'PDF-eksport af vægtdata: På vægtsiden kan du trykke "Eksporter PDF" for at generere en PDF-fil med en fuld tabel over alle vejninger samt vægtgrafen. Filen åbnes i din telefons normale dele-menu, hvor du kan gemme den, printe den eller sende den videre - f.eks. til din dyrlæge.',
          'Bemærk: Sletning af en agame fjerner permanent al tilknyttet data, inklusiv vægthistorik. Dette kan ikke fortrydes.',
        ],
      },
      {
        title: '3. Dagsoversigt',
        paragraphs: [
          'Dagsoversigten er appens hovedskærm og viser en kolonne pr. agame med dagens opgaver, grupperet efter tidspunkt og kategori (Fodring, Pleje, Lys & Varme). Tryk på afkrydsningsfeltet ved en opgave for at markere den som udført.',
          'Kalenderfunktion: Tryk på kalender-ikonet for at navigere til en tidligere dato og se, hvilke opgaver der blev registreret dén dag. I kalenderen er hver dag farvekodet: grøn betyder at alle relevante opgaver blev udført, gul betyder delvist udført, og rød/grå betyder at intet blev registreret. Automatiske Lys & Varme-opgaver (se kapitel 4) indgår ikke i denne beregning.',
          'Aktivitetsstatus (Dvale): Hver agame har en status-knap, hvor du kan skifte mellem "Aktiv" og "Dvale" (brumation). Når en agame sættes i dvale, skjules dens fodringsopgaver automatisk på Dagsoversigten, indtil den igen sættes til "Aktiv".',
          'Vinterperiode-badge: Hvis dags dato falder inden for den vinterperiode, du har defineret under Admin → Sæsonperiode, vises et tydeligt badge på Dagsoversigten, og opgaver med en vintertid vil automatisk bruge deres justerede klokkeslæt (se kapitel 6).',
        ],
      },
      {
        title: '4. Opgaver - Tider, Fodring, Pleje og Lys & Varme',
        paragraphs: [
          'Under fanen "Opgaver" opsætter du selve byggestenene til ugeplanen, opdelt i fire underfaner:',
        ],
        bullets: [
          'Tider: Definerer de klokkeslæt, opgaver kan planlægges på (f.eks. 08:00, 12:00, 20:00). Hvert tidspunkt kan have en valgfri "Vintertid" - se kapitel 6 for detaljer - samt slås til med lokale påmindelser (kræver en udviklings-build, virker ikke i Expo Go).',
          'Fodring: Liste over foder-relaterede opgaver/emner, f.eks. "Insekter" eller "Bladgrønt". Under denne fane finder du også knappen "Se foderforslag" med konkret inspiration til egnede insekter, bladgrønt og grøntsager - samt en forklaring på hvorfor frugt bør undgås helt til skægagamer.',
          'Pleje: Liste over øvrige plejeopgaver, f.eks. "Rens terrarium" eller "Fugtmåling".',
          'Lys & Varme: Liste over lys- og varmerelaterede opgaver, f.eks. "Lys tændt", "Lys slukket" eller "Varmelampe". Emner her markeres ofte som "Automatisk".',
        ],
      },
      {
        title: '5. Automatiske emner',
        paragraphs: [
          'Et emne kan markeres som "Automatisk" - typisk relevant for lys- og varmeudstyr, der styres af et fysisk timer-stik og derfor ikke kræver, at du manuelt tjekker det af hver dag.',
          'Automatiske emner vises stadig på Dagsoversigten som information, men de indgår IKKE i beregningen af, om en dag er "fuldført" i kalender-farvekodningen - da de sker uden manuel indblanding fra dig.',
        ],
      },
      {
        title: '6. Ugeplaner',
        paragraphs: [
          'Under fanen "Ugeplaner" bygger du selve ugeskemaet: for hver alderskategori og ugedag vælger du, hvilke opgaver (fra Tider/Fodring/Pleje/Lys & Varme) der skal udføres, og på hvilket tidspunkt.',
          'Tryk "+" for at tilføje en ny planlagt opgave på en bestemt dag, alderskategori og tidspunkt. Brug funktionen "Kopier til dage & perioder" for hurtigt at gentage den samme opgave på flere ugedage og/eller alderskategorier samtidig, uden at skulle oprette den manuelt hver gang.',
          'Når du sletter en planlagt opgave, spørger appen, om den kun skal fjernes for den valgte dag, eller for alle ugedage, hvor den samme opgave er sat på samme tidspunkt - praktisk hvis en fast rutine skal fjernes helt.',
        ],
      },
      {
        title: '7. Sæsonperiode & Vintertid',
        paragraphs: [
          'Skægagamer i naturen oplever kortere dage om vinteren. For at afspejle dette kan du under Admin → "Sæsonperiode" angive, hvornår sommer- og vinterperioden starter (angivet som dag og måned, gentages automatisk hvert år).',
          'Sådan fungerer logikken konkret, når dags dato falder i vinterperioden:',
        ],
        bullets: [
          'Har et tidspunkt (under Opgaver → Tider) sin egen "Vintertid" sat, bruges denne i stedet for det normale klokkeslæt.',
          'Det tidligste "Lys tændt"-tidspunkt på dagen forbliver uændret, med mindre det selv har fået sat en vintertid.',
          'Alle andre tidspunkter uden egen vintertid rykkes automatisk til 30 minutter efter dette "lys tændt"-tidspunkt.',
          'Dine grundlæggende Tider, Opgaver og Ugeplaner ændres aldrig permanent af denne funktion - justeringen sker kun beregningsmæssigt på Dagsoversigten, når vi reelt er i vinterperioden.',
        ],
      },
      {
        title: '8. Admin - udseende, sprog og enheder',
        paragraphs: [
          'Under Admin kan du tilpasse app-oplevelsen:',
        ],
        bullets: [
          'Banner: Vælg et billede og/eller tekst til det bånd, der vises i toppen af skærmene, samt farven på banneret og teksten.',
          'Udseende: Vælg appens generelle baggrundsfarve og farven på sidernes titler.',
          'Sprog & enheder: Skift mellem dansk og engelsk, gram og oz for vægt, samt 24-timers eller AM/PM tidsformat. Tryk "Gem indstillinger" for at anvende ændringerne.',
        ],
      },
      {
        title: '9. Admin - database (backup, gendan, nulstil)',
        paragraphs: [
          'Under Admin → "Database" kan du:',
        ],
        bullets: [
          'Eksportere data: Opretter en JSON-backup-fil med alle dine agamer, opgaver, ugeplaner og indstillinger, som deles via din telefons normale dele-funktion (gem lokalt, send via mail osv.).',
          'Importere data: Vælg en tidligere eksporteret fil for at gendanne alt indhold. Bemærk at dette overskriver din nuværende data efter bekræftelse.',
        ],
        // Danger zone note
      },
      {
        title: '10. Admin - nulstil & indlæs standard-plejeplan',
        paragraphs: [
          'Hvis du vil starte forfra med opgaver og ugeplaner, kan du under Admin trykke "Nulstil & indlæs plejeplan". Dette sletter alle nuværende Tider, Fodrings-/Pleje-/Lys-emner og Ugeplaner, og indlæser i stedet en komplet, tosproget standardplan.',
          'Dine agamer og deres vægthistorik påvirkes IKKE af denne handling. Da handlingen er permanent og ikke kan fortrydes, skal du skrive et bekræftelsesord for at gennemføre nulstillingen.',
        ],
      },
      {
        title: '11. Hjælp & FAQ',
        paragraphs: [
          'Denne guide findes også i en kortere spørgsmål/svar-udgave direkte i appen under Admin → "Hjælp & FAQ", hvor du hurtigt kan slå specifikke emner op uden at skulle læse hele vejledningen. Du kan altid downloade denne PDF-udgave igen fra samme sted.',
        ],
      },
    ],
  },
  en: {
    docTitle: 'User Guide',
    docSubtitle: 'Complete guide to your Bearded Dragon Care app',
    generatedOnLabel: 'Generated',
    intro:
      'This guide gives you a complete overview of all the app\u2019s features - from the daily overview to setting up tasks, schedules and admin settings. A shorter question/answer version is always available in-app under Admin \u2192 Help & FAQ.',
    footer: 'Bearded Dragon Care App - User Guide',
    chapters: [
      {
        title: '1. Getting Started',
        paragraphs: [
          'The app is built to make the daily care of your bearded dragons as simple as possible. All data is stored locally on your phone, so the app works fully without an internet connection.',
          'The first time you open the app, you will typically: (1) add your dragons under the "Dragons" tab, (2) review the built-in default care plan under the "Tasks" and "Schedules" tabs, and (3) start using the "Daily Overview" for day-to-day logging.',
          'The app ships with a complete, bilingual default care plan that you are free to customize, or reset back to at any time from the Admin screen.',
        ],
      },
      {
        title: '2. Dragons - profiles and weight',
        paragraphs: [
          'Under the "Dragons" tab you create, edit and delete dragon profiles. Each profile has a name, gender and birthday. The age category (e.g. baby, juvenile, adult "12+") is calculated automatically from the birthday and determines which scheduled tasks appear on the Daily Overview for that dragon.',
          'Weight tracking: Tap the "Weight" button on a dragon\u2019s card to open the weight screen. There you can add new weight entries with a date and optional note, view progress visualized as a chart over time, and edit or delete previous entries.',
          'PDF export of weight data: On the weight screen, tap "Export PDF" to generate a PDF file containing a full table of all weigh-ins plus the weight chart. The file opens in your phone\u2019s standard share sheet, where you can save it, print it, or send it on - for example to your vet.',
          'Note: Deleting a dragon permanently removes all associated data, including weight history. This cannot be undone.',
        ],
      },
      {
        title: '3. Daily Overview',
        paragraphs: [
          'The Daily Overview is the app\u2019s main screen and shows one column per dragon with today\u2019s tasks, grouped by time and category (Feeding, Care, Light & Heat). Tap the checkbox next to a task to mark it as completed.',
          'Calendar feature: Tap the calendar icon to jump to a previous date and see which tasks were logged that day. In the calendar, each day is color-coded: green means all relevant tasks were completed, yellow means partially completed, and red/gray means nothing was logged. Automatic Light & Heat tasks (see chapter 4) are excluded from this calculation.',
          'Activity status (Brumation): Each dragon has a status button that lets you switch between "Active" and "Brumation". When a dragon is set to brumation, its feeding tasks are automatically hidden on the Daily Overview until it is switched back to "Active".',
          'Winter period badge: If today\u2019s date falls within the winter period you defined under Admin \u2192 Season period, a clear badge is shown on the Daily Overview, and tasks with a winter time will automatically use their adjusted clock time (see chapter 6).',
        ],
      },
      {
        title: '4. Tasks - Times, Feeding, Care and Light & Heat',
        paragraphs: [
          'Under the "Tasks" tab you set up the building blocks for the weekly schedule, split into four sub-tabs:',
        ],
        bullets: [
          'Times: Defines the clock times tasks can be scheduled at (e.g. 08:00, 12:00, 20:00). Each time can have an optional "Winter time" - see chapter 6 for details - and can have local reminders enabled (requires a development build, does not work in Expo Go).',
          'Feeding: A list of feeding-related tasks/items, e.g. "Insects" or "Leafy greens". This tab also has a "See feeding suggestions" button with concrete inspiration for suitable insects, greens and vegetables - as well as an explanation of why fruit should be avoided entirely for bearded dragons.',
          'Care: A list of other care tasks, e.g. "Clean terrarium" or "Check humidity".',
          'Light & Heat: A list of light- and heat-related tasks, e.g. "Light on", "Light off" or "Heat lamp". Items here are often marked as "Automatic".',
        ],
      },
      {
        title: '5. Automatic items',
        paragraphs: [
          'An item can be marked as "Automatic" - typically relevant for light and heat equipment controlled by a physical timer outlet, which therefore doesn\u2019t require you to manually check it off every day.',
          'Automatic items still appear on the Daily Overview for information, but they are NOT included in the calculation of whether a day is "complete" in the calendar color-coding, since they happen without manual intervention from you.',
        ],
      },
      {
        title: '6. Schedules',
        paragraphs: [
          'Under the "Schedules" tab you build the actual weekly schedule: for each age category and weekday, you choose which tasks (from Times/Feeding/Care/Light & Heat) should be performed, and at what time.',
          'Tap "+" to add a new scheduled task for a specific day, age category and time. Use the "Copy to days & periods" feature to quickly repeat the same task across multiple weekdays and/or age categories at once, without having to create it manually every time.',
          'When you delete a scheduled task, the app asks whether it should only be removed for the selected day, or for all weekdays where the same task is set at the same time - useful when removing a routine entirely.',
        ],
      },
      {
        title: '7. Season Period & Winter Time',
        paragraphs: [
          'In the wild, bearded dragons experience shorter days during winter. To reflect this, under Admin \u2192 "Season period" you can set when the summer and winter periods start (given as day and month, repeating automatically every year).',
          'Here is exactly how the logic works when today\u2019s date falls within the winter period:',
        ],
        bullets: [
          'If a time slot (under Tasks \u2192 Times) has its own "Winter time" set, that is used instead of the normal clock time.',
          'The earliest "Light on" time of the day stays unchanged, unless it itself has a winter time set.',
          'All other time slots without their own winter time automatically shift to 30 minutes after this "light on" time.',
          'Your underlying Times, Tasks and Schedules are never permanently changed by this feature - the adjustment only happens computationally on the Daily Overview whenever we are actually within the winter period.',
        ],
      },
      {
        title: '8. Admin - appearance, language and units',
        paragraphs: [
          'Under Admin you can customize the app experience:',
        ],
        bullets: [
          'Banner: Choose an image and/or text for the band shown at the top of the screens, as well as the banner and text color.',
          'Appearance: Choose the app\u2019s overall background color and the color of the page titles.',
          'Language & units: Switch between Danish and English, grams and oz for weight, and 24-hour or AM/PM time format. Tap "Save settings" to apply the changes.',
        ],
      },
      {
        title: '9. Admin - database (backup, restore, reset)',
        paragraphs: [
          'Under Admin \u2192 "Database" you can:',
        ],
        bullets: [
          'Export data: Creates a JSON backup file with all your dragons, tasks, schedules and settings, shared through your phone\u2019s normal share function (save locally, send via mail, etc.).',
          'Import data: Select a previously exported file to restore all content. Note that this overwrites your current data after confirmation.',
        ],
      },
      {
        title: '10. Admin - reset & load default care plan',
        paragraphs: [
          'If you want to start over with tasks and schedules, you can tap "Reset & load care plan" under Admin. This deletes all current Times, Feeding/Care/Light items and Schedules, and instead loads a complete, bilingual default plan.',
          'Your dragons and their weight history are NOT affected by this action. Since the action is permanent and cannot be undone, you must type a confirmation word to proceed with the reset.',
        ],
      },
      {
        title: '11. Help & FAQ',
        paragraphs: [
          'This guide is also available in a shorter question/answer format directly in the app under Admin \u2192 "Help & FAQ", where you can quickly look up specific topics without reading the entire guide. You can always download this PDF version again from the same place.',
        ],
      },
    ],
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildGuidePdfHtml(language: GuideLang): string {
  const guide = GUIDE[language] || GUIDE.en;
  const generatedOn = formatDateLabel(new Date(), language);

  const chaptersHtml = guide.chapters
    .map((chapter) => {
      const paragraphsHtml = (chapter.paragraphs || [])
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join('');
      const bulletsHtml = chapter.bullets
        ? `<ul>${chapter.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
        : '';
      return `<section>
        <h2>${escapeHtml(chapter.title)}</h2>
        ${paragraphsHtml}
        ${bulletsHtml}
      </section>`;
    })
    .join('');

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #22303C; padding: 32px; }
      .cover { margin-bottom: 30px; border-bottom: 3px solid #3D6B54; padding-bottom: 18px; }
      h1 { font-size: 26px; margin: 0 0 6px; color: #22303C; }
      .subtitle { font-size: 14px; color: #55677A; margin-bottom: 4px; }
      .meta { font-size: 11px; color: #9AA5B1; }
      .intro { font-size: 13px; line-height: 20px; color: #3E4A55; margin-bottom: 24px; }
      section { margin-bottom: 22px; page-break-inside: avoid; }
      h2 { font-size: 15px; color: #3D6B54; margin: 0 0 10px; border-bottom: 2px solid #E3EFE8; padding-bottom: 6px; }
      p { font-size: 12.5px; line-height: 19px; color: #22303C; margin: 0 0 8px; }
      ul { margin: 0 0 8px; padding-left: 18px; }
      li { font-size: 12.5px; line-height: 19px; color: #22303C; margin-bottom: 6px; }
      .footer { margin-top: 24px; font-size: 10px; color: #9AA5B1; text-align: center; border-top: 1px solid #E5E7EB; padding-top: 10px; }
    </style>
  </head>
  <body>
    <div class="cover">
      <h1>${escapeHtml(guide.docTitle)}</h1>
      <div class="subtitle">${escapeHtml(guide.docSubtitle)}</div>
      <div class="meta">${escapeHtml(guide.generatedOnLabel)}: ${escapeHtml(generatedOn)}</div>
    </div>

    <div class="intro">${escapeHtml(guide.intro)}</div>

    ${chaptersHtml}

    <div class="footer">${escapeHtml(guide.footer)}</div>
  </body>
  </html>`;
}
