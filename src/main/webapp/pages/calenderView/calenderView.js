let calendarChannel;
/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

// Store last raw API data for re-filtering without a new API call
Page._lastRawData = null;
Page._lastBuilderType = null; // 'nested' | 'flat'
Page.activeFilters = { categoryIds: null, positionIds: null };

/* perform any action on widgets/variables within this block */
Page.onReady = function () {

    // -------------------------------
    // ✅ BroadcastChannel Setup
    // -------------------------------
    if ('BroadcastChannel' in window) {
        calendarChannel = new BroadcastChannel('calendar_channel');

        calendarChannel.onmessage = function (event) {
            const msg = event.data || {};
            console.log('RECEIVED:', msg);

            // ✅ CONFIG UPDATE FROM CHILD WINDOW
            if (msg.type === 'GROUPING_UPDATED') {

                console.log('Applying new grouping config');

                // update app variable
                App.Variables.appSelectedGrouping.setData(msg.data);

                // 🔥 IMPORTANT: re-render exactly like initial load
                Page.applyStartDay();
                Page.calendarDaySlots = [];
                // setTimeout(() => {
                //     console.log("Runs after 1 second");
                //     Page.invokeCalendarVariable();
                // }, 1000);
                debugger
                Page.invokeCalendarVariable();
            }
        };
    }

    // -------------------------------
    // ORIGINAL LOGIC (UNCHANGED)
    // -------------------------------
    debugger
    if (!App.Variables.loggedInUser.dataSet.authenticated) {
        return;
    }
    Page.applyStartDay();
    Page.calendarDaySlots = [];
    Page.invokeCalendarVariable();
};

Page.invokeCalendarVariable = function (year, month) {
    let startDate, endDate;
    // ----------------------------------
    // CASE 1: Called with year/month
    // ----------------------------------
    if (year !== undefined && month !== undefined) {
        const pad = function (n) { return n < 10 ? '0' + n : '' + n; };

        startDate = year + '-' + pad(month + 1) + '-01';
        const lastDay = new Date(year, month + 1, 0).getDate();
        endDate = year + '-' + pad(month + 1) + '-' + pad(lastDay);
    }

    // ----------------------------------
    // CASE 2: Use activeMonthDate
    // ----------------------------------
    else {
        const monthDateStr = (Page.Variables.activeMonthDate &&
            Page.Variables.activeMonthDate.dataSet &&
            Page.Variables.activeMonthDate.dataSet.dataValue) || '';

        if (!monthDateStr) return;

        const range = Page.getMonthDateRange(monthDateStr);
        startDate = range.startDate;
        endDate = range.endDate;
    }

    // ----------------------------------
    // SET DATE RANGE
    // ----------------------------------
    Page.Variables.vmCalendarDateRange.dataSet.dataValue.startDate = startDate;
    Page.Variables.vmCalendarDateRange.dataSet.dataValue.endDate = endDate;

    // ----------------------------------
    // SET INPUTS (explicit)
    // ----------------------------------
    Page.Variables.svcalendarPositionView.setInput('startDate', startDate);
    Page.Variables.svcalendarPositionView.setInput('endDate', endDate);

    Page.Variables.svcalendarCategoryView.setInput('startDate', startDate);
    Page.Variables.svcalendarCategoryView.setInput('endDate', endDate);

    Page.Variables.svCalendarShortCategoryView.setInput('startDate', startDate);
    Page.Variables.svCalendarShortCategoryView.setInput('endDate', endDate);

    Page.Variables.svCalendarShiftTimingView.setInput('startDate', startDate);
    Page.Variables.svCalendarShiftTimingView.setInput('endDate', endDate);

    // ----------------------------------
    // INVOKE BASED ON GROUPING
    // ----------------------------------
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
    Page._lastRawData = resolvedData;
    Page._lastBuilderType = 'nested';
    Page.calendarDaySlots = Page.buildCalendarDaySlots(resolvedData, Page.activeFilters);
};

Page.svcalendarCategoryViewonSuccess = function (variable, data) {
    const resolvedData = (variable.dataSet && variable.dataSet.dates) ? variable.dataSet : data;
    Page._lastRawData = resolvedData;
    Page._lastBuilderType = 'nested';
    Page.calendarDaySlots = Page.buildCalendarDaySlots(resolvedData, Page.activeFilters);
};

Page.svCalendarShortCategoryViewonSuccess = function (variable, data) {
    const resolvedData = (variable.dataSet && variable.dataSet.dates) ? variable.dataSet : data;
    Page._lastRawData = resolvedData;
    Page._lastBuilderType = 'nested';
    Page.calendarDaySlots = Page.buildCalendarDaySlots(resolvedData, Page.activeFilters);
};

Page.svCalendarShiftTimingViewonSuccess = function (variable, data) {
    const resolvedData = (variable.dataSet && variable.dataSet.dates) ? variable.dataSet : data;
    Page._lastRawData = resolvedData;
    Page._lastBuilderType = 'flat';
    Page.calendarDaySlots = Page.buildCalendarDaySlotsShiftTiming(resolvedData, Page.activeFilters);
};

// =============================================================================
// PUBLIC FILTER API — called by scheduleTopNav partial
// =============================================================================

/**
 * Apply category and/or position filters to the already-fetched calendar data.
 * Called by the scheduleTopNav partial when the user changes a filter dropdown.
 *
 * @param {string|null} categoryIds  - Comma-separated category IDs, single ID string, or null for no filter
 * @param {string|null} positionIds  - Comma-separated position IDs, single ID string, or null for no filter
 */
Page.applyCalendarFilter = function (categoryIds, positionIds) {
    Page.activeFilters.categoryIds = categoryIds || null;
    Page.activeFilters.positionIds = positionIds || null;

    if (!Page._lastRawData) {
        // No data fetched yet — nothing to filter
        return;
    }

    if (Page._lastBuilderType === 'flat') {
        Page.calendarDaySlots = Page.buildCalendarDaySlotsShiftTiming(Page._lastRawData, Page.activeFilters);
    } else {
        Page.calendarDaySlots = Page.buildCalendarDaySlots(Page._lastRawData, Page.activeFilters);
    }
};

// =============================================================================
// FILTER HELPERS
// =============================================================================

/**
 * Parse a comma-separated ID string into a Set of numeric IDs.
 * Returns null if the input is null/empty (meaning "no filter — show all").
 *
 * @param {string|null} idsStr  e.g. "3,7,12," or "5" or null
 * @returns {Set<number>|null}
 */
Page._parseIdSet = function (idsStr) {
    if (!idsStr) { return null; }
    const parts = String(idsStr).split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (parts.length === 0) { return null; }
    return new Set(parts.map(Number));
};

/**
 * Resolve a Set of category IDs to a Set of category name strings.
 * Uses App.Variables.svGetAllCategoriesByCompanyId.dataSet.categories
 *
 * @param {Set<number>|null} idSet
 * @returns {Set<string>|null}
 */
Page._resolveCategoryNames = function (idSet) {
    if (!idSet) { return null; }
    const cats = (App.Variables.svGetAllCategoriesByCompanyId &&
        App.Variables.svGetAllCategoriesByCompanyId.dataSet &&
        App.Variables.svGetAllCategoriesByCompanyId.dataSet.categories) || [];
    const names = new Set();
    cats.forEach(function (cat) {
        if (idSet.has(Number(cat.categoryId))) {
            names.add((cat.description || '').trim());
            // also add shortDesc variant in case API uses it
            if (cat.shortDesc) { names.add(cat.shortDesc.trim()); }
        }
    });
    return names.size > 0 ? names : null;
};

/**
 * Resolve a Set of position IDs to a Set of position label strings.
 * Uses App.Variables.svGetAllPositionsByCompanyId.dataSet.positions
 *
 * @param {Set<number>|null} idSet
 * @returns {Set<string>|null}
 */
Page._resolvePositionNames = function (idSet) {
    if (!idSet) { return null; }
    const positions = (App.Variables.svGetAllPositionsByCompanyId &&
        App.Variables.svGetAllPositionsByCompanyId.dataSet &&
        App.Variables.svGetAllPositionsByCompanyId.dataSet.positions) || [];
    const names = new Set();
    positions.forEach(function (pos) {
        if (idSet.has(Number(pos.positionId))) {
            names.add((pos.description || '').trim());
        }
    });
    return names.size > 0 ? names : null;
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
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // convert 1-based month string to 0-based JS month index
    const pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    const startDate = year + '-' + pad(month + 1) + '-01';
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = year + '-' + pad(month + 1) + '-' + pad(lastDay);
    return { startDate: startDate, endDate: endDate };
};

// =============================================================================
// SLOT BUILDER 1: Position / Category / Cat views  (nested shiftGroups)
// Used by: svcalendarPositionView, svcalendarCategoryView, svCalendarShortCategoryView
// =============================================================================
Page.buildCalendarDaySlots = function (data, filters) {
    const moment = window.moment || require('moment');
    const hideGroupsNoShifts = App.Variables.appSelectedGrouping.dataSet.hideGroupsNoShifts === true;

    // --- Resolve active filters to name sets ---
    filters = filters || {};
    const categoryIdSet = Page._parseIdSet(filters.categoryIds);
    const positionIdSet = Page._parseIdSet(filters.positionIds);
    const categoryNames = Page._resolveCategoryNames(categoryIdSet);   // Set<string> | null
    const positionNames = Page._resolvePositionNames(positionIdSet);   // Set<string> | null

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

            // --- POSITION FILTER: skip this group if it doesn't match selected position(s) ---
            if (positionNames && positionNames.size > 0) {
                const normalizedPosName = posName.trim();
                if (!positionNames.has(normalizedPosName)) {
                    return; // skip this position group
                }
            }

            // Build timeGroups: one entry per time slot, each with its own employees array
            const timeGroups = [];
            let hasRealShifts = false;

            if (timeSlots.length === 0) {
                // No time slots from API — show "(No Shifts)"
                timeGroups.push({
                    timeRange: '',
                    employees: [{
                        employeeName: '(No Shifts)',
                        categoryName: '',
                        iconClass: '',
                        color: '',
                        empTypeId: null,
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
                        // Time slot exists but no employee assigned — show "(Unassigned)"
                        employees.push({
                            employeeName: '(Unassigned)',
                            categoryName: '',
                            iconClass: '',
                            color: '',
                            empTypeId: null,
                            description: '',
                            isNoShifts: true
                        });
                    } else {
                        shifts.forEach(function (shift) {
                            // --- CATEGORY FILTER: skip this employee if category doesn't match ---
                            if (categoryNames && categoryNames.size > 0) {
                                const shiftCat = (shift.category || '').trim();
                                if (!categoryNames.has(shiftCat)) {
                                    return; // skip this employee
                                }
                            }

                            const empName = Page.formatEmployeeName(shift.firstName, shift.lastName, shift.employeeName, nameFormat);
                            const color = shift.color || '';
                            const iconCls = color ? 'wi wi-circle' : 'wi wi-diamond';
                            // Normalize empTypeId to a number (API may return string or number)
                            const empTypeId = (shift.empTypeId != null && shift.empTypeId !== '') ? Number(shift.empTypeId) : null;
                            employees.push({
                                employeeName: empName || '(Unassigned)',
                                categoryName: (showCatPos && empName && shift.category) ? shift.category : '',
                                iconClass: empName ? iconCls : '',
                                color: color,
                                empTypeId: empTypeId,
                                description: shift.description || '',
                                isNoShifts: !empName
                            });
                            if (empName) { hasRealShifts = true; }
                        });

                        // If category filter removed all employees from this time slot, show (Unassigned)
                        if (employees.length === 0) {
                            employees.push({
                                employeeName: '(Unassigned)',
                                categoryName: '',
                                iconClass: '',
                                color: '',
                                empTypeId: null,
                                description: '',
                                isNoShifts: true
                            });
                        }
                    }

                    timeGroups.push({ timeRange: timeRange, employees: employees });
                });
            }

            // If hideGroupsNoShifts is enabled, skip positions where all employees are "(Unassigned)"
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

    // -------------------------------------------------------------------------
    // Build month calendar grid
    // -------------------------------------------------------------------------
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
    const firstDayOfWeek = monthStart.day();   // 0=Sun, 1=Mon, ..., 6=Sat
    const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const startOn = (App.Variables.appSelectedGrouping && App.Variables.appSelectedGrouping.dataSet.startOn) || 'Sunday';
    const startIndex = Math.max(0, allDays.indexOf(startOn));
    const offset = (firstDayOfWeek - startIndex + 7) % 7;

    const slots = [];

    // LEADING EMPTY CELLS — pad before day 1
    for (let i = 0; i < offset; i++) {
        slots.push({ hasDate: false, dayNum: '', dateStr: '', positions: [] });
    }

    // ACTUAL DAY CELLS
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

    // TRAILING EMPTY CELLS — complete the last row to a multiple of 7
    const remainder = slots.length % 7;
    if (remainder !== 0) {
        const trailing = 7 - remainder;
        for (let i = 0; i < trailing; i++) {
            slots.push({ hasDate: false, dayNum: '', dateStr: '', positions: [] });
        }
    }

    return slots;
};

// =============================================================================
// SLOT BUILDER 2: Shift Timing view  (flat shiftGroups, no nesting)
// Used by: svCalendarShiftTimingView
// =============================================================================
Page.buildCalendarDaySlotsShiftTiming = function (data, filters) {
    const moment = window.moment || require('moment');
    const hideGroupsNoShifts = App.Variables.appSelectedGrouping.dataSet.hideGroupsNoShifts === true;

    // --- Resolve active filters to name sets ---
    filters = filters || {};
    const categoryIdSet = Page._parseIdSet(filters.categoryIds);
    const categoryNames = Page._resolveCategoryNames(categoryIdSet);   // Set<string> | null
    // Note: position filter is not applicable in flat shift-timing view (no position groups)

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
                // No shifts/no time data from API — show "(No Shifts)"
                employees.push({
                    employeeName: '(No Shifts)',
                    categoryName: '',
                    iconClass: '',
                    color: '',
                    empTypeId: null,
                    description: '',
                    isNoShifts: true
                });
            } else {
                const showCatPos = App.Variables.appSelectedGrouping.dataSet.showCatPos === true;
                const nameFormat = (App.Variables.appSelectedGrouping && App.Variables.appSelectedGrouping.dataSet.nameFormat) || 'First Last';
                shifts.forEach(function (shift) {
                    // --- CATEGORY FILTER: skip this employee if category doesn't match ---
                    if (categoryNames && categoryNames.size > 0) {
                        const shiftCat = (shift.category || '').trim();
                        if (!categoryNames.has(shiftCat)) {
                            return; // skip this employee
                        }
                    }

                    const empName = Page.formatEmployeeName(shift.firstName, shift.lastName, shift.employeeName, nameFormat);
                    const color = shift.color || '';
                    const iconCls = color ? 'wi wi-circle' : 'wi wi-diamond';
                    // Normalize empTypeId to a number (API may return string or number)
                    const empTypeId = (shift.empTypeId != null && shift.empTypeId !== '') ? Number(shift.empTypeId) : null;
                    if (empName) {
                        employees.push({
                            employeeName: empName,
                            categoryName: (showCatPos && shift.category) ? shift.category : '',
                            iconClass: iconCls,
                            color: color,
                            empTypeId: empTypeId,
                            description: shift.description || '',
                            isNoShifts: false
                        });
                    }
                });

                if (employees.length === 0) {
                    // Shifts existed but no valid employee names (or all filtered out) — show "(Unassigned)"
                    employees.push({
                        employeeName: '(Unassigned)',
                        categoryName: '',
                        iconClass: '',
                        color: '',
                        empTypeId: null,
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

    // -------------------------------------------------------------------------
    // Build month calendar grid  (identical grid logic to buildCalendarDaySlots)
    // -------------------------------------------------------------------------
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
    const firstDayOfWeek = monthStart.day();   // 0=Sun, 1=Mon, ..., 6=Sat
    const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const startOn = (App.Variables.appSelectedGrouping && App.Variables.appSelectedGrouping.dataSet.startOn) || 'Sunday';
    const startIndex = Math.max(0, allDays.indexOf(startOn));
    const offset = (firstDayOfWeek - startIndex + 7) % 7;

    const slots = [];

    // LEADING EMPTY CELLS — pad before day 1
    for (let i = 0; i < offset; i++) {
        slots.push({ hasDate: false, dayNum: '', dateStr: '', positions: [] });
    }

    // ACTUAL DAY CELLS
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

    // TRAILING EMPTY CELLS — complete the last row to a multiple of 7
    const remainder = slots.length % 7;
    if (remainder !== 0) {
        const trailing = 7 - remainder;
        for (let i = 0; i < trailing; i++) {
            slots.push({ hasDate: false, dayNum: '', dateStr: '', positions: [] });
        }
    }

    return slots;
};

// =============================================================================
// EVENT HANDLERS
// =============================================================================

Page.anchor2Click = function ($event, widget) {
    // Sync the current live appSelectedGrouping state to localStorage BEFORE
    // opening the popup. The popup window gets a fresh app context and can only
    // share data via localStorage — without this, it reads a stale prior save.
    localStorage.setItem('mgrScheduleCfgMonth', JSON.stringify(App.Variables.appSelectedGrouping.dataSet));
    App.redirectTo('mgrschedulecfgmonth');
};

Page.onDestroy = function () {
    if (calendarChannel) {
        calendarChannel.close();
    }
};

Page.tabs1Change = function ($event, widget, newPaneIndex, oldPaneIndex) {
    debugger
    Page.Widgets.container34.pageParams.selectedTab = widget.activeTab.title;
};
