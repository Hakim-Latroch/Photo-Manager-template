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

    // Function to load the list of categories
    function categoriesList() {
        $.get(`${backendUrl}?action=photos`, function (data) {
            const listcategory = $("#categoryList");
            listcategory.empty();
            for (const category in data) {
                const categoryLink = $('<a href="#" class="list-group-item list-group-item-action category-link"></a>')
                    .attr('data-category', category)
                    .text(capitalize(category));
                listcategory.append(categoryLink);
            }
        });
    }

    // Function to render photo groups
    function renderPhotoGroups(photoGroups) {
        const container = $("#photoGroups");
        container.empty();

        for (const group in photoGroups) {
            const groupHtml = `
                <div class="col-12 photo-group">
                    <h3 class="border-bottom border-success">${capitalize(group)}</h3>
                    <div class="row">
                        ${photoGroups[group].map(photo => `
                            <div class="col-sm-6 col-md-4 col-lg-3 mb-3">
                                <div class="card">
                                    <a href="${photo}" data-lightbox="${photo}"><img src="${photo}" style="height: 200px;object-fit: cover" class="w-100" alt="${group}"></a>
                                    <div class="card-body">
                                        <button data-old-category="${group}" data-photo-path="${photo}" type="button" class="btn btn-primary edit-btn" data-photo="${photo}" data-bs-toggle="modal" data-bs-target="#editPhotoModal">Edit</button>
                                        <button type="button" class="btn btn-danger delete-btn" data-photo="${photo}">Delete</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            container.append(groupHtml);
        }

        // Attach click event handlers to edit buttons
        $('.edit-btn').on('click', function () {
            const oldCategory = $(this).data('old-category');
            const photoPath = $(this).data('photo-path');
            openEditModal(oldCategory, photoPath);
            $("#searchMessage").hide();
        });
    }

    // Search form submission handler
    $("#searchForm").submit(function (e) {
        e.preventDefault();
        const query = $(this).find("input").val().toLowerCase();
        $.get(`${backendUrl}?action=photos`, function (data) {
            const filteredGroups = {};
            let resultsFound = false;
            for (const category in data) {
                filteredGroups[category] = data[category].filter(photo => photo.toLowerCase().includes(query));
                if (filteredGroups[category].length > 0) {
                    resultsFound = true;
                }
            }
            if (resultsFound) {
                $('#searchMessage').html(`<div class="alert alert-success">Found results for "${query}":</div>`);
            } else {
                $('#searchMessage').html(`<div class="alert alert-warning">No results found for "${query}".</div>`);
            }
            $('#photoGallery').show();
            $('#list').show();
            $('#manageCategories').hide();
            $("#searchMessage").show();
            renderPhotoGroups(filteredGroups);
        });
    });

    // Upload photo form submission handler
    $("#uploadPhotoForm").submit(function (e) {
        e.preventDefault();
        const category = $("#photoCategory").val();
        const formData = new FormData(this);
        formData.append('category', category);
        $.ajax({
            url: `${backendUrl}?action=upload`,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function () {
                $('#addPhotoModal').modal('hide');
                loadPhotoGroups();
            },
            error: function () {
                alert('Error uploading photo.');
            }
        });
    });

    // Load categories for management
    function loadCategories() {
        $.ajax({
            url: `${backendUrl}?action=photos`,
            type: 'GET',
            success: function (photoData) {
                const categoryTableBody = $('#categoryTableBody');
                categoryTableBody.empty(); // Clear existing content

                for (const category in photoData) {
                    if (category !== 'random') {
                        const categoryRow = `
                            <tr>
                                <td>${capitalize(category)}</td>
                                <td>
                                    <button type="button" class="btn btn-secondary rename-category-btn" data-category="${category}">Rename</button>
                                    <button type="button" class="btn btn-danger delete-category-btn" data-category="${category}">Delete</button>
                                </td>
                            </tr>
                        `;
                        categoryTableBody.append(categoryRow);
                    }
                }

                // Attach event listeners to dynamically created buttons
                $('.rename-category-btn').on('click', function () {
                    const category = $(this).data('category');
                    openRenameCategoryModal(category);
                    $("#searchMessage").hide();
                });

                $('.delete-category-btn').on('click', function () {
                    const category = $(this).data('category');
                    deleteCategory(category);
                    $("#searchMessage").hide();
                });
            },
            error: function () {
                alert('Error fetching categories.');
            }
        });
    }

    // Open edit photo modal with pre-filled data
    function openEditModal(oldCategory, photoPath) {
        $("#editOldCategory").val(oldCategory);
        $("#editPhotoPath").val(photoPath);
        $("#editPhotoModal").modal('show');
    }

    // Open rename category modal with pre-filled data
    function openRenameCategoryModal(category) {
        $("#editOldCategoryName").val(category);
        $("#editNewCategoryName").val(category);
        $("#editCategoryModal").modal('show');
    }

    // Delete category and associated photos
    function deleteCategory(category) {
        if (confirm(`Are you sure you want to delete the category "${category}" and all its photos?`)) {
            $.post(`${backendUrl}?action=category_delete`, { category }, function () {
                loadCategories(); // Refresh the categories to reflect changes
                loadPhotoGroups(); // Refresh the photo groups to reflect changes
            }).fail(function () {
                alert('Error deleting category.');
            });
        }
    }

    // Create category form submission handler
    $("#createCategoryForm").submit(function (e) {
        e.preventDefault();
        const category = $("#newCategoryName").val();
        $.post(`${backendUrl}?action=category_create`, { category }, function () {
            $('#createCategoryModal').modal('hide');
            loadCategories();
        }).fail(function () {
            alert('Error creating category.');
        });
    });

    // Edit category form submission handler
    $("#editCategoryForm").submit(function (e) {
        e.preventDefault();
        const oldCategory = $("#editOldCategoryName").val();
        const newCategory = $("#editNewCategoryName").val();
        $.post(`${backendUrl}?action=category_rename`, { oldCategory, newCategory }, function () {
            $('#editCategoryModal').modal('hide');
            loadCategories();
            loadPhotoGroups();
        }).fail(function () {
            alert('Error renaming category.');
        });
    });

    // Edit photo form submission handler
    $("#editPhotoForm").submit(function (e) {
        e.preventDefault();
        const oldCategory = $("#editOldCategory").val();
        const newCategory = $("#editPhotoCategory").val();
        const photo = $("#editPhotoPath").val();
        $.post(`${backendUrl}?action=edit`, { oldCategory, newCategory, photo }, function () {
            $('#editPhotoModal').modal('hide');
            loadPhotoGroups();
        }).fail(function () {
            alert('Error editing photo.');
        });
    });

    // Delete photo click event handler
    $(document).on('click', '.delete-btn', function () {
        const photo = $(this).data('photo');
        const confirmDelete = confirm('Are you sure you want to delete this photo?');
        if (confirmDelete) {
            $.post(`${backendUrl}?action=delete`, { photo }, function () {
                loadPhotoGroups();
            }).fail(function () {
                alert('Error deleting photo.');
            });
            $("#searchMessage").hide();
        }
    });

    // Navigation to photos view
    $('#navPhotos').on('click', function () {
        $('#photoGallery').show();
        $('#list').show();
        $('#manageCategories').hide();
        $("#searchMessage").hide();
    });

    // Navigation to categories view
    $('#navCategories').on('click', function () {
        $('#photoGallery').hide();
        $('#list').hide();
        $('#manageCategories').show();
        $("#searchMessage").hide();
        loadCategories();
    });

    // Filter photos by category
    function filterPhotosByCategory(category) {
        $.get(`${backendUrl}?action=photos`, function (data) {
            const filteredGroups = {};
            filteredGroups[category] = data[category];
            if (filteredGroups[category].length == 0) {
                $('#emptyCategory').html(`<div class="alert alert-light">Empty :)</div>`);
                $('#emptyCategory').show();
            } else {
                $('#emptyCategory').hide();
            }
            renderPhotoGroups(filteredGroups);
        });
    }

    // Initial load of photo groups
    loadPhotoGroups();
});
