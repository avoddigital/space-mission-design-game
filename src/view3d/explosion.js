// Rocket explosion for a failed launch, made in code (no image or model files).
// Layers, in order: a white flash, a shock ring, orange fireballs, falling debris and a dark smoke
// cloud that keeps rising after the fire is gone. Read-only: it only draws what the result says.

import * as THREE from 'three';

/** Small seeded generator, so the explosion looks the same every replay of the same result. */
function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

/** Soft round glow for the flash (white center, orange edge). */
function glowTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,245,1)');
  gradient.addColorStop(0.3, 'rgba(255,214,120,0.9)');
  gradient.addColorStop(0.7, 'rgba(255,120,40,0.35)');
  gradient.addColorStop(1, 'rgba(255,90,20,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

const easeOut = (value) => 1 - (1 - Math.min(1, Math.max(0, value))) ** 3;

/**
 * @param {{ size?: number, groundY?: number, debrisMaterials?: THREE.Material[], seed?: number }} [options]
 *   size: about the rocket's height; groundY: where debris stops falling
 * @returns {{ group: THREE.Group, start: (position: THREE.Vector3) => void, update: (dt: number) => number, disposables: object[] }}
 *   update returns how much the camera should shake (0 when calm)
 */
export function createExplosion({ size = 2.5, groundY = -1, debrisMaterials = [], seed = 7 } = {}) {
  const random = seeded(seed);
  const disposables = [];
  const own = (item) => {
    if (item) disposables.push(item);
    return item;
  };
  const group = new THREE.Group();
  group.visible = false;
  const scale = size / 2.5;

  const sphere = own(new THREE.SphereGeometry(1, 20, 14));
  const box = own(new THREE.BoxGeometry(1, 1, 1));

  // Flash: a camera-facing glow that swells and fades in a fraction of a second
  const flash = new THREE.Sprite(own(new THREE.SpriteMaterial({ map: own(glowTexture()), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })));
  group.add(flash);

  // Shock ring: a thin bright ring that races outward
  const ring = new THREE.Mesh(own(new THREE.RingGeometry(0.92, 1, 64)), own(new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })));
  group.add(ring);

  // Fireballs: hot yellow inside, deep orange outside, each one a little off center.
  // Normal blending (not additive), so they stay orange against a bright daytime sky.
  const lumpy = own(new THREE.IcosahedronGeometry(1, 1)); // a little faceted, reads as billowing fire and smoke
  const fireColors = [0xfff3c4, 0xffd36b, 0xffb347, 0xff9a3a, 0xff7b2e, 0xf2621f, 0xe0461a, 0xffc04d, 0xff8a2a];
  const fireballs = fireColors.map((color, index) => {
    const mesh = new THREE.Mesh(lumpy, own(new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false })));
    const direction = new THREE.Vector3(random() - 0.5, random() * 0.8 - 0.2, random() - 0.5).normalize();
    mesh.rotation.set(random() * 3, random() * 3, random() * 3);
    group.add(mesh);
    return { mesh, direction, delay: index * 0.03, reach: (0.15 + random() * 0.35) * scale, size: (0.28 + random() * 0.3) * scale };
  });

  // Smoke: many small dark puffs that appear as the fire dies, billow up and spread, then hang in the air
  const smokeColors = [0x2e2b29, 0x3b3735, 0x4a4542, 0x5a5552];
  const smoke = Array.from({ length: 24 }, (_, index) => {
    const material = own(new THREE.MeshStandardMaterial({ color: smokeColors[index % smokeColors.length], roughness: 1, flatShading: true, transparent: true, envMapIntensity: 0 }));
    const mesh = new THREE.Mesh(lumpy, material);
    mesh.rotation.set(random() * 3, random() * 3, random() * 3);
    group.add(mesh);
    const offset = new THREE.Vector3((random() - 0.5) * 1.3, (random() - 0.3) * 0.6, (random() - 0.5) * 1.0).multiplyScalar(scale);
    return { mesh, offset, delay: 0.3 + random() * 0.45, size: (0.2 + random() * 0.22) * scale, rise: 0.25 + random() * 0.35 };
  });

  // Debris: pieces of the rocket thrown out, falling and tumbling, coming to rest on the ground
  const pieces = debrisMaterials.length ? debrisMaterials : [own(new THREE.MeshStandardMaterial({ color: 0xdddddd }))];
  const debris = Array.from({ length: 22 }, (_, index) => {
    const mesh = new THREE.Mesh(box, pieces[index % pieces.length]);
    mesh.scale.set((0.04 + random() * 0.12) * scale, (0.02 + random() * 0.06) * scale, (0.04 + random() * 0.1) * scale);
    group.add(mesh);
    const speed = (2.2 + random() * 3.2) * scale;
    const angle = random() * Math.PI * 2;
    const lift = random() * 0.9 + 0.2;
    return {
      mesh,
      velocity: new THREE.Vector3(Math.cos(angle) * speed, lift * speed, Math.sin(angle) * speed * 0.6),
      spin: new THREE.Vector3(random() * 12 - 6, random() * 12 - 6, random() * 12 - 6),
      trail: index % 4 === 0, // some pieces still burn as they fall
    };
  });
  const ember = own(new THREE.MeshBasicMaterial({ color: 0xffa040 }));

  // Light: the blast lights up the pad and the tower for a moment
  const light = new THREE.PointLight(0xff8a3a, 0, 18 * scale, 1.6);
  group.add(light);

  let age = -1;
  const center = new THREE.Vector3();

  return {
    group,
    disposables,

    /** Set off the explosion at this point (scene coordinates). */
    start(position) {
      center.copy(position);
      group.visible = true;
      age = 0;
      flash.position.copy(center);
      ring.position.copy(center);
      light.position.copy(center);
      fireballs.forEach((ball) => ball.mesh.position.copy(center));
      smoke.forEach((puff) => {
        puff.mesh.position.copy(center).add(puff.offset);
        puff.mesh.visible = false;
      });
      debris.forEach((piece) => {
        piece.mesh.position.copy(center);
        piece.mesh.visible = true;
        if (piece.trail) piece.mesh.material = ember;
      });
    },

    /** Advance by dt seconds. Returns the camera shake strength. */
    update(dt, camera) {
      if (age < 0) return 0;
      age += dt;

      const flashLife = 0.35;
      flash.visible = age < flashLife;
      flash.scale.setScalar((0.6 + easeOut(age / 0.18) * 4) * scale);
      flash.material.opacity = Math.max(0, 1 - age / flashLife);

      ring.visible = age < 0.45;
      if (camera) ring.quaternion.copy(camera.quaternion); // always face the camera
      ring.scale.setScalar((0.2 + easeOut(age / 0.45) * 1.6) * scale);
      ring.material.opacity = Math.max(0, 0.45 * (1 - age / 0.45));

      light.intensity = Math.max(0, 60 * (1 - age / 0.9));

      for (const ball of fireballs) {
        const local = age - ball.delay;
        ball.mesh.visible = local > 0 && local < 1.6;
        if (!ball.mesh.visible) continue;
        const grow = easeOut(local / 0.55);
        ball.mesh.position.copy(center).addScaledVector(ball.direction, ball.reach * grow).add(new THREE.Vector3(0, local * 0.35 * scale, 0));
        ball.mesh.scale.setScalar(ball.size * (0.2 + grow));
        ball.mesh.material.opacity = Math.max(0, 0.95 * (1 - Math.max(0, local - 0.35) / 1.2));
      }

      for (const puff of smoke) {
        const local = age - puff.delay;
        puff.mesh.visible = local > 0;
        if (!puff.mesh.visible) continue;
        // Billows out fast, then only drifts up and spreads a little; thins out but hangs in the air
        puff.mesh.scale.setScalar(puff.size * (0.4 + easeOut(local / 1.4) * 1.3));
        puff.mesh.position.y += puff.rise * dt * scale * Math.max(0.25, 1 - local * 0.2);
        puff.mesh.position.addScaledVector(puff.offset, dt * 0.35); // spreads sideways as it rises
        puff.mesh.material.opacity = Math.max(0.35, 0.95 - local * 0.15);
      }

      for (const piece of debris) {
        if (!piece.mesh.visible) continue;
        if (piece.mesh.position.y <= groundY) continue; // resting on the ground
        piece.velocity.y -= 7 * scale * dt; // gravity
        piece.velocity.multiplyScalar(1 - 0.4 * dt); // air drag
        piece.mesh.position.addScaledVector(piece.velocity, dt);
        piece.mesh.rotation.x += piece.spin.x * dt;
        piece.mesh.rotation.y += piece.spin.y * dt;
        piece.mesh.rotation.z += piece.spin.z * dt;
        if (piece.mesh.position.y <= groundY) {
          piece.mesh.position.y = groundY;
          if (piece.trail) piece.mesh.visible = age < 2.5; // embers burn out
        }
      }

      return Math.max(0, 1 - age / 0.6); // strong shake at the blast, gone after 0.6 s
    },
  };
}
