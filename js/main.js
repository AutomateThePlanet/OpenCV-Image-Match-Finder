document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        locatorInput: document.getElementById('locatorInput'),
        contextInput: document.getElementById('contextInput'),
        clearLocator: document.getElementById('clearLocator'),
        clearContext: document.getElementById('clearContext'),
        clearResults: document.getElementById('clearResults'),
        findButton: document.getElementById('findButton'),
        locatorCanvas: document.getElementById('locatorCanvas'),
        contextCanvas: document.getElementById('contextCanvas'),
        resultCanvas: document.getElementById('resultCanvas'),
        pasteLocator: document.getElementById('pasteLocator'),
        pasteContext: document.getElementById('pasteContext'),
        thresholdSlider: document.getElementById('threshold'),
        thresholdValue: document.getElementById('thresholdValue')
    };

    // Update threshold value display
    elements.thresholdSlider.addEventListener('input', function() {
        elements.thresholdValue.textContent = `${this.value}%`;
    });

    // Global paste event listener
    document.addEventListener('paste', (e) => {
        // Determine which canvas to paste to based on last focused input
        const activeElement = document.activeElement;
        if (activeElement === elements.locatorInput) {
            handleClipboardPaste(e, elements.locatorCanvas, elements.locatorInput);
        } else if (activeElement === elements.contextInput) {
            handleClipboardPaste(e, elements.contextCanvas, elements.contextInput);
        } else {
            // Default to context if no input is focused
            handleClipboardPaste(e, elements.contextCanvas, elements.contextInput);
        }
    });

    // Paste button click handlers
    elements.pasteLocator.addEventListener('click', () => {
        handlePasteButtonClick(elements.locatorInput, elements.locatorCanvas);
    });

    elements.pasteContext.addEventListener('click', () => {
        handlePasteButtonClick(elements.contextInput, elements.contextCanvas);
    });

    // Input change handlers
    [elements.locatorInput, elements.contextInput].forEach(input => {
        input.addEventListener('input', async () => {
            try {
                await loadImageToCanvas(
                    input.value,
                    input === elements.locatorInput ? elements.locatorCanvas : elements.contextCanvas
                );
            } catch (error) {
                console.error('Error loading image:', error);
                updateStatus('Error loading image. Please check the data.', 'error');
            }
        });
    });

    // Clear button handlers
    elements.clearLocator.addEventListener('click', () => {
        elements.locatorInput.value = '';
        clearCanvas(elements.locatorCanvas);
    });

    elements.clearContext.addEventListener('click', () => {
        elements.contextInput.value = '';
        clearCanvas(elements.contextCanvas);
    });

    elements.clearResults.addEventListener('click', () => {
        clearCanvas(elements.resultCanvas);
        updateStatus('Results cleared', 'success');
    });

    // Find button handler
    elements.findButton.addEventListener('click', () => {
        const threshold = parseInt(elements.thresholdSlider.value) / 100;
        findImageMatch(threshold);
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to find match
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            const threshold = parseInt(elements.thresholdSlider.value) / 100;
            findImageMatch(threshold);
        }
        
        // Escape to clear results
        if (e.key === 'Escape') {
            clearCanvas(elements.resultCanvas);
            updateStatus('Results cleared', 'success');
        }
    });
    
    // Drag and drop handlers
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Handle file drop
    document.addEventListener('drop', async (e) => {
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64data = event.target.result;
                // Default to context image for drops
                elements.contextInput.value = base64data;
                try {
                    await loadImageToCanvas(base64data, elements.contextCanvas);
                    updateStatus('Image dropped successfully', 'success');
                } catch (error) {
                    console.error('Error loading dropped image:', error);
                    updateStatus('Error loading dropped image.', 'error');
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Add hover effect for drag and drop
    document.addEventListener('dragenter', () => {
        document.body.classList.add('drag-over');
    });

    document.addEventListener('dragleave', (e) => {
        if (!e.relatedTarget) {
            document.body.classList.remove('drag-over');
        }
    });

    document.addEventListener('drop', () => {
        document.body.classList.remove('drag-over');
    });

    // Initialize tooltips for keyboard shortcuts
    elements.findButton.title = 'Keyboard shortcut: Ctrl/Cmd + Enter';
    elements.clearResults.title = 'Keyboard shortcut: Escape';
});