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
    /*
     * variables can be accessed through 'Page.Variables' property here
     * e.g. to get dataSet in a staticVariable named 'loggedInUser' use following script
     * Page.Variables.loggedInUser.getData()
     *
     * widgets can be accessed through 'Page.Widgets' property here
     * e.g. to get value of text widget named 'username' use following script
     * 'Page.Widgets.username.datavalue'
     */
    Page.isFromDraggable = false;
};

Page.formatWeekLabel = function (startDate, endDate) {
    var monday = moment(startDate);
    return 'Week of ' + monday.format('MMM DD, YYYY');
};

Page.formatTimeRange = function (startMillis, endMillis) {
    if (!startMillis || !endMillis) {
        return '';
    }

    var startDate = new Date(startMillis);
    var endDate = new Date(endMillis);

    var startTime = moment(startDate).format('h:mm A');
    var endTime = moment(endDate).format('h:mm A');

    return startTime + ' - ' + endTime;
};

Page.transformScheduleData = function (apiResponse) {
    if (!apiResponse || !apiResponse.content || apiResponse.content.length === 0) {
        return [];
    }

    // Read the Weekview prefab's start date
    var weekStart = moment(Page.Widgets.Weekview1.selectedweekdataset.startDate).startOf('day');

    var employeeMap = {};

    _.forEach(apiResponse.content, function (record) {
        var employeeName = record.firstName + ' ' + record.lastName;

        if (!employeeMap[employeeName]) {
            // Build day0..day6 dynamic keys, each seeded with an empty shift object
            // and a dayDate field representing that column's actual date.
            // Also seed day0Shifts..day6Shifts as empty arrays for multi-shift support.
            var employeeEntry = {
                employeeName: employeeName,
                employmentType: record.employmentType,
                employeeId: record.id
            };

            for (var i = 0; i < 7; i++) {
                employeeEntry['day' + i] = {
                    shiftType: '',
                    timeRange: '',
                    shiftName: '',
                    startAt: '',
                    endAt: '',
                    shiftDate: '',
                    notes: '',
                    shiftId: '',
                    positionId: '',
                    dayDate: moment(weekStart).add(i, 'days').format('DD-MM-YYYY')
                };
                employeeEntry['day' + i + 'Shifts'] = [];
            }

            employeeMap[employeeName] = employeeEntry;
        }

        // Compute the column index relative to the week start
        var shiftDay = moment(record.shiftDate).startOf('day');
        var dayIndex = shiftDay.diff(weekStart, 'days');

        // Only place the shift if it falls within the displayed week
        if (dayIndex >= 0 && dayIndex <= 6) {
            var shiftType = record.position || 'Shift';
            var timeRange = Page.formatTimeRange(record.startAt, record.endAt);

            var startTime = moment(new Date(record.startAt)).format('h:mm A');
            var endTime = moment(new Date(record.endAt)).format('h:mm A');
            var formattedShiftDate = shiftDay.format('DD-MM-YYYY');

            var shiftObj = {
                shiftType: shiftType,
                timeRange: timeRange,
                shiftName: record.position,
                startAt: startTime,
                endAt: endTime,
                shiftDate: formattedShiftDate,
                notes: record.notes || '',
                shiftId: record.shiftId,
                positionId: record.positionId,
                dayDate: formattedShiftDate
            };

            // Push into the Shifts array for multi-shift support
            employeeMap[employeeName]['day' + dayIndex + 'Shifts'].push(shiftObj);

            // Keep backward compat -- first shift only sets the day{N} object
            if (employeeMap[employeeName]['day' + dayIndex + 'Shifts'].length === 1) {
                employeeMap[employeeName]['day' + dayIndex] = shiftObj;
            }
        }
    });

    return _.values(employeeMap);
};

Page.scheduleQueryVaronSuccess = function (variable, data) {
    var transformedData = Page.transformScheduleData(data);
    Page.Variables.transformedScheduleVar.setData(transformedData);
};

Page.scheduleQueryVaronError = function (variable, data) {
    console.error('Failed to load schedule data:', data);
    Page.Variables.transformedScheduleVar.setData([]);
};

Page.onReady = function () {
    Page.selectedEmployee;
    Page.selectedDay;
    Page.isAdd = true;
    Page.dragState = null; // drag-and-drop state holder
    Page._dragDropInsertPayload = null;
};

/**
 * Guards svScheduleList from firing when date inputs are not yet available.
 * Returns false to abort the API call if startDate or endDate is missing.
 */
Page.svScheduleListonBeforeServiceCall = function (variable, inputData) {
    console.log("input data --->");
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
    var checkboxMap = {
        'Monday': 'chkMon',
        'Tuesday': 'chkTue',
        'Wednesday': 'chkWed',
        'Thursday': 'chkThu',
        'Friday': 'chkFri',
        'Saturday': 'chkSat',
        'Sunday': 'chkSun'
    };

    var checkboxName = checkboxMap[dayName];
    if (checkboxName && Page.Widgets[checkboxName]) {
        Page.Widgets[checkboxName].datavalue = true;
    }
};

Page.saveShift = function () {
    var formData = Page.Widgets.shiftForm.formdata;

    if (!Page.selectedEmployee || !Page.selectedDay) {
        console.error('No employee or day selected');
        return;
    }

    var dayLowerCase = Page.selectedDay.toLowerCase();

    var shiftInfo = {
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

Page.calculateWeekStartDate = function (offset) {
    var currentStart = moment(Page.Variables.currentWeekVar.dataSet.startDate);
    return currentStart.clone().add(offset * 7, 'days');
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
 * Helper function to open dialog and set employee/day context
 */
Page.openDialogForDay = function (item, dayName, dayIndex) {
    Page.selectedEmployee = item;
    Page.selectedDay = dayName;
    Page.dayIndex = dayIndex;
    Page.pageParams.selectedDay = dayName;

    var employeeName = item ? item.employeeName : 'Unknown';
    var currentWeekStart = Page.Widgets.Weekview1.selectedweekdataset.startDate;
    var shiftDate = moment(currentWeekStart).add(dayIndex, 'days');
    var formattedDate = shiftDate.format('dddd, MMM-D');

    Page.selectedShiftDate = shiftDate;
    Page.formattedShiftDate = formattedDate;

    Page.Widgets.shiftDialog.open();
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

    var currentWeekStart = Page.Widgets.Weekview1.selectedweekdataset.startDate;
    var shiftDate = moment(currentWeekStart).add(dayIndex, 'days');
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
    var day1 = getFullDayName(Page.Widgets.lblMondayDate.caption.split(" ")[1]);
    Page.openDialogForDay(item, day1, 0);
};

Page.tuesdayShiftCellClick = function ($event, widget, item, currentItemWidgets) {
    Page.isAdd = true;
    Page.selectedShiftItem = null;  // clear any pending edit item
    var day2 = getFullDayName(Page.Widgets.lblTuesdayDate.caption.split(" ")[1]);
    Page.openDialogForDay(item, day2, 1);
};

Page.wednesdayShiftCellClick = function ($event, widget, item, currentItemWidgets) {
    Page.isAdd = true;
    Page.selectedShiftItem = null;  // clear any pending edit item
    var day3 = getFullDayName(Page.Widgets.lblWednesdayDate.caption.split(" ")[1]);
    Page.openDialogForDay(item, day3, 2);
};

Page.thursdayShiftCellClick = function ($event, widget, item, currentItemWidgets) {
    Page.isAdd = true;
    Page.selectedShiftItem = null;  // clear any pending edit item
    var day4 = getFullDayName(Page.Widgets.lblThursdayDate.caption.split(" ")[1]);
    Page.openDialogForDay(item, day4, 3);
};

Page.fridayShiftCellClick = function ($event, widget, item, currentItemWidgets) {
    Page.isAdd = true;
    Page.selectedShiftItem = null;  // clear any pending edit item
    var day5 = getFullDayName(Page.Widgets.lblFridayDate.caption.split(" ")[1]);
    Page.openDialogForDay(item, day5, 4);
};

Page.saturdayShiftCellClick = function ($event, widget, item, currentItemWidgets) {
    Page.isAdd = true;
    Page.selectedShiftItem = null;  // clear any pending edit item
    var day6 = getFullDayName(Page.Widgets.lblSaturdayDate.caption.split(" ")[1]);
    Page.openDialogForDay(item, day6, 5);
};

Page.sundayShiftCellClick = function ($event, widget, item, currentItemWidgets) {
    Page.isAdd = true;
    Page.selectedShiftItem = null;  // clear any pending edit item
    var day7 = getFullDayName(Page.Widgets.lblSundayDate.caption.split(" ")[1]);
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
    var day1 = getFullDayName(Page.Widgets.lblMondayDate.caption.split(" ")[1]);
    Page.openEditShiftDialog(item, day1, 0);
};

Page.tuesdayShiftItemClick = function ($event, widget, item, currentItemWidgets) {
    $event.stopPropagation();
    Page.selectedEmployee = Page.Widgets.employeeScheduleList.selecteditem;
    var day2 = getFullDayName(Page.Widgets.lblTuesdayDate.caption.split(" ")[1]);
    Page.openEditShiftDialog(item, day2, 1);
};

Page.wednesdayShiftItemClick = function ($event, widget, item, currentItemWidgets) {
    $event.stopPropagation();
    Page.selectedEmployee = Page.Widgets.employeeScheduleList.selecteditem;
    var day3 = getFullDayName(Page.Widgets.lblWednesdayDate.caption.split(" ")[1]);
    Page.openEditShiftDialog(item, day3, 2);
};

Page.thursdayShiftItemClick = function ($event, widget, item, currentItemWidgets) {
    $event.stopPropagation();
    Page.selectedEmployee = Page.Widgets.employeeScheduleList.selecteditem;
    var day4 = getFullDayName(Page.Widgets.lblThursdayDate.caption.split(" ")[1]);
    Page.openEditShiftDialog(item, day4, 3);
};

Page.fridayShiftItemClick = function ($event, widget, item, currentItemWidgets) {
    $event.stopPropagation();
    Page.selectedEmployee = Page.Widgets.employeeScheduleList.selecteditem;
    var day5 = getFullDayName(Page.Widgets.lblFridayDate.caption.split(" ")[1]);
    Page.openEditShiftDialog(item, day5, 4);
};

Page.saturdayShiftItemClick = function ($event, widget, item, currentItemWidgets) {
    $event.stopPropagation();
    Page.selectedEmployee = Page.Widgets.employeeScheduleList.selecteditem;
    var day6 = getFullDayName(Page.Widgets.lblSaturdayDate.caption.split(" ")[1]);
    Page.openEditShiftDialog(item, day6, 5);
};

Page.sundayShiftItemClick = function ($event, widget, item, currentItemWidgets) {
    $event.stopPropagation();
    Page.selectedEmployee = Page.Widgets.employeeScheduleList.selecteditem;
    var day7 = getFullDayName(Page.Widgets.lblSundayDate.caption.split(" ")[1]);
    Page.openEditShiftDialog(item, day7, 6);
};

/**
 * onSuccess handler for svGetShiftById.
 * Resolves position and category names to IDs, computes paidHours,
 * sets all edit-mode form widgets programmatically, then opens the dialog.
 */
Page.svGetShiftByIdSuccess = function (variable, data) {
    // Resolve position name -> id
    var positionsDataSet = Page.Variables.svGetAllPositionsByCompanyId.dataSet;
    var positionsList = (positionsDataSet && positionsDataSet.positions) ? positionsDataSet.positions : [];
    var positionMatch = positionsList.find(function (p) { return p.name === data.position; });
    var resolvedPositionId = positionMatch ? positionMatch.id : null;

    // Resolve category name -> id
    var categoriesDataSet = Page.Variables.svGetAllCategoriesByCompanyId.dataSet;
    var categoriesList = (categoriesDataSet && categoriesDataSet.categories) ? categoriesDataSet.categories : [];
    var categoryMatch = categoriesList.find(function (c) { return c.name === data.category; });
    var resolvedCategoryId = categoryMatch ? categoryMatch.id : null;

    // Compute paidHours from duration (minutes) -> hours (2 decimal places)
    //var paidHours = data.duration ? Math.round((data.duration / 60) * 100) / 100 : 0;

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
        var checkboxMap = {
            'Monday': 'chkMon',
            'Tuesday': 'chkTue',
            'Wednesday': 'chkWed',
            'Thursday': 'chkThu',
            'Friday': 'chkFri',
            'Saturday': 'chkSat',
            'Sunday': 'chkSun'
        };
        var selectedCheckbox = checkboxMap[Page.selectedDay];
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
    var positionId = Page.Widgets.shiftForm.formWidgets.positionField.datavalue;
    var startTime = Page.Widgets.shiftForm.formWidgets.startTimeField.datavalue;
    var endTime = Page.Widgets.shiftForm.formWidgets.endTimeField.datavalue;
    var description = Page.Widgets.shiftForm.formWidgets.form_field9.datavalue;
    var categoryId = Page.Widgets.shiftForm.formWidgets.categoryField.datavalue;

    if (!positionId) {
        console.error('Position is required');
        App.Actions.appNotification.invoke({
            message: 'Position is required',
            class: 'error'
        });
        return;
    }

    if (!startTime) {
        console.error('Start time is required');
        App.Actions.appNotification.invoke({
            message: 'Start time is required',
            class: 'error'
        });
        return;
    }

    if (!endTime) {
        console.error('End time is required');
        App.Actions.appNotification.invoke({
            message: 'End time is required',
            class: 'error'
        });
        return;
    }

    if (!Page.selectedEmployee || !Page.selectedEmployee.employeeId) {
        console.error('No employee selected');
        App.Actions.appNotification.invoke({
            message: 'No employee selected',
            class: 'error'
        });
        return;
    }

    if (!Page.selectedDay) {
        console.error('No day selected');
        App.Actions.appNotification.invoke({
            message: 'No day selected',
            class: 'error'
        });
        return;
    }

    if (!Page.selectedShiftDate) {
        console.error('No shift date available');
        App.Actions.appNotification.invoke({
            message: 'No shift date selected',
            class: 'error'
        });
        return;
    }
    var startTimeMs;
    var endTimeMs;

    try {
        startTimeMs = Page.parseTimeToMilliseconds(Page.selectedShiftDate, startTime);
        endTimeMs = Page.parseTimeToMilliseconds(Page.selectedShiftDate, endTime);

        console.log('Converted Start Time (ms):', startTimeMs);
        console.log('Converted Start Time (date):', new Date(startTimeMs).toString());
        console.log('Converted End Time (ms):', endTimeMs);
        console.log('Converted End Time (date):', new Date(endTimeMs).toString());
    } catch (error) {
        console.error('Time parsing error:', error.message);
        App.Actions.appNotification.invoke({
            message: 'Invalid time format. Please use formats like "09:00:00 AM", "08:00:00 PM", or "09:00AM"',
            class: 'error'
        });
        return;
    }

    var startMoment = moment(startTimeMs);
    var endMoment = moment(endTimeMs);

    if (endMoment.isSameOrBefore(startMoment)) {
        endMoment.add(1, 'day');
        endTimeMs = endMoment.valueOf();
        console.log('End time adjusted to next day:', new Date(endTimeMs).toString());
    }

    if (endMoment.isSameOrBefore(startMoment)) {
        console.error('End time must be after start time');
        App.Actions.appNotification.invoke({
            message: 'End time must be after start time',
            class: 'error'
        });
        return;
    }

    console.log('Final Start Time:', moment(startTimeMs).format('MMM DD, YYYY hh:mm:ss A'));
    console.log('Final End Time:', moment(endTimeMs).format('MMM DD, YYYY hh:mm:ss A'));
    console.log('================================');

    if (!Page.isAdd) {
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
    } else {
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
    }

    Page.Widgets.shiftDialog.close();
};

Page.parseTimeToMilliseconds = function (dateObj, timeString) {
    if (!dateObj) {
        throw new Error('Date object is required');
    }

    if (!timeString || typeof timeString !== 'string') {
        throw new Error('Invalid time input');
    }

    var trimmedTime = timeString.trim();
    var hours = 0;
    var minutes = 0;
    var seconds = 0;

    var time12HourFormatWithSeconds = /^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM|am|pm)$/i;
    var time12HourFormat = /^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i;
    var time12HourCompact = /^(\d{1,2}):(\d{2})(AM|PM|am|pm)$/i;

    var match;

    if ((match = trimmedTime.match(time12HourFormatWithSeconds))) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        seconds = parseInt(match[3], 10);
        var period = match[4].toUpperCase();

        if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
            throw new Error('Invalid time values');
        }

        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
    } else if ((match = trimmedTime.match(time12HourFormat))) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        var period = match[3].toUpperCase();

        if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
            throw new Error('Invalid time values');
        }

        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
    } else if ((match = trimmedTime.match(time12HourCompact))) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        var period = match[3].toUpperCase();

        if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
            throw new Error('Invalid time values');
        }

        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
    } else {
        throw new Error('Unsupported time format. Use formats like "09:00:00 AM", "08:00:00 PM", or "09:00AM"');
    }

    var baseMoment;
    if (moment.isMoment(dateObj)) {
        baseMoment = dateObj.clone();
    } else {
        baseMoment = moment(dateObj);
    }

    var datetime = baseMoment.startOf('day')
        .hours(hours)
        .minutes(minutes)
        .seconds(seconds)
        .milliseconds(0);

    datetime.add(5, 'hours').add(30, 'minutes');

    return datetime.valueOf();
};

Page.formatDateWithOffset = function (date) {
    const pad = (n) => String(n).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());

    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';

    const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
    const offsetMinutes = pad(Math.abs(offset) % 60);

    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds + ' ' + sign + offsetHours + ':' + offsetMinutes;
};

Page.formatDateTime = function (dateString, timeString) {
    if (!dateString || !timeString) {
        throw new Error('Both date and time parameters are required');
    }

    var trimmedTime = timeString.trim();
    var hours = 0;
    var minutes = 0;

    var time12HourFormat = /^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i;
    var time12HourCompact = /^(\d{1,2}):(\d{2})(AM|PM|am|pm)$/i;

    var match;

    if ((match = trimmedTime.match(time12HourFormat))) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        var period = match[3].toUpperCase();

        if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
            throw new Error('Invalid time values');
        }

        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
    } else if ((match = trimmedTime.match(time12HourCompact))) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        var period = match[3].toUpperCase();

        if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
            throw new Error('Invalid time values');
        }

        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }
    } else {
        throw new Error('Invalid time format. Expected format: "09:30 AM" or "09:30AM"');
    }

    var hoursStr = (hours < 10 ? '0' : '') + hours;
    var minutesStr = (minutes < 10 ? '0' : '') + minutes;

    return dateString + ' ' + hoursStr + ':' + minutesStr + ':00 +05:30';
};

Page.formatDateToIST = function (momentDate) {
    var istDate = momentDate.clone().add(5, 'hours').add(30, 'minutes');
    return istDate.format('YYYY-MM-DD HH:mm:ss') + ' +5:30';
};

Page.calculateTotalHours = function (startTime, endTime) {
    if (!startTime || !endTime) {
        return null;
    }

    var timeFormat = /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM)$/i;

    var startMatch = startTime.trim().match(timeFormat);
    var endMatch = endTime.trim().match(timeFormat);

    if (!startMatch || !endMatch) {
        return null;
    }

    var startHour = parseInt(startMatch[1], 10);
    var startMinute = parseInt(startMatch[2], 10);
    var startPeriod = startMatch[3].toUpperCase();

    var endHour = parseInt(endMatch[1], 10);
    var endMinute = parseInt(endMatch[2], 10);
    var endPeriod = endMatch[3].toUpperCase();

    if (startPeriod === 'PM' && startHour !== 12) {
        startHour += 12;
    } else if (startPeriod === 'AM' && startHour === 12) {
        startHour = 0;
    }

    if (endPeriod === 'PM' && endHour !== 12) {
        endHour += 12;
    } else if (endPeriod === 'AM' && endHour === 12) {
        endHour = 0;
    }

    var startTotalMinutes = startHour * 60 + startMinute;
    var endTotalMinutes = endHour * 60 + endMinute;

    var diffMinutes = endTotalMinutes - startTotalMinutes;

    if (diffMinutes < 0) {
        diffMinutes += 24 * 60;
    }

    var totalHours = diffMinutes / 60;

    return Math.round(totalHours * 100) / 100;
};

Page.startTimeFieldChange = function ($event, widget, newVal, oldVal) {
    var startTime = newVal;
    var endTime = Page.Widgets.endTimeField.datavalue;

    if (startTime && endTime) {
        var calculatedHours = Page.calculateTotalHours(startTime, endTime);
        if (calculatedHours !== null) {
            Page.Widgets.paidHoursField.datavalue = calculatedHours;
        }
    }
};

Page.endTimeFieldChange = function ($event, widget, newVal, oldVal) {
    var startTime = Page.Widgets.startTimeField.datavalue;
    var endTime = newVal;

    if (startTime && endTime) {
        var calculatedHours = Page.calculateTotalHours(startTime, endTime);
        if (calculatedHours !== null) {
            Page.Widgets.paidHoursField.datavalue = calculatedHours;
        }
    }
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
    var indexMap = {
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
    var dayIndex = Page._dayDateKey(dayKey); // returns 0-6
    if (dayIndex === -1) {
        console.warn('_resolveShiftDateISO: unknown dayKey "' + dayKey + '"');
        return moment().format('YYYY-MM-DD');
    }
    var startDate = Page.Widgets.Weekview1.startdate;
    if (!startDate) {
        // Fallback: read date directly from first employee weeklyShifts slot in dataset
        var dataset = Page.Variables.svScheduleList.dataSet;
        if (dataset && dataset.length > 0) {
            var emp = dataset[0];
            if (emp.weeklyShifts && emp.weeklyShifts[dayIndex] && emp.weeklyShifts[dayIndex].date) {
                return moment(emp.weeklyShifts[dayIndex].date).format('YYYY-MM-DD');
            }
        }
        console.warn('_resolveShiftDateISO: Weekview1.startdate is empty and no fallback found');
        return moment().format('YYYY-MM-DD');
    }
    return moment(startDate).add(dayIndex, 'days').format('YYYY-MM-DD');
};

/**
 * Looks up positionId from positionsListVar by matching shiftName against
 * the position name field (tries p.title, p.code, p.name).
 */
Page._resolvePositionId = function (shiftName) {
    var positions = Page.Variables.positionsListVar.dataSet;
    var match = _.find(positions, function (p) {
        return p.title === shiftName || p.code === shiftName || p.name === shiftName;
    });
    return match ? match.id : null;
};

/**
 * Core drop handler -- shared by all 7 day-specific drop handlers.
 *
 * On a drag-and-drop move, the shift is updated at the backend using svUpdateShift
 * (changing its employeeId and date to the target cell values). This replaces the
 * former raw $.ajax call to the DataService insertShiftWithPosition query endpoint.
 *
 * Optimistic UI: the dataset is mutated in-place using the weeklyShifts[N].shifts
 * array structure that svScheduleList.dataSet returns, then setData is called with
 * a .slice() copy to trigger WaveMaker binding reactivity.
 *
 * After a successful svUpdateShift response the grid is refreshed via svScheduleList.
 * On error the grid is also refreshed via svScheduleList to restore a consistent state.
 *
 * Guards $event.currentTarget against null (WaveMaker async event wrapper).
 */
Page._handleShiftDrop = function ($event, item, targetDayName) {
    Page.isFromDraggable = true;
    $event.preventDefault();
    $event.stopPropagation();

    // Guard: currentTarget can be null in WaveMaker async event wrapper
    var el = $event.currentTarget || $event.target;
    if (el) {
        var cell = el.closest ? el.closest('.weekday-container') : el;
        if (cell && cell.classList) {
            cell.classList.remove('drag-over-highlight');
        }
    }

    if (!Page.dragState) { return; }

    var sourceEmpIndex = Page.dragState.employeeIndex;
    var sourceDayName = Page.dragState.dayName;
    var dataset = Page.Variables.svScheduleList.dataSet;

    var targetEmpIndex = _.findIndex(dataset, { employeeId: item.employeeId });
    if (targetEmpIndex === -1) { Page.dragState = null; return; }

    // Skip same-cell drop
    if (sourceEmpIndex === targetEmpIndex && sourceDayName === targetDayName) {
        Page.dragState = null;
        return;
    }

    // Derive numeric day indices from 'day0'-'day6' keys
    var sourceDayIndex = Page._dayDateKey(sourceDayName); // 0-6
    var targetDayIndex = Page._dayDateKey(targetDayName); // 0-6

    // Sub-task 1.4: Read source shift from weeklyShifts[N].shifts using the correct path.
    // Prefer the exact shift object captured at dragstart; fall back to first shift in the
    // source day's shifts array for backward compatibility.
    var sourceShiftsArray = (dataset[sourceEmpIndex] &&
        dataset[sourceEmpIndex].weeklyShifts &&
        dataset[sourceEmpIndex].weeklyShifts[sourceDayIndex] &&
        dataset[sourceEmpIndex].weeklyShifts[sourceDayIndex].shifts) || [];

    var sourceRaw = Page.dragState.shiftData ||
        (sourceShiftsArray.length > 0 ? sourceShiftsArray[0] : null);

    if (!sourceRaw || !sourceRaw.shiftId) {
        console.warn('Drag-drop aborted: no valid shift at source cell "' + sourceDayName + '"');
        Page.dragState = null;
        return;
    }

    // Sub-task 1.4: Read target shifts array using weeklyShifts[N].shifts path.
    var targetShiftsArray = (dataset[targetEmpIndex] &&
        dataset[targetEmpIndex].weeklyShifts &&
        dataset[targetEmpIndex].weeklyShifts[targetDayIndex] &&
        dataset[targetEmpIndex].weeklyShifts[targetDayIndex].shifts) || [];

    // Safe deep clone of source shift
    var sourceShift = JSON.parse(JSON.stringify(sourceRaw));

    // Resolve common API params
    var targetEmployeeId = dataset[targetEmpIndex].employeeId;
    var targetShiftDate = Page._resolveShiftDateISO(targetDayName);
    var draggedShiftId = sourceShift.shiftId;

    var emptyShift = {
        shiftType: '', timeRange: '', shiftName: '', startAt: '',
        endAt: '', shiftDate: '', notes: '', shiftId: '', positionId: ''
    };

    // Determine whether the target cell is empty (no existing shifts)
    var isTargetEmpty = targetShiftsArray.length === 0;

    // ------------------------------------------------------------------
    // Sub-task 1.4: Optimistic UI update using weeklyShifts[N].shifts paths
    // ------------------------------------------------------------------

    // Remove dragged shift from source day's shifts array
    var updatedSourceShifts = sourceShiftsArray.filter(function (s) {
        return s.shiftId !== draggedShiftId;
    });
    dataset[sourceEmpIndex].weeklyShifts[sourceDayIndex].shifts = updatedSourceShifts.slice();

    // Append dragged shift to target day's shifts array
    var updatedTargetShifts = targetShiftsArray.slice();
    updatedTargetShifts.push(sourceShift);
    dataset[targetEmpIndex].weeklyShifts[targetDayIndex].shifts = updatedTargetShifts.slice();

    // Sub-task 1.5: Persist optimistic UI update via svScheduleList.setData (not transformedScheduleVar)
    Page.Variables.svScheduleList.setData(dataset.slice());

    // ------------------------------------------------------------------
    // Sub-task 1.1: Resolve position ID from svGetAllPositionsByCompanyId
    // Match sourceShift.shiftName (position label) against positions[].name
    // ------------------------------------------------------------------
    var positionsDataSet = Page.Variables.svGetAllPositionsByCompanyId.dataSet;
    var positionsList = (positionsDataSet && positionsDataSet.positions) ? positionsDataSet.positions : [];
    var positionMatch = _.find(positionsList, function (p) {
        return p.name === sourceShift.shiftName;
    });
    var resolvedPositionId = positionMatch ? positionMatch.id : (sourceShift.positionId || null);

    // ------------------------------------------------------------------
    // Sub-task 1.2: Resolve category ID from svGetAllCategoriesByCompanyId
    // Match sourceShift.category (category name string) against categories[].name
    // ------------------------------------------------------------------
    var categoriesDataSet = Page.Variables.svGetAllCategoriesByCompanyId.dataSet;
    var categoriesList = (categoriesDataSet && categoriesDataSet.categories) ? categoriesDataSet.categories : [];
    var categoryMatch = _.find(categoriesList, function (c) {
        return c.name === sourceShift.category;
    });
    var resolvedCategoryId = categoryMatch ? categoryMatch.id : null;

    // ------------------------------------------------------------------
    // Sub-task 1.3: Use svUpdateShift with resolved integer IDs for
    // position and category instead of raw string/positionId values.
    // ------------------------------------------------------------------
    Page.Variables.svUpdateShift.setInput({
        shiftId: draggedShiftId,
        RequestBody: {
            employeeId: targetEmployeeId,
            companyId: 1,
            date: targetShiftDate,
            description: sourceShift.notes || '',
            startTime: sourceShift.startAt || '',
            endTime: sourceShift.endAt || '',
            position: resolvedPositionId,
            category: resolvedCategoryId,
            color: sourceShift.color || 'amber'
        }
    });
    Page.Variables.svUpdateShift.invoke(
        {},
        function (data) {
            // Sub-task 1.6: Refresh via svScheduleList on success
            Page.Variables.svScheduleList.invoke();
        },
        function (error) {
            console.error('Drag-drop shift update failed:', error);
            // Sub-task 1.6: Refresh via svScheduleList on error to restore consistent state
            Page.Variables.svScheduleList.invoke();
        }
    );

    Page.dragState = null;
};

/* -------------------------------------------------
   DRAG-AND-DROP: Delete source shift after move
   ------------------------------------------------- */

/**
 * Sub-task 1.2: Uses svDeleteShiftById (correct REST variable) instead of the
 * old svDeleteShifts DataService variable to delete the original shift from the
 * source cell after a successful drag-and-drop move.
 * Sub-task 1.6: All refresh calls use svScheduleList.invoke().
 *
 * @param {number|string} shiftId - the shiftId of the dragged (source) shift
 */
Page._deleteSourceShift = function (shiftId) {
    if (!shiftId) {
        console.warn('_deleteSourceShift: no shiftId provided, skipping delete.');
        // Sub-task 1.6: Refresh via svScheduleList
        Page.Variables.svScheduleList.invoke();
        return;
    }
    // Sub-task 1.2: Replace svDeleteShifts with svDeleteShiftById
    Page.Variables.svDeleteShiftById.setInput({ id: shiftId });
    Page.Variables.svDeleteShiftById.invoke(
        {},
        function (data) {
            // Sub-task 1.6: Refresh via svScheduleList on success
            Page.Variables.svScheduleList.invoke();
        },
        function (error) {
            console.error('Failed to delete source shift (id=' + shiftId + '):', error);
            // Sub-task 1.6: Refresh via svScheduleList on error
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
    var el = $event.currentTarget || $event.target;
    if (el && el.classList) {
        // Walk up to find the actual shift cell container if drop landed on a child
        var cell = el.closest ? el.closest('.weekday-container') : el;
        if (cell && cell.classList) {
            cell.classList.add('drag-over-highlight');
        }
    }
};

Page.shiftCellDragLeave = function ($event, widget, item, currentItemWidgets) {
    var el = $event.currentTarget || $event.target;
    if (el && el.classList) {
        var cell = el.closest ? el.closest('.weekday-container') : el;
        if (cell && cell.classList) {
            cell.classList.remove('drag-over-highlight');
        }
    }
};

/* -------------------------------------------------
   DRAG-AND-DROP: DragStart handlers (inner shift item, one per day)
   The inner shift item container is draggable so that item in the handler
   context is the individual shift object (not the employee row), allowing
   the exact dragged shift to be captured even in multi-shift cells.
   ------------------------------------------------- */

/**
 * Common inner-item dragstart logic.
 * Sub-task 1.3: Employee lookup now uses emp.weeklyShifts[numericIndex].shifts
 * to correctly traverse the svScheduleList data structure.
 *
 * @param {Event}  $event          - the native dragstart event
 * @param {Object} item            - the individual shift object from the inner list context
 * @param {string} dayKey          - 'day0' through 'day6'
 * @param {number} dayNumericIndex - numeric day index 0-6 matching weeklyShifts array position
 */
Page._innerShiftItemDragStart = function ($event, item, dayKey, dayNumericIndex) {
    // Stop propagation so the outer shift cell container does not also fire dragstart
    $event.stopPropagation();

    var dataset = Page.Variables.svScheduleList.dataSet;

    // Sub-task 1.3: Find the employee row that owns this exact shift by searching
    // emp.weeklyShifts[dayNumericIndex].shifts -- the correct path in svScheduleList data.
    var empIndex = -1;
    _.forEach(dataset, function (emp, idx) {
        var shiftsForDay = emp.weeklyShifts &&
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
    // Close dialog only if it is currently open (avoids error during drag-drop)
    try {
        if (Page.Widgets.shiftDialog && Page.Widgets.shiftDialog.isOpen) {
            Page.Widgets.shiftDialog.close();
        }
    } catch (e) { /* dialog not open -- safe to ignore */ }
    // Sub-task 1.6: Refresh via svScheduleList (was scheduleQueryVar)
    Page.Variables.svScheduleList.invoke();
};

Page.svFindEmployeePositionsonSuccess = function (variable, data) {
    var hasRecord = data && data.content && data.content.length > 0;

    if (Page.isAdd) {
        // isAdd = true path: creating a new shift
        if (hasRecord) {
            // Employee-position record exists -- proceed directly with shift insert
            Page.Variables.insertShiftWithPositionVar.setInput({
                InsertShiftWithPositionRequest: Page._pendingShiftInputs
            });
            Page.Variables.insertShiftWithPositionVar.invoke();
        } else {
            // No employee-position record -- create one first, then insert the shift
            var today = moment();
            Page.Variables.svCreatEmployeePositions.setInput({
                EmployeePositions: {
                    tenantId: Page._pendingShiftInputs.tenantId,
                    employeeId: Page._pendingShiftInputs.employeeId,
                    positionId: Page._pendingShiftInputs.positionId,
                    effectiveFrom: today.format('YYYY-MM-DD'),
                    effectiveTo: today.clone().add(1, 'year').format('YYYY-MM-DD'),
                    createdAt: today.valueOf(),
                    updatedAt: today.valueOf()
                }
            });
            Page.Variables.svCreatEmployeePositions.invoke();
        }
    } else {
        // isAdd = false path: updating an existing shift
        if (hasRecord) {
            // Employee-position record exists -- proceed directly with shift update
            Page.Variables.svUpdateShiftDetails.invoke();
        } else {
            // No employee-position record -- create one first, then update the shift
            var today = moment();
            Page.Variables.svCreatEmployeePositions.setInput({
                EmployeePositions: {
                    tenantId: 1,
                    employeeId: Page.selectedEmployee.employeeId,
                    positionId: Page.Widgets.shiftForm.formWidgets.positionField.datavalue,
                    effectiveFrom: today.format('YYYY-MM-DD'),
                    effectiveTo: today.clone().add(1, 'year').format('YYYY-MM-DD'),
                    createdAt: today.valueOf(),
                    updatedAt: today.valueOf()
                }
            });
            Page.Variables.svCreatEmployeePositions.invoke();
        }
    }
};

Page.svCreatEmployeePositionsonSuccess = function (variable, data) {
    if (Page.isAdd) {
        // Employee-position record created -- now proceed with shift insert
        Page.Variables.insertShiftWithPositionVar.setInput({
            InsertShiftWithPositionRequest: Page._pendingShiftInputs
        });
        Page.Variables.insertShiftWithPositionVar.invoke();
    } else {
        // Employee-position record created -- now proceed with shift update
        Page.Variables.svUpdateShiftDetails.invoke();
    }
};


Page.insertShiftWithPositionVaronBeforeUpdate = function (variable, inputData) {
    // When invoked from drag-drop, override all fields with the stored payload
    if (Page._dragDropInsertPayload) {
        inputData.insertShiftWithPositionRequest = Page._dragDropInsertPayload;
    }
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

Page.svDeleteShiftsonSuccess = function (variable, data) {
    if (!Page.isFromDraggable) {
        Page.isFromDraggable = false;
        // Sub-task 1.6: Refresh via svScheduleList (was scheduleQueryVar)
        Page.Variables.svScheduleList.invoke();
    }
};

function formatToStandardTime(input) {
    if (!input) return null;

    // Normalize input (remove spaces, uppercase)
    input = input.trim().toUpperCase().replace(/\s+/g, '');

    // Match formats like:
    // 9AM, 09AM, 9:00AM, 09:00AM
    const match = input.match(/^(\d{1,2})(?::?(\d{2}))?(AM|PM)$/);

    if (!match) return null; // invalid format

    let hours = parseInt(match[1], 10);
    let minutes = match[2] ? match[2] : '00';
    let period = match[3];

    // Validate hours and minutes
    if (hours < 1 || hours > 12) return null;
    if (parseInt(minutes) > 59) return null;

    // Format to 2-digit
    let formattedHours = hours.toString().padStart(2, '0');

    return `${formattedHours}:${minutes}${period}`;
}
