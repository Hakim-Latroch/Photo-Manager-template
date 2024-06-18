const backendUrl = 'http://localhost/Photo-Manager-template/server.php'; // Replace with the URL of your backend server

$(document).ready(function () {

    // Function to load photo groups from the backend
    function loadPhotoGroups() {
        $.get(`${backendUrl}?action=photos`, function (data) {
            // Clear previous category options
            $('#photoCategory').empty();
            $('#editPhotoCategory').empty();

            // Render photo groups and categories
            renderPhotoGroups(data);
            categoriesList();

            // Populate category options in the upload and edit photo forms
            for (const group in data) {
                if (group === 'random') {
                    $('#photoCategory').append(`<option value="${group}" disabled>${capitalize(group)}</option>`);
                    $('#editPhotoCategory').append(`<option value="${group}" disabled>${capitalize(group)}</option>`);
                } else {
                    $('#photoCategory').append(`<option value="${group}">${capitalize(group)}</option>`);
                    $('#editPhotoCategory').append(`<option value="${group}">${capitalize(group)}</option>`);
                }
            }
        });
    }

    // Click event handler for category links
    $(document).on('click', '.category-link', function () {
        const category = $(this).attr('data-category');
        filterPhotosByCategory(category);
        $("#searchMessage").hide();
    });

    // Function to capitalize the first letter of a string
    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Load the list of categories from the backend and render them in the UI.
     */
    function categoriesList() {
        // Send a GET request to the backend to fetch the list of categories
        $.get(`${backendUrl}?action=photos`, function (data) {
            // Get the container element to hold the list of categories
            const listcategory = $("#categoryList");

            // Clear any existing categories
            listcategory.empty();

            // Loop through each category in the data and create a link element
            for (const category in data) {
                // Create a link element for each category
                const categoryLink = $('<a href="#" class="list-group-item list-group-item-action category-link"></a>')
                    // Set the 'data-category' attribute to the category name
                    .attr('data-category', category)
                    // Set the text of the link to the capitalized category name
                    .text(capitalize(category));

                // Append the link element to the container
                listcategory.append(categoryLink);
            }
        });
    }

    /**
     * Function to render photo groups
     * @param {Object} photoGroups - An object containing photo groups as keys and arrays of photo paths as values
     */
    function renderPhotoGroups(photoGroups) {
        // Get the container element to hold the photo groups
        const container = $("#photoGroups");
        container.empty(); // Clear any existing photo groups

        // Loop through each group in the photoGroups object
        for (const group in photoGroups) {
            // Generate HTML for each photo group
            const groupHtml = `
                <div class="col-12 photo-group">
                    <h3 class="border-bottom border-success">${capitalize(group)}</h3>
                    <div class="row">
                        ${photoGroups[group].map(photo => `
                            <div class="col-sm-6 col-md-4 col-lg-3 mb-3">
                                <div class="card">
                                    <a href="${photo}" data-lightbox="${photo}"><img src="${photo}" style="height: 200px;object-fit: cover" class="w-100" alt="${group}"></a>
                                    <div class="card-body">
                                        <!-- Button to open edit photo modal -->
                                        <button data-old-category="${group}" data-photo-path="${photo}" type="button" class="btn btn-primary edit-btn" data-photo="${photo}" data-bs-toggle="modal" data-bs-target="#editPhotoModal">Edit</button>
                                        <button type="button" class="btn btn-danger delete-btn" data-photo="${photo}">Delete</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            // Append the generated HTML to the container
            container.append(groupHtml);
        }

        // Attach click event handlers to edit buttons
        $('.edit-btn').on('click', function () {
            // Get the old category and photo path from the clicked button
            const oldCategory = $(this).data('old-category');
            const photoPath = $(this).data('photo-path');
            // Open the edit photo modal with the pre-filled data
            openEditModal(oldCategory, photoPath);
            // Hide the search message
            $("#searchMessage").hide();
        });
    }

    // Search form submission handler
    // Get the search query from the form, then fetch the list of photos from the server,
    // filter the photos by the search query, and render the result
    $("#searchForm").submit(function (e) {
        e.preventDefault();
        const query = $(this).find("input").val().toLowerCase();
        $.get(`${backendUrl}?action=photos`, function (data) {
            // Initialize an object to hold the filtered photo groups
            const filteredGroups = {};
            // Initialize a flag to track if any results were found
            let resultsFound = false;
            // Loop through each category in the data
            for (const category in data) {
                // Filter the photos in the current category by the search query
                filteredGroups[category] = data[category].filter(photo => photo.toLowerCase().includes(query));
                // If any results were found in the current category, set the resultsFound flag to true
                if (filteredGroups[category].length > 0) {
                    resultsFound = true;
                }
            }
            // If any results were found, display a success message
            if (resultsFound) {
                $('#searchMessage').html(`<div class="alert alert-success">Found results for "${query}":</div>`);
            } else {
                // If no results were found, display a warning message
                $('#searchMessage').html(`<div class="alert alert-warning">No results found for "${query}".</div>`);
            }
            // Show the photo gallery and search message, and hide the manage categories section
            $('#photoGallery').show();
            $('#list').show();
            $('#manageCategories').hide();
            $("#searchMessage").show();
            // Render the filtered photo groups
            renderPhotoGroups(filteredGroups);
        });
    });

    // Upload photo form submission handler
    // Get the selected category from the form, construct a FormData object with the
    // selected category and the file input field, and send the form data to the server
    // using AJAX. If the upload is successful, hide the add photo modal and reload
    // the photo groups, otherwise show an error message.
    $("#uploadPhotoForm").submit(function (e) {
        e.preventDefault();
        const category = $("#photoCategory").val(); // Get the selected category
        const formData = new FormData(this); // Create a FormData object from the form
        formData.append('category', category); // Append the selected category to the form data
        $.ajax({
            url: `${backendUrl}?action=upload`, // Set the URL for the AJAX request
            type: 'POST', // Set the HTTP method to POST
            data: formData, // Set the data to be sent in the request
            processData: false, // Prevent jQuery from processing the data
            contentType: false, // Prevent jQuery from setting the content type header
            success: function () { // Callback function to be called if the request is successful
                $('#addPhotoModal').modal('hide'); // Hide the add photo modal
                loadPhotoGroups(); // Reload the photo groups
            },
            error: function () { // Callback function to be called if the request fails
                alert('Error uploading photo.'); // Show an error message
            }
        });
    });
    /**
     * Loads categories for management from the backend.
     * Updates the category table body with the loaded categories.
     * Attaches event listeners to dynamically created buttons.
     */
    function loadCategories() {
        // Send a GET request to the backend to fetch photo data
        $.ajax({
            url: `${backendUrl}?action=photos`,
            type: 'GET',
            success: function (photoData) {
                const categoryTableBody = $('#categoryTableBody'); // Get the category table body element
                categoryTableBody.empty(); // Clear existing content

                // Loop through each category in the photo data
                for (const category in photoData) {
                    if (category !== 'random') {
                        // Generate HTML for each category row
                        const categoryRow = `
                            <tr>
                                <td>${capitalize(category)}</td>
                                <td>
                                    <button type="button" class="btn btn-secondary rename-category-btn" data-category="${category}">Rename</button>
                                    <button type="button" class="btn btn-danger delete-category-btn" data-category="${category}">Delete</button>
                                </td>
                            </tr>
                        `;
                        categoryTableBody.append(categoryRow); // Append the generated HTML to the category table body
                    }
                }

                // Attach event listeners to dynamically created buttons
                // When a rename button is clicked, open the rename category modal with the category data
                $('.rename-category-btn').on('click', function () {
                    const category = $(this).data('category'); // Get the category data from the button
                    openRenameCategoryModal(category);
                    $("#searchMessage").hide();
                });

                // When a delete button is clicked, delete the category
                $('.delete-category-btn').on('click', function () {
                    const category = $(this).data('category'); // Get the category data from the button
                    deleteCategory(category);
                    $("#searchMessage").hide();
                });
            },
            error: function () {
                alert('Error fetching categories.'); // Show an error message if the request fails
            }
        });
    }

    /**
     * Open edit photo modal with pre-filled data.
     * @param {string} oldCategory - The old category of the photo.
     * @param {string} photoPath - The path of the photo.
     */
    // Open edit photo modal with pre-filled data
    function openEditModal(oldCategory, photoPath) {
        // Set the value of the input field with id 'editOldCategory' to the old category
        $("#editOldCategory").val(oldCategory);
        // Set the value of the input field with id 'editPhotoPath' to the photo path
        $("#editPhotoPath").val(photoPath);
        // Show the edit photo modal
        $("#editPhotoModal").modal('show');
    }

    /**
     * Open rename category modal with pre-filled data.
     * @param {string} category - The category to be renamed.
     */
    // Open rename category modal with pre-filled data
    function openRenameCategoryModal(category) {
        // Set the value of the input field with id 'editOldCategoryName' to the category to be renamed
        $("#editOldCategoryName").val(category);
        // Set the value of the input field with id 'editNewCategoryName' to the category to be renamed
        $("#editNewCategoryName").val(category);
        // Show the rename category modal
        $("#editCategoryModal").modal('show');
    }

    /**
     * Deletes a category and its associated photos.
     * 
     * @param {string} category - The category to be deleted.
     */
    // Delete category and associated photos
    function deleteCategory(category) {
        // Prompt the user to confirm deletion
        if (confirm(`Are you sure you want to delete the category "${category}" and all its photos?`)) {
            // Send a POST request to the backend to delete the category
            $.post(`${backendUrl}?action=category_delete`, { category }, function () {
                // Refresh the categories to reflect changes
                loadCategories();
                // Refresh the photo groups to reflect changes
                loadPhotoGroups();
            }).fail(function () {
                // Show an error message if the request fails
                alert('Error deleting category.');
            });
        }
    }

    // Create category form submission handler
    /**
     * Submit handler for the create category form.
     * @param {Event} e - The submit event.
     */
    $("#createCategoryForm").submit(function (e) {
        e.preventDefault(); // Prevents the form from reloading the page.
        const category = $("#newCategoryName").val(); // Get the value of the input field with id 'newCategoryName'.

        // Send a POST request to the backend to create the category.
        $.post(`${backendUrl}?action=category_create`, { category }, function () {
            $('#createCategoryModal').modal('hide'); // Hide the create category modal.
            loadCategories(); // Refresh the list of categories.
        }).fail(function () { // If the request fails, show an error message.
            alert('Error creating category.');
        });
    });

    // Edit category form submission handler
    /**
     * Submit handler for the edit category form.
     * @param {Event} e - The submit event.
     */
    $("#editCategoryForm").submit(function (e) {
        e.preventDefault(); // Prevents the form from reloading the page.
        const oldCategory = $("#editOldCategoryName").val(); // Get the value of the input field with id 'editOldCategoryName'.
        const newCategory = $("#editNewCategoryName").val(); // Get the value of the input field with id 'editNewCategoryName'.

        // Send a POST request to the backend to rename the category.
        $.post(`${backendUrl}?action=category_rename`, { oldCategory, newCategory }, function () {
            $('#editCategoryModal').modal('hide'); // Hide the edit category modal.
            loadCategories(); // Refresh the list of categories.
            loadPhotoGroups(); // Refresh the photo groups to reflect changes.
        }).fail(function () { // If the request fails, show an error message.
            alert('Error renaming category.');
        });
    });

    // Edit photo form submission handler
    /**
     * Submit handler for the edit photo form.
     * @param {Event} e - The submit event.
     */
    $("#editPhotoForm").submit(function (e) {
        e.preventDefault(); // Prevents the form from reloading the page.
        
        // Get the values of the input fields with id 'editOldCategory' and 'editPhotoCategory'
        const oldCategory = $("#editOldCategory").val();
        const newCategory = $("#editPhotoCategory").val();
        
        // Get the value of the input field with id 'editPhotoPath'
        const photo = $("#editPhotoPath").val();
        
        // Send a POST request to the backend to edit the photo.
        $.post(`${backendUrl}?action=edit`, { oldCategory, newCategory, photo }, function () {
            $('#editPhotoModal').modal('hide'); // Hide the edit photo modal.
            loadPhotoGroups(); // Refresh the photo groups to reflect changes.
        }).fail(function () { // If the request fails, show an error message.
            alert('Error editing photo.');
        });
    });

    /**
     * Click event handler for delete photo buttons.
     *
     * @param {Event} event - The click event.
     */
    $(document).on('click', '.delete-btn', function (event) {
        // Get the data attribute 'photo' from the clicked button.
        const photo = $(event.target).data('photo');
        
        // Prompt the user to confirm deletion.
        const confirmDelete = confirm('Are you sure you want to delete this photo?');
        
        // If the user confirms deletion.
        if (confirmDelete) {
            // Send a POST request to the backend to delete the photo.
            $.post(`${backendUrl}?action=delete`, { photo }, function () {
                loadPhotoGroups(); // Refresh the photo groups to reflect changes.
            }).fail(function () { // If the request fails, show an error message.
                alert('Error deleting photo.');
            });
            
            // Hide the search message.
            $("#searchMessage").hide();
        }
    });

    /**
     * Click event handler for the 'navPhotos' link.
     * This function is triggered when the 'navPhotos' link is clicked.
     * It shows the photo gallery and list, and hides the manage categories section and the search message.
     *
     * @param {Event} event - The click event.
     */
    $('#navPhotos').on('click', function () {
        $('#photoGallery').show(); // Show the photo gallery.
        $('#list').show(); // Show the list.
        $('#manageCategories').hide(); // Hide the manage categories section.
        $("#searchMessage").hide(); // Hide the search message.
    });

    /**
     * Click event handler for the 'navCategories' link. 
     * This function is triggered when the 'navCategories' link is clicked.
     * It hides the photo gallery and list, shows the manage categories section, 
     * and hides the search message. Finally, it calls the loadCategories() function
     * to fetch the list of categories from the backend.
     *
     * @param {Event} event - The click event.
     */
    $('#navCategories').on('click', function () {
        $('#photoGallery').hide(); // Hide the photo gallery.
        $('#list').hide(); // Hide the list.
        $('#manageCategories').show(); // Show the manage categories section.
        $("#searchMessage").hide(); // Hide the search message.
        loadCategories(); // Fetch the list of categories from the backend.
    
    });

    // Filter photos by category
    /**
     * Filter photos by category.
     * This function sends a GET request to the backend to fetch the list of photos,
     * and then filters the photos by the specified category. If there are no photos
     * for the selected category, it displays an "Empty :)" message. Finally, it renders
     * the filtered photo groups.
     *
     * @param {string} category - The category to filter the photos by.
     */
    function filterPhotosByCategory(category) {
        // Send a GET request to the backend to fetch the list of photos
        $.get(`${backendUrl}?action=photos`, function (data) {
            // Create an object to hold the filtered photo groups
            const filteredGroups = {};
            // Filter the photos by the selected category
            filteredGroups[category] = data[category];
            // Check if there are any photos for the selected category
            if (filteredGroups[category].length == 0) {
                // Display an "Empty :)" message
                $('#emptyCategory').html(`<div class="alert alert-light">Empty :)</div>`);
                $('#emptyCategory').show();
            } else {
                // Hide the "Empty :)" message
                $('#emptyCategory').hide();
            }
            // Render the filtered photo groups
            renderPhotoGroups(filteredGroups);
        });
    }

    // Initial load of photo groups
    loadPhotoGroups();
});
