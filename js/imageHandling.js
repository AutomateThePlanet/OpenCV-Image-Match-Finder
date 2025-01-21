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

function drawRectangle(canvas, rect, color = new cv.Scalar(255, 0, 0, 255), thickness = 2) {  
    const point1 = new cv.Point(rect.x, rect.y);  
    const point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);  
    cv.rectangle(canvas, point1, point2, color, thickness);
}  
  
function findImageMatch(threshold = 0.8) {
    const elements = {  
        locatorInput: document.getElementById('locatorInput'),  
        contextInput: document.getElementById('contextInput'),  
        locatorCanvas: document.getElementById('locatorCanvas'),  
        contextCanvas: document.getElementById('contextCanvas'),  
        resultCanvas: document.getElementById('resultCanvas'),  
    };  
  
    // Validate input  
    if (!elements.locatorInput.value || !elements.contextInput.value) {  
        updateStatus('Please provide both template and source images.', 'error');  
        return;  
    }  
  
    try {  
        if (typeof cv === 'undefined') {  
            throw new Error('OpenCV is not loaded yet. Please wait and try again.');  
        }  
  
        // Load images  
        const template = cv.imread(elements.locatorCanvas);  
        const image = cv.imread(elements.contextCanvas);  

        // Prepare result matrix  
        const result = new cv.Mat();  
        const mask = new cv.Mat();  
  
        // Perform template matching  
        cv.matchTemplate(image, template, result, cv.TM_CCOEFF_NORMED, mask);  
  
        // Find all matches above the threshold  
        const matches = [];  
        for (let y = 0; y < result.rows; y++) {  
            for (let x = 0; x < result.cols; x++) {  
                const confidence = result.floatAt(y, x);  
                if (confidence >= threshold) {  
                    matches.push({ x, y, confidence });  
                }  
            }  
        }  
        // Scale factors for drawing rectangles  
        const scaleX = elements.contextCanvas.width / image.cols;  
        const scaleY = elements.contextCanvas.height / image.rows;  
  
        // Draw rectangles for all matches  
        matches.forEach(match => {  
            const rect = {  
                x: match.x * scaleX,  
                y: match.y * scaleY,  
                width: template.cols * scaleX,  
                height: template.rows * scaleY,  
            };  
            drawRectangle(image, rect);  
        });  
  
        // Display result  
        cv.imshow('resultCanvas', image);  
  
        // Update status  
        if (matches.length > 0) {  
            const confidenceLevels = matches.map(m => (m.confidence * 100).toFixed(2));  
            const highestConfidence = Math.max(...confidenceLevels);  
            updateStatus(  
                `Match found! Confidence Levels: ${confidenceLevels.join(', ')}% (Highest: ${highestConfidence}%)`,  
                'success'  
            );  
        } else {  
            updateStatus('No matches found above the threshold.', 'error');  
        }  
  
        // Cleanup  
        template.delete();  
        image.delete();  
        result.delete();  
        mask.delete();  
    } catch (error) {  
        console.error('Error processing images:', error);  
        updateStatus(`Error processing images: ${error.message}`, 'error');  
    }  
}