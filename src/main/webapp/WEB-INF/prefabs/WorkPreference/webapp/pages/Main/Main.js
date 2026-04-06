/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/*
 * This function will be invoked when any of this prefab's property is changed
 * @key: property name
 * @newVal: new value of the property
 * @oldVal: old value of the property
 */
Prefab.onPropertyChange = function (key, newVal, oldVal) {
    debugger
    switch (key) {

        case "choosedate":
            Prefab._selectedDate = newVal;
            Prefab.startDatePickerChange(null, newVal, oldVal);
            break;

        case "singleday":
            if (newVal === true && Prefab.choosedate) {
                debugger
                Prefab.showpreferenceTap();
            }
            break;

        case "restrictedit":
            debugger

            Prefab.readOnlyBtnTap();
            break;
    }

};
Prefab.onReady = function () {
    setTimeout(function () {
        Prefab.updateWeekDisplay();
        Prefab._initDragSelect();
        var ds = Prefab._getWeekData();
        if (ds) { ds.weekOffset = 0; }
        var formDs = Prefab.Variables.worktimepreference && Prefab.Variables.worktimepreference.dataSet;
        if (formDs) { formDs.preferenceType = 'Prefer'; }
    }, 100);
    Prefab.readOnlyBtnTap();
    debugger
    if (Prefab.singleday === true && Prefab.choosedate) {

        Prefab.showpreferenceTap();
    }
    Prefab.loadWeekPreferenceData
}

/*
 * WorkTimePreferences_Copy Prefab Script
 * weekPreferenceData is the single source of truth for all week/grid state.
 * dataSet shape (isList:false, object):
 *   weekOffset   : number   — how many weeks offset from BASE_WEEK_START
 *   weekLabel    : string   — "Week of Mar 24, 2025"
 *   weekStartDate: string   — "2025-03-24" (= [0].date)
 *   [0..6]       : day items — { dayLabel, dayKey, date, hours[24].slots[4].preference }
 */

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */

/*
 * WorkTimePreferences_Copy Prefab Script
 * weekPreferenceData is the single source of truth for all week/grid state.
 * dataSet shape (isList:true, array of 7 day entries):
 *   ds[0..6] : day items — { companyId, employeeId, date, prefs (96-char string), compression, editedBy, dayLabel, dayKey, weekOffset (ds[0] only), weekLabel (ds[0] only), weekStartDate (ds[0] only) }
 *   prefs char mapping: P=prefer, D=dislike, C=cannot-work, other=no-preference
 *   slot index = hourIdx * 4 + slotIdx
 */

var PREF_CYCLE = ['no-preference', 'prefer', 'dislike', 'cannot-work'];
var DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
var FULL_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

var _today = new Date();
var _dayOfWeek = _today.getDay();
var _daysToMonday = _dayOfWeek === 0 ? 6 : _dayOfWeek - 1;
var BASE_WEEK_START = new Date(_today.getFullYear(), _today.getMonth(), _today.getDate() - _daysToMonday, 0, 0, 0, 0);

Prefab._dragIsMouseDown = false;
Prefab._dragJustEnded = false;
Prefab._dragSelectedPreference = 'prefer';
//restrictedit = false;

var RADIO_LABEL_TO_PREF = {
    'Prefer': 'prefer',
    'Dislike': 'dislike',
    'No Preference': 'no-preference',
    'Cannot Work': 'cannot-work'
};

var PREF_TO_RADIO_LABEL = Object.keys(RADIO_LABEL_TO_PREF).reduce(function (acc, label) {
    acc[RADIO_LABEL_TO_PREF[label]] = label;
    return acc;
}, {});

var PREF_COLOR_MAP = {
    'prefer': '#4CAF50',
    'dislike': '#FFCDD2',
    'no-preference': '#ffffff',
    'cannot-work': '#F44336'
};

var BORDER_COLOR_MAP = {
    'prefer': '#388E3C',
    'dislike': '#e57373',
    'no-preference': '#aaaaaa',
    'cannot-work': '#c62828',
    'default': 'rgba(0,0,0,0.25)'
};

var EMPTY_FORM_STATE = {
    preferenceType: '',
    weekDay: '',
    beginHour: '',
    beginMinute: '',
    endHour: '',
    endMinute: ''
};

/* ── Prefs string helpers ───────────────────────────────────────── */

function prefsCharToPref(ch) {
    if (ch === 'P') { return 'prefer'; }
    if (ch === 'D') { return 'dislike'; }
    if (ch === 'C') { return 'cannot-work'; }
    return 'no-preference';
}

function prefToPrefsChar(pref) {
    if (pref === 'prefer') { return 'P'; }
    if (pref === 'dislike') { return 'D'; }
    if (pref === 'cannot-work') { return 'C'; }
    return 'N';
}

var EMPTY_PREFS = (function () {
    var s = '';
    for (var i = 0; i < 96; i++) { s += 'N'; }
    return s;
}());

/* ── dataSet accessors ──────────────────────────────────────────── */

Prefab._getWeekData = function () {
    return Prefab.Variables.weekPreferenceData.dataSet;
};

Prefab._getWeekOffset = function () {
    var ds = Prefab._getWeekData();
    return (ds && ds[0] && typeof ds[0].weekOffset === 'number') ? ds[0].weekOffset : 0;
};

Prefab._setWeekOffset = function (n) {
    var ds = Prefab._getWeekData();
    if (ds && ds[0]) { ds[0].weekOffset = n; }
};

Prefab._syncWeekPreferenceData = function () {
    var variable = Prefab.Variables.weekPreferenceData;
    if (!variable || !variable.dataSet) { return; }
    try {
        var $rs = App.getDependency('$rootScope');
        if ($rs && !$rs.$$phase) { $rs.$apply(); }
    } catch (e) { }
};

Prefab._getPrefClass = function (pref) {
    return 'btn-' + pref;
};

/* ── Slot read/write ────────────────────────────────────────────── */

Prefab._getSlot = function (dayIdx, hourIdx, slotIdx) {
    var ds = Prefab._getWeekData();
    if (!ds) { return null; }
    var day = ds[dayIdx];
    if (!day) { return null; }
    var prefs = day.prefs || EMPTY_PREFS;
    var charIdx = hourIdx * 4 + slotIdx;
    if (charIdx < 0 || charIdx >= 96) { return null; }
    return { preference: prefsCharToPref(prefs[charIdx]) };
};

Prefab._setSlot = function (dayIdx, hourIdx, slotIdx, pref) {
    var ds = Prefab._getWeekData();
    if (!ds) { return; }
    var day = ds[dayIdx];
    if (!day) { return; }
    var prefs = day.prefs || EMPTY_PREFS;
    if (prefs.length < 96) {
        while (prefs.length < 96) { prefs += 'N'; }
    }
    var charIdx = hourIdx * 4 + slotIdx;
    if (charIdx < 0 || charIdx >= 96) { return; }
    var ch = prefToPrefsChar(pref);
    day.prefs = prefs.substring(0, charIdx) + ch + prefs.substring(charIdx + 1);
};

Prefab._getVisibleDayRowCount = function () {
    var count = 0;
    for (var i = 0; i <= 6; i++) {
        var rowWidget = Prefab.Widgets && Prefab.Widgets['dayRow' + i];
        if (rowWidget) {
            if (rowWidget.show !== false) { count++; }
        } else {
            var rowEl = document.querySelector('[name="dayRow' + i + '"]');
            if (rowEl && rowEl.style.display !== 'none') { count++; }
        }
    }
    return count;
};

Prefab._getSlotTooltipText = function (buttonName, showDayName, isReadOnly) {
    if (!buttonName) { return ''; }
    var match = buttonName.match(/^d(\d+)h(\d+)s(\d+)$/);
    if (!match) { return ''; }
    var dayIdx = parseInt(match[1], 10);
    var hourIdx = parseInt(match[2], 10);
    var slotIdx = parseInt(match[3], 10);
    if (isNaN(dayIdx) || isNaN(hourIdx) || isNaN(slotIdx)) { return ''; }
    var readOnly = (isReadOnly !== undefined) ? isReadOnly : Prefab.restrictedit;
    var period = hourIdx < 12 ? 'AM' : 'PM';
    var hour12 = hourIdx % 12;
    if (hour12 === 0) { hour12 = 12; }
    var SLOT_MINUTES = [0, 15, 30, 45];
    var minutes = SLOT_MINUTES[slotIdx] !== undefined ? SLOT_MINUTES[slotIdx] : 0;
    var timeStr = minutes === 0 ? hour12 + period : hour12 + ':' + (minutes < 10 ? '0' + minutes : minutes) + period;
    if (showDayName === false) { return timeStr; }
    var dayName = readOnly ? (DAY_NAMES[dayIdx] || '') : (FULL_DAY_NAMES[dayIdx] || '');
    return dayName + ' ' + timeStr;
};

function _applyBgColor(el, color, prefKey) {
    var paintTarget = (el.tagName === 'BUTTON') ? el : (el.querySelector('button') || el);
    paintTarget.style.backgroundColor = color;
    var borderColor = (prefKey && BORDER_COLOR_MAP[prefKey]) ? BORDER_COLOR_MAP[prefKey] : BORDER_COLOR_MAP['default'];
    paintTarget.style.borderColor = borderColor;
    paintTarget.style.borderWidth = '1px';
    paintTarget.style.borderStyle = 'solid';
}

Prefab._initDragSelect = function () {
    var gridEl = document.querySelector('.time-grid-wrapper');
    if (!gridEl) { return; }
    function tryPaint(el) {
        var btn = Prefab._findSlotButton(el);
        if (btn) { Prefab._paintCellFromElement(btn); }
    }
    gridEl.addEventListener('mousedown', function (e) {
        if (Prefab._isReadOnly) { return; }
        var btn = Prefab._findSlotButton(e.target);
        if (!btn) { return; }
        e.preventDefault();
        Prefab._dragIsMouseDown = true;
        tryPaint(e.target);
    });
    gridEl.addEventListener('mousemove', function (e) {
        if (!Prefab._dragIsMouseDown) { return; }
        tryPaint(e.target);
    });
    document.addEventListener('mouseup', function () {
        if (Prefab._dragIsMouseDown) {
            Prefab._dragJustEnded = true;
            setTimeout(function () { Prefab._dragJustEnded = false; }, 100);
            Prefab._syncWeekPreferenceData();
        }
        Prefab._dragIsMouseDown = false;
    });
    gridEl.addEventListener('dragstart', function (e) { e.preventDefault(); });
    gridEl.addEventListener('selectstart', function (e) { e.preventDefault(); });
    gridEl.addEventListener('mouseover', function (e) {
        var el = e.target;
        var maxWalk = 10;
        while (el && maxWalk-- > 0) {
            var nameAttr = el.getAttribute ? el.getAttribute('name') : null;
            if (nameAttr && /^d\d+h\d+s\d+$/.test(nameAttr)) {
                var visibleRowCount = Prefab._getVisibleDayRowCount();
                var showDayName = visibleRowCount !== 1;
                var tooltipText = Prefab._getSlotTooltipText(nameAttr, showDayName, Prefab._isReadOnly);
                if (tooltipText && el.getAttribute('title') !== tooltipText) {
                    el.setAttribute('title', tooltipText);
                    var innerBtn = el.querySelector('button');
                    if (innerBtn) { innerBtn.setAttribute('title', tooltipText); }
                }
                break;
            }
            el = el.parentElement;
        }
    });
    var legendButtons = [
        { name: 'legendPreferBtn', pref: 'prefer' },
        { name: 'legendDislikeBtn', pref: 'dislike' },
        { name: 'legendNoPrefBtn', pref: 'no-preference' },
        { name: 'legendCannotWorkBtn', pref: 'cannot-work' }
    ];
    legendButtons.forEach(function (cfg) {
        var btnEl = document.querySelector('[name="' + cfg.name + '"]');
        if (btnEl) {
            btnEl.addEventListener('click', function () {
                Prefab._dragSelectedPreference = cfg.pref;
                var radioLabel = PREF_TO_RADIO_LABEL[cfg.pref];
                if (radioLabel) {
                    var formDs = Prefab.Variables.worktimepreference && Prefab.Variables.worktimepreference.dataSet;
                    if (formDs) { formDs.preferenceType = radioLabel; }
                    if (Prefab.Widgets && Prefab.Widgets.preferenceTypeRadio) {
                        Prefab.Widgets.preferenceTypeRadio.datavalue = radioLabel;
                    }
                }
            });
        }
    });
};



Prefab._findSlotButton = function (el) {
    var maxWalk = 6;
    while (el && maxWalk-- > 0) {
        if (el.classList && el.classList.contains('slot-btn')) { return el; }
        el = el.parentElement;
    }
    return null;
};

Prefab._paintCellFromElement = function (btnEl) {
    if (Prefab.restrictedit) { return; }
    var pref = Prefab._dragSelectedPreference;
    var color = PREF_COLOR_MAP[pref] || PREF_COLOR_MAP['no-preference'];
    var dayIdx, hourIdx, slotIdx;
    var resolvedByData = false;
    var resolvedNameEl = null;
    var dDay = btnEl.getAttribute('data-day');
    var dHour = btnEl.getAttribute('data-hour');
    var dSlot = btnEl.getAttribute('data-slot');
    if (dDay !== null && dHour !== null && dSlot !== null) {
        dayIdx = parseInt(dDay, 10);
        hourIdx = parseInt(dHour, 10);
        slotIdx = parseInt(dSlot, 10);
        resolvedByData = true;
    } else {
        var walkEl = btnEl;
        var walkMax = 8;
        while (walkEl && walkMax-- > 0) {
            var nameAttr = walkEl.getAttribute ? walkEl.getAttribute('name') : null;
            if (nameAttr) {
                var match = nameAttr.match(/^d(\d+)h(\d+)s(\d+)$/);
                if (match) {
                    dayIdx = parseInt(match[1], 10);
                    hourIdx = parseInt(match[2], 10);
                    slotIdx = parseInt(match[3], 10);
                    resolvedNameEl = walkEl;
                    break;
                }
            }
            walkEl = walkEl.parentElement;
        }
    }
    if (isNaN(dayIdx) || isNaN(hourIdx) || isNaN(slotIdx)) { return; }
    if (dayIdx === undefined || hourIdx === undefined || slotIdx === undefined) { return; }
    _applyBgColor(btnEl, color, pref);
    Prefab._setSlot(dayIdx, hourIdx, slotIdx, pref);
    var widgetName;
    if (resolvedByData) {
        widgetName = 'd' + dayIdx + 'h' + hourIdx + 's' + slotIdx;
    } else if (resolvedNameEl) {
        widgetName = resolvedNameEl.getAttribute('name');
    }
    if (widgetName) {
        var wmWidget = Prefab.Widgets && Prefab.Widgets[widgetName];
        if (wmWidget) { wmWidget.conditionalclass = Prefab._getPrefClass(pref); }
    }
};

Prefab.preferenceTypeRadioChange = function ($event, newVal, oldVal, widget) {
    var trimmed = (newVal || '').trim();
    var mapped = RADIO_LABEL_TO_PREF[trimmed];
    if (mapped !== undefined && mapped !== null) { Prefab._dragSelectedPreference = mapped; }
};

Prefab.readOnlyBtnTap = function ($event, widget) {
    // Prefab.restrictedit = !Prefab.restrictedit;

    // Toggle not-allowed cursor on the slot grid (pointer-events intentionally
    // NOT set here — mouseover must remain active for tooltip functionality)
    var gridEl = document.querySelector('.time-grid-wrapper');
    if (gridEl) {
        if (Prefab.restrictedit) {
            gridEl.classList.add('read-only-grid');
        } else {
            gridEl.classList.remove('read-only-grid');
        }
    }

};
Prefab.slotAreaClick = function ($event, widget) {
    debugger
    if (Prefab.restrictedit) {
        // In read-only mode: resolve dayIndex from widget name (e.g. "dayHours3" → 3)
        var widgetName = widget && widget.name ? widget.name : '';
        var match = widgetName.match(/dayHours(\d+)/);
        if (match) {
            Prefab.dayLabelClick(parseInt(match[1], 10));
        }
        return;
    }
    if (Prefab._dragJustEnded) { return; }
    var target = $event.target;
    var maxWalk = 6;
    while (target && maxWalk-- > 0) {
        if (target.getAttribute && target.getAttribute('data-slot') !== null) { break; }
        target = target.parentElement;
    }
    if (!target) { return; }
    var dayIdx = parseInt(target.getAttribute('data-day'), 10);
    var hourIdx = parseInt(target.getAttribute('data-hour'), 10);
    var slotIdx = parseInt(target.getAttribute('data-slot'), 10);
    if (isNaN(dayIdx) || isNaN(hourIdx) || isNaN(slotIdx)) { return; }
    var pref = Prefab._dragSelectedPreference || 'no-preference';
    Prefab._setSlot(dayIdx, hourIdx, slotIdx, pref);
    var widgetName = 'd' + dayIdx + 'h' + hourIdx + 's' + slotIdx;
    if (Prefab.Widgets && Prefab.Widgets[widgetName]) {
        Prefab.Widgets[widgetName].conditionalclass = Prefab._getPrefClass(pref);
    }
    var color = PREF_COLOR_MAP[pref] || PREF_COLOR_MAP['no-preference'];
    _applyBgColor(target, color, pref);
    Prefab._syncWeekPreferenceData();
};

Prefab.getDateForDay = function (weekOffset, dayIndex) {
    var d = new Date(BASE_WEEK_START.getTime());
    d.setDate(d.getDate() + weekOffset * 7 + dayIndex);
    return d;
};

Prefab.formatDayLabel = function (date) {
    var jsDay = date.getDay();
    var dayIdx = jsDay === 0 ? 6 : jsDay - 1;
    return DAY_NAMES[dayIdx] + ' ' + MONTH_NAMES[date.getMonth()] + '-' + date.getDate();
};

Prefab.formatWeekLabel = function (monday) {
    return 'Week of ' + MONTH_NAMES[monday.getMonth()] + ' ' + monday.getDate() + ', ' + monday.getFullYear();
};

Prefab.formatIsoDate = function (date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
};

Prefab.formatFullDate = function (date) {
    var jsDay = date.getDay();
    var dayIdx = jsDay === 0 ? 6 : jsDay - 1;
    return FULL_DAY_NAMES[dayIdx] + ', ' + MONTH_NAMES[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
};

Prefab.getSlotClass = function (preference) {
    return 'btn btn-xs slot-btn btn-' + (preference || 'no-preference');
};

Prefab.applySlotColors = function () {
    var ds = Prefab._getWeekData();
    if (!ds) { return; }
    for (var d = 0; d <= 6; d++) {
        var dayData = ds[d];
        if (!dayData) { continue; }
        var prefs = dayData.prefs || EMPTY_PREFS;
        for (var h = 0; h < 24; h++) {
            for (var s = 0; s < 4; s++) {
                var charIdx = h * 4 + s;
                var pref = prefsCharToPref(prefs[charIdx] || 'N');
                var color = PREF_COLOR_MAP[pref] || PREF_COLOR_MAP['no-preference'];
                var widgetName = 'd' + d + 'h' + h + 's' + s;
                var wmWidget = Prefab.Widgets && Prefab.Widgets[widgetName];
                if (wmWidget && wmWidget.$element) {
                    var el = wmWidget.$element[0];
                    if (el) { el.className = Prefab.getSlotClass(pref); _applyBgColor(el, color, pref); }
                }
                if (wmWidget) { wmWidget.conditionalclass = Prefab._getPrefClass(pref); }
            }
        }
    }
};

Prefab.updateWeekDisplay = function () {
    var ds = Prefab._getWeekData();
    if (!ds) { console.warn('updateWeekDisplay: weekPreferenceData not ready.'); return; }
    var offset = Prefab._getWeekOffset();
    var monday = Prefab.getDateForDay(offset, 0);
    if (ds[0]) {
        ds[0].weekLabel = Prefab.formatWeekLabel(monday);
        ds[0].weekStartDate = Prefab.formatIsoDate(monday);
    }
    for (var i = 0; i <= 6; i++) {
        if (ds[i]) {
            var d = Prefab.getDateForDay(offset, i);
            ds[i].date = Prefab.formatIsoDate(d);
            ds[i].dayLabel = Prefab.formatDayLabel(d);
        }
    }
    Prefab.applySlotColors();
};

Prefab.dayLabelClick = function (dayIndex) {
    var ds = Prefab._getWeekData();
    if (!ds) { return; }
    var dayData = ds[dayIndex];
    if (!dayData) { return; }
    var isoDate = dayData.date || '';

    /* ── READ-ONLY MODE: select the date, do NOT navigate ── */
    if (Prefab.restrictedit) {
        if (!isoDate) { return; }
        var selectedDate = new Date(isoDate + 'T00:00:00');
        if (isNaN(selectedDate.getTime())) { return; }
        // Update the startDatePicker widget to reflect the clicked row's date
        if (Prefab.Widgets && Prefab.Widgets.startDatePicker) {
            Prefab.Widgets.startDatePicker.datavalue = selectedDate;
        }
        // Sync the weekDay form field and weekDaySelect to match the selected date
        var jsDay = selectedDate.getDay();
        var wmDayIndex = jsDay === 0 ? 6 : jsDay - 1;
        var fullDayName = FULL_DAY_NAMES[wmDayIndex];
        var formDs = Prefab.Variables.worktimepreference && Prefab.Variables.worktimepreference.dataSet;
        if (formDs) { formDs.weekDay = fullDayName; }
        if (Prefab.Widgets && Prefab.Widgets.weekDaySelect) {
            Prefab.Widgets.weekDaySelect.datavalue = fullDayName;
        }
        // Store the selected date for use by showpreferenceTap and other handlers
        Prefab._selectedDate = selectedDate;
        Prefab.selectedday = selectedDate;
        return Prefab._selectedDate; // Do NOT navigate in read-only mode
    }
}



function parseHourLabel(label) {
    if (!label) { return NaN; }
    var str = String(label).trim().toUpperCase();
    var isPM = str.indexOf('PM') !== -1;
    var num = parseInt(str.replace('AM', '').replace('PM', ''), 10);
    if (isNaN(num)) { return NaN; }
    if (!isPM) { return num === 12 ? 0 : num; }
    return num === 12 ? 12 : num + 12;
}

function parseMinuteSlot(minStr) {
    var map = { '00': 0, '15': 1, '30': 2, '45': 3 };
    return map.hasOwnProperty(String(minStr)) ? map[String(minStr)] : NaN;
}

function parsePrefLabel(label) {
    return label ? (RADIO_LABEL_TO_PREF[String(label).trim()] || null) : null;
}

Prefab.applySlotColorsForDynamicRow = function (dayIndex) {
    var ds = Prefab._getWeekData();
    if (!ds || !ds[dayIndex]) { return; }
    var dayData = ds[dayIndex];
    var prefs = dayData.prefs || EMPTY_PREFS;
    var buttons = document.querySelectorAll('[data-day="' + dayIndex + '"]');
    if (!buttons || buttons.length === 0) { return; }
    Array.from(buttons).forEach(function (btn) {
        var hIdx = parseInt(btn.getAttribute('data-hour'), 10);
        var sIdx = parseInt(btn.getAttribute('data-slot'), 10);
        if (isNaN(hIdx) || isNaN(sIdx)) { return; }
        var charIdx = hIdx * 4 + sIdx;
        var pref = prefsCharToPref(prefs[charIdx] || 'N');
        btn.className = Prefab.getSlotClass(pref);
        _applyBgColor(btn, PREF_COLOR_MAP[pref] || PREF_COLOR_MAP['no-preference'], pref);
    });
};

Prefab.addPreferenceBtnClick = function ($event, widget) {
    if (Prefab.restrictedit) { return; }
    var formData = Prefab.Variables.worktimepreference.dataSet;
    var ds = Prefab._getWeekData();
    var prefType = formData.preferenceType;
    var selectedWeekDay = (Prefab.Widgets.weekDaySelect && Prefab.Widgets.weekDaySelect.datavalue) || formData.weekDay;
    var beginHour = formData.beginHour;
    var beginMinute = formData.beginMinute;
    var endHour = formData.endHour;
    var endMinute = formData.endMinute;
    if (!prefType || !selectedWeekDay || !beginHour || !endHour) {
        alert('Please fill in all required fields: Preference Type, Week (day), Begin Hour, and End Hour.');
        return;
    }
    var fullDayIdx = FULL_DAY_NAMES.indexOf(String(selectedWeekDay).trim());
    if (fullDayIdx === -1) {
        alert('The selected day "' + selectedWeekDay + '" is not recognised. Please choose a valid day of the week.');
        return;
    }
    var targetDayKey = DAY_NAMES[fullDayIdx];
    var dayEntry = null;
    var dayEntryIndex = -1;
    for (var di = 0; di <= 6; di++) {
        if (ds[di] && ds[di].dayKey === targetDayKey) {
            dayEntry = ds[di];
            dayEntryIndex = di;
            break;
        }
    }
    if (!dayEntry) {
        alert('No grid row found for "' + selectedWeekDay + '".');
        return;
    }
    var beginHourIdx = parseHourLabel(beginHour);
    var beginSlotIdx = parseMinuteSlot(beginMinute || '00');
    var endHourIdx = parseHourLabel(endHour);
    var endSlotIdx = parseMinuteSlot(endMinute || '00');
    var prefValue = parsePrefLabel(prefType);
    if (isNaN(beginHourIdx) || isNaN(endHourIdx)) {
        alert('Begin or End hour could not be parsed. Please select valid values.');
        return;
    }
    if (isNaN(beginSlotIdx)) { beginSlotIdx = 0; }
    if (isNaN(endSlotIdx)) { endSlotIdx = 0; }
    if (!prefValue) {
        alert('Preference type "' + prefType + '" is not recognised.');
        return;
    }
    var beginAbsolute = beginHourIdx * 4 + beginSlotIdx;
    var endAbsolute = endHourIdx * 4 + endSlotIdx;
    if (beginAbsolute > endAbsolute) {
        alert('Begin time must be before End time.');
        return;
    }
    for (var absSlot = beginAbsolute; absSlot <= endAbsolute; absSlot++) {
        var h = Math.floor(absSlot / 4);
        var s = absSlot % 4;
        Prefab._setSlot(dayEntryIndex, h, s, prefValue);
    }
    if (dayEntryIndex <= 6) {
        Prefab.applySlotColors();
    } else {
        Prefab.applySlotColorsForDynamicRow(dayEntryIndex);
    }
    Prefab._syncWeekPreferenceData();
    Prefab.Variables.worktimepreference.dataSet = Object.assign(Prefab.Variables.worktimepreference.dataSet, EMPTY_FORM_STATE);
    if (Prefab.Widgets.weekDaySelect) { Prefab.Widgets.weekDaySelect.datavalue = ''; }
};

Prefab.startDatePickerChange = function ($event, newVal, oldVal, widget) {
    if (!newVal) { return; }
    Prefab._selectedDate = newVal;
    var selectedDate = (newVal instanceof Date) ? newVal : new Date(newVal);
    if (isNaN(selectedDate.getTime())) { return; }
    var jsDay = selectedDate.getDay();
    var wmDayIndex = jsDay === 0 ? 6 : jsDay - 1;
    var fullDayName = FULL_DAY_NAMES[wmDayIndex];
    var formDs = Prefab.Variables.worktimepreference && Prefab.Variables.worktimepreference.dataSet;
    if (formDs) { formDs.weekDay = fullDayName; }
    if (Prefab.Widgets && Prefab.Widgets.weekDaySelect) { Prefab.Widgets.weekDaySelect.datavalue = fullDayName; }
    var daysBackToMonday = jsDay === 0 ? 6 : jsDay - 1;
    var selectedMonday = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - daysBackToMonday, 0, 0, 0, 0);
    var msPerWeek = 7 * 24 * 60 * 60 * 1000;
    var weekOffset = Math.round((selectedMonday.getTime() - BASE_WEEK_START.getTime()) / msPerWeek);
    Prefab._setWeekOffset(weekOffset);
    Prefab.updateWeekDisplay();
};

Prefab.showpreferenceTap = function ($event, widget) {
    var selectedDate = Prefab._selectedDate;
    if (!selectedDate) { return; }
    var ds = Prefab.Variables.weekPreferenceData.dataSet;
    var targetIdx = -1;
    for (var i = 0; i <= 6; i++) {
        if (ds[i] && ds[i].date) {
            var dayDate = new Date(ds[i].date);
            if (dayDate.toDateString() === new Date(selectedDate).toDateString()) {
                targetIdx = i;
                break;
            }
        }
    }
    if (targetIdx === -1) { return; }
    for (var j = 0; j <= 6; j++) {
        var rowWidget = Prefab.Widgets['dayRow' + j];
        if (rowWidget) { rowWidget.show = (j === targetIdx); }
    }
};

Prefab.getWeekPrefsAsApiPayload = function () {
    var ds = Prefab._getWeekData();
    var result = [];
    for (var i = 0; i < 7; i++) {
        var entry = ds[i];
        result.push({
            companyId: entry.companyId || 1,
            employeeId: entry.employeeId || 1,
            date: entry.date,
            prefs: entry.prefs || EMPTY_PREFS,
            compression: entry.compression || 0,
            editedBy: entry.editedBy || 1
        });
    }
    return result;
};

// Prefab.getSlotVariantClass = function (preference) {
//     return 'btn btn-xs slot-btn btn-' + (preference || 'no-preference');
// };

/* ─────────────────────────────────────────────
   PREFS STRING → HOURS/SLOTS EXPANSION
───────────────────────────────────────────── */

/**
 * Converts a single prefs-string character to its internal preference name.
 *   'P' → 'prefer'
 *   'D' → 'dislike'
 *   'C' → 'cannot-work'
 *   'N' (or anything else) → 'no-preference'
 */
Prefab.prefsCharToPref = function (ch) {
    if (ch === 'P') { return 'prefer'; }
    if (ch === 'D') { return 'dislike'; }
    if (ch === 'C') { return 'cannot-work'; }
    return 'no-preference';
};

/**
 * Expands a 96-character prefs string into the hours[0..23].slots[0..3].preference
 * nested structure expected by the grid renderer.
 *
 * @param  {string} prefs  96-char string of 'P','D','C','N'
 * @return {Array}         Array of 24 hour objects, each with 4 slot objects
 */
Prefab.buildHoursFromPrefs = function (prefs) {
    var hours = [];
    for (var h = 0; h < 24; h++) {
        var slots = [];
        for (var s = 0; s < 4; s++) {
            var charIdx = h * 4 + s;
            slots.push({ preference: Prefab.prefsCharToPref((prefs || '')[charIdx] || 'N') });
        }
        hours.push({ slots: slots });
    }
    return hours;
};

/**
 * Merges an array of raw API day objects (containing a prefs string) into the
 * weekPreferenceData variable, expanding each prefs string into hours/slots,
 * then triggers a full grid refresh so colors are painted immediately.
 *
 * Usage example:
 *   Prefab.loadWeekPreferenceData([
 *     { companyId:1, employeeId:1, date:"2026-04-01", prefs:"DDD...PPP...", compression:0, editedBy:1 },
 *     { companyId:1, employeeId:1, date:"2026-04-02", prefs:"PPP...",       compression:0, editedBy:1 }
 *   ]);
 *
 * @param {Array} rawDays  Array of API day objects with a prefs string
 */
Prefab.loadWeekPreferenceData = function (rawDays) {
    if (!rawDays || !rawDays.length) { return; }

    var weekData = Prefab.Variables.weekPreferenceData.dataSet;

    rawDays.forEach(function (apiDay) {
        for (var i = 0; i < weekData.length; i++) {
            if (weekData[i].date === apiDay.date) {
                weekData[i].companyId = apiDay.companyId;
                weekData[i].employeeId = apiDay.employeeId;
                weekData[i].prefs = apiDay.prefs;
                weekData[i].compression = apiDay.compression;
                weekData[i].editedBy = apiDay.editedBy;
                // Expand the prefs string into the nested hours/slots structure
                weekData[i].hours = Prefab.buildHoursFromPrefs(apiDay.prefs);
                break;
            }
        }
    });

    // Repaint the entire grid with updated colors
    Prefab.refreshWeekData();
};
