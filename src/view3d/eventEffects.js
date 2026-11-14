// A short 3D effect for each surprise of the flight (src/data/events.js), played in the data return
// scene, next to the event cards. Each effect has two endings: green when the margin protected the
// spacecraft, amber/red when the event hurt it. Made in code (no image files).
// Read-only: it only shows what simulateMission already decided.

import * as THREE from 'three';

const SLOT = 2.4; // seconds for each event
const GAP = 1.2; // pause before the sequence plays again

const SAFE_COLOR = '#5fd38d';
const HURT_COLOR = '#ffb347';

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const easeOut = (value) => 1 - (1 - clamp01(value)) ** 3;
/** 0 → 1 → 0 over a slot: in at `from`, out at `to`. */
const window01 = (t, from, to, fade = 0.25) => clamp01((t - from) / fade) * clamp01((to - t) / fade);

/** A camera-facing picture drawn on a small canvas. */
function spriteFrom(draw, size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 });
  return new THREE.Sprite(material);
}

function glow(context, size, inner, outer) {
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.35, outer);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
}

/** Round badge with a symbol: what the event touched (time, money, mass). */
function badge(symbol, color) {
  return spriteFrom((context, size) => {
    const c = size / 2;
    context.fillStyle = 'rgba(14,16,18,0.85)';
    context.beginPath();
    context.arc(c, c, c - 6, 0, Math.PI * 2);
    context.fill();
    context.lineWidth = 6;
    context.strokeStyle = color;
    context.stroke();
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 7;
    context.lineCap = 'round';
    if (symbol === 'clock') {
      context.beginPath();
      context.arc(c, c, c * 0.5, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(c, c);
      context.lineTo(c, c - c * 0.36);
      context.moveTo(c, c);
      context.lineTo(c + c * 0.26, c + c * 0.1);
      context.stroke();
    } else {
      context.font = `bold ${symbol === 'kg' ? size * 0.34 : size * 0.5}px sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(symbol === 'kg' ? 'kg' : '$', c, c + 3);
      if (symbol === 'kg') {
        context.lineWidth = 5;
        context.beginPath();
        context.arc(c, c * 0.42, c * 0.12, 0, Math.PI * 2);
        context.stroke();
      }
    }
  });
}

/** A tick (protected) or a warning sign (hurt), shown at the end of each effect. */
function verdict(safe) {
  return spriteFrom((context, size) => {
    const c = size / 2;
    const color = safe ? SAFE_COLOR : HURT_COLOR;
    glow(context, size, safe ? 'rgba(95,211,141,0.55)' : 'rgba(255,140,60,0.55)', 'rgba(0,0,0,0.0)');
    context.strokeStyle = color;
    context.lineWidth = 9;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    if (safe) {
      context.moveTo(c - 20, c + 2);
      context.lineTo(c - 4, c + 18);
      context.lineTo(c + 24, c - 16);
    } else {
      context.moveTo(c, c - 24);
      context.lineTo(c, c + 6);
      context.moveTo(c, c + 22);
      context.lineTo(c, c + 23);
    }
    context.stroke();
  });
}

/**
 * @param {{
 *   events: Array<{ id: string, harmed: boolean }>,
 *   destination: 'earth'|'moon'|'mars',
 *   planet: THREE.Mesh, planetRadius: number,
 *   craftPosition: (target: THREE.Vector3) => THREE.Vector3,
 *   home: THREE.Vector3, sun: THREE.DirectionalLight, content: THREE.Group,
 * }} options
 * @returns {{ update: (t: number, dt: number) => void, signalBlocked: () => boolean, disposables: object[] }}
 */
export function createEventEffects({ events, destination, planet, planetRadius, craftPosition, home, sun, content }) {
  const disposables = [];
  const own = (item) => {
    if (item?.material) {
      disposables.push(...[item.material, item.material.map].filter(Boolean));
      if (item.geometry && !item.isSprite) disposables.push(item.geometry); // sprites share one built-in quad
    }
    content.add(item);
    return item;
  };
  const sunIntensity = sun.intensity;
  const craft = new THREE.Vector3();
  let blocked = false;

  const effects = events.map((event) => {
    const safe = !event.harmed;
    const end = own(verdict(safe));
    end.scale.setScalar(0.7);
    const showVerdict = (t) => {
      // The verdict pops at the craft for the last part of the slot
      craftPosition(craft);
      end.position.copy(craft).add(new THREE.Vector3(0, 0.7, 0));
      const local = t - 1.5;
      end.material.opacity = window01(t, 1.5, SLOT - 0.05, 0.2);
      end.scale.setScalar(0.8 + 0.4 * easeOut(local / 0.3));
    };

    switch (event.id) {
      case 'solar-storm': {
        // A burst of particles streams from the Sun and hits the spacecraft
        const star = own(spriteFrom((context, size) => glow(context, size, 'rgba(255,250,220,1)', 'rgba(255,190,80,0.6)')));
        star.position.set(-8, 4.5, -4);
        star.scale.setScalar(3);
        const particles = Array.from({ length: 36 }, (_, index) => {
          const particle = own(spriteFrom((context, size) => glow(context, size, 'rgba(255,240,180,1)', 'rgba(255,150,60,0.7)'), 32));
          particle.scale.setScalar(0.35);
          return { particle, delay: (index / 36) * 0.9, wobble: new THREE.Vector3(Math.sin(index * 7.3), Math.cos(index * 3.1), Math.sin(index * 1.7)).multiplyScalar(0.35) };
        });
        const shield = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 16), new THREE.MeshBasicMaterial({ color: safe ? 0x6fd3ff : 0xff6a3a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        own(shield);
        return {
          update(t) {
            star.material.opacity = window01(t, 0, 1.9, 0.3);
            craftPosition(craft);
            for (const { particle, delay, wobble } of particles) {
              const travel = (t - delay) / 0.8;
              particle.material.opacity = travel > 0 && travel < 1 ? 0.9 : 0;
              particle.position.lerpVectors(star.position, craft, clamp01(travel)).addScaledVector(wobble, Math.sin(clamp01(travel) * Math.PI));
            }
            // Protected: a blue glow absorbs the hits. Hurt: the craft flashes red.
            shield.position.copy(craft);
            shield.material.opacity = window01(t, 0.8, 1.8, 0.15) * (safe ? 0.35 : 0.3 + 0.3 * Math.abs(Math.sin(t * 22)));
            showVerdict(t);
          },
        };
      }
      case 'lunar-eclipse': {
        // Earth's shadow sweeps over the Moon: the sunlight fades, then comes back
        const shadow = new THREE.Mesh(new THREE.SphereGeometry(planetRadius * 1.6, 32, 16), new THREE.MeshBasicMaterial({ color: 0x05070a, transparent: true, opacity: 0, depthWrite: false }));
        own(shadow);
        return {
          update(t) {
            const dark = window01(t, 0.1, 1.8, 0.5);
            sun.intensity = sunIntensity * (1 - 0.85 * dark);
            shadow.position.set(THREE.MathUtils.lerp(-6, 6, clamp01(t / 1.9)), 0, -2.5); // passes behind the Moon
            shadow.material.opacity = 0.45 * dark;
            showVerdict(t);
          },
          stop() {
            sun.intensity = sunIntensity;
          },
        };
      }
      case 'mars-dust-storm': {
        // A dust storm spreads over Mars until the surface is hidden, then settles
        const dust = new THREE.Mesh(new THREE.SphereGeometry(planetRadius * 1.035, 40, 24), new THREE.MeshStandardMaterial({ color: 0xc98a55, transparent: true, opacity: 0, roughness: 1, envMapIntensity: 0, depthWrite: false }));
        own(dust);
        return {
          update(t) {
            dust.position.copy(planet.position);
            dust.rotation.y = t * 0.6;
            dust.material.opacity = 0.8 * window01(t, 0.1, 2.0, 0.6);
            dust.scale.setScalar(1 + 0.04 * Math.sin(t * 3));
            showVerdict(t);
          },
        };
      }
      case 'ground-station-outage':
      case 'solar-conjunction': {
        // Outage: the station on Earth blinks red. Conjunction: the Sun moves between the spacecraft and Earth.
        // Either way the data stops reaching home for a while; with enough margin it catches up after.
        const conjunction = event.id === 'solar-conjunction';
        const marker = own(spriteFrom((context, size) => glow(context, size, conjunction ? 'rgba(255,250,220,1)' : 'rgba(255,90,60,1)', conjunction ? 'rgba(255,190,80,0.6)' : 'rgba(255,60,40,0.5)')));
        return {
          update(t) {
            craftPosition(craft);
            if (conjunction) {
              const middle = craft.clone().lerp(home, 0.55);
              marker.position.copy(middle).add(new THREE.Vector3(0, THREE.MathUtils.lerp(3, -3, clamp01(t / 1.8)), 0));
              marker.scale.setScalar(2.2);
              marker.material.opacity = window01(t, 0, 1.8, 0.3);
              blocked = Math.abs(marker.position.y - middle.y) < 1.2;
            } else {
              marker.position.copy(home);
              marker.scale.setScalar(1.6);
              marker.material.opacity = t < 1.4 ? (Math.sin(t * 14) > 0 ? 1 : 0.2) : 0;
              blocked = t > 0.1 && t < 1.4;
            }
            showVerdict(t);
          },
          stop() {
            blocked = false;
          },
        };
      }
      default: {
        // Launch delay, cost increase, mass growth: a badge with what the event touched rises from the craft
        const symbol = { 'launch-delay': 'clock', 'cost-increase': '$', 'mass-growth': 'kg' }[event.id] ?? '$';
        const icon = own(badge(symbol, safe ? SAFE_COLOR : HURT_COLOR));
        return {
          update(t) {
            craftPosition(craft);
            const rise = easeOut(t / 1.2);
            icon.position.copy(craft).add(new THREE.Vector3(0, 0.4 + rise * 0.6, 0));
            icon.scale.setScalar(0.4 + 0.6 * rise);
            icon.material.opacity = window01(t, 0, 1.5, 0.2);
            showVerdict(t);
          },
        };
      }
    }
  });

  const period = effects.length * SLOT + GAP;
  let current = -1;

  return {
    disposables,
    signalBlocked: () => blocked,
    update(t) {
      if (!effects.length) return;
      // Play the events one after the other, then start again (the scene stays while the player reads)
      const local = (t - 0.4) % period;
      const index = t < 0.4 ? -1 : Math.floor(local / SLOT);
      if (index !== current) {
        effects[current]?.update(SLOT); // finish the previous one (all faded out)
        effects[current]?.stop?.();
        current = index;
      }
      if (index >= 0 && index < effects.length) effects[index].update(local - index * SLOT);
    },
  };
}
