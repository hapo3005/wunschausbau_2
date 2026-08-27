/**
 * Formular-Endpoint /api/anfrage (Netlify Function).
 *
 * Sicherheitsprinzipien:
 * - nur POST / Same-Origin
 * - kleine Request-Groesse und feste Feldlimits
 * - Honeypot + Mindest-/Maximaldauer
 * - serverseitige Validierung
 * - Rate-Limit auf Netlify-Ebene
 * - keine Formulardaten in Logs
 * - SMTP-Zugangsdaten ausschliesslich aus Environment-Variablen
 */
import nodemailer from 'nodemailer';

const PFLICHT = ['leistung', 'name', 'telefon', 'ort', 'beschreibung', 'kontaktweg'];
const MAX = {
  leistung: 120,
  name: 120,
  telefon: 40,
  email: 160,
  ort: 120,
  objektart: 80,
  zeitraum: 100,
  budget: 80,
  kontaktweg: 40,
  beschreibung: 4000,
  firma: 200,
  ts: 32
};
const KONTAKTWEGE = new Set(['Telefon', 'E-Mail', 'WhatsApp']);
const OBJEKTARTEN = new Set(['', 'Wohnung', 'Haus', 'Gewerbeobjekt', 'Außenbereich']);
const ZEITRAEUME = new Set(['', 'So bald wie möglich', 'In den nächsten 3 Monaten', 'In den nächsten 6 Monaten', 'Noch offen']);
const BUDGETS = new Set(['', 'Bis 5.000 €', '5.000 – 15.000 €', '15.000 – 30.000 €', 'Über 30.000 €']);
const MAX_REQUEST_BYTES = 32 * 1024;
const MIN_FORM_AGE = 3000;
const MAX_FORM_AGE = 2 * 60 * 60 * 1000;

const textResponse = (body, status) => new Response(body, {
  status,
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }
});

const redirectTo = (request, path) => new Response(null, {
  status: 303,
  headers: {
    Location: new URL(path, request.url).toString(),
    'Cache-Control': 'no-store'
  }
});

const clean = (value) => String(value ?? '').replace(/\0/g, '').trim();
const safeHeader = (value) => clean(value).replace(/[\r\n]+/g, ' ').slice(0, 120);

function sameOrigin(request) {
  const requestUrl = new URL(request.url);
  const expected = `${requestUrl.protocol}//${requestUrl.host}`;
  const allowed = new Set([expected, 'https://wunschausbau.de', 'https://www.wunschausbau.de']);
  const origin = request.headers.get('origin');
  if (origin) return allowed.has(origin);
  const referer = request.headers.get('referer');
  if (!referer) return false;
  try {
    return allowed.has(new URL(referer).origin);
  } catch {
    return false;
  }
}

export default async (request) => {
  if (request.method !== 'POST') {
    return textResponse('Method Not Allowed', 405);
  }

  if (!sameOrigin(request)) {
    return textResponse('Forbidden', 403);
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.startsWith('application/x-www-form-urlencoded') && !contentType.startsWith('multipart/form-data')) {
    return textResponse('Unsupported Media Type', 415);
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return textResponse('Request Too Large', 413);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return textResponse('Ungültige Formulardaten.', 400);
  }

  const daten = {};
  for (const [key, value] of formData.entries()) {
    if (!(key in MAX)) continue;
    if (typeof value !== 'string') return textResponse('Dateiuploads sind nicht vorgesehen.', 400);
    daten[key] = clean(value);
  }

  for (const [feld, max] of Object.entries(MAX)) {
    if (clean(daten[feld]).length > max) return textResponse('Eine Eingabe überschreitet die zulässige Länge.', 400);
  }

  const alter = Date.now() - Number(daten.ts || 0);
  if (daten.firma || !Number.isFinite(alter) || alter < MIN_FORM_AGE) {
    return redirectTo(request, '/danke/');
  }
  if (alter > MAX_FORM_AGE) {
    return textResponse('Das Formular war zu lange geöffnet. Bitte laden Sie die Seite neu und versuchen Sie es erneut.', 400);
  }

  const fehler = [];
  for (const feld of PFLICHT) if (!clean(daten[feld])) fehler.push(feld);
  if (daten.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(daten.email)) fehler.push('email');
  if (!KONTAKTWEGE.has(daten.kontaktweg)) fehler.push('kontaktweg');
  if (!OBJEKTARTEN.has(daten.objektart || '')) fehler.push('objektart');
  if (!ZEITRAEUME.has(daten.zeitraum || '')) fehler.push('zeitraum');
  if (!BUDGETS.has(daten.budget || '')) fehler.push('budget');

  if (fehler.length) {
    return textResponse('Bitte prüfen Sie Ihre Angaben und versuchen Sie es erneut.', 400);
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO, MAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_TO || !MAIL_FROM) {
    console.error('anfrage: SMTP-Konfiguration unvollständig');
    return textResponse('Der Versand ist derzeit nicht verfügbar. Bitte rufen Sie uns an: 0151 53264522.', 503);
  }

  const zeilen = [
    ['Leistung', daten.leistung],
    ['Name', daten.name],
    ['Telefon', daten.telefon],
    ['E-Mail', daten.email || '–'],
    ['Ort/PLZ', daten.ort],
    ['Objektart', daten.objektart || '–'],
    ['Zeitraum', daten.zeitraum || '–'],
    ['Budget', daten.budget || '–'],
    ['Bevorzugter Kontaktweg', daten.kontaktweg],
    ['Beschreibung', daten.beschreibung]
  ];

  const port = Number(SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { minVersion: 'TLSv1.2' }
  });

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      replyTo: daten.email || undefined,
      subject: `Neue Projektanfrage: ${safeHeader(daten.leistung)} – ${safeHeader(daten.name)}`,
      text: zeilen.map(([k, v]) => `${k}: ${clean(v)}`).join('\n'),
      disableFileAccess: true,
      disableUrlAccess: true
    });
  } catch (err) {
    console.error('anfrage: Mailversand fehlgeschlagen', err instanceof Error ? err.message : 'unbekannter Fehler');
    return textResponse('Der Versand ist fehlgeschlagen. Bitte rufen Sie uns an: 0151 53264522.', 502);
  }

  return redirectTo(request, '/danke/');
};

export const config = {
  path: '/api/anfrage',
  rateLimit: {
    windowLimit: 5,
    windowSize: 60,
    aggregateBy: ['ip', 'domain']
  }
};
