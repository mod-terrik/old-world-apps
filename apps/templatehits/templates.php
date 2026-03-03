<?php
/**
 * Circle Base Coverage Calculator
 * Calculates how many rectangular bases are fully or partially 
 * covered by a template (circle or teardrop shape)
 */

// Initialize variables
$baseSize = null;
$numColumns = null;
$numRows = null;
$templateType = null;
$circleDiameter = null;
$results = null;
$errors = [];

// Process form submission
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Validate inputs
    if (empty($_POST['baseSize']) || !is_numeric($_POST['baseSize']) || $_POST['baseSize'] <= 0) {
        $errors[] = "Base size must be a positive number";
    } else {
        $baseSize = floatval($_POST['baseSize']);
    }
    
    if (empty($_POST['columns']) || !is_numeric($_POST['columns']) || $_POST['columns'] <= 0 || $_POST['columns'] != intval($_POST['columns'])) {
        $errors[] = "Number of columns must be a positive integer";
    } else {
        $numColumns = intval($_POST['columns']);
    }
    
    if (empty($_POST['rows']) || !is_numeric($_POST['rows']) || $_POST['rows'] <= 0 || $_POST['rows'] != intval($_POST['rows'])) {
        $errors[] = "Number of rows must be a positive integer";
    } else {
        $numRows = intval($_POST['rows']);
    }
    
    if (empty($_POST['templateType'])) {
        $errors[] = "Please select a template type";
    } else {
        $templateType = $_POST['templateType'];
        
        if ($templateType == 'circle') {
            if (empty($_POST['templateSize']) || !in_array($_POST['templateSize'], ['3', '5'])) {
                $errors[] = "Please select a template size (3 or 5 inches)";
            } else {
                $circleDiameter = intval($_POST['templateSize']);
            }
        }
    }
    
    // If no errors, perform calculations
    if (empty($errors)) {
        if ($templateType == 'circle') {
            $results = calculateCircleCoverage($baseSize, $numColumns, $numRows, $circleDiameter);
        } else if ($templateType == 'teardrop') {
            $results = calculateTeardropMaxCoverage($baseSize, $numColumns, $numRows);
        }
    }
}

/**
 * Calculate area of circular segment
 */
function circularSegmentArea($r, $d) {
    if ($d >= $r) return 0;
    if ($d <= -$r) return M_PI * $r * $r;
    
    $theta = 2 * acos($d / $r);
    return ($r * $r / 2) * ($theta - sin($theta));
}

/**
 * Calculate area of circle-rectangle intersection
 */
function calculateCircleRectangleIntersectionArea($cx, $cy, $radius, $rx, $ry, $rw, $rh) {
    // Always use analytical grid-based method for consistent, accurate results
    return calculateCircleRectangleIntersectionAreaAnalytical($cx, $cy, $radius, $rx, $ry, $rw, $rh);
}

/**
 * Calculate corner overlap area
 */
function cornerOverlapArea($r, $x, $y) {
    $area = ($r * $r / 2) * (acos($y / $r) + acos($x / $r) - M_PI / 2);
    $area -= ($x * sqrt($r * $r - $x * $x) / 2);
    $area -= ($y * sqrt($r * $r - $y * $y) / 2);
    $area += $x * $y;
    return $area;
}

/**
 * Monte Carlo approximation for intersection area
 */
function monteCarloIntersectionArea($cx, $cy, $radius, $rx, $ry, $rw, $rh, $samples = 1000) {
    $hits = 0;
    $rectArea = $rw * $rh;
    
    for ($i = 0; $i < $samples; $i++) {
        $px = $rx + mt_rand() / mt_getrandmax() * $rw;
        $py = $ry + mt_rand() / mt_getrandmax() * $rh;
        
        $dist = sqrt(pow($px - $cx, 2) + pow($py - $cy, 2));
        if ($dist <= $radius) {
            $hits++;
        }
    }
    
    return ($hits / $samples) * $rectArea;
}

/**
 * Analytical circle-rectangle intersection using grid sampling (DETERMINISTIC)
 * This replaces Monte Carlo with a fixed grid of sample points for consistent results
 */
function calculateCircleRectangleIntersectionAreaAnalytical($cx, $cy, $radius, $rx, $ry, $rw, $rh) {
    // Use a fine grid of test points (100x100 grid = 10,000 points)
    // This is deterministic - always gives the same result
    $gridSize = 100;
    $stepX = $rw / $gridSize;
    $stepY = $rh / $gridSize;

    $hits = 0;
    $totalPoints = $gridSize * $gridSize;

    // Sample at the center of each grid cell for better accuracy
    for ($i = 0; $i < $gridSize; $i++) {
        for ($j = 0; $j < $gridSize; $j++) {
            $px = $rx + ($i + 0.5) * $stepX;
            $py = $ry + ($j + 0.5) * $stepY;

            $dist = sqrt(pow($px - $cx, 2) + pow($py - $cy, 2));
            if ($dist <= $radius) {
                $hits++;
            }
        }
    }

    return ($hits / $totalPoints) * ($rw * $rh);
}

/**
 * Circle coverage calculation (centered)
 */
function calculateCircleCoverage($baseSizeMM, $numColumns, $numRows, $circleDiameterInches) {
    $circleDiameterMM = $circleDiameterInches * 25.4;
    $radius = $circleDiameterMM / 2;
    $gridWidthMM = $numColumns * $baseSizeMM;
    $gridLengthMM = $numRows * $baseSizeMM;
    $circleCenterX = $gridWidthMM / 2;
    $circleCenterY = $gridLengthMM / 2;
    
    $fullyUnder = 0;
    $partiallyUnder = 0;
    $coverageMap = [];
    $baseArea = $baseSizeMM * $baseSizeMM;
    
    for ($row = 0; $row < $numRows; $row++) {
        for ($col = 0; $col < $numColumns; $col++) {
            $rectX = $col * $baseSizeMM;
            $rectY = $row * $baseSizeMM;
            
            $coverage = 'none';
            if (circleIntersectsRectangle($circleCenterX, $circleCenterY, $circleDiameterMM, 
                                           $rectX, $rectY, $baseSizeMM, $baseSizeMM)) {
                
                // Calculate actual intersection area
                $intersectionArea = calculateCircleRectangleIntersectionArea(
                    $circleCenterX, $circleCenterY, $radius,
                    $rectX, $rectY, $baseSizeMM, $baseSizeMM
                );
                
                $coveragePercent = ($intersectionArea / $baseArea) * 100;
                
                if ($coveragePercent >= 98) {
                    $fullyUnder++;
                    $coverage = 'full';
                } else if ($coveragePercent > 1) {
                    $partiallyUnder++;
                    $coverage = 'partial';
                }
                // If coverage <= 2%, it stays as 'none'
            }
            $coverageMap[] = ['row' => $row, 'col' => $col, 'coverage' => $coverage];
        }
    }
    
    return [
        'templateType' => 'circle',
        'circleDiameterInches' => $circleDiameterInches,
        'circleDiameterMM' => $circleDiameterMM,
        'totalBases' => $numColumns * $numRows,
        'fullyUnder' => $fullyUnder,
        'partiallyUnder' => $partiallyUnder,
        'notUnder' => ($numColumns * $numRows) - $fullyUnder - $partiallyUnder,
        'placement' => 'centered',
        'centerX' => $circleCenterX,
        'centerY' => $circleCenterY,
        'coverageMap' => $coverageMap
    ];
}

/**
 * Check if teardrop bounding box intersects with rectangle (quick rejection test)
 */
function teardropBoundingBoxIntersects($centerX, $centerY, $rotation, $length, $wideEnd, $rectX, $rectY, $rectSize) {
    // Calculate approximate bounding box for teardrop
    $halfLength = $length / 2;
    $maxRadius = $wideEnd / 2;
    
    // Simple approximation: use a circle with radius = half length + max radius
    $boundingRadius = $halfLength + $maxRadius;
    
    // Check if bounding circle intersects with rectangle
    $closestX = max($rectX, min($centerX, $rectX + $rectSize));
    $closestY = max($rectY, min($centerY, $rectY + $rectSize));
    $distanceSquared = pow($centerX - $closestX, 2) + pow($centerY - $closestY, 2);
    
    return $distanceSquared <= pow($boundingRadius, 2);
}

/**
 * Calculate teardrop-rectangle intersection area using Two-Phase Monte Carlo
 * Phase 1: Quick estimate with fewer samples
 * Phase 2: Accurate calculation only if needed
 */
function calculateTeardropRectangleIntersectionArea($centerX, $centerY, $rotation, $length, $wideEnd, $narrowEnd, $rectX, $rectY, $rectSize, $quickCheck = false) {
    // OPTIMIZATION: Two-phase approach
    $samples = $quickCheck ? 100 : 250;
    
    $hits = 0;
    $rectArea = $rectSize * $rectSize;
    
    for ($i = 0; $i < $samples; $i++) {
        $px = $rectX + mt_rand() / mt_getrandmax() * $rectSize;
        $py = $rectY + mt_rand() / mt_getrandmax() * $rectSize;
        
        $point = ['x' => $px, 'y' => $py];
        if (isPointInTeardrop($point, $centerX, $centerY, $rotation, $length, $wideEnd, $narrowEnd)) {
            $hits++;
        }
    }
    
    return ($hits / $samples) * $rectArea;
}

/**
 * Check if all four corners of a rectangle are inside the teardrop
 */
function isRectangleFullyInsideTeardrop($centerX, $centerY, $rotation, $length, $wideEnd, $narrowEnd, $rectX, $rectY, $rectSize) {
    $corners = [
        ['x' => $rectX, 'y' => $rectY],
        ['x' => $rectX + $rectSize, 'y' => $rectY],
        ['x' => $rectX + $rectSize, 'y' => $rectY + $rectSize],
        ['x' => $rectX, 'y' => $rectY + $rectSize]
    ];
    
    foreach ($corners as $corner) {
        if (!isPointInTeardrop($corner, $centerX, $centerY, $rotation, $length, $wideEnd, $narrowEnd)) {
            return false;
        }
    }
    
    return true;
}

/**
 * Teardrop maximum coverage calculation - OPTIMIZED TWO-STAGE SEARCH
 * Stage 1: Coarse search with fewer rotations and reduced margin
 * Stage 2: Fine search with expanded rotation testing
 */
function calculateTeardropMaxCoverage($baseSizeMM, $numColumns, $numRows) {
    $teardropLength = 208;
    $teardropWideEnd = 61;
    $teardropNarrowEnd = 9;
    
    $gridWidthMM = $numColumns * $baseSizeMM;
    $gridLengthMM = $numRows * $baseSizeMM;
    
    $maxPossibleFullyCovered = $numColumns * $numRows;
    
    // OPTIMIZED: Reduced margin from 104mm to 60mm (still allows good off-grid coverage)
    $margin = 60;
    
    // OPTIMIZED: Fewer rotations in coarse search (every 60° instead of 30°)
    $coarseRotations = [0, 60, 120, 180, 240, 300];
    
    // =================================================================
    // STAGE 1: COARSE SEARCH - Fast initial search
    // =================================================================
    $coarseStep = $baseSizeMM / 2;
    $coarseBestFully = 0;
    $coarseBestPartially = 0;
    $coarseBestX = $gridWidthMM / 2;
    $coarseBestY = $gridLengthMM / 2;
    $coarseBestRotation = 0;
    
    // Build and sort positions by distance from center
    $positions = [];
    $centerX = $gridWidthMM / 2;
    $centerY = $gridLengthMM / 2;
    
    for ($testY = -$margin; $testY <= $gridLengthMM + $margin; $testY += $coarseStep) {
        for ($testX = -$margin; $testX <= $gridWidthMM + $margin; $testX += $coarseStep) {
            $distFromCenter = sqrt(pow($testX - $centerX, 2) + pow($testY - $centerY, 2));
            $positions[] = ['x' => $testX, 'y' => $testY, 'dist' => $distFromCenter];
        }
    }
    
    usort($positions, function($a, $b) {
        return $a['dist'] <=> $b['dist'];
    });
    
    $foundMaxCoverage = false;
    
    foreach ($positions as $pos) {
        if ($foundMaxCoverage) break;
        
        $testX = $pos['x'];
        $testY = $pos['y'];
        
        foreach ($coarseRotations as $rotation) {
            $coverage = countTeardropCoverageOptimized($baseSizeMM, $numColumns, $numRows, $testX, $testY, $rotation, $teardropLength, $teardropWideEnd, $teardropNarrowEnd, $coarseBestFully, $coarseBestPartially);
            
            $isBetter = false;
            if ($coverage['fullyUnder'] > $coarseBestFully) {
                $isBetter = true;
            } else if ($coverage['fullyUnder'] == $coarseBestFully && $coverage['partiallyUnder'] > $coarseBestPartially) {
                $isBetter = true;
            }
            
            if ($isBetter) {
                $coarseBestFully = $coverage['fullyUnder'];
                $coarseBestPartially = $coverage['partiallyUnder'];
                $coarseBestX = $testX;
                $coarseBestY = $testY;
                $coarseBestRotation = $rotation;
                
                if ($coarseBestFully >= $maxPossibleFullyCovered) {
                    $foundMaxCoverage = true;
                    break;
                }
            }
        }
    }
    
    // =================================================================
    // STAGE 2: FINE SEARCH - Precise search around coarse best
    // =================================================================
    $fineStep = $baseSizeMM / 8;
    
    // OPTIMIZED: Reduced fine search radius from 1.5 to 1.0 base sizes
    $fineSearchRadius = $baseSizeMM;
    
    $fineBestFully = $coarseBestFully;
    $fineBestPartially = $coarseBestPartially;
    $fineBestX = $coarseBestX;
    $fineBestY = $coarseBestY;
    $fineBestRotation = $coarseBestRotation;
    $fineBestCoverageMap = [];
    
    // OPTIMIZED: Test more angles in fine search to compensate for fewer coarse rotations
    // Test best coarse rotation and ±30° and ±60°
    $fineRotations = [
        $coarseBestRotation,
        ($coarseBestRotation - 60 + 360) % 360,
        ($coarseBestRotation - 30 + 360) % 360,
        ($coarseBestRotation + 30) % 360,
        ($coarseBestRotation + 60) % 360
    ];
    
    // Fine search around the coarse best position
    for ($testY = $coarseBestY - $fineSearchRadius; $testY <= $coarseBestY + $fineSearchRadius; $testY += $fineStep) {
        for ($testX = $coarseBestX - $fineSearchRadius; $testX <= $coarseBestX + $fineSearchRadius; $testX += $fineStep) {
            foreach ($fineRotations as $rotation) {
                $coverage = countTeardropCoverageOptimized($baseSizeMM, $numColumns, $numRows, $testX, $testY, $rotation, $teardropLength, $teardropWideEnd, $teardropNarrowEnd, $fineBestFully, $fineBestPartially);
                
                $isBetter = false;
                if ($coverage['fullyUnder'] > $fineBestFully) {
                    $isBetter = true;
                } else if ($coverage['fullyUnder'] == $fineBestFully && $coverage['partiallyUnder'] > $fineBestPartially) {
                    $isBetter = true;
                }
                
                if ($isBetter) {
                    $fineBestFully = $coverage['fullyUnder'];
                    $fineBestPartially = $coverage['partiallyUnder'];
                    $fineBestX = $testX;
                    $fineBestY = $testY;
                    $fineBestRotation = $rotation;
                    $fineBestCoverageMap = $coverage['coverageMap'];
                }
            }
        }
    }
    
    // FIX: If no improvement was found in fine search, generate coverage map for coarse best
    if (empty($fineBestCoverageMap)) {
        $finalCoverage = countTeardropCoverageOptimized($baseSizeMM, $numColumns, $numRows, $fineBestX, $fineBestY, $fineBestRotation, $teardropLength, $teardropWideEnd, $teardropNarrowEnd, -1, -1);
        $fineBestCoverageMap = $finalCoverage['coverageMap'];
    }
    
    return [
        'templateType' => 'teardrop',
        'teardropLength' => $teardropLength,
        'teardropWideEnd' => $teardropWideEnd,
        'teardropNarrowEnd' => $teardropNarrowEnd,
        'totalBases' => $numColumns * $numRows,
        'fullyUnder' => $fineBestFully,
        'partiallyUnder' => $fineBestPartially,
        'notUnder' => ($numColumns * $numRows) - $fineBestFully - $fineBestPartially,
        'placement' => 'optimized',
        'bestX' => round($fineBestX, 2),
        'bestY' => round($fineBestY, 2),
        'bestRotation' => $fineBestRotation,
        'coverageMap' => $fineBestCoverageMap
    ];
}

/**
 * Count teardrop coverage at a specific position and rotation - OPTIMIZED
 */
function countTeardropCoverageOptimized($baseSizeMM, $numColumns, $numRows, $centerX, $centerY, $rotation, $length, $wideEnd, $narrowEnd, $currentBestFully, $currentBestPartially) {
    $fullyUnder = 0;
    $partiallyUnder = 0;
    $coverageMap = [];
    $baseArea = $baseSizeMM * $baseSizeMM;
    
    $shouldExit = false;
    
    for ($row = 0; $row < $numRows; $row++) {
        if ($shouldExit) break;
        
        for ($col = 0; $col < $numColumns; $col++) {
            $rectX = $col * $baseSizeMM;
            $rectY = $row * $baseSizeMM;
            
            $coverage = 'none';
            
            // Quick rejection test using bounding box
            if (teardropBoundingBoxIntersects($centerX, $centerY, $rotation, $length, $wideEnd, $rectX, $rectY, $baseSizeMM)) {
                
                // Check if all corners are inside for full coverage (100%)
                if (isRectangleFullyInsideTeardrop($centerX, $centerY, $rotation, $length, $wideEnd, $narrowEnd, $rectX, $rectY, $baseSizeMM)) {
                    $fullyUnder++;
                    $coverage = 'full';
                } else {
                    // OPTIMIZATION: Two-phase Monte Carlo
                    // Phase 1: Quick check with fewer samples
                    $quickIntersectionArea = calculateTeardropRectangleIntersectionArea(
                        $centerX, $centerY, $rotation, $length, $wideEnd, $narrowEnd,
                        $rectX, $rectY, $baseSizeMM, true // quickCheck = true
                    );
                    
                    $quickCoveragePercent = ($quickIntersectionArea / $baseArea) * 100;
                    
                    // Phase 2: Only do accurate calculation if quick check shows promise
                    if ($quickCoveragePercent >= 0.5) { // Lower threshold for quick check
                        $intersectionArea = calculateTeardropRectangleIntersectionArea(
                            $centerX, $centerY, $rotation, $length, $wideEnd, $narrowEnd,
                            $rectX, $rectY, $baseSizeMM, false // quickCheck = false
                        );
                        
                        $coveragePercent = ($intersectionArea / $baseArea) * 100;
                        
                        if ($coveragePercent >= 1) {
                            $partiallyUnder++;
                            $coverage = 'partial';
                        }
                    }
                }
            }
            
            $coverageMap[] = ['row' => $row, 'col' => $col, 'coverage' => $coverage];
        }
        
        // OPTIMIZATION: Early exit if this position can't beat current best
        // Check if we can still beat the best fully covered count
        $remainingBases = ($numRows - $row - 1) * $numColumns;
        if ($fullyUnder + $remainingBases < $currentBestFully) {
            // Can't beat current best for fully covered, abandon this position
            for ($r = $row + 1; $r < $numRows; $r++) {
                for ($c = 0; $c < $numColumns; $c++) {
                    $coverageMap[] = ['row' => $r, 'col' => $c, 'coverage' => 'none'];
                }
            }
            $shouldExit = true;
            break;
        }
    }
    
    return [
        'fullyUnder' => $fullyUnder, 
        'partiallyUnder' => $partiallyUnder,
        'coverageMap' => $coverageMap
    ];
}

/**
 * Check if point is inside teardrop (with semicircular ends)
 */
function isPointInTeardrop($point, $centerX, $centerY, $rotation, $length, $wideEnd, $narrowEnd) {
    $radians = deg2rad(-$rotation);
    $cos = cos($radians);
    $sin = sin($radians);
    
    $localX = ($point['x'] - $centerX) * $cos - ($point['y'] - $centerY) * $sin;
    $localY = ($point['x'] - $centerX) * $sin + ($point['y'] - $centerY) * $cos;
    
    $halfLength = $length / 2;
    $wideRadius = $wideEnd / 2;
    $narrowRadius = $narrowEnd / 2;
    
    if ($localX < -$halfLength) {
        $distSq = pow($localX + $halfLength, 2) + pow($localY, 2);
        return $distSq <= pow($wideRadius, 2);
    }
    
    if ($localX > $halfLength) {
        $distSq = pow($localX - $halfLength, 2) + pow($localY, 2);
        return $distSq <= pow($narrowRadius, 2);
    }
    
    $t = ($localX + $halfLength) / $length;
    $radiusAtX = $wideRadius + ($narrowRadius - $wideRadius) * $t;
    
    return abs($localY) <= $radiusAtX;
}

/**
 * Check if a point is inside the circle
 */
function isPointInCircle($px, $py, $cx, $cy, $diameter) {
    $distanceSquared = pow($px - $cx, 2) + pow($py - $cy, 2);
    return $distanceSquared <= pow($diameter / 2, 2);
}

/**
 * Check if circle intersects with rectangle
 */
function circleIntersectsRectangle($cx, $cy, $diameter, $rx, $ry, $rw, $rh) {
    $closestX = max($rx, min($cx, $rx + $rw));
    $closestY = max($ry, min($cy, $ry + $rh));
    $distanceSquared = pow($cx - $closestX, 2) + pow($cy - $closestY, 2);
    return $distanceSquared <= pow($diameter / 2, 2);
}

/**
 * Generate SVG diagram (without legend)
 */
function generateSVG($results, $baseSize, $numColumns, $numRows) {
    $gridWidthMM = $numColumns * $baseSize;
    $gridLengthMM = $numRows * $baseSize;
    
    $maxDimension = max($gridWidthMM, $gridLengthMM);
    $svgSize = 600;
    $scale = $svgSize / $maxDimension;
    $padding = 20;
    
    $svgWidth = $gridWidthMM * $scale + 2 * $padding;
    $svgHeight = $gridLengthMM * $scale + 2 * $padding;
    
    $svg = '<svg width="' . $svgWidth . '" height="' . $svgHeight . '" xmlns="http://www.w3.org/2000/svg">';
    
    // Draw grid squares
    foreach ($results['coverageMap'] as $cell) {
        $x = $cell['col'] * $baseSize * $scale + $padding;
        $y = $cell['row'] * $baseSize * $scale + $padding;
        $size = $baseSize * $scale;
        
        $fillColor = '#ffffff';
        $strokeColor = '#000000';
        $strokeWidth = 1;
        
        if ($cell['coverage'] == 'full') {
            $fillColor = '#4CAF50';
        } elseif ($cell['coverage'] == 'partial') {
            $fillColor = '#FFC107';
        }
        
        $svg .= '<rect x="' . $x . '" y="' . $y . '" width="' . $size . '" height="' . $size . '" ';
        $svg .= 'fill="' . $fillColor . '" stroke="' . $strokeColor . '" stroke-width="' . $strokeWidth . '" />';
    }
    
    // Draw template overlay
    if ($results['templateType'] == 'circle') {
        $cx = $results['centerX'] * $scale + $padding;
        $cy = $results['centerY'] * $scale + $padding;
        $radius = ($results['circleDiameterMM'] / 2) * $scale;
        
        $svg .= '<circle cx="' . $cx . '" cy="' . $cy . '" r="' . $radius . '" ';
        $svg .= 'fill="none" stroke="#2196F3" stroke-width="3" opacity="0.8" />';
    } elseif ($results['templateType'] == 'teardrop') {
        $svg .= generateTeardropPath(
            $results['bestX'], 
            $results['bestY'], 
            $results['bestRotation'], 
            $results['teardropLength'],
            $results['teardropWideEnd'],
            $results['teardropNarrowEnd'],
            $scale,
            $padding
        );
    }
    
    $svg .= '</svg>';
    
    return $svg;
}

/**
 * Generate teardrop SVG path with semicircular ends
 */
function generateTeardropPath($centerX, $centerY, $rotation, $length, $wideEnd, $narrowEnd, $scale, $padding) {
    $halfLength = $length / 2;
    $wideRadius = $wideEnd / 2;
    $narrowRadius = $narrowEnd / 2;
    
    $points = [
        ['x' => -$halfLength, 'y' => -$wideRadius],
        ['x' => -$halfLength, 'y' => $wideRadius],
        ['x' => $halfLength, 'y' => -$narrowRadius],
        ['x' => $halfLength, 'y' => $narrowRadius]
    ];
    
    $radians = deg2rad($rotation);
    $cos = cos($radians);
    $sin = sin($radians);
    
    $transformed = [];
    foreach ($points as $point) {
        $transformed[] = [
            'x' => ($point['x'] * $cos - $point['y'] * $sin + $centerX) * $scale + $padding,
            'y' => ($point['x'] * $sin + $point['y'] * $cos + $centerY) * $scale + $padding
        ];
    }
    
    $wideTop = $transformed[0];
    $wideBottom = $transformed[1];
    $narrowTop = $transformed[2];
    $narrowBottom = $transformed[3];
    
    $wideR = $wideRadius * $scale;
    $narrowR = $narrowRadius * $scale;
    
    $path = '<path d="';
    $path .= 'M ' . $wideTop['x'] . ' ' . $wideTop['y'] . ' ';
    $path .= 'L ' . $narrowTop['x'] . ' ' . $narrowTop['y'] . ' ';
    $path .= 'A ' . $narrowR . ' ' . $narrowR . ' 0 0 1 ';
    $path .= $narrowBottom['x'] . ' ' . $narrowBottom['y'] . ' ';
    $path .= 'L ' . $wideBottom['x'] . ' ' . $wideBottom['y'] . ' ';
    $path .= 'A ' . $wideR . ' ' . $wideR . ' 0 0 1 ';
    $path .= $wideTop['x'] . ' ' . $wideTop['y'] . ' ';
    $path .= 'Z" ';
    $path .= 'fill="none" stroke="#2196F3" stroke-width="3" opacity="0.8" />';
    
    return $path;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Template Base Coverage Calculator</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #555;
        }
        input[type="number"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        }
        input[type="number"]:focus {
            outline: none;
            border-color: #4CAF50;
        }
        .radio-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 8px;
        }
        .radio-option {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        input[type="radio"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        .radio-option label {
            margin: 0;
            font-weight: normal;
            cursor: pointer;
        }
        .circle-size-group {
            margin-left: 26px;
            margin-top: 8px;
            display: flex;
            gap: 15px;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
        }
        button:hover {
            background-color: #45a049;
        }
        .error {
            background-color: #f44336;
            color: white;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .results {
            background-color: #e8f5e9;
            padding: 20px;
            border-radius: 4px;
            margin-top: 20px;
            border-left: 4px solid #4CAF50;
        }
        .results h2 {
            margin-top: 0;
            color: #2e7d32;
        }
        .result-item {
            margin: 10px 0;
            padding: 8px;
            background-color: white;
            border-radius: 3px;
        }
        .result-label {
            font-weight: bold;
            color: #555;
        }
        .result-value {
            color: #2e7d32;
            font-size: 18px;
            font-weight: bold;
        }
        .info {
            background-color: #e3f2fd;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            border-left: 4px solid #2196F3;
        }
        .warning {
            background-color: #fff3cd;
            padding: 15px;
            border-radius: 4px;
            margin-top: 15px;
            border-left: 4px solid #ffc107;
            color: #856404;
        }
        .diagram {
            margin-top: 20px;
            padding: 20px;
            background-color: white;
            border-radius: 4px;
            text-align: center;
        }
        .diagram h3 {
            margin-top: 0;
            color: #2e7d32;
        }
        .svg-container {
            display: inline-block;
            margin-top: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            background-color: #fafafa;
	}
        .legend {
  	    margin-top: 10px;
    	    padding: 5px;
      	    background-color: #f9f9f9;
    	    border-radius: 4px;
    	    border: 1px solid #ddd;
    	    text-align: center;
        }
        .legend-items {
    	    display: flex;
    	    justify-content: center;
     	    flex-wrap: wrap;
    	    gap: 20px;
        }
	.legend-item {
           display: flex;
    	   flex-direction: column;
    	   align-items: center;
    	   gap: 5px;
        }
        .legend-box {
            width: 24px;
            height: 20px;
            border: 1px solid #000;
            border-radius: 3px;
            flex-shrink: 0;
        }
        .legend-box.full {
            background-color: #4CAF50;
        }
        .legend-box.partial {
            background-color: #FFC107;
        }
        .legend-box.none {
            background-color: #ffffff;
        }
        .legend-box.template {
            background-color: transparent;
            border: 3px solid #2196F3;
        }
        .legend-text {
            font-size: 14px;
            color: #555;
        }
    </style>
    <script>
        function toggleCircleSize() {
            const circleRadio = document.getElementById('typeCircle');
            const circleSizeDiv = document.getElementById('circleSizeOptions');
            circleSizeDiv.style.display = circleRadio.checked ? 'flex' : 'none';
        }
        
        window.onload = function() {
            toggleCircleSize();
        }
    </script>
</head>
<body>
    <div class="container">
        <center><a href="../index.html"><img src="../towlogo.jpg" style="width:300px;height:150px;"></a></center>
        <center><h1>Template Base Coverage Calculator</h1></center>
        
        <div class="info">
            This calculator determines how many bases in a unit are covered by a circular template that is centered on the unit. Choose between three inch or five inch templates.<br><br><b>Note</b> that the template calulations make a special exception that if a base is 99% covered by the template it counts as fully covered. This takes into account the varying size of official and non official bases, and the fact that most players would count those as full hits visually.
        </div>
        
        <?php if (!empty($errors)): ?>
            <div class="error">
                <strong>Please fix the following errors:</strong>
                <ul style="margin: 10px 0 0 0;">
                    <?php foreach ($errors as $error): ?>
                        <li><?php echo htmlspecialchars($error); ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>
        
        <form method="POST" action="">
            <div class="form-group">
                <label>Template Type:</label>
                <div class="radio-group">
                    <div class="radio-option">
                        <input type="radio" id="typeCircle" name="templateType" value="circle" 
                               <?php echo (!isset($_POST['templateType']) || $_POST['templateType'] == 'circle') ? 'checked' : ''; ?>
                               onchange="toggleCircleSize()">
                        <label for="typeCircle">Circle (centered on grid)</label>
                    </div>
                    <div class="circle-size-group" id="circleSizeOptions">
                        <div class="radio-option">
                            <input type="radio" id="size3" name="templateSize" value="3" 
                                   <?php echo (!isset($_POST['templateSize']) || $_POST['templateSize'] == '3') ? 'checked' : ''; ?>>
                            <label for="size3">3 inch diameter</label>
                        </div>
                        <div class="radio-option">
                            <input type="radio" id="size5" name="templateSize" value="5" 
                                   <?php echo (isset($_POST['templateSize']) && $_POST['templateSize'] == '5') ? 'checked' : ''; ?>>
                            <label for="size5">5 inch diameter</label>
                        </div>
                    </div>
                    <!-- <div class="radio-option">
                        <input type="radio" id="typeTeardrop" name="templateType" value="teardrop" 
                               <?php echo (isset($_POST['templateType']) && $_POST['templateType'] == 'teardrop') ? 'checked' : ''; ?>
                               onchange="toggleCircleSize()">
                        <label for="typeTeardrop">Flame Template</label>
                    </div> --!>
                </div>
            </div>
            
            <div class="form-group">
                <br><label for="baseSize">Base Size (millimeters):</label>
                <input type="number" id="baseSize" name="baseSize" step="0.01" 
                       value="<?php echo htmlspecialchars($_POST['baseSize'] ?? '25'); ?>" required>
            </div>
            
            <div class="form-group">
                <label for="columns">Number of columns:</label>
                <input type="number" id="columns" name="columns" min="1" step="1" 
                       value="<?php echo htmlspecialchars($_POST['columns'] ?? '5'); ?>" required>
            </div>
            
            <div class="form-group">
                <label for="rows">Number of rows:</label>
                <input type="number" id="rows" name="rows" min="1" step="1" 
                       value="<?php echo htmlspecialchars($_POST['rows'] ?? '5'); ?>" required>
            </div>
            
            <button type="submit">Calculate Coverage</button>
        </form>
        
        <?php if ($results !== null): ?>
            <div class="results">
                <h2>Results</h2>
                
                <?php if ($results['templateType'] == 'circle'): ?>
                    <div class="result-item">
                        <span class="result-label">Template:</span> 
                        Circle - <?php echo $results['circleDiameterInches']; ?> inches 
                        (<?php echo round($results['circleDiameterMM'], 2); ?> mm) diameter
                    </div>
                    <div class="result-item">
                        <span class="result-label">Placement:</span> Centered on grid
                    </div>
                <?php else: ?>
                    <div class="result-item">
                        <span class="result-label">Template:</span> 
                        Flame - <?php echo $results['teardropLength']; ?>mm long, 
                        <?php echo $results['teardropWideEnd']; ?>mm wide end, 
                        <?php echo $results['teardropNarrowEnd']; ?>mm narrow end
                    </div>
                    <div class="result-item">
                        <span class="result-label">Placement:</span> 
                        Optimized position (X: <?php echo $results['bestX']; ?>mm, 
                        Y: <?php echo $results['bestY']; ?>mm, 
                        Rotation: <?php echo $results['bestRotation']; ?>°)
                    </div>
                    <div class="warning">
                        <strong>Note:</strong> The flame template placement uses two-stage optimization (coarse then fine search) to maximize fully covered bases first, with partial coverage as a secondary consideration. The template can extend beyond the grid edges for optimal coverage. 
                    </div>
                <?php endif; ?>
                
                <div class="result-item">
                    <span class="result-label">Base Size:</span> 
                    <?php echo $baseSize; ?>mm × <?php echo $baseSize; ?>mm
                </div>
                
                <div class="result-item">
                    <span class="result-label">Grid Size:</span> 
                    <?php echo $numColumns; ?> columns × <?php echo $numRows; ?> rows
                </div>
                
                <div class="result-item">
                    <span class="result-label">Total Bases:</span> 
                    <span class="result-value"><?php echo $results['totalBases']; ?></span>
                </div>
                
                <hr style="margin: 15px 0; border: none; border-top: 1px solid #ccc;">
                
                <div class="result-item">
                    <span class="result-label">Bases Fully Under Template:</span> 
                    <span class="result-value"><?php echo $results['fullyUnder']; ?></span>
                </div>
                
                <div class="result-item">
                    <span class="result-label">Bases Partially Under Template:</span> 
                    <span class="result-value"><?php echo $results['partiallyUnder']; ?></span>
                </div>
                
                <div class="result-item">
                    <span class="result-label">Bases Not Under Template:</span> 
                    <span class="result-value"><?php echo $results['notUnder']; ?></span>
                </div>
                
                <div class="diagram">
                    <h3>Visual Coverage Diagram</h3>
                    <div class="svg-container">
                        <?php echo generateSVG($results, $baseSize, $numColumns, $numRows); ?>
                    </div>
                    
                    <div class="legend">
                        <h4>Legend</h4>
                        <div class="legend-items">
                            <div class="legend-item">
                                <div class="legend-box full"></div>
                                <span class="legend-text">Fully Covered</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-box partial"></div>
                                <span class="legend-text">Partially Covered</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-box none"></div>
                                <span class="legend-text">Not Covered</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>

