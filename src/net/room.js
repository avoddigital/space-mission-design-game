// Network layer for multi-device team play, over WebRTC with PeerJS (MIT license).
// The devices talk directly to each other; the free public PeerJS server is only used so they can
// find each other (no server of ours, no account, no API key). Loaded on demand with import(),
// so the game starts just as fast, and if the network fails the game keeps working on one device.

import { makeCode } from './protocol.js';

const PREFIX = 'tupi-orbit-room-';
const CONNECT_TIMEOUT_MS = 10000;

async function loadPeer() {
  const { Peer } = await import('peerjs');
  return Peer;
}

/** Wait for an event on a PeerJS object, or fail on error or timeout. */
function opened(target, event = 'open') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), CONNECT_TIMEOUT_MS);
    target.once(event, (value) => {
      clearTimeout(timer);
      resolve(value);
    });
    target.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

/**
 * Open a room on this device. The players' devices join with the code.
 * @param {{ onMessage: (message: object, peerId: string) => void, onJoin?: (peerId: string) => void, onLeave: (peerId: string) => void }} handlers
 * @returns {Promise<{ code: string, broadcast: Function, send: Function, close: Function }>}
 */
export async function hostRoom({ onMessage, onJoin, onLeave }) {
  const Peer = await loadPeer();
  let peer = null;
  let code = '';
  for (let attempt = 0; attempt < 3 && !peer; attempt += 1) {
    code = makeCode();
    const candidate = new Peer(PREFIX + code);
    try {
      await opened(candidate);
      peer = candidate;
    } catch (error) {
      candidate.destroy();
      if (error?.type !== 'unavailable-id') throw error; // the code was taken: try another one
    }
  }
  if (!peer) throw new Error('no-code');

  const connections = new Map(); // peerId -> DataConnection
  peer.on('connection', (connection) => {
    connection.on('open', () => {
      connections.set(connection.peer, connection);
      onJoin?.(connection.peer); // so the new device gets the current state right away
    });
    connection.on('data', (data) => onMessage(data, connection.peer));
    connection.on('close', () => {
      connections.delete(connection.peer);
      onLeave(connection.peer);
    });
    connection.on('error', () => {
      connections.delete(connection.peer);
      onLeave(connection.peer);
    });
  });

  return {
    code,
    broadcast(message) {
      for (const connection of connections.values()) if (connection.open) connection.send(message);
    },
    send(peerId, message) {
      const connection = connections.get(peerId);
      if (connection?.open) connection.send(message);
    },
    close() {
      connections.forEach((connection) => connection.close());
      peer.destroy();
    },
  };
}

/**
 * Join a room from a player's device.
 * @param {string} code the 5-character room code
 * @param {{ onMessage: (message: object) => void, onClose: () => void }} handlers
 * @returns {Promise<{ send: Function, close: Function }>}
 */
export async function joinRoom(code, { onMessage, onClose }) {
  const Peer = await loadPeer();
  const peer = new Peer();
  try {
    await opened(peer);
    const connection = peer.connect(PREFIX + code, { reliable: true });
    await new Promise((resolve, reject) => {
      // "peer-unavailable" (no such room) arrives on the peer, not on the connection
      const fail = (error) => {
        clearTimeout(timer);
        reject(error);
      };
      const timer = setTimeout(() => fail(new Error('timeout')), CONNECT_TIMEOUT_MS);
      peer.once('error', fail);
      connection.once('error', fail);
      connection.once('open', () => {
        clearTimeout(timer);
        peer.off('error', fail);
        connection.off('error', fail);
        resolve();
      });
    });
    connection.on('data', onMessage);
    connection.on('close', onClose);
    peer.on('disconnected', () => peer.reconnect());
    return {
      send(message) {
        if (connection.open) connection.send(message);
      },
      close() {
        connection.close();
        peer.destroy();
      },
    };
  } catch (error) {
    peer.destroy();
    throw error;
  }
}

/** Short reason for the player, as an i18n key. */
export function errorKey(error) {
  const type = error?.type ?? error?.message;
  if (type === 'peer-unavailable') return 'room.errorNoRoom';
  if (type === 'timeout') return 'room.errorTimeout';
  if (type === 'browser-incompatible') return 'room.errorBrowser';
  return 'room.errorNetwork';
}
