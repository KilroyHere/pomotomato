import { useEffect, useRef } from 'react';
import '../styles/AnimatedBackground.css';

// Define SVG noise pattern for grainy texture
const NoiseSVG = `
<svg viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'>
  <filter id='noiseFilter'>
    <feTurbulence 
      type='fractalNoise' 
      baseFrequency='0.85' 
      numOctaves='3' 
      stitchTiles='stitch'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#noiseFilter)'/>
</svg>
`;

interface AnimatedBlob {
  x: number;
  y: number;
  radius: number;
  baseRadius: number;  // Original radius value to use for pulsing
  color: string;
  vx: number;
  vy: number;
  phase: number;
  complexity: number;    // Controls the shape complexity
  amplitude: number;     // Controls the wobble amount
  blur: number;          // Controls edge blur amount
  pulseSpeed: number;    // Speed of pulsing
  morphSpeed: number;    // Speed of shape changing
}

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // Set canvas to window size
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    // Define blobs with different colors and properties
    const blobs: AnimatedBlob[] = [
      {
        x: width * 0.3,
        y: height * 0.4,
        radius: Math.min(width, height) * 0.42,
        baseRadius: Math.min(width, height) * 0.42,
        color: '#9333ea90', // Purple with transparency
        vx: 0.25,
        vy: 0.18,
        phase: 0,
        complexity: 1.5,   // Simpler shape
        amplitude: 0.4,    // More wobble
        blur: 180,         // Much more blur
        pulseSpeed: 0.01,  // Slower pulsing
        morphSpeed: 0.008   // Slower morphing
      },
      {
        x: width * 0.7,
        y: height * 0.6,
        radius: Math.min(width, height) * 0.36,
        baseRadius: Math.min(width, height) * 0.36,
        color: '#d946ef90', // Pink with transparency
        vx: -0.22,
        vy: 0.16,
        phase: 2,
        complexity: 2,     // Simple shape
        amplitude: 0.35,   // High wobble
        blur: 170,         // Much more blur
        pulseSpeed: 0.009, // Slower pulsing
        morphSpeed: 0.006   // Slower morphing
      },
      {
        x: width * 0.5,
        y: height * 0.3,
        radius: Math.min(width, height) * 0.3,
        baseRadius: Math.min(width, height) * 0.3,
        color: '#4f46e590', // Indigo with transparency
        vx: 0.2,
        vy: -0.23,
        phase: 4,
        complexity: 1.8,   // Simple shape
        amplitude: 0.38,   // High wobble
        blur: 190,         // Much more blur
        pulseSpeed: 0.011, // Slower pulsing
        morphSpeed: 0.007  // Slower morphing
      },
      {
        x: width * 0.2,
        y: height * 0.7,
        radius: Math.min(width, height) * 0.336,
        baseRadius: Math.min(width, height) * 0.336,
        color: '#7e22ce90', // Deep purple with transparency
        vx: -0.17,
        vy: -0.2,
        phase: 6,
        complexity: 1.7,   // Simple shape
        amplitude: 0.4,    // High wobble
        blur: 160,         // Much more blur
        pulseSpeed: 0.008, // Slower pulsing
        morphSpeed: 0.01   // Morphing speed
      },
      {
        x: width * 0.8,
        y: height * 0.2,
        radius: Math.min(width, height) * 0.38,
        baseRadius: Math.min(width, height) * 0.38,
        color: '#6366f190', // Blue with transparency
        vx: -0.15,
        vy: 0.22,
        phase: 3,
        complexity: 1.6,   // Simple shape
        amplitude: 0.42,   // More wobble
        blur: 175,         // Much more blur
        pulseSpeed: 0.012, // Slower pulsing
        morphSpeed: 0.009  // Morphing speed
      },
      {
        x: width * 0.1,
        y: height * 0.5,
        radius: Math.min(width, height) * 0.34,
        baseRadius: Math.min(width, height) * 0.34,
        color: '#c026d390', // Magenta with transparency
        vx: 0.18,
        vy: -0.16,
        phase: 5,
        complexity: 1.9,   // Simple shape
        amplitude: 0.36,   // High wobble
        blur: 165,         // Much more blur
        pulseSpeed: 0.01,  // Slower pulsing
        morphSpeed: 0.008  // Morphing speed
      }
    ];

    // Animation loop
    let time = 0;
    const animate = () => {
      // Update time
      time += 0.005; // Much slower time progression
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Fill background
      ctx.fillStyle = '#0e0222';
      ctx.fillRect(0, 0, width, height);
      
      // Set blend mode for glow effect
      ctx.globalCompositeOperation = 'lighter';
      
      // Draw each blob
      blobs.forEach(blob => {
        // Update position
        blob.x += blob.vx;
        blob.y += blob.vy;
        
        // Bounce off edges with much less padding to allow blobs to move all the way to the edges
        if (blob.x + blob.radius * 0.1 < 0 || blob.x - blob.radius * 0.1 > width) {
          blob.vx *= -1;
          // Reposition slightly to prevent getting stuck
          blob.x += blob.vx * 2;
        }
        if (blob.y + blob.radius * 0.1 < 0 || blob.y - blob.radius * 0.1 > height) {
          blob.vy *= -1;
          // Reposition slightly to prevent getting stuck
          blob.y += blob.vy * 2;
        }
        
        // Randomly change direction very occasionally
        if (Math.random() < 0.0005) {
          blob.vx *= -1;
        }
        if (Math.random() < 0.0005) {
          blob.vy *= -1;
        }
        
        // Update phase for wobble effect
        blob.phase += blob.morphSpeed;
        
        // Pulse the radius - each blob pulses at different rates
        // More dramatic size changes
        blob.radius = blob.baseRadius * (1 + Math.sin(time * blob.pulseSpeed) * 0.3);
        
        // Create shadow for blur effect - vary blur over time
        ctx.shadowColor = blob.color;
        ctx.shadowBlur = blob.blur + Math.sin(time * 0.8) * 15;
        
        // Draw blob with wobble
        ctx.beginPath();
        
        // Create a more organic shape
        const numPoints = 80; // Fewer points for more dramatic changes
        const angleStep = (Math.PI * 2) / numPoints;
        
        for (let i = 0; i < numPoints; i++) {
          const angle = i * angleStep;
          
          // More dramatic wobble
          const wobble = 
            Math.sin(angle * blob.complexity + blob.phase) * (blob.radius * blob.amplitude) + 
            Math.sin(angle * (blob.complexity * 0.5) + blob.phase * 2.5) * (blob.radius * blob.amplitude * 0.8) +
            Math.sin(angle * (blob.complexity * 0.8) + blob.phase * 3.2) * (blob.radius * blob.amplitude * 0.6);
          
          const dist = blob.radius + wobble;
          const x = blob.x + Math.cos(angle) * dist;
          const y = blob.y + Math.sin(angle) * dist;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            // Use bezier curves for even smoother shapes with more variation
            if (i % 3 === 0) { // Add extra curves periodically
              const prevAngle = (i - 1) * angleStep;
              const prevWobble = 
                Math.sin(prevAngle * blob.complexity + blob.phase) * (blob.radius * blob.amplitude) + 
                Math.sin(prevAngle * (blob.complexity * 0.5) + blob.phase * 2.5) * (blob.radius * blob.amplitude * 0.8) +
                Math.sin(prevAngle * (blob.complexity * 0.8) + blob.phase * 3.2) * (blob.radius * blob.amplitude * 0.6);
              
              const prevDist = blob.radius + prevWobble;
              const prevX = blob.x + Math.cos(prevAngle) * prevDist;
              const prevY = blob.y + Math.sin(prevAngle) * prevDist;
              
              // Create control points with more variation
              const cp1X = prevX + (x - prevX) * 0.4 + Math.sin(time + i) * 10;
              const cp1Y = prevY + (y - prevY) * 0.4 + Math.cos(time + i) * 10;
              const cp2X = prevX + (x - prevX) * 0.6 + Math.cos(time + i) * 10;
              const cp2Y = prevY + (y - prevY) * 0.6 + Math.sin(time + i) * 10;
              
              ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, x, y);
            } else {
              // Simple quadratic curve for other points
              const prevAngle = (i - 1) * angleStep;
              const prevWobble = 
                Math.sin(prevAngle * blob.complexity + blob.phase) * (blob.radius * blob.amplitude) + 
                Math.sin(prevAngle * (blob.complexity * 0.5) + blob.phase * 2.5) * (blob.radius * blob.amplitude * 0.8) +
                Math.sin(prevAngle * (blob.complexity * 0.8) + blob.phase * 3.2) * (blob.radius * blob.amplitude * 0.6);
              
              const prevDist = blob.radius + prevWobble;
              const prevX = blob.x + Math.cos(prevAngle) * prevDist;
              const prevY = blob.y + Math.sin(prevAngle) * prevDist;
              
              const cpX = (prevX + x) / 2 + Math.sin(time * 0.5 + i) * 5;
              const cpY = (prevY + y) / 2 + Math.cos(time * 0.5 + i) * 5;
              
              ctx.quadraticCurveTo(cpX, cpY, x, y);
            }
          }
        }
        
        ctx.closePath();
        
        // Create gradient with multiple color stops for more dimension
        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, blob.radius * 2.5
        );
        
        // More color stops for richer appearance with more transparency
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(0.3, blob.color.substring(0, 7) + '88'); // 50% opacity
        gradient.addColorStop(0.6, blob.color.substring(0, 7) + '44'); // 25% opacity
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Reset shadow to prevent affecting other elements
        ctx.shadowBlur = 0;
      });
      
      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
      
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="animated-background">
      <canvas ref={canvasRef} className="blob-canvas"></canvas>
      <div className="overlay"></div>
    </div>
  );
};

export default AnimatedBackground; 