---
import { getCollection, render } from 'astro:content';
import { Image } from 'astro:assets';
import Base from '../../layouts/Base.astro';
import CtaBand from '../../components/CtaBand.astro';

export async function getStaticPaths() {
  const leistungen = await getCollection('leistungen');
  return leistungen.map((l) => ({ params: { slug: l.id }, props: { leistung: l } }));
}

const { leistung } = Astro.props;
const { Content } = await render(leistung);
const alle = (await getCollection('leistungen')).sort((a, b) => a.data.reihenfolge - b.data.reihenfolge);
const weitere = alle.filter((l) => l.id !== leistung.id);
---
<Base
  title={`${leistung.data.title} | wunschausbau.de – Innenausbau Wittlich, Trier & Mosel`}
  description={leistung.data.metaDescription}
>
  <article>
    <section class="section detail-head">
      <div class="wrap head-grid">
        <div>
          <p class="eyebrow"><a href="/leistungen/" class="crumb">Leistungen</a></p>
          <h1>{leistung.data.title}</h1>
          <p class="lead">{leistung.data.kurztext}</p>
          <a class="btn" href="/kontakt/" style="margin-top: var(--space-4);">Projekt anfragen</a>
        </div>
        <Image src={leistung.data.bild} alt={leistung.data.bildAlt} widths={[640, 1024]} sizes="(max-width: 56rem) 100vw, 50vw" quality={70} format="webp" loading="eager" />
      </div>
    </section>

    <section class="section section--sand">
      <div class="wrap prose">
        <Content />
      </div>
    </section>
  </article>

  <section class="section" aria-label="Weitere Leistungen">
    <div class="wrap">
      <p class="eyebrow">Weitere Leistungen</p>
      <ul class="weitere">
        {weitere.map((l) => (
          <li><a href={`/leistungen/${l.id}/`}>{l.data.title}</a></li>
        ))}
      </ul>
    </div>
  </section>
  <CtaBand />
</Base>

<style>
  .head-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); align-items: center; }
  .head-grid img { border-radius: var(--radius); aspect-ratio: 4 / 3; object-fit: cover; width: 100%; }
  .crumb { text-decoration: none; }
  .prose :global(h2) { font-size: clamp(1.4rem, 2.4vw, 1.8rem); margin: var(--space-4) 0 var(--space-2); }
  .prose :global(p) { margin-bottom: var(--space-2); color: var(--ink-soft); }
  .prose :global(ul) { margin: 0 0 var(--space-2) 1.25rem; color: var(--ink-soft); display: grid; gap: .4rem; }
  .weitere { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-2); }
  .weitere a { display: inline-block; padding: .6rem 1rem; border: 1px solid var(--line); border-radius: var(--radius); text-decoration: none; font-size: var(--text-sm); font-weight: 500; }
  .weitere a:hover { border-color: var(--brass); color: var(--brass-deep); }
  @media (max-width: 56rem) { .head-grid { grid-template-columns: 1fr; } }
</style>
