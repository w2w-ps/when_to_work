/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    Page.selectedPreference = null;
    Page.prefClassMap = {
        'P': 'pref-prefer-working',
        'D': 'pref-dislike-working',
        'N': 'pref-cannot-work'
    };

    // Drag state
    Page.isDragging = false;
    Page.draggedDates = [];

    // Attach drag listeners after calendar DOM is ready
    setTimeout(function () {
        Page.attachCalendarDragListeners();
    }, 600);
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

Page.btnCannotWorkClick = function ($event, widget) {
    Page.selectedPreference = 'N';
    Page.updatePreferenceHighlight('containerCannotWork');
};

Page.btnClearClick = function ($event, widget) {
    Page.selectedPreference = '';
    Page.updatePreferenceHighlight('containerClear');
};

/**
 * Reads mvPreferenceDates and applies className to matching FullCalendar day cells.
 * Clears old pref classes first, then paints current stored preferences.
 */
Page.renderPreferencesOnCalendar = function () {
    var calWidget = Page.Widgets.calPreferences;
    if (!calWidget) return;
    var calEl = calWidget.nativeElement;
    if (!calEl) return;

    var allPrefClasses = ['pref-prefer-working', 'pref-dislike-working', 'pref-cannot-work'];
    var prefData = Page.Variables.mvPreferenceDates.dataSet || [];

    // Clear all existing preference classes from every day cell
    calEl.querySelectorAll('[data-date]').forEach(function (cell) {
        allPrefClasses.forEach(function (cls) {
            cell.classList.remove(cls);
        });
    });

    // Apply stored preference className to matching day cells
    prefData.forEach(function (p) {
        if (!p.date || !p.className) return;
        var cell = calEl.querySelector('[data-date="' + p.date + '"]');
        if (cell) {
            cell.classList.add(p.className);
        }
    });
};

/**
 * Updates mvPreferenceDates in memory for a given dateStr.
 * Does NOT invoke the API — call is batched to drag-end (mouseup).
 */
Page.applyPreferenceToDate = function (dateStr) {
    if (Page.selectedPreference === null) {
        return;
    }

    var prefs = Page.selectedPreference;
    var prefData = _.cloneDeep(Page.Variables.mvPreferenceDates.dataSet) || [];
    var existing = _.findIndex(prefData, function (p) { return p.date === dateStr; });

    if (prefs === '' || prefs === null) {
        if (existing > -1) {
            prefData.splice(existing, 1);
        }
    } else {
        var newEntry = {
            date: dateStr,
            prefs: prefs,
            className: Page.prefClassMap[prefs],
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

    Page.Variables.mvPreferenceDates.setData(prefData);

    // Re-render calendar colors after updating in-memory data
    Page.renderPreferencesOnCalendar();
};

/**
 * Invokes the batch API update with the current full preference list.
 */
Page.flushPreferenceUpdate = function () {
    var prefData = Page.Variables.mvPreferenceDates.dataSet || [];
    var apiPrefs = prefData.map(function (p) {
        return {
            date: p.date,
            companyId: p.companyId,
            employeeId: p.employeeId,
            prefs: p.prefs,
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
        }
    });
    observer.observe(fcBody, { childList: true, subtree: true });
    Page._wmCalMutationObserver = observer;
};

Page.calendarDateClick = function ($dateInfo) {
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
