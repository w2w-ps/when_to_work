/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

Page.prefClassMap = {
    'P': 'pref-prefer-working',
    'D': 'pref-dislike-working',
    'C': 'pref-cannot-work'
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

    // Plain JS array replacing mvPreferenceDates Model Variable
    Page.preferenceDates = [];

    // Restrict calendar selection to current month via validRange
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var startStr = new Date(year, month, 1).toISOString().split('T')[0];
    var endStr = new Date(year, month + 1, 1).toISOString().split('T')[0];
    Page.Widgets.calPreferences.applyCalendarOptions('option', 'validRange', {
        start: startStr,
        end: endStr
    });
    Page.Widgets.calPreferences.applyCalendarOptions('option', 'fixedWeekCount', false);
    Page.Widgets.calPreferences.applyCalendarOptions('option', 'dayHeaderFormat', { weekday: 'long' });

    // Attach drag listeners after calendar DOM is ready
    setTimeout(function () {
        Page.attachCalendarDragListeners();
        Page.renderSpecificDatesOnCalendar();
    }, 600);
};

/**
 * Reads stDateSpecific dataSet (dates in DD-MM-YYYY format) and applies
 * the pref-specific-date CSS class to matching FullCalendar day cells.
 * Converts DD-MM-YYYY → YYYY-MM-DD to match [data-date] attribute format.
 *
 * Dates that already have a P/D/N preference entry in preferenceDates
 * are treated as "claimed" — they do NOT receive (or keep) the purple
 * pref-specific-date class so that the user's override colour shows through.
 */
Page.renderSpecificDatesOnCalendar = function () {
    var calWidget = Page.Widgets.calPreferences;
    if (!calWidget) return;
    var calEl = calWidget.nativeElement;
    if (!calEl) return;

    var specificDates = Page.Variables.stDateSpecific.dataSet || [];

    // Build a Set of dates (YYYY-MM-DD) that already have a P/D/N preference
    // so we can skip re-stamping purple on those cells (Task 1.1)
    var prefData = Page.preferenceDates || [];
    var claimedDates = {};
    prefData.forEach(function (p) {
        if (p && p.date) {
            claimedDates[p.date] = true;
        }
    });

    // Task 1.3 — existing bulk-clear pass: unchanged and still correct.
    // Removes pref-specific-date from every day cell before re-stamping.
    calEl.querySelectorAll('[data-date]').forEach(function (cell) {
        cell.classList.remove('pref-specific-date');
    });

    // Convert DD-MM-YYYY → YYYY-MM-DD and apply class only to un-claimed cells (Task 1.2)
    specificDates.forEach(function (entry) {
        if (!entry || !entry.date) return;
        var parts = entry.date.split('-');
        if (parts.length !== 3) return;
        // parts[0]=DD, parts[1]=MM, parts[2]=YYYY
        var isoDate = parts[2] + '-' + parts[1] + '-' + parts[0];

        // Task 1.2: skip purple re-stamp if this date has been overridden with P/D/N
        if (claimedDates[isoDate]) return;

        var cell = calEl.querySelector('[data-date="' + isoDate + '"]');
        if (cell) {
            cell.classList.add('pref-specific-date');
        }
    });
};

/**
 * Updates validRange whenever the user navigates to a different month.
 * $view is the FullCalendar view object containing currentStart.
 */
Page.calPreferencesViewrender = function ($view) {
    var viewStart = $view && $view.currentStart ? new Date($view.currentStart) : new Date();
    var year = viewStart.getFullYear();
    var month = viewStart.getMonth();
    var startStr = new Date(year, month, 1).toISOString().split('T')[0];
    var endStr = new Date(year, month + 1, 1).toISOString().split('T')[0];
    Page.Widgets.calPreferences.applyCalendarOptions('option', 'validRange', {
        start: startStr,
        end: endStr
    });
    Page.Widgets.calPreferences.applyCalendarOptions('option', 'fixedWeekCount', false);
    Page.Widgets.calPreferences.applyCalendarOptions('option', 'dayHeaderFormat', { weekday: 'long' });

    // Re-apply specific-date highlights after view re-renders
    setTimeout(function () {
        Page.renderSpecificDatesOnCalendar();
    }, 100);
};

/**
 * Updates the visual highlight on preference selector containers.
 * Adds 'pref-selected' class to the active container and removes it from others.
 */
Page.updatePreferenceHighlight = function (activeContainerName) {
    var containers = ['containerPreferWorking', 'containerDislikeWorking', 'containerCannotWork', 'containerClear'];
    containers.forEach(function (name) {
        var widget = Page.Widgets[name];
        if (!widget) return;
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
,
Page.btnCannotWorkClick = function ($event, widget) {
    Page.selectedPreference = 'C';
    Page.updatePreferenceHighlight('containerCannotWork');
};

Page.btnClearClick = function ($event, widget) {
    Page.selectedPreference = ;
    Page.updatePreferenceHighlight('containerClear');
};

/**
 * Reads preferenceDates and applies className to matching FullCalendar day cells.
 * Clears old pref classes first, then paints current stored preferences.
 * Also re-applies specific-date purple highlights after painting preferences.
 */
Page.renderPreferencesOnCalendar = function () {
    var calWidget = Page.Widgets.calPreferences;
    if (!calWidget) return;
    var calEl = calWidget.nativeElement;
    if (!calEl) return;

    var allPrefClasses = ['pref-prefer-working', 'pref-dislike-working', 'pref-cannot-work'];
    var prefData = Page.preferenceDates || [];

    // Clear all existing preference classes from every day cell
    calEl.querySelectorAll('[data-date]').forEach(function (cell) {
        allPrefClasses.forEach(function (cls) {
            cell.classList.remove(cls);
        });
    });

    // Apply stored preference className to matching day cells
    // Falls back to deriving className from prefs if className is missing
    prefData.forEach(function (p) {
        if (!p.date) return;
        var cls = p.className || Page.prefClassMap[p.prefs];
        if (!cls) return;
        var cell = calEl.querySelector('[data-date="' + p.date + '"]');
        if (cell) {
            cell.classList.add(cls);
        }
    });

    // Re-apply specific-date purple highlights after preference repaint.
    // renderSpecificDatesOnCalendar will skip any date already in preferenceDates.
    Page.renderSpecificDatesOnCalendar();
};

/**
 * Updates preferenceDates in memory for a given dateStr.
 * Does NOT invoke the API — call is batched to drag-end (mouseup).
 */
Page.applyPreferenceToDate = function (dateStr) {
    if (Page.selectedPreference === null) {
        return;
    }

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

    // Re-render calendar colors after updating in-memory data
    Page.renderPreferencesOnCalendar();
};

/**
 * Invokes the batch API update with the current full preference list.
 * Single-character prefs (e.g. "P", "D", "N") are expanded to 96 repetitions
 * before being sent in the payload; already-expanded strings are sent as-is.
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
 * for drag-paint behaviour.  Also sets up a MutationObserver so that
 * listeners are re-attached whenever the calendar re-renders (month
 * navigation, view change, etc.).
 */
Page.attachCalendarDragListeners = function () {
    var calWidget = Page.Widgets.calPreferences;
    if (!calWidget) {
        return;
    }

    var calEl = calWidget.nativeElement;
    if (!calEl) {
        return;
    }

    // --- helper: resolve date string from a cell or its ancestor ---
    function getDateStr(target) {
        var el = target;
        while (el && el !== calEl) {
            var d = el.getAttribute('data-date');
            if (d) {
                return d;
            }
            el = el.parentElement;
        }
        return null;
    }

    // --- mousedown on any day cell ---
    function onMouseDown(e) {
        // Ignore navigation buttons / header controls
        if (e.target.closest('.fc-button, .fc-toolbar-chunk, .fc-toolbar')) {
            return;
        }
        var dateStr = getDateStr(e.target);
        if (!dateStr) {
            return;
        }
        Page.isDragging = true;
        Page.draggedDates = [dateStr];
        Page.applyPreferenceToDate(dateStr);
        // Prevent text-selection ghost during drag
        e.preventDefault();
    }

    // --- mouseover on any day cell (only while dragging) ---
    function onMouseOver(e) {
        if (!Page.isDragging) {
            return;
        }
        var dateStr = getDateStr(e.target);
        if (!dateStr || Page.draggedDates.indexOf(dateStr) !== -1) {
            return;
        }
        Page.draggedDates.push(dateStr);
        Page.applyPreferenceToDate(dateStr);
    }

    // --- mouseup on document: end drag and flush API ---
    function onMouseUp() {
        if (!Page.isDragging) {
            return;
        }
        Page.isDragging = false;
        if (Page.draggedDates.length > 0) {
            Page.flushPreferenceUpdate();
        }
        Page.draggedDates = [];
    }

    // Attach cell-level listeners (event delegation on the calendar root)
    calEl.removeEventListener('mousedown', calEl._wmDragMouseDown);
    calEl.removeEventListener('mouseover', calEl._wmDragMouseOver);
    calEl._wmDragMouseDown = onMouseDown;
    calEl._wmDragMouseOver = onMouseOver;
    calEl.addEventListener('mousedown', onMouseDown);
    calEl.addEventListener('mouseover', onMouseOver);

    // Attach document mouseup only once
    if (!Page._wmDragMouseUpAttached) {
        document.addEventListener('mouseup', onMouseUp);
        Page._wmDragMouseUpAttached = true;
    }

    // --- MutationObserver: re-attach after calendar re-renders ---
    if (Page._wmCalMutationObserver) {
        Page._wmCalMutationObserver.disconnect();
    }
    var fcBody = calEl.querySelector('.fc-view-harness') || calEl;
    var observer = new MutationObserver(function (mutations) {
        var hasNewCells = mutations.some(function (m) {
            return Array.from(m.addedNodes).some(function (n) {
                return n.nodeType === 1 && (n.classList.contains('fc-day') || n.querySelector && n.querySelector('.fc-day'));
            });
        });
        if (hasNewCells) {
            // Re-delegate by simply re-registering on the same calEl
            calEl.removeEventListener('mousedown', calEl._wmDragMouseDown);
            calEl.removeEventListener('mouseover', calEl._wmDragMouseOver);
            calEl._wmDragMouseDown = onMouseDown;
            calEl._wmDragMouseOver = onMouseOver;
            calEl.addEventListener('mousedown', onMouseDown);
            calEl.addEventListener('mouseover', onMouseOver);

            // Re-render preference colors after calendar navigates to a new month
            Page.renderPreferencesOnCalendar();

            // Re-apply specific-date purple highlights after calendar re-renders
            Page.renderSpecificDatesOnCalendar();
        }
    });
    observer.observe(fcBody, { childList: true, subtree: true });
    Page._wmCalMutationObserver = observer;
};

Page.calendarDateClick = function ($dateInfo) {
    // Guard: reject dates outside current displayed month
    var clickedDate = new Date($dateInfo.date || $dateInfo.dateStr);
    var calEl = Page.Widgets.calPreferences;
    var currentView = calEl.getCalendar ? calEl.getCalendar().view : null;
    var viewMonth = currentView ? new Date(currentView.currentStart).getMonth() : new Date().getMonth();
    var viewYear = currentView ? new Date(currentView.currentStart).getFullYear() : new Date().getFullYear();
    if (clickedDate.getMonth() !== viewMonth || clickedDate.getFullYear() !== viewYear) {
        return; // Ignore clicks on dates outside the current month
    }

    if (Page.selectedPreference === null) {
        return;
    }

    var date = new Date($dateInfo);
    var yyyy = date.getFullYear();
    var mm = String(date.getMonth() + 1).padStart(2, '0');
    var dd = String(date.getDate()).padStart(2, '0');
    var dateStr = yyyy + '-' + mm + '-' + dd;

    // Re-use the shared helper (updates memory + re-renders)
    Page.applyPreferenceToDate(dateStr);

    // Single-click: flush immediately
    Page.flushPreferenceUpdate();
};
