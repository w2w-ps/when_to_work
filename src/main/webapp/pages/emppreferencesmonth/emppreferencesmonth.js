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
    const cal = Page.Widgets.calPreferences;
    if (!cal) { return; }

    const mm = String(month + 1).padStart(2, '0');
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 11) {
        nextMonth = 0;
        nextYear = year + 1;
    }
    const startStr = year + '-' + mm + '-01';
    const endStr = nextYear + '-' + String(nextMonth + 1).padStart(2, '00') + '-01';

    Page._suppressViewrender = true;

    cal.applyCalendarOptions('option', 'validRange', { start: startStr, end: endStr });
    cal.applyCalendarOptions('option', 'fixedWeekCount', false);
    cal.applyCalendarOptions('option', 'dayHeaderFormat', { weekday: 'long' });
    cal.gotoDate(new Date(year, month, 1));

    setTimeout(function () {
        Page._suppressViewrender = false;
        Page.renderPreferencesOnCalendar();
        Page.renderSpecificDatesOnCalendar();
        Page.renderDayPrefsHighlights();
        Page.fetchPreferenceRange(year, month);
    }, 200);
};

Page.onReady = function () {
    Page.selectedPreference = 'P';
    Page.prefClassMap = {
        'P': 'pref-prefer-working',
        'D': 'pref-dislike-working',
        'C': 'pref-cannot-work'
    };

    Page.isDragging = false;
    Page.draggedDates = [];
    Page._suppressViewrender = false;
    Page._lastDayPrefsData = [];
    Page.preferenceDates = [];

    const now = new Date();
    Page.syncCalendarToMonth(now.getFullYear(), now.getMonth());

    setTimeout(function () {
        Page.attachCalendarDragListeners();
        Page.renderSpecificDatesOnCalendar();
    }, 600);
};

Page.fetchPreferenceRange = function (year, month) {
    debugger;
    const mm = String(month + 1).padStart(2, '0');
    const startDate = year + '-' + mm + '-01';
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = year + '-' + mm + '-' + String(lastDay).padStart(2, '0');

    Page.Variables.svGetPreferenceRange.invoke({
        inputFields: {
            startDate: startDate,
            endDate: endDate,
            companyId: '1',
            employeeId: '1'
        }
    });
};

Page.svGetPreferenceRangeonSuccess = function (variable, data, options) {
    debugger;
    Page._lastDayPrefsData = Array.isArray(data) ? data : [];
    // Delay to ensure calendar DOM cells are fully painted before applying highlights
    setTimeout(function () {
        Page.renderDayPrefsHighlights();
    }, 300);
};

Page.renderDayPrefsHighlights = function () {
    debugger;
    const calWidget = Page.Widgets.calPreferences;
    if (!calWidget) { return; }
    const calEl = calWidget.nativeElement;
    if (!calEl) { return; }

    calEl.querySelectorAll('[data-date]').forEach(function (cell) {
        cell.classList.remove('pref-day-prefs-highlight');
    });

    const data = Page._lastDayPrefsData || [];
    data.forEach(function (entry) {
        if (!entry || !entry.date || !entry.isDayPrefs) { return; }
        const cell = calEl.querySelector('[data-date="' + entry.date + '"]');
        if (cell) {
            cell.classList.add('pref-day-prefs-highlight');
        }
    });
};

Page.renderSpecificDatesOnCalendar = function () {
    const calWidget = Page.Widgets.calPreferences;
    if (!calWidget) { return; }
    const calEl = calWidget.nativeElement;
    if (!calEl) { return; }

    const specificDates = Page.Variables.stDateSpecific.dataSet || [];
    const prefData = Page.preferenceDates || [];
    const claimedDates = {};
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
        const parts = entry.date.split('-');
        if (parts.length !== 3) { return; }
        const isoDate = parts[2] + '-' + parts[1] + '-' + parts[0];
        if (claimedDates[isoDate]) { return; }
        const cell = calEl.querySelector('[data-date="' + isoDate + '"]');
        if (cell) {
            cell.classList.add('pref-specific-date');
        }
    });
};

Page.calPreferencesViewrender = function ($view) {
    if (Page._suppressViewrender) { return; }

    setTimeout(function () {
        Page.renderPreferencesOnCalendar();
        Page.renderSpecificDatesOnCalendar();
        Page.renderDayPrefsHighlights();
    }, 100);
};

Page.updatePreferenceHighlight = function (activeContainerName) {
    const containers = ['containerPreferWorking', 'containerDislikeWorking', 'containerCannotWork', 'containerClear'];
    containers.forEach(function (name) {
        const widget = Page.Widgets[name];
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

Page.renderPreferencesOnCalendar = function () {
    const calWidget = Page.Widgets.calPreferences;
    if (!calWidget) { return; }
    const calEl = calWidget.nativeElement;
    if (!calEl) { return; }

    const allPrefClasses = ['pref-prefer-working', 'pref-dislike-working', 'pref-cannot-work'];
    const prefData = Page.preferenceDates || [];

    calEl.querySelectorAll('[data-date]').forEach(function (cell) {
        allPrefClasses.forEach(function (cls) {
            cell.classList.remove(cls);
        });
    });

    prefData.forEach(function (p) {
        if (!p.date) { return; }
        const cls = p.className || Page.prefClassMap[p.prefs];
        if (!cls) { return; }
        const cell = calEl.querySelector('[data-date="' + p.date + '"]');
        if (cell) {
            cell.classList.add(cls);
        }
    });

    Page.renderSpecificDatesOnCalendar();
    // Always re-apply isDayPrefs highlights last so they are never lost
    Page.renderDayPrefsHighlights();
};

Page.applyPreferenceToDate = function (dateStr) {
    const prefs = Page.selectedPreference;
    const prefData = _.cloneDeep(Page.preferenceDates) || [];
    const existing = _.findIndex(prefData, function (p) { return p.date === dateStr; });

    if (prefs === null || prefs === '') {
        if (existing > -1) {
            prefData.splice(existing, 1);
        }
    } else {
        const className = Page.prefClassMap[prefs] || '';
        const newEntry = {
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

Page.flushPreferenceUpdate = function () {
    const prefData = Page.preferenceDates || [];
    const apiPrefs = prefData.map(function (p) {
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

Page.attachCalendarDragListeners = function () {
    const calWidget = Page.Widgets.calPreferences;
    if (!calWidget) { return; }

    const calEl = calWidget.nativeElement;
    if (!calEl) { return; }

    function getDateStr(target) {
        let el = target;
        while (el && el !== calEl) {
            const d = el.getAttribute('data-date');
            if (d) { return d; }
            el = el.parentElement;
        }
        return null;
    }

    function onMouseDown(e) {
        if (e.target.closest('.fc-button, .fc-toolbar-chunk, .fc-toolbar')) { return; }
        const dateStr = getDateStr(e.target);
        if (!dateStr) { return; }
        Page.isDragging = true;
        Page.draggedDates = [dateStr];
        Page.applyPreferenceToDate(dateStr);
        e.preventDefault();
    }

    function onMouseOver(e) {
        if (!Page.isDragging) { return; }
        const dateStr = getDateStr(e.target);
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
    const fcBody = calEl.querySelector('.fc-view-harness') || calEl;
    const observer = new MutationObserver(function (mutations) {
        const hasNewCells = mutations.some(function (m) {
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
            Page.renderDayPrefsHighlights();
        }
    });
    observer.observe(fcBody, { childList: true, subtree: true });
    Page._wmCalMutationObserver = observer;
};

Page.calendarDateClick = function ($dateInfo) {
    const clickedDate = new Date($dateInfo.date || $dateInfo.dateStr);
    const calEl = Page.Widgets.calPreferences;
    const currentView = calEl.getCalendar ? calEl.getCalendar().view : null;
    const viewMonth = currentView ? new Date(currentView.currentStart).getMonth() : new Date().getMonth();
    const viewYear = currentView ? new Date(currentView.currentStart).getFullYear() : new Date().getFullYear();
    if (clickedDate.getMonth() !== viewMonth || clickedDate.getFullYear() !== viewYear) {
        return;
    }

    const date = new Date($dateInfo);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = yyyy + '-' + mm + '-' + dd;

    Page.applyPreferenceToDate(dateStr);
    Page.flushPreferenceUpdate();
};
