/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    Page.selectedEmployee = "";
    Page.selectedDay = "";
    Page.isAdd = true;
    Page.dragState = null; // drag-and-drop state holder
    Page._dragDropInsertPayload = null;
    Page._pendingDropPayload = null; // holds pending drop payload during confirmation dialogs

    // Initialize filter state
    Page.currentCategoryFilter = null;
    Page.currentStatusFilter = null;
    Page.currentPositionFilter = null;
    Page.unfilteredScheduleData = [];
    Page.hasConflicts = false;

    Page.loadEmployeeViewConfig();
    window.addEventListener('message', function (event) {
        if (event.data && event.data.type === 'employeeViewConfigUpdated') {
            Page.loadEmployeeViewConfig();
            Page.Variables.svScheduleList.invoke();
        }
    });
};

/**
 * Filters the employee schedule list based on category, status, and position selections.
 * All three filters work together - if multiple filters are applied, employees must match all criteria.
 * 
 * Filter rules:
 * - "All Categories", "All Positions", and "No Status" are treated as no filter
 * - Separator entries ("----------") are ignored
 * - Filtering is case-insensitive
 * - Returns all data if no valid filters are applied
 * 
 * ENHANCED: Now filters both employees AND individual shifts within each employee.
 * - Employees are included if they have at least one matching shift
 * - Within each employee, only shifts matching the filter criteria are shown
 * - Shifts that don't match category/position filters are removed from the employee's shifts array
 */
Page.applyScheduleFilters = function () {
    let sourceData = Page.unfilteredScheduleData;

    if (!sourceData || sourceData.length === 0) {
        Page.Widgets.employeeScheduleList.dataset = [];
        return;
    }

    let categoryFilter = Page.currentCategoryFilter;
    let statusFilter = Page.currentStatusFilter;
    let positionFilter = Page.currentPositionFilter;

    // Check if filters are effectively empty (no-filter conditions)
    let isCategoryFilterActive = categoryFilter != "" && categoryFilter.description
    categoryFilter.description !== 'All Categories' &&
        categoryFilter.description !== '----------' &&
        categoryFilter.description.trim() !== '';

    let isStatusFilterActive = statusFilter &&
        statusFilter !== 'All Status' &&
        statusFilter !== 'No Status' &&
        statusFilter !== '----------' &&
        statusFilter.trim() !== '';

    let isPositionFilterActive = positionFilter != "" && positionFilter.description &&
        positionFilter.description !== 'All Positions' &&
        positionFilter.description !== '----------' &&
        positionFilter.description.trim() !== '';

    // If no filters are active, show all data
    if (!isCategoryFilterActive && !isStatusFilterActive && !isPositionFilterActive) {
        Page.Widgets.employeeScheduleList.dataset = sourceData;
        return;
    }

    // Apply filters with shift-level filtering
    let filteredData = [];

    sourceData.forEach(function (employee) {
        // Deep clone the employee to avoid modifying the original unfiltered data
        let employeeCopy = structuredClone(employee);
        let hasMatchingShift = false;

        // Filter shifts within each day of the week
        if (employeeCopy.weeklyShifts && Array.isArray(employeeCopy.weeklyShifts)) {
            employeeCopy.weeklyShifts.forEach(function (day) {
                if (day.shifts && Array.isArray(day.shifts)) {
                    // Filter the shifts array for this day
                    let filteredShifts = day.shifts.filter(function (shift) {
                        let matchesCategory = true;
                        let matchesPosition = true;
                        let matchesStatus = true;

                        // Apply category filter to individual shift
                        if (isCategoryFilterActive) {
                            matchesCategory = shift.category &&
                                shift.category.toLowerCase().includes(categoryFilter.toLowerCase()) > -1;
                        }

                        // Apply position filter to individual shift
                        if (isPositionFilterActive) {
                            matchesPosition = shift.position &&
                                shift.position.toLowerCase().includes(positionFilter.toLowerCase()) > -1;
                        }

                        // Shift must match all active filters
                        return matchesCategory && matchesPosition && matchesStatus;
                    });

                    // Update the day's shifts array with filtered shifts
                    day.shifts = filteredShifts;

                    // Track if this employee has at least one matching shift
                    if (filteredShifts.length > 0) {
                        hasMatchingShift = true;
                    }
                }
            });
        }

        // Only include employees that have at least one matching shift
        if (hasMatchingShift) {
            filteredData.push(employeeCopy);
        }
    });

    Page.Widgets.employeeScheduleList.dataset = filteredData;
};

/**
 * Event handler for category dropdown change
 */
Page.selCategoriesChange = function ($event, widget, newVal, oldVal) {
    Page.currentCategoryFilter = newVal;
    Page.applyScheduleFilters();
};

/**
 * Event handler for status dropdown change
 */
Page.selStatusChange = function ($event, widget, newVal, oldVal) {
    Page.currentStatusFilter = newVal;
    Page.applyScheduleFilters();
};

/**
 * Event handler for position dropdown change
 */
Page.selPositionsChange = function ($event, widget, newVal, oldVal) {
    Page.currentPositionFilter = newVal;
    Page.applyScheduleFilters();
};

/**
 * Store unfiltered data when schedule list loads successfully.
 * This is called after svScheduleList.dataSet is populated.
 */
Page.storeUnfilteredScheduleData = function () {
    let dataset = Page.Variables.svScheduleList.dataSet;
    if (dataset && dataset.length > 0) {
        // Only update unfilteredScheduleData if we have actual data
        // This prevents overwriting the backup when filters return empty results
        Page.unfilteredScheduleData = dataset.slice();
    } else {
        // Don't clear unfilteredScheduleData when service returns no results
        // Just apply filters to show the "no data" state
        //Page.applyScheduleFilters();
    }
};

/**
 * Reads employeeViewConfig from localStorage, syncs the App variable,
 * then applies show/hide to all corresponding EmployeeView widgets.
 */
Page.loadEmployeeViewConfig = function () {
    let stored = localStorage.getItem('employeeViewConfig');
    if (stored) {
        let config = JSON.parse(stored);
        App.Variables.employeeViewConfig.setData(config);
        Page.applyConfigToView(config);

    } else {
        // No stored config — use App variable defaults and persist them
        localStorage.setItem('employeeViewConfig', JSON.stringify(App.Variables.employeeViewConfig.dataSet));
        Page.applyConfigToView(App.Variables.employeeViewConfig.dataSet);
    }
};

/**
 * Applies show/hide visibility to EmployeeView widgets based on the config object.
 * Defaults to true (visible) for any key that is missing or undefined.
 *
 * Config key → Widget(s) mapping:
 *   showDescription      → lblMondayItemShift, lblTuesdayItemShift, lblWednesdayItemShift,
 *                          lblThursdayItemShift, lblFridayItemShift, lblSaturdayItemShift, lblSundayItemShift
 *   showPosition         → lblMondayItemNotes, lblTuesdayItemNotes, lblWednesdayItemNotes,
 *                          lblThursdayItemNotes, lblFridayItemNotes, lblSaturdayItemNotes, lblSundayItemNotes
 *   showTotalHours       → label67_1
 *   showPhoneNumber      → scheduleListList2
 *   showDateHeaderOnce   → dayHeadersContainer
 *   showNamesOnLeft      → employeeNameCell
 */
Page.applyConfigToView = function (config) {
    let cfg = config || {};

    function val(key, defaultVal) {
        if (cfg.hasOwnProperty(key)) {
            return cfg[key];
        }

        if (defaultVal !== undefined) {
            return defaultVal;
        }

        return true;
    }

    // showDescription: shift name/description labels inside each day's shift list
    let showDesc = val('showDescription', true);
    ['lblMondayItemShift', 'lblTuesdayItemShift', 'lblWednesdayItemShift',
        'lblThursdayItemShift', 'lblFridayItemShift', 'lblSaturdayItemShift', 'lblSundayItemShift'
    ].forEach(function (widgetName) {
        if (Page.Widgets[widgetName]) {
            Page.Widgets[widgetName].show = showDesc;
        }
    });

    // showPosition: shift notes labels (used to display position/notes) inside each day's shift list
    let showPos = val('showPosition', true);
    ['lblMondayItemNotes', 'lblTuesdayItemNotes', 'lblWednesdayItemNotes',
        'lblThursdayItemNotes', 'lblFridayItemNotes', 'lblSaturdayItemNotes', 'lblSundayItemNotes'
    ].forEach(function (widgetName) {
        if (Page.Widgets[widgetName]) {
            Page.Widgets[widgetName].show = showPos;
        }
    });

    // showTotalHours: total hours label inside each employee row
    let showTotalHours = val('showTotalHours', true);
    if (Page.Widgets.label67_1) {
        Page.Widgets.label67_1.show = showTotalHours;
    }

    // showPhoneNumber: phone number list inside each employee cell
    let showPhone = val('showPhoneNumber', false);
    if (Page.Widgets.scheduleListList2) {
        Page.Widgets.scheduleListList2.show = showPhone;
    }

    // showNamesOnLeft: the employee name cell column
    let showNames = val('showNamesOnLeft', true);
    if (Page.Widgets.employeeNameCell) {
        Page.Widgets.employeeNameCell.show = showNames;
    }
};

/**
 * Guards svScheduleList from firing when date inputs are not yet available.
 * Returns false to abort the API call if startDate or endDate is missing.
 */
Page.svScheduleListonBeforeServiceCall = function (variable, inputData) {
    if (!inputData.startDate || !inputData.endDate || !inputData.companyId) {
        return false;
    }
};

/**
 * Resets all form fields and checkboxes to their default/empty state
 */
Page.resetShiftForm = function () {
    // Clear all weekday checkboxes
    Page.Widgets.chkMon.datavalue = false;
    Page.Widgets.chkTue.datavalue = false;
    Page.Widgets.chkWed.datavalue = false;
    Page.Widgets.chkThu.datavalue = false;
    Page.Widgets.chkFri.datavalue = false;
    Page.Widgets.chkSat.datavalue = false;
    Page.Widgets.chkSun.datavalue = false;

    // Clear select all / clear all checkboxes
    Page.Widgets.chkSelectAll.datavalue = false;
    Page.Widgets.chkClearAll.datavalue = false;

    // Clear assign existing checkbox
    Page.Widgets.chkAssignExisting.datavalue = false;

    // Clear auto calculate checkbox
    Page.Widgets.chkAutoCalculate.datavalue = false;
};

/**
 * Sets the appropriate weekday checkbox based on the day name
 * @param {String} dayName - The weekday name (e.g., 'Monday', 'Tuesday')
 */
Page.setWeekdayCheckbox = function (dayName) {
    let checkboxMap = {
        'Monday': 'chkMon',
        'Tuesday': 'chkTue',
        'Wednesday': 'chkWed',
        'Thursday': 'chkThu',
        'Friday': 'chkFri',
        'Saturday': 'chkSat',
        'Sunday': 'chkSun'
    };

    let checkboxName = checkboxMap[dayName];
    if (checkboxName && Page.Widgets[checkboxName]) {
        Page.Widgets[checkboxName].datavalue = true;
    }
};

Page.saveShift = function () {
    let formData = Page.Widgets.shiftForm.formdata;

    if (!Page.selectedEmployee || !Page.selectedDay) {
        return;
    }

    let dayLowerCase = Page.selectedDay.toLowerCase();

    let shiftInfo = {
        position: formData.position || '',
        startTime: formData.startTime || '',
        endTime: formData.endTime || '',
        color: formData.color || '',
        paidHours: formData.paidHours || null,
        description: formData.description || '',
        category: formData.category || 'None',
        shiftType: formData.position || '',
        timeRange: formData.startTime && formData.endTime ? formData.startTime + ' - ' + formData.endTime : ''
    };

    if (!Page.selectedEmployee[dayLowerCase]) {
        Page.selectedEmployee[dayLowerCase] = {};
    }

    _.assign(Page.selectedEmployee[dayLowerCase], shiftInfo);

    Page.Widgets.shiftDialog.close();
};

Page.formatDateAsMonthDay = function (date) {
    return moment(date).format('MMM-D');
};

/**
 * Event handler for chkSelectAll checkbox
 * When checked, selects all weekday checkboxes and unchecks chkClearAll
 */
Page.chkSelectAllChange = function ($event, widget, newVal, oldVal) {
    if (newVal === true) {
        Page.Widgets.chkMon.datavalue = true;
        Page.Widgets.chkTue.datavalue = true;
        Page.Widgets.chkWed.datavalue = true;
        Page.Widgets.chkThu.datavalue = true;
        Page.Widgets.chkFri.datavalue = true;
        Page.Widgets.chkSat.datavalue = true;
        Page.Widgets.chkSun.datavalue = true;
        Page.Widgets.chkClearAll.datavalue = false;
    }
};

/**
 * Event handler for chkClearAll checkbox
 * When checked, clears all weekday checkboxes and unchecks chkSelectAll
 */
Page.chkClearAllChange = function ($event, widget, newVal, oldVal) {
    if (newVal === true) {
        Page.Widgets.chkMon.datavalue = false;
        Page.Widgets.chkTue.datavalue = false;
        Page.Widgets.chkWed.datavalue = false;
        Page.Widgets.chkThu.datavalue = false;
        Page.Widgets.chkFri.datavalue = false;
        Page.Widgets.chkSat.datavalue = false;
        Page.Widgets.chkSun.datavalue = false;
        Page.Widgets.chkSelectAll.datavalue = false;
    }
};

/**
 * Helper function to open dialog and set employee/day context.
 * shiftDialog.open() is guarded by useQuickShiftEdit config flag.
 * The dialog only opens when useQuickShiftEdit is true.
 */
Page.openDialogForDay = function (item, dayName, dayIndex) {
    Page.selectedEmployee = item;
    Page.selectedDay = dayName;
    Page.dayIndex = dayIndex;
    Page.pageParams.selectedDay = dayName;

    let currentWeekStart = Page.Widgets.Weekview1.selectedweekdataset.startDate;
    let shiftDate = moment(currentWeekStart).add(dayIndex, 'days');
    let formattedDate = shiftDate.format('dddd, MMM-D');

    Page.selectedShiftDate = shiftDate;
    Page.formattedShiftDate = formattedDate;

    if (App.Variables.employeeViewConfig.dataSet.useQuickShiftEdit) {
        Page.Widgets.shiftDialog.open();
    }
};

/**
 * Shared helper invoked by all {day}ShiftItemClick handlers in edit mode.
 * Sets context variables, fetches shift details via svGetShiftById,
 * and opens the dialog only after the response is received (in the onSuccess callback).
 */
Page.openEditShiftDialog = function (item, dayName, dayIndex) {
    Page.isAdd = false;
    Page.selectedShiftdForIEmployee = item.shiftId;
    Page.selectedShiftItem = item;
    Page.selectedDay = dayName;

    let currentWeekStart = Page.Widgets.Weekview1.selectedweekdataset.startDate;
    let shiftDate = moment(currentWeekStart).add(dayIndex, 'days');
    Page.selectedShiftDate = shiftDate;
    Page.formattedShiftDate = shiftDate.format('dddd, MMM-D');

    // Invoke svGetShiftById; dialog opens inside svGetShiftByIdSuccess
    Page.Variables.svGetShiftById.setInput('id', item.shiftId);
    Page.Variables.svGetShiftById.invoke();
};

function getFullDayName(shortDay) {
    const days = {
        'Fri': 'Friday',
        'Sat': 'Saturday',
        'Sun': 'Sunday',
        'Mon': 'Monday',
        'Tue': 'Tuesday',
        'Wed': 'Wednesday',
        'Thu': 'Thursday'
    };

    // Returns the full name, or a fallback message if the input doesn't match
    return days[shortDay] || 'Invalid day';
}

// Fix 3: All 7 ShiftCellClick handlers now set Page.isAdd = true AND clear Page.selectedShiftItem

Page.mondayShiftCellClick = function ($event, widget, item, currentItemWidgets) {
    Page.isAdd = true;
    Page.selectedShiftItem = null;  // clear any pending edit item
    let day1 = getFullDayName(Page.Widgets.lblMondayDate.caption.split(" ")[1]);
    Page.openDialogForDay(item, day1, 0);
};

Page.tuesdayShiftCellClick = function ($event, widget, item, currentItemWidgets) {
    Page.isAdd = true;
    Page.selectedShiftItem = null;  // clear any pending edit item
    let day2 = getFullDayName(Page.Widgets.lblTuesdayDate.caption.split(" ")[1]);
    Page.openDialogForDay(item, day2, 1);
};

Page.wednesdayShiftCellClick = function ($event, widget, item, currentItemWidgets) {
    Page.isAdd = true;
    Page.selectedShiftItem = null;  // clear any pending edit item
    let day3 = getFullDayName(Page.Widgets.lblWednesdayDate.caption.split(" ")[1]);
    Page.openDialogForDay(item, day3, 2);
};

Page.thursdayShiftCellClick = function ($event, widget, item, currentItemWidgets) {
    Page.isAdd = true;
    Page.selectedShiftItem = null;  // clear any pending edit item
    let day4 = getFullDayName(Page.Widgets.lblThursdayDate.caption.split(" ")[1]);
    Page.openDialogForDay(item, day4, 3);
};

Page.fridayShiftCellClick = function ($event, widget, item, currentItemWidgets) {
    Page.isAdd = true;
    Page.selectedShiftItem = null;  // clear any pending edit item
    let day5 = getFullDayName(Page.Widgets.lblFridayDate.caption.split(" ")[1]);
    Page.openDialogForDay(item, day5, 4);
};

Page.saturdayShiftCellClick = function ($event, widget, item, currentItemWidgets) {
    Page.isAdd = true;
    Page.selectedShiftItem = null;  // clear any pending edit item
    let day6 = getFullDayName(Page.Widgets.lblSaturdayDate.caption.split(" ")[1]);
    Page.openDialogForDay(item, day6, 5);
};

Page.sundayShiftCellClick = function ($event, widget, item, currentItemWidgets) {
    Page.isAdd = true;
    Page.selectedShiftItem = null;  // clear any pending edit item
    let day7 = getFullDayName(Page.Widgets.lblSundayDate.caption.split(" ")[1]);
    Page.openDialogForDay(item, day7, 6);
};

/* -------------------------------------------------
   SHIFT ITEM CLICK: handlers for clicking an existing shift in the inner list
   Each handler delegates to openEditShiftDialog which fetches shift data
   before opening the dialog.
   ------------------------------------------------- */

Page.mondayShiftItemClick = function ($event, widget, item, currentItemWidgets) {
    $event.stopPropagation();
    Page.selectedEmployee = Page.Widgets.employeeScheduleList.selecteditem;
    let day1 = getFullDayName(Page.Widgets.lblMondayDate.caption.split(" ")[1]);
    Page.openEditShiftDialog(item, day1, 0);
};

Page.tuesdayShiftItemClick = function ($event, widget, item, currentItemWidgets) {
    $event.stopPropagation();
    Page.selectedEmployee = Page.Widgets.employeeScheduleList.selecteditem;
    let day2 = getFullDayName(Page.Widgets.lblTuesdayDate.caption.split(" ")[1]);
    Page.openEditShiftDialog(item, day2, 1);
};

Page.wednesdayShiftItemClick = function ($event, widget, item, currentItemWidgets) {
    $event.stopPropagation();
    Page.selectedEmployee = Page.Widgets.employeeScheduleList.selecteditem;
    let day3 = getFullDayName(Page.Widgets.lblWednesdayDate.caption.split(" ")[1]);
    Page.openEditShiftDialog(item, day3, 2);
};

Page.thursdayShiftItemClick = function ($event, widget, item, currentItemWidgets) {
    $event.stopPropagation();
    Page.selectedEmployee = Page.Widgets.employeeScheduleList.selecteditem;
    let day4 = getFullDayName(Page.Widgets.lblThursdayDate.caption.split(" ")[1]);
    Page.openEditShiftDialog(item, day4, 3);
};

Page.fridayShiftItemClick = function ($event, widget, item, currentItemWidgets) {
    $event.stopPropagation();
    Page.selectedEmployee = Page.Widgets.employeeScheduleList.selecteditem;
    let day5 = getFullDayName(Page.Widgets.lblFridayDate.caption.split(" ")[1]);
    Page.openEditShiftDialog(item, day5, 4);
};

Page.saturdayShiftItemClick = function ($event, widget, item, currentItemWidgets) {
    $event.stopPropagation();
    Page.selectedEmployee = Page.Widgets.employeeScheduleList.selecteditem;
    let day6 = getFullDayName(Page.Widgets.lblSaturdayDate.caption.split(" ")[1]);
    Page.openEditShiftDialog(item, day6, 5);
};

Page.sundayShiftItemClick = function ($event, widget, item, currentItemWidgets) {
    $event.stopPropagation();
    Page.selectedEmployee = Page.Widgets.employeeScheduleList.selecteditem;
    let day7 = getFullDayName(Page.Widgets.lblSundayDate.caption.split(" ")[1]);
    Page.openEditShiftDialog(item, day7, 6);
};

/**
 * onSuccess handler for svGetShiftById.
 * Resolves position and category names to IDs, computes paidHours,
 * sets all edit-mode form widgets programmatically, then opens the dialog.
 */
Page.svGetShiftByIdSuccess = function (variable, data) {
    // Resolve position name -> id
    let positionsDataSet = Page.Variables.svGetAllPositionsByCompanyId.dataSet;
    let positionsList = (positionsDataSet && positionsDataSet.positions) ? positionsDataSet.positions : [];
    let positionMatch = positionsList.find(function (p) { return p.description === data.position; });
    let resolvedPositionId = positionMatch ? positionMatch.positionId : null;

    // Resolve category name -> id
    let categoriesDataSet = Page.Variables.svGetAllCategoriesByCompanyId.dataSet;
    let categoriesList = (categoriesDataSet && categoriesDataSet.categories) ? categoriesDataSet.categories : [];
    let categoryMatch = categoriesList.find(function (c) { return c.description === data.category; });
    let resolvedCategoryId = categoryMatch ? categoryMatch.id : null;

    // Open the dialog so its widgets are available in the DOM
    Page.Widgets.shiftDialog.open();

    // Use a short timeout to allow dialog widgets to initialise before setting values
    setTimeout(function () {
        if (Page.Widgets.positionField) {
            Page.Widgets.positionField.datavalue = resolvedPositionId;
        }
        if (Page.Widgets.categoryField) {
            Page.Widgets.categoryField.datavalue = resolvedCategoryId;
        }
        if (Page.Widgets.paidHoursField) {
            Page.Widgets.paidHoursField.datavalue = data.duration;
        }
        if (Page.Widgets.chkAutoCalculate) {
            Page.Widgets.chkAutoCalculate.datavalue = false;
        }
    }, 100);
};

/**
 * Dialog opened event handler.
 *
 * ADD mode  (Page.isAdd === true):
 *   - Resets the form and sets only the checkbox for the clicked day
 *     (Page.selectedDay) to true; all other day checkboxes are false.
 *
 * EDIT mode (Page.isAdd === false):
 *   - Form fields startTime, endTime, color, description are pre-filled via
 *     declarative defaultvalue bindings to svGetShiftById.dataSet.
 *   - positionField, categoryField, paidHours, chkAutoCalculate are set
 *     programmatically in svGetShiftByIdSuccess after the API call completes.
 *   - All weekday checkboxes are cleared.
 */
Page.shiftDialogOpened = function ($event, widget) {
    Page.isFromDraggable = false;
    if (Page.isAdd) {
        // ADD MODE
        // Reset the form so no stale values bleed in from a previous edit session.
        Page.Widgets.shiftForm.reset();

        // Clear all weekday checkboxes first.
        Page.Widgets.chkMon.datavalue = false;
        Page.Widgets.chkTue.datavalue = false;
        Page.Widgets.chkWed.datavalue = false;
        Page.Widgets.chkThu.datavalue = false;
        Page.Widgets.chkFri.datavalue = false;
        Page.Widgets.chkSat.datavalue = false;
        Page.Widgets.chkSun.datavalue = false;

        // Set only the checkbox that corresponds to the clicked day.
        let checkboxMap = {
            'Monday': 'chkMon',
            'Tuesday': 'chkTue',
            'Wednesday': 'chkWed',
            'Thursday': 'chkThu',
            'Friday': 'chkFri',
            'Saturday': 'chkSat',
            'Sunday': 'chkSun'
        };
        let selectedCheckbox = checkboxMap[Page.selectedDay];
        if (selectedCheckbox && Page.Widgets[selectedCheckbox]) {
            Page.Widgets[selectedCheckbox].datavalue = true;
        }

        Page.Widgets.chkAutoCalculate.datavalue = false;
    } else {
        // EDIT MODE
        // startTime, endTime, color, description are pre-filled via declarative
        // defaultvalue bindings to svGetShiftById.dataSet (set in HTML).
        // positionField, categoryField, paidHours, chkAutoCalculate are set
        // programmatically in svGetShiftByIdSuccess.

        // Clear all weekday checkboxes - day selection is irrelevant in edit mode.
        Page.Widgets.chkMon.datavalue = false;
        Page.Widgets.chkTue.datavalue = false;
        Page.Widgets.chkWed.datavalue = false;
        Page.Widgets.chkThu.datavalue = false;
        Page.Widgets.chkFri.datavalue = false;
        Page.Widgets.chkSat.datavalue = false;
        Page.Widgets.chkSun.datavalue = false;
        Page.Widgets.chkAutoCalculate.datavalue = false;
    }
};

Page.button16Click = function ($event, widget) {
    let positionId = Page.Widgets.shiftForm.formWidgets.positionField.datavalue;
    let startTime = Page.Widgets.shiftForm.formWidgets.startTimeField.datavalue;
    let endTime = Page.Widgets.shiftForm.formWidgets.endTimeField.datavalue;
    let description = Page.Widgets.shiftForm.formWidgets.form_field9.datavalue;
    let categoryId = Page.Widgets.shiftForm.formWidgets.categoryField.datavalue;

    if (!positionId) {
        Page.alertMsg = 'Please select a position.';
        Page.Widgets.alertdialog1.open();
        return;
    }

    if (!startTime) {
        Page.alertMsg = 'Please enter a start time.';
        Page.Widgets.alertdialog1.open();
        return;
    }

    if (!endTime) {
        Page.alertMsg = 'Please enter an end time.';
        Page.Widgets.alertdialog1.open();
        return;
    }

    if (!Page.selectedEmployee || !Page.selectedEmployee.employeeId) {
        App.Actions.appNotification.invoke({
            message: 'No employee selected',
            class: 'error'
        });
        return;
    }

    if (!Page.selectedDay) {
        App.Actions.appNotification.invoke({
            message: 'No day selected',
            class: 'error'
        });
        return;
    }

    if (!Page.selectedShiftDate) {
        App.Actions.appNotification.invoke({
            message: 'No shift date selected',
            class: 'error'
        });
        return;
    }
    if (Page.isAdd) {
        // ADD MODE: Build local shiftInfo for optimistic UI update
        Page.Variables.svCreateShift.setInput({
            RequestBody: {
                employeeId: Page.selectedEmployee.employeeId,
                companyId: 1,
                date: Page.selectedShiftDate.format('YYYY-MM-DD'),
                description: description || '',
                startTime: formatToStandardTime(startTime) || '',
                endTime: formatToStandardTime(endTime) || '',
                position: positionId || '',
                category: categoryId || '',
                color: 'amer'
            }
        });
        Page.Variables.svCreateShift.invoke();
    } else {
        Page.Variables.svUpdateShift.setInput({
            "shiftId": Page.selectedShiftItem.shiftId,
            RequestBody: {
                employeeId: Page.selectedEmployee.employeeId,
                companyId: 1,
                date: Page.selectedShiftDate.format('YYYY-MM-DD'),
                description: description || '',
                startTime: formatToStandardTime(startTime) || '',
                endTime: formatToStandardTime(endTime) || '',
                position: positionId || '',
                category: categoryId || '',
                color: 'amer'
            }
        });
        Page.Variables.svUpdateShift.invoke();
    }

    Page.Widgets.shiftDialog.close();
};
/* -------------------------------------------------
   DRAG-AND-DROP: helper utilities
   ------------------------------------------------- */

/**
 * Maps a day0-day6 key to its numeric index offset (0-6).
 * Returns -1 for unknown keys so callers can guard against bad input.
 */
Page._dayDateKey = function (dayKey) {
    // Maps day0-day6 to index offset (0-6)
    let indexMap = {
        'day0': 0, 'day1': 1, 'day2': 2, 'day3': 3,
        'day4': 4, 'day5': 5, 'day6': 6
    };
    return indexMap.hasOwnProperty(dayKey) ? indexMap[dayKey] : -1;
};

/**
 * Resolves a YYYY-MM-DD date string for the given day0-day6 key.
 * Derives the date from Weekview1.startdate + day index offset.
 * Falls back to reading the shift date from the first employee's weeklyShifts
 * slot if startdate is empty, then falls back to today as last resort.
 */
Page._resolveShiftDateISO = function (dayKey) {
    let dayIndex = Page._dayDateKey(dayKey); // returns 0-6
    if (dayIndex === -1) {
        console.warn('_resolveShiftDateISO: unknown dayKey "' + dayKey + '"');
        return moment().format('YYYY-MM-DD');
    }
    let startDate = Page.Widgets.Weekview1.startdate;
    if (!startDate) {
        // Fallback: read date directly from first employee weeklyShifts slot in dataset
        let dataset = Page.Variables.svScheduleList.dataSet;
        if (dataset && dataset.length > 0) {
            let emp = dataset[0];
            if (emp.weeklyShifts && emp.weeklyShifts[dayIndex] && emp.weeklyShifts[dayIndex].date) {
                return moment(emp.weeklyShifts[dayIndex].date).format('YYYY-MM-DD');
            }
        }
        console.warn('_resolveShiftDateISO: Weekview1.startdate is empty and no fallback found');
        return moment().format('YYYY-MM-DD');
    }
    return moment(startDate).add(dayIndex, 'days').format('YYYY-MM-DD');
};

/* -------------------------------------------------
   DRAG-AND-DROP: Two-step confirmation flow
   ------------------------------------------------- */

/**
 * Executes the actual pending drop: applies optimistic UI update and invokes
 * svUpdateShift with the payload stored in Page._pendingDropPayload.
 * Called after both confirmation dialogs have been accepted.
 */
Page._executePendingDrop = function () {
    let payload = Page._pendingDropPayload;
    if (!payload) {
        console.warn('_executePendingDrop: no pending payload found, aborting.');
        return;
    }

    let dataset = Page.Variables.svScheduleList.dataSet;

    // Apply optimistic UI update
    let sourceEmpIndex = payload.sourceEmpIndex;
    let targetEmpIndex = payload.targetEmpIndex;
    let sourceDayIndex = payload.sourceDayIndex;
    let targetDayIndex = payload.targetDayIndex;
    let draggedShiftId = payload.draggedShiftId;
    let sourceShift = payload.sourceShift;

    let sourceShiftsArray = (dataset[sourceEmpIndex] &&
        dataset[sourceEmpIndex].weeklyShifts &&
        dataset[sourceEmpIndex].weeklyShifts[sourceDayIndex] &&
        dataset[sourceEmpIndex].weeklyShifts[sourceDayIndex].shifts) || [];

    let targetShiftsArray = (dataset[targetEmpIndex] &&
        dataset[targetEmpIndex].weeklyShifts &&
        dataset[targetEmpIndex].weeklyShifts[targetDayIndex] &&
        dataset[targetEmpIndex].weeklyShifts[targetDayIndex].shifts) || [];

    // Remove dragged shift from source day's shifts array
    let updatedSourceShifts = sourceShiftsArray.filter(function (s) {
        return s.shiftId !== draggedShiftId;
    });
    if (dataset[sourceEmpIndex] && dataset[sourceEmpIndex].weeklyShifts && dataset[sourceEmpIndex].weeklyShifts[sourceDayIndex]) {
        dataset[sourceEmpIndex].weeklyShifts[sourceDayIndex].shifts = updatedSourceShifts.slice();
    }

    // Append dragged shift to target day's shifts array
    let updatedTargetShifts = targetShiftsArray.slice();
    updatedTargetShifts.push(sourceShift);
    if (dataset[targetEmpIndex] && dataset[targetEmpIndex].weeklyShifts && dataset[targetEmpIndex].weeklyShifts[targetDayIndex]) {
        dataset[targetEmpIndex].weeklyShifts[targetDayIndex].shifts = updatedTargetShifts.slice();
    }

    // Persist optimistic UI update
    Page.Variables.svScheduleList.setData(dataset.slice());

    // Invoke svUpdateShift with stored payload
    Page.Variables.svUpdateShift.setInput({
        shiftId: draggedShiftId,
        RequestBody: {
            employeeId: payload.targetEmployeeId,
            companyId: 1,
            date: payload.targetShiftDate,
            description: sourceShift.notes || '',
            startTime: sourceShift.startAt || '',
            endTime: sourceShift.endAt || '',
            position: payload.resolvedPositionId,
            category: payload.resolvedCategoryId,
            color: sourceShift.color || 'amber'
        }
    });
    Page.Variables.svUpdateShift.invoke(
        {},
        function (data) {
            Page.Variables.svScheduleList.invoke();
        },
        function (error) {
            Page.Variables.svScheduleList.invoke();
        }
    );

    // Clear pending state
    Page._pendingDropPayload = null;
    Page.dragState = null;
};

/* -------------------------------------------------
   Dialog 1 (confirmShiftChangeDialog) button handlers
   ------------------------------------------------- */

/**
 * Yes on Dialog 1: close dialog, set svchkHasConflicts inputs, invoke API.
 */
Page.btnConfirmShiftYesClick = function ($event, widget) {

    let payload = Page._pendingDropPayload;
    if (!payload) {
        console.warn('btnConfirmShiftYesClick: no pending drop payload, aborting conflict check.');
        return;
    }
    if (Page.hasConflicts) {
        Page.btnConflictYesClick();
    } else {
        // Build svchkHasConflicts request from pending drop payload
        Page.Variables.svchkHasConflicts.setInput({
            RequestBody: {
                operationType: 'UPDATE',
                shift: {
                    employeeId: payload.targetEmployeeId,
                    date: payload.targetShiftDate,
                    description: payload.sourceShift.notes || '',
                    startTime: payload.sourceShift.startAt || '',
                    endTime: payload.sourceShift.endAt || '',
                    position: payload.resolvedPositionId || 1,
                    category: payload.resolvedCategoryId || 1,
                    color: payload.sourceShift.color || 'amber',
                    duration: 8
                }
            }
        });
        Page.Variables.svchkHasConflicts.invoke();
    }
};

/**
 * No on Dialog 1: close dialog, clear pending state, refresh schedule.
 */
Page.btnConfirmShiftNoClick = function ($event, widget) {
    Page.Widgets.confirmShiftChangeDialog.close();
    Page._pendingDropPayload = null;
    Page.dragState = null;
    Page.Variables.svScheduleList.invoke();
};

/* -------------------------------------------------
   svchkHasConflicts onSuccess handler
   ------------------------------------------------- */

/**
 * Called when svchkHasConflicts API responds.
 * If hasConflicts is true: build dynamic message and show Dialog 2.
 * Otherwise: proceed with the drop directly.
 */
Page.svchkHasConflictsOnSuccess = function (variable, data) {
    if (data && data.hasConflicts === true) {
        // Build dynamic conflict message from conflicts array or payload context
        let conflictMsg = '';
        let payload = Page._pendingDropPayload;

        if (data.conflicts && data.conflicts.length > 0) {
            let firstConflict = data.conflicts[0];
            // Try common field names returned by the API
            let empName = firstConflict.employeeName || firstConflict.employee_name ||
                (payload && payload.sourceEmployeeName) || '';
            let posName = firstConflict.positionName || firstConflict.position_name ||
                firstConflict.position || (payload && payload.sourceShift && payload.sourceShift.shiftName) || '';
            if (empName && posName) {
                conflictMsg = empName + ' is not authorized for position ' + posName + '.';
            } else if (empName) {
                conflictMsg = empName + ' has a scheduling conflict.';
            } else if (posName) {
                conflictMsg = 'Employee is not authorized for position ' + posName + '.';
            } else {
                conflictMsg = 'A scheduling conflict was detected.';
            }
        } else if (payload) {
            let empName = (payload.sourceEmployeeName) || '';
            let posName = (payload.sourceShift && payload.sourceShift.shiftName) || '';
            if (empName && posName) {
                conflictMsg = empName + ' is not authorized for position ' + posName + '.';
            } else {
                conflictMsg = 'A scheduling conflict was detected for this shift change.';
            }
        } else {
            conflictMsg = 'A scheduling conflict was detected for this shift change.';
        }

        Page.Variables.conflictMessageVar.setData({ message: conflictMsg });
        Page.hasConflicts = true;
        Page.Widgets.container98.show = faslse;
        Page.Widgets.conflictMsgcontainer.show = true;
    } else {
        Page.Widgets.confirmShiftChangeDialog.close();
        Page._executePendingDrop();
    }
};

/* -------------------------------------------------
   Dialog 2 (confirmConflictDialog) button handlers
   ------------------------------------------------- */

/**
 * Yes on Dialog 2: close dialog, proceed with the drop.
 */
Page.btnConflictYesClick = function ($event, widget) {
    Page.Widgets.confirmShiftChangeDialog.close();
    Page.hasConflicts = false;
    Page._executePendingDrop();
};


/* -------------------------------------------------
   DRAG-AND-DROP: Core drop handler (modified for two-step confirmation)
   ------------------------------------------------- */

/**
 * Core drop handler -- shared by all 7 day-specific drop handlers.
 *
 * Instead of directly calling svUpdateShift, this now:
 * 1. Computes all required drop payload (employee IDs, dates, position/category IDs)
 * 2. Stores it in Page._pendingDropPayload
 * 3. Opens confirmShiftChangeDialog (Dialog 1) for user confirmation
 *
 * The actual update is deferred to Page._executePendingDrop(), which is called
 * after both confirmation dialogs are accepted (or directly if no conflict).
 */
Page._handleShiftDrop = function ($event, item, targetDayName) {
    Page.isFromDraggable = true;
    $event.preventDefault();
    $event.stopPropagation();

    // Guard: currentTarget can be null in WaveMaker async event wrapper
    let el = $event.currentTarget || $event.target;
    if (el) {
        let cell = el.closest ? el.closest('.weekday-container') : el;
        if (cell && cell.classList) {
            cell.classList.remove('drag-over-highlight');
        }
    }

    if (!Page.dragState) { return; }

    let sourceEmpIndex = Page.dragState.employeeIndex;
    let sourceDayName = Page.dragState.dayName;
    let dataset = Page.Variables.svScheduleList.dataSet;

    let targetEmpIndex = _.findIndex(dataset, { employeeId: item.employeeId });
    if (targetEmpIndex === -1) { Page.dragState = null; return; }

    // Skip same-cell drop
    if (sourceEmpIndex === targetEmpIndex && sourceDayName === targetDayName) {
        Page.dragState = null;
        return;
    }

    // Derive numeric day indices from 'day0'-'day6' keys
    let sourceDayIndex = Page._dayDateKey(sourceDayName); // 0-6
    let targetDayIndex = Page._dayDateKey(targetDayName); // 0-6

    // Read source shift from weeklyShifts[N].shifts using the correct path.
    let sourceShiftsArray = (dataset[sourceEmpIndex] &&
        dataset[sourceEmpIndex].weeklyShifts &&
        dataset[sourceEmpIndex].weeklyShifts[sourceDayIndex] &&
        dataset[sourceEmpIndex].weeklyShifts[sourceDayIndex].shifts) || [];

    let sourceRaw = Page.dragState.shiftData ||
        (sourceShiftsArray.length > 0 ? sourceShiftsArray[0] : null);

    if (!sourceRaw || !sourceRaw.shiftId) {
        console.warn('Drag-drop aborted: no valid shift at source cell "' + sourceDayName + '"');
        Page.dragState = null;
        return;
    }

    // Safe deep clone of source shift
    let sourceShift = JSON.parse(JSON.stringify(sourceRaw));

    // Resolve common API params
    let targetEmployeeId = dataset[targetEmpIndex].employeeId;
    let targetShiftDate = Page._resolveShiftDateISO(targetDayName);
    let draggedShiftId = sourceShift.shiftId;

    // Resolve position ID from svGetAllPositionsByCompanyId
    let positionsDataSet = Page.Variables.svGetAllPositionsByCompanyId.dataSet;
    let positionsList = (positionsDataSet && positionsDataSet.positions) ? positionsDataSet.positions : [];
    let positionMatch = _.find(positionsList, function (p) {
        return p.name === sourceShift.shiftName;
    });
    let resolvedPositionId = positionMatch ? positionMatch.id : (sourceShift.positionId || null);

    // Resolve category ID from svGetAllCategoriesByCompanyId
    let categoriesDataSet = Page.Variables.svGetAllCategoriesByCompanyId.dataSet;
    let categoriesList = (categoriesDataSet && categoriesDataSet.categories) ? categoriesDataSet.categories : [];
    let categoryMatch = _.find(categoriesList, function (c) {
        return c.name === sourceShift.category;
    });
    let resolvedCategoryId = categoryMatch ? categoryMatch.id : null;

    // Capture source employee name for conflict message display
    let sourceEmployeeName = (dataset[sourceEmpIndex] && dataset[sourceEmpIndex].employeeName) || '';

    // Store full drop payload for use in confirmation flow
    Page._pendingDropPayload = {
        sourceEmpIndex: sourceEmpIndex,
        targetEmpIndex: targetEmpIndex,
        sourceDayIndex: sourceDayIndex,
        targetDayIndex: targetDayIndex,
        draggedShiftId: draggedShiftId,
        sourceShift: sourceShift,
        targetEmployeeId: targetEmployeeId,
        targetShiftDate: targetShiftDate,
        resolvedPositionId: resolvedPositionId,
        resolvedCategoryId: resolvedCategoryId,
        sourceEmployeeName: sourceEmployeeName
    };

    // Open Dialog 1 for user confirmation (actual drop deferred until confirmed)
    Page.Widgets.confirmShiftChangeDialog.open();
};

/* -------------------------------------------------
   DRAG-AND-DROP: Delete source shift after move
   ------------------------------------------------- */

/**
 * Uses svDeleteShiftById (correct REST variable) instead of the
 * old svDeleteShifts DataService variable to delete the original shift from the
 * source cell after a successful drag-and-drop move.
 *
 * @param {number|string} shiftId - the shiftId of the dragged (source) shift
 */
Page._deleteSourceShift = function (shiftId) {
    if (!shiftId) {
        console.warn('_deleteSourceShift: no shiftId provided, skipping delete.');
        Page.Variables.svScheduleList.invoke();
        return;
    }
    Page.Variables.svDeleteShiftById.setInput({ id: shiftId });
    Page.Variables.svDeleteShiftById.invoke(
        {},
        function (data) {
            Page.Variables.svScheduleList.invoke();
        },
        function (error) {
            Page.Variables.svScheduleList.invoke();
        }
    );
};

/* -------------------------------------------------
   DRAG-AND-DROP: Shared DragOver and DragLeave
   ------------------------------------------------- */

Page.shiftCellDragOver = function ($event, widget, item, currentItemWidgets) {
    $event.preventDefault();
    $event.dataTransfer.dropEffect = 'move';
    let el = $event.currentTarget || $event.target;
    if (el && el.classList) {
        // Walk up to find the actual shift cell container if drop landed on a child
        let cell = el.closest ? el.closest('.weekday-container') : el;
        if (cell && cell.classList) {
            cell.classList.add('drag-over-highlight');
        }
    }
};

Page.shiftCellDragLeave = function ($event, widget, item, currentItemWidgets) {
    let el = $event.currentTarget || $event.target;
    if (el && el.classList) {
        let cell = el.closest ? el.closest('.weekday-container') : el;
        if (cell && cell.classList) {
            cell.classList.remove('drag-over-highlight');
        }
    }
};

/* -------------------------------------------------
   DRAG-AND-DROP: DragStart handlers (inner shift item, one per day)
   ------------------------------------------------- */

/**
 * Common inner-item dragstart logic.
 *
 * @param {Event}  $event          - the native dragstart event
 * @param {Object} item            - the individual shift object from the inner list context
 * @param {string} dayKey          - 'day0' through 'day6'
 * @param {number} dayNumericIndex - numeric day index 0-6 matching weeklyShifts array position
 */
Page._innerShiftItemDragStart = function ($event, item, dayKey, dayNumericIndex) {
    // Stop propagation so the outer shift cell container does not also fire dragstart
    $event.stopPropagation();

    let dataset = Page.Variables.svScheduleList.dataSet;

    // Find the employee row that owns this exact shift by searching
    // emp.weeklyShifts[dayNumericIndex].shifts -- the correct path in svScheduleList data.
    let empIndex = -1;
    _.forEach(dataset, function (emp, idx) {
        let shiftsForDay = emp.weeklyShifts &&
            emp.weeklyShifts[dayNumericIndex] &&
            emp.weeklyShifts[dayNumericIndex].shifts;
        if (shiftsForDay && shiftsForDay.some(function (s) { return s.shiftId === item.shiftId; })) {
            empIndex = idx;
        }
    });

    Page.dragState = {
        employeeIndex: empIndex,
        dayName: dayKey,
        shiftData: item,        // the exact clicked/dragged shift object
        shiftId: item.shiftId   // included for precise identification
    };

    $event.dataTransfer.effectAllowed = 'move';
    // Include shiftId in the transfer string for precise identification
    $event.dataTransfer.setData('text/plain', empIndex + ':' + dayKey + ':' + item.shiftId);
};

Page.mondayShiftItemDragStart = function ($event, widget, item, currentItemWidgets) {
    Page._innerShiftItemDragStart($event, item, 'day0', 0);
};

Page.tuesdayShiftItemDragStart = function ($event, widget, item, currentItemWidgets) {
    Page._innerShiftItemDragStart($event, item, 'day1', 1);
};

Page.wednesdayShiftItemDragStart = function ($event, widget, item, currentItemWidgets) {
    Page._innerShiftItemDragStart($event, item, 'day2', 2);
};

Page.thursdayShiftItemDragStart = function ($event, widget, item, currentItemWidgets) {
    Page._innerShiftItemDragStart($event, item, 'day3', 3);
};

Page.fridayShiftItemDragStart = function ($event, widget, item, currentItemWidgets) {
    Page._innerShiftItemDragStart($event, item, 'day4', 4);
};

Page.saturdayShiftItemDragStart = function ($event, widget, item, currentItemWidgets) {
    Page._innerShiftItemDragStart($event, item, 'day5', 5);
};

Page.sundayShiftItemDragStart = function ($event, widget, item, currentItemWidgets) {
    Page._innerShiftItemDragStart($event, item, 'day6', 6);
};

/* -------------------------------------------------
   DRAG-AND-DROP: Drop handlers (one per day)
   Pass day0-day6 index keys to _handleShiftDrop
   ------------------------------------------------- */

Page.mondayShiftCellDrop = function ($event, widget, item, currentItemWidgets) {
    Page._handleShiftDrop($event, item, 'day0');
};

Page.tuesdayShiftCellDrop = function ($event, widget, item, currentItemWidgets) {
    Page._handleShiftDrop($event, item, 'day1');
};

Page.wednesdayShiftCellDrop = function ($event, widget, item, currentItemWidgets) {
    Page._handleShiftDrop($event, item, 'day2');
};

Page.thursdayShiftCellDrop = function ($event, widget, item, currentItemWidgets) {
    Page._handleShiftDrop($event, item, 'day3');
};

Page.fridayShiftCellDrop = function ($event, widget, item, currentItemWidgets) {
    Page._handleShiftDrop($event, item, 'day4');
};

Page.saturdayShiftCellDrop = function ($event, widget, item, currentItemWidgets) {
    Page._handleShiftDrop($event, item, 'day5');
};

Page.sundayShiftCellDrop = function ($event, widget, item, currentItemWidgets) {
    Page._handleShiftDrop($event, item, 'day6');
};


Page.svUpdateShiftDetailsonSuccess = function (variable, data) {

    if (Page.Widgets.shiftDialog && Page.Widgets.shiftDialog.isOpen) {
        Page.Widgets.shiftDialog.close();
    }
    Page.Variables.svScheduleList.invoke();
};

Page.anchor3Click = function ($event, widget) {
    Page.Widgets.chkMon.datavalue = true;
    Page.Widgets.chkTue.datavalue = true;
    Page.Widgets.chkWed.datavalue = true;
    Page.Widgets.chkThu.datavalue = true;
    Page.Widgets.chkFri.datavalue = true;
    Page.Widgets.chkSat.datavalue = true;
    Page.Widgets.chkSun.datavalue = true;
    Page.Widgets.chkClearAll.datavalue = false;
};

Page.anchor4Click = function ($event, widget) {
    Page.Widgets.chkMon.datavalue = false;
    Page.Widgets.chkTue.datavalue = false;
    Page.Widgets.chkWed.datavalue = false;
    Page.Widgets.chkThu.datavalue = false;
    Page.Widgets.chkFri.datavalue = false;
    Page.Widgets.chkSat.datavalue = false;
    Page.Widgets.chkSun.datavalue = false;
    Page.Widgets.chkSelectAll.datavalue = false;
};

function formatToStandardTime(input) {
    if (!input) return null;

    // Normalize input (remove spaces, uppercase)
    input = input.trim().toUpperCase().replaceAll(/\s+/g, '');

    // Match formats like:
    // 9AM, 09AM, 9:00AM, 09:00AM
    const match = input.match(/^(\d{1,2})(?::?(\d{2}))?(AM|PM)$/);

    if (!match) return null; // invalid format

    let hours = Number.parseInt(match[1], 10);
    let minutes = match[2] ? match[2] : '00';
    let period = match[3];

    // Validate hours and minutes
    if (hours < 1 || hours > 12) return null;
    if (Number.parseInt(minutes) > 59) return null;

    // Format to 2-digit
    let formattedHours = hours.toString().padStart(2, '0');

    return `${formattedHours}:${minutes}${period}`;
}

/**
 * Opens the ConfigureByEmployeeView page as a browser pop-up window.
 * Uses window.open() with specific dimensions and position to present
 * it as a focused pop-up rather than a new full tab.
 */
Page.anchor9Click = function ($event, widget) {
    App.redirectTo("ConfigureByEmployeeView");
};
