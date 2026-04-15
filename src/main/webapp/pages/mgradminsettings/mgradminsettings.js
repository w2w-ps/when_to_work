/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    /*
     * variables can be accessed through 'Page.Variables' property here
     * e.g. to get dataSet in a staticVariable named 'loggedInUser' use following script
     * Page.Variables.loggedInUser.getData()
     *
     * widgets can be accessed through 'Page.Widgets' property here
     * e.g. to get value of text widget named 'username' use following script
     * 'Page.Widgets.username.datavalue'
     */
};

/**
 * Get array of all permission checkbox names
 */
Page.getPermissionCheckboxes = function() {
    return [
        'addShiftsCheckbox',
        'importTemplatesCheckbox',
        'uploadShiftsCheckbox',
        'autofillShiftsCheckbox',
        'clearSchedulesCheckbox',
        'editShiftsCheckbox',
        'saveTemplatesCheckbox',
        'publishSchedulesCheckbox',
        'unpublishSchedulesCheckbox',
        'manageCategoriesCheckbox',
        'addEmployeesCheckbox',
        'viewPayRatesCheckbox',
        'editEmployeesCheckbox',
        'approveTradesCheckbox',
        'approveTimeOffCheckbox',
        'changeCompanySettingsCheckbox',
        'managePositionsCheckbox',
        'manageTeamMembersCheckbox',
        'managerNotificationsCheckbox'
    ];
};

/**
 * Handle Select All checkbox change event
 */
Page.handleSelectAllChange = function($event, widget, newVal, oldVal) {
    var checkboxNames = Page.getPermissionCheckboxes();
    var isChecked = newVal;
    
    // When Select All is checked, uncheck Clear All
    if (isChecked) {
        Page.Widgets.clearAllCheckbox.datavalue = false;
    }
    
    checkboxNames.forEach(function(checkboxName) {
        Page.Widgets[checkboxName].datavalue = isChecked;
    });
};

/**
 * Handle Clear All checkbox change event
 */
Page.handleClearAllChange = function($event, widget, newVal, oldVal) {
    var checkboxNames = Page.getPermissionCheckboxes();
    var isChecked = newVal;
    
    // When Clear All is checked, uncheck Select All and clear all permissions
    if (isChecked) {
        Page.Widgets.selectAllCheckbox.datavalue = false;
        
        checkboxNames.forEach(function(checkboxName) {
            Page.Widgets[checkboxName].datavalue = false;
        });
    }
};

/**
 * Handle individual permission checkbox change event
 * Updates Select All and Clear All state based on individual checkbox states
 */
Page.handleIndividualCheckboxChange = function($event, widget, newVal, oldVal) {
    var checkboxNames = Page.getPermissionCheckboxes();
    var allChecked = true;
    var allUnchecked = true;
    
    for (var i = 0; i < checkboxNames.length; i++) {
        var isChecked = Page.Widgets[checkboxNames[i]].datavalue;
        
        if (!isChecked) {
            allChecked = false;
        }
        if (isChecked) {
            allUnchecked = false;
        }
    }
    
    // Update Select All state
    Page.Widgets.selectAllCheckbox.datavalue = allChecked;
    
    // Update Clear All state
    Page.Widgets.clearAllCheckbox.datavalue = allUnchecked;
};

/**
 * Handle Add Manager button click with validation
 */
Page.handleAddManagerClick = function($event, widget) {
    // Validate required fields
    var firstName = Page.Widgets.firstNameInput.datavalue;
    var lastName = Page.Widgets.lastNameInput.datavalue;
    var email = Page.Widgets.emailInput.datavalue;
    
    var errors = [];
    
    // Check for empty fields
    if (!firstName || firstName.trim() === '') {
        errors.push('First Name is required');
    }
    
    if (!lastName || lastName.trim() === '') {
        errors.push('Last Name is required');
    }
    
    if (!email || email.trim() === '') {
        errors.push('Email is required');
    } else {
        // Basic email format validation
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errors.push('Please enter a valid email address');
        }
    }
    
    // Show validation errors if any
    if (errors.length > 0) {
        App.Actions.appNotification.invoke({
            message: errors.join(', '),
            position: "top center",
            class: 'error',
            duration: 5000
        });
        return;
    }
    
    // Disable button to prevent double submission
    widget.disabled = true;
    
    // Invoke the service variable
    Page.Variables.svAddManager.invoke();
};

/**
 * Service Variable onBeforeUpdate event handler
 */
Page.svAddManageronBeforeUpdate = function (variable, inputData, options) {
    console.log("=== DEBUG: svAddManager Request Payload ===");
    console.log("Complete inputData object:", JSON.stringify(inputData, null, 2));
    console.log("Authorization header:", variable.dataBinding.find(function(b) { return b.target === "Authorization"; })?.value);
    console.log("=== Widget Values ===");
    console.log("firstName:", Page.Widgets.firstNameInput.datavalue);
    console.log("lastName:", Page.Widgets.lastNameInput.datavalue);
    console.log("email:", Page.Widgets.emailInput.datavalue);
    console.log("emailInstructions:", Page.Widgets.emailInstructionsCheckbox.datavalue);
    console.log("=== Permission Checkboxes ===");
    console.log("addShifts:", Page.Widgets.addShiftsCheckbox.datavalue);
    console.log("importTemplates:", Page.Widgets.importTemplatesCheckbox.datavalue);
    console.log("uploadShifts:", Page.Widgets.uploadShiftsCheckbox.datavalue);
    console.log("autofillShifts:", Page.Widgets.autofillShiftsCheckbox.datavalue);
    console.log("clearSchedules:", Page.Widgets.clearSchedulesCheckbox.datavalue);
    console.log("editShifts:", Page.Widgets.editShiftsCheckbox.datavalue);
    console.log("saveTemplates:", Page.Widgets.saveTemplatesCheckbox.datavalue);
    console.log("publishSchedules:", Page.Widgets.publishSchedulesCheckbox.datavalue);
    console.log("unpublishSchedules:", Page.Widgets.unpublishSchedulesCheckbox.datavalue);
    console.log("manageCategories:", Page.Widgets.manageCategoriesCheckbox.datavalue);
    console.log("addEmployees:", Page.Widgets.addEmployeesCheckbox.datavalue);
    console.log("viewPayRates:", Page.Widgets.viewPayRatesCheckbox.datavalue);
    console.log("editEmployees:", Page.Widgets.editEmployeesCheckbox.datavalue);
    console.log("approveTrades:", Page.Widgets.approveTradesCheckbox.datavalue);
    console.log("approveTimeOff:", Page.Widgets.approveTimeOffCheckbox.datavalue);
    console.log("changeCompanySettings:", Page.Widgets.changeCompanySettingsCheckbox.datavalue);
    console.log("managePositions:", Page.Widgets.managePositionsCheckbox.datavalue);
    console.log("manageTeamMembers:", Page.Widgets.manageTeamMembersCheckbox.datavalue);
    console.log("managerNotifications:", Page.Widgets.managerNotificationsCheckbox.datavalue);
    console.log("===========================================");

    // CRITICAL: Return inputData to allow the API call to proceed
    return inputData;
};

/**
 * Service Variable onSuccess event handler
 */
Page.svAddManageronSuccess = function(variable, data) {
    console.log("Manager added successfully:", data);
    
    // Re-enable the button
    Page.Widgets.addNewButton.disabled = false;
    
    // Show success notification
    App.Actions.appNotification.invoke({
        message: 'Manager added successfully!',
        position: "top center",
        class: 'success',
        duration: 4000
    });
    
    // Reset form fields
    Page.Widgets.firstNameInput.datavalue = '';
    Page.Widgets.lastNameInput.datavalue = '';
    Page.Widgets.emailInput.datavalue = '';
    Page.Widgets.emailInstructionsCheckbox.datavalue = false;
    
    // Reset Select All and Clear All checkboxes
    Page.Widgets.selectAllCheckbox.datavalue = false;
    Page.Widgets.clearAllCheckbox.datavalue = false;
    
    // Reset all permission checkboxes
    var checkboxNames = Page.getPermissionCheckboxes();
    checkboxNames.forEach(function(checkboxName) {
        Page.Widgets[checkboxName].datavalue = false;
    });
};

/**
 * Service Variable onError event handler
 */
Page.svAddManageronError = function(variable, data) {
    console.error("Error adding manager:", data);
    
    // Re-enable the button
    Page.Widgets.addNewButton.disabled = false;
    
    // Extract error message
    var errorMessage = 'Failed to add manager. Please try again.';
    
    if (data && data.error) {
        if (typeof data.error === 'string') {
            errorMessage = data.error;
        } else if (data.error.message) {
            errorMessage = data.error.message;
        } else if (data.error.errorMessage) {
            errorMessage = data.error.errorMessage;
        }
    }
    
    // Show error notification
    App.Actions.appNotification.invoke({
        message: errorMessage,
        position: "top center",
        class: 'error',
        duration: 5000
    });
};
