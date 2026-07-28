/**
 * Formular-Endpoint /api/anfrage (Netlify Function, siehe netlify.toml).
 *
 * Ablauf: validieren -> Spam pruefen -> E-Mail per SMTP senden -> Redirect auf /danke/.
 * Konfiguration ausschliesslich ueber Umgebungsvariablen (siehe .env.example).
 * Vor dem Launch muessen SMTP_* gesetzt sein, sonst antwortet der Endpoint mit 503.
 */
import nodemailer from 'nodemailer';

const PFLICHT = ['leistung', 'name', 'telefon', 'ort', 'beschreibung', 'kontaktweg', 'datenschutz'];
const MAX = { name: 120, telefon: 40, email: 160, ort: 120, beschreibung: 4000 };

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const daten = Object.fromEntries(await request.formData());

  // Spam-Schutz: Honeypot ausgefuellt oder Formular unrealistisch schnell (<3 s) abgeschickt
  const alter = Date.now() - Number(daten.ts || 0);
  if (daten.firma || !Number.isFinite(alter) || alter < 3000) {
    // Bots bekommen bewusst eine Erfolgsantwort ohne Verarbeitung
    return Response.redirect(new URL('/danke/', request.url), 303);
  }

  // Serverseitige Validierung
  const fehler = [];
  for (const feld of PFLICHT) if (!String(daten[feld] || '').trim()) fehler.push(feld);
  for (const [feld, max] of Object.entries(MAX)) if (String(daten[feld] || '').length > max) fehler.push(`${feld} (zu lang)`);
  if (daten.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(daten.email))) fehler.push('email (ungueltig)');
  if (fehler.length) {
    return new Response(`Bitte pruefen Sie folgende Felder: ${fehler.join(', ')}`, {
      status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO, MAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_TO || !MAIL_FROM) {
    console.error('anfrage: SMTP-Umgebungsvariablen unvollstaendig');
    return new Response('Der Versand ist derzeit nicht verfuegbar. Bitte rufen Sie uns an: 06571 9518180.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  const zeilen = [
    ['Leistung', daten.leistung], ['Name', daten.name], ['Telefon', daten.telefon],
    ['E-Mail', daten.email || '–'], ['Ort/PLZ', daten.ort], ['Objektart', daten.objektart || '–'],
    ['Zeitraum', daten.zeitraum || '–'], ['Budget', daten.budget || '–'],
    ['Bevorzugter Kontaktweg', daten.kontaktweg], ['Beschreibung', daten.beschreibung]
  ];

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      replyTo: daten.email ? String(daten.email) : undefined,
      subject: `Neue Projektanfrage: ${daten.leistung} – ${daten.name}`,
      text: zeilen.map(([k, v]) => `${k}: ${v}`).join('\n')
    });
  } catch (err) {
    console.error('anfrage: Mailversand fehlgeschlagen', err?.message);
    return new Response('Der Versand ist fehlgeschlagen. Bitte rufen Sie uns an: 06571 9518180.', {
      status: 502, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }

  return Response.redirect(new URL('/danke/', request.url), 303);
};

export const config = { path: '/api/anfrage' };
