/**
 * Confetti animation for celebration
 * Simple lightweight confetti effect
 */

// Create confetti module
const confetti = {
  maxCount: 100, // Max confetti count (reduced from 150)
  speed: 4, // Animation speed (increased from 3)
  frameInterval: 15, // Frame interval
  alpha: 0.8, // Alpha transparency (reduced from 1.0)
  gradient: false, // Whether to use gradients
  start: null, // Start function (created below)
  stop: null, // Stop function (created below)
  toggle: null, // Toggle function (created below)
  pause: null, // Pause function (created below)
  resume: null, // Resume function (created below)
  togglePause: null, // Toggle pause function (created below)
  clear: null, // Clear function (added)
};

// Initialize confetti
(function () {
  confetti.start = startConfetti;
  confetti.stop = stopConfetti;
  confetti.toggle = toggleConfetti;
  confetti.pause = pauseConfetti;
  confetti.resume = resumeConfetti;
  confetti.togglePause = toggleConfettiPause;
  confetti.clear = clearConfetti; // Added clear method

  let colors = ["#5d8cf7", "#a174f2", "#f675da", "#f2748c", "#f29b74"];
  let streamingConfetti = false;
  let animationTimer = null;
  let pause = false;
  let lastFrameTime = Date.now();
  let particles = [];
  let waveAngle = 0;

  // Get canvas and context or create them
  function setCanvasElement() {
    const container = document.getElementById("confetti-container");
    if (!container) return false;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("id", "confetti-canvas");
    canvas.setAttribute(
      "style",
      "position:absolute;top:0;left:0;pointer-events:none;z-index:9999;width:100%;height:100%"
    );
    container.appendChild(canvas);

    const context = canvas.getContext("2d");
    if (!context) {
      container.removeChild(canvas);
      return false;
    }

    window.addEventListener(
      "resize",
      function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      },
      true
    );

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    return { canvas, context };
  }

  // Create a confetti particle
  function createParticle(context) {
    const colors = confetti.colors || [
      "rgba(30, 144, 255, " + confetti.alpha + ")",
      "rgba(107, 142, 35, " + confetti.alpha + ")",
      "rgba(255, 215, 0, " + confetti.alpha + ")",
      "rgba(255, 105, 180, " + confetti.alpha + ")",
      "rgba(138, 43, 226, " + confetti.alpha + ")",
      "rgba(0, 191, 255, " + confetti.alpha + ")",
    ];

    const colorIndex = Math.floor(Math.random() * colors.length);
    const color = colors[colorIndex];

    return {
      color: color,
      x: Math.random() * window.innerWidth,
      y: Math.random() * -window.innerHeight,
      diameter: Math.random() * 10 + 5,
      tilt: Math.random() * 10 - 10,
      tiltAngleIncrement: Math.random() * 0.07 + 0.05,
      tiltAngle: Math.random() * Math.PI,
    };
  }

  // Draw confetti on canvas
  function drawParticles(context) {
    const particle = {};
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < confetti.maxCount; i++) {
      particle.color = colors[Math.floor(Math.random() * colors.length)];
      particle.x = Math.random() * width;
      particle.y = Math.random() * height - height;
      particle.diameter = Math.random() * 10 + 5;
      particle.tilt = Math.random() * 10 - 10;
      particle.tiltAngleIncrement = Math.random() * 0.07 + 0.05;
      particle.tiltAngle = Math.random() * Math.PI;
      particles.push(particle);
    }
  }

  // Update and animate confetti
  function updateParticles() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const timestamp = Date.now();
    const delta = timestamp - lastFrameTime;
    waveAngle += 0.01;
    lastFrameTime = timestamp;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dx = Math.sin(p.tiltAngle) * 2;
      p.x += dx;
      p.y += (Math.cos(waveAngle + p.diameter) + confetti.speed) * 0.5;
      p.tiltAngle += p.tiltAngleIncrement;

      // If particle falls out of screen, reset it
      if (p.x > width + 20 || p.x < -20 || p.y > height) {
        if (streamingConfetti && particles.length <= confetti.maxCount) {
          // Replace particle
          particles[i] = createParticle();
          particles[i].x = Math.random() * width;
          particles[i].y = -10;
        } else {
          // Remove particle
          particles.splice(i, 1);
          i--;
        }
      }
    }
  }

  // Draw frame of confetti animation
  function drawFrame() {
    const canvasContext = setCanvasElement();
    if (!canvasContext) return;

    const { context, canvas } = canvasContext;

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each particle
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const brightness = p.brightness || 1;

      context.beginPath();
      context.lineWidth = p.diameter;
      context.strokeStyle = p.color;

      // Draw rectangles for confetti pieces
      const x = p.x + p.tilt;
      const y = p.y + p.tilt;
      context.moveTo(x + p.diameter / 2, y);
      context.lineTo(x, y + p.tilt + p.diameter / 2);
      context.stroke();
    }

    updateParticles();

    // Keep animation going if confetti is streaming
    if (particles.length > 0 || streamingConfetti) {
      animationTimer = requestAnimationFrame(drawFrame);
    }
  }

  // Start confetti animation
  function startConfetti() {
    const canvasContext = setCanvasElement();
    if (!canvasContext) return;

    streamingConfetti = true;
    particles = [];
    drawParticles();
    drawFrame();
  }

  // Stop confetti animation
  function stopConfetti() {
    streamingConfetti = false;
    if (animationTimer) {
      cancelAnimationFrame(animationTimer);
      animationTimer = null;
    }

    // Clear canvas
    const container = document.getElementById("confetti-container");
    const canvas = document.getElementById("confetti-canvas");
    if (canvas) {
      container.removeChild(canvas);
    }
  }

  // Toggle confetti animation
  function toggleConfetti() {
    if (streamingConfetti) {
      stopConfetti();
    } else {
      startConfetti();
    }
  }

  // Pause confetti animation
  function pauseConfetti() {
    pause = true;
  }

  // Resume confetti animation
  function resumeConfetti() {
    pause = false;
    drawFrame();
  }

  // Toggle pause state
  function toggleConfettiPause() {
    if (pause) {
      resumeConfetti();
    } else {
      pauseConfetti();
    }
  }

  // Clear all confetti particles and remove canvas
  function clearConfetti() {
    // Stop streaming if active
    streamingConfetti = false;

    // Cancel animation frame if active
    if (animationTimer) {
      cancelAnimationFrame(animationTimer);
      animationTimer = null;
    }

    // Clear particles array
    particles = [];

    // Remove the canvas element
    const container = document.getElementById("confetti-container");
    const canvas = document.getElementById("confetti-canvas");
    if (canvas) {
      container.removeChild(canvas);
    }
  }
})();
