# Photo Manager Template

Welcome to the Photo Manager Template! This template allows you to manage photo galleries with features like uploading, renaming, and deleting photos and categories. This README will guide you through setting up, using, and customizing the template.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Customization](#customization)
- [Backend PHP API](#backend-php-api)

## Features

- **Upload Photos**: Easily upload photos to different categories.
- **Manage Categories**: Create, rename, and delete categories.
- **Edit Photos**: change a photo's category or delete a photo.
- **User-Friendly Interface**: Simple and intuitive interface for managing photos.

## Installation

### Prerequisites

- Web server with PHP support (e.g., Apache, Nginx).
- `curl` for testing API endpoints (optional).

### Steps

1. **Clone the repository**:
    ```bash
    git clone https://github.com/Hakim-Latroch/Photo-manager-template.git
    cd photo-manager-template
    ```

2. **Set up the server**:
    - Place the `Photo-manager-template` directory in your web server's root directory (e.g., `htdocs` for XAMPP, `www` for WAMP).

3. **Configure permissions**:
    - Ensure the `public/assets/imgs` directory has write permissions. You can set this using:
      ```bash
      chmod -R 777 public/assets/imgs
      ```

4. **Start your web server**:
    - Start your Apache or Nginx server and navigate to `http://localhost/Photo-Manager-template` in your browser.

## Usage

### User Interface

1. **Navigate to the Web Interface**:
    - Open `http://localhost/Photo-manager-template/public` in your browser.

2. **Upload Photos**:
    - Select a category and upload photos using the form provided.

3. **Manage Categories**:
    - Use the interface to create, rename, or delete categories.

4. **Edit Photos**:
    - Rename or delete photos directly from the interface.

### API Endpoints

- **Get Photos**:
    ```http
    GET http://localhost/Photo-manager-template/server.php?action=photos
    ```
    Fetches all photo categories and their photos.

- **Upload Photo**:
    ```http
    POST http://localhost/Photo-manager-template/server.php?action=upload
    ```
    Form Data:
    - `category`: The category to upload the photo to.
    - `photo`: The photo file to upload.

- **Edit Photo**:
    ```http
    POST http://localhost/Photo-manager-template/server.php?action=edit
    ```
    Form Data:
    - `oldCategory`: The current category of the photo.
    - `newCategory`: The new category name.
    - `photo`: The photo file name.

- **Delete Photo**:
    ```http
    POST http://localhost/Photo-manager-template/server.php?action=delete
    ```
    Form Data:
    - `photo`: The photo file name.

- **Create Category**:
    ```http
    POST http://localhost/Photo-Manager-template/server.php?action=category_create
    ```
    Form Data:
    - `category`: The name of the new category.

- **Rename Category**:
    ```http
    POST http://localhost/Photo-Manager-template/server.php?action=category_rename
    ```
    Form Data:
    - `oldCategory`: The current name of the category.
    - `newCategory`: The new name of the category.

- **Delete Category**:
    ```http
    POST http://localhost/Photo-Manager-template/server.php?action=category_delete
    ```
    Form Data:
    - `category`: The name of the category to delete.

## Customization

### Front-End

1. **HTML and CSS**:
    - Modify the `index.html` and `styles.css` files to change the layout and styling of the interface.

2. **JavaScript**:
    - Update the JavaScript code in `scripts.js` to add new features or modify existing ones.

### Back-End

1. **PHP**:
    - The PHP code handling file operations is located in `server.php`. You can extend or modify the functions to suit your needs.

2. **Functions**:
    - `getCategories()`: Fetches and returns photo categories.
    - `respond($status, $data)`: Sends a JSON response with the given status and data.
    - `uploadPhoto()`: Handles photo upload.
    - `editPhoto()`: Handles photo renaming.
    - `deletePhoto()`: Handles photo deletion.
    - `createCategory()`: Creates a new category.
    - `renameCategory()`: Renames an existing category.
    - `deleteCategory()`: Deletes a category and its contents.

## Backend PHP API

### PHP Code Overview

The PHP script `server.php` handles all backend operations. Here's a brief overview of its structure:

- **Error Reporting**:
    ```php
    // Set up error reporting and display
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
    ```

- **Response Function**:
    ```php
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
    ```

- **Fetching Photos | Categories**:
    ```php
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

    ```

- **Uploading Photos**:
    ```php
  // Handle POST request to upload a photo
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'upload') {
    // Check if category and photo data is provided in the request
    // Category is the name of the folder where the photo will be stored
    // Photo is the file being uploaded
    if (isset($_POST['category']) && isset($_FILES['photo'])) {
        // Get the category and photo data from the POST request
        $category = $_POST['category'];
        $tempPath = $_FILES['photo']['tmp_name'];
        
        // Construct the target path for the uploaded file
        $targetPath = __DIR__ . "/public/assets/imgs/{$category}/" . basename($_FILES['photo']['name']);

        // Check if the category directory does not exist and create it
        if (!file_exists(__DIR__ . "/public/assets/imgs/{$category}")) {
            mkdir(__DIR__ . "/public/assets/imgs/{$category}", 0777, true);
        }

        // Move the uploaded photo to the target path
        // If the move is successful, respond with success message
        // If the move fails, respond with error message
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
    ```

- **Editing Photos**:
    ```php
    // Handle POST request to edit a photo (rename category)
    /**
     * This function handles a POST request to edit a photo's category.
     * It checks if the old category, new category, and photo data is provided in the request.
     * If all the data is provided, it renames the photo file from the old category to the new category.
     * If any of the data is missing or the rename operation fails, it responds with an error message.
     */
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
    ```

- **Deleting Photos**:
    ```php
        /**
     * This function handles a POST request to delete a photo.
     * It checks if the photo ID is provided in the request.
     * If the photo ID is provided, it deletes the photo file from the server.
     * If the photo file does not exist or the delete operation fails, it responds with an error message.
     */
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'delete') {
    // Check if photo ID is provided in the request
    if (isset($_POST['photo'])) {
        // Get the photo ID from the POST request
        $photo = $_POST['photo'];
        // Construct the path to the photo file
        $photoPath = __DIR__ . "/public/{$photo}";

        // Check if the photo file exists and delete it
        if (file_exists($photoPath) && unlink($photoPath)) {
            // Respond with success message if the photo file is deleted successfully
            respond(200, ["message" => "Photo deleted successfully."]);
        } else {
            // Respond with error message if the photo file does not exist or the delete operation fails
            respond(500, ["message" => "Failed to delete the photo."]);
        }
    } else {
        // Respond with error message if invalid input data
        respond(400, ["message" => "Invalid input data."]);
     }
    }
    ```
-**Creating Categories**:
  ```php
  /**
 * This function handles a POST request to create a new category.
 * It checks if the category name is provided in the request.
 * If the category name is provided, it creates a new directory for the category on the server.
 * If the directory is created successfully, it responds with a success message.
 * If the directory already exists or the creation operation fails, it responds with an error message.
 */
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
  ```
-**Rename Categories**:
  ```php
 // Handle POST request to rename a category

/**
 * This function handles a POST request to rename a category.
 * It checks if the old category name and new category name are provided in the request.
 * If the old category name and new category name are provided, it renames the category directory on the server.
 * If the directory is renamed successfully, it responds with a success message.
 * If the directory does not exist or the renaming operation fails, it responds with an error message.
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'category_rename') {
    // Check if POST request for renaming a category

    // Check if old category name and new category name are provided in the request
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
```
-** Delete Categories**:
```php
/**
 * This function handles a POST request to delete a category and its contents.
 * It checks if the category name is provided in the request.
 * If the category name is provided, it deletes all files in the category directory on the server.
 * It then deletes the category directory itself.
 * If the category directory exists and is successfully deleted, it responds with a success message.
 * If the category directory does not exist or the deletion operation fails, it responds with an error message.
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'category_delete') {
    // Check if POST request for deleting a category

    // Check if category name is provided in the request
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
```



