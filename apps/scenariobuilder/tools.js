// Tools: Measure and Text functions

// Define drawArrowOutward as a SEPARATE function first
function drawArrowOutward(fromX, fromY, toX, toY) {
    const headLength = 10;
    const angle = Math.atan2(fromY - toY, fromX - toX);
    
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(
        fromX - headLength * Math.cos(angle - Math.PI / 6),
        fromY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        fromX - headLength * Math.cos(angle + Math.PI / 6),
        fromY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
}

function drawMeasure(measure) {
    ctx.strokeStyle = measure === selectedItem ? '#e74c3c' : '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(measure.x1, measure.y1);
    ctx.lineTo(measure.x2, measure.y2);
    ctx.stroke();
    
    // Draw arrows at both ends - facing outward
    drawArrowOutward(measure.x1, measure.y1, measure.x2, measure.y2);
    drawArrowOutward(measure.x2, measure.y2, measure.x1, measure.y1);
    
    // Endpoints - only show when selected
    if (measure === selectedItem) {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(measure.x1, measure.y1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(measure.x2, measure.y2, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Distance label - always visible
    const midX = (measure.x1 + measure.x2) / 2;
    const midY = (measure.y1 + measure.y2) / 2;
    
    const labelText = measure.distance + '"';
    
    // Label text only (transparent background)
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(labelText, midX, midY);
}

function drawTextBox(textBox) {
    // No background fill - transparent background
    
    if (textBox === selectedItem) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.strokeRect(textBox.x, textBox.y, textBox.width, textBox.height);
    }
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textBox.text, textBox.x + textBox.width / 2, textBox.y + textBox.height / 2);
    
    // Draw blinking cursor when text box is selected
    if (textBox === selectedItem) {
        const cursorBlink = Math.floor(Date.now() / 500) % 2;
        if (cursorBlink) {
            const textWidth = ctx.measureText(textBox.text).width;
            const cursorX = textBox.x + textBox.width / 2 + textWidth / 2 + 2;
            const cursorY = textBox.y + textBox.height / 2;
            
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cursorX, cursorY - 10);
            ctx.lineTo(cursorX, cursorY + 10);
            ctx.stroke();
        }
    }
}

function isNearPoint(x, y, px, py, threshold = 8) {
    return Math.abs(x - px) < threshold && Math.abs(y - py) < threshold;
}

function isNearLine(x, y, measure) {
    const distToLine = pointToLineDistance(x, y, measure.x1, measure.y1, measure.x2, measure.y2);
    return distToLine < 10;
}

function pointToLineDistance(x, y, x1, y1, x2, y2) {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
}

function updateMeasureDistance(measure) {
    const dx = measure.x2 - measure.x1;
    const dy = measure.y2 - measure.y1;
    const pixels = Math.sqrt(dx * dx + dy * dy);
    measure.distance = (pixels / SCALE).toFixed(1);
}

function handleMeasureEndpointDrag(x, y, dragData) {
    const measure = dragData.measure;
    if (dragData.point === 'start') {
        measure.x1 = x;
        measure.y1 = y;
    } else {
        measure.x2 = x;
        measure.y2 = y;
    }
    updateMeasureDistance(measure);
}

function checkMeasureEndpoints(x, y) {
    for (let measure of measures) {
        if (isNearPoint(x, y, measure.x1, measure.y1)) {
            return { measure, point: 'start' };
        }
        if (isNearPoint(x, y, measure.x2, measure.y2)) {
            return { measure, point: 'end' };
        }
    }
    return null;
}

function checkMeasureClick(x, y) {
    for (let measure of measures) {
        if (isNearLine(x, y, measure)) {
            return measure;
        }
    }
    return null;
}

function checkTextClick(x, y) {
    for (let text of textBoxes) {
        if (isPointInRect(x, y, text)) {
            return text;
        }
    }
    return null;
}

function drawMeasurePreview(x1, y1, x2, y2) {
    // Draw preview line
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw arrows
    drawArrowOutward(x1, y1, x2, y2);
    drawArrowOutward(x2, y2, x1, y1);
    
    // Calculate and show distance
    const dx = x2 - x1;
    const dy = y2 - y1;
    const pixels = Math.sqrt(dx * dx + dy * dy);
    const distance = (pixels / SCALE).toFixed(1);
    
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    const labelText = distance + '"';
    
    // Label text only
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(labelText, midX, midY);
}

function exportImage() {
    // Use 3x scale for crisp rendering on all mobile/retina/high-DPI screens.
    // The source canvas logical size is used as the base; we scale up the
    // export canvas physical pixels so Google Docs and mobile browsers always
    // display a sharp image regardless of device pixel ratio.
    const EXPORT_SCALE = 3;

    const srcWidth  = canvas.width;
    const srcHeight = canvas.height;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width  = srcWidth  * EXPORT_SCALE;
    exportCanvas.height = srcHeight * EXPORT_SCALE;

    const exportCtx = exportCanvas.getContext('2d', { alpha: false });

    // Crisp pixel rendering — disable smoothing so upscaling stays sharp
    exportCtx.imageSmoothingEnabled = false;

    // White background
    exportCtx.fillStyle = 'white';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Scale up and draw the source canvas at full resolution
    exportCtx.drawImage(
        canvas,
        0, 0, srcWidth, srcHeight,          // source rect (full canvas)
        0, 0, exportCanvas.width, exportCanvas.height  // dest rect (3x upscaled)
    );

    // Export as PNG (lossless) for maximum quality
    exportCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tabletop-terrain.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png');
}
