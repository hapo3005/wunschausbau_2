export interface EnglishServiceSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface EnglishService {
  sourceId: string;
  slug: string;
  title: string;
  short: string;
  imageAlt: string;
  metaDescription: string;
  intro: string;
  sections: EnglishServiceSection[];
}

export const englishServices: EnglishService[] = [
  {
    sourceId: 'boeden',
    slug: 'flooring',
    title: 'Flooring',
    short: 'Careful preparation, precise installation and clean transitions for a durable finish.',
    imageAlt: 'Newly installed oak parquet in a bright living space',
    metaDescription: 'Flooring installation in Wittlich, Trier and the Moselle region: parquet, vinyl, laminate and timber boards, carefully prepared and precisely installed.',
    intro: 'A good floor starts before the first board is laid. For flooring projects in Wittlich, Trier and the Moselle region, we first assess the substrate, build-up height and transitions. Once the basis is right, the floor can be installed with clean junctions and a finish that belongs in the room.',
    sections: [
      {
        title: 'What we install',
        bullets: [
          'Parquet and solid timber boards',
          'Vinyl and design flooring',
          'Laminate flooring',
          'Skirting boards, transition strips and finishing profiles'
        ]
      },
      {
        title: 'How we work',
        paragraphs: [
          'We advise on materials and construction to suit the room and its use, take accurate measurements and agree the important details before work begins. This includes door junctions, transitions to adjoining rooms, skirting and the available build-up height.',
          'In existing buildings, preparation is often more important than the final covering itself. Uneven substrates, existing floor build-ups and awkward connection heights are therefore assessed before installation rather than discovered halfway through the job.'
        ]
      },
      {
        title: 'Parquet, vinyl or laminate?',
        paragraphs: [
          'The right floor depends on more than appearance. Parquet and timber boards offer a natural material character and, depending on the construction, can often be maintained or refinished over the long term. Vinyl and design flooring can be robust and easy to care for in many settings. Laminate can be a cost-effective option when the use, substrate and desired finish are a good match.',
          'We compare the options in the context of the actual room rather than recommending one material by default. Use, wear, care, build-up height and the relationship with doors and adjoining surfaces all matter.'
        ]
      },
      {
        title: 'Flooring in occupied and existing homes',
        paragraphs: [
          'Renovation work has to respect the existing building. We therefore plan removal, substrate preparation, cuts and transitions so the work remains understandable and the new floor does not look like an afterthought.',
          'After installation, we check junctions and transitions and hand over the area cleanly. We also provide appropriate care guidance for the chosen material.'
        ]
      }
    ]
  },
  {
    sourceId: 'innentueren',
    slug: 'interior-doors',
    title: 'Interior doors',
    short: 'Precisely fitted, accurately aligned and visually integrated into the room.',
    imageAlt: 'Precisely installed white interior door beside a large glazed frontage',
    metaDescription: 'Interior door installation in Wittlich, Trier and the Moselle region: precisely fitted, carefully aligned, stable and durable.',
    intro: 'Interior doors shape a room, and you notice every day whether they have been installed properly. For projects in Wittlich, Trier and the Moselle region, we look beyond the door leaf itself and consider the relationship between frame, wall, floor and hardware.',
    sections: [
      {
        title: 'Our services',
        bullets: [
          'Installation of new interior doors and frames',
          'Replacement of existing doors',
          'Adaptations for uneven walls and non-standard dimensions',
          'Hardware, seals and fine adjustment'
        ]
      },
      {
        title: 'What matters during installation',
        paragraphs: [
          'Consistent gaps, accurately positioned hinges and correctly aligned frames are the foundation. It is equally important to confirm floor build-up, wall thickness and opening dimensions before ordering or installation.',
          'Existing openings are not always as straight or dimensionally accurate as those in a new build. We therefore inspect the situation on site and agree the solution that makes sense both technically and visually.'
        ]
      },
      {
        title: 'Replacing interior doors in existing buildings',
        paragraphs: [
          'When an old door is replaced, the first question is what can sensibly remain. Depending on condition and the desired result, an existing opening may need a different approach from a completely new installation.',
          'We consider not only the clear opening but also wall junctions, floor heights, skirting and neighbouring finishes. This avoids a new door that works mechanically but feels visually disconnected from the finished room.'
        ]
      },
      {
        title: 'Which door suits the room?',
        paragraphs: [
          'Alongside colour and surface, the door type, hardware and frame design all influence the overall effect. In heavily used areas, durability and easy operation may matter most; in living spaces, proportion and material character often play a larger role.',
          'Our aim is a solution that works properly and integrates naturally into the existing or newly planned interior.'
        ]
      }
    ]
  },
  {
    sourceId: 'fenster-aussentueren',
    slug: 'windows-exterior-doors',
    title: 'Windows & exterior doors',
    short: 'Secure, stable and durable installation for comfort, function and efficiency.',
    imageAlt: 'Bright living space with large window and door openings',
    metaDescription: 'Window and exterior door installation in Wittlich, Trier and the Moselle region: securely fitted, properly sealed and integrated into the existing building.',
    intro: 'Windows and exterior doors form the interface between inside and outside. For installation and replacement projects in Wittlich, Trier and the Moselle region, the component itself is only part of the job: fixing, alignment and the connection to the existing structure are just as important.',
    sections: [
      {
        title: 'Our services',
        bullets: [
          'Installation and replacement of windows',
          'Front and secondary entrance doors',
          'Professional sealing of perimeter joints',
          'Adjustment, hardware maintenance and remedial work to existing units'
        ]
      },
      {
        title: 'Why installation matters',
        paragraphs: [
          'Even a high-quality window can only perform as intended when the connection to the wall is planned and executed correctly. Fixings, joints and sealing need to work together so the unit remains stable and the junction performs reliably over time.',
          'Before installation, we inspect the opening, installation situation and adjacent components. In existing buildings, reveals, shutter boxes, sills and existing finishes can all influence the best approach.'
        ]
      },
      {
        title: 'Replacing windows in existing buildings',
        paragraphs: [
          'Replacing a window is more than removing the old unit and inserting a new one. The existing installation determines how removal, junctions and the later finishes should be handled.',
          'Before work begins, we agree which areas are affected and what work will be needed around the opening. This reduces surprises after removal and helps the new solution fit both technically and visually into the building.'
        ]
      },
      {
        title: 'Exterior doors: function and junctions together',
        paragraphs: [
          'Front and secondary entrance doors are subject to heavy daily use. Secure fixing, accurate alignment, smooth operation and well-resolved floor and wall junctions are therefore essential.',
          'After installation, we check operation and settings. If an existing window or door no longer operates correctly, adjustment or remedial work may sometimes be the better first step before planning a complete replacement.'
        ]
      }
    ]
  },
  {
    sourceId: 'sonnenschutz',
    slug: 'shading',
    title: 'Shading',
    short: 'Pleated blinds, external blinds, shutters and awnings, neatly installed and easy to operate.',
    imageAlt: 'Living room with made-to-measure pleated blinds for solar shading',
    metaDescription: 'Shading solutions in Wittlich, Trier and the Moselle region: pleated blinds, external blinds, shutters and awnings, measured, installed and serviced.',
    intro: 'Shading controls light, heat and privacy. For projects in Wittlich, Trier and the Moselle region, we therefore consider not only appearance but also window size, orientation, operation and the available installation position.',
    sections: [
      {
        title: 'Our services',
        bullets: [
          'Made-to-measure pleated and roller blinds',
          'External venetian blinds and blinds',
          'Roller shutters, including repair and replacement',
          'Awnings for terraces and balconies'
        ]
      },
      {
        title: 'Which shading solution is right?',
        paragraphs: [
          'An internal pleated blind serves a different purpose from an external venetian blind or roller shutter. Internal systems can provide privacy and glare control directly at the window. External systems intercept solar gain earlier and can therefore be particularly relevant for summer heat protection.',
          'Awnings provide shade on terraces or balconies and need to suit the size, fixing conditions and use of the outdoor area. The best solution is therefore determined by the actual installation situation rather than appearance alone.'
        ]
      },
      {
        title: 'Measurement and installation on site',
        paragraphs: [
          'Before selecting a system, we check dimensions, fixing options and the operating route. For existing shutters or shading systems, we also assess whether repair, adjustment or replacement of individual components is sensible.',
          'A good installation should work almost unnoticed in everyday use: smooth, accessible and without awkward details. That is why the key points are clarified before ordering or installation.'
        ]
      },
      {
        title: 'Shading as part of a renovation',
        paragraphs: [
          'If windows, doors or other interior work are being changed at the same time, it pays to consider shading early. Connections and operation can then be coordinated with the rest of the work rather than adding a technically functional but visually disconnected solution later.'
        ]
      }
    ]
  },
  {
    sourceId: 'trockenbau',
    slug: 'drywall',
    title: 'Drywall',
    short: 'Stable construction, straight lines and accurately finished surfaces.',
    imageAlt: 'Completed drywall wall with a clean ceiling and recessed lighting',
    metaDescription: 'Drywall in Wittlich, Trier and the Moselle region: walls, ceilings and service boxing, built solidly, finished straight and prepared for decoration.',
    intro: 'Drywall creates space: new walls, suspended ceilings and neatly resolved service boxing. For interior projects in Wittlich, Trier and the Moselle region, we plan the construction, junctions and later surface finish together from the outset.',
    sections: [
      {
        title: 'Our services',
        bullets: [
          'Partition walls and wall linings',
          'Suspended ceilings, including integrated lighting',
          'Service boxing for pipes and technical installations',
          'Acoustic and thermal insulation within the fit-out',
          'High-quality jointing and surface finishing'
        ]
      },
      {
        title: 'Reconfiguring rooms',
        paragraphs: [
          'Drywall is a practical option when rooms need to be divided differently or existing layouts need to change. Before construction, we clarify the position, junctions and future use of the wall. These factors influence the build-up and where reinforcement may be required.',
          'Doors, built-in elements and services should also be considered early. The better these interfaces are planned, the less improvisation is needed later.'
        ]
      },
      {
        title: 'Suspended ceilings and service boxing',
        paragraphs: [
          'Ceilings can conceal services, compensate for uneven existing surfaces or integrate lighting into the room design. Service boxing creates clean transitions around technical areas so pipes and connections do not dominate the finished space.',
          'Straight lines, balanced proportions and a construction suited to the existing building are essential. We therefore consider ceiling, wall and adjacent components together.'
        ]
      },
      {
        title: 'Surface and finishing quality',
        paragraphs: [
          'Good drywall should disappear into the finished room rather than announce itself. Grazing light makes irregularities particularly visible, so the intended final surface should be agreed before finishing begins.',
          'Acoustic and thermal insulation are likewise planned where the use and construction call for them, rather than treated as an afterthought.'
        ]
      }
    ]
  },
  {
    sourceId: 'holzterrassen',
    slug: 'timber-decking',
    title: 'Timber decking',
    short: 'Planning, construction, repair and care for a durable outdoor space.',
    imageAlt: 'High-quality timber terrace with seating and a garden view',
    metaDescription: 'Timber decking in Wittlich, Trier and the Moselle region: planning, substructure, construction, repairs and maintenance, carefully executed.',
    intro: 'A timber terrace depends on what sits underneath it. For decking projects in Wittlich, Trier and the Moselle region, we plan not only the visible surface but also falls, ventilation, spacing and the connections to the house, garden and adjoining paths.',
    sections: [
      {
        title: 'Our services',
        bullets: [
          'Planning and construction of new timber terraces',
          'Stable, ventilated substructures',
          'Repairs and replacement of individual boards',
          'Cleaning and care of existing terraces'
        ]
      },
      {
        title: 'Timber or WPC?',
        paragraphs: [
          'Material choice affects appearance, maintenance and how the terrace feels in everyday use. Timber changes over time and develops its own patina depending on the species and treatment. WPC can be a lower-maintenance alternative, but it also has material-specific characteristics that need to suit the installation.',
          'We therefore look beyond colour and price to solar exposure, desired maintenance, use and structural build-up. The best solution is the one that suits the outdoor space and the expectations placed on the material.'
        ]
      },
      {
        title: 'Why the substructure matters',
        paragraphs: [
          'The visible boards are only one part of the terrace. Water needs to drain reliably below them and the construction needs sufficient ventilation. Spacing and support points affect stability and durability just as much as the top layer.',
          'Connections to doors, façades and existing surfaces are therefore considered before construction. These transitions often determine whether the terrace feels like a planned part of the house.'
        ]
      },
      {
        title: 'Repair or replace an existing terrace?',
        paragraphs: [
          'Not every ageing terrace needs complete replacement. If the substructure and parts of the surface remain sound, replacing individual boards or carrying out targeted repairs may be the more sensible option.',
          'We assess the existing structure and distinguish cosmetic ageing from structural problems, so the appropriate scope of work can be decided on evidence rather than assumption.'
        ]
      }
    ]
  },
  {
    sourceId: 'komplettrenovierung',
    slug: 'complete-renovation',
    title: 'Complete renovation',
    short: 'Multiple interior works coordinated sensibly from the existing space to one coherent finished result.',
    imageAlt: 'Bright living space with high-quality interior fit-out and a warm atmosphere',
    metaDescription: 'Complete renovation in Wittlich, Trier and the Moselle region: structure multiple interior works, resolve interfaces and coordinate each stage effectively.',
    intro: 'A complete renovation brings many work stages together. For projects in Wittlich, Trier and the Moselle region, the greatest benefit of coordinated planning lies in the interfaces: what has to happen first, which dimensions depend on each other and which decision affects the next stage?',
    sections: [
      {
        title: 'What matters when several works come together',
        bullets: [
          'Assess the existing space and structure the scope realistically',
          'Clarify sequence and interfaces between interior works early',
          'Coordinate materials, dimensions and junctions',
          'Prepare each stage so the process remains clear',
          'Review completion and any outstanding points together'
        ]
      },
      {
        title: 'Interfaces instead of isolated tasks',
        paragraphs: [
          'Renovation problems rarely stay within a single trade. Floor levels meet doors, drywall meets built-in elements, and window junctions affect later finishes. It therefore makes sense to view all affected areas as one connected project from the beginning.',
          'Before work starts, sequence, responsibilities and important decisions should be clear. This creates a transparent process and reduces situations where completed work has to be altered because of a later decision.'
        ]
      },
      {
        title: 'When does a complete renovation make sense?',
        paragraphs: [
          'Coordinated renovation planning is particularly useful when several areas are changing at the same time and depend on one another. That may involve one living area, several rooms or a larger alteration to an existing property.',
          'If only one clearly defined service is needed, an individual measure may be more appropriate. The goal is not to pack as much as possible into one project, but to define a scope in which effort, dependencies and the desired result make sense together.'
        ]
      },
      {
        title: 'From the existing space to the finished room',
        paragraphs: [
          'The process begins with an assessment of what is already there: which components remain, which will be replaced and which junctions need to be reconsidered? Materials, sequence and execution can then be coordinated sensibly.',
          'Throughout the work, the overall picture remains important. Floors, doors, walls, windows and details should not read as separate interventions at the end, but function as one coherent room.'
        ]
      }
    ]
  }
];

export const englishServiceBySlug = Object.fromEntries(englishServices.map((service) => [service.slug, service])) as Record<string, EnglishService>;
export const englishServiceBySourceId = Object.fromEntries(englishServices.map((service) => [service.sourceId, service])) as Record<string, EnglishService>;
