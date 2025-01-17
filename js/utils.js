function loadImageToCanvas(base64Input, canvas) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve();
        };
        img.onerror = reject;
        img.src = base64Input.startsWith('data:image') ? 
            base64Input : 'data:image/png;base64,' + base64Input;
    });
}

function clearCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
}

function onOpenCvReady() {
    console.log('OpenCV.js is ready');
    updateStatus('OpenCV.js is ready!', 'success');
    
    // Enable all UI elements
    const elements = [
        'locatorInput', 'contextInput',
        'clearLocator', 'clearContext',
        'findButton', 'pasteLocator',
        'pasteContext'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = false;
        }
    });
}