// Player-facing text. Plain English for beginners.
// Format: Carlos.md, section 3 (tasks 2, 3 and 4).
//
// Real missions (content.scenarios[...].realMissions) are real facts, not simplified.
// Each one was checked on its official NASA page (see `url`) on 2026-11-13.
// Other facts: sunlight at Mars ~43% of Earth (NASA TM-2001-210935);
// coldest lunar craters measured by LRO Diviner (NASA LRO pages).
export const content = {
  // --- Task 2: one entry per engine issue code. Placeholders use only the names listed in Carlos.md ---
  issues: {
    NO_ROCKET: {
      title: 'No rocket yet',
      text: 'Your spacecraft needs a rocket to leave Earth.',
      tip: 'Pick a rocket in the launch step.',
      learn: 'Every mission starts with a ride to space, and the rocket is chosen to fit the spacecraft.',
    },
    NO_ORBIT: {
      title: 'No orbit yet',
      text: 'Your mission does not have a destination.',
      tip: 'Pick an orbit in the launch step.',
      learn: 'Where you send a spacecraft decides what it can see, how long it takes to get there and which rocket you need.',
    },
    MISSING_REQUIRED_TYPE: {
      title: 'A part is missing',
      text: 'This mission needs at least one {type} part.',
      tip: 'Go back to the spacecraft step and add one.',
      learn: 'Every spacecraft needs instruments to do science, power to stay alive and an antenna to talk to Earth.',
    },
    ORBIT_NOT_ALLOWED: {
      title: 'Wrong destination',
      text: 'This orbit does not match this mission.',
      tip: 'Pick one of the orbits offered for this mission.',
      learn: 'The science question decides the destination, not the other way around.',
    },
    ROCKET_CANNOT_REACH_ORBIT: {
      title: 'This rocket cannot get there',
      text: 'This rocket is not powerful enough to reach this orbit.',
      tip: 'Try a bigger rocket.',
      learn: 'Going farther takes much more energy, so only some rockets can reach the Moon or Mars.',
    },
    PAYLOAD_TOO_HEAVY: {
      title: 'Too heavy for the rocket',
      text: 'Your spacecraft is {excessKg} kg too heavy. This rocket can carry {capacityKg} kg to this orbit.',
      tip: 'Remove a heavy part, or try a stronger rocket.',
      learn: 'A rocket carries less mass the farther it has to go, so every kilogram counts.',
    },
    LOW_MASS_MARGIN: {
      title: 'Tight on mass',
      text: 'It fits, but only {marginKg} kg ({marginPct}%) of free room is left on the rocket.',
      tip: 'Keep some room free, or try a slightly bigger rocket.',
      learn: 'Spacecraft often get heavier during design, so engineers keep extra room on the rocket.',
    },
    POWER_DEFICIT: {
      title: 'Not enough power',
      text: 'Your spacecraft needs {missingW} W more than your power system produces.',
      tip: 'Add a bigger solar panel, or remove an instrument that uses a lot of power.',
      learn: 'Every instrument must be powered all the time. Power is a budget, just like money.',
    },
    OVER_BUDGET: {
      title: 'Over budget',
      text: 'Your mission costs {excessMUsd} million USD more than the budget.',
      tip: 'Try a cheaper rocket, or swap an expensive instrument for a cheaper one.',
      learn: 'Real missions have a fixed budget, and the rocket is often one of the biggest costs.',
    },
    OVER_TIME: {
      title: 'Out of time',
      text: 'Your mission takes {excessDays} days longer than the deadline.',
      tip: 'Choose a destination that is faster to reach.',
      learn: 'Travel time counts too: science only starts after the spacecraft arrives.',
    },
    NO_COMMS: {
      title: 'No antenna',
      text: 'Your spacecraft cannot talk to Earth.',
      tip: 'Add an antenna in the spacecraft step.',
      learn: 'A spacecraft that cannot send its data home cannot share any of its discoveries.',
    },
    DATA_BACKLOG: {
      title: 'Data is piling up',
      text: 'Your instruments collect {excessGbPerDay} GB per day more than your antenna can send home. That extra data is lost.',
      tip: 'Try a stronger antenna, or an instrument that makes less data.',
      learn: 'Collecting data is only half the job. The antenna must be able to send it all to Earth.',
    },
    LOW_SCIENCE: {
      title: 'Science goal not reached',
      text: 'Your instruments give {scienceValue} science points, but the goal is {minScience}.',
      tip: 'Add another instrument, or swap one for a more powerful one.',
      learn: 'Engineers choose the mix of instruments that best answers the science question.',
    },
  },

  // --- Task 3: "Learn" box for each step (max 3 sentences + a rule of thumb) ---
  learn: {
    objective: {
      text: 'Scientists start with a question. Engineers then build the spacecraft that can answer it.',
      rule: 'Question first, hardware second.',
    },
    spacecraft: {
      text: 'Every instrument adds science, but also mass, power, data and cost. Solar panels keep the spacecraft alive, and antennas send its data home.',
      rule: 'Every gram you add must be launched and powered.',
    },
    launch: {
      text: 'A rocket carries less mass the farther it has to go. A rocket that is too small cannot do the job, and one that is too big wastes money.',
      rule: 'Pick the smallest rocket that can do the job with some room to spare.',
    },
    simulation: {
      text: 'Real missions face surprises, like solar storms and launch delays. Spacecraft with extra margin, meaning resources left over, survive them.',
      rule: 'Margin is your insurance.',
    },
    report: {
      text: 'Engineers learn from every mission, especially the ones that fail. Change one thing at a time and try again.',
      rule: 'Every failure teaches you something.',
    },
  },

  // --- Task 3: what opens when the player taps a meter (5 meters; data and comms share "Data downlink") ---
  meters: {
    budget: {
      name: 'Budget',
      unit: 'million USD',
      text: 'How much your mission costs: the parts, the spacecraft body and the rocket. It must fit the budget.',
    },
    mass: {
      name: 'Mass',
      unit: 'kg',
      text: 'How heavy your spacecraft is. Your rocket can only carry so much, and it carries less to farther places.',
    },
    power: {
      name: 'Power',
      unit: 'W',
      text: 'Electricity your parts use compared with what your solar panels produce. If you use more than you produce, the spacecraft shuts down.',
    },
    data: {
      name: 'Data downlink',
      unit: 'GB/day',
      text: 'Data your instruments collect each day compared with what your antenna can send to Earth. Data that cannot be sent is lost.',
    },
    time: {
      name: 'Time',
      unit: 'days',
      text: 'Travel time plus science time. Reaching the Moon takes days and reaching Mars takes months, and the whole mission must end before the deadline.',
    },
  },

  // --- Task 4: one entry per scenario id in scenarios.js ---
  scenarios: {
    'earth-observation': {
      question: "How are Earth's forests, ice and cities changing?",
      briefing:
        'Scientists need a new satellite to watch our planet change. Build a spacecraft that can photograph Earth for a whole year and send the pictures home. Keep it light and affordable: a smaller rocket could save a lot of money.',
      fact: "Did you know? Landsat satellites have been taking pictures of Earth since 1972. It is the longest continuous record of Earth's land taken from space.",
      realMissions: [
        {
          name: 'Landsat 9',
          launchYear: 2021,
          summary: 'Photographs all of Earth from a sun-synchronous orbit about 705 km high, repeating its path every 16 days.',
          lesson: 'An orbit can be chosen so that every picture is taken at the same local time, which makes changes easy to compare.',
          url: 'https://science.nasa.gov/mission/landsat-9/',
        },
        {
          name: 'Landsat 8',
          launchYear: 2013,
          summary: 'Takes detailed images of Earth that help track changes in land, forests and water. It flies in the same orbit as Landsat 9.',
          lesson: 'Two satellites in the same orbit can cover the whole planet about every eight days, twice as often as one.',
          url: 'https://science.nasa.gov/mission/landsat-8/',
        },
      ],
      quiz: {
        q: 'Why do Earth-observing satellites often use a sun-synchronous orbit?',
        options: [
          'They pass over each place at the same local time, so the lighting is similar',
          'It is the only orbit rockets can reach',
          'It is closer to the Sun, so solar panels make more power',
        ],
        answer: 0,
        why: 'Similar lighting on every pass makes images easy to compare. A change in the picture then means a change on the ground, not just a different shadow.',
      },
    },
    'moon-exploration': {
      question: 'Where on the Moon could future astronauts find water ice?',
      briefing:
        'Astronauts are going back to the Moon, and they will need water. Build a spacecraft that can orbit the Moon for a year and map where ice might hide. Reaching the Moon takes a bigger rocket than staying near Earth, so plan your mass and budget carefully.',
      fact: "Did you know? Some craters near the Moon's poles never see sunlight. They are among the coldest places ever measured in the Solar System.",
      realMissions: [
        {
          name: 'Lunar Reconnaissance Orbiter (LRO)',
          launchYear: 2009,
          summary: 'Maps the Moon from a low polar orbit to help find safe landing sites and places with water and long sunlight.',
          lesson: 'A polar orbit lets one spacecraft see the whole Moon, including the shadowed craters near the poles.',
          url: 'https://science.nasa.gov/mission/lro/',
        },
        {
          name: 'LCROSS',
          launchYear: 2009,
          summary: 'Crashed a used rocket stage into Cabeus crater near the south pole, flew through the cloud of debris and found water.',
          lesson: 'Sharing a rocket with LRO saved money, and even a crash can be a clever science experiment.',
          url: 'https://science.nasa.gov/mission/lcross/',
        },
      ],
      quiz: {
        q: 'Why does a Moon mission usually need a bigger rocket than a satellite in low Earth orbit?',
        options: [
          'A rocket can carry less mass the farther it has to send it',
          'The Moon has stronger gravity than Earth',
          'Spacecraft for the Moon are always made of heavier metal',
        ],
        answer: 0,
        why: 'Sending a spacecraft toward the Moon takes much more energy than reaching low orbit. The same rocket can carry only a fraction of the mass that far.',
      },
    },
    'mars-study': {
      question: 'Was there ever liquid water on Mars, and where did it go?',
      briefing:
        'Mars was once warmer and wetter, and scientists want to know what happened. Build a spacecraft that can travel to Mars and study it from orbit. The trip takes months and Mars is very far away, so think about time and how much data your antenna can send home.',
      fact: 'Did you know? Sunlight at Mars is less than half as strong as at Earth, so solar-powered spacecraft there need bigger panels.',
      realMissions: [
        {
          name: 'Mars Reconnaissance Orbiter (MRO)',
          launchYear: 2005,
          summary: 'Studies the history of water on Mars and relays data from rovers on the surface back to Earth.',
          lesson: 'One orbiter can do its own science and also act as a communications link for other missions.',
          url: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/',
        },
        {
          name: '2001 Mars Odyssey',
          launchYear: 2001,
          summary: 'Mapped hydrogen near the surface of Mars, which led scientists to large amounts of buried water ice.',
          lesson: 'A long-lasting spacecraft keeps delivering science for many years after its main mission ends.',
          url: 'https://science.nasa.gov/mission/odyssey/',
        },
        {
          name: 'MAVEN',
          launchYear: 2013,
          summary: 'The first mission devoted to understanding the upper atmosphere of Mars.',
          lesson: 'A mission can focus on one clear question and choose only the instruments that answer it.',
          url: 'https://science.nasa.gov/mission/maven/',
        },
      ],
      quiz: {
        q: 'Why do solar-powered spacecraft at Mars need bigger solar panels than at Earth?',
        options: [
          'Mars is farther from the Sun, so its sunlight is weaker',
          'Dust storms on Earth block more light',
          'Solar panels only work near Earth',
        ],
        answer: 0,
        why: 'Sunlight spreads out as it travels away from the Sun. At Mars, each square meter of panel gets less than half the light it would get near Earth.',
      },
    },
  },

  // --- Optional: short definitions of technical terms ---
  glossary: {
    payload: 'The spacecraft or cargo that a rocket carries to space.',
    orbit: 'The path a spacecraft follows as it travels around a planet or moon.',
    LEO: 'Low Earth Orbit: a few hundred kilometers above Earth. Close and easy to reach.',
    'sun-synchronous orbit': 'An orbit that passes over each place at the same local time every day.',
    GEO: 'Geostationary orbit: about 36,000 km high. A satellite there stays above the same spot on Earth.',
    downlink: 'Data the spacecraft sends down to Earth.',
    margin: 'Extra room left below a limit. It protects the mission against surprises.',
  },
};
