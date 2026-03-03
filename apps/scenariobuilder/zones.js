// Zone management functions
const zoneColors = {
    red: 'rgba(200, 0, 0, 0.5)',      // Deeper red with more opacity
    blue: 'rgba(0, 50, 150, 0.5)',    // Deeper blue with more opacity
    special: 'rgba(230, 226, 22, 0.75)' // Keep yellow as is
};

function drawZone(zone) {
    ctx.fillStyle = zoneColors[zone.type];
    
    if (zone.isCircle) {
        ctx.beginPath();
        ctx.arc(zone.x + zone.radius, zone.y + zone.radius, zone.radius, 0, Math.PI * 2);
        ctx.fill();
        
        if (zone === selectedItem) {
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Show diameter in inches (no resize handle for fixed size)
            const diameter = (zone.radius * 2 / SCALE).toFixed(1);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            const labelText = 'Ø ' + diameter + '"';
            ctx.font = 'bold 12px Arial';
            const textWidth = ctx.measureText(labelText).width;
            ctx.fillRect(zone.x + zone.radius - textWidth/2 - 5, zone.y + zone.radius - 10, textWidth + 10, 20);
            
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(labelText, zone.x + zone.radius, zone.y + zone.radius + 4);
        } else {
            // Show "Obj." label when not selected
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
            
            // Resize handles - top-left for blue, bottom-right for red
            ctx.fillStyle = '#e74c3c';
            if (zone.type === 'blue') {
                ctx.fillRect(zone.x - 5, zone.y - 5, 10, 10);
            } else {
                ctx.fillRect(zone.x + zone.width - 5, zone.y + zone.height - 5, 10, 10);
            }
            
            // Show dimensions in inches
            const widthInches = (zone.width / SCALE).toFixed(1);
            const heightInches = (zone.height / SCALE).toFixed(1);
            const labelText = widthInches + '" × ' + heightInches + '"';
            
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
    if (zone.isCircle) {
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
    // Special zone is fixed size, no resize handles
    if (zone.isCircle) {
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
        // Special zone is fixed size
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
        
        // Red and Blue zones - automatic 72" × 12" dimensions (no prompt)
        const width = 72 * SCALE;  // 72 inches
        const height = 12 * SCALE;  // 12 inches
        
        const zone = {
            type: activeTool.type,
            category: 'zone'
        };
        
        // Red zone starts from northwest (top-left)
        if (activeTool.type === 'red') {
            zone.x = 0;
            zone.y = 0;
            zone.width = Math.min(width, canvas.width);
            zone.height = Math.min(height, canvas.height);
        }
        // Blue zone starts from southeast (bottom-right)
        else if (activeTool.type === 'blue') {
            zone.width = Math.min(width, canvas.width);
            zone.height = Math.min(height, canvas.height);
            zone.x = canvas.width - zone.width;
            zone.y = canvas.height - zone.height;
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
    // Only resize if not a circle (special zone is fixed)
    if (!zone.isCircle) {
        // Clamp x and y to canvas boundaries first
        x = Math.max(0, Math.min(x, canvas.width));
        y = Math.max(0, Math.min(y, canvas.height));
        
        if (resizeCorner === 'se') {
            // Bottom-right resize (red zone)
            zone.width = x - zone.x;
            zone.height = y - zone.y;
        } else if (resizeCorner === 'nw') {
            // Top-left resize (blue zone)
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
    // Only draw for special zones
    if (!zone.isCircle) return;
    
    // Calculate distances to borders using radius
    const centerX = zone.x + zone.radius;
    const centerY = zone.y + zone.radius;
    const distanceToLeft = centerX / SCALE;
    const distanceToTop = centerY / SCALE;
    const distanceToRight = (canvas.width - centerX) / SCALE;
    const distanceToBottom = (canvas.height - centerY) / SCALE;
    
    // Determine closest horizontal and vertical borders
    const closestHorizontal = distanceToLeft < distanceToRight ? 'left' : 'right';
    const closestVertical = distanceToTop < distanceToBottom ? 'top' : 'bottom';
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Draw horizontal measurement line
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
    
    // Draw vertical measurement line
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
