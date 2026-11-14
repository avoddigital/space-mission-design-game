// Simplified values, inspired by real missions. Not exact.
// Mass and power are rounded approximations of the reference instruments.
// costMUsd and scienceValue are game values, not real-world figures.
export const parts = [
  // --- Instruments ---
  {
    id: 'hd-camera',
    name: 'High-Resolution Camera',
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
    type: 'comms',
    massKg: 25, // simplified, inspired by the Ka-band antenna on LRO
    powerW: 40,
    costMUsd: 12,
    dataGbPerDay: 0,
    downlinkGbPerDay: 100,
    scienceValue: 0,
  },
];
