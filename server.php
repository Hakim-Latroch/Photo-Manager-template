<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
$uploadsDir = 'public/assets/imgs/';

/**
 * Sends a JSON response with the provided status code and data.
 */
function respond($status, $data = null) {
    // Set the HTTP status code for the response
    http_response_code($status);

    // Encode the data as JSON and send it as the response body
    echo json_encode($data);

    // Exit the script to prevent any further execution
    exit;
}

/**
 * Fetches photo data from the server.
 *
 * This function lists all categories and their photos by globbing the uploads directory,
 * filtering out directories, and then scanning the remaining directories to get files.
 * The file paths are constructed using the category name and the relative file path.
 */
function getCategories() {
    // The global variable that contains the path to the uploads directory.
    global $uploadsDir;

    // Get all directories in the uploads directory.
    $categories = array_filter(glob($uploadsDir . '*'), 'is_dir');

    // Initialize an empty array to store the photo data.
    $photoData = [];

    // Iterate through each category.
    foreach ($categories as $category) {
        // Get the name of the category from the directory path.
        $categoryName = basename($category);

        // Get all files in the category directory, excluding the . and .. directories.
        $files = array_filter(scandir($category), function ($file) {
            return !in_array($file, ['.', '..']) && (strpos($file, '.jpg') !== false || strpos($file, '.png') !== false);
        });

        // Construct the photo data array for the category.
        $photoData[$categoryName] = array_values(array_map(function ($file) use ($categoryName) {
            // Construct the relative file path using the category name and the file name.
            return "assets/imgs/{$categoryName}/{$file}";
        }, $files));
    }

    // Send a JSON response with the photo data.
    respond(200, $photoData);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'photos') {
    getCategories();
}


// Handle POST request to upload a photo
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'upload') {
    // Check if category and photo data is provided in the request
    if (isset($_POST['category']) && isset($_FILES['photo'])) {
        // Get the category and photo data from the POST request
        $category = $_POST['category'];
        $tempPath = $_FILES['photo']['tmp_name'];
        $targetPath = __DIR__ . "/public/assets/imgs/{$category}/" . basename($_FILES['photo']['name']);

        // Check if the category directory does not exist and create it
        if (!file_exists(__DIR__ . "/public/assets/imgs/{$category}")) {
            mkdir(__DIR__ . "/public/assets/imgs/{$category}", 0777, true);
        }

        // Move the uploaded photo to the target path
        if (move_uploaded_file($tempPath, $targetPath)) {
            respond(200, ["message" => "Photo uploaded successfully."]);
        } else {
            respond(500, ["message" => "Failed to upload the photo."]);
        }
    } else {
        // Respond with error message if invalid input data
        respond(400, ["message" => "Invalid input data."]);
    }
}

// Handle POST request to edit a photo (rename category)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'edit') {
    // Check if old category, new category, and photo data is provided in the request
    if (isset($_POST['oldCategory']) && isset($_POST['newCategory']) && isset($_POST['photo'])) {
        // Get the old category, new category, and photo data from the POST request
        $oldCategory = $_POST['oldCategory'];
        $newCategory = $_POST['newCategory'];
        $photo = $_POST['photo'];

        // Construct the relative old path and new path using the photo data
        $oldPath = __DIR__ . "/public/{$photo}";
        $newPath = __DIR__ . "/public/assets/imgs/{$newCategory}/" . basename($photo);

        // Check if the new category directory does not exist and create it
        if (!file_exists(__DIR__ . "/public/assets/imgs/{$newCategory}")) {
            mkdir(__DIR__ . "/public/assets/imgs/{$newCategory}", 0777, true);
        }

        // Rename the photo file to the new path
        if (rename($oldPath, $newPath)) {
            respond(200, ["message" => "Photo renamed successfully."]);
        } else {
            respond(500, ["message" => "Failed to rename the photo."]);
        }
    } else {
        // Respond with error message if invalid input data
        respond(400, ["message" => "Invalid input data."]);
    }
}

// Handle POST request to delete a photo
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'delete') {
    // Check if photo ID is provided in the request
    if (isset($_POST['photo'])) {
        $photo = $_POST['photo'];
        $photoPath = __DIR__ . "/public/{$photo}";

        // Check if the photo file exists and delete it
        if (file_exists($photoPath) && unlink($photoPath)) {
            respond(200, ["message" => "Photo deleted successfully."]);
        } else {
            respond(500, ["message" => "Failed to delete the photo."]);
        }
    } else {
        // Respond with error message if invalid input data
        respond(400, ["message" => "Invalid input data."]);
    }
}

// Handle POST request to create a category
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'category_create') {
    // Check if request is valid
    if (isset($_POST['category'])) {
        // Get the category name from the POST request
        $category = $_POST['category'];
        // Construct the path to the category directory
        $categoryPath = __DIR__ . "/public/assets/imgs/{$category}";

        // Check if the category directory does not exist and create it
        if (!file_exists($categoryPath) && mkdir($categoryPath, 0777, true)) {
            // Respond with success message
            respond(200, ["message" => "Category created successfully."]);
        } else {
            // Respond with error message if failed to create the category
            respond(500, ["message" => "Failed to create the category."]);
        }
    } else {
        // Respond with error message if invalid input data
        respond(400, ["message" => "Invalid input data."]);
    }
}

// Handle POST request to rename a category

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'category_rename') {
    // Check if POST request for renaming a category
    if (isset($_POST['oldCategory']) && isset($_POST['newCategory'])) {
        // Get the old and new category names from the POST request
        $oldCategory = $_POST['oldCategory'];
        $newCategory = $_POST['newCategory'];
        // Construct the paths to the old and new category directories
        $oldCategoryPath = __DIR__ . "/public/assets/imgs/{$oldCategory}";
        $newCategoryPath = __DIR__ . "/public/assets/imgs/{$newCategory}";

        // Check if the old category directory exists and rename it
        if (file_exists($oldCategoryPath) && rename($oldCategoryPath, $newCategoryPath)) {
            // Respond with success message
            respond(200, ["message" => "Category renamed successfully."]);
        } else {
            // Respond with error message if failed to rename the category
            respond(500, ["message" => "Failed to rename the category."]);
        }
    } else {
        // Respond with error message if invalid input data
        respond(400, ["message" => "Invalid input data."]);
    }
}

// Handle POST request to delete a category and its contents
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'category_delete') {
    // Check if POST request for deleting a category
    if (isset($_POST['category'])) {
        // Get the category name from the POST request
        $category = $_POST['category'];
        // Construct the path to the category directory
        $categoryPath = __DIR__ . "/public/assets/imgs/{$category}";

        // Check if the category directory exists
        if (is_dir($categoryPath)) {
            // Delete all files in the category directory
            array_map('unlink', glob("{$categoryPath}/*.*"));
            // Delete the category directory
            if (rmdir($categoryPath)) {
                // Respond with success message
                respond(200, ["message" => "Category deleted successfully."]);
            } else {
                // Respond with error message if failed to delete the category
                respond(500, ["message" => "Failed to delete the category."]);
            }
        } else {
            // Respond with error message if the category does not exist
            respond(500, ["message" => "Category does not exist."]);
        }
    } else {
        // Respond with error message if invalid input data
        respond(400, ["message" => "Invalid input data."]);
    }
}

// Default response for invalid requests
respond(404, ["message" => "Not Found"]);
?>
