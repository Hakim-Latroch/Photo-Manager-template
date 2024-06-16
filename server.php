<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
$uploadsDir = 'public/assets/imgs/';

function respond($status, $data = null) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Handle GET request to fetch photo data
function getCategories() {
    global $uploadsDir;
    $categories = array_filter(glob($uploadsDir . '*'), 'is_dir');
    $photoData = [];

    foreach ($categories as $category) {
        $categoryName = basename($category);
        $files = array_filter(scandir($category), function ($file) {
            return !in_array($file, ['.', '..']) && (strpos($file, '.jpg') !== false || strpos($file, '.png') !== false);
        });
        $photoData[$categoryName] = array_values(array_map(function ($file) use ($categoryName) {
            return "assets/imgs/{$categoryName}/{$file}";
        }, $files));
    }

    respond(200, $photoData);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'photos') {
    getCategories();
}


// Handle POST request to upload a photo
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'upload') {
    if (isset($_POST['category']) && isset($_FILES['photo'])) {
        $category = $_POST['category'];
        $tempPath = $_FILES['photo']['tmp_name'];
        $targetPath = __DIR__ . "/public/assets/imgs/{$category}/" . basename($_FILES['photo']['name']);

        if (!file_exists(__DIR__ . "/public/assets/imgs/{$category}")) {
            mkdir(__DIR__ . "/public/assets/imgs/{$category}", 0777, true);
        }

        if (move_uploaded_file($tempPath, $targetPath)) {
            respond(200, ["message" => "Photo uploaded successfully."]);
        } else {
            respond(500, ["message" => "Failed to upload the photo."]);
        }
    } else {
        respond(400, ["message" => "Invalid input data."]);
    }
}

// Handle POST request to edit a photo (rename category)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'edit') {
    if (isset($_POST['oldCategory']) && isset($_POST['newCategory']) && isset($_POST['photo'])) {
        $oldCategory = $_POST['oldCategory'];
        $newCategory = $_POST['newCategory'];
        $photo = $_POST['photo'];
        $oldPath = __DIR__ . "/public/{$photo}";
        $newPath = __DIR__ . "/public/assets/imgs/{$newCategory}/" . basename($photo);

        if (!file_exists(__DIR__ . "/public/assets/imgs/{$newCategory}")) {
            mkdir(__DIR__ . "/public/assets/imgs/{$newCategory}", 0777, true);
        }

        if (rename($oldPath, $newPath)) {
            respond(200, ["message" => "Photo renamed successfully."]);
        } else {
            respond(500, ["message" => "Failed to rename the photo."]);
        }
    } else {
        respond(400, ["message" => "Invalid input data."]);
    }
}

// Handle POST request to delete a photo
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'delete') {
    if (isset($_POST['photo'])) {
        $photo = $_POST['photo'];
        $photoPath = __DIR__ . "/public/{$photo}";

        if (file_exists($photoPath) && unlink($photoPath)) {
            respond(200, ["message" => "Photo deleted successfully."]);
        } else {
            respond(500, ["message" => "Failed to delete the photo."]);
        }
    } else {
        respond(400, ["message" => "Invalid input data."]);
    }
}

// Handle POST request to create a category
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'category_create') {
    if (isset($_POST['category'])) {
        $category = $_POST['category'];
        $categoryPath = __DIR__ . "/public/assets/imgs/{$category}";

        if (!file_exists($categoryPath) && mkdir($categoryPath, 0777, true)) {
            respond(200, ["message" => "Category created successfully."]);
        } else {
            respond(500, ["message" => "Failed to create the category."]);
        }
    } else {
        respond(400, ["message" => "Invalid input data."]);
    }
}

// Handle POST request to rename a category
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'category_rename') {
    if (isset($_POST['oldCategory']) && isset($_POST['newCategory'])) {
        $oldCategory = $_POST['oldCategory'];
        $newCategory = $_POST['newCategory'];
        $oldCategoryPath = __DIR__ . "/public/assets/imgs/{$oldCategory}";
        $newCategoryPath = __DIR__ . "/public/assets/imgs/{$newCategory}";

        if (file_exists($oldCategoryPath) && rename($oldCategoryPath, $newCategoryPath)) {
            respond(200, ["message" => "Category renamed successfully."]);
        } else {
            respond(500, ["message" => "Failed to rename the category."]);
        }
    } else {
        respond(400, ["message" => "Invalid input data."]);
    }
}

// Handle POST request to delete a category and its contents
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'category_delete') {
    if (isset($_POST['category'])) {
        $category = $_POST['category'];
        $categoryPath = __DIR__ . "/public/assets/imgs/{$category}";

        if (is_dir($categoryPath)) {
            array_map('unlink', glob("{$categoryPath}/*.*"));
            if (rmdir($categoryPath)) {
                respond(200, ["message" => "Category deleted successfully."]);
            } else {
                respond(500, ["message" => "Failed to delete the category."]);
            }
        } else {
            respond(500, ["message" => "Category does not exist."]);
        }
    } else {
        respond(400, ["message" => "Invalid input data."]);
    }
}

// Default response for invalid requests
respond(404, ["message" => "Not Found"]);
?>
