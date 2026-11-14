// 3D scenes for the simulation: launch, transfer, operations and data return.
// Read-only: it shows the result of simulateMission. It never decides if the mission works.
// Scene units, not kilometers (CLAUDE.md, 3D layer).

import * as THREE from 'three';
import { buildSpacecraft } from './spacecraft.js';
import { createPlanet } from './planets.js';
import { activePhase, destinationOf, failureLook, orbitRadius } from './flightPlan.js';
import { createRocket } from './rocket.js';
import { createLaunchPad } from './launchPad.js';
import { createExplosion } from './explosion.js';
import { createEventEffects } from './eventEffects.js';

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
 * Daytime sky for the launch: light blue at the horizon, deeper blue overhead, fading to black
 * (uniform `space` from 0 to 1) as the rocket climbs out of the air. It always surrounds the camera.
 */
function skyDome() {
  const material = new THREE.ShaderMaterial({
    uniforms: { space: { value: 0 } },
    vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform float space;
      varying vec3 vDirection;
      void main() {
        float up = clamp(vDirection.y, 0.0, 1.0);
        vec3 horizon = vec3(0.78, 0.89, 0.98);
        vec3 zenith = vec3(0.18, 0.45, 0.85);
        vec3 day = mix(horizon, zenith, smoothstep(0.0, 0.55, up));
        gl_FragColor = vec4(mix(day, vec3(0.0), space), 1.0 - space);
      }`,
    side: THREE.BackSide,
    depthWrite: false,
    transparent: true,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), material);
  dome.renderOrder = -1; // drawn first, behind everything
  return dome;
}

/** Smooth 0 to 1 between two values. */
const smoothstep = (from, to, value) => {
  const x = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return x * x * (3 - 2 * x);
};

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
  stars.material.transparent = true;
  scene.add(stars);
  const sky = skyDome();
  sky.visible = false;
  scene.add(sky);
  const camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.1, 400);

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
    // Back to plain space: the launch scene turns the sky on and moves the stars with the camera
    sky.visible = false;
    stars.position.set(0, 0, 0);
    stars.material.opacity = 1;
    camera.near = 0.1;
    camera.far = 400;
    camera.updateProjectionMatrix();
    sun.intensity = 2.4; // an eclipse effect may have dimmed it
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
    // The launch starts on the ground, under a blue sky. The Earth is far bigger than the rocket
    // (still not to scale, but enough to feel right): as the camera pulls back into space,
    // the rocket shrinks to a bright point with a white trail, and the curve of the Earth appears.
    // The next scene (the small globe with the orbit) follows from there. Scene units, not kilometers.
    const earthRadius = 400;
    const earth = createPlanet('earth', earthRadius, 192);
    own(earth.geometry, earth.material);
    earth.rotation.x = 1.1; // put the launch site on land and sea, not on the white pole
    content.add(earth);
    // The glow of the air is a shell around the planet: shown only once the camera is outside it
    const air = earth.children.filter((layer) => layer.material?.isShaderMaterial);
    air.forEach((layer) => (layer.visible = false));
    sky.visible = true;
    sky.material.uniforms.space.value = 0;
    stars.material.opacity = 0;
    camera.far = 4000;
    camera.updateProjectionMatrix();
    // A little from the side, so the rocket, the tower and the arms read as 3D
    const startCamera = new THREE.Vector3(1.4, 1.1, 6.6);
    const startTarget = new THREE.Vector3(0, 1.0, 0);
    camera.position.copy(startCamera);
    camera.lookAt(startTarget);
    const placeCamera = () => {
      sky.position.copy(camera.position);
      stars.position.copy(camera.position);
    };
    placeCamera();

    // With no rocket picked, the pad still stands there (sized for a medium rocket), empty.
    const body = rocket ? createRocket(rocket) : null;
    body?.userData.disposables.forEach((item) => own(item));
    const sizes = body?.userData ?? { height: 2.6, radius: 0.19, width: 0.25 };
    const pad = createLaunchPad(sizes, { planetRadius: earthRadius });
    pad.userData.disposables.forEach((item) => own(item));
    pad.position.y = -0.5; // the rocket's base stands at y = -0.5
    content.add(pad);
    earth.position.set(0, -0.5 + pad.userData.ground - earthRadius, 0); // the pad's ground touches the top of the Earth

    // Seen from far away, the rocket is a bright point (it keeps the same size on screen) with a white trail.
    let spark = null;
    let trail = null;
    if (body) {
      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = glowCanvas.height = 64;
      const glowContext = glowCanvas.getContext('2d');
      const gradient = glowContext.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255,250,230,1)');
      gradient.addColorStop(0.25, 'rgba(255,190,90,0.9)');
      gradient.addColorStop(1, 'rgba(255,120,30,0)');
      glowContext.fillStyle = gradient;
      glowContext.fillRect(0, 0, 64, 64);
      const glowTexture = own(new THREE.CanvasTexture(glowCanvas));
      spark = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: glowTexture, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0, sizeAttenuation: false })));
      spark.scale.setScalar(0.03);
      spark.position.y = -0.2;
      body.add(spark);
      const points = new Float32Array(3 * 400);
      const trailGeometry = own(new THREE.BufferGeometry());
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
      trailGeometry.setDrawRange(0, 0);
      trail = new THREE.Line(trailGeometry, own(new THREE.LineBasicMaterial({ color: 0xf4f1ea, transparent: true, opacity: 0.75 })));
      trail.frustumCulled = false;
      trail.userData.count = 0;
      content.add(trail);
    }

    const alarm = meshOf(new THREE.CylinderGeometry(1.1, 1.1, 0.02, 32), new THREE.MeshBasicMaterial({ color: 0xb5533a, transparent: true, opacity: 0 }));
    alarm.position.set(0, -0.5 + pad.userData.ground + 0.02, 0);
    content.add(alarm);

    const smoke = [];
    if (body) {
      body.position.y = -0.5;
      content.add(body);

      const smokeGeometry = own(new THREE.SphereGeometry(0.18, 8, 6));
      const smokeMaterial = own(new THREE.MeshStandardMaterial({ color: 0xd6dbe3, roughness: 1 }));
      for (let index = 0; index < 130; index += 1) {
        const puff = new THREE.Mesh(smokeGeometry, smokeMaterial);
        puff.visible = false;
        content.add(puff);
        smoke.push({ mesh: puff, age: 0, velocity: new THREE.Vector3() });
      }
    }

    // Failed launch: everything is known from the start, so the scene plays once, without jumping back.
    const groundY = -0.5 + pad.userData.ground;
    const explosion = failure === 'explode' && body
      ? createExplosion({
        size: body.userData.height,
        groundY: groundY + 0.02,
        debrisMaterials: body.userData.disposables.filter((item) => item.isMeshStandardMaterial).slice(0, 4),
        seed: Math.round(body.userData.height * 1000),
      })
      : null;
    if (explosion) {
      explosion.disposables.forEach((item) => own(item));
      content.add(explosion.group);
    }

    const puffAt = (position, spread = 0.5, down = -0.3, grow = 2.2) => {
      const puff = smoke.find((item) => !item.mesh.visible);
      if (!puff) return;
      puff.mesh.visible = true;
      puff.age = 0;
      puff.grow = grow;
      puff.mesh.position.copy(position);
      puff.velocity.set((Math.random() - 0.5) * spread, down, (Math.random() - 0.5) * spread);
    };
    const flameOn = (t, strength = 1) => {
      const flicker = 0.85 + 0.15 * Math.sin(t * 40) + 0.08 * Math.sin(t * 73);
      body.userData.flame.visible = strength > 0;
      body.userData.flame.scale.set(1, flicker * strength, 1);
      body.userData.flame.userData.glow.intensity = 6 * flicker * strength;
    };
    const closeCamera = (shake = 0) => {
      // Stays near the pad, rising a little with the rocket, shaking at the blast
      const lift = body ? Math.min(3.5, Math.max(0, body.position.y - 1.5) * 0.8) : 0;
      camera.position.set(startCamera.x, startCamera.y + lift, startCamera.z);
      camera.position.add(new THREE.Vector3((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0));
      camera.lookAt(startTarget.x, startTarget.y + lift - 0.1, startTarget.z);
      placeCamera();
    };

    const boomAt = 1.15; // the blast lands just before the timeline reveals the failure
    let boomed = false;
    let nextPuff = 0;
    const tip = new THREE.Vector3();
    play = (t, dt) => {
      pad.userData.beacon.visible = Math.sin(t * 5) > 0; // blinking warning light on top of the tower

      if (!body) {
        alarm.material.opacity = failure ? 0.35 + 0.35 * Math.sin(t * 10) : 0;
      } else if (failure === 'grounded') {
        // Launch scrubbed: the engines light, then shut down; the rocket never leaves the pad
        const burning = t > 0.25 && t < 0.85;
        flameOn(t, burning ? Math.min(1, (t - 0.25) * 4) * 0.7 : 0);
        if (burning && t > nextPuff) {
          nextPuff = t + 0.03;
          puffAt(body.position, 1.2, -0.1, 0.9);
        }
        alarm.material.opacity = t > 0.95 ? 0.35 + 0.35 * Math.sin(t * 10) : 0;
        closeCamera();
      } else if (failure === 'explode') {
        if (t < boomAt) {
          // Lifts off, struggles, wobbles and starts to tip over
          body.position.y = -0.5 + 1.1 * t * t;
          body.rotation.z = t * t * 0.35 + Math.sin(t * 11) * 0.04 * t;
          body.rotation.x = Math.sin(t * 7) * 0.03 * t;
          flameOn(t, Math.sin(t * 31) > -0.5 ? 0.6 + 0.4 * Math.random() : 0.15); // sputtering
          pad.userData.arms.forEach((arm, index) => (arm.rotation.y = -Math.min(1, t * 2.5) * (1.1 + index * 0.15)));
          if (t > nextPuff) {
            nextPuff = t + 0.06; // a struggling engine: thin, broken smoke
            puffAt(body.position, 0.3, -0.2, 0.8);
          }
          closeCamera();
        } else {
          if (!boomed) {
            boomed = true;
            // Blow up around the middle of the rocket
            tip.set(0, body.userData.height * 0.45, 0).applyEuler(body.rotation).add(body.position);
            body.visible = false;
            explosion.start(tip);
          }
          const shake = explosion.update(dt, camera);
          closeCamera(shake * 0.18);
          alarm.material.opacity = 0.3 + 0.3 * Math.sin(t * 10);
        }
      } else {
        // Success: slow liftoff, then fast acceleration and a gentle turn toward orbit (stops growing if the phase lingers)
        const climb = Math.min(t, 1.8);
        const altitude = 2.4 * climb * climb + 15 * climb ** 4;
        body.position.set(altitude * altitude * 0.004, -0.5 + altitude, 0);
        body.rotation.z = -Math.min(0.5, altitude * 0.01);
        // Trail: remember where the rocket has been
        const count = trail.userData.count;
        if (count < 400) {
          trail.geometry.attributes.position.setXYZ(count, body.position.x, body.position.y, body.position.z);
          trail.geometry.attributes.position.needsUpdate = true;
          trail.userData.count = count + 1;
          trail.geometry.setDrawRange(0, count + 1);
        }
        flameOn(t);
        // The swing arms pull back as the rocket rises
        pad.userData.arms.forEach((arm, index) => (arm.rotation.y = -Math.min(1, t * 2.5) * (1.1 + index * 0.15)));
        // Pull back into space: the distance grows smoothly from a few meters to very far,
        // the view turns from the rocket to the curve of the Earth, and the sky goes from blue to black.
        const away = smoothstep(0.2, 1.45, t);
        const endDirection = new THREE.Vector3(50, 110, 480).normalize();
        const direction = startCamera.clone().sub(startTarget).normalize().lerp(endDirection, away).normalize();
        const distance = 6.6 * (495 / 6.6) ** away;
        const lead = new THREE.Vector3(-6, 39, 0).multiplyScalar(away * away);
        const target = startTarget.clone().lerp(body.position.clone().add(new THREE.Vector3(0, 1, 0)), Math.min(1, t * 3)).add(lead);
        camera.position.copy(target).addScaledVector(direction, distance);
        camera.near = Math.max(0.1, distance * 0.01); // keeps the ground and the pad from flickering when far away
        camera.updateProjectionMatrix();
        camera.lookAt(target);
        const height = camera.position.distanceTo(earth.position) - earthRadius;
        const space = smoothstep(8, 160, height);
        sky.material.uniforms.space.value = space;
        stars.material.opacity = space;
        air.forEach((layer) => (layer.visible = height > earthRadius * 0.14));
        spark.material.opacity = smoothstep(0.25, 0.6, away);
        placeCamera();
        if (t > nextPuff) {
          nextPuff = t + 0.012; // dense enough to read as one trail even when the rocket is fast
          puffAt(body.position);
        }
      }

      for (const puff of smoke) {
        if (!puff.mesh.visible) continue;
        puff.age += dt;
        puff.mesh.position.addScaledVector(puff.velocity, dt);
        // Puffs swell as they spread, then shrink away at the end of their life
        const life = 2.2;
        puff.mesh.scale.setScalar(Math.max(0.01, (1 + puff.age * puff.grow) * Math.min(1, (life - puff.age) * 2)));
        if (puff.age > life) puff.mesh.visible = false;
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
    const trail = new THREE.Line(own(new THREE.BufferGeometry().setFromPoints(points)), own(new THREE.LineBasicMaterial({ color: failure ? 0xb5533a : 0x6fb3e8 })));
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
  function buildOrbit({ parts, orbit, phaseId, failure, events = [] }) {
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
    const ring = meshOf(new THREE.TorusGeometry(ringRadius, 0.012, 6, 120), new THREE.MeshBasicMaterial({ color: 0x6fb3e8, transparent: true, opacity: 0.55 }));
    plane.add(ring);
    const craft = miniCraft(parts, 0.17);
    plane.add(craft);

    const warning = meshOf(new THREE.SphereGeometry(0.36, 16, 10), new THREE.MeshBasicMaterial({ color: 0xb5533a, transparent: true, opacity: 0.7 }));
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
      const pulseMaterial = own(new THREE.MeshBasicMaterial({ color: 0x6fb3e8 }));
      for (let index = 0; index < 14; index += 1) {
        const mesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
        mesh.visible = false;
        content.add(mesh);
        pulses.push({ mesh, age: 0, from: new THREE.Vector3() });
      }
    }

    // The surprises of this flight, one short effect each, next to the event cards
    const effects = phaseId === 'data' && events.length && typeof document !== 'undefined'
      ? createEventEffects({
        events,
        destination,
        planet,
        planetRadius: radius,
        craftPosition: (target) => craft.getWorldPosition(target),
        home,
        sun,
        content,
      })
      : null;
    effects?.disposables.forEach((item) => own(item));

    let angle = 0;
    let nextPulse = 0;
    const craftWorld = new THREE.Vector3();
    play = (t, dt) => {
      planet.rotation.y += dt * 0.15;
      effects?.update(t, dt);
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
      const cut = effects?.signalBlocked() ?? false; // outage or Sun in the way: no data gets through
      if (t > nextPulse && !cut) {
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
        if (progress >= 1 || (weak && progress > 0.45) || (cut && progress > 0.5)) pulse.mesh.visible = false;
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
      // A failed launch is staged as one continuous scene (liftoff, trouble, blast), so it uses the
      // failure from the start; otherwise it would first fly away and then jump back to explode.
      const failure = phase.id === 'launch' ? failureLook(simulation.phases[phase.index]) : phase.failure;
      const nextKey = `${simulation.seed}|${parts.map((part) => part.id).join(',')}|${phase.id}|${failure}`;
      if (nextKey === key) return;
      key = nextKey;
      clear();
      const params = { parts, rocket, orbit, phaseId: phase.id, failure, events: simulation.events ?? [] };
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
      sky.geometry.dispose();
      sky.material.dispose();
      key = '';
    },
  };
}
