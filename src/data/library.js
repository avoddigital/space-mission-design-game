// Mission Library: real facts and real images about space exploration.
// Unlike the game values in parts.js or rockets.js, nothing here is simplified or invented.
// Every fact has a `source` that was opened and checked on 2026-11-14 (see CHECKED_ON).
// Images come from the NASA Image and Video Library (images.nasa.gov). NASA media is generally
// not copyrighted; the credit line of each image is kept as NASA lists it.
// Images are loaded from NASA's servers, so they need an internet connection. The texts work offline.

export const CHECKED_ON = '2026-11-14';

const IMG = (id, size = 'medium') => `https://images-assets.nasa.gov/image/${id}/${id}~${size}.jpg`;
const PAGE = (id) => `https://images.nasa.gov/details/${id}`;

const SRC = {
  orbits: 'https://science.nasa.gov/earth/earth-observatory/catalog-of-earth-satellite-orbits',
  dsn: 'https://www.nasa.gov/communicating-with-missions/dsn/',
  cubesats: 'https://www.nasa.gov/what-are-smallsats-and-cubesats/',
  rps: 'https://science.nasa.gov/planetary-science/programs/radioisotope-power-systems/',
  spaceWeather: 'https://svs.gsfc.nasa.gov/31248',
  challenge: 'https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/?tab=resources',
  designDevelop: 'https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf',
  cml: 'https://dataverse.jpl.nasa.gov/dataset.xhtml?persistentId=hdl:2014/44299',
  mdl: 'https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/',
};

/** Real NASA missions, grouped by destination (the same three as the game's scenarios). */
export const libraryMissions = [
  {
    id: 'landsat-9',
    name: 'Landsat 9',
    target: 'Earth',
    launched: 'September 27, 2021',
    summary: 'Takes pictures of all of Earth\'s land to show how forests, farms, cities and water change over time.',
    facts: [
      { text: 'Flies 705 km above Earth.', source: 'https://science.nasa.gov/mission/landsat-9/' },
      { text: 'Carries two instruments: the Operational Land Imager (OLI) and the Thermal Infrared Sensor (TIRS).', source: 'https://science.nasa.gov/mission/landsat-9/' },
      { text: 'Together with Landsat 8, it observes the same place on Earth every 8 days.', source: 'https://science.nasa.gov/mission/landsat-9/' },
    ],
    image: {
      src: IMG('NHQ202109260006'),
      page: PAGE('NHQ202109260006'),
      alt: 'An Atlas V rocket with the Landsat 9 satellite on board, at the launch site in California.',
      caption: 'The Atlas V rocket with Landsat 9 on board, September 26, 2021, the day before launch (Vandenberg Space Force Base, California).',
      credit: 'NASA/Bill Ingalls',
    },
    url: 'https://science.nasa.gov/mission/landsat-9/',
  },
  {
    id: 'landsat-8',
    name: 'Landsat 8',
    target: 'Earth',
    launched: 'February 11, 2013',
    summary: 'The partner of Landsat 9: same orbit, same kind of instruments, so the two can share the work.',
    facts: [
      { text: 'Flies 705 km above Earth, in the same orbit as Landsat 9.', source: 'https://science.nasa.gov/mission/landsat-8/' },
      { text: 'Carries the Operational Land Imager (OLI) and the Thermal Infrared Sensor (TIRS).', source: 'https://science.nasa.gov/mission/landsat-8/' },
    ],
    image: {
      src: IMG('GSFC_20171208_Archive_e001696', 'small'),
      page: PAGE('GSFC_20171208_Archive_e001696'),
      alt: 'Artist\'s drawing of the Landsat 8 satellite above Earth.',
      caption: 'Artist\'s drawing of Landsat 8, made before launch when it was called the Landsat Data Continuity Mission.',
      credit: 'NASA',
    },
    url: 'https://science.nasa.gov/mission/landsat-8/',
  },
  {
    id: 'lro',
    name: 'Lunar Reconnaissance Orbiter (LRO)',
    target: 'Moon',
    launched: 'June 18, 2009',
    summary: 'Maps the Moon in great detail to prepare future missions, including astronauts.',
    facts: [
      { text: 'Helps NASA find places near the Moon\'s South Pole with water and long periods of sunlight.', source: 'https://science.nasa.gov/mission/lro/' },
      { text: 'Launched on the same rocket as LCROSS.', source: 'https://science.nasa.gov/mission/lcross/' },
    ],
    image: {
      src: IMG('PIA12072'),
      page: PAGE('PIA12072'),
      alt: 'Artist\'s drawing of the Lunar Reconnaissance Orbiter flying above the Moon.',
      caption: 'Artist\'s drawing of LRO above the Moon.',
      credit: 'NASA/JPL',
    },
    url: 'https://science.nasa.gov/mission/lro/',
  },
  {
    id: 'lcross',
    name: 'LCROSS',
    target: 'Moon',
    launched: 'June 18, 2009',
    summary: 'A low-cost mission that crashed a used rocket stage into the Moon on purpose, to look for water.',
    facts: [
      { text: 'On October 9, 2009, the empty Centaur rocket stage and then LCROSS itself hit Cabeus crater, near the Moon\'s south pole.', source: 'https://science.nasa.gov/mission/lcross/' },
      { text: 'The impact uncovered water near the south pole.', source: 'https://science.nasa.gov/mission/lcross/' },
    ],
    image: {
      src: IMG('ARC-2008-ACD07-0073-412'),
      page: PAGE('ARC-2008-ACD07-0073-412'),
      alt: 'The LCROSS spacecraft in a clean room, being prepared by two engineers.',
      caption: 'The real LCROSS spacecraft in a clean room at NASA Ames, 2008, before it was joined to LRO.',
      credit: 'NASA Ames',
    },
    url: 'https://science.nasa.gov/mission/lcross/',
  },
  {
    id: 'mro',
    name: 'Mars Reconnaissance Orbiter (MRO)',
    target: 'Mars',
    launched: 'August 12, 2005',
    summary: 'Studies the history of water on Mars and helps other missions talk to Earth.',
    facts: [
      { text: 'Entered orbit around Mars on March 10, 2006.', source: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/' },
      { text: 'One of its cameras is the largest ever flown on a planetary mission.', source: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/' },
      { text: 'Its radio is the first link in a communications bridge back to Earth for other Mars spacecraft.', source: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/' },
    ],
    image: {
      src: IMG('PIA04758'),
      page: PAGE('PIA04758'),
      alt: 'Artist\'s drawing of the Mars Reconnaissance Orbiter above Mars, with large solar panels and a dish antenna.',
      caption: 'Artist\'s drawing of MRO at Mars.',
      credit: 'NASA/JPL',
    },
    url: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/',
  },
  {
    id: 'odyssey',
    name: '2001 Mars Odyssey',
    target: 'Mars',
    launched: 'April 7, 2001',
    summary: 'Maps Mars and relays messages for rovers and landers.',
    facts: [
      { text: 'Arrived at Mars on October 24, 2001.', source: 'https://science.nasa.gov/mission/odyssey/' },
      { text: 'Holds the record for the longest continually active mission in orbit around a planet other than Earth.', source: 'https://science.nasa.gov/mission/odyssey/' },
    ],
    image: {
      src: IMG('PIA04244'),
      page: PAGE('PIA04244'),
      alt: 'Artist\'s drawing of the 2001 Mars Odyssey spacecraft above Mars.',
      caption: 'Artist\'s drawing of 2001 Mars Odyssey.',
      credit: 'NASA/JPL',
    },
    url: 'https://science.nasa.gov/mission/odyssey/',
  },
  {
    id: 'maven',
    name: 'MAVEN',
    target: 'Mars',
    launched: 'November 18, 2013',
    summary: 'Studies the thin upper atmosphere of Mars to learn how the planet lost most of its air and water.',
    facts: [
      { text: 'Its main goal is understanding the Martian upper atmosphere.', source: 'https://science.nasa.gov/mission/maven/' },
      { text: 'Entered orbit around Mars on September 21, 2014.', source: 'https://science.nasa.gov/mission/maven/' },
    ],
    image: {
      src: IMG('PIA17487'),
      page: PAGE('PIA17487'),
      alt: 'Artist\'s drawing of the MAVEN spacecraft near Mars.',
      caption: 'Artist\'s drawing of MAVEN near Mars.',
      credit: 'NASA/GSFC',
    },
    url: 'https://science.nasa.gov/mission/maven/',
  },
];

/** How missions work: short real explanations linked to the game's six resources. */
export const libraryTopics = [
  {
    id: 'segments',
    title: 'The four parts of every mission',
    resource: 'time',
    summary: 'NASA describes a science mission as four segments that must work together.',
    facts: [
      { text: 'Launch segment: the rocket and launch services that put the mission in space.', source: SRC.challenge },
      { text: 'Space segment: the spacecraft and its instruments (or landers and rovers).', source: SRC.challenge },
      { text: 'Ground segment: the antennas and mission control that talk to the spacecraft and receive data.', source: SRC.challenge },
      { text: 'User segment: the scientists and other people who analyse and use the data.', source: SRC.challenge },
    ],
    more: { label: 'Design and Develop Science Missions (NASA, PDF)', url: SRC.designDevelop },
  },
  {
    id: 'maturity',
    title: 'From an idea to a real mission',
    resource: 'budget',
    summary: 'Before a mission is approved, its idea grows step by step. NASA\'s Jet Propulsion Laboratory measures this with Concept Maturity Levels (CMLs).',
    facts: [
      { text: 'CML 1 is the first mission idea. Each level after it adds more detail: feasibility, trade studies, a point design and an implementation plan.', source: SRC.challenge },
      { text: 'The biggest design decisions are made in the early levels, CML 1 to 4.', source: SRC.challenge },
      { text: 'At NASA\'s Mission Design Lab, engineers and scientists compare options (trade studies) and turn an idea into a checked design with cost estimates.', source: SRC.challenge },
    ],
    more: { label: 'Concept Maturity Levels (JPL)', url: SRC.cml },
  },
  {
    id: 'orbits',
    title: 'Choosing an orbit',
    resource: 'mass',
    summary: 'The orbit decides what a spacecraft can see, how often, and how hard it is to get there.',
    facts: [
      { text: 'Low Earth orbit starts just above the top of the atmosphere.', source: SRC.orbits },
      { text: 'Polar-orbiting Earth observation satellites take about 99 minutes to go around Earth once.', source: SRC.orbits },
      { text: 'A sun-synchronous orbit crosses the equator at about the same local time every day, so the light is similar in every picture.', source: SRC.orbits },
      { text: 'A geosynchronous orbit is about 36,000 km above the surface and goes around Earth exactly once a day.', source: SRC.orbits },
    ],
    image: {
      src: IMG('iss061e123823'),
      page: PAGE('iss061e123823'),
      alt: 'The first light of sunrise on the thin blue line of Earth\'s atmosphere, seen from orbit.',
      caption: 'An orbital sunrise seen from the International Space Station, about 260 miles (420 km) above the Atlantic Ocean, January 12, 2020.',
      credit: 'NASA',
    },
  },
  {
    id: 'comms',
    title: 'Talking to spacecraft',
    resource: 'data',
    summary: 'A mission is only useful if its data reaches Earth. Far-away spacecraft use NASA\'s Deep Space Network.',
    facts: [
      { text: 'The Deep Space Network has three antenna complexes: Goldstone (California, USA), near Madrid (Spain) and near Canberra (Australia).', source: SRC.dsn },
      { text: 'They are spread around the world so that, as Earth turns, one of them can always talk to a spacecraft.', source: SRC.dsn },
      { text: 'At Mars, orbiters like MRO and Odyssey also relay data for other spacecraft.', source: 'https://science.nasa.gov/mission/odyssey/' },
    ],
    image: {
      src: IMG('PIA23214'),
      page: PAGE('PIA23214'),
      alt: 'Large white dish antennas in the desert at Goldstone, California.',
      caption: 'Antenna dishes at the Deep Space Network complex in Goldstone, California, February 11, 2020.',
      credit: 'NASA/JPL-Caltech',
    },
  },
  {
    id: 'power',
    title: 'Power far from the Sun',
    resource: 'power',
    summary: 'Most spacecraft use solar panels. When sunlight is too weak or unreliable, some use a radioisotope power system.',
    facts: [
      { text: 'A radioisotope power system turns heat from the natural decay of plutonium-238 into electricity.', source: SRC.rps },
      { text: 'It works for years, mostly independent of sunlight, temperature and dust.', source: SRC.rps },
      { text: 'This kind of power lets Voyager 1 and 2 keep working very far from the Sun, and it powers the Curiosity rover on Mars.', source: SRC.rps },
    ],
    image: {
      src: IMG('PIA04495'),
      page: PAGE('PIA04495'),
      alt: 'Artist\'s drawing of a Voyager spacecraft with its large dish antenna pointed toward Earth.',
      caption: 'Artist\'s drawing of a Voyager spacecraft, its antenna pointing to Earth.',
      credit: 'NASA/JPL',
    },
  },
  {
    id: 'space-weather',
    title: 'Space weather',
    resource: 'comms',
    summary: 'The Sun can send out bursts of energetic particles. Engineers design spacecraft to survive them.',
    facts: [
      { text: 'Energetic particles can cause temporary problems and damage critical electronics.', source: SRC.spaceWeather },
      { text: 'They can degrade solar arrays, so the spacecraft gets less power.', source: SRC.spaceWeather },
      { text: 'They can blind optical systems such as cameras and star trackers.', source: SRC.spaceWeather },
    ],
    image: {
      src: IMG('GSFC_20171208_Archive_e001210'),
      page: PAGE('GSFC_20171208_Archive_e001210'),
      alt: 'The Sun seen in several colors of light, with a bright flare on its left edge.',
      caption: 'The first moments of a strong (X-class) solar flare, February 24, 2014, seen by NASA\'s Solar Dynamics Observatory.',
      credit: 'NASA/SDO',
    },
  },
  {
    id: 'cubesats',
    title: 'CubeSats: small satellites',
    resource: 'budget',
    summary: 'Small, standard-size satellites let students and small teams fly real missions.',
    facts: [
      { text: 'A standard CubeSat "unit" (1U) is a 10 × 10 × 10 cm cube.', source: SRC.cubesats },
      { text: 'CubeSats can be bigger: 1.5U, 2U, 3U, 6U and even 12U.', source: SRC.cubesats },
      { text: 'CubeSats are a kind of nanosatellite, a class that NASA defines as 1 to 10 kilograms.', source: SRC.cubesats },
    ],
    image: {
      src: IMG('iss074e0301636'),
      page: PAGE('iss074e0301636'),
      alt: 'Three small CubeSats flying away from the International Space Station, with Earth below.',
      caption: 'Three CubeSats built by college students are released from the International Space Station, February 3, 2026.',
      credit: 'NASA',
    },
    more: { label: 'CubeSat 101 (NASA, PDF)', url: 'https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf' },
  },
];

/** The challenge's official Resources tab (NASA Space Apps 2026), with a short plain description. */
export const challengeResources = [
  { name: 'Design and Develop Science Missions', url: SRC.designDevelop, text: 'How NASA takes a mission from a science need to requirements, design, testing and launch.' },
  { name: 'General Mission Analysis Tool (GMAT)', url: 'https://software.nasa.gov/software/GSC-19468-1', text: 'Free, open-source software to design and analyse spacecraft trajectories, from low Earth orbit to deep space.' },
  { name: 'Concept Maturity Levels (CMLs)', url: SRC.cml, text: 'JPL\'s scale for how far a mission idea has matured, from first idea to detailed design.' },
  { name: 'Mission Design Lab (MDL)', url: SRC.mdl, text: 'Where NASA Goddard engineers and scientists quickly turn mission ideas into checked designs.' },
  { name: 'NASA Mission Viz', url: 'https://nasa.github.io/mission-viz/', text: 'A 3D web view to explore spacecraft, planets and mission trajectories.' },
  { name: 'A Learning Game About Telescopes', url: 'https://science.nasa.gov/mission/webb/game-build-it-yourself/', text: 'Build your own space telescope, from NASA\'s Webb mission.' },
  { name: 'CubeSat 101', url: 'https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf', text: 'Basic concepts and steps for teams building their first CubeSat.' },
  { name: 'Digital Games and Activities (Canadian Space Agency)', url: 'https://www.asc-csa.gc.ca/eng/youth-educators/digital-games-and-activities.asp', text: 'Space games and activities from a Space Apps partner agency.' },
];
