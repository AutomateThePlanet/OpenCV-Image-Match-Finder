async function handleClipboardPaste(e, targetCanvas, targetInput) {
    e.preventDefault();
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    
    for (const item of items) {
        if (item.type.startsWith('image')) {
            const blob = item.getAsFile();
            const reader = new FileReader();
            
            reader.onload = async function(event) {
                const base64data = event.target.result;
                targetInput.value = base64data;
                try {
                    await loadImageToCanvas(base64data, targetCanvas);
                } catch (error) {
                    console.error('Error loading pasted image:', error);
                    updateStatus('Error loading pasted image.', 'error');
                }
            };
            
            reader.readAsDataURL(blob);
            return;
        }

        if (item.type === 'text/plain') {
            item.getAsString(async (text) => {
                if (text.startsWith('data:image/')) {
                    targetInput.value = text;
                    try {
                        await loadImageToCanvas(text, targetCanvas);
                        updateStatus('Base64 image loaded successfully', 'success');
                    } catch (error) {
                        console.error('Error loading base64 image:', error);
                        updateStatus('Invalid base64 image data', 'error');
                    }
                }
            });
        }
    }
}

async function handlePasteButtonClick(targetInput, targetCanvas) {
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
                if (type.startsWith('image/')) {
                    const blob = await clipboardItem.getType(type);
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        const base64data = event.target.result;
                        targetInput.value = base64data;
                        await loadImageToCanvas(base64data, targetCanvas);
                    };
                    reader.readAsDataURL(blob);
                    return;
                }
            }
        }
    } catch (err) {
        console.error('Failed to read clipboard:', err);
        updateStatus('Failed to read clipboard. Try using Ctrl+V/⌘+V instead.', 'error');
    }
}

function findImageMatch() {
    const elements = {
        locatorInput: document.getElementById('locatorInput'),
        contextInput: document.getElementById('contextInput'),
        locatorCanvas: document.getElementById('locatorCanvas'),
        contextCanvas: document.getElementById('contextCanvas'),
        resultCanvas: document.getElementById('resultCanvas')
    };

    if (!elements.locatorInput.value || !elements.contextInput.value) {
        updateStatus('Please provide both template and source images.', 'error');
        return;
    }

    try {
        if (typeof cv === 'undefined') {
            throw new Error('OpenCV is not loaded yet. Please wait and try again.');
        }

        let template = cv.imread(elements.locatorCanvas);
        let image = cv.imread(elements.contextCanvas);
        let result = new cv.Mat();
        let mask = new cv.Mat();

        cv.matchTemplate(image, template, result, cv.TM_CCOEFF_NORMED, mask);
        
        let minMax = cv.minMaxLoc(result);
        let maxLoc = minMax.maxLoc;
        
        let color = new cv.Scalar(255, 0, 0, 255);
        let point1 = new cv.Point(maxLoc.x, maxLoc.y);
        let point2 = new cv.Point(maxLoc.x + template.cols, maxLoc.y + template.rows);
        cv.rectangle(image, point1, point2, color, 2);

        cv.imshow('resultCanvas', image);

        // Cleanup
        template.delete();
        image.delete();
        result.delete();
        mask.delete();

        updateStatus(`Match found! Confidence: ${(minMax.maxVal * 100).toFixed(2)}%`, 'success');
    } catch (error) {
        console.error('Error processing images:', error);
        updateStatus(`Error processing images: ${error.message}`, 'error');
    }
}