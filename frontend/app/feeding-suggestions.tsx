import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { useAdminSettings } from '@/context/AdminSettingsContext';

const CONTENT = {
  da: {
    title: 'Foderforslag',
    intro: 'Inspiration til en varieret og sund kost til din skægagame.',
    categories: [
      {
        icon: 'bug-outline',
        title: 'Insekter med ben',
        items: 'Kakerlakker, fårekyllinger, græshopper, bænkebidere.',
      },
      {
        icon: 'nutrition-outline',
        title: 'Insekter uden ben',
        items: 'Zophobasorme, melorme, voksmøllarver, buffalolarver, rosenbillelarver.',
      },
      {
        icon: 'leaf-outline',
        title: 'Bladgrønt',
        items: 'Færdigblandet salat, rucolasalat, feldsalat, grønkål, endivie, julesalat.',
      },
      {
        icon: 'flower-outline',
        title: 'Grønt',
        items:
          'Asparges, basilikum, bønner (kort opkog), peberfrugt, bok choy, selleri, ærteskud, radicchio, brøndkarse, majs, tomat, agurk, ærter, græskar, blomkål, broccoli, butternut squash.',
      },
    ],
    warningTitle: 'Hvorfor frugt frarådes til skægagamer',
    warningIntro:
      'Vi fraråder helt at give frugt til skægagamer. Selvom de ofte vil spise det med glæde, gør frugt langt mere skade end gavn:',
    warningPoints: [
      {
        title: 'Højt sukkerindhold:',
        text: 'Sukkeret ødelægger skægagamens tænder og mundhygiejne og kan hurtigt føre til fedme og fedtlever.',
      },
      {
        title: 'Risiko for MBD (Knogleskørhed):',
        text:
          'Frugt har et skævt forhold mellem calcium og fosfor. Det høje fosforindhold blokerer for optagelsen af livsnødvendig calcium, hvilket øger risikoen for den invaliderende sygdom Metabolic Bone Disease.',
      },
      {
        title: 'Sarte maver:',
        text:
          'Det høje vand- og sukkerindhold i frugt forstyrrer tarmfloraen og giver let tyndskid, hvilket paradoxalt nok kan udtørre dyret.',
      },
    ],
    warningConclusion:
      'Konklusion: Skægagamer har absolut ikke brug for frugt for at trives. Hold kosten udelukkende til sunde foderinsekter, mørkt bladgrønt og egnede grøntsager.',
  },
  en: {
    title: 'Feeding Suggestions',
    intro: 'Inspiration for a varied and healthy diet for your bearded dragon.',
    categories: [
      {
        icon: 'bug-outline',
        title: 'Insects with legs',
        items: 'Cockroaches, crickets, locusts, woodlice.',
      },
      {
        icon: 'nutrition-outline',
        title: 'Legless insects (larvae)',
        items: 'Superworms, mealworms, waxworms, buffalo worms, flower beetle grubs.',
      },
      {
        icon: 'leaf-outline',
        title: 'Leafy greens',
        items: "Pre-mixed salad, arugula / rocket, lamb's lettuce, kale, endive, chicory.",
      },
      {
        icon: 'flower-outline',
        title: 'Vegetables',
        items:
          'Asparagus, basil, beans (blanched), bell pepper, bok choy, celery, pea shoots, radicchio, watercress, corn, tomato, cucumber, peas, pumpkin, cauliflower, broccoli, butternut squash.',
      },
    ],
    warningTitle: 'Why Fruit is Not Recommended for Bearded Dragons',
    warningIntro:
      'We completely advise against feeding fruit to bearded dragons. Although they will often eat it eagerly, fruit does far more harm than good:',
    warningPoints: [
      {
        title: 'High Sugar Content:',
        text:
          "The sugar damages the bearded dragon's teeth and oral hygiene, and can quickly lead to obesity and fatty liver disease.",
      },
      {
        title: 'Risk of MBD (Metabolic Bone Disease):',
        text:
          'Fruit has an imbalanced calcium-to-phosphorus ratio. The high phosphorus content blocks the absorption of essential calcium, increasing the risk of the debilitating condition Metabolic Bone Disease.',
      },
      {
        title: 'Sensitive Digestive Systems:',
        text:
          'The high water and sugar content in fruit disrupts the gut flora and easily causes diarrhea, which paradoxically can lead to dehydration.',
      },
    ],
    warningConclusion:
      'Conclusion: Bearded dragons have absolutely no need for fruit to thrive. Keep their diet strictly to healthy feeder insects, dark leafy greens, and suitable vegetables.',
  },
};

export default function FeedingSuggestionsScreen() {
  const router = useRouter();
  const { language, appBgColor, pageTitleColor } = useAdminSettings();
  const content = CONTENT[language === 'da' ? 'da' : 'en'];

  return (
    <SafeAreaView style={[styles.safeArea, appBgColor ? { backgroundColor: appBgColor } : null]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="feeding-suggestions-close-button" style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={pageTitleColor || COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, pageTitleColor ? { color: pageTitleColor } : null]} numberOfLines={1}>
          {content.title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>{content.intro}</Text>

        {content.categories.map((cat) => (
          <View key={cat.title} style={styles.categoryCard} testID={`feeding-category-${cat.title}`}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIconWrap}>
                <Ionicons name={cat.icon as any} size={18} color={COLORS.categories.fodring.text} />
              </View>
              <Text style={styles.categoryTitle}>{cat.title}</Text>
            </View>
            <Text style={styles.categoryItems}>{cat.items}</Text>
          </View>
        ))}

        <View style={styles.warningCard} testID="feeding-fruit-warning">
          <View style={styles.warningHeader}>
            <Ionicons name="warning-outline" size={20} color={COLORS.danger} />
            <Text style={styles.warningTitle}>{content.warningTitle}</Text>
          </View>
          <Text style={styles.warningText}>{content.warningIntro}</Text>

          {content.warningPoints.map((point) => (
            <View key={point.title} style={styles.warningBulletRow}>
              <Text style={styles.warningBulletDot}>•</Text>
              <Text style={styles.warningText}>
                <Text style={styles.warningBoldText}>{point.title} </Text>
                {point.text}
              </Text>
            </View>
          ))}

          <Text style={[styles.warningText, styles.warningConclusion]}>{content.warningConclusion}</Text>
        </View>
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
  closeBtn: {
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
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.categories.fodring.border,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.categories.fodring.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  categoryItems: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
  },
  warningCard: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.danger,
    padding: 16,
    marginTop: 6,
    gap: 10,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.danger,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textPrimary,
  },
  warningBoldText: {
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  warningBulletRow: {
    flexDirection: 'row',
    gap: 8,
  },
  warningBulletDot: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.danger,
    fontWeight: '900',
  },
  warningConclusion: {
    fontWeight: '700',
    marginTop: 4,
  },
});
