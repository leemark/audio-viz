document.addEventListener('DOMContentLoaded', () => {
    // Create instances of the audio analyzer and visualizer
    const audioAnalyzer = new AudioAnalyzer();
    const visualizer = new Visualizer(audioAnalyzer, 'visualization-container');
    
    // Initialize visualizer
    visualizer.init();
    
    // DOM elements
    const uploadInput = document.getElementById('audio-upload');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const volumeSlider = document.getElementById('volume');
    const sampleContainer = document.getElementById('sample-container');
    const vizStyleSelect = document.getElementById('viz-style');
    const colorSchemeSelect = document.getElementById('color-scheme');
    
    // Sample audio files
    const sampleAudios = [
        { name: 'Sample 1', url: 'assets/audio/sample1.mp3' },
        { name: 'Sample 2', url: 'assets/audio/sample2.mp3' }
    ];
    
    // Create sample buttons
    sampleAudios.forEach(sample => {
        const btn = document.createElement('button');
        btn.className = 'sample-btn';
        btn.textContent = sample.name;
        btn.addEventListener('click', () => {
            if (audioAnalyzer.loadSampleAudio(sample.url)) {
                enablePlaybackControls();
            }
        });
        sampleContainer.appendChild(btn);
    });
    
    // Event handlers
    uploadInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (audioAnalyzer.loadAudioFile(file)) {
                enablePlaybackControls();
            }
        }
    });
    
    playBtn.addEventListener('click', () => {
        audioAnalyzer.play();
    });
    
    pauseBtn.addEventListener('click', () => {
        audioAnalyzer.pause();
    });
    
    volumeSlider.addEventListener('input', (e) => {
        audioAnalyzer.setVolume(parseFloat(e.target.value));
    });
    
    vizStyleSelect.addEventListener('change', (e) => {
        visualizer.setVisualizationStyle(e.target.value);
    });
    
    colorSchemeSelect.addEventListener('change', (e) => {
        visualizer.setColorScheme(e.target.value);
    });
    
    // Enable play/pause buttons when audio is loaded
    function enablePlaybackControls() {
        playBtn.disabled = false;
        pauseBtn.disabled = false;
    }
    
    // Create tracking files for development
    createDevelopmentFiles();
});

function createDevelopmentFiles() {
    // This would normally be handled by a backend, but we're simulating it
    console.log('Development tracking files would be created here in a real environment');
    
    /* 
    In a real environment with file system access, we would create:
    
    1. DEVELOPMENT_LOG.md:
    ```
    # Development Log
    
    ## [Date Time]
    - Initial project setup complete
    - Created HTML structure, CSS styling, and JavaScript files
    - Implemented Web Audio API analysis with beat detection
    - Added p5.js visualization with three styles: particles, waves, and geometric
    - Next steps: Add more sample audio files and refine visualizations
    ```
    
    2. CURSOR_CONTEXT.md:
    ```
    # Project Context
    
    ## Current Status
    - Implementing audio-reactive generative art web app
    - Basic functionality complete
    
    ## Working Features
    - Audio file upload
    - Sample audio selection
    - Three visualization styles
    - Color scheme selection
    - Audio analysis (volume, frequencies, beat detection)
    
    ## To Implement
    - Add more sample audio files
    - Refine visualization styles
    - Optimize performance
    
    ## Database/Model State
    - N/A (client-side only application)
    ```
    */
} 