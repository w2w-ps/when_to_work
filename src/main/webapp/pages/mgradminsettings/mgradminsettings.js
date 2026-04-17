/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    // Initialize the Additional Managers section as EXPANDED by default
    Page.additionalManagersExpanded = true;

    // Update chevron icon to show up-arrow (expanded state)
    // Page.Widgets.iconAdditionalManagers.iconclass = 'wi wi-keyboard-arrow-up';

    // Fetch additional managers data on page load
    Page.Variables.wsGetAdditionalManagers.invoke();

    // Initialize selected manager tracker to null (no item expanded)
    Page.Variables.selectedManagerId.setData({ dataValue: 0 });
};

/**
 * Toggle the Additional Managers collapsible section.
 */
Page.toggleAdditionalManagers = function ($event, widget) {
    Page.additionalManagersExpanded = !Page.additionalManagersExpanded;

    // Page.Widgets.iconAdditionalManagers.iconclass = Page.additionalManagersExpanded
    //     ? 'wi wi-keyboard-arrow-up'
    //     : 'wi wi-keyboard-arrow-down';

    if (Page.additionalManagersExpanded) {
        var existing = Page.Variables.wsGetAdditionalManagers.dataSet;
        if (!existing || (Array.isArray(existing) && existing.length === 0)) {
            Page.Variables.wsGetAdditionalManagers.invoke();
        }
    }
};

/**
 * Select/deselect an additional manager list item to show/hide inline detail.
 * Clicking the same item again collapses it.
 */
Page.selectAdditionalManager = function ($event, widget, item, currentItemWidgets) {
    var currentItem = item || (widget && widget.currentItem);
    if (!currentItem) { return; }
    var userId = currentItem.userId;
    var currentSelected = Page.Variables.selectedManagerId.dataSet.dataValue;

    if (currentSelected === userId) {
        Page.Variables.selectedManagerId.setData({ dataValue: 0 });
    } else {
        Page.Variables.selectedManagerId.setData({ dataValue: userId });
    }
};

/**
 * Save permissions for the selected additional manager.
 */
Page.saveMgrPermissions = function ($event, widget, item, currentItemWidgets) {
    App.Actions.appNotification.invoke({
        message: 'Manager permissions saved.',
        position: 'top center',
        class: 'success',
        duration: 3000
    });
};

/**
 * Delete the selected additional manager item.
 */
Page.deleteMgrItem = function ($event, widget, item, currentItemWidgets) {
    App.Actions.appNotification.invoke({
        message: 'Manager deleted.',
        position: 'top center',
        class: 'success',
        duration: 3000
    });
};

/**
 * Get array of all permission checkbox names
 */
Page.getPermissionCheckboxes = function () {
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
Page.handleSelectAllChange = function ($event, widget, newVal, oldVal) {
    var checkboxNames = Page.getPermissionCheckboxes();
    var isChecked = newVal;
    if (isChecked) {
        Page.Widgets.clearAllCheckbox.datavalue = false;
    }
    checkboxNames.forEach(function (checkboxName) {
        Page.Widgets[checkboxName].datavalue = isChecked;
    });
};

/**
 * Handle Clear All checkbox change event
 */
Page.handleClearAllChange = function ($event, widget, newVal, oldVal) {
    var checkboxNames = Page.getPermissionCheckboxes();
    var isChecked = newVal;
    if (isChecked) {
        Page.Widgets.selectAllCheckbox.datavalue = false;
        checkboxNames.forEach(function (checkboxName) {
            Page.Widgets[checkboxName].datavalue = false;
        });
    }
};

/**
 * Handle individual permission checkbox change event
 */
Page.handleIndividualCheckboxChange = function ($event, widget, newVal, oldVal) {
    var checkboxNames = Page.getPermissionCheckboxes();
    var allChecked = true;
    var allUnchecked = true;
    for (var i = 0; i < checkboxNames.length; i++) {
        var isChecked = Page.Widgets[checkboxNames[i]].datavalue;
        if (!isChecked) { allChecked = false; }
        if (isChecked) { allUnchecked = false; }
    }
    Page.Widgets.selectAllCheckbox.datavalue = allChecked;
    Page.Widgets.clearAllCheckbox.datavalue = allUnchecked;
};

/**
 * Handle Add Manager button click with validation
 */
Page.handleAddManagerClick = function ($event, widget) {
    var firstName = Page.Widgets.firstNameInput.datavalue;
    var lastName = Page.Widgets.lastNameInput.datavalue;
    var email = Page.Widgets.emailInput.datavalue;
    var errors = [];

    if (!firstName || firstName.trim() === '') { errors.push('First Name is required'); }
    if (!lastName || lastName.trim() === '') { errors.push('Last Name is required'); }
    if (!email || email.trim() === '') {
        errors.push('Email is required');
    } else {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) { errors.push('Please enter a valid email address'); }
    }

    if (errors.length > 0) {
        App.Actions.appNotification.invoke({
            message: errors.join(', '),
            position: "top center",
            class: 'error',
            duration: 5000
        });
        return;
    }
    widget.disabled = true;
    Page.Variables.svAddManager.invoke();
};

/**
 * Service Variable onBeforeUpdate event handler
 */
Page.svAddManageronBeforeUpdate = function (variable, inputData, options) {
    return inputData;
};

/**
 * Service Variable onSuccess event handler
 */
Page.svAddManageronSuccess = function (variable, data) {
    Page.Widgets.addNewButton.disabled = false;
    App.Actions.appNotification.invoke({
        message: 'Manager added successfully!',
        position: "top center",
        class: 'success',
        duration: 4000
    });
    Page.Widgets.firstNameInput.datavalue = '';
    Page.Widgets.lastNameInput.datavalue = '';
    Page.Widgets.emailInput.datavalue = '';
    Page.Widgets.emailInstructionsCheckbox.datavalue = false;
    Page.Widgets.selectAllCheckbox.datavalue = false;
    Page.Widgets.clearAllCheckbox.datavalue = false;
    var checkboxNames = Page.getPermissionCheckboxes();
    checkboxNames.forEach(function (checkboxName) {
        Page.Widgets[checkboxName].datavalue = false;
    });
    Page.Variables.wsGetAdditionalManagers.invoke();
};

/**
 * Service Variable onError event handler
 */
Page.svAddManageronError = function (variable, data) {
    Page.Widgets.addNewButton.disabled = false;
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
    App.Actions.appNotification.invoke({
        message: errorMessage,
        position: "top center",
        class: 'error',
        duration: 5000
    });
};
