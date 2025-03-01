class Visualizer {
    constructor(audioAnalyzer, containerId) {
        this.audioAnalyzer = audioAnalyzer;
        this.containerId = containerId;
        this.p5Instance = null;
        this.vizStyle = 'particles';
        this.colorScheme = 'spectrum';
        
        // Visualization properties
        this.particles = [];
        this.maxParticles = 200;
        this.colorPalettes = {
            spectrum: [
                [255, 0, 0], [255, 127, 0], [255, 255, 0], 
                [0, 255, 0], [0, 0, 255], [75, 0, 130], [148, 0, 211]
            ],
            monochrome: [
                [255, 255, 255], [200, 200, 200], [150, 150, 150], 
                [100, 100, 100], [50, 50, 50]
            ],
            pastel: [
                [255, 209, 220], [181, 234, 215], [199, 206, 234], 
                [233, 179, 152], [254, 249, 199]
            ]
        };
    }
    
    init() {
        const sketch = (p) => {
            p.setup = () => {
                const container = document.getElementById(this.containerId);
                const width = container.offsetWidth;
                const height = container.offsetHeight;
                
                const canvas = p.createCanvas(width, height);
                canvas.parent(this.containerId);
                
                // Initialize particles
                this.initParticles(p);
                
                p.colorMode(p.RGB);
                p.noStroke();
                p.frameRate(60);
            };
            
            p.draw = () => {
                p.background(0, 0, 0, 25); // Semi-transparent background for trails
                
                if (!this.audioAnalyzer.isPlaying) {
                    this.drawIdleState(p);
                    return;
                }
                
                // Get audio data
                const freqData = this.audioAnalyzer.getFrequencyData();
                const avgVolume = this.audioAnalyzer.getAverageVolume();
                const bassLevel = this.audioAnalyzer.getBassLevel();
                const midLevel = this.audioAnalyzer.getMidLevel();
                const highLevel = this.audioAnalyzer.getHighLevel();
                const isBeat = this.audioAnalyzer.detectBeat();
                
                // Render based on selected visualization style
                switch (this.vizStyle) {
                    case 'particles':
                        this.drawParticles(p, avgVolume, bassLevel, midLevel, highLevel, isBeat);
                        break;
                    case 'waves':
                        this.drawWaves(p, freqData, avgVolume, isBeat);
                        break;
                    case 'geometric':
                        this.drawGeometric(p, freqData, avgVolume, bassLevel, midLevel, highLevel, isBeat);
                        break;
                    default:
                        this.drawParticles(p, avgVolume, bassLevel, midLevel, highLevel, isBeat);
                }
            };
            
            p.windowResized = () => {
                const container = document.getElementById(this.containerId);
                const width = container.offsetWidth;
                const height = container.offsetHeight;
                p.resizeCanvas(width, height);
                
                // Reinitialize particles when canvas resizes
                this.initParticles(p);
            };
        };
        
        this.p5Instance = new p5(sketch);
    }
    
    initParticles(p) {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: p.random(p.width),
                y: p.random(p.height),
                size: p.random(2, 8),
                speedX: p.random(-1, 1),
                speedY: p.random(-1, 1),
                color: this.getRandomColor(p)
            });
        }
    }
    
    drawIdleState(p) {
        p.fill(100);
        p.textSize(24);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('Select audio and press play to start visualization', p.width/2, p.height/2);
    }
    
    drawParticles(p, avgVolume, bassLevel, midLevel, highLevel, isBeat) {
        const centerX = p.width / 2;
        const centerY = p.height / 2;
        
        // Adjust particle behavior based on audio
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            // Update position with some noise
            particle.x += particle.speedX * (avgVolume * 10 + 1);
            particle.y += particle.speedY * (avgVolume * 10 + 1);
            
            // Add some spiral motion based on bass
            const angle = p.atan2(particle.y - centerY, particle.x - centerX);
            const distance = p.dist(centerX, centerY, particle.x, particle.y);
            
            particle.x += p.cos(angle + bassLevel) * bassLevel * 2;
            particle.y += p.sin(angle + bassLevel) * bassLevel * 2;
            
            // Change direction occasionally
            if (p.random() < 0.02 || isBeat) {
                particle.speedX = p.random(-1, 1);
                particle.speedY = p.random(-1, 1);
            }
            
            // Keep particles on screen with wrap-around
            if (particle.x < 0) particle.x = p.width;
            if (particle.x > p.width) particle.x = 0;
            if (particle.y < 0) particle.y = p.height;
            if (particle.y > p.height) particle.y = 0;
            
            // Draw the particle
            const size = particle.size * (1 + avgVolume * 3);
            if (isBeat) {
                // Flash on beat
                p.fill(255);
                p.circle(particle.x, particle.y, size * 1.5);
            } else {
                const c = particle.color;
                // Adjust brightness based on frequencies
                p.fill(
                    c[0] * (0.5 + highLevel),
                    c[1] * (0.5 + midLevel),
                    c[2] * (0.5 + bassLevel),
                    200 + avgVolume * 55
                );
                p.circle(particle.x, particle.y, size);
            }
        }
    }
    
    drawWaves(p, freqData, avgVolume, isBeat) {
        p.stroke(255);
        p.noFill();
        
        const bands = 8; // Number of frequency bands to visualize
        const bandSize = Math.floor(freqData.length / bands);
        
        // Draw center-based waves
        const centerX = p.width / 2;
        const centerY = p.height / 2;
        
        // Draw multiple circular waves based on frequency bands
        for (let band = 0; band < bands; band++) {
            p.beginShape();
            
            // Get average magnitude for this band
            let sum = 0;
            for (let i = band * bandSize; i < (band + 1) * bandSize; i++) {
                sum += freqData[i];
            }
            const avg = sum / bandSize / 255; // Normalize to 0-1
            
            // Base radius and amplitude for this band
            const baseRadius = (p.width / 3) * (band / bands);
            const amplitude = 50 * avg;
            
            p.stroke(this.getColorFromPalette(p, band / bands));
            p.strokeWeight(2 + avg * 3);
            
            if (isBeat && band % 2 === 0) {
                // Extra pulse on beat for some bands
                p.strokeWeight(4 + avg * 5);
            }
            
            // Draw circular shape
            for (let angle = 0; angle < p.TWO_PI; angle += 0.1) {
                const xOffset = p.cos(angle + p.frameCount * 0.01) * amplitude;
                const yOffset = p.sin(angle + p.frameCount * 0.01) * amplitude;
                
                const xPos = centerX + p.cos(angle) * (baseRadius + xOffset);
                const yPos = centerY + p.sin(angle) * (baseRadius + yOffset);
                
                p.curveVertex(xPos, yPos);
            }
            
            p.endShape(p.CLOSE);
        }
    }
    
    drawGeometric(p, freqData, avgVolume, bassLevel, midLevel, highLevel, isBeat) {
        const centerX = p.width / 2;
        const centerY = p.height / 2;
        
        // Base size scaled by volume
        const baseSize = p.min(p.width, p.height) * 0.3 * (0.5 + avgVolume);
        
        // Modify rotation based on bass
        const rotation = p.frameCount * 0.01 + bassLevel * p.PI;
        
        // Number of shapes based on mid frequencies
        const numShapes = 3 + Math.floor(midLevel * 5);
        
        p.push();
        p.translate(centerX, centerY);
        p.rotate(rotation);
        
        // Draw multiple geometric shapes
        for (let i = 0; i < numShapes; i++) {
            // Determine color based on frequency band
            const colorVal = this.getColorFromPalette(p, i / numShapes);
            
            // Make shapes pulse with beat
            const shapePulse = isBeat ? 1.2 : 1.0;
            
            // Size based on frequency band
            const sizeRatio = (i + 1) / numShapes;
            const bandSize = Math.floor(freqData.length / numShapes);
            
            // Get frequency data for this shape
            let sum = 0;
            for (let j = i * bandSize; j < (i + 1) * bandSize; j++) {
                sum += freqData[j % freqData.length];
            }
            const bandAvg = sum / bandSize / 255; // Normalize to 0-1
            
            const size = baseSize * sizeRatio * (0.5 + bandAvg) * shapePulse;
            
            // Alternate between shapes
            p.push();
            p.rotate(i * p.TWO_PI / numShapes);
            
            if (i % 3 === 0) {
                // Triangle
                p.fill(colorVal[0], colorVal[1], colorVal[2], 150 + bandAvg * 105);
                p.noStroke();
                p.beginShape();
                for (let j = 0; j < 3; j++) {
                    const angle = j * p.TWO_PI / 3;
                    const x = p.cos(angle) * size;
                    const y = p.sin(angle) * size;
                    p.vertex(x, y);
                }
                p.endShape(p.CLOSE);
            } else if (i % 3 === 1) {
                // Rectangle
                p.fill(colorVal[0], colorVal[1], colorVal[2], 150 + bandAvg * 105);
                p.noStroke();
                p.rectMode(p.CENTER);
                p.rect(0, 0, size * 1.5, size * 1.5, size * 0.2);
            } else {
                // Circle
                p.noFill();
                p.stroke(colorVal[0], colorVal[1], colorVal[2], 200 + bandAvg * 55);
                p.strokeWeight(2 + bandAvg * 4);
                p.circle(0, 0, size * 2);
            }
            
            p.pop();
        }
        
        // Add center point that pulses with bass
        if (bassLevel > 0.5 || isBeat) {
            p.fill(255);
            p.noStroke();
            p.circle(0, 0, 10 + bassLevel * 40);
        }
        
        p.pop();
    }
    
    getRandomColor(p) {
        const palette = this.colorPalettes[this.colorScheme];
        return palette[Math.floor(p.random(palette.length))];
    }
    
    getColorFromPalette(p, position) {
        const palette = this.colorPalettes[this.colorScheme];
        const index = Math.floor(position * palette.length) % palette.length;
        return palette[index];
    }
    
    setVisualizationStyle(style) {
        this.vizStyle = style;
    }
    
    setColorScheme(scheme) {
        this.colorScheme = scheme;
    }
} 