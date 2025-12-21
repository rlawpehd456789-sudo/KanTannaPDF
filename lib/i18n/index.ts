import ko from './translations/ko.json';
import en from './translations/en.json';
import ja from './translations/ja.json';

export type Language = 'ko' | 'en' | 'ja';

export const translations = {
  ko,
  en,
  ja,
} as const;

export type TranslationKey = keyof typeof ko;

/**
 * 번역 텍스트를 가져오는 함수
 * 중첩된 키는 점(.)으로 구분됩니다 (예: "common.download")
 */
export function getTranslation(
  lang: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k as keyof typeof value];
    } else {
      // 키가 없는 경우 한국어로 폴백
      value = translations.ko;
      for (const fallbackK of keys) {
        if (value && typeof value === 'object' && fallbackK in value) {
          value = value[fallbackK as keyof typeof value];
        } else {
          return key; // 최종 폴백: 키 자체를 반환
        }
      }
      break;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // 파라미터 치환
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }

  return value;
}

