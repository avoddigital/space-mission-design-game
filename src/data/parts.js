// Simplified values, inspired by real missions. Not exact.
// Mass and power are rounded approximations of the reference instruments.
// costMUsd and scienceValue are game values, not real-world figures.
export const parts = [
  // --- Instruments ---
  {
    id: 'hd-camera',
    name: 'High-Resolution Camera',
    description: 'Takes very detailed pictures. Great science, but it produces a lot of data.',
    type: 'instrument',
    massKg: 65, // simplified, inspired by HiRISE (MRO)
    powerW: 60,
    costMUsd: 20,
    dataGbPerDay: 40,
    scienceValue: 7,
  },
  {
    id: 'context-camera',
    name: 'Context Camera',
    description: 'A small, light camera that takes wide pictures. Cheap and simple, but it shows less detail.',
    type: 'instrument',
    massKg: 5, // simplified, inspired by CTX (MRO)
    powerW: 10,
    costMUsd: 5,
    dataGbPerDay: 10,
    scienceValue: 3,
  },
  {
    id: 'multispectral-imager',
    name: 'Multispectral Imager',
    description: 'Sees colors the human eye cannot, to study plants, water and soil. Top science, but heavy and power-hungry.',
    type: 'instrument',
    massKg: 90, // simplified, inspired by OLI (Landsat 8)
    powerW: 100,
    costMUsd: 35,
    dataGbPerDay: 60,
    scienceValue: 8,
  },
  {
    id: 'thermal-imager',
    name: 'Thermal Infrared Imager',
    description: 'Measures heat to map rocks, ice and temperatures. Light and cheap, with medium science.',
    type: 'instrument',
    massKg: 12, // simplified, inspired by THEMIS (Mars Odyssey)
    powerW: 15,
    costMUsd: 10,
    dataGbPerDay: 5,
    scienceValue: 5,
  },
  {
    id: 'imaging-spectrometer',
    name: 'Imaging Spectrometer',
    description: 'Splits light into many colors to find out which minerals are on the surface. Strong science for its size.',
    type: 'instrument',
    massKg: 33, // simplified, inspired by CRISM (MRO)
    powerW: 45,
    costMUsd: 18,
    dataGbPerDay: 20,
    scienceValue: 7,
  },
  {
    id: 'radar-sounder',
    name: 'Subsurface Radar Sounder',
    description: 'Sends radio waves into the ground to look for buried ice and rock layers. It needs a lot of power for its size.',
    type: 'instrument',
    massKg: 20, // simplified, inspired by SHARAD (MRO)
    powerW: 40,
    costMUsd: 15,
    dataGbPerDay: 8,
    scienceValue: 6,
  },
  {
    id: 'laser-altimeter',
    name: 'Laser Altimeter',
    description: 'Fires laser pulses to measure the height of the surface. Great for mapping landing sites, and it makes very little data.',
    type: 'instrument',
    massKg: 14, // simplified, inspired by LOLA (LRO)
    powerW: 35,
    costMUsd: 12,
    dataGbPerDay: 2,
    scienceValue: 5,
  },
  {
    id: 'gamma-ray-spectrometer',
    name: 'Gamma-Ray Spectrometer',
    description: 'Detects chemical elements, such as hydrogen from buried ice. Very little data, but it is heavy.',
    type: 'instrument',
    massKg: 30, // simplified, inspired by GRS (Mars Odyssey)
    powerW: 30,
    costMUsd: 14,
    dataGbPerDay: 1,
    scienceValue: 5,
  },
  {
    id: 'radiation-detector',
    name: 'Radiation Detector',
    description: 'Measures space radiation, which matters for future astronauts. Light and cheap, but modest science.',
    type: 'instrument',
    massKg: 6, // simplified, inspired by CRaTER (LRO)
    powerW: 8,
    costMUsd: 5,
    dataGbPerDay: 0.5,
    scienceValue: 3,
  },
  {
    id: 'magnetometer',
    name: 'Magnetometer',
    description: 'Measures magnetic fields. Tiny and cheap, but it adds only a little science.',
    type: 'instrument',
    massKg: 1, // simplified, inspired by MAG (MAVEN)
    powerW: 4,
    costMUsd: 3,
    dataGbPerDay: 0.1,
    scienceValue: 2,
  },

  // --- Power ---
  {
    id: 'solar-panel-s',
    name: 'Small Solar Panel',
    description: 'A small solar panel. Light and cheap, but it can only power a simple spacecraft.',
    type: 'power',
    massKg: 15, // simplified, generic solar array
    powerW: 0,
    powerGenW: 150,
    costMUsd: 4,
    dataGbPerDay: 0,
    scienceValue: 0,
  },
  {
    id: 'solar-panel-m',
    name: 'Medium Solar Panel',
    description: 'A medium solar panel. A good balance between power, mass and cost.',
    type: 'power',
    massKg: 30, // simplified, generic solar array
    powerW: 0,
    powerGenW: 300,
    costMUsd: 8,
    dataGbPerDay: 0,
    scienceValue: 0,
  },
  {
    id: 'solar-panel-l',
    name: 'Large Solar Panel',
    description: 'A large solar panel for power-hungry instruments. Lots of power, but heavy.',
    type: 'power',
    massKg: 70, // simplified, generic solar array
    powerW: 0,
    powerGenW: 800,
    costMUsd: 18,
    dataGbPerDay: 0,
    scienceValue: 0,
  },

  // --- Communications ---
  {
    id: 'uhf-antenna',
    name: 'Low-Gain UHF Antenna',
    description: 'A simple antenna that sends very little data each day. Light and cheap, fine for instruments that make little data.',
    type: 'comms',
    massKg: 3, // simplified, generic UHF low-gain antenna
    powerW: 10,
    costMUsd: 2,
    dataGbPerDay: 0,
    downlinkGbPerDay: 1,
    scienceValue: 0,
  },
  {
    id: 'mga-antenna',
    name: 'Medium-Gain X-Band Antenna',
    description: 'A medium antenna that sends a fair amount of data. A good balance for most missions.',
    type: 'comms',
    massKg: 10, // simplified, generic X-band antenna
    powerW: 25,
    costMUsd: 6,
    dataGbPerDay: 0,
    downlinkGbPerDay: 20,
    scienceValue: 0,
  },
  {
    id: 'hga-antenna',
    name: 'High-Gain Antenna',
    description: 'A big dish antenna that sends a lot of data home. It costs more power, mass and money.',
    type: 'comms',
    massKg: 25, // simplified, inspired by the Ka-band antenna on LRO
    powerW: 40,
    costMUsd: 12,
    dataGbPerDay: 0,
    downlinkGbPerDay: 100,
    scienceValue: 0,
  },
];
