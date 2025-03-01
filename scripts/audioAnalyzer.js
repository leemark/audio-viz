class AudioAnalyzer {
    constructor() {
        this.audioContext = null;
        this.source = null;
        this.analyzer = null;
        this.gainNode = null;
        this.audioElement = null;
        this.isInitialized = false;
        this.isPlaying = false;
        
        // Analysis data
        this.fftSize = 1024;
        this.dataArray = null;
        this.bufferLength = 0;
        
        // Beat detection properties
        this.beatDetectionThreshold = 0.15;
        this.beatCutOff = 0;
        this.beatDecayRate = 0.98;
        this.beatMinVol = 0.2;
        this.beatHoldTime = 30;
        this.beatHoldCounter = 0;
        this.beatTime = 0;
        this.isBeat = false;
    }
    
    init() {
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create audio element
            this.audioElement = document.createElement('audio');
            this.audioElement.crossOrigin = 'anonymous';
            document.body.appendChild(this.audioElement);
            
            // Create analyzer node
            this.analyzer = this.audioContext.createAnalyser();
            this.analyzer.fftSize = this.fftSize;
            this.bufferLength = this.analyzer.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            
            // Create gain node for volume control
            this.gainNode = this.audioContext.createGain();
            
            // Create source from audio element
            this.source = this.audioContext.createMediaElementSource(this.audioElement);
            
            // Connect nodes
            this.source.connect(this.analyzer);
            this.analyzer.connect(this.gainNode);
            this.gainNode.connect(this.audioContext.destination);
            
            // Set initial volume
            this.setVolume(0.7);
            
            this.isInitialized = true;
            
            console.log('Audio analyzer initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing audio analyzer:', error);
            return false;
        }
    }
    
    loadAudioFile(file) {
        if (!this.isInitialized) {
            if (!this.init()) return false;
        }
        
        const fileURL = URL.createObjectURL(file);
        this.audioElement.src = fileURL;
        return true;
    }
    
    loadSampleAudio(url) {
        if (!this.isInitialized) {
            if (!this.init()) return false;
        }
        
        this.audioElement.src = url;
        return true;
    }
    
    play() {
        if (!this.isInitialized || !this.audioElement.src) return false;
        
        // Resume audio context if it's suspended (browsers often require user interaction)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.audioElement.play()
            .then(() => {
                this.isPlaying = true;
                console.log('Audio playback started');
            })
            .catch(error => {
                console.error('Error playing audio:', error);
            });
            
        return true;
    }
    
    pause() {
        if (!this.isInitialized || !this.isPlaying) return false;
        
        this.audioElement.pause();
        this.isPlaying = false;
        
        return true;
    }
    
    setVolume(value) {
        if (!this.isInitialized) return false;
        
        this.gainNode.gain.value = value;
        return true;
    }
    
    getFrequencyData() {
        if (!this.isInitialized) return null;
        
        this.analyzer.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }
    
    getAverageVolume() {
        const data = this.getFrequencyData();
        if (!data) return 0;
        
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }
        return sum / data.length / 255; // Normalize to 0-1
    }
    
    getBassLevel() {
        const data = this.getFrequencyData();
        if (!data) return 0;
        
        // Get average of bass frequencies (approximately first 10% of frequency data)
        const bassRange = Math.floor(data.length * 0.1);
        let sum = 0;
        
        for (let i = 0; i < bassRange; i++) {
            sum += data[i];
        }
        
        return sum / bassRange / 255; // Normalize to 0-1
    }
    
    getMidLevel() {
        const data = this.getFrequencyData();
        if (!data) return 0;
        
        // Get average of mid frequencies (approximately 10%-70% of frequency data)
        const startIndex = Math.floor(data.length * 0.1);
        const endIndex = Math.floor(data.length * 0.7);
        let sum = 0;
        
        for (let i = startIndex; i < endIndex; i++) {
            sum += data[i];
        }
        
        return sum / (endIndex - startIndex) / 255; // Normalize to 0-1
    }
    
    getHighLevel() {
        const data = this.getFrequencyData();
        if (!data) return 0;
        
        // Get average of high frequencies (approximately last 30% of frequency data)
        const startIndex = Math.floor(data.length * 0.7);
        let sum = 0;
        
        for (let i = startIndex; i < data.length; i++) {
            sum += data[i];
        }
        
        return sum / (data.length - startIndex) / 255; // Normalize to 0-1
    }
    
    detectBeat() {
        const currentVolume = this.getAverageVolume();
        
        // Check if volume passes threshold and is higher than minimum
        if (currentVolume > this.beatCutOff && currentVolume > this.beatMinVol) {
            this.beatCutOff = currentVolume * 1.1;
            this.beatTime = 0;
            this.isBeat = true;
        } else {
            // No beat - decay the cutoff
            if (this.beatTime <= this.beatHoldTime) {
                this.beatTime++;
            } else {
                this.beatCutOff *= this.beatDecayRate;
                this.beatCutOff = Math.max(this.beatCutOff, this.beatMinVol);
            }
            this.isBeat = false;
        }
        
        return this.isBeat;
    }
} 