<?php
// Directory containing images and text files
$imageDir = '../images';
$textDir = '../text';

// Initialize variables
$selectedOption = isset($_POST['scenario_type']) ? $_POST['scenario_type'] : null;
$selectedScenario = isset($_POST['selected_scenario']) ? $_POST['selected_scenario'] : null;
$randomImage = null;
$textContent = null;
$showScenarioList = isset($_POST['choose_scenario']) ? true : false;

// If a specific scenario has been selected
if ($selectedScenario && $selectedOption) {
    $randomImage = $selectedScenario;
    
    // Get the base filename (without extension and directory)
    $imagePath = pathinfo($randomImage);
    $baseFilename = $imagePath['filename'];
    
    // Look for corresponding HTML file in text directory
    $textSubDir = $textDir . '/' . $selectedOption;
    $htmlFile = $textSubDir . '/' . $baseFilename . '.html';
    
    // Read the HTML file content if it exists
    if (file_exists($htmlFile)) {
        $htmlContent = file_get_contents($htmlFile);
        
        // Extract content between <body> tags to avoid duplicate HTML structure
        if (preg_match('/<body[^>]*>(.*?)<\/body>/is', $htmlContent, $matches)) {
            $textContent = $matches[1];
        } else {
            // If no body tags found, use the entire content
            $textContent = $htmlContent;
        }
    }
}
// If showing scenario list
elseif ($showScenarioList && $selectedOption) {
    // Get all image files from the selected subdirectory
    $subDir = $imageDir . '/' . $selectedOption;
    $imageFiles = glob($subDir . '/*.{jpg,jpeg,png,gif}', GLOB_BRACE);
    
    // Sort for consistent ordering
    sort($imageFiles);
}
// If an option has been selected for random
elseif ($selectedOption && !$showScenarioList) {
    // Define subdirectories based on the selected option
    $subDir = $imageDir . '/' . $selectedOption;

    // Get all image files from the selected subdirectory
    $imageFiles = glob($subDir . '/*.{jpg,jpeg,png,gif}', GLOB_BRACE);

    // Select a random image if images exist
    if (!empty($imageFiles)) {
        $randomImage = $imageFiles[array_rand($imageFiles)];

        // Get the base filename (without extension and directory)
        $imagePath = pathinfo($randomImage);
        $baseFilename = $imagePath['filename'];

        // Look for corresponding HTML file in text directory
        $textSubDir = $textDir . '/' . $selectedOption;
        $htmlFile = $textSubDir . '/' . $baseFilename . '.html';

        // Read the HTML file content if it exists
        if (file_exists($htmlFile)) {
            $htmlContent = file_get_contents($htmlFile);

            // Extract content between <body> tags to avoid duplicate HTML structure
            if (preg_match('/<body[^>]*>(.*?)<\/body>/is', $htmlContent, $matches)) {
                $textContent = $matches[1];
            } else {
                // If no body tags found, use the entire content
                $textContent = $htmlContent;
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Old World Random Scenario Selector</title>
<style>
body {
    font-family: Arial, sans-serif;
    margin: 20px;
}
.dropdown-section {
    text-align: center;
    margin: 40px auto;
    padding: 20px;
}
select {
    padding: 10px;
    font-size: 16px;
    margin: 10px;
    min-width: 200px;
}
button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    margin: 5px;
}
button:hover {
    background-color: #45a049;
}
.result-section {
    text-align: center;
    margin: 20px auto;
}
.text-content {
    max-width: 800px;
    margin: 30px auto;
    padding: 20px;
    text-align: left;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    line-height: 1.6;
}
.scenario-list {
    max-width: 600px;
    margin: 20px auto;
    text-align: left;
}
.scenario-list select {
    width: 100%;
    padding: 12px;
    font-size: 16px;
}
</style>
</head>
<body>
<center><a href="../index.html"><img src="../towlogo.jpg" style="width:300px;height:150px;"></a></center>
<center><u><h1>Scenario Selector</h1></u></center>
<?php if (!$selectedOption && !$showScenarioList): ?>
<!-- Dropdown selection section -->
<div class="dropdown-section">
<form method="POST" action="">
<label for="scenario_type"><strong>Choose your scenario type:</strong></label><br><br>
<select name="scenario_type" id="scenario_type" required>
<option value="ttgc" selected>TTGC Tournament Maps</option>
<option value="squarebased">Square Based Maps</option>
</select><br><br><strong>and</strong><br><br>
<button type="submit">Get Random Scenario</button>
<button type="submit" name="choose_scenario" value="1">Choose Specific Scenario</button>
</form>
</div>
<?php elseif ($showScenarioList && !$selectedScenario): ?>
<!-- Scenario selection list -->
<div class="dropdown-section">
<p><strong>Select a specific <?php echo htmlspecialchars($selectedOption); ?> scenario:</strong></p>
<form method="POST" action="">
<input type="hidden" name="scenario_type" value="<?php echo htmlspecialchars($selectedOption); ?>">
<div class="scenario-list">
<select name="selected_scenario" required>
<option value="">-- Choose a scenario --</option>
<?php
if (!empty($imageFiles)) {
    foreach ($imageFiles as $imageFile) {
        $imagePath = pathinfo($imageFile);
        $displayName = str_replace(['_', '-'], ' ', $imagePath['filename']);
        $displayName = ucwords($displayName);
        echo '<option value="' . htmlspecialchars($imageFile) . '">' . htmlspecialchars($displayName) . '</option>';
    }
}
?>
</select>
</div><br>
<button type="submit">View Scenario</button>
<form method="GET" action="" style="display:inline;">
<!-- <button type="submit">Start Over</button> --!>
</form>
</form>
</div>
<?php else: ?>
<!-- Random image and text display section -->
<div class="result-section">
<?php if ($randomImage): ?>
<p>Here is your <?php echo $selectedScenario ? 'selected' : 'random'; ?> <strong><?php echo htmlspecialchars($selectedOption); ?></strong> scenario:</p>
<img src="<?php echo htmlspecialchars($randomImage); ?>" alt="Random Image" style="max-width: 101%; height: auto;">

<?php if ($textContent): ?>
<div class="text-content">
<?php echo $textContent; ?>
</div>
<?php endif; ?>

<?php else: ?>
<p>No images found for <strong><?php echo htmlspecialchars($selectedOption); ?></strong>!</p>
<?php endif; ?>
<br><br>
<form method="POST" action="" style="display:inline;">
<input type="hidden" name="scenario_type" value="<?php echo htmlspecialchars($selectedOption); ?>">
<button type="submit">Get Another</button>
</form>
<form method="GET" action="" style="display:inline;">
<button type="submit">Start Over</button>
</form>
</div>
<?php endif; ?>
</body>
</html>

