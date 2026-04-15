/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

Page.prefClassMap = {
    'P': 'pref-prefer-working',
    'D': 'pref-dislike-working',
    'C': 'pref-cannot-work'
};

/**
 * Navigates calPreferences to the given year/month and restricts
 * valid date selection to that month only.
 * Called on page ready (initial load) and by the monthlyView partial
 * whenever the user changes the displayed month.
 */
Page.syncCalendarToMonth = function (year, month) {
    var cal = Page.Widgets.calPreferences;
    if (!cal) { return; }

    // Build ISO date strings for the target month boundaries.
    // Use UTC-safe string construction to avoid timezone-related day shifts.
    var mm      = String(month + 1).padStart(2, '0');
    var mmNext  = String(month + 2).padStart(2, '0');
    var nextYear = year;
    var nextMonth = month + 1;
    if (nextMonth > 11) {
        nextMonth = 0;
        nextYear  = year + 1;
    }
    var startStr = year + '-' + mm + '-01';
    var endStr   = nextYear + '-' + String(nextMonth + 1).padStart(2, '0') + '-01';

    // Suppress the viewrender handler while we programmatically change the view
    // so it cannot trigger a recursive re-render that blanks the calendar.
    Page._suppressViewrender = true;

    cal.applyCalendarOptions('option', 'validRange', { start: startStr, end: endStr });
    cal.applyCalendarOptions('option', 'fixedWeekCount', false);
    cal.applyCalendarOptions('option', 'dayHeaderFormat', { weekday: 'long' });

    // gotoDate is a direct method on the WaveMaker calendar widget.
    // It navigates the FullCalendar view to the first day of the target month.
    cal.gotoDate(new Date(year, month, 1));

    // Re-enable viewrender after the current call stack clears.
    setTimeout(function () {
        Page._suppressViewrender = false;
        Page.renderPreferencesOnCalendar();
        Page.renderSpecificDatesOnCalendar();
    }, 200);
};

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    Page.selectedPreference = null;
    Page.prefClassMap = {
        'P': 'pref-prefer-working',
        'D': 'pref-dislike-working',
        'C': 'pref-cannot-work'
    };

    // Drag state
    Page.isDragging = false;
    Page.draggedDates = [];

    // Suppress flag — prevents viewrender from re-applying options
    // while syncCalendarToMonth is programmatically driving navigation.
    Page._suppressViewrender = false;

    // Plain JS array replacing mvPreferenceDates Model Variable
    Page.preferenceDates = [];

    // Initialize calendar to the current month.
    // The monthlyView partial also starts on the current month and will call
    // syncCalendarToMonth again from its own onReady once the partial is loaded.
    var now = new Date();
    Page.syncCalendarToMonth(now.getFullYear(), now.getMonth());

    // Attach drag listeners after calendar DOM is ready
    setTimeout(function () {
        Page.attachCalendarDragListeners();
        Page.renderSpecificDatesOnCalendar();
    }, 600);
};

/**
 * Reads stDateSpecific dataSet (dates in DD-MM-YYYY format) and applies
 * the pref-specific-date CSS class to matching FullCalendar day cells.
 */
Page.renderSpecificDatesOnCalendar = function () {
    var calWidget = Page.Widgets.calPreferences;
    if (!calWidget) { return; }
    var calEl = calWidget.nativeElement;
    if (!calEl) { return; }

    var specificDates = Page.Variables.stDateSpecific.dataSet || [];

    var prefData = Page.preferenceDates || [];
    var claimedDates = {};
    prefData.forEach(function (p) {
        if (p && p.date) {
            claimedDates[p.date] = true;
        }
    });

    calEl.querySelectorAll('[data-date]').forEach(function (cell) {
        cell.classList.remove('pref-specific-date');
    });

    specificDates.forEach(function (entry) {
        if (!entry || !entry.date) { return; }
        var parts = entry.date.split('-');
        if (parts.length !== 3) { return; }
        var isoDate = parts[2] + '-' + parts[1] + '-' + parts[0];

        if (claimedDates[isoDate]) { return; }

        var cell = calEl.querySelector('[data-date="' + isoDate + '"]');
        if (cell) {
            cell.classList.add('pref-specific-date');
        }
    });
};

/**
 * Called by FullCalendar when the view re-renders (e.g. internal navigation).
 * Guarded by Page._suppressViewrender so it is a no-op while
 * syncCalendarToMonth is programmatically driving navigation — this prevents
 * the recursive re-render loop that was blanking the calendar.
 */
Page.calPreferencesViewrender = function ($view) {
    if (Page._suppressViewrender) { return; }

    setTimeout(function () {
        Page.renderPreferencesOnCalendar();
        Page.renderSpecificDatesOnCalendar();
    }, 100);
};

/**
 * Updates the visual highlight on preference selector containers.
 */
Page.updatePreferenceHighlight = function (activeContainerName) {
    var containers = ['containerPreferWorking', 'containerDislikeWorking', 'containerCannotWork', 'containerClear'];
    containers.forEach(function (name) {
        var widget = Page.Widgets[name];
        if (!widget) { return; }
        if (name === activeContainerName) {
            widget.addClass('pref-selected');
        } else {
            widget.removeClass('pref-selected');
        }
    });
};

Page.btnPreferWorkingClick = function ($event, widget) {
    Page.selectedPreference = 'P';
    Page.updatePreferenceHighlight('containerPreferWorking');
};

Page.btnDislikeWorkingClick = function ($event, widget) {
    Page.selectedPreference = 'D';
    Page.updatePreferenceHighlight('containerDislikeWorking');
};

Page.btnCannotWorkClick = function ($event, widget) {
    Page.selectedPreference = 'C';
    Page.updatePreferenceHighlight('containerCannotWork');
};

Page.btnClearClick = function ($event, widget) {
    Page.selectedPreference = null;
    Page.updatePreferenceHighlight('containerClear');
};

/**
 * Reads preferenceDates and applies className to matching FullCalendar day cells.
 */
Page.renderPreferencesOnCalendar = function () {
    var calWidget = Page.Widgets.calPreferences;
    if (!calWidget) { return; }
    var calEl = calWidget.nativeElement;
    if (!calEl) { return; }

    var allPrefClasses = ['pref-prefer-working', 'pref-dislike-working', 'pref-cannot-work'];
    var prefData = Page.preferenceDates || [];

    calEl.querySelectorAll('[data-date]').forEach(function (cell) {
        allPrefClasses.forEach(function (cls) {
            cell.classList.remove(cls);
        });
    });

    prefData.forEach(function (p) {
        if (!p.date) { return; }
        var cls = p.className || Page.prefClassMap[p.prefs];
        if (!cls) { return; }
        var cell = calEl.querySelector('[data-date="' + p.date + '"]');
        if (cell) {
            cell.classList.add(cls);
        }
    });

    Page.renderSpecificDatesOnCalendar();
};

/**
 * Updates preferenceDates in memory for a given dateStr.
 */
Page.applyPreferenceToDate = function (dateStr) {
    if (Page.selectedPreference === null) { return; }

    var prefs = Page.selectedPreference;
    var prefData = _.cloneDeep(Page.preferenceDates) || [];
    var existing = _.findIndex(prefData, function (p) { return p.date === dateStr; });

    if (prefs === '' || prefs === null) {
        if (existing > -1) {
            prefData.splice(existing, 1);
        }
    } else {
        var className = Page.prefClassMap[prefs] || '';
        var newEntry = {
            date: dateStr,
            prefs: prefs,
            className: className,
            companyId: 1,
            employeeId: 1,
            compression: 0,
            editedBy: 1,
            isDayPrefs: true
        };
        if (existing > -1) {
            prefData[existing] = newEntry;
        } else {
            prefData.push(newEntry);
        }
    }

    Page.preferenceDates = prefData;
    Page.renderPreferencesOnCalendar();
};

/**
 * Invokes the batch API update with the current full preference list.
 */
Page.flushPreferenceUpdate = function () {
    var prefData = Page.preferenceDates || [];
    var apiPrefs = prefData.map(function (p) {
        return {
            date: p.date,
            companyId: p.companyId,
            employeeId: p.employeeId,
            prefs: (p.prefs && p.prefs.length === 1) ? p.prefs.repeat(96) : p.prefs,
            compression: p.compression || 0,
            editedBy: p.editedBy || 1,
            isDayPrefs: p.isDayPrefs !== undefined ? p.isDayPrefs : true
        };
    });

    Page.Variables.svDayPreferenceListUpdate.setInput('RequestBody', JSON.stringify({ preferences: apiPrefs }));
    Page.Variables.svDayPreferenceListUpdate.invoke();
};

/**
 * Attaches mousedown / mouseover listeners to FullCalendar day cells
 * for drag-paint behaviour.
 */
Page.attachCalendarDragListeners = function () {
    var calWidget = Page.Widgets.calPreferences;
    if (!calWidget) { return; }

    var calEl = calWidget.nativeElement;
    if (!calEl) { return; }

    function getDateStr(target) {
        var el = target;
        while (el && el !== calEl) {
            var d = el.getAttribute('data-date');
            if (d) { return d; }
            el = el.parentElement;
        }
        return null;
    }

    function onMouseDown(e) {
        if (e.target.closest('.fc-button, .fc-toolbar-chunk, .fc-toolbar')) { return; }
        var dateStr = getDateStr(e.target);
        if (!dateStr) { return; }
        Page.isDragging = true;
        Page.draggedDates = [dateStr];
        Page.applyPreferenceToDate(dateStr);
        e.preventDefault();
    }

    function onMouseOver(e) {
        if (!Page.isDragging) { return; }
        var dateStr = getDateStr(e.target);
        if (!dateStr || Page.draggedDates.indexOf(dateStr) !== -1) { return; }
        Page.draggedDates.push(dateStr);
        Page.applyPreferenceToDate(dateStr);
    }

    function onMouseUp() {
        if (!Page.isDragging) { return; }
        Page.isDragging = false;
        if (Page.draggedDates.length > 0) {
            Page.flushPreferenceUpdate();
        }
        Page.draggedDates = [];
    }

    calEl.removeEventListener('mousedown', calEl._wmDragMouseDown);
    calEl.removeEventListener('mouseover', calEl._wmDragMouseOver);
    calEl._wmDragMouseDown = onMouseDown;
    calEl._wmDragMouseOver = onMouseOver;
    calEl.addEventListener('mousedown', onMouseDown);
    calEl.addEventListener('mouseover', onMouseOver);

    if (!Page._wmDragMouseUpAttached) {
        document.addEventListener('mouseup', onMouseUp);
        Page._wmDragMouseUpAttached = true;
    }

    if (Page._wmCalMutationObserver) {
        Page._wmCalMutationObserver.disconnect();
    }
    var fcBody = calEl.querySelector('.fc-view-harness') || calEl;
    var observer = new MutationObserver(function (mutations) {
        var hasNewCells = mutations.some(function (m) {
            return Array.from(m.addedNodes).some(function (n) {
                return n.nodeType === 1 && (n.classList.contains('fc-day') || (n.querySelector && n.querySelector('.fc-day')));
            });
        });
        if (hasNewCells) {
            calEl.removeEventListener('mousedown', calEl._wmDragMouseDown);
            calEl.removeEventListener('mouseover', calEl._wmDragMouseOver);
            calEl._wmDragMouseDown = onMouseDown;
            calEl._wmDragMouseOver = onMouseOver;
            calEl.addEventListener('mousedown', onMouseDown);
            calEl.addEventListener('mouseover', onMouseOver);

            Page.renderPreferencesOnCalendar();
            Page.renderSpecificDatesOnCalendar();
        }
    });
    observer.observe(fcBody, { childList: true, subtree: true });
    Page._wmCalMutationObserver = observer;
};

Page.calendarDateClick = function ($dateInfo) {
    var clickedDate = new Date($dateInfo.date || $dateInfo.dateStr);
    var calEl = Page.Widgets.calPreferences;
    var currentView = calEl.getCalendar ? calEl.getCalendar().view : null;
    var viewMonth = currentView ? new Date(currentView.currentStart).getMonth() : new Date().getMonth();
    var viewYear  = currentView ? new Date(currentView.currentStart).getFullYear() : new Date().getFullYear();
    if (clickedDate.getMonth() !== viewMonth || clickedDate.getFullYear() !== viewYear) {
        return;
    }

    if (Page.selectedPreference === null) { return; }

    var date = new Date($dateInfo);
    var yyyy = date.getFullYear();
    var mm   = String(date.getMonth() + 1).padStart(2, '0');
    var dd   = String(date.getDate()).padStart(2, '0');
    var dateStr = yyyy + '-' + mm + '-' + dd;

    Page.applyPreferenceToDate(dateStr);
    Page.flushPreferenceUpdate();
};
