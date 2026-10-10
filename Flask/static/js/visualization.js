/**
 * EmotionAI — Latent Emotion Topology Visualization
 * Continuous monochrome neural-network and emotion sphere animation engine.
 * Coherent clockwise orbital rotation (75s per revolution) around stationary LSTM core.
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
      this.isPointerOver = false;
      this.mouse = { x: -1000, y: -1000 };

      // Accessibility: Respect OS-level reduced motion preference
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        this.reducedMotion = e.matches;
      });

      this.time = 0;
      this.lastTimestamp = 0;
      this.animFrameId = null;

      // Rotation Configuration: 1 revolution every 75 seconds clockwise
      this.rotationPeriod = 75; // seconds per full revolution (configurable)
      this.rotationSpeed = 1.0; // speed multiplier (configurable)
      this.rotationAngle = 0;   // cumulative rotation angle in radians
      this.speedDampener = 1.0; // gentle pointer-hover deceleration factor

      // The 5 Emotion Nodes in a balanced pentagonal constellation
      // In clockwise sequence from top: JOY -> ANGER -> FEAR -> LOVE -> SADNESS
      const stepAngle = (Math.PI * 2) / 5; // 72 degrees
      const topAngle = -Math.PI / 2;       // -90 degrees (top position)

      this.nodes = [
        {
          id: 'joy',
          label: 'JOY',
          index: '01',
          role: 'POSITIVE VALENCE',
          radius: 34,
          type: 'joy',
          baseAngle: topAngle // Top
        },
        {
          id: 'sadness',
          label: 'SADNESS',
          index: '02',
          role: 'ATTENUATED INTENSITY',
          radius: 32,
          type: 'sadness',
          baseAngle: topAngle + stepAngle * 4 // Upper-left
        },
        {
          id: 'anger',
          label: 'ANGER',
          index: '03',
          role: 'ACUTE TENSION',
          radius: 32,
          type: 'anger',
          baseAngle: topAngle + stepAngle * 1 // Upper-right
        },
        {
          id: 'love',
          label: 'LOVE',
          index: '04',
          role: 'AFFINITY RESONANCE',
          radius: 33,
          type: 'love',
          baseAngle: topAngle + stepAngle * 3 // Lower-left
        },
        {
          id: 'fear',
          label: 'FEAR',
          index: '05',
          role: 'HYPER-VIGILANCE',
          radius: 32,
          type: 'fear',
          baseAngle: topAngle + stepAngle * 2 // Lower-right
        }
      ];

      // Perimeter connectivity order for regular pentagon (indices into this.nodes)
      this.perimeterOrder = [0, 2, 4, 3, 1]; // Joy -> Anger -> Fear -> Love -> Sadness

      // Central Latent Representation Nexus (stationary LSTM core)
      this.centerHub = {
        x: 0,
        y: 0,
        r: 16
      };

      // Network particles rotating synchronously with the composition
      this.particles = [];
      this.initParticles(36);

      // Synaptic energy pulses traveling on edges
      this.pulses = [];
      this.initPulses();

      this.initListeners();
      this.resize();
      this.start();
    }

    /**
     * Initializes network particles in polar coordinates around the center hub
     * so they rotate coherently with the neural constellation.
     */
    initParticles(count) {
      this.particles = [];
      for (let i = 0; i < count; i++) {
        // Positioned across the orbital disk (0.35 to 1.32 of orbit radius)
        const radiusFraction = 0.35 + Math.random() * 0.97;
        this.particles.push({
          radiusFraction: radiusFraction,
          baseAngle: Math.random() * Math.PI * 2,
          radialWobbleAmp: Math.random() * 3 + 1,
          radialWobbleFreq: Math.random() * 0.0012 + 0.0006,
          radialPhase: Math.random() * Math.PI * 2,
          size: Math.random() * 1.3 + 0.6,
          alpha: Math.random() * 0.28 + 0.08,
          flickerRate: Math.random() * 0.0016 + 0.0008,
          flickerPhase: Math.random() * Math.PI * 2
        });
      }
    }

    /**
     * Synaptic pulses traveling along radial arms and clockwise perimeter edges.
     */
    initPulses() {
      this.pulses = [
        // Radial pulses traveling from stationary center (-1) outward to nodes
        { fromIdx: -1, toIdx: 0, progress: 0.12, speed: 0.0030 },
        { fromIdx: -1, toIdx: 2, progress: 0.42, speed: 0.0034 },
        { fromIdx: -1, toIdx: 4, progress: 0.70, speed: 0.0028 },
        { fromIdx: -1, toIdx: 3, progress: 0.85, speed: 0.0032 },
        { fromIdx: -1, toIdx: 1, progress: 0.58, speed: 0.0026 },
        // Perimeter pulses circulating clockwise
        { fromIdx: 0, toIdx: 2, progress: 0.22, speed: 0.0024 }, // Joy -> Anger
        { fromIdx: 2, toIdx: 4, progress: 0.52, speed: 0.0026 }, // Anger -> Fear
        { fromIdx: 4, toIdx: 3, progress: 0.82, speed: 0.0022 }, // Fear -> Love
        { fromIdx: 3, toIdx: 1, progress: 0.15, speed: 0.0025 }, // Love -> Sadness
        { fromIdx: 1, toIdx: 0, progress: 0.45, speed: 0.0023 }  // Sadness -> Joy
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
        this.isPointerOver = true;
        this.checkHover();
      });

      this.canvas.addEventListener('mouseenter', () => {
        this.isPointerOver = true;
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.mouse.x = -1000;
        this.mouse.y = -1000;
        this.hoveredNode = null;
        this.isPointerOver = false;
        this.canvas.style.cursor = 'default';
      });

      // Clicking an emotion sphere dispatches event to insert sample prompt
      this.canvas.addEventListener('click', () => {
        if (this.hoveredNode) {
          const event = new CustomEvent('emotionNodeSelected', {
            detail: { emotion: this.hoveredNode.id }
          });
          window.dispatchEvent(event);
        }
      });
    }

    /**
     * Configurable rotation controls
     */
    setRotationPeriod(seconds) {
      if (typeof seconds === 'number' && seconds > 0) {
        this.rotationPeriod = seconds;
      }
    }

    setRotationSpeed(multiplier) {
      if (typeof multiplier === 'number' && multiplier >= 0) {
        this.rotationSpeed = multiplier;
      }
    }

    resize() {
      const rect = this.container.getBoundingClientRect();
      const newWidth = Math.floor(rect.width || (window.innerWidth * 0.44));
      const newHeight = Math.floor(rect.height || window.innerHeight);

      if (newWidth <= 0 || newHeight <= 0) return;

      this.width = newWidth;
      this.height = newHeight;

      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

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

      // Responsive proportional scaling
      const scale = Math.min(this.width / 520, this.height / 540);
      const clampedScale = Math.min(Math.max(scale, 0.50), 1.15);

      this.centerHub.x = cx;
      this.centerHub.y = cy;
      this.centerHub.r = Math.max(14 * clampedScale, 11);
      this.currentScale = clampedScale;

      // Safe orbital radius that prevents clipping across all aspect ratios
      const maxRadius = Math.min(this.width * 0.36, this.height * 0.32);
      const orbitRadius = Math.max(Math.min(160 * clampedScale, maxRadius), 78);
      this.orbitRadius = orbitRadius;

      // Calculate rotated coordinates for each node
      this.nodes.forEach((node) => {
        const angle = this.reducedMotion
          ? node.baseAngle
          : node.baseAngle + this.rotationAngle;

        node.x = cx + Math.cos(angle) * orbitRadius;
        node.y = cy + Math.sin(angle) * orbitRadius;
        node.angle = angle;
        node.currentRadius = Math.max(node.radius * clampedScale, 19);
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

        // Cap delta to 100ms to avoid jumps when tab is throttled/switched
        const delta = Math.min(rawDelta, 100);

        // Constant angular velocity: 2*PI radians in (rotationPeriod * 1000) ms
        // At 75 seconds: (2 * Math.PI) / 75000 = ~0.000083776 rad/ms
        const baseAngularVelocity = (Math.PI * 2) / (this.rotationPeriod * 1000);

        // Subtle, calm deceleration when user hovers over canvas or node
        const targetDampener = this.hoveredNode ? 0.35 : (this.isPointerOver ? 0.65 : 1.0);
        this.speedDampener += (targetDampener - this.speedDampener) * Math.min(delta * 0.005, 1.0);

        if (!this.reducedMotion) {
          this.time += delta;
          const angularDelta = baseAngularVelocity * this.rotationSpeed * this.speedDampener * delta;
          this.rotationAngle = (this.rotationAngle + angularDelta) % (Math.PI * 2);
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

      // 1. Deep Pure Black Canvas Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      // 2. Stationary Technical Coordinate Grid & Crosshairs
      this.drawTechnicalGrid(w, h);

      // 3. Concentric Orbital Rings (rotating track + stationary reference frames)
      this.drawOrbitalRings(cx, cy);

      // 4. Rotating Network Particle Cloud
      this.drawParticles(cx, cy);

      // 5. Update Continuous Node Geometry
      this.updateNodePositions();

      // 6. Neural Network Synaptic Edges & Traveling Pulses
      this.drawSynapticNetwork(delta);

      // 7. Stationary Central LSTM Core Nexus
      this.drawLatentHub(cx, cy);

      // 8. The 5 Emotion Spheres (staying upright and readable)
      this.nodes.forEach((node) => {
        this.drawEmotionSphere(node);
      });

      // 9. Stationary Technical Telemetry Overlay
      this.drawTelemetryOverlay(w, h);
    }

    /**
     * Stationary technical background grid with subtle crosshair intersections.
     */
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

      // Crosshairs at key grid intersections
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
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

    /**
     * Network particles that rotate in unison with the neural constellation.
     */
    drawParticles(cx, cy) {
      const ctx = this.ctx;
      const orbitR = this.orbitRadius;
      ctx.save();

      this.particles.forEach((p) => {
        const angle = this.reducedMotion
          ? p.baseAngle
          : p.baseAngle + this.rotationAngle;

        const radialOffset = this.reducedMotion
          ? 0
          : Math.sin(this.time * p.radialWobbleFreq + p.radialPhase) * p.radialWobbleAmp;

        const r = (p.radiusFraction * orbitR) + radialOffset;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;

        const flicker = 0.8 + 0.2 * Math.sin(this.time * p.flickerRate + p.flickerPhase);
        const alpha = p.alpha * flicker;

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    /**
     * Concentric orbital paths: the primary track rotates synchronously
     * with the nodes, while the inner guide and outer boundary provide stability.
     */
    drawOrbitalRings(cx, cy) {
      const ctx = this.ctx;
      const rOrbit = this.orbitRadius;
      const rInner = rOrbit * 0.58;
      const rOuter = rOrbit * 1.36;

      ctx.save();
      ctx.translate(cx, cy);

      // 1. Stationary Outer Technical Boundary Ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Stationary Inner Concentric Ring framing LSTM core
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, rInner, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Rotating Primary Orbital Track (rotates synchronously clockwise)
      ctx.rotate(this.rotationAngle);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, rOrbit, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating Technical Cardinal & Pentagonal Alignment Ticks
      ctx.setLineDash([]);
      const totalTicks = 40;
      for (let i = 0; i < totalTicks; i++) {
        const th = (i * Math.PI * 2) / totalTicks;
        const isMajorTick = i % 8 === 0;
        const tickLength = isMajorTick ? 5 : 2.5;
        const tickAlpha = isMajorTick ? 0.28 : 0.09;

        ctx.strokeStyle = `rgba(255, 255, 255, ${tickAlpha})`;
        const x1 = Math.cos(th) * (rOrbit - tickLength);
        const y1 = Math.sin(th) * (rOrbit - tickLength);
        const x2 = Math.cos(th) * (rOrbit + tickLength);
        const y2 = Math.sin(th) * (rOrbit + tickLength);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      ctx.restore();
    }

    /**
     * Radial synapses from center to nodes, perimeter pentagon edges,
     * inner chords, and traveling energy pulses.
     */
    drawSynapticNetwork(delta) {
      const ctx = this.ctx;
      const cx = this.centerHub.x;
      const cy = this.centerHub.y;
      const deltaFactor = delta / 16.667;

      ctx.save();

      // 1. Subtle Inner Chords (Pentagram Graph Depth)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.setLineDash([1, 5]);
      const chords = [
        [0, 4], [0, 3], [1, 2], [1, 4], [2, 3]
      ];
      chords.forEach(([i1, i2]) => {
        const n1 = this.nodes[i1];
        const n2 = this.nodes[i2];
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      });

      // 2. Radial Synapses from Stationary Center to each Rotating Node
      this.nodes.forEach((node) => {
        const isActive = this.activeEmotion === node.id;
        const isHovered = this.hoveredNode === node;

        ctx.strokeStyle = isActive
          ? 'rgba(255, 255, 255, 0.55)'
          : isHovered
          ? 'rgba(255, 255, 255, 0.35)'
          : 'rgba(255, 255, 255, 0.10)';
        ctx.lineWidth = isActive ? 1.6 : 1;
        ctx.setLineDash(isActive ? [] : [2, 3]);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
      });

      // 3. Perimeter Pentagon Links between Adjacent Rotating Nodes
      ctx.setLineDash([]);
      for (let i = 0; i < this.perimeterOrder.length; i++) {
        const n1 = this.nodes[this.perimeterOrder[i]];
        const n2 = this.nodes[this.perimeterOrder[(i + 1) % this.perimeterOrder.length]];
        const isConnectedToActive = (this.activeEmotion === n1.id || this.activeEmotion === n2.id);

        ctx.strokeStyle = isConnectedToActive
          ? 'rgba(255, 255, 255, 0.18)'
          : 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      }

      // 4. Traveling Synaptic Energy Pulses
      if (!this.reducedMotion) {
        this.pulses.forEach((pulse) => {
          pulse.progress += pulse.speed * deltaFactor;
          if (pulse.progress > 1) pulse.progress -= 1;

          let startX, startY, endX, endY;
          let targetIsActive = false;

          if (pulse.fromIdx === -1) {
            startX = cx;
            startY = cy;
            const targetNode = this.nodes[pulse.toIdx];
            endX = targetNode.x;
            endY = targetNode.y;
            targetIsActive = this.activeEmotion === targetNode.id;
          } else {
            const n1 = this.nodes[pulse.fromIdx];
            const n2 = this.nodes[pulse.toIdx];
            startX = n1.x;
            startY = n1.y;
            endX = n2.x;
            endY = n2.y;
            targetIsActive = (this.activeEmotion === n1.id || this.activeEmotion === n2.id);
          }

          const t = pulse.progress;
          const px = startX + (endX - startX) * t;
          const py = startY + (endY - startY) * t;

          const baseAlpha = Math.sin(t * Math.PI);
          const alphaMultiplier = targetIsActive ? 0.95 : 0.65;
          const pulseAlpha = baseAlpha * alphaMultiplier;

          ctx.fillStyle = `rgba(255, 255, 255, ${pulseAlpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, targetIsActive ? 2.4 : 1.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `rgba(255, 255, 255, ${(pulseAlpha * 0.35).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - (endX - startX) * 0.035, py - (endY - startY) * 0.035);
          ctx.stroke();
        });
      }

      ctx.restore();
    }

    /**
     * Stationary central LSTM nexus hub at (cx, cy).
     */
    drawLatentHub(cx, cy) {
      const ctx = this.ctx;
      const r = this.centerHub.r;
      const pulse = this.reducedMotion ? 1 : 0.90 + 0.10 * Math.sin(this.time * 0.0018);

      ctx.save();
      ctx.translate(cx, cy);

      // Central core disc
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // Pulsating containment ring
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.38 * pulse).toFixed(3)})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Fixed technical reticle crosshairs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, 0);
      ctx.lineTo(r * 0.45, 0);
      ctx.moveTo(0, -r * 0.45);
      ctx.lineTo(0, r * 0.45);
      ctx.stroke();

      // Central core dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Stationary technical label below hub
      ctx.font = '8.5px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.textAlign = 'center';
      ctx.fillText('LSTM_h(t)', 0, r + 13);

      ctx.restore();
    }

    /**
     * Renders each emotion sphere, its glyph, label, and score.
     * Stays strictly upright and readable regardless of orbital position.
     */
    drawEmotionSphere(node) {
      const ctx = this.ctx;
      const r = node.currentRadius;
      const isActive = this.activeEmotion === node.id;
      const isHovered = this.hoveredNode === node;

      ctx.save();
      // Translate to node's position without rotating local coordinate frame
      ctx.translate(node.x, node.y);

      // 1. Concentric Resonance Wave if active or hovered
      if (isActive || isHovered) {
        const waveScale = this.reducedMotion ? 1.22 : 1.08 + 0.22 * ((this.time * 0.0012) % 1);
        const waveAlpha = this.reducedMotion ? 0.35 : 0.45 * (1 - ((this.time * 0.0012) % 1));
        ctx.strokeStyle = `rgba(255, 255, 255, ${waveAlpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, r * waveScale, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 2. Base Sphere Fill with Realistic Monochrome Spherical Gradient
      const grad = ctx.createRadialGradient(
        -r * 0.32, -r * 0.32, r * 0.08,
        0, 0, r
      );
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.22, 'rgba(255, 255, 255, 0.35)');
      grad.addColorStop(0.62, 'rgba(255, 255, 255, 0.07)');
      grad.addColorStop(1, '#000000');

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      // 3. Spherical Rim Contour
      ctx.strokeStyle = isActive
        ? '#ffffff'
        : isHovered
        ? 'rgba(255, 255, 255, 0.85)'
        : 'rgba(255, 255, 255, 0.42)';
      ctx.lineWidth = isActive ? 1.8 : 1.1;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Subtle Orbital Ring around sphere
      ctx.save();
      const ringAngle = this.reducedMotion ? 0.3 : (this.time * 0.0005 + node.baseAngle);
      ctx.rotate(ringAngle);
      ctx.strokeStyle = isActive ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.20)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.3, r * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 5. Minimalist Monochrome Expression Glyph (always upright)
      this.drawExpressionGlyph(node.type, r, isActive || isHovered);

      // 6. Scientific Emotion Label (strictly upright and readable)
      ctx.font = '600 10.5px "JetBrains Mono", monospace';
      ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.88)';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, 0, r + 14);

      // 7. Confidence Score or Node Index (strictly upright)
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = isActive ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.42)';
      if (isActive && this.activeConfidence !== null) {
        ctx.fillText(`${this.activeConfidence.toFixed(1)}%`, 0, r + 24);
      } else {
        ctx.fillText(`[${node.index}]`, 0, r + 23);
      }

      ctx.restore();
    }

    /**
     * Minimalist monochrome vector expression glyphs.
     */
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

    /**
     * Stationary corner telemetry and real engine status overlay.
     * No fabricated FPS or pseudo telemetry.
     */
    drawTelemetryOverlay(w, h) {
      const ctx = this.ctx;
      ctx.save();
      ctx.font = '8.5px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';

      // Header telemetry (stationary top-left)
      ctx.textAlign = 'left';
      ctx.fillText('// LATENT_TOPOLOGY_5D', 16, 20);
      ctx.fillText('STATUS: ONLINE', 16, 32);

      // Top right telemetry (stationary top-right)
      ctx.textAlign = 'right';
      ctx.fillText(`ROTATION: ${this.rotationPeriod.toFixed(1)}s // CW`, w - 16, 20);
      ctx.fillText(`ELAPSED: ${(this.time * 0.001).toFixed(1)}s`, w - 16, 32);

      // Node focus or active prediction indicator (stationary bottom-left)
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
