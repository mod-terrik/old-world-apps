<?php
// Configuration
$baseImageDir = '../images/';
$baseTextDir = '../text/';
$maxFileSize = 5 * 1024 * 1024; // 5MB
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$categories = ['ttgc', 'squarebased'];

$message = '';
$messageType = '';

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $filename = trim($_POST['filename'] ?? '');
    $formattedText = $_POST['formatted_text'] ?? '';
    $category = $_POST['category'] ?? '';
    
    // Validate category
    if (!in_array($category, $categories)) {
        $message = 'Invalid category selected.';
        $messageType = 'error';
    } elseif (empty($filename)) {
        $message = 'Please enter a filename.';
        $messageType = 'error';
    } else {
        // Create category subdirectories
        $uploadDir = $baseImageDir . $category . '/';
        $textDir = $baseTextDir . $category . '/';
        
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        if (!file_exists($textDir)) {
            mkdir($textDir, 0755, true);
        }
        
        // Remove spaces and sanitize filename (but keep original for title)
        $pageTitle = $filename; // Keep original filename with spaces for title
        $cleanFilename = str_replace(' ', '', $filename);
        $cleanFilename = preg_replace('/[^a-zA-Z0-9_-]/', '', $cleanFilename);
        
        if (empty($cleanFilename)) {
            $message = 'Invalid filename. Please use alphanumeric characters only.';
            $messageType = 'error';
        } else {
            $success = true;
            
            // Handle image upload
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $fileTmpPath = $_FILES['image']['tmp_name'];
                $fileSize = $_FILES['image']['size'];
                $fileType = $_FILES['image']['type'];
                
                // Get original file extension
                $originalName = $_FILES['image']['name'];
                $fileExtension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
                
                // Validate file type
                if (!in_array($fileType, $allowedTypes)) {
                    $message = 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.';
                    $messageType = 'error';
                    $success = false;
                } elseif ($fileSize > $maxFileSize) {
                    $message = 'File is too large. Maximum size is 5MB.';
                    $messageType = 'error';
                    $success = false;
                } else {
                    // Move uploaded file
                    $destPath = $uploadDir . $cleanFilename . '.' . $fileExtension;
                    if (!move_uploaded_file($fileTmpPath, $destPath)) {
                        $message = 'Error uploading image file.';
                        $messageType = 'error';
                        $success = false;
                    }
                }
            } else {
                $message = 'Please select an image file.';
                $messageType = 'error';
                $success = false;
            }
            
            // Create HTML file with formatted text
            if ($success && !empty($formattedText)) {
                $htmlContent = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . htmlspecialchars($pageTitle) . '</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <h1>' . htmlspecialchars($pageTitle) . '</h1>
' . $formattedText . '
</body>
</html>';
                
                $htmlFilePath = $textDir . $cleanFilename . '.html';
                if (file_put_contents($htmlFilePath, $htmlContent) === false) {
                    $message = 'Error creating HTML file.';
                    $messageType = 'error';
                    $success = false;
                }
            }
            
            if ($success) {
                $message = 'Files uploaded successfully to ' . $category . '! Image: ' . $cleanFilename . '.' . $fileExtension . ' | HTML: ' . $cleanFilename . '.html';
                $messageType = 'success';
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
    <title>File Upload and Text Editor</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        
        h1 {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 600;
        }
        
        input[type="file"] {
            width: 100%;
            padding: 10px;
            border: 2px dashed #667eea;
            border-radius: 5px;
            background: #f8f9ff;
            cursor: pointer;
        }
        
        input[type="text"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        
        input[type="text"]:focus {
            outline: none;
            border-color: #667eea;
        }
        
        select {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            background: white;
            cursor: pointer;
            transition: border-color 0.3s;
        }
        
        select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            font-family: inherit;
            resize: vertical;
            transition: border-color 0.3s;
        }
        
        textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .small-textbox {
            height: 50px;
        }
        
        .large-textbox {
            min-height: 300px;
        }
        
        .toolbar {
            margin-bottom: 10px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        
        .toolbar button {
            padding: 5px 10px;
            border: 1px solid #ccc;
            background: white;
            cursor: pointer;
            border-radius: 3px;
            font-size: 14px;
        }
        
        .toolbar button:hover {
            background: #e0e0e0;
        }
        
        .submit-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        .submit-btn:hover {
            transform: translateY(-2px);
        }
        
        .message {
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
            text-align: center;
            font-weight: 600;
        }
        
        .message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .help-text {
            font-size: 12px;
            color: #888;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📤 File Upload & Text Editor</h1>
        
        <?php if (!empty($message)): ?>
            <div class="message <?php echo $messageType; ?>">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>
        
        <form method="POST" enctype="multipart/form-data">
            <div class="form-group">
                <label for="image">Choose Image File:</label>
                <input type="file" id="image" name="image" accept="image/*" required>
                <div class="help-text">Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)</div>
            </div>
            
            <div class="form-group">
                <label for="category">Category:</label>
                <select id="category" name="category" required>
                    <option value="">-- Select Category --</option>
                    <?php foreach ($categories as $cat): ?>
                        <option value="<?php echo htmlspecialchars($cat); ?>"><?php echo htmlspecialchars($cat); ?></option>
                    <?php endforeach; ?>
                </select>
                <div class="help-text">Files will be saved to the selected category subdirectory</div>
            </div>
            
            <div class="form-group">
                <label for="filename">Filename / Page Title:</label>
                <input type="text" id="filename" name="filename" class="small-textbox" 
                       placeholder="Enter filename (spaces will be removed from files)" required>
                <div class="help-text">This will be used as both the filename and the HTML page title</div>
            </div>
            
            <div class="form-group">
                <label for="formatted_text">Formatted Text Content:</label>
                <div class="toolbar">
                    <button type="button" onclick="insertTag('h1')">H1</button>
                    <button type="button" onclick="insertTag('h2')">H2</button>
                    <button type="button" onclick="insertTag('p')">Paragraph</button>
                    <button type="button" onclick="insertTag('strong')">Bold</button>
                    <button type="button" onclick="insertTag('em')">Italic</button>
                    <button type="button" onclick="insertTag('u')">Underline</button>
                    <button type="button" onclick="insertBulletList()">• Bullet List</button>
                </div>
                <textarea id="formatted_text" name="formatted_text" class="large-textbox" 
                          placeholder="Enter formatted text here (HTML tags supported)" required></textarea>
                <div class="help-text">You can use HTML tags for formatting (e.g., &lt;h1&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;)</div>
            </div>
            
            <button type="submit" class="submit-btn">📁 Upload & Save</button>
        </form>
    </div>
    
    <script>
        function insertTag(tag) {
            const textarea = document.getElementById('formatted_text');
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = textarea.value.substring(start, end);
            const beforeText = textarea.value.substring(0, start);
            const afterText = textarea.value.substring(end);
            
            let newText;
            if (selectedText) {
                newText = beforeText + '<' + tag + '>' + selectedText + '</' + tag + '>' + afterText;
            } else {
                newText = beforeText + '<' + tag + '></' + tag + '>' + afterText;
            }
            
            textarea.value = newText;
            textarea.focus();
            
            // Set cursor position
            const newPosition = start + tag.length + 2 + selectedText.length;
            textarea.setSelectionRange(newPosition, newPosition);
        }
        
        function insertBulletList() {
            const textarea = document.getElementById('formatted_text');
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = textarea.value.substring(start, end);
            const beforeText = textarea.value.substring(0, start);
            const afterText = textarea.value.substring(end);
            
            let listHTML;
            if (selectedText) {
                // Split selected text by lines and create list items
                const lines = selectedText.split('\n').filter(line => line.trim() !== '');
                const listItems = lines.map(line => '  <li>' + line.trim() + '</li>').join('\n');
                listHTML = '<ul>\n' + listItems + '\n</ul>';
            } else {
                // Insert empty list with 3 items as template
                listHTML = '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>';
            }
            
            const newText = beforeText + listHTML + afterText;
            textarea.value = newText;
            textarea.focus();
            
            // Set cursor position after the inserted list
            const newPosition = start + listHTML.length;
            textarea.setSelectionRange(newPosition, newPosition);
        }
    </script>
</body>
</html>

