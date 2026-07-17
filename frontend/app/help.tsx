import React, { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS } from '@/constants/colors';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import { useToast } from '@/context/OverlayContext';
import { buildGuidePdfHtml } from '@/utils/guidePdf';

interface FaqItem {
  id: string;
  q: string;
  a: string;
}

interface FaqCategory {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  items: FaqItem[];
}

const CONTENT: Record<'da' | 'en', { headerTitle: string; intro: string; pdfButton: string; pdfError: string; pdfWebUnsupported: string; categories: FaqCategory[] }> = {
  da: {
    headerTitle: 'Hjælp & FAQ',
    intro:
      'Find svar på de mest almindelige spørgsmål om appen herunder. Du kan også downloade en komplet PDF-vejledning med alle detaljer via knappen øverst til højre eller under Admin.',
    pdfButton: 'Download PDF vejledning',
    pdfError: 'Kunne ikke oprette PDF-vejledning',
    pdfWebUnsupported: 'PDF-deling er ikke tilgængelig i webvisning - brug appen på din telefon',
    categories: [
      {
        id: 'start',
        icon: 'rocket-outline',
        title: 'Kom godt i gang',
        items: [
          {
            id: 'start-1',
            q: 'Hvad kan appen hjælpe mig med?',
            a: 'Appen hjælper dig med at holde styr på dine skægagamers daglige pleje: fodring, pleje-opgaver, lys/varme, vægt-udvikling og ugentlige planer - alt sammen skræddersyet til hver agames alder og aktivitetsstatus.',
          },
          {
            id: 'start-2',
            q: 'Hvordan tilføjer jeg min første agame?',
            a: 'Gå til fanen "Agamer" og tryk på "+" eller "Tilføj agame". Udfyld navn, køn og fødselsdato - alderskategorien (baby, juvenil, voksen osv.) beregnes automatisk og bruges til at vise de rette opgaver på Dagsoversigten.',
          },
          {
            id: 'start-3',
            q: 'Skal jeg oprette opgaver, før jeg kan bruge appen?',
            a: 'Nej. Appen leveres med en færdig standard-plejeplan (Tider, Fodring, Pleje, Lys & Varme samt Ugeplaner), som du frit kan redigere. Du kan altid nulstille til denne standardplan under Admin, hvis du vil starte forfra.',
          },
          {
            id: 'start-4',
            q: 'Virker appen uden internetforbindelse?',
            a: 'Ja. Al data gemmes lokalt, så du altid kan se og registrere opgaver, selv uden forbindelse.',
          },
        ],
      },
      {
        id: 'overview',
        icon: 'checkbox-outline',
        title: 'Dagsoversigt',
        items: [
          {
            id: 'overview-1',
            q: 'Hvordan markerer jeg en opgave som udført?',
            a: 'Tryk på afkrydsningsfeltet ved siden af opgaven i den kolonne, der hører til din agame. Opgaven markeres som udført for den valgte dag.',
          },
          {
            id: 'overview-2',
            q: 'Hvad betyder kalender-ikonet, og hvad betyder farverne?',
            a: 'Kalender-ikonet lader dig se og navigere til tidligere datoer. I kalenderen er dage farvet grøn (alt udført), gul (delvist udført) eller rød/grå (intet registreret). Automatiske Lys & Varme-opgaver tæller ikke med i denne beregning, da de ikke kræver manuel afkrydsning.',
          },
          {
            id: 'overview-3',
            q: 'Hvorfor kan jeg ikke se fodringsopgaver for en agame?',
            a: 'Hvis agamen er sat til "Dvale" (brumation), skjules fodringsopgaverne automatisk, da dyret normalt ikke skal fodres i denne periode. Skift status tilbage til "Aktiv" på agamens kort for at se fodring igen.',
          },
          {
            id: 'overview-4',
            q: 'Hvad er det blå/mørke "Vinterperiode"-badge, jeg ser?',
            a: 'Det vises automatisk, når dags dato falder inden for den vinterperiode, du har angivet under Admin → Sæsonperiode. I denne periode bruger opgaver med en indstillet vintertid deres alternative, vinter-justerede klokkeslæt.',
          },
        ],
      },
      {
        id: 'dragons',
        icon: 'paw-outline',
        title: 'Agamer & Vægt',
        items: [
          {
            id: 'dragons-1',
            q: 'Hvordan registrerer jeg min agames vægt?',
            a: 'Tryk på "Vægt"-knappen på agamens kort under fanen "Agamer". Der kan du tilføje en ny vægtmåling med dato og valgfri note, se udviklingen som en graf, og redigere eller slette tidligere målinger.',
          },
          {
            id: 'dragons-2',
            q: 'Kan jeg få vægthistorikken som en fil, jeg kan printe eller sende til dyrlægen?',
            a: 'Ja. På Vægt-siden kan du trykke "Eksporter PDF", som opretter en PDF med vægttabel og graf, og åbner din telefons normale dele-menu, så du kan gemme, printe eller sende filen.',
          },
          {
            id: 'dragons-3',
            q: 'Hvad sker der, hvis jeg sletter en agame?',
            a: 'Al data for den pågældende agame, inklusiv vægthistorik, fjernes permanent. Dette kan ikke fortrydes, så appen ber dig bekræfte, før agamen slettes.',
          },
          {
            id: 'dragons-4',
            q: 'Hvordan skifter jeg en agames aktivitetsstatus (Aktiv/Dvale)?',
            a: 'Statusknappen findes direkte på agamens kort på Dagsoversigten eller Agamer-siden. Når du slår Dvale til, skjules fodringsopgaver for agamen, indtil du slår den tilbage til Aktiv.',
          },
        ],
      },
      {
        id: 'tasks',
        icon: 'time-outline',
        title: 'Opgaver & Tider',
        items: [
          {
            id: 'tasks-1',
            q: 'Hvad er forskellen på fanerne Tider, Fodring, Pleje og Lys & Varme?',
            a: '"Tider" definerer klokkeslæt, som opgaver kan knyttes til. "Fodring", "Pleje" og "Lys & Varme" er lister over de konkrete opgaver/emner (f.eks. "Insekter", "Rens terrarium", "Lys tændt"), som senere tildeles til ugeplanen.',
          },
          {
            id: 'tasks-2',
            q: 'Hvad betyder "Automatisk" på et emne?',
            a: 'Emner markeret som automatiske (typisk lys/varme-udstyr på timer) kræver ikke manuel afkrydsning og indgår ikke i beregningen af, om dagen er "fuldført" på kalenderen - de sker jo automatisk uden din indblanding.',
          },
          {
            id: 'tasks-3',
            q: 'Hvad er "Vintertid" på et tidspunkt?',
            a: 'Under fanen Tider kan hvert klokkeslæt have en valgfri Vintertid - et alternativt tidspunkt, der automatisk bruges i stedet for det normale klokkeslæt, når dags dato falder i vinterperioden (angivet under Admin → Sæsonperiode). Er der ikke sat en vintertid på et tidspunkt, rykkes opgaven automatisk 30 minutter efter dagens "lys tændt"-tidspunkt, når vi er i vinterperioden.',
          },
          {
            id: 'tasks-4',
            q: 'Kan jeg få en påmindelse om et tidspunkt?',
            a: 'Ja, du kan slå lokale notifikationer til for et tidspunkt under Tider-fanen. Bemærk at notifikationer kræver en udviklings-build af appen og ikke virker i Expo Go.',
          },
          {
            id: 'tasks-5',
            q: 'Hvor finder jeg inspiration til foder?',
            a: 'Under fanen Opgaver → Fodring finder du knappen "Se foderforslag", som viser en oversigt over egnede insekter og grøntsager - samt en forklaring på, hvorfor frugt bør undgås.',
          },
        ],
      },
      {
        id: 'schedules',
        icon: 'calendar-outline',
        title: 'Ugeplaner',
        items: [
          {
            id: 'sched-1',
            q: 'Hvordan opsætter jeg en ugeplan?',
            a: 'Gå til fanen "Ugeplaner", vælg alderskategori og ugedag, og tryk "+" for at tilføje en opgave på et bestemt tidspunkt. Opgaven vil derefter automatisk vises på Dagsoversigten for agamer i den alderskategori på den valgte ugedag.',
          },
          {
            id: 'sched-2',
            q: 'Kan jeg tilføje den samme opgave på flere dage/aldre samtidig?',
            a: 'Ja, brug funktionen "Kopier til dage & perioder" i opgaveformularen. Der kan du markere alle de ugedage og alderskategorier, opgaven også skal gælde for.',
          },
          {
            id: 'sched-3',
            q: 'Hvad sker der, når jeg sletter en planlagt opgave?',
            a: 'Du bliver spurgt, om opgaven kun skal slettes for den valgte dag, eller for alle ugedage, hvor den samme opgave er oprettet på samme tidspunkt.',
          },
        ],
      },
      {
        id: 'season',
        icon: 'snow-outline',
        title: 'Sæson & Vintertid (Admin)',
        items: [
          {
            id: 'season-1',
            q: 'Hvor sætter jeg start på sommer- og vinterperioden?',
            a: 'Under Admin → "Sæsonperiode" (øverst på siden) kan du vælge en dato (dag og måned) for, hvornår sommeren og vinteren starter. Datoerne gentages automatisk hvert år.',
          },
          {
            id: 'season-2',
            q: 'Hvordan bruges disse datoer helt konkret?',
            a: 'I vinterperioden bruger et tidspunkt sin egen Vintertid, hvis en sådan er sat under Opgaver → Tider. Tidspunktet for den tidligste "Lys tændt"-opgave forbliver uændret (med mindre det selv har en vintertid). Alle andre tidspunkter uden egen vintertid rykkes automatisk til 30 minutter efter dette "lys tændt"-tidspunkt.',
          },
          {
            id: 'season-3',
            q: 'Påvirker sæsonindstillingen mine Tider, Opgaver eller Ugeplaner permanent?',
            a: 'Nej. Dine grundopsætninger ændres aldrig - vinterjusteringen sker kun visuelt/beregningsmæssigt på Dagsoversigten, når dags dato falder i vinterperioden.',
          },
        ],
      },
      {
        id: 'database',
        icon: 'server-outline',
        title: 'Database (backup, gendan, nulstil)',
        items: [
          {
            id: 'db-1',
            q: 'Hvordan tager jeg backup af mine data?',
            a: 'Under Admin → "Database" tryk på "Eksporter data". Det opretter en JSON-fil med alle dine agamer, opgaver, ugeplaner og indstillinger, som du kan gemme eller sende til dig selv via telefonens delefunktion.',
          },
          {
            id: 'db-2',
            q: 'Hvordan gendanner jeg en backup?',
            a: 'Tryk "Importer data" under Admin → "Database", vælg din tidligere eksporterede fil, og bekræft. Bemærk at dette overskriver din nuværende data med indholdet af filen.',
          },
          {
            id: 'db-3',
            q: 'Hvad gør "Nulstil & indlæs plejeplan"?',
            a: 'Denne funktion nulstiller alle Tider, Fodrings-/Pleje-/Lys-emner og Ugeplaner til en komplet standard-plejeplan. Dine agamer og deres vægthistorik påvirkes IKKE. Handlingen kan ikke fortrydes, og du skal skrive et bekræftelsesord for at gennemføre den.',
          },
        ],
      },
      {
        id: 'appearance',
        icon: 'color-palette-outline',
        title: 'Udseende, Sprog & Enheder',
        items: [
          {
            id: 'app-1',
            q: 'Kan jeg tilpasse appens udseende?',
            a: 'Ja. Under Admin kan du tilpasse et banner-billede/tekst i toppen af appen, samt appens baggrundsfarve og titel-farve.',
          },
          {
            id: 'app-2',
            q: 'Hvordan skifter jeg sprog, vægt-enhed eller tidsformat?',
            a: 'Under Admin → "Sprog & enheder" kan du vælge mellem dansk/engelsk, gram/oz og 24-timers/AM-PM tidsformat. Tryk "Gem indstillinger" for at anvende ændringerne.',
          },
        ],
      },
    ],
  },
  en: {
    headerTitle: 'Help & FAQ',
    intro:
      'Find answers to the most common questions about the app below. You can also download a complete PDF guide with all details using the button in the top right or from the Admin screen.',
    pdfButton: 'Download PDF guide',
    pdfError: 'Could not generate PDF guide',
    pdfWebUnsupported: 'PDF sharing is not available in web preview - use the app on your phone',
    categories: [
      {
        id: 'start',
        icon: 'rocket-outline',
        title: 'Getting Started',
        items: [
          {
            id: 'start-1',
            q: 'What can this app help me with?',
            a: 'The app helps you keep track of your bearded dragons\u2019 daily care: feeding, care tasks, light/heat, weight development and weekly schedules - all tailored to each dragon\u2019s age and activity status.',
          },
          {
            id: 'start-2',
            q: 'How do I add my first dragon?',
            a: 'Go to the "Dragons" tab and tap "+" or "Add dragon". Fill in name, gender and birthday - the age category (baby, juvenile, adult, etc.) is calculated automatically and used to show the right tasks on the Daily Overview.',
          },
          {
            id: 'start-3',
            q: 'Do I need to set up tasks before I can use the app?',
            a: 'No. The app ships with a complete default care plan (Times, Feeding, Care, Light & Heat, and Schedules) that you are free to edit. You can always reset back to this default plan under Admin if you want to start over.',
          },
          {
            id: 'start-4',
            q: 'Does the app work without an internet connection?',
            a: 'Yes. All data is stored locally, so you can always view and log tasks even without a connection.',
          },
        ],
      },
      {
        id: 'overview',
        icon: 'checkbox-outline',
        title: 'Daily Overview',
        items: [
          {
            id: 'overview-1',
            q: 'How do I mark a task as done?',
            a: 'Tap the checkbox next to the task in the column belonging to your dragon. The task is then marked as completed for the selected date.',
          },
          {
            id: 'overview-2',
            q: 'What does the calendar icon do, and what do the colors mean?',
            a: 'The calendar icon lets you view and jump to previous dates. In the calendar, days are colored green (everything done), yellow (partially done) or red/gray (nothing logged). Automatic Light & Heat tasks are excluded from this calculation since they don\u2019t require manual checking.',
          },
          {
            id: 'overview-3',
            q: 'Why can\u2019t I see feeding tasks for a dragon?',
            a: 'If the dragon is set to "Brumation", feeding tasks are automatically hidden since the animal normally shouldn\u2019t be fed during this period. Switch the status back to "Active" on the dragon\u2019s card to see feeding tasks again.',
          },
          {
            id: 'overview-4',
            q: 'What is the dark "Winter period" badge I sometimes see?',
            a: 'It appears automatically when today\u2019s date falls within the winter period you configured under Admin \u2192 Season period. During this period, tasks with a configured winter time use their alternative, winter-adjusted time.',
          },
        ],
      },
      {
        id: 'dragons',
        icon: 'paw-outline',
        title: 'Dragons & Weight',
        items: [
          {
            id: 'dragons-1',
            q: 'How do I log my dragon\u2019s weight?',
            a: 'Tap the "Weight" button on the dragon\u2019s card under the "Dragons" tab. There you can add a new weight entry with a date and optional note, view progress as a chart, and edit or delete previous entries.',
          },
          {
            id: 'dragons-2',
            q: 'Can I get the weight history as a file to print or send to the vet?',
            a: 'Yes. On the Weight screen, tap "Export PDF" to generate a PDF with a weight table and chart, and open your phone\u2019s standard share sheet so you can save, print or send the file.',
          },
          {
            id: 'dragons-3',
            q: 'What happens if I delete a dragon?',
            a: 'All data for that dragon, including weight history, is permanently removed. This cannot be undone, so the app asks you to confirm before deleting.',
          },
          {
            id: 'dragons-4',
            q: 'How do I change a dragon\u2019s activity status (Active/Brumation)?',
            a: 'The status button is available directly on the dragon\u2019s card on the Daily Overview or the Dragons screen. When you switch to Brumation, feeding tasks are hidden until you switch back to Active.',
          },
        ],
      },
      {
        id: 'tasks',
        icon: 'time-outline',
        title: 'Tasks & Times',
        items: [
          {
            id: 'tasks-1',
            q: 'What is the difference between the Times, Feeding, Care and Light & Heat tabs?',
            a: '"Times" defines the clock times tasks can be linked to. "Feeding", "Care" and "Light & Heat" are lists of the actual tasks/items (e.g. "Insects", "Clean terrarium", "Light on"), which are later assigned to the weekly schedule.',
          },
          {
            id: 'tasks-2',
            q: 'What does "Automatic" mean on an item?',
            a: 'Items marked as automatic (typically light/heat equipment on a timer) don\u2019t require manual checking and are excluded from the calculation of whether a day is "complete" on the calendar - since they happen automatically without your input.',
          },
          {
            id: 'tasks-3',
            q: 'What is "Winter time" on a time slot?',
            a: 'Under the Times tab, each clock time can have an optional Winter time - an alternative time that is automatically used instead of the normal time whenever today\u2019s date falls within the winter period (set under Admin \u2192 Season period). If no winter time is set for a time slot, the task automatically shifts to 30 minutes after the day\u2019s "light on" time whenever we are in the winter period.',
          },
          {
            id: 'tasks-4',
            q: 'Can I get a reminder for a time slot?',
            a: 'Yes, you can enable local notifications for a time slot under the Times tab. Note that notifications require a development build of the app and do not work in Expo Go.',
          },
          {
            id: 'tasks-5',
            q: 'Where can I find feeding inspiration?',
            a: 'Under Tasks \u2192 Feeding you\u2019ll find a "See feeding suggestions" button showing suitable insects and vegetables - as well as an explanation of why fruit should be avoided.',
          },
        ],
      },
      {
        id: 'schedules',
        icon: 'calendar-outline',
        title: 'Schedules',
        items: [
          {
            id: 'sched-1',
            q: 'How do I set up a weekly schedule?',
            a: 'Go to the "Schedules" tab, select an age category and weekday, then tap "+" to add a task at a specific time. The task will then automatically appear on the Daily Overview for dragons in that age category on the selected weekday.',
          },
          {
            id: 'sched-2',
            q: 'Can I add the same task to multiple days/ages at once?',
            a: 'Yes, use the "Copy to days & periods" feature in the task form. There you can select all the weekdays and age categories the task should also apply to.',
          },
          {
            id: 'sched-3',
            q: 'What happens when I delete a scheduled task?',
            a: 'You are asked whether the task should only be deleted for the selected day, or for all weekdays where the same task is scheduled at the same time.',
          },
        ],
      },
      {
        id: 'season',
        icon: 'snow-outline',
        title: 'Season & Winter Time (Admin)',
        items: [
          {
            id: 'season-1',
            q: 'Where do I set the start of the summer and winter periods?',
            a: 'Under Admin \u2192 "Season period" (at the top of the page) you can pick a date (day and month) for when summer and winter start. The dates repeat automatically every year.',
          },
          {
            id: 'season-2',
            q: 'How exactly are these dates used?',
            a: 'During the winter period, a time slot uses its own Winter time if one is set under Tasks \u2192 Times. The time of the earliest "Light on" task stays unchanged (unless it has its own winter time). All other time slots without their own winter time automatically shift to 30 minutes after this "light on" time.',
          },
          {
            id: 'season-3',
            q: 'Does the season setting permanently change my Times, Tasks or Schedules?',
            a: 'No. Your base setup is never modified - the winter adjustment only happens visually/computationally on the Daily Overview whenever today\u2019s date falls within the winter period.',
          },
        ],
      },
      {
        id: 'database',
        icon: 'server-outline',
        title: 'Database (backup, restore, reset)',
        items: [
          {
            id: 'db-1',
            q: 'How do I back up my data?',
            a: 'Under Admin \u2192 "Database" tap "Export data". This creates a JSON file with all your dragons, tasks, schedules and settings, which you can save or send to yourself using your phone\u2019s share feature.',
          },
          {
            id: 'db-2',
            q: 'How do I restore a backup?',
            a: 'Tap "Import data" under Admin \u2192 "Database", select your previously exported file, and confirm. Note that this overwrites your current data with the contents of the file.',
          },
          {
            id: 'db-3',
            q: 'What does "Reset & load care plan" do?',
            a: 'This resets all Times, Feeding/Care/Light items and Schedules to a complete default care plan. Your dragons and their weight history are NOT affected. This action cannot be undone and requires typing a confirmation word to proceed.',
          },
        ],
      },
      {
        id: 'appearance',
        icon: 'color-palette-outline',
        title: 'Appearance, Language & Units',
        items: [
          {
            id: 'app-1',
            q: 'Can I customize the app\u2019s appearance?',
            a: 'Yes. Under Admin you can customize a banner image/text at the top of the app, as well as the app\u2019s background color and title color.',
          },
          {
            id: 'app-2',
            q: 'How do I change language, weight unit or time format?',
            a: 'Under Admin \u2192 "Language & units" you can choose between Danish/English, grams/oz and 24-hour/AM-PM time format. Tap "Save settings" to apply the changes.',
          },
        ],
      },
    ],
  },
};

export default function HelpScreen() {
  const router = useRouter();
  const { language, appBgColor, pageTitleColor } = useAdminSettings();
  const showToast = useToast();
  const lang = language === 'da' ? 'da' : 'en';
  const content = CONTENT[lang];
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const toggleItem = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDownloadPdf = async () => {
    if (Platform.OS === 'web') {
      showToast(content.pdfWebUnsupported, 'error');
      return;
    }
    setGeneratingPdf(true);
    try {
      const html = buildGuidePdfHtml(lang);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: content.pdfButton,
        });
      }
    } catch (e: any) {
      showToast(e.message || content.pdfError, 'error');
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, appBgColor ? { backgroundColor: appBgColor } : null]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="help-close-button" style={styles.headerBtn}>
          <Ionicons name="close" size={24} color={pageTitleColor || COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, pageTitleColor ? { color: pageTitleColor } : null]} numberOfLines={1}>
          {content.headerTitle}
        </Text>
        <TouchableOpacity
          onPress={handleDownloadPdf}
          disabled={generatingPdf}
          testID="help-download-pdf-button"
          style={styles.headerBtn}
        >
          {generatingPdf ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <Ionicons name="download-outline" size={22} color={pageTitleColor || COLORS.textPrimary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>{content.intro}</Text>

        {content.categories.map((cat) => (
          <View key={cat.id} style={styles.categoryCard} testID={`help-category-${cat.id}`}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIconWrap}>
                <Ionicons name={cat.icon} size={18} color={COLORS.primaryDark} />
              </View>
              <Text style={styles.categoryTitle}>{cat.title}</Text>
            </View>

            {cat.items.map((item) => {
              const isOpen = expanded.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.faqRow}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.7}
                  testID={`help-faq-${item.id}`}
                >
                  <View style={styles.faqQuestionRow}>
                    <Text style={styles.faqQuestion}>{item.q}</Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={COLORS.textMuted}
                    />
                  </View>
                  {isOpen && <Text style={styles.faqAnswer}>{item.a}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.pdfBtn, generatingPdf && styles.pdfBtnDisabled]}
          onPress={handleDownloadPdf}
          disabled={generatingPdf}
          testID="help-bottom-pdf-button"
        >
          {generatingPdf ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={18} color={COLORS.white} />
              <Text style={styles.pdfBtnText}>{content.pdfButton}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  faqRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingVertical: 12,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  faqAnswer: {
    marginTop: 8,
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  pdfBtnDisabled: {
    opacity: 0.7,
  },
  pdfBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
  },
});
