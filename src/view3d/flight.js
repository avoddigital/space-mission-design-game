// 3D scenes for the simulation: launch, transfer, operations and data return.
// Read-only: it shows the result of simulateMission. It never decides if the mission works.
// Scene units, not kilometers (CLAUDE.md, 3D layer).

import * as THREE from 'three';
import { buildSpacecraft } from './spacecraft.js';
import { createPlanet } from './planets.js';
import { activePhase, destinationOf, orbitRadius, rocketHeight } from './flightPlan.js';

const PLANET_RADIUS = { earth: 2, moon: 1.3, mars: 1.6 };

/** Simple ease: fast start, soft end. */
const easeOut = (value) => 1 - (1 - Math.min(1, Math.max(0, value))) ** 3;

function starfield() {
  const random = (() => {
    let value = 42;
    return () => ((value = (value * 1664525 + 1013904223) % 4294967296) / 4294967296);
  })();
  const positions = [];
  for (let index = 0; index < 400; index += 1) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    positions.push(60 * Math.sin(phi) * Math.cos(theta), 60 * Math.sin(phi) * Math.sin(theta), 60 * Math.cos(phi));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, sizeAttenuation: true }));
}

/**
 * @returns {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera, set: Function, update: Function, dispose: Function }}
 */
export function createFlight() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x0b1020, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(-6, 5, 8);
  scene.add(sun);
  const stars = starfield();
  scene.add(stars);
  const camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.1, 200);

  let content = null; // everything of the current phase
  let owned = []; // geometries and materials created for this phase (freed on change)
  let key = '';
  let time = 0;
  let play = null; // per-phase animation: (time, dt) => void

  const own = (...items) => {
    owned.push(...items);
    return items[0];
  };
  const meshOf = (geometry, material) => new THREE.Mesh(own(geometry), own(material));

  function clear() {
    if (content) scene.remove(content);
    owned.forEach((item) => item.dispose());
    owned = [];
    content = new THREE.Group();
    scene.add(content);
    time = 0;
  }

  function miniCraft(parts, scale) {
    const craft = buildSpacecraft(parts); // shared geometries: nothing to free
    craft.scale.setScalar(scale);
    return craft;
  }

  // --- Launch ---
  function buildLaunch({ rocket, failure }) {
    const earth = createPlanet('earth', 8);
    own(earth.geometry, earth.material);
    earth.position.set(0, -8.6, 0);
    earth.rotation.x = 1.1; // put the launch site on land and sea, not on the white pole
    content.add(earth);
    const pad = meshOf(new THREE.BoxGeometry(1.4, 0.12, 1.4), new THREE.MeshStandardMaterial({ color: 0x5b6475 }));
    pad.position.set(0, -0.56, 0);
    content.add(pad);
    camera.position.set(0, 1.2, 8.5);
    camera.lookAt(0, 1.2, 0);

    const alarm = meshOf(new THREE.CylinderGeometry(1.1, 1.1, 0.02, 32), new THREE.MeshBasicMaterial({ color: 0xeb5757, transparent: true, opacity: 0 }));
    alarm.position.set(0, -0.48, 0);
    content.add(alarm);

    let body = null;
    const smoke = [];
    if (rocket) {
      const height = rocketHeight(rocket);
      const width = 0.12 + height * 0.05;
      body = new THREE.Group();
      const tube = meshOf(new THREE.CylinderGeometry(width, width, height * 0.75, 20), new THREE.MeshStandardMaterial({ color: 0xf2f4f7, metalness: 0.2, roughness: 0.5 }));
      tube.position.y = height * 0.375;
      const nose = meshOf(new THREE.ConeGeometry(width, height * 0.25, 20), new THREE.MeshStandardMaterial({ color: 0x2d9cdb }));
      nose.position.y = height * 0.875;
      body.add(tube, nose);
      const finGeometry = own(new THREE.BoxGeometry(0.03, height * 0.18, width * 1.6));
      const finMaterial = own(new THREE.MeshStandardMaterial({ color: 0x2a2f38 }));
      for (let index = 0; index < 3; index += 1) {
        const fin = new THREE.Mesh(finGeometry, finMaterial);
        const angle = (index / 3) * Math.PI * 2;
        fin.position.set(Math.cos(angle) * width, height * 0.09, Math.sin(angle) * width);
        fin.rotation.y = -angle;
        body.add(fin);
      }
      const flame = meshOf(new THREE.ConeGeometry(width * 0.8, height * 0.3, 16), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
      flame.rotation.x = Math.PI;
      flame.position.y = -height * 0.15;
      flame.visible = false;
      body.add(flame);
      body.userData.flame = flame;
      body.position.y = -0.5;
      content.add(body);

      const smokeGeometry = own(new THREE.SphereGeometry(0.18, 8, 6));
      const smokeMaterial = own(new THREE.MeshStandardMaterial({ color: 0xd6dbe3, roughness: 1 }));
      for (let index = 0; index < 40; index += 1) {
        const puff = new THREE.Mesh(smokeGeometry, smokeMaterial);
        puff.visible = false;
        content.add(puff);
        smoke.push({ mesh: puff, age: 0, velocity: new THREE.Vector3() });
      }
    }

    const blast = meshOf(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: 0xff7b2e, transparent: true, opacity: 0 }));
    blast.visible = false;
    content.add(blast);

    let nextPuff = 0;
    play = (t, dt) => {
      if (!body || failure === 'grounded') {
        alarm.material.opacity = failure === 'grounded' ? 0.35 + 0.35 * Math.sin(t * 10) : 0;
        return;
      }
      const exploding = failure === 'explode';
      const boomAt = 0.8;
      if (!exploding || t < boomAt) {
        body.position.y = -0.5 + (exploding ? 1.4 : 2.4) * t * t;
        if (exploding) body.rotation.z = t * 0.6;
        body.userData.flame.visible = true;
        body.userData.flame.scale.y = 0.8 + 0.3 * Math.sin(t * 40);
        camera.position.y = 1.2 + Math.max(0, body.position.y - 1.5) * 0.8;
        camera.lookAt(0, camera.position.y, 0);
        // Smoke trail
        if (t > nextPuff) {
          nextPuff = t + 0.04;
          const puff = smoke.find((item) => !item.mesh.visible);
          if (puff) {
            puff.mesh.visible = true;
            puff.age = 0;
            puff.mesh.position.copy(body.position);
            puff.velocity.set((Math.random() - 0.5) * 0.8, -0.4, (Math.random() - 0.5) * 0.8);
          }
        }
      } else {
        body.visible = false;
        blast.visible = true;
        blast.position.copy(body.position).add(new THREE.Vector3(0, 0.6, 0));
        const age = t - boomAt;
        blast.scale.setScalar(Math.min(1.8, 0.2 + age * 3));
        blast.material.opacity = Math.max(0, 1 - age / 2.2); // long enough for the player to see it
        alarm.material.opacity = 0.3 + 0.3 * Math.sin(t * 10);
      }
      for (const puff of smoke) {
        if (!puff.mesh.visible) continue;
        puff.age += dt;
        puff.mesh.position.addScaledVector(puff.velocity, dt);
        puff.mesh.scale.setScalar(Math.max(0.01, 1 + puff.age * 2 - puff.age * puff.age * 2.5));
        if (puff.age > 1.2) puff.mesh.visible = false;
      }
    };
  }

  // --- Transfer ---
  function buildTransfer({ parts, orbit, failure }) {
    const destination = destinationOf(orbit);
    camera.position.set(0, 1, 10);
    camera.lookAt(0, 0.4, 0);
    let start;
    let end;
    let control;
    if (destination === 'earth') {
      // Staying near Earth: rise from the surface to the orbit.
      const earth = createPlanet('earth', 1.8);
      own(earth.geometry, earth.material);
      content.add(earth);
      start = new THREE.Vector3(0, 1.85, 0);
      const radius = orbitRadius(1.8, orbit?.altitudeKm);
      end = new THREE.Vector3(radius, 0.3, 0);
      control = new THREE.Vector3(radius * 0.6, radius + 0.6, 0);
    } else {
      const earth = createPlanet('earth', 1);
      own(earth.geometry, earth.material);
      earth.position.set(-4.5, -0.6, 0);
      const target = createPlanet(destination, destination === 'moon' ? 0.55 : 0.75);
      own(target.geometry, target.material);
      target.position.set(4.5, 0.6, 0);
      content.add(earth, target);
      start = new THREE.Vector3(-3.4, -0.3, 0);
      end = new THREE.Vector3(3.7, 0.6, 0);
      control = new THREE.Vector3(0, 3.6, 0);
    }
    if (failure === 'off-course') end = end.clone().add(new THREE.Vector3(1.8, 2.6, 0)); // misses the target

    const curve = new THREE.QuadraticBezierCurve3(start, control, end);
    const points = curve.getPoints(80);
    const trail = new THREE.Line(own(new THREE.BufferGeometry().setFromPoints(points)), own(new THREE.LineBasicMaterial({ color: failure ? 0xeb5757 : 0x56ccf2 })));
    trail.geometry.setDrawRange(0, 0);
    content.add(trail);
    const craft = miniCraft(parts, 0.13);
    content.add(craft);

    play = (t) => {
      const progress = easeOut(t / 1.3);
      craft.position.copy(curve.getPoint(progress));
      craft.rotation.y = t;
      trail.geometry.setDrawRange(0, Math.floor(progress * points.length));
    };
  }

  // --- Operations and data return ---
  function buildOrbit({ parts, orbit, phaseId, failure }) {
    const destination = destinationOf(orbit);
    const radius = PLANET_RADIUS[destination];
    const planet = createPlanet(destination, radius);
    own(planet.geometry, planet.material);
    content.add(planet);
    camera.position.set(0, 3.2, 9);
    camera.lookAt(0, 0, 0);

    const ringRadius = orbitRadius(radius, orbit?.altitudeKm);
    const plane = new THREE.Group();
    plane.rotation.x = Math.PI / 2 - 0.8; // tilted so the orbit reads as an ellipse
    content.add(plane);
    const ring = meshOf(new THREE.TorusGeometry(ringRadius, 0.012, 6, 120), new THREE.MeshBasicMaterial({ color: 0x56ccf2, transparent: true, opacity: 0.55 }));
    plane.add(ring);
    const craft = miniCraft(parts, 0.17);
    plane.add(craft);

    const warning = meshOf(new THREE.SphereGeometry(0.36, 16, 10), new THREE.MeshBasicMaterial({ color: 0xff4d4d, transparent: true, opacity: 0.7 }));
    warning.visible = false;
    plane.add(warning);

    // Where the data goes: a ground station on Earth, or a small Earth far away.
    const home = new THREE.Vector3();
    if (destination === 'earth') {
      home.set(-0.9, 1.4, 1.2).normalize().multiplyScalar(radius);
    } else {
      const earth = createPlanet('earth', 0.35);
      own(earth.geometry, earth.material);
      earth.position.set(-4.6, 2.3, 0);
      content.add(earth);
      home.copy(earth.position);
    }

    const pulses = [];
    if (phaseId === 'data') {
      const pulseGeometry = own(new THREE.SphereGeometry(0.07, 8, 6));
      const pulseMaterial = own(new THREE.MeshBasicMaterial({ color: 0x56ccf2 }));
      for (let index = 0; index < 14; index += 1) {
        const mesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
        mesh.visible = false;
        content.add(mesh);
        pulses.push({ mesh, age: 0, from: new THREE.Vector3() });
      }
    }

    let angle = 0;
    let nextPulse = 0;
    const craftWorld = new THREE.Vector3();
    play = (t, dt) => {
      planet.rotation.y += dt * 0.15;
      const blackout = failure === 'blackout';
      const speed = blackout ? Math.max(0, 0.9 - t * 0.9) : 0.9;
      angle += dt * speed;
      craft.position.set(Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius, 0);
      craft.rotation.z = angle;
      if (blackout) {
        // Always visible red glow that pulses: the spacecraft lost power.
        warning.visible = true;
        warning.material.opacity = 0.6 + 0.25 * Math.sin(t * 8); // never fades out completely
        warning.position.copy(craft.position);
      }
      if (phaseId !== 'data') return;
      const weak = failure === 'no-signal';
      if (t > nextPulse) {
        nextPulse = t + (weak ? 0.6 : 0.22);
        const pulse = pulses.find((item) => !item.mesh.visible);
        if (pulse) {
          craft.getWorldPosition(craftWorld);
          pulse.from.copy(craftWorld);
          pulse.age = 0;
          pulse.mesh.visible = true;
        }
      }
      for (const pulse of pulses) {
        if (!pulse.mesh.visible) continue;
        pulse.age += dt;
        const progress = pulse.age / 0.9;
        pulse.mesh.position.lerpVectors(pulse.from, home, progress);
        // With no antenna or too little science, the signal fades before reaching Earth.
        if (progress >= 1 || (weak && progress > 0.45)) pulse.mesh.visible = false;
      }
    };
  }

  return {
    scene,
    camera,

    /**
     * Show the phase the HTML timeline is on.
     * @param {{ simulation: object, parts: object[], rocket?: object, orbit?: object, shown: number }} params
     */
    set({ simulation, parts = [], rocket = null, orbit = null, shown = 0 }) {
      const phase = activePhase(simulation, shown);
      const nextKey = `${simulation.seed}|${parts.map((part) => part.id).join(',')}|${phase.id}|${phase.failure}`;
      if (nextKey === key) return;
      key = nextKey;
      clear();
      const params = { parts, rocket, orbit, phaseId: phase.id, failure: phase.failure };
      if (phase.id === 'launch') buildLaunch(params);
      else if (phase.id === 'transfer') buildTransfer(params);
      else buildOrbit(params);
    },

    update(dt) {
      time += dt;
      stars.rotation.y += dt * 0.01;
      play?.(time, dt);
    },

    dispose() {
      clear();
      scene.remove(content);
      stars.geometry.dispose();
      stars.material.dispose();
      key = '';
    },
  };
}
