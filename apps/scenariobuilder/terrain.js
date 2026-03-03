// Terrain management functions
const terrainColors = {
    hill: '#8b7d6b',
    forest: '#1a3d0f',  // Very dark green for forest
    building: '#7f8c8d',
    field: '#9b7653',
    wall: '#95a5a6',
    special: '#9b59b6'  // Purple for special feature
};

function drawTerrain(terrain) {
    ctx.fillStyle = terrainColors[terrain.type];
    
    // Draw forest as oval
    if (terrain.type === 'forest') {
        ctx.beginPath();
        ctx.ellipse(
            terrain.x + terrain.width / 2,
            terrain.y + terrain.height / 2,
            terrain.width / 2,
            terrain.height / 2,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        if (terrain === selectedItem) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Resize handle
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(terrain.x + terrain.width - 5, terrain.y + terrain.height - 5, 10, 10);
            
            // Show dimensions in inches
            const widthInches = (terrain.width / SCALE).toFixed(1);
            const heightInches = (terrain.height / SCALE).toFixed(1);
            const labelText = widthInches + '" × ' + heightInches + '"';
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.font = 'bold 12px Arial';
            ctx.textBaseline = 'middle';
            const textWidth = ctx.measureText(labelText).width;
            const centerX = terrain.x + terrain.width / 2;
            const centerY = terrain.y + terrain.height / 2;
            ctx.fillRect(centerX - textWidth/2 - 5, centerY - 10, textWidth + 10, 20);
            
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(labelText, centerX, centerY);
        } else {
            // Label when not selected
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                terrain.type.toUpperCase(),
                terrain.x + terrain.width / 2,
                terrain.y + terrain.height / 2
            );
        }
    }
    // Draw hill as rounded rectangle
    else if (terrain.type === 'hill') {
        const radius = 15; // Corner radius
        ctx.beginPath();
        ctx.moveTo(terrain.x + radius, terrain.y);
        ctx.lineTo(terrain.x + terrain.width - radius, terrain.y);
        ctx.quadraticCurveTo(terrain.x + terrain.width, terrain.y, terrain.x + terrain.width, terrain.y + radius);
        ctx.lineTo(terrain.x + terrain.width, terrain.y + terrain.height - radius);
        ctx.quadraticCurveTo(terrain.x + terrain.width, terrain.y + terrain.height, terrain.x + terrain.width - radius, terrain.y + terrain.height);
        ctx.lineTo(terrain.x + radius, terrain.y + terrain.height);
        ctx.quadraticCurveTo(terrain.x, terrain.y + terrain.height, terrain.x, terrain.y + terrain.height - radius);
        ctx.lineTo(terrain.x, terrain.y + radius);
        ctx.quadraticCurveTo(terrain.x, terrain.y, terrain.x + radius, terrain.y);
        ctx.closePath();
        ctx.fill();
        
        if (terrain === selectedItem) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Resize handle
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(terrain.x + terrain.width - 5, terrain.y + terrain.height - 5, 10, 10);
            
            // Show dimensions in inches
            const widthInches = (terrain.width / SCALE).toFixed(1);
            const heightInches = (terrain.height / SCALE).toFixed(1);
            const labelText = widthInches + '" × ' + heightInches + '"';
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.font = 'bold 12px Arial';
            ctx.textBaseline = 'middle';
            const textWidth = ctx.measureText(labelText).width;
            const centerX = terrain.x + terrain.width / 2;
            const centerY = terrain.y + terrain.height / 2;
            ctx.fillRect(centerX - textWidth/2 - 5, centerY - 10, textWidth + 10, 20);
            
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(labelText, centerX, centerY);
        } else {
            // Label when not selected
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const centerX = terrain.x + terrain.width / 2;
            const centerY = terrain.y + terrain.height / 2;
            ctx.fillText(
                terrain.type.toUpperCase(),
                centerX,
                centerY
            );
        }
    }
    // Draw special feature (can be circle or square)
    else if (terrain.type === 'special') {
        if (terrain.isCircle) {
            ctx.beginPath();
            ctx.arc(
                terrain.x + terrain.radius,
                terrain.y + terrain.radius,
                terrain.radius,
                0, Math.PI * 2
            );
            ctx.fill();
            
            if (terrain === selectedItem) {
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Resize handle
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(terrain.x + terrain.radius * 2 - 5, terrain.y + terrain.radius - 5, 10, 10);
                
                // Show diameter
                const diameter = (terrain.radius * 2 / SCALE).toFixed(1);
                const labelText = 'Ø ' + diameter + '"';
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.font = 'bold 12px Arial';
                ctx.textBaseline = 'middle';
                const textWidth = ctx.measureText(labelText).width;
                ctx.fillRect(terrain.x + terrain.radius - textWidth/2 - 5, terrain.y + terrain.radius - 10, textWidth + 10, 20);
                
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText(labelText, terrain.x + terrain.radius, terrain.y + terrain.radius);
            } else {
                ctx.fillStyle = 'white';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('SPECIAL', terrain.x + terrain.radius, terrain.y + terrain.radius);
            }
        } else {
            // Square special feature
            ctx.fillRect(terrain.x, terrain.y, terrain.width, terrain.height);
            
            if (terrain === selectedItem) {
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 3;
                ctx.strokeRect(terrain.x, terrain.y, terrain.width, terrain.height);
                
                // Resize handle
                ctx.fillStyle = '#e74c3c';
                ctx.fillRect(terrain.x + terrain.width - 5, terrain.y + terrain.height - 5, 10, 10);
                
                // Show dimensions in inches
                const widthInches = (terrain.width / SCALE).toFixed(1);
                const heightInches = (terrain.height / SCALE).toFixed(1);
                const labelText = widthInches + '" × ' + heightInches + '"';
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.font = 'bold 12px Arial';
                ctx.textBaseline = 'middle';
                const textWidth = ctx.measureText(labelText).width;
                const centerX = terrain.x + terrain.width / 2;
                const centerY = terrain.y + terrain.height / 2;
                ctx.fillRect(centerX - textWidth/2 - 5, centerY - 10, textWidth + 10, 20);
                
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText(labelText, centerX, centerY);
            } else {
                ctx.fillStyle = 'white';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('SPECIAL', terrain.x + terrain.width / 2, terrain.y + terrain.height / 2);
            }
        }
    }
    // All other terrain types as rectangles
    else {
        ctx.fillRect(terrain.x, terrain.y, terrain.width, terrain.height);
        
        if (terrain === selectedItem) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.strokeRect(terrain.x, terrain.y, terrain.width, terrain.height);
            
            // Resize handle
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(terrain.x + terrain.width - 5, terrain.y + terrain.height - 5, 10, 10);
            
            // Show dimensions in inches
            const widthInches = (terrain.width / SCALE).toFixed(1);
            const heightInches = (terrain.height / SCALE).toFixed(1);
            const labelText = widthInches + '" × ' + heightInches + '"';
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.font = 'bold 12px Arial';
            ctx.textBaseline = 'middle';
            const textWidth = ctx.measureText(labelText).width;
            const centerX = terrain.x + terrain.width / 2;
            const centerY = terrain.y + terrain.height / 2;
            ctx.fillRect(centerX - textWidth/2 - 5, centerY - 10, textWidth + 10, 20);
            
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(labelText, centerX, centerY);
        } else {
            // Label when not selected - centered properly
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const centerX = terrain.x + terrain.width / 2;
            const centerY = terrain.y + terrain.height / 2;
            ctx.fillText(
                terrain.type.toUpperCase(),
                centerX,
                centerY
            );
        }
    }
}

function drawTerrainMeasurementLines(terrain) {
    // Calculate distances to borders
    let distanceToLeft, distanceToTop, distanceToRight, distanceToBottom;
    let lineYBase, lineXBase;
    
    if (terrain.type === 'special' && terrain.isCircle) {
        // For circular special features, measure from center
        const centerX = terrain.x + terrain.radius;
        const centerY = terrain.y + terrain.radius;
        distanceToLeft = centerX / SCALE;
        distanceToTop = centerY / SCALE;
        distanceToRight = (canvas.width - centerX) / SCALE;
        distanceToBottom = (canvas.height - centerY) / SCALE;
        lineYBase = centerY;
        lineXBase = centerX;
    } else {
        // For rectangular terrain
        distanceToLeft = terrain.x / SCALE;
        distanceToTop = terrain.y / SCALE;
        distanceToRight = (canvas.width - (terrain.x + terrain.width)) / SCALE;
        distanceToBottom = (canvas.height - (terrain.y + terrain.height)) / SCALE;
        lineYBase = terrain.y + terrain.height / 2;
        lineXBase = terrain.x + terrain.width / 2;
    }
    
    // Determine closest horizontal and vertical borders
    const closestHorizontal = distanceToLeft < distanceToRight ? 'left' : 'right';
    const closestVertical = distanceToTop < distanceToBottom ? 'top' : 'bottom';
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Draw horizontal measurement line
    if (closestHorizontal === 'left') {
        const startX = terrain.type === 'special' && terrain.isCircle ? terrain.x : terrain.x;
        ctx.beginPath();
        ctx.moveTo(0, lineYBase);
        ctx.lineTo(startX, lineYBase);
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(distanceToLeft.toFixed(1) + '"', startX / 2, lineYBase - 5);
    } else {
        const startX = terrain.type === 'special' && terrain.isCircle ? 
            terrain.x + terrain.radius * 2 : terrain.x + terrain.width;
        ctx.beginPath();
        ctx.moveTo(startX, lineYBase);
        ctx.lineTo(canvas.width, lineYBase);
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(distanceToRight.toFixed(1) + '"', startX + (canvas.width - startX) / 2, lineYBase - 5);
    }
    
    // Draw vertical measurement line
    if (closestVertical === 'top') {
        const startY = terrain.type === 'special' && terrain.isCircle ? terrain.y : terrain.y;
        ctx.beginPath();
        ctx.moveTo(lineXBase, 0);
        ctx.lineTo(lineXBase, startY);
        ctx.stroke();
        
        ctx.save();
        ctx.translate(lineXBase + 10, startY / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(distanceToTop.toFixed(1) + '"', 0, 0);
        ctx.restore();
    } else {
        const startY = terrain.type === 'special' && terrain.isCircle ? 
            terrain.y + terrain.radius * 2 : terrain.y + terrain.height;
        ctx.beginPath();
        ctx.moveTo(lineXBase, startY);
        ctx.lineTo(lineXBase, canvas.height);
        ctx.stroke();
        
        ctx.save();
        ctx.translate(lineXBase + 10, startY + (canvas.height - startY) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(distanceToBottom.toFixed(1) + '"', 0, 0);
        ctx.restore();
    }
    
    ctx.setLineDash([]);
}

function isPointInTerrain(x, y, terrain) {
    if (terrain.type === 'forest') {
        // Ellipse collision detection
        const centerX = terrain.x + terrain.width / 2;
        const centerY = terrain.y + terrain.height / 2;
        const radiusX = terrain.width / 2;
        const radiusY = terrain.height / 2;
        
        const normalizedX = (x - centerX) / radiusX;
        const normalizedY = (y - centerY) / radiusY;
        
        return (normalizedX * normalizedX + normalizedY * normalizedY) <= 1;
    } else if (terrain.type === 'special' && terrain.isCircle) {
        // Circle collision detection
        const dx = x - (terrain.x + terrain.radius);
        const dy = y - (terrain.y + terrain.radius);
        return Math.sqrt(dx * dx + dy * dy) <= terrain.radius;
    } else {
        return x >= terrain.x && x <= terrain.x + terrain.width &&
               y >= terrain.y && y <= terrain.y + terrain.height;
    }
}

function getTerrainCorner(x, y, terrain) {
    const cornerSize = 10;
    if (terrain.type === 'special' && terrain.isCircle) {
        // Circle resize handle on the right side
        const handleX = terrain.x + terrain.radius * 2;
        const handleY = terrain.y + terrain.radius;
        if (Math.abs(x - handleX) < cornerSize && Math.abs(y - handleY) < cornerSize) {
            return 'circle-resize';
        }
    } else {
        if (Math.abs(x - (terrain.x + terrain.width)) < cornerSize && 
            Math.abs(y - (terrain.y + terrain.height)) < cornerSize) {
            return 'se';
        }
    }
    return null;
}

function handleTerrainResize(x, y, terrain) {
    if (resizeCorner === 'circle-resize' && terrain.isCircle) {
        // Resize circle by radius
        const dx = x - (terrain.x + terrain.radius);
        const dy = y - (terrain.y + terrain.radius);
        terrain.radius = Math.sqrt(dx * dx + dy * dy);
    } else if (resizeCorner === 'se') {
        // Clamp x and y to canvas boundaries first
        x = Math.max(terrain.x + 10, Math.min(x, canvas.width));
        y = Math.max(terrain.y + 10, Math.min(y, canvas.height));
        
        terrain.width = x - terrain.x;
        terrain.height = y - terrain.y;
    }
}

function handleTerrainPlacement(x, y) {
    if (activeTool && activeTool.category === 'terrain') {
        // Special feature uses dropdown instead of prompt
        if (activeTool.type === 'special') {
            const shapeSelect = document.getElementById('specialShapeSelect');
            const shape = shapeSelect.value;
            
            if (shape === 'circle') {
                const radius = 5 * SCALE / 2; // 5 inch diameter = 2.5 inch radius
                terrainPieces.push({
                    type: 'special',
                    x: x - radius,
                    y: y - radius,
                    radius: radius,
                    isCircle: true,
                    category: 'terrain'
                });
            } else {
                // Square - 6x6 inches default
                const size = 6 * SCALE;
                terrainPieces.push({
                    type: 'special',
                    x: x - size / 2,
                    y: y - size / 2,
                    width: size,
                    height: size,
                    isCircle: false,
                    category: 'terrain'
                });
            }
            
            // Hide dropdown after placement
            shapeSelect.style.display = 'none';
            activeTool = null;
            document.querySelectorAll('.terrain-btn').forEach(b => b.classList.remove('active'));
            return true;
        }
        
        // All other terrain types
        terrainPieces.push({
            type: activeTool.type,
            x: x - activeTool.width / 2,
            y: y - activeTool.height / 2,
            width: activeTool.width,
            height: activeTool.height,
            category: 'terrain'
        });
        activeTool = null;
        document.querySelectorAll('.terrain-btn').forEach(b => b.classList.remove('active'));
        return true;
    }
    return false;
}

function checkTerrainClick(x, y) {
    for (let i = terrainPieces.length - 1; i >= 0; i--) {
        const terrain = terrainPieces[i];
        if (isPointInTerrain(x, y, terrain)) {
            return terrain;
        }
    }
    return null;
}