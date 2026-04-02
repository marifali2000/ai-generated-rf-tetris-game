/**
 * Particle system — glass shard particles for visual effects.
 */

const MAX_PARTICLES = 350;

/** Pre-generate static star positions for the animated background. */
const STARS = Array.from({ length: 60 }, () => ({
  x: Math.random(),
  y: Math.random(),
  r: 0.4 + Math.random() * 1.2,
  speed: 0.3 + Math.random() * 0.7,
  phase: Math.random() * Math.PI * 2,
}));

/** Glass shard particle — triangular fragment that spins and catches light. */
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 2;
    this.life = 1;
    this.decay = 0.003 + Math.random() * 0.005;
    this.w = 2 + Math.random() * 7;
    this.h = 4 + Math.random() * 12;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.15;
    this.gravity = 0.03 + Math.random() * 0.02;
    this.glintPhase = Math.random() * Math.PI * 2;
    this.glintSpeed = 0.15 + Math.random() * 0.1;
  }

  update() {
    this.x += this.vx;
    this.vy += this.gravity;
    this.y += this.vy;
    this.vx *= 0.995;
    this.rotation += this.rotSpeed;
    this.glintPhase += this.glintSpeed;
    this.life -= this.decay;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life) * 0.9;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.beginPath();
    ctx.moveTo(0, -this.h / 2);
    ctx.lineTo(this.w / 2, this.h / 2);
    ctx.lineTo(-this.w / 2, this.h / 3);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    const glint = Math.max(0, Math.sin(this.glintPhase));
    if (glint > 0.6) {
      ctx.globalAlpha = (glint - 0.6) * 2.5 * this.life;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.w * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

export { Particle, MAX_PARTICLES, STARS };
