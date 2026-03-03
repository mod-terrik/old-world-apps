// Main application state and logic
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const SCALE = 15;

let zones = [];
let terrainPieces = [];
let measures = [];
let textBoxes = [];
let selectedItem = null;
let activeTool = null;
let dragging = false;
let resizing = false;
let dragOffset = { x: 0, y: 0 };
let resizeCorner = null;
let measureStart = null;

// Constrain positions to canvas boundaries (72" × 48" = 1080px × 720px at 15px/inch scale)
function constrainToCanvas(obj) {
    const maxWidth = canvas.width;   // 1080px = 72"
    const maxHeight = canvas.height; // 720px = 48"
    
    if (obj.category === 'zone' && obj.isCircle) {
        // For circular zones - keep entire circle inside
        const minPos = 0;
        const maxX = maxWidth - (obj.radius * 2);
        const maxY = maxHeight - (obj.radius * 2);
        
        obj.x = Math.max(minPos, Math.min(obj.x, maxX));
        obj.y = Math.max(minPos, Math.min(obj.y, maxY));
    } else if (obj.width && obj.height) {
        // For rectangular objects (zones, terrain, text) - keep entire object inside
        obj.x = Math.max(0, Math.min(obj.x, maxWidth - obj.width));
        obj.y = Math.max(0, Math.min(obj.y, maxHeight - obj.height));
        
        // Also constrain width and height to not exceed canvas
        obj.width = Math.min(obj.width, maxWidth - obj.x);
        obj.height = Math.min(obj.height, maxHeight - obj.y);
    } else if (obj.category === 'measure') {
        // For measure tool endpoints - keep points inside
        obj.x1 = Math.max(0, Math.min(obj.x1, maxWidth));
        obj.y1 = Math.max(0, Math.min(obj.y1, maxHeight));
        obj.x2 = Math.max(0, Math.min(obj.x2, maxWidth));
        obj.y2 = Math.max(0, Math.min(obj.y2, maxHeight));
    }
}

// Render function
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Soft dark green background
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw inner border to clearly mark the 72" × 48" boundary
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    
    // Draw zones FIRST so they appear underneath everything else
    zones.forEach(drawZone);
    
    // Draw measurement lines for special zones
    zones.forEach(zone => {
        if (zone.isCircle) {
            drawZoneMeasurementLines(zone);
        }
    });
    
    // Draw terrain
    terrainPieces.forEach(drawTerrain);
    
    // Draw measurement lines for ALL terrain pieces (not just selected)
    terrainPieces.forEach(terrain => {
        drawTerrainMeasurementLines(terrain);
    });
    
    measures.forEach(drawMeasure);
    textBoxes.forEach(drawTextBox);
}

// Event handlers
document.querySelectorAll('.zone-btn').forEach(btn => {
    // Skip red and blue zone buttons - they have their own dropdown handlers in index.html
    if (btn.id === 'redZoneBtn' || btn.id === 'blueZoneBtn') {
        return;
    }
    
    btn.addEventListener('click', () => {
        activeTool = {
            category: 'zone',
            type: btn.dataset.zone
        };
        document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

document.querySelectorAll('.terrain-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        activeTool = {
            category: 'terrain',
            type: btn.dataset.terrain,
            width: parseInt(btn.dataset.width) * SCALE,
            height: parseInt(btn.dataset.height) * SCALE
        };
        document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

document.getElementById('measureBtn').addEventListener('click', () => {
    activeTool = { category: 'measure' };
    document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
    document.getElementById('measureBtn').classList.add('active');
});

document.getElementById('textBtn').addEventListener('click', () => {
    activeTool = { category: 'text' };
    document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
    document.getElementById('textBtn').classList.add('active');
});

document.getElementById('exportBtn').addEventListener('click', exportImage);

// Special handler for Special Feature button
document.getElementById('specialFeatureBtn').addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent click-elsewhere handler
    const shapeSelect = document.getElementById('specialShapeSelect');
    shapeSelect.style.display = 'block';
    activeTool = {
        category: 'terrain',
        type: 'special'
    };
    document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
    document.getElementById('specialFeatureBtn').classList.add('active');
});

// Prevent dropdown from closing when clicking on it
document.getElementById('specialShapeSelect').addEventListener('click', (e) => {
    e.stopPropagation();
});

// Hide dropdown when clicking elsewhere
document.addEventListener('click', (e) => {
    const shapeSelect = document.getElementById('specialShapeSelect');
    const specialBtn = document.getElementById('specialFeatureBtn');
    if (e.target !== shapeSelect && e.target !== specialBtn) {
        shapeSelect.style.display = 'none';
    }
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (handleZonePlacement(x, y)) {
        render();
        return;
    }
    
    if (handleTerrainPlacement(x, y)) {
        render();
        return;
    }
    
    if (activeTool && activeTool.category === 'measure') {
        measureStart = { x, y };
        return;
    }
    
    if (activeTool && activeTool.category === 'text') {
        textBoxes.push({
            x: x - 50,
            y: y - 15,
            width: 100,
            height: 30,
            text: 'Text',
            category: 'text'
        });
        activeTool = null;
        document.getElementById('textBtn').classList.remove('active');
        render();
        return;
    }
    
    // Check for measure endpoint dragging first (higher priority)
    const endpointData = checkMeasureEndpoints(x, y);
    if (endpointData) {
        dragging = true;
        selectedItem = endpointData.measure;
        dragOffset = endpointData;
        render();
        return;
    }
    
    // Check for terrain resize corners first (terrain should be above zones)
    for (let i = terrainPieces.length - 1; i >= 0; i--) {
        const terrain = terrainPieces[i];
        const corner = getTerrainCorner(x, y, terrain);
        if (corner) {
            selectedItem = terrain;
            resizing = true;
            resizeCorner = corner;
            render();
            return;
        }
    }
    
    // Check for zone resize corners (only after terrain)
    for (let i = zones.length - 1; i >= 0; i--) {
        const zone = zones[i];
        const corner = getZoneCorner(x, y, zone);
        if (corner) {
            selectedItem = zone;
            resizing = true;
            resizeCorner = corner;
            render();
            return;
        }
    }
    
    // Check for clicks on existing items - terrain and text should be checked BEFORE zones
    let clicked = checkTextClick(x, y) || checkMeasureClick(x, y) || 
                  checkTerrainClick(x, y) || checkZoneClick(x, y);
    
    if (clicked) {
        selectedItem = clicked;
        dragging = true;
        
        // For measure lines, store the offset from the midpoint
        if (clicked.category === 'measure') {
            const midX = (clicked.x1 + clicked.x2) / 2;
            const midY = (clicked.y1 + clicked.y2) / 2;
            dragOffset = { x: x - midX, y: y - midY, isMeasureLine: true };
        } else {
            dragOffset = { x: x - (clicked.x || 0), y: y - (clicked.y || 0) };
        }
        render();
        return;
    }
    
    selectedItem = null;
    render();
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    // Show measure preview while dragging to create new measure
    if (measureStart) {
        render();
        drawMeasurePreview(measureStart.x, measureStart.y, x, y);
        return;
    }
    
    if (resizing && selectedItem) {
        if (selectedItem.category === 'zone') {
            handleZoneResize(x, y, selectedItem);
        } else if (selectedItem.category === 'terrain') {
            handleTerrainResize(x, y, selectedItem);
        }
        constrainToCanvas(selectedItem);
        render();
    } else if (dragging && dragOffset.measure) {
        // Dragging measure endpoint
        handleMeasureEndpointDrag(x, y, dragOffset);
        constrainToCanvas(dragOffset.measure);
        render();
    } else if (dragging && selectedItem) {
        if (selectedItem.category === 'measure' && dragOffset.isMeasureLine) {
            // Dragging entire measure line
            const midX = x - dragOffset.x;
            const midY = y - dragOffset.y;
            
            const currentMidX = (selectedItem.x1 + selectedItem.x2) / 2;
            const currentMidY = (selectedItem.y1 + selectedItem.y2) / 2;
            
            const deltaX = midX - currentMidX;
            const deltaY = midY - currentMidY;
            
            selectedItem.x1 += deltaX;
            selectedItem.y1 += deltaY;
            selectedItem.x2 += deltaX;
            selectedItem.y2 += deltaY;
            
            constrainToCanvas(selectedItem);
        } else if (selectedItem.category === 'text') {
            selectedItem.x = x - dragOffset.x;
            selectedItem.y = y - dragOffset.y;
            constrainToCanvas(selectedItem);
        } else {
            selectedItem.x = x - dragOffset.x;
            selectedItem.y = y - dragOffset.y;
            constrainToCanvas(selectedItem);
        }
        render();
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (measureStart) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const dx = x - measureStart.x;
        const dy = y - measureStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance >= SCALE) {
            const measure = {
                x1: measureStart.x,
                y1: measureStart.y,
                x2: x,
                y2: y,
                distance: 0,
                category: 'measure'
            };
            updateMeasureDistance(measure);
            measures.push(measure);
        }
        
        measureStart = null;
        activeTool = null;
        document.getElementById('measureBtn').classList.remove('active');
        render();
    }
    
    dragging = false;
    resizing = false;
    dragOffset = {};
    resizeCorner = null;
});

// Add mouseleave event to auto-release when mouse leaves canvas
canvas.addEventListener('mouseleave', () => {
    if (measureStart) {
        // Cancel measure creation if mouse leaves while creating
        measureStart = null;
        activeTool = null;
        document.getElementById('measureBtn').classList.remove('active');
        render();
    }
    
    if (dragging && dragOffset.measure) {
        // If dragging a measure endpoint, constrain it to canvas edge and finalize
        constrainToCanvas(dragOffset.measure);
        updateMeasureDistance(dragOffset.measure);
        dragging = false;
        dragOffset = {};
        render();
    } else if (dragging || resizing) {
        // For other objects, just release the drag/resize
        if (selectedItem) {
            constrainToCanvas(selectedItem);
        }
        dragging = false;
        resizing = false;
        dragOffset = {};
        resizeCorner = null;
        render();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && selectedItem) {
        if (selectedItem.category === 'zone') {
            zones = zones.filter(z => z !== selectedItem);
        } else if (selectedItem.category === 'terrain') {
            terrainPieces = terrainPieces.filter(t => t !== selectedItem);
        } else if (selectedItem.category === 'measure') {
            measures = measures.filter(m => m !== selectedItem);
        } else if (selectedItem.category === 'text') {
            textBoxes = textBoxes.filter(t => t !== selectedItem);
        }
        selectedItem = null;
        render();
    }
    
    if (selectedItem && selectedItem.category === 'text') {
        if (e.key.length === 1) {
            selectedItem.text += e.key;
            render();
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            selectedItem.text = selectedItem.text.slice(0, -1);
            render();
        }
    }
});

// Animate cursor blinking for text boxes
function animate() {
    if (selectedItem && selectedItem.category === 'text') {
        render();
    }
    requestAnimationFrame(animate);
}
animate();

// Initial render
render();