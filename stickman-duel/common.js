// Common Stickman & FX Library for OpenFilm

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function easeIn(t) {
  return t * t * t;
}

export function easeElastic(t) {
  const p = 0.3;
  return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
}

// Pseudo-random deterministic noise based on seed
export function pseudoRandom(seed) {
  const x = Math.sin(seed * 9999.123) * 10000;
  return x - Math.floor(x);
}

// Draw a stickman with full limb angles and customization
export function drawStickman(ctx, opt) {
  ctx.save();
  
  const {
    x = 960,
    y = 800,
    scale = 1.0,
    color = '#ffffff',
    lineWidth = 8,
    headRadius = 24,
    eyeType = 'normal', // normal, angry, shock, love, dizzy, happy, closed
    eyeDir = 1, // 1 for right, -1 for left
    headTilt = 0,
    torsoAngle = 0,
    torsoLen = 80,
    leftArm = [-0.4, 0.4],   // [shoulder_angle, elbow_angle]
    rightArm = [0.4, -0.4],
    leftLeg = [-0.3, 0.3],   // [hip_angle, knee_angle]
    rightLeg = [0.3, -0.3],
    armLen = [42, 42],
    legLen = [52, 52],
    headband = null, // { color: '#ff3344', tailLen: 60, flutter: 0 }
    scarf = null,    // { color: '#00bbff', flutter: 0 }
    skirt = null,    // { color: '#ff66aa' }
    hairBow = null,  // { color: '#ff4488' }
    sunglasses = false,
    headphones = false,
    heldItemLeft = null, // { type: 'rose' | 'ring' | 'sword' | 'staff' | 'drink', color, glow }
    heldItemRight = null,
    aura = null, // { color: '#ff3344', intensity: 1.0, seed: 0 }
    sweatdrop = false,
  } = opt;

  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // 1. Draw Aura if present
  if (aura && aura.intensity > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1.0, aura.intensity * 0.7);
    ctx.strokeStyle = aura.color;
    ctx.fillStyle = aura.color;
    ctx.shadowColor = aura.color;
    ctx.shadowBlur = 25 * aura.intensity;
    
    // Aura flames / electric arcs
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + aura.seed;
      const r = (50 + pseudoRandom(i + aura.seed * 5) * 45) * aura.intensity;
      const ax = Math.cos(angle) * r;
      const ay = Math.sin(angle) * (r * 1.4) - 70;
      ctx.beginPath();
      ctx.arc(ax, ay, 4 + pseudoRandom(i * 3 + aura.seed) * 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;

  // Key joints
  // Pelvis / Hip is at (0, 0)
  const hipX = 0;
  const hipY = 0;

  // Neck / Shoulder joint
  const neckX = hipX + Math.sin(torsoAngle) * torsoLen;
  const neckY = hipY - Math.cos(torsoAngle) * torsoLen;

  // Head center
  const headX = neckX + Math.sin(torsoAngle + headTilt) * (headRadius + 8);
  const headY = neckY - Math.cos(torsoAngle + headTilt) * (headRadius + 8);

  // Draw Legs
  function drawLimb(rootX, rootY, angles, lens, isArm = false) {
    const a1 = angles[0];
    const a2 = a1 + angles[1];
    const j1X = rootX + Math.sin(a1) * lens[0];
    const j1Y = rootY + Math.cos(a1) * lens[0];
    const j2X = j1X + Math.sin(a2) * lens[1];
    const j2Y = j1Y + Math.cos(a2) * lens[1];

    ctx.beginPath();
    ctx.moveTo(rootX, rootY);
    ctx.lineTo(j1X, j1Y);
    ctx.lineTo(j2X, j2Y);
    ctx.stroke();

    return { joint: [j1X, j1Y], end: [j2X, j2Y], a2 };
  }

  // Left Leg (Behind)
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.85;
  drawLimb(hipX - 4, hipY, leftLeg, legLen);
  ctx.restore();

  // Right Leg (In front)
  drawLimb(hipX + 4, hipY, rightLeg, legLen);

  // Torso / Spine
  ctx.beginPath();
  ctx.moveTo(hipX, hipY);
  ctx.lineTo(neckX, neckY);
  ctx.stroke();

  // Skirt / Dress (if female stickman)
  if (skirt) {
    ctx.save();
    ctx.fillStyle = skirt.color;
    ctx.beginPath();
    ctx.moveTo(neckX * 0.4 + hipX * 0.6, neckY * 0.4 + hipY * 0.6);
    ctx.lineTo(hipX - 25, hipY + 30);
    ctx.lineTo(hipX + 25, hipY + 30);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Left Arm (Behind)
  ctx.save();
  ctx.globalAlpha = 0.85;
  const leftHandData = drawLimb(neckX - 4, neckY + 4, leftArm, armLen, true);
  ctx.restore();
  if (heldItemLeft) {
    drawItem(ctx, leftHandData.end[0], leftHandData.end[1], leftHandData.a2, heldItemLeft);
  }

  // Right Arm (In front)
  const rightHandData = drawLimb(neckX + 4, neckY + 4, rightArm, armLen, true);
  if (heldItemRight) {
    drawItem(ctx, rightHandData.end[0], rightHandData.end[1], rightHandData.a2, heldItemRight);
  }

  // Head
  ctx.beginPath();
  ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#0f111a'; // Dark background inside head
  ctx.fill();

  // Scarf
  if (scarf) {
    ctx.save();
    ctx.strokeStyle = scarf.color;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(neckX, neckY + 2, 12, 0, Math.PI);
    ctx.stroke();
    // Flowing scarf tails
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(neckX, neckY + 6);
    const flutter = scarf.flutter || 0;
    ctx.bezierCurveTo(
      neckX - 30 * eyeDir, neckY + 5 + flutter,
      neckX - 60 * eyeDir, neckY + 20 - flutter,
      neckX - 90 * eyeDir, neckY + 15 + flutter * 1.5
    );
    ctx.stroke();
    ctx.restore();
  }

  // Headband
  if (headband) {
    ctx.save();
    ctx.strokeStyle = headband.color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(headX, headY - 4, headRadius + 1, Math.PI * 0.9, Math.PI * 2.1);
    ctx.stroke();
    // Fluttering tails
    const fl = headband.flutter || 0;
    ctx.beginPath();
    ctx.moveTo(headX - (headRadius * eyeDir), headY - 4);
    ctx.bezierCurveTo(
      headX - (headRadius + 25) * eyeDir, headY - 10 + fl,
      headX - (headRadius + 50) * eyeDir, headY + 5 - fl,
      headX - (headRadius + 80) * eyeDir, headY - 5 + fl * 1.5
    );
    ctx.stroke();
    ctx.restore();
  }

  // Hair Bow (Female)
  if (hairBow) {
    ctx.save();
    ctx.fillStyle = hairBow.color;
    const bx = headX - 12 * eyeDir;
    const by = headY - headRadius - 2;
    // Left knot, right knot, center circle
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 14, by - 10);
    ctx.lineTo(bx - 14, by + 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 14, by - 10);
    ctx.lineTo(bx + 14, by + 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    // Blush cheeks
    ctx.fillStyle = 'rgba(255, 120, 160, 0.6)';
    ctx.beginPath();
    ctx.arc(headX + 10 * eyeDir, headY + 6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Sunglasses
  if (sunglasses) {
    ctx.save();
    ctx.fillStyle = '#111111';
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    const gx = headX + 4 * eyeDir;
    const gy = headY - 2;
    // Lens
    ctx.fillRect(gx - 8, gy - 6, 22, 12);
    ctx.strokeRect(gx - 8, gy - 6, 22, 12);
    // Cool gloss line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx - 4, gy - 4);
    ctx.lineTo(gx + 2, gy + 4);
    ctx.stroke();
    ctx.restore();
  }

  // Headphones
  if (headphones) {
    ctx.save();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(headX, headY - 6, headRadius + 4, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    // Ear cup
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(headX - headRadius - 4, headY - 8, 8, 16);
    ctx.restore();
  }

  // Eyes & Expressions
  ctx.save();
  const eyeCenterX = headX + 8 * eyeDir;
  const eyeCenterY = headY - 2;

  if (eyeType === 'angry') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    // Sharp diagonal angry brows
    ctx.beginPath();
    ctx.moveTo(eyeCenterX - 8 * eyeDir, eyeCenterY - 6);
    ctx.lineTo(eyeCenterX + 8 * eyeDir, eyeCenterY - 2);
    ctx.stroke();
    // Glowing intense pupil
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(eyeCenterX + 2 * eyeDir, eyeCenterY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (eyeType === 'shock') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeCenterX, eyeCenterY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(eyeCenterX + 2 * eyeDir, eyeCenterY, 2, 0, Math.PI * 2);
    ctx.fill();
    // Open mouth
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(headX + 10 * eyeDir, headY + 10, 5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (eyeType === 'love') {
    // Red heart eyes!
    ctx.fillStyle = '#ff2255';
    drawHeart(ctx, eyeCenterX, eyeCenterY, 9);
    // Smile
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(headX + 8 * eyeDir, headY + 8, 6, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else if (eyeType === 'dizzy') {
    // Spiral eye
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 4; a += 0.2) {
      const r = (a / (Math.PI * 4)) * 7;
      const sx = eyeCenterX + Math.cos(a) * r;
      const sy = eyeCenterY + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  } else if (eyeType === 'happy') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(eyeCenterX, eyeCenterY, 6, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    // Big smile
    ctx.beginPath();
    ctx.arc(headX + 8 * eyeDir, headY + 8, 7, 0.1, Math.PI - 0.1);
    ctx.stroke();
  } else {
    // Normal dot eyes
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(eyeCenterX, eyeCenterY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sweatdrop
  if (sweatdrop) {
    ctx.fillStyle = '#44ccff';
    const sx = headX - 16 * eyeDir;
    const sy = headY - 14;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(sx - 6, sy + 6, sx - 6, sy + 14, sx, sy + 14);
    ctx.bezierCurveTo(sx + 6, sy + 14, sx + 6, sy + 6, sx, sy);
    ctx.fill();
  }

  ctx.restore();
  ctx.restore();
}

// Draw Held Items
function drawItem(ctx, x, y, angle, item) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  if (item.type === 'rose') {
    // Green stem
    ctx.strokeStyle = '#22aa44';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -35);
    ctx.stroke();
    // Leaves
    ctx.fillStyle = '#22aa44';
    ctx.beginPath();
    ctx.ellipse(6, -15, 8, 4, Math.PI * 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Red Rose petals
    ctx.fillStyle = '#ff2244';
    ctx.beginPath();
    ctx.arc(0, -42, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dd1133';
    ctx.beginPath();
    ctx.arc(3, -40, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.type === 'ring') {
    // Gold band
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -15, 12, 0, Math.PI * 2);
    ctx.stroke();
    // Giant sparkling blue diamond
    ctx.fillStyle = '#99eeff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.lineTo(14, -28);
    ctx.lineTo(0, -22);
    ctx.lineTo(-14, -28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Sparkle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -30, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (item.type === 'sword') {
    // Glowing flaming katana
    const len = item.length || 110;
    // Glow
    ctx.shadowColor = item.glowColor || '#ff4400';
    ctx.shadowBlur = 20;
    // Blade
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(0, -len);
    ctx.stroke();
    // Flame edge
    ctx.strokeStyle = item.edgeColor || '#ff3300';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, 5);
    ctx.lineTo(4, -len);
    ctx.stroke();
    // Guard & Hilt
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(-12, 5, 24, 6);
    ctx.fillStyle = '#222222';
    ctx.fillRect(-4, 11, 8, 22);
  } else if (item.type === 'staff') {
    // Glowing neon plasma staff
    const len = item.length || 150;
    ctx.shadowColor = item.glowColor || '#00ddff';
    ctx.shadowBlur = 22;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -len * 0.5);
    ctx.lineTo(0, len * 0.5);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else if (item.type === 'drink') {
    // Bubble tea cup
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(-10, -28, 20, 30);
    ctx.fillStyle = '#ff88aa'; // strawberry milk
    ctx.fillRect(-8, -22, 16, 22);
    // Boba pearls
    ctx.fillStyle = '#331111';
    for (let b = 0; b < 4; b++) {
      ctx.beginPath();
      ctx.arc(-5 + b * 3.5, -3, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Straw
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(4, -38);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawHeart(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(0, topCurveHeight);
  // top left curve
  ctx.bezierCurveTo(
    -size / 2, -size / 2,
    -size, size / 3,
    0, size
  );
  // top right curve
  ctx.bezierCurveTo(
    size, size / 3,
    size / 2, -size / 2,
    0, topCurveHeight
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Draw Anime Action / Speed lines
export function drawSpeedLines(ctx, cx, cy, intensity, seed = 0) {
  if (intensity <= 0) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 3;
  const numLines = Math.floor(35 * intensity);
  const maxDist = 1200;
  for (let i = 0; i < numLines; i++) {
    const angle = (i / numLines) * Math.PI * 2 + pseudoRandom(i + seed) * 0.2;
    const startR = 300 + pseudoRandom(i * 7 + seed) * 200;
    const endR = startR + 400 + pseudoRandom(i * 13 + seed) * 400;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * startR, cy + Math.sin(angle) * startR);
    ctx.lineTo(cx + Math.cos(angle) * endR, cy + Math.sin(angle) * endR);
    ctx.stroke();
  }
  ctx.restore();
}

// Comic Impact Starburst & Text
export function drawImpactBurst(ctx, x, y, radius, text = null, color = '#ffcc00') {
  if (radius <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  // Multi-pointed starburst
  ctx.fillStyle = color;
  ctx.beginPath();
  const points = 16;
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // White inner star
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? radius * 0.6 : radius * 0.25;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Comic text
  if (text) {
    ctx.fillStyle = '#000000';
    ctx.font = '900 36px Impact, Arial Black, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.rotate(-0.1);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}
