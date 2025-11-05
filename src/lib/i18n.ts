export const languages = {
  'pt-BR': 'Português (Brasil)',
  'en-US': 'English (US)',
  'es-ES': 'Español',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
  'it-IT': 'Italiano',
  'ja-JP': '日本語',
  'zh-CN': '中文 (简体)',
  'ko-KR': '한국어',
  'ru-RU': 'Русский',
};

export type Language = keyof typeof languages;

// This is a simple i18n system. In a production app, you'd use a library like i18next
export const translations: Record<Language, Record<string, string>> = {
  'pt-BR': {
    // Already in Portuguese, so keys and values are the same
    'feed': 'Feed',
    'explore': 'Explorar',
    'new_post': 'Nova',
    'messages': 'Chat',
    'goals': 'Metas',
    'profile': 'Perfil',
    // Add more translations as needed
  },
  'en-US': {
    'feed': 'Feed',
    'explore': 'Explore',
    'new_post': 'New',
    'messages': 'Messages',
    'goals': 'Goals',
    'profile': 'Profile',
  },
  'es-ES': {
    'feed': 'Inicio',
    'explore': 'Explorar',
    'new_post': 'Nueva',
    'messages': 'Mensajes',
    'goals': 'Objetivos',
    'profile': 'Perfil',
  },
  'fr-FR': {
    'feed': 'Fil',
    'explore': 'Explorer',
    'new_post': 'Nouveau',
    'messages': 'Messages',
    'goals': 'Objectifs',
    'profile': 'Profil',
  },
  'de-DE': {
    'feed': 'Feed',
    'explore': 'Erkunden',
    'new_post': 'Neu',
    'messages': 'Nachrichten',
    'goals': 'Ziele',
    'profile': 'Profil',
  },
  'it-IT': {
    'feed': 'Feed',
    'explore': 'Esplora',
    'new_post': 'Nuovo',
    'messages': 'Messaggi',
    'goals': 'Obiettivi',
    'profile': 'Profilo',
  },
  'ja-JP': {
    'feed': 'フィード',
    'explore': '探索',
    'new_post': '新規',
    'messages': 'メッセージ',
    'goals': '目標',
    'profile': 'プロフィール',
  },
  'zh-CN': {
    'feed': '动态',
    'explore': '探索',
    'new_post': '新建',
    'messages': '消息',
    'goals': '目标',
    'profile': '个人',
  },
  'ko-KR': {
    'feed': '피드',
    'explore': '탐색',
    'new_post': '새 글',
    'messages': '메시지',
    'goals': '목표',
    'profile': '프로필',
  },
  'ru-RU': {
    'feed': 'Лента',
    'explore': 'Обзор',
    'new_post': 'Новое',
    'messages': 'Сообщения',
    'goals': 'Цели',
    'profile': 'Профиль',
  },
};

export function translate(key: string, language: Language = 'pt-BR'): string {
  return translations[language]?.[key] || translations['pt-BR'][key] || key;
}