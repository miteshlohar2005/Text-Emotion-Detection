/**
 * EmotionAI — Latent Emotion Topology Visualization
 * Continuous monochrome neural-network and emotion sphere animation engine.
 * Strict Palette: #000000 (Black) & #FFFFFF (White) with opacity modulation.
 */

(function () {
  'use strict';

  class EmotionVisualization {
    constructor(canvasId, containerId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.container = document.getElementById(containerId) || this.canvas.parentElement;
      this.ctx = this.canvas.getContext('2d');

      this.width = 0;
      this.height = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.activeEmotion = null;
      this.activeConfidence = null;
      this.hoveredNode = null;
      this.mouse = { x: -1000, y: -1000 };

      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        this.reducedMotion = e.matches;
      });

      this.time = 0;
      this.lastTimestamp = 0;
      this.animFrameId = null;

      // Define the 5 emotion nodes with balanced pentagonal coordinates & expressions
      this.nodes = [
        {
          id: 'joy',
          label: 'JOY',
          index: '01',
          role: 'POSITIVE VALENCE',
          normX: 0.50,
          normY: 0.20,
          radius: 34,
          freqY: 0.0009,
          ampY: 8,
          phaseY: 0.0,
          freqX: 0.0007,
          ampX: 5,
          phaseX: 1.2,
          type: 'joy'
        },
        {
          id: 'sadness',
          label: 'SADNESS',
          index: '02',
          role: 'ATTENUATED INTENSITY',
          normX: 0.22,
          normY: 0.44,
          radius: 32,
          freqY: 0.0007,
          ampY: 9,
          phaseY: 2.1,
          freqX: 0.0008,
          ampX: 6,
          phaseX: 0.5,
          type: 'sadness'
        },
        {
          id: 'anger',
          label: 'ANGER',
          index: '03',
          role: 'ACUTE TENSION',
          normX: 0.78,
          normY: 0.44,
          radius: 32,
          freqY: 0.0011,
          ampY: 7,
          phaseY: 4.2,
          freqX: 0.0006,
          ampX: 6,
          phaseX: 3.1,
          type: 'anger'
        },
        {
          id: 'love',
          label: 'LOVE',
          index: '04',
          role: 'AFFINITY RESONANCE',
          normX: 0.28,
          normY: 0.74,
          radius: 33,
          freqY: 0.0008,
          ampY: 8,
          phaseY: 1.5,
          freqX: 0.0009,
          ampX: 5,
          phaseX: 5.0,
          type: 'love'
        },
        {
          id: 'fear',
          label: 'FEAR',
          index: '05',
          role: 'HYPER-VIGILANCE',
          normX: 0.72,
          normY: 0.74,
          radius: 32,
          freqY: 0.0010,
          ampY: 8,
          phaseY: 3.4,
          freqX: 0.0007,
          ampX: 5,
          phaseX: 2.8,
          type: 'fear'
        }
      ];

      // Central Latent Representation Nexus
      this.centerHub = {
        normX: 0.50,
        normY: 0.48,
        radius: 16
      };

      // Background ambient particles
      this.particles = [];
      this.initParticles(38);

      // Synaptic energy pulses traveling on edges
      this.pulses = [];
      this.initPulses();

      this.initListeners();
      this.resize();
      this.start();
    }

    initParticles(count) {
      this.particles = [];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random(),
          y: Math.random(),
          vx: (Math.random() - 0.5) * 0.00012,
          vy: (Math.random() - 0.5) * 0.00012,
          size: Math.random() * 1.6 + 0.6,
          alpha: Math.random() * 0.35 + 0.1,
          flickerRate: Math.random() * 0.002 + 0.001,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    initPulses() {
      // Continuous synaptic pulse signals with varied speeds
      this.pulses = [
        { fromIdx: -1, toIdx: 0, progress: 0.1, speed: 0.0032 },
        { fromIdx: -1, toIdx: 1, progress: 0.6, speed: 0.0026 },
        { fromIdx: -1, toIdx: 2, progress: 0.3, speed: 0.0038 },
        { fromIdx: -1, toIdx: 3, progress: 0.8, speed: 0.0028 },
        { fromIdx: -1, toIdx: 4, progress: 0.45, speed: 0.0033 },
        { fromIdx: 0, toIdx: 1, progress: 0.2, speed: 0.0024 },
        { fromIdx: 1, toIdx: 3, progress: 0.7, speed: 0.0027 },
        { fromIdx: 0, toIdx: 2, progress: 0.5, speed: 0.0030 },
        { fromIdx: 2, toIdx: 4, progress: 0.15, speed: 0.0025 },
        { fromIdx: 3, toIdx: 4, progress: 0.9, speed: 0.0021 }
      ];
    }

    initListeners() {
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.container);
      } else {
        window.addEventListener('resize', () => this.resize());
      }

      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.checkHover();
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.mouse.x = -1000;
        this.mouse.y = -1000;
        this.hoveredNode = null;
      });

      // Allow clicking on an emotion sphere to insert sample prompt
      this.canvas.addEventListener('click', () => {
        if (this.hoveredNode) {
          const event = new CustomEvent('emotionNodeSelected', {
            detail: { emotion: this.hoveredNode.id }
          });
          window.dispatchEvent(event);
        }
      });
    }

    resize() {
      const rect = this.container.getBoundingClientRect();
      const newWidth = Math.floor(rect.width || (window.innerWidth * 0.44));
      const newHeight = Math.floor(rect.height || window.innerHeight);

      if (newWidth <= 0 || newHeight <= 0) return;

      this.width = newWidth;
      this.height = newHeight;

      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);

      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;

      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);

      this.updateNodePositions();
    }

    updateNodePositions() {
      const cx = this.width * 0.5;
      const cy = this.height * 0.48; // Centered with breathing room for bottom HUD
      const scale = Math.min(this.width / 520, this.height / 540);
      const clampedScale = Math.min(Math.max(scale, 0.65), 1.15);

      this.centerHub.x = cx;
      this.centerHub.y = cy;
      this.centerHub.r = Math.max(15 * clampedScale, 11);
      this.currentScale = clampedScale;

      this.nodes.forEach((node) => {
        const baseOffsetX = (node.normX - 0.5) * (this.width * 0.78);
        const baseOffsetY = (node.normY - 0.48) * (this.height * 0.74);

        node.baseX = cx + baseOffsetX;
        node.baseY = cy + baseOffsetY;
        node.currentRadius = Math.max(node.radius * clampedScale, 20);

        if (this.reducedMotion) {
          node.x = node.baseX;
          node.y = node.baseY;
        } else {
          node.x = node.baseX + Math.sin(this.time * node.freqX + node.phaseX) * node.ampX * clampedScale;
          node.y = node.baseY + Math.sin(this.time * node.freqY + node.phaseY) * node.ampY * clampedScale;
        }
      });
    }

    checkHover() {
      this.hoveredNode = null;
      for (const node of this.nodes) {
        const dx = this.mouse.x - node.x;
        const dy = this.mouse.y - node.y;
        if (Math.hypot(dx, dy) <= node.currentRadius + 8) {
          this.hoveredNode = node;
          this.canvas.style.cursor = 'pointer';
          return;
        }
      }
      this.canvas.style.cursor = 'default';
    }

    setActiveEmotion(emotionName, confidence) {
      if (!emotionName) {
        this.activeEmotion = null;
        this.activeConfidence = null;
        return;
      }
      const target = emotionName.toLowerCase().trim();
      const match = this.nodes.find((n) => n.id === target || target.startsWith(n.id));
      if (match) {
        this.activeEmotion = match.id;
        this.activeConfidence = confidence;
      }
    }

    start() {
      const loop = (timestamp) => {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const rawDelta = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        // Cap delta to 100ms to avoid large jumps when tab is in background
        const delta = Math.min(rawDelta, 100);

        if (!this.reducedMotion) {
          this.time += delta;
        }

        this.render(delta);
        this.animFrameId = requestAnimationFrame(loop);
      };
      this.animFrameId = requestAnimationFrame(loop);
    }

    render(delta = 16.667) {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      if (w <= 0 || h <= 0) return;

      const cx = this.centerHub.x;
      const cy = this.centerHub.y;

      // 1. Deep Black Canvas Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // 2. Technical Coordinate Grid & Crosshairs
      this.drawTechnicalGrid(w, h);

      // 3. Drifting Particle Cloud
      this.drawParticles(w, h, delta);

      // 4. Concentric Orbital Rings
      this.drawOrbitalRings(cx, cy);

      // 5. Update and Calculate Node Float Coordinates
      this.updateNodePositions();

      // 6. Neural Network Synaptic Connections & Traveling Energy Pulses
      this.drawSynapticNetwork(delta);

      // 7. Central Latent State Nexus Hub
      this.drawLatentHub(cx, cy);

      // 8. The 5 Emotion Spheres
      this.nodes.forEach((node) => {
        this.drawEmotionSphere(node);
      });

      // 9. Technical HUD Telemetry Overlay
      this.drawTelemetryOverlay(w, h);
    }

    drawTechnicalGrid(w, h) {
      const ctx = this.ctx;
      const step = 44;

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;

      for (let x = (w % step) / 2; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      for (let y = (h % step) / 2; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Crosshairs at key intersections
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      const crossStep = step * 3;
      for (let x = (w % crossStep) / 2; x < w; x += crossStep) {
        for (let y = (h % crossStep) / 2; y < h; y += crossStep) {
          ctx.beginPath();
          ctx.moveTo(x - 2.5, y);
          ctx.lineTo(x + 2.5, y);
          ctx.moveTo(x, y - 2.5);
          ctx.lineTo(x, y + 2.5);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    drawParticles(w, h, delta) {
      const ctx = this.ctx;
      const deltaFactor = delta / 16.667;
      ctx.save();

      this.particles.forEach((p) => {
        if (!this.reducedMotion) {
          p.x += p.vx * deltaFactor;
          p.y += p.vy * deltaFactor;
          if (p.x < 0) p.x += 1;
          if (p.x > 1) p.x -= 1;
          if (p.y < 0) p.y += 1;
          if (p.y > 1) p.y -= 1;
        }

        const px = p.x * w;
        const py = p.y * h;
        const flicker = 0.8 + 0.2 * Math.sin(this.time * p.flickerRate + p.phase);
        const alpha = p.alpha * flicker;

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    drawOrbitalRings(cx, cy) {
      const ctx = this.ctx;
      const scale = this.currentScale || 1;
      const r1 = 95 * scale;
      const r2 = 165 * scale;
      const r3 = 230 * scale;

      const angle1 = this.reducedMotion ? 0 : this.time * 0.00028;
      const angle2 = this.reducedMotion ? 0 : -this.time * 0.00018;

      ctx.save();
      ctx.translate(cx, cy);

      // Inner dashed ring
      ctx.rotate(angle1);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, r1, 0, Math.PI * 2);
      ctx.stroke();

      // Middle technical ring with tick marks
      ctx.rotate(-angle1);
      ctx.rotate(angle2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.setLineDash([10, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, r2, 0, Math.PI * 2);
      ctx.stroke();

      // Cardinal degree ticks on middle ring
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      const ticks = 8;
      for (let i = 0; i < ticks; i++) {
        const th = (i * Math.PI * 2) / ticks;
        const x1 = Math.cos(th) * (r2 - 3.5);
        const y1 = Math.sin(th) * (r2 - 3.5);
        const x2 = Math.cos(th) * (r2 + 3.5);
        const y2 = Math.sin(th) * (r2 + 3.5);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Outer delicate boundary ring
      ctx.rotate(-angle2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.setLineDash([2, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, r3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    drawSynapticNetwork(delta) {
      const ctx = this.ctx;
      const cx = this.centerHub.x;
      const cy = this.centerHub.y;
      const deltaFactor = delta / 16.667;

      ctx.save();

      // 1. Draw connecting splines from center to each node
      this.nodes.forEach((node) => {
        const isActive = this.activeEmotion === node.id;
        const isHovered = this.hoveredNode === node;

        ctx.strokeStyle = isActive
          ? 'rgba(255, 255, 255, 0.45)'
          : isHovered
          ? 'rgba(255, 255, 255, 0.32)'
          : 'rgba(255, 255, 255, 0.10)';
        ctx.lineWidth = isActive ? 1.5 : 1;
        ctx.setLineDash(isActive ? [] : [2, 3]);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const mx = (cx + node.x) / 2 + (node.baseX - cx) * 0.06;
        const my = (cy + node.y) / 2 + (node.baseY - cy) * 0.06;
        ctx.quadraticCurveTo(mx, my, node.x, node.y);
        ctx.stroke();
      });

      // 2. Draw inter-node perimeter links
      ctx.setLineDash([]);
      for (let i = 0; i < this.nodes.length; i++) {
        const n1 = this.nodes[i];
        const n2 = this.nodes[(i + 1) % this.nodes.length];
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      }

      // 3. Render and advance traveling synaptic energy pulses
      if (!this.reducedMotion) {
        this.pulses.forEach((pulse) => {
          pulse.progress += pulse.speed * deltaFactor;
          if (pulse.progress > 1) pulse.progress -= 1;

          let startX, startY, endX, endY;
          if (pulse.fromIdx === -1) {
            startX = cx;
            startY = cy;
            const targetNode = this.nodes[pulse.toIdx];
            endX = targetNode.x;
            endY = targetNode.y;
          } else {
            const n1 = this.nodes[pulse.fromIdx];
            const n2 = this.nodes[pulse.toIdx];
            startX = n1.x;
            startY = n1.y;
            endX = n2.x;
            endY = n2.y;
          }

          const t = pulse.progress;
          const px = startX + (endX - startX) * t;
          const py = startY + (endY - startY) * t;

          const pulseAlpha = Math.sin(t * Math.PI) * 0.85;
          ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, 2.0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(255, 255, 255, ${(pulseAlpha * 0.3).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - (endX - startX) * 0.035, py - (endY - startY) * 0.035);
          ctx.stroke();
        });
      }

      ctx.restore();
    }

    drawLatentHub(cx, cy) {
      const ctx = this.ctx;
      const r = this.centerHub.r;
      const pulse = this.reducedMotion ? 1 : 0.88 + 0.12 * Math.sin(this.time * 0.0018);

      ctx.save();
      ctx.translate(cx, cy);

      // Central core black disc
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Outer pulsating white ring
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.38 * pulse).toFixed(3)})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Inner wireframe reticle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, 0);
      ctx.lineTo(r * 0.45, 0);
      ctx.moveTo(0, -r * 0.45);
      ctx.lineTo(0, r * 0.45);
      ctx.stroke();

      // Central dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Technical label below hub
      ctx.font = '8.5px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.textAlign = 'center';
      ctx.fillText('LSTM_h(t)', 0, r + 12);

      ctx.restore();
    }

    drawEmotionSphere(node) {
      const ctx = this.ctx;
      const r = node.currentRadius;
      const isActive = this.activeEmotion === node.id;
      const isHovered = this.hoveredNode === node;

      ctx.save();
      ctx.translate(node.x, node.y);

      // Concentric Resonance Wave if active or hovered
      if (isActive || isHovered) {
        const waveScale = this.reducedMotion ? 1.25 : 1.08 + 0.22 * ((this.time * 0.0012) % 1);
        const waveAlpha = this.reducedMotion ? 0.35 : 0.45 * (1 - ((this.time * 0.0012) % 1));
        ctx.strokeStyle = `rgba(255, 255, 255, ${waveAlpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, r * waveScale, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Base Sphere Fill with Realistic Monochrome Spherical Gradient
      const grad = ctx.createRadialGradient(
        -r * 0.32, -r * 0.32, r * 0.08,
        0, 0, r
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.35)');
      grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.07)');
      grad.addColorStop(1, '#000000');

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Spherical Rim Contour
      ctx.strokeStyle = isActive
        ? '#ffffff'
        : isHovered
        ? 'rgba(255, 255, 255, 0.85)'
        : 'rgba(255, 255, 255, 0.42)';
      ctx.lineWidth = isActive ? 1.8 : 1.1;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // Subtle Orbital Ring around sphere
      ctx.save();
      const ringAngle = this.reducedMotion ? 0.3 : (this.time * 0.0005 + node.phaseX);
      ctx.rotate(ringAngle);
      ctx.strokeStyle = isActive ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.3, r * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Minimalist Monochrome Expression Glyph
      this.drawExpressionGlyph(node.type, r, isActive || isHovered);

      // Scientific Label
      ctx.font = '600 10.5px "JetBrains Mono", monospace';
      ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, 0, r + 14);

      // Score / Index
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = isActive ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)';
      if (isActive && this.activeConfidence !== null) {
        ctx.fillText(`${this.activeConfidence.toFixed(1)}%`, 0, r + 24);
      } else {
        ctx.fillText(`[${node.index}]`, 0, r + 23);
      }

      ctx.restore();
    }

    drawExpressionGlyph(type, r, isEmphasized) {
      const ctx = this.ctx;
      ctx.save();
      ctx.strokeStyle = isEmphasized ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
      ctx.fillStyle = isEmphasized ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';

      const eyeY = -r * 0.16;
      const eyeSpacing = r * 0.32;
      const mouthY = r * 0.22;

      switch (type) {
        case 'joy': {
          ctx.beginPath();
          ctx.arc(-eyeSpacing, eyeY, r * 0.10, Math.PI * 1.1, Math.PI * 1.9);
          ctx.arc(eyeSpacing, eyeY, r * 0.10, Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, mouthY - r * 0.08, r * 0.26, Math.PI * 0.2, Math.PI * 0.8, false);
          ctx.stroke();
          break;
        }

        case 'sadness': {
          ctx.beginPath();
          ctx.arc(-eyeSpacing, eyeY, 1.6, 0, Math.PI * 2);
          ctx.arc(eyeSpacing, eyeY, 1.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(0, mouthY + r * 0.16, r * 0.22, Math.PI * 1.25, Math.PI * 1.75, false);
          ctx.stroke();
          break;
        }

        case 'anger': {
          ctx.beginPath();
          ctx.moveTo(-eyeSpacing - r * 0.11, eyeY - r * 0.09);
          ctx.lineTo(-eyeSpacing + r * 0.09, eyeY + r * 0.05);
          ctx.moveTo(eyeSpacing + r * 0.11, eyeY - r * 0.09);
          ctx.lineTo(eyeSpacing - r * 0.09, eyeY + r * 0.05);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(-eyeSpacing + r * 0.02, eyeY + r * 0.09, 1.4, 0, Math.PI * 2);
          ctx.arc(eyeSpacing - r * 0.02, eyeY + r * 0.09, 1.4, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(-r * 0.2, mouthY);
          ctx.lineTo(r * 0.2, mouthY);
          ctx.stroke();
          break;
        }

        case 'love': {
          ctx.beginPath();
          ctx.arc(-eyeSpacing, eyeY, r * 0.09, Math.PI * 1.15, Math.PI * 1.85);
          ctx.arc(eyeSpacing, eyeY, r * 0.09, Math.PI * 1.15, Math.PI * 1.85);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(-r * 0.18, mouthY - r * 0.03);
          ctx.quadraticCurveTo(-r * 0.09, mouthY + r * 0.12, 0, mouthY + r * 0.02);
          ctx.quadraticCurveTo(r * 0.09, mouthY + r * 0.12, r * 0.18, mouthY - r * 0.03);
          ctx.stroke();
          break;
        }

        case 'fear': {
          const eyeR = r * 0.12;
          ctx.beginPath();
          ctx.arc(-eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
          ctx.arc(eyeSpacing, eyeY, eyeR, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(-eyeSpacing, eyeY, 1.4, 0, Math.PI * 2);
          ctx.arc(eyeSpacing, eyeY, 1.4, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.ellipse(0, mouthY, r * 0.11, r * 0.15, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
      }

      ctx.restore();
    }

    drawTelemetryOverlay(w, h) {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = '8.5px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';

      // Header telemetry
      ctx.textAlign = 'left';
      ctx.fillText('// LATENT_TOPOLOGY_5D', 16, 20);
      ctx.fillText('STATUS: ONLINE', 16, 32);

      // Top right telemetry
      ctx.textAlign = 'right';
      ctx.fillText('SAMPLING: CONTINUOUS', w - 16, 20);
      ctx.fillText(`FPS: ~60 // ${(this.time * 0.001).toFixed(1)}s`, w - 16, 32);

      // Node selection or prediction indicator cleanly positioned above the legend
      if (this.hoveredNode) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`FOCUSED: ${this.hoveredNode.label} [${this.hoveredNode.role}]`, 16, h - 32);
      } else if (this.activeEmotion) {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`ACTIVE PREDICTION: ${this.activeEmotion.toUpperCase()}`, 16, h - 32);
      }

      ctx.restore();
    }

    destroy() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
      }
    }
  }

  // Expose to window
  window.EmotionVisualization = EmotionVisualization;
})();
