/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    // Restore checkbox states from localStorage on page load
    var stored = localStorage.getItem('employeeViewConfig');
    if (stored) {
        try {
            var config = JSON.parse(stored);
            App.Variables.employeeViewConfig.setData(config);
        } catch (e) {
            console.warn('ConfigureByEmployeeView: Could not parse employeeViewConfig from localStorage:', e);
        }
    }
};

/**
 * Helper: reads all checkbox and select widget values from the page and saves
 * them as a JSON object to localStorage under key "employeeViewConfig".
 * Also syncs the App-level variable so bindings stay in sync.
 */
Page.saveConfig = function () {
    var config = {
        // Screen-view settings
        showDescription: Page.Widgets.chkScreenShowDescription.datavalue,
        showPosition: Page.Widgets.chkScreenShowPosition.datavalue,
        showCategory: Page.Widgets.chkScreenShowCategory.datavalue,
        hideEmployeesNoShifts: Page.Widgets.chkHideEmployeesNoShifts.datavalue,
        showTimeOff: Page.Widgets.chkShowTimeOff.datavalue,
        showOffOnDays: Page.Widgets.chkShowOffOnDays.datavalue,
        showUnassignedShifts: Page.Widgets.chkShowUnassignedShifts.datavalue,
        showTotalHours: Page.Widgets.chkShowTotalHours.datavalue,
        showPhoneNumber: Page.Widgets.chkShowPhoneNumber.datavalue,
        showDateHeaderOnce: Page.Widgets.chkShowDateHeaderOnce.datavalue,
        showNamesOnLeft: Page.Widgets.chkShowNamesOnLeft.datavalue,
        useQuickShiftEdit: Page.Widgets.chkUseQuickShiftEdit.datavalue,
        nameFormat: Page.Widgets.selScreenNameFormat.datavalue,
        fontSize: Page.Widgets.selScreenFontSize.datavalue,
        // Print-only settings (saved but do not affect EmployeeView screen display)
        printShowDescription: Page.Widgets.chkPrintShowDescription.datavalue,
        printShowPosition: Page.Widgets.chkPrintShowPosition.datavalue,
        printShowCategory: Page.Widgets.chkPrintShowCategory.datavalue,
        printHideEmployeesNoShifts: Page.Widgets.chkPrintHideEmployeesNoShifts.datavalue,
        printShowApprovedTimeOff: Page.Widgets.chkPrintShowApprovedTimeOff.datavalue,
        printShowOffOnDays: Page.Widgets.chkPrintShowOffOnDays.datavalue,
        printShowUnassignedShifts: Page.Widgets.chkPrintShowUnassignedShifts.datavalue,
        printShowTotalHours: Page.Widgets.chkPrintShowTotalHours.datavalue,
        printShowPhoneNumber: Page.Widgets.chkPrintShowPhoneNumber.datavalue,
        printShowDateHeaderOnce: Page.Widgets.chkPrintShowDateHeaderOnce.datavalue,
        printSeparatePage: Page.Widgets.chkPrintSeparatePage.datavalue,
        printSignatureLine: Page.Widgets.chkPrintSignatureLine.datavalue,
        printNameFormat: Page.Widgets.selPrintNameFormat.datavalue,
        printFontSize: Page.Widgets.selPrintFontSize.datavalue
    };
    localStorage.setItem('employeeViewConfig', JSON.stringify(config));
    App.Variables.employeeViewConfig.setData(config);
};

// ── Screen-view checkbox onChange handlers ──────────────────────────────────

Page.chkScreenShowDescriptionChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkScreenShowPositionChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkScreenShowCategoryChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkHideEmployeesNoShiftsChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkShowTimeOffChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkShowOffOnDaysChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkShowUnassignedShiftsChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkShowTotalHoursChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkShowPhoneNumberChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkShowDateHeaderOnceChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkShowNamesOnLeftChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkUseQuickShiftEditChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

// ── Print-only checkbox onChange handlers ───────────────────────────────────

Page.chkPrintShowDescriptionChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkPrintShowPositionChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkPrintShowCategoryChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkPrintHideEmployeesNoShiftsChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkPrintShowApprovedTimeOffChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkPrintShowOffOnDaysChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkPrintShowUnassignedShiftsChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkPrintShowTotalHoursChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkPrintShowPhoneNumberChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkPrintShowDateHeaderOnceChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkPrintSeparatePageChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

Page.chkPrintSignatureLineChange = function ($event, widget, newVal, oldVal) {
    Page.saveConfig();
};

// ── Save button click ────────────────────────────────────────────────────────

Page.btnSaveConfigClick = function ($event, widget) {
    Page.saveConfig();
    //App.Actions.configSavedNotification.invoke();
    if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'employeeViewConfigUpdated' }, '*');
    }
    window.close();
};
