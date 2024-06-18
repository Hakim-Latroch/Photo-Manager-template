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
    git clone https://github.com/yourusername/photo-manager-template.git
    cd photo-manager-template
    ```

2. **Set up the server**:
    - Place the `photo-manager-template` directory in your web server's root directory (e.g., `htdocs` for XAMPP, `www` for WAMP).

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
    - Open `http://localhost/photo-manager-template` in your browser.

2. **Upload Photos**:
    - Select a category and upload photos using the form provided.

3. **Manage Categories**:
    - Use the interface to create, rename, or delete categories.

4. **Edit Photos**:
    - Rename or delete photos directly from the interface.

### API Endpoints

- **Get Photos**:
    ```http
    GET http://localhost/photo-manager-template/server.php?action=photos
    ```
    Fetches all photo categories and their photos.

- **Upload Photo**:
    ```http
    POST http://localhost/photo-manager-template/server.php?action=upload
    ```
    Form Data:
    - `category`: The category to upload the photo to.
    - `photo`: The photo file to upload.

- **Edit Photo**:
    ```http
    POST http://localhost/photo-manager-template/server.php?action=edit
    ```
    Form Data:
    - `oldCategory`: The current category of the photo.
    - `newCategory`: The new category name.
    - `photo`: The photo file name.

- **Delete Photo**:
    ```http
    POST http://localhost/photo-manager-template/server.php?action=delete
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
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
    ```

- **Response Function**:
    ```php
    function respond($status, $data = null) {
        http_response_code($status);
        echo json_encode($data);
        exit;
    }
    ```

- **Fetching Categories**:
    ```php
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
    ```

- **Uploading Photos**:
    ```php
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
    ```

- **Editing Photos**:
    ```php
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
    ```

- **Deleting Photos**:
    ```php
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
    ```
-**Creating Categories**:
  ```php
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
  ```
-**Rename Categories**:
  ```php
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
```
-** Delete Categories**:
```php
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
```



