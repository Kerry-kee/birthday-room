// Horizontal collision uses a circular player and furniture footprints in metres.
export const PLAYER_RADIUS = 0.22;
export const SPAWN = { x: 1.45, y: 1.85, z: 4.4, yaw: 0.27, pitch: -0.04 };
export const OBSTACLES = [
  { name: 'sofa', x1: -5.42, x2: -3.88, z1: -2.83, z2: .33 },
  { name: 'table', x: .25, z: .48, radius: 1.04 },
  { name: 'shelf', x1: 3.9, x2: 5.84, z1: -5.14, z2: -4.35 },
  { name: 'cabinet', x1: .22, x2: 1.98, z1: -4.94, z2: -4 },
  { name: 'record-player', x1: -2.46, x2: -1.24, z1: .14, z2: 1.17 },
  { name: 'cat', x: -3.1, z: 1.15, radius: .53 },
  { name: 'plant', x: 5.1, z: 2.4, radius: .44 },
  { name: 'presents', x1: 4.3, x2: 5.55, z1: 3.6, z2: 4.4 },
  { name: 'lamp', x: -5.03, z: -2.98, radius: .31 },
  { name: 'bench', x1: -4.85, x2: -2.6, z1: 4.87, z2: 5.2 },
  { name: 'door', x1: -.01, x2: 1.51, z1: 4.98, z2: 5.3 },
  { name: 'reading-desk', x1: 4.08, x2: 5.22, z1: -2.18, z2: .18 },
  { name: 'reading-chair', x: 3.35, z: -1, radius: .43 },
  { name: 'potting-table', x1: 2.45, x2: 4.25, z1: 4.23, z2: 5.06 },
];
export function canStand(x, z) {
  if (x < -5.86 || x > 5.86 || z < -4.94 || z > 5.02) return false;
  return !OBSTACLES.some(o => {
    if ('radius' in o) return Math.hypot(x-o.x,z-o.z) < o.radius+PLAYER_RADIUS;
    const nearX=Math.max(o.x1,Math.min(x,o.x2)), nearZ=Math.max(o.z1,Math.min(z,o.z2));
    return Math.hypot(x-nearX,z-nearZ) < PLAYER_RADIUS;
  });
}
// Substeps prevent tunnelling; separate axes let the player slide along furniture.
export function movePlayer(position, dx, dz) {
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.07));
  for(let i=0;i<steps;i++) {
    if(canStand(position.x+dx/steps,position.z))position.x+=dx/steps;
    if(canStand(position.x,position.z+dz/steps))position.z+=dz/steps;
  }
  return position;
}
