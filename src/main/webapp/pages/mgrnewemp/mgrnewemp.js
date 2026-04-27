/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    /*
     * variables can be accessed through 'Page.Variables' property here
     * widgets can be accessed through 'Page.Widgets' property here
     */
};

/**
 * Fired when either "Add Employee" button is clicked.
 * Assembles the RequestBody JSON from all form widgets,
 * sets it on SvAddEmployee, then invokes the variable.
 */
Page.onAddEmployeeClick = function ($event, widget) {
    const leftChecked = Page.Widgets.chk_positions_left.datavalue;
    const rightChecked = Page.Widgets.chk_positions_right.datavalue;

    // Combine both checkbox groups and take the first selected value as empTypeId
    let empTypeId = null;
    const allChecked = [].concat(
        Array.isArray(leftChecked) ? leftChecked : (leftChecked ? [leftChecked] : []),
        Array.isArray(rightChecked) ? rightChecked : (rightChecked ? [rightChecked] : [])
    );
    if (allChecked.length > 0) {
        empTypeId = allChecked[0];
    }

    // Build phone array — omit empty values
    const phones = [];
    const phone1 = Page.Widgets.txt_phone.datavalue;
    const phone2 = Page.Widgets.txt_phone2.datavalue;
    if (phone1) { phones.push(phone1); }
    if (phone2) { phones.push(phone2); }

    const requestBody = {
        firstName: Page.Widgets.txt_firstName.datavalue || "",
        lastName: Page.Widgets.txt_lastName.datavalue || "",
        email: Page.Widgets.txt_email.datavalue || "",
        phones: phones,
        cell: Page.Widgets.txt_cell.datavalue || "",
        address: {
            address: Page.Widgets.txt_address.datavalue || "",
            address2: Page.Widgets.txt_address2.datavalue || "",
            city: Page.Widgets.txt_city.datavalue || "",
            state: Page.Widgets.txt_state.datavalue || "",
            zip: Page.Widgets.txt_zip.datavalue || ""
        },
        employeeNumber: Page.Widgets.txt_employeeNumber.datavalue || "",
        hireDate: Page.Widgets.date_hireDate.datavalue || "",
        maxScheduledHours: Page.Widgets.num_maxHrsPerWeek.datavalue || 0,
        maxWeeklyDays: Page.Widgets.num_maxDaysPerWeek.datavalue || 0,
        maxDailyHours: Page.Widgets.num_maxHrsPerDay.datavalue || 0,
        maxDailyShifts: Page.Widgets.num_maxShiftsPerDay.datavalue || 0,
        priorityGroup: Page.Widgets.sel_priorityGroup.datavalue || "",
        customField1: Page.Widgets.txt_customField1.datavalue || "",
        customField2: Page.Widgets.txt_customField2.datavalue || "",
        payRate: Page.Widgets.num_payRate.datavalue || 0,
        comments: Page.Widgets.ta_comments.datavalue || "",
        googleCalExport: Page.Widgets.sel_canEditShifts.datavalue === "Yes",
        empTypeId: empTypeId,
        employeePhoto: "",
        nextAlertDate: ""
    };

    Page.Variables.SvAddEmployee.setInput("RequestBody", JSON.stringify(requestBody));
    Page.Variables.SvAddEmployee.invoke();
};

/**
 * Called when SvAddEmployee completes successfully.
 * Shows a success toast and resets all form widgets.
 */
Page.SvAddEmployeeonSuccess = function (variable, data) {
    App.Actions.appNotification.setMessage("Employee added successfully");
    App.Actions.appNotification.setClass("Success");
    App.Actions.appNotification.invoke();

    // Reset name fields
    Page.Widgets.txt_firstName.datavalue = "";
    Page.Widgets.txt_lastName.datavalue = "";

    // Reset contact fields
    Page.Widgets.txt_email.datavalue = "";
    Page.Widgets.txt_phone.datavalue = "";
    Page.Widgets.txt_phone2.datavalue = "";
    Page.Widgets.txt_cell.datavalue = "";
    Page.Widgets.txt_address.datavalue = "";
    Page.Widgets.txt_address2.datavalue = "";
    Page.Widgets.txt_city.datavalue = "";
    Page.Widgets.txt_state.datavalue = "";
    Page.Widgets.txt_zip.datavalue = "";
    Page.Widgets.txt_employeeNumber.datavalue = "";

    // Reset positions checkboxes
    Page.Widgets.chk_positions_left.datavalue = [];
    Page.Widgets.chk_positions_right.datavalue = [];

    // Reset autofill fields
    Page.Widgets.date_hireDate.datavalue = "";
    Page.Widgets.num_maxHrsPerWeek.datavalue = 40;
    Page.Widgets.num_maxDaysPerWeek.datavalue = 7;
    Page.Widgets.num_maxHrsPerDay.datavalue = 14;
    Page.Widgets.num_maxShiftsPerDay.datavalue = 1;
    Page.Widgets.sel_priorityGroup.datavalue = "First";

    // Reset custom fields
    Page.Widgets.txt_customField1.datavalue = "";
    Page.Widgets.txt_customField2.datavalue = "";

    // Reset pay rate and comments
    Page.Widgets.num_payRate.datavalue = null;
    Page.Widgets.ta_comments.datavalue = "";

    // Reset options
    Page.Widgets.sel_canEditShifts.datavalue = "No (only Managers can change shift)";
};

/**
 * Called when SvAddEmployee encounters an error.
 * Shows an error toast with the response message.
 */
Page.SvAddEmployeeonError = function (variable, data) {
    const errorMsg = (data && (data.message || data.errorMessage || data.error))
        ? (data.message || data.errorMessage || data.error)
        : "Failed to add employee. Please try again.";

    App.Actions.appNotification.setMessage(errorMsg);
    App.Actions.appNotification.setClass("Error");
    App.Actions.appNotification.invoke();
};
