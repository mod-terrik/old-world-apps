// Zone management functions
const zoneColors = {
    red: 'rgba(200, 0, 0, 0.5)',
    blue: 'rgba(0, 50, 150, 0.5)',
    special: 'rgba(230, 226, 22, 0.75)'
};

function drawZone(zone) {
    ctx.fillStyle = zoneColors[zone.type];
    
    if (zone.isDiagonal) {
        ctx.beginPath();
        ctx.moveTo(zone.points[0].x, zone.points[0].y);
        for (let i = 1; i < zone.points.length; i++) {
            ctx.lineTo(zone.points[i].x, zone.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
        
        if (zone === selectedItem) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    } else if (zone.isCircle) {
        ctx.beginPath();
        ctx.arc(zone.x + zone.radius, zone.y + zone.radius, zone.radius, 0, Math.PI * 2);
        ctx.fill();
        
        if (zone === selectedItem) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            const diameter = (zone.radius * 2 / SCALE).toFixed(1);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            const labelText = '\u00d8 ' + diameter + '"';
            ctx.font = 'bold 12px Arial';
            const textWidth = ctx.measureText(labelText).width;
            ctx.fillRect(zone.x + zone.radius - textWidth/2 - 5, zone.y + zone.radius - 10, textWidth + 10, 20);
            
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(labelText, zone.x + zone.radius, zone.y + zone.radius + 4);
        } else {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Obj.', zone.x + zone.radius, zone.y + zone.radius);
        }
    } else {
        ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
        
        if (zone === selectedItem) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);
            
            ctx.fillStyle = '#e74c3c';
            if (zone.type === 'blue') {
                ctx.fillRect(zone.x - 5, zone.y - 5, 10, 10);
            } else {
                ctx.fillRect(zone.x + zone.width - 5, zone.y + zone.height - 5, 10, 10);
            }
            
            const widthInches = (zone.width / SCALE).toFixed(1);
            const heightInches = (zone.height / SCALE).toFixed(1);
            const labelText = widthInches + '" \u00d7 ' + heightInches + '"';
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.font = 'bold 12px Arial';
            const textWidth = ctx.measureText(labelText).width;
            ctx.fillRect(zone.x + zone.width/2 - textWidth/2 - 5, zone.y + zone.height/2 - 10, textWidth + 10, 20);
            
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(labelText, zone.x + zone.width/2, zone.y + zone.height/2 + 4);
        }
    }
}

function isPointInZone(x, y, zone) {
    if (zone.isDiagonal) {
        const points = zone.points;
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    } else if (zone.isCircle) {
        const dx = x - (zone.x + zone.radius);
        const dy = y - (zone.y + zone.radius);
        return Math.sqrt(dx * dx + dy * dy) <= zone.radius;
    } else {
        return x >= zone.x && x <= zone.x + zone.width &&
               y >= zone.y && y <= zone.y + zone.height;
    }
}

function getZoneCorner(x, y, zone) {
    const cornerSize = 10;
    if (zone.isCircle || zone.isDiagonal) {
        return null;
    } else {
        if (Math.abs(x - (zone.x + zone.width)) < cornerSize && 
            Math.abs(y - (zone.y + zone.height)) < cornerSize) {
            return 'se';
        }
    }
    return null;
}

function handleZonePlacement(x, y) {
    if (activeTool && activeTool.category === 'zone') {
        if (activeTool.type === 'special') {
            const zone = {
                type: activeTool.type,
                x: x - 75,
                y: y - 75,
                width: 150,
                height: 150,
                category: 'zone',
                isCircle: true,
                radius: 3.5 * SCALE / 2
            };
            zone.x = x - zone.radius;
            zone.y = y - zone.radius;
            
            zones.push(zone);
            activeTool = null;
            document.querySelectorAll('.zone-btn').forEach(b => b.classList.remove('active'));
            return true;
        }
        
        const zone = {
            type: activeTool.type,
            category: 'zone'
        };
        
        if (activeTool.zoneType === 'diagonal') {
            const centerX = canvas.width / 2;   // 540px = 36"
            const centerY = canvas.height / 2;  // 360px = 24"
            const perpDistance = 12 * SCALE;    // 180px = 12"
            
            // For a 45-degree diagonal line perpendicular distance from center:
            // The line equation: x + y = constant
            // Distance from point (cx, cy) to line x + y = c is: |cx + cy - c| / sqrt(2)
            // We want this distance = perpDistance
            // So: |cx + cy - c| / sqrt(2) = perpDistance
            // Therefore: c = cx + cy ± perpDistance * sqrt(2)
            
            const offset = perpDistance * Math.sqrt(2);
            
            if (activeTool.type === 'red') {
                // Red diagonal from northwest corner
                // Line passes through points where x + y = centerX + centerY - offset
                const lineConstant = centerX + centerY - offset;
                
                zone.isDiagonal = true;
                zone.diagonalType = 'northwest';
                
                // Find where this line intersects the edges
                // Top edge (y=0): x = lineConstant
                // Left edge (x=0): y = lineConstant
                const topIntersect = Math.min(lineConstant, canvas.width);
                const leftIntersect = Math.min(lineConstant, canvas.height);
                
                zone.points = [
                    {x: 0, y: 0},                      // Top-left corner
                    {x: topIntersect, y: 0},           // Along top edge
                    {x: 0, y: leftIntersect}           // Along left edge
                ];
            } else if (activeTool.type === 'blue') {
                // Blue diagonal from southeast corner
                // Line passes through points where x + y = centerX + centerY + offset
                const lineConstant = centerX + centerY + offset;
                
                zone.isDiagonal = true;
                zone.diagonalType = 'southeast';
                
                // Find where this line intersects the edges
                // Bottom edge (y=canvas.height): x = lineConstant - canvas.height
                // Right edge (x=canvas.width): y = lineConstant - canvas.width
                const bottomIntersect = Math.max(lineConstant - canvas.height, 0);
                const rightIntersect = Math.max(lineConstant - canvas.width, 0);
                
                zone.points = [
                    {x: canvas.width, y: canvas.height},  // Bottom-right corner
                    {x: bottomIntersect, y: canvas.height}, // Along bottom edge
                    {x: canvas.width, y: rightIntersect}    // Along right edge
                ];
            }
        } else {
            const width = 72 * SCALE;
            const height = 12 * SCALE;
            
            if (activeTool.type === 'red') {
                zone.x = 0;
                zone.y = 0;
                zone.width = Math.min(width, canvas.width);
                zone.height = Math.min(height, canvas.height);
            } else if (activeTool.type === 'blue') {
                zone.width = Math.min(width, canvas.width);
                zone.height = Math.min(height, canvas.height);
                zone.x = canvas.width - zone.width;
                zone.y = canvas.height - zone.height;
            }
        }
        
        zones.push(zone);
        activeTool = null;
        document.querySelectorAll('.zone-btn').forEach(b => b.classList.remove('active'));
        return true;
    }
    return false;
}

function checkZoneClick(x, y) {
    for (let i = zones.length - 1; i >= 0; i--) {
        const zone = zones[i];
        if (isPointInZone(x, y, zone)) {
            return zone;
        }
    }
    return null;
}

function handleZoneResize(x, y, zone) {
    if (!zone.isCircle && !zone.isDiagonal) {
        x = Math.max(0, Math.min(x, canvas.width));
        y = Math.max(0, Math.min(y, canvas.height));
        
        if (resizeCorner === 'se') {
            zone.width = x - zone.x;
            zone.height = y - zone.y;
        } else if (resizeCorner === 'nw') {
            const newWidth = zone.width + (zone.x - x);
            const newHeight = zone.height + (zone.y - y);
            zone.x = x;
            zone.y = y;
            zone.width = newWidth;
            zone.height = newHeight;
        }
    }
}

function drawZoneMeasurementLines(zone) {
    if (!zone.isCircle) return;
    
    const centerX = zone.x + zone.radius;
    const centerY = zone.y + zone.radius;
    const distanceToLeft = centerX / SCALE;
    const distanceToTop = centerY / SCALE;
    const distanceToRight = (canvas.width - centerX) / SCALE;
    const distanceToBottom = (canvas.height - centerY) / SCALE;
    
    const closestHorizontal = distanceToLeft < distanceToRight ? 'left' : 'right';
    const closestVertical = distanceToTop < distanceToBottom ? 'top' : 'bottom';
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    if (closestHorizontal === 'left') {
        const lineY = centerY;
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(zone.x, lineY);
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(distanceToLeft.toFixed(1) + '"', zone.x / 2, lineY - 5);
    } else {
        const lineY = centerY;
        ctx.beginPath();
        ctx.moveTo(zone.x + zone.radius * 2, lineY);
        ctx.lineTo(canvas.width, lineY);
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(distanceToRight.toFixed(1) + '"', zone.x + zone.radius * 2 + (canvas.width - (zone.x + zone.radius * 2)) / 2, lineY - 5);
    }
    
    if (closestVertical === 'top') {
        const lineX = centerX;
        ctx.beginPath();
        ctx.moveTo(lineX, 0);
        ctx.lineTo(lineX, zone.y);
        ctx.stroke();
        
        ctx.save();
        ctx.translate(lineX + 10, zone.y / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(distanceToTop.toFixed(1) + '"', 0, 0);
        ctx.restore();
    } else {
        const lineX = centerX;
        ctx.beginPath();
        ctx.moveTo(lineX, zone.y + zone.radius * 2);
        ctx.lineTo(lineX, canvas.height);
        ctx.stroke();
        
        ctx.save();
        ctx.translate(lineX + 10, zone.y + zone.radius * 2 + (canvas.height - (zone.y + zone.radius * 2)) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(distanceToBottom.toFixed(1) + '"', 0, 0);
        ctx.restore();
    }
    
    ctx.setLineDash([]);
}
