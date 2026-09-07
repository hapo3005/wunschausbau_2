export type Locale = 'de' | 'en';

export const defaultLocale: Locale = 'de';

export const routePairs = [
  ['/', '/en/'],
  ['/leistungen/', '/en/services/'],
  ['/referenzen/', '/en/references/'],
  ['/ueber-uns/', '/en/about/'],
  ['/kontakt/', '/en/contact/'],
  ['/danke/', '/en/thank-you/'],
  ['/leistungen/boeden/', '/en/services/flooring/'],
  ['/leistungen/innentueren/', '/en/services/interior-doors/'],
  ['/leistungen/fenster-aussentueren/', '/en/services/windows-exterior-doors/'],
  ['/leistungen/trockenbau/', '/en/services/drywall/'],
  ['/leistungen/sonnenschutz/', '/en/services/shading/'],
  ['/leistungen/holzterrassen/', '/en/services/timber-decking/'],
  ['/leistungen/komplettrenovierung/', '/en/services/complete-renovation/']
] as const;

const deToEn = new Map<string, string>(routePairs.map(([de, en]) => [de, en]));
const enToDe = new Map<string, string>(routePairs.map(([de, en]) => [en, de]));

export const normalizeRoute = (path: string) => {
  let normalized = path || '/';
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  if (!normalized.endsWith('/') && !normalized.split('/').at(-1)?.includes('.')) normalized += '/';
  return normalized;
};

export const getAlternatePath = (path: string, locale: Locale) => {
  const normalized = normalizeRoute(path);
  const mapped = locale === 'de' ? deToEn.get(normalized) : enToDe.get(normalized);
  if (mapped) return mapped;

  if (locale === 'de') {
    const reference = normalized.match(/^\/referenzen\/([^/]+)\/$/);
    if (reference) return `/en/references/${reference[1]}/`;
  } else {
    const reference = normalized.match(/^\/en\/references\/([^/]+)\/$/);
    if (reference) return `/referenzen/${reference[1]}/`;
  }

  return null;
};

export const getLocalizedPath = (dePath: string, locale: Locale) => {
  const normalized = normalizeRoute(dePath);
  if (locale === 'de') return normalized;
  return deToEn.get(normalized) ?? normalized;
};

export const sharedCopy = {
  de: {
    nav: {
      services: 'Leistungen',
      references: 'Referenzen',
      about: 'Über uns',
      contact: 'Projekt anfragen',
      phoneLabel: 'Jetzt anrufen',
      openMenu: 'Menü öffnen',
      closeMenu: 'Menü schließen'
    },
    footer: {
      contact: 'Kontakt',
      pages: 'Seiten',
      legal: 'Rechtliches',
      services: 'Leistungen',
      references: 'Referenzen',
      about: 'Über uns',
      contactPage: 'Kontakt',
      imprint: 'Impressum',
      privacy: 'Datenschutz'
    },
    mobile: {
      quickContact: 'Schnellkontakt',
      call: 'Anrufen',
      whatsapp: 'WhatsApp-Nachricht schreiben',
      desktopAppointment: 'Termin vereinbaren',
      mobileAppointment: 'Jetzt anrufen',
      secondaryAppointment: 'Termin vereinbaren',
      work: 'Arbeiten ansehen'
    },
    cta: {
      eyebrow: 'Ihr Projekt',
      title: 'Sie möchten etwas umbauen oder renovieren?',
      text: 'Schicken Sie uns kurz, worum es geht. Wir schauen uns Ihre Anfrage persönlich an und besprechen mit Ihnen die nächsten sinnvollen Schritte.',
      action: 'Anfrage senden'
    },
    skip: 'Zum Inhalt springen',
    home: 'Startseite'
  },
  en: {
    nav: {
      services: 'Services',
      references: 'Projects',
      about: 'About us',
      contact: 'Request a project',
      phoneLabel: 'Call now',
      openMenu: 'Open menu',
      closeMenu: 'Close menu'
    },
    footer: {
      contact: 'Contact',
      pages: 'Pages',
      legal: 'Legal',
      services: 'Services',
      references: 'Projects',
      about: 'About us',
      contactPage: 'Contact',
      imprint: 'Imprint (German)',
      privacy: 'Privacy (German)'
    },
    mobile: {
      quickContact: 'Quick contact',
      call: 'Call',
      whatsapp: 'Send a WhatsApp message',
      desktopAppointment: 'Book an appointment',
      mobileAppointment: 'Call now',
      secondaryAppointment: 'Book an appointment',
      work: 'View our work'
    },
    cta: {
      eyebrow: 'Your project',
      title: 'Planning an interior fit-out or renovation?',
      text: 'Tell us briefly what you have in mind. We will review your enquiry personally and discuss the next sensible steps with you.',
      action: 'Send enquiry'
    },
    skip: 'Skip to content',
    home: 'Home'
  }
} as const;
