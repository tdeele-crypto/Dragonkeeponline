export const COLORS = {
  background: '#FAF9F6',
  surface: '#FFFFFF',
  textPrimary: '#1C1917',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',
  primary: '#E07A5F',
  primaryDark: '#C96B52',
  primaryLight: '#FBE6DE',
  border: '#E7E5E4',
  borderLight: '#F1F0EE',
  success: '#81B29A',
  danger: '#D64545',
  dangerLight: '#FBE4E4',
  white: '#FFFFFF',
  overlay: 'rgba(28, 25, 23, 0.5)',
  categories: {
    fodring: { bg: '#81B29A', light: '#E9F1EC', border: '#C3DBD0', text: '#2C4C3B' },
    pleje: { bg: '#F2CC8F', light: '#FBF2E1', border: '#F0DEB0', text: '#7A5B22' },
    lys: { bg: '#3D405B', light: '#E7E7EE', border: '#C7C7D3', text: '#3D405B' },
  } as const,
};

export type CategoryKey = keyof typeof COLORS.categories;
