/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    // Guard: only invoke API if the user session is authenticated
    if (!App.Variables.loggedInUser.dataSet.authenticated) {
        return;
    }
    Page.applyStartDay();
    Page.calendarDaySlots = [];
    Page.invokeCalendarVariable();
};

Page.invokeCalendarVariable = function () {
    // Always sync startDate/endDate from activeMonthDate before invoking
    var monthDateStr = (Page.Variables.activeMonthDate &&
        Page.Variables.activeMonthDate.dataSet &&
        Page.Variables.activeMonthDate.dataSet.dataValue) || '';
    if (monthDateStr) {
        var range = Page.getMonthDateRange(monthDateStr);
        // Update the model variable — service variables pick up dates via dataBinding
        Page.Variables.vmCalendarDateRange.dataSet.dataValue.startDate = range.startDate;
        Page.Variables.vmCalendarDateRange.dataSet.dataValue.endDate = range.endDate;
        // Also keep setInput calls for runtime safety (ensures inputs are set before invoke)
        Page.Variables.svcalendarPositionView.setInput('startDate', range.startDate);
        Page.Variables.svcalendarPositionView.setInput('endDate', range.endDate);
        Page.Variables.svcalendarCategoryView.setInput('startDate', range.startDate);
        Page.Variables.svcalendarCategoryView.setInput('endDate', range.endDate);
        Page.Variables.svCalendarShortCategoryView.setInput('startDate', range.startDate);
        Page.Variables.svCalendarShortCategoryView.setInput('endDate', range.endDate);
        Page.Variables.svCalendarShiftTimingView.setInput('startDate', range.startDate);
        Page.Variables.svCalendarShiftTimingView.setInput('endDate', range.endDate);
    }

    const selectedGrouping = App.Variables.appSelectedGrouping.dataSet.grouping;
    if (selectedGrouping === 'position_shift_timings') {
        Page.Variables.svcalendarPositionView.invoke();
    } else if (selectedGrouping === 'category_shift_timings') {
        Page.Variables.svcalendarCategoryView.invoke();
    } else if (selectedGrouping === 'cat_shift_timings') {
        Page.Variables.svCalendarShortCategoryView.invoke();
    } else {
        Page.Variables.svCalendarShiftTimingView.invoke();
    }
};

// --- onSuccess handlers (one per service variable) ---

Page.svcalendarPositionViewonSuccess = function (variable, data) {
    const resolvedData = (variable.dataSet && variable.dataSet.dates) ? variable.dataSet : data;
    Page.calendarDaySlots = Page.buildCalendarDaySlots(resolvedData);
};

Page.svcalendarCategoryViewonSuccess = function (variable, data) {
    const resolvedData = (variable.dataSet && variable.dataSet.dates) ? variable.dataSet : data;
    Page.calendarDaySlots = Page.buildCalendarDaySlots(resolvedData);
};

Page.svCalendarShortCategoryViewonSuccess = function (variable, data) {
    const resolvedData = (variable.dataSet && variable.dataSet.dates) ? variable.dataSet : data;
    Page.calendarDaySlots = Page.buildCalendarDaySlots(resolvedData);
};

Page.svCalendarShiftTimingViewonSuccess = function (variable, data) {
    const resolvedData = (variable.dataSet && variable.dataSet.dates) ? variable.dataSet : data;
    Page.calendarDaySlots = Page.buildCalendarDaySlotsShiftTiming(resolvedData);
};

// --- Helper: format employee name according to the selected name format ---
Page.formatEmployeeName = function (firstName, lastName, fallback, format) {
    const fn = (firstName || '').trim();
    const ln = (lastName || '').trim();
    if (!fn && !ln) { return (fallback || '').trim(); }
    switch (format) {
        case 'First, last': return fn + (ln ? ', ' + ln : '');
        case 'First L.': return fn + (ln ? ' ' + ln.charAt(0) + '.' : '');
        case 'F. last': return (fn ? fn.charAt(0) + '. ' : '') + ln;
        case 'last, F.': return ln + (fn ? ', ' + fn.charAt(0) + '.' : '');
        case 'First Last':
        default: return (fn + (ln ? ' ' + ln : '')).trim();
    }
};

// --- Helper: rotate day-header labels based on the configured start day ---
Page.applyStartDay = function () {
    const startOn = (App.Variables.appSelectedGrouping && App.Variables.appSelectedGrouping.dataSet.startOn) || 'Sunday';
    const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const lblWidgets = ['lblHdrSun', 'lblHdrMon', 'lblHdrTue', 'lblHdrWed', 'lblHdrThu', 'lblHdrFri', 'lblHdrSat'];
    let startIndex = allDays.indexOf(startOn);
    if (startIndex < 0) { startIndex = 0; }
    for (let col = 0; col < 7; col++) {
        const dayIndex = (startIndex + col) % 7;
        Page.Widgets[lblWidgets[col]].caption = allDays[dayIndex];
    }
};

// --- Helper: derive startDate (YYYY-MM-01) and endDate (YYYY-MM-DD last day) from "YYYY-MM-01" string ---
// FIX: Parse date parts manually to avoid UTC vs local-time timezone offset bugs.
// Previously used new Date(dateStr) which parses ISO date-only strings as UTC midnight,
// causing getMonth() to return the wrong month in non-UTC timezones.
Page.getMonthDateRange = function (dateStr) {
    // Parse YYYY-MM-DD parts directly — avoids UTC/local timezone shift from new Date(string)
    var parts = dateStr.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1; // convert 1-based month string to 0-based JS month index
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var startDate = year + '-' + pad(month + 1) + '-01';
    var lastDay = new Date(year, month + 1, 0).getDate();
    var endDate = year + '-' + pad(month + 1) + '-' + pad(lastDay);
    return { startDate: startDate, endDate: endDate };
};

// --- Called by monthlyView partial whenever the user selects a new month ---
// Receives year and month where month is 0-based (JS convention: 0=Jan, 11=Dec).
Page.syncCalendarToMonth = function (year, month) {
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    // month is 0-based — add 1 only for the date string representation
    var startDate = year + '-' + pad(month + 1) + '-01';
    var lastDay = new Date(year, month + 1, 0).getDate();
    var endDate = year + '-' + pad(month + 1) + '-' + pad(lastDay);

    // Update the model variable — single source of truth for date range bindings
    Page.Variables.vmCalendarDateRange.dataSet.dataValue.startDate = startDate;
    Page.Variables.vmCalendarDateRange.dataSet.dataValue.endDate = endDate;

    // Also keep setInput calls for runtime safety (ensures inputs are set before invoke)
    Page.Variables.svcalendarPositionView.setInput('startDate', startDate);
    Page.Variables.svcalendarPositionView.setInput('endDate', endDate);

    Page.Variables.svcalendarCategoryView.setInput('startDate', startDate);
    Page.Variables.svcalendarCategoryView.setInput('endDate', endDate);

    Page.Variables.svCalendarShortCategoryView.setInput('startDate', startDate);
    Page.Variables.svCalendarShortCategoryView.setInput('endDate', endDate);

    Page.Variables.svCalendarShiftTimingView.setInput('startDate', startDate);
    Page.Variables.svCalendarShiftTimingView.setInput('endDate', endDate);

    // Invoke only the active grouping variable.
    // NOTE: Do NOT call invokeCalendarVariable() here — that helper re-reads activeMonthDate
    // and calls getMonthDateRange() which would redundantly override the inputs just set above.
    // Instead invoke directly so the correct startDate/endDate set above are used.
    const selectedGrouping = App.Variables.appSelectedGrouping.dataSet.grouping;
    if (selectedGrouping === 'position_shift_timings') {
        Page.Variables.svcalendarPositionView.invoke();
    } else if (selectedGrouping === 'category_shift_timings') {
        Page.Variables.svcalendarCategoryView.invoke();
    } else if (selectedGrouping === 'cat_shift_timings') {
        Page.Variables.svCalendarShortCategoryView.invoke();
    } else {
        Page.Variables.svCalendarShiftTimingView.invoke();
    }
};

// --- Slot Builder: Position / Category / Cat views (nested shiftGroups.shiftGroups) ---
Page.buildCalendarDaySlots = function (data) {
    const moment = App.importModule('moment');
    const hideGroupsNoShifts = App.Variables.appSelectedGrouping.dataSet.hideGroupsNoShifts === true;

    let datesArr = [];
    if (data && Array.isArray(data.dates)) {
        datesArr = data.dates;
    } else if (Array.isArray(data)) {
        datesArr = data;
    }

    if (!datesArr || datesArr.length === 0) { return []; }

    const anchorDateStr = datesArr[0].date;

    const dateMap = {};
    datesArr.forEach(function (dateEntry) {
        const dateKey = dateEntry.date;
        if (!dateKey) { return; }

        const positions = [];
        const rawPositions = dateEntry.shiftGroups || [];

        rawPositions.forEach(function (posGroup) {
            const posName = posGroup.label || '';
            const timeSlots = posGroup.shiftGroups || [];
            const showCatPos = App.Variables.appSelectedGrouping.dataSet.showCatPos === true;
            const nameFormat = (App.Variables.appSelectedGrouping && App.Variables.appSelectedGrouping.dataSet.nameFormat) || 'First Last';

            // Build timeGroups: one entry per time slot, each with its own employees array
            const timeGroups = [];
            let hasRealShifts = false;

            if (timeSlots.length === 0) {
                // No inner time slots — show a single "(No Shifts)" time group
                timeGroups.push({
                    timeRange: '',
                    employees: [{
                        employeeName: '(No Shifts)',
                        categoryName: '',
                        iconClass: '',
                        color: '',
                        description: '',
                        isNoShifts: true
                    }]
                });
            } else {
                timeSlots.forEach(function (timeSlot) {
                    const timeRange = timeSlot.label || '';
                    const shifts = timeSlot.shifts || [];
                    const employees = [];

                    if (shifts.length === 0) {
                        employees.push({
                            employeeName: '(No Shifts)',
                            categoryName: '',
                            iconClass: '',
                            color: '',
                            description: '',
                            isNoShifts: true
                        });
                    } else {
                        shifts.forEach(function (shift) {
                            const empName = Page.formatEmployeeName(shift.firstName, shift.lastName, shift.employeeName, nameFormat);
                            const color = shift.color || '';
                            const iconCls = color ? 'wi wi-circle' : 'wi wi-diamond';
                            employees.push({
                                employeeName: empName || '(No Shifts)',
                                categoryName: (showCatPos && empName && shift.category) ? shift.category : '',
                                iconClass: empName ? iconCls : '',
                                color: color,
                                description: shift.description || '',
                                isNoShifts: !empName
                            });
                            if (empName) { hasRealShifts = true; }
                        });
                    }

                    timeGroups.push({ timeRange: timeRange, employees: employees });
                });
            }

            // If hideGroupsNoShifts is enabled, skip positions where all employees are "(No Shifts)"
            if (hideGroupsNoShifts && !hasRealShifts) {
                return;
            }

            positions.push({
                positionName: posName,
                showHeader: true,
                timeGroups: timeGroups
            });
        });

        dateMap[dateKey] = { positions: positions };
    });

    // Build month calendar grid
    let startDateStr;
    if (anchorDateStr && moment(anchorDateStr, 'YYYY-MM-DD', true).isValid()) {
        startDateStr = anchorDateStr.substring(0, 10);
    } else {
        const sortedKeys = Object.keys(dateMap).sort();
        if (sortedKeys.length === 0) { return []; }
        const monthCount = {};
        sortedKeys.forEach(function (k) {
            const mo = k.substring(0, 7);
            monthCount[mo] = (monthCount[mo] || 0) + 1;
        });
        const dominantMonth = Object.keys(monthCount).sort(function (a, b) {
            return monthCount[b] - monthCount[a];
        })[0];
        startDateStr = dominantMonth + '-01';
    }

    const monthStart = moment(startDateStr, 'YYYY-MM-DD').startOf('month');
    const totalDays = moment(startDateStr, 'YYYY-MM-DD').endOf('month').date();
    const firstDayOfWeek = monthStart.day(); // 0=Sun, 1=Mon, ..., 6=Sat
    const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const startOn = (App.Variables.appSelectedGrouping && App.Variables.appSelectedGrouping.dataSet.startOn) || 'Sunday';
    const startIndex = Math.max(0, allDays.indexOf(startOn));
    const offset = (firstDayOfWeek - startIndex + 7) % 7;

    const slots = [];

    // LEADING EMPTY CELLS — pad before day 1
    for (let i = 0; i < offset; i++) {
        slots.push({ hasDate: false, dayNum: '', dateStr: '', positions: [] });
    }
    for (let d = 1; d <= totalDays; d++) {
        const dateStr = monthStart.clone().date(d).format('YYYY-MM-DD');
        const dayData = dateMap[dateStr];
        slots.push({
            hasDate: true,
            dayNum: d,
            dateStr: dateStr,
            positions: dayData ? dayData.positions : []
        });
    }

    const remainder = slots.length % 7;
    if (remainder !== 0) {
        const trailing = 7 - remainder;
        for (let i = 0; i < trailing; i++) {
            slots.push({ hasDate: false, dayNum: '', dateStr: '', positions: [] });
        }
    }
    return slots;
};

// --- Slot Builder: Shift Timing view (flat shiftGroups, no nesting) ---
Page.buildCalendarDaySlotsShiftTiming = function (data) {
    const moment = App.importModule('moment');
    const hideGroupsNoShifts = App.Variables.appSelectedGrouping.dataSet.hideGroupsNoShifts === true;

    let datesArr = [];
    if (data && Array.isArray(data.dates)) {
        datesArr = data.dates;
    } else if (Array.isArray(data)) {
        datesArr = data;
    }

    if (!datesArr || datesArr.length === 0) { return []; }

    const anchorDateStr = datesArr[0].date;

    const dateMap = {};
    datesArr.forEach(function (dateEntry) {
        const dateKey = dateEntry.date;
        if (!dateKey) { return; }

        const positions = [];
        const shiftGroups = dateEntry.shiftGroups || [];

        shiftGroups.forEach(function (group) {
            const label = group.label || '';
            const shifts = group.shifts || [];
            const employees = [];

            if (shifts.length === 0) {
                employees.push({
                    employeeName: '(No Shifts)',
                    categoryName: '',
                    iconClass: '',
                    color: '',
                    description: '',
                    isNoShifts: true
                });
            } else {
                const showCatPos = App.Variables.appSelectedGrouping.dataSet.showCatPos === true;
                const nameFormat = (App.Variables.appSelectedGrouping && App.Variables.appSelectedGrouping.dataSet.nameFormat) || 'First Last';
                shifts.forEach(function (shift) {
                    const empName = Page.formatEmployeeName(shift.firstName, shift.lastName, shift.employeeName, nameFormat);
                    const color = shift.color || '';
                    const iconCls = color ? 'wi wi-circle' : 'wi wi-diamond';
                    if (empName) {
                        employees.push({
                            employeeName: empName,
                            categoryName: (showCatPos && shift.category) ? shift.category : '',
                            iconClass: iconCls,
                            color: color,
                            description: shift.description || '',
                            isNoShifts: false
                        });
                    }
                });

                if (employees.length === 0) {
                    employees.push({
                        employeeName: '(No Shifts)',
                        categoryName: '',
                        iconClass: '',
                        color: '',
                        description: '',
                        isNoShifts: true
                    });
                }
            }

            const hasRealShifts = employees.some(function (e) { return !e.isNoShifts; });
            if (hideGroupsNoShifts && !hasRealShifts) {
                return;
            }

            if (label || employees.length > 0) {
                // Each shift-timing group becomes one position with one timeGroup entry
                positions.push({
                    positionName: label,
                    showHeader: false,
                    timeGroups: [{
                        timeRange: label,
                        employees: employees
                    }]
                });
            }
        });

        dateMap[dateKey] = { positions: positions };
    });

    let startDateStr;
    if (anchorDateStr && moment(anchorDateStr, 'YYYY-MM-DD', true).isValid()) {
        startDateStr = anchorDateStr.substring(0, 10);
    } else {
        const sortedKeys = Object.keys(dateMap).sort();
        if (sortedKeys.length === 0) { return []; }
        const monthCount = {};
        sortedKeys.forEach(function (k) {
            const mo = k.substring(0, 7);
            monthCount[mo] = (monthCount[mo] || 0) + 1;
        });
        const dominantMonth = Object.keys(monthCount).sort(function (a, b) {
            return monthCount[b] - monthCount[a];
        })[0];
        startDateStr = dominantMonth + '-01';
    }

    const monthStart = moment(startDateStr, 'YYYY-MM-DD').startOf('month');
    const totalDays = moment(startDateStr, 'YYYY-MM-DD').endOf('month').date();
    const firstDayOfWeek = monthStart.day(); // 0=Sun, 1=Mon, ..., 6=Sat
    const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const startOn = (App.Variables.appSelectedGrouping && App.Variables.appSelectedGrouping.dataSet.startOn) || 'Sunday';
    const startIndex = Math.max(0, allDays.indexOf(startOn));
    const offset = (firstDayOfWeek - startIndex + 7) % 7;

    const slots = [];

    // LEADING EMPTY CELLS — pad before day 1
    for (let i = 0; i < offset; i++) {
        slots.push({ hasDate: false, dayNum: '', dateStr: '', positions: [] });
    }
    for (let d = 1; d <= totalDays; d++) {
        const dateStr = monthStart.clone().date(d).format('YYYY-MM-DD');
        const dayData = dateMap[dateStr];
        slots.push({
            hasDate: true,
            dayNum: d,
            dateStr: dateStr,
            positions: dayData ? dayData.positions : []
        });
    }

    const remainder = slots.length % 7;
    if (remainder !== 0) {
        const trailing = 7 - remainder;
        for (let i = 0; i < trailing; i++) {
            slots.push({ hasDate: false, dayNum: '', dateStr: '', positions: [] });
        }
    }
    return slots;
};

Page.anchor2Click = function ($event, widget) {
    App.redirectTo('mgrschedulecfgmonth');
};
