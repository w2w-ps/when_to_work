Partial.onReady = function () {
    const MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const today = new Date();
    let currentIndex = today.getMonth();
    let currentYear = today.getFullYear();

    // Tracks the calendar popup's displayed month/year (JS state — single source of truth for the label,
    // because calendar widget view updates are asynchronous and cannot be read back immediately).
    let calPopupMonth = currentIndex;
    let calPopupYear = currentYear;

    const leftLabels = ['lblFebruary', 'lblMarch', 'lblApril', 'lblMay'];
    const rightLabels = ['lblJuly', 'lblAugust', 'lblSeptember', 'lblOctober'];

    // Default label for the Select Date button
    const DEFAULT_SELECT_LABEL = 'Select date';

    function getWrappedIndex(idx) {
        return ((idx % 12) + 12) % 12;
    }

    function notifyPageOfMonthChange(year, month) {
        const mm = String(month + 1).padStart(2, '0');
        const dateStr = year + '-' + mm + '-01';

        Partial.Variables.selectedMonthDate.dataSet = { dataValue: dateStr };

        const parentScope = App.activePage;
        if (parentScope && parentScope.Variables && parentScope.Variables.activeMonthDate) {
            parentScope.Variables.activeMonthDate.dataSet = { dataValue: dateStr };
        }
        if (parentScope && typeof parentScope.syncCalendarToMonth === 'function') {
            parentScope.syncCalendarToMonth(year, month);
        }
        // Broadcast to all other registered partial instances on the same page
        if (parentScope && parentScope.__monthlyViewInstances) {
            parentScope.__monthlyViewInstances.forEach(function (instance) {
                if (typeof instance.syncToMonth === 'function') {
                    instance.syncToMonth(year, month);
                }
            });
        }
    }

    function renderMonthNav() {
        Partial.Widgets.lblCurrentMonth.caption = MONTHS[currentIndex] + ' ' + currentYear;

        leftLabels.forEach(function (widgetName, i) {
            const offset = i - 4;
            const idx = getWrappedIndex(currentIndex + offset);
            Partial.Widgets[widgetName].caption = MONTHS[idx];
        });

        rightLabels.forEach(function (widgetName, i) {
            const offset = i + 1;
            const idx = getWrappedIndex(currentIndex + offset);
            Partial.Widgets[widgetName].caption = MONTHS[idx];
        });

        var lblEl = Partial.Widgets.lblCurrentMonth.$element;
        if (lblEl) {
            var nativeEl = lblEl.nativeElement || lblEl[0] || lblEl;
            var appLabel = nativeEl && nativeEl.querySelector ? nativeEl.querySelector('.app-label') : null;
            if (appLabel) {
                appLabel.classList.add('text-danger');
            }
        }

        notifyPageOfMonthChange(currentYear, currentIndex);
    }

    function updateCalendarNavLabel() {
        Partial.Widgets.lblCalendarMonthYear.caption = MONTHS[calPopupMonth] + ' ' + calPopupYear;
    }

    function openCalendarAtCurrentMonth() {
        calPopupMonth = currentIndex;
        calPopupYear = currentYear;
        updateCalendarNavLabel();
        // gotoMonth accepts monthVal as 1–12 only; it navigates relative to the calendar's
        // currently displayed date, so we first set datavalue to anchor to the target year.
        Partial.Widgets.calendarPopup.datavalue = new Date(calPopupYear, calPopupMonth, 1);
        Partial.Widgets.calendarPopup.gotoDate();
    }

    /**
     * Formats a Date object into "Day, Mon DD" (e.g., "Mon, Jun 09").
     */
    function formatHoveredDate(date) {
        const day = DAYS_SHORT[date.getDay()];
        const mon = MONTHS_SHORT[date.getMonth()];
        const dd = String(date.getDate()).padStart(2, '0');
        return day + ', ' + mon + ' ' + dd;
    }

    /**
     * Attaches DOM mouseover delegation to the calendar popup's date cells.
     * Called after the calendar popup becomes visible so the cells are rendered.
     * Uses event delegation on the calendar container so it works even after
     * the calendar navigates to a different month (cells are re-rendered by FullCalendar).
     */
    function attachCalendarHoverListener() {
        var calWidget = Partial.Widgets.calendarPopup;
        if (!calWidget || !calWidget.$element) { return; } // React build guard
        var calElRaw = Partial.Widgets.calendarPopup.$element;
        var calEl = calElRaw ? (calElRaw.nativeElement || calElRaw[0] || calElRaw) : null;
        if (!calEl || !calEl.querySelector) {
            return;
        }

        // Remove any previously attached delegated listener to avoid duplicates
        calEl.removeEventListener('mouseover', calEl.__dateHoverListener);
        calEl.removeEventListener('mouseleave', calEl.__dateLeaveListener);

        // Delegate mouseover to any FullCalendar day cell (td[data-date])
        calEl.__dateHoverListener = function (e) {
            var cell = e.target.closest('td[data-date]');
            if (cell) {
                var dateStr = cell.getAttribute('data-date'); // format: YYYY-MM-DD
                if (dateStr) {
                    var parts = dateStr.split('-');
                    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                    var label = formatHoveredDate(d);
                    Partial.Variables.hoveredDateLabel.dataSet = { dataValue: label };
                }
            }
        };

        // Reset label when mouse leaves the entire calendar widget area
        calEl.__dateLeaveListener = function () {
            Partial.Variables.hoveredDateLabel.dataSet = { dataValue: DEFAULT_SELECT_LABEL };
        };

        calEl.addEventListener('mouseover', calEl.__dateHoverListener);
        calEl.addEventListener('mouseleave', calEl.__dateLeaveListener);
    }

    Partial.iconPrevMonthTap = function ($event, widget) {
        currentIndex--;
        if (currentIndex < 0) {
            currentIndex = 11;
            currentYear--;
        }
        renderMonthNav();
    };

    Partial.iconNextMonthTap = function ($event, widget) {
        currentIndex++;
        if (currentIndex > 11) {
            currentIndex = 0;
            currentYear++;
        }
        renderMonthNav();
    };

    Partial.monthLabelTap = function ($event, widget) {
        var allLabels = leftLabels.concat(rightLabels);
        var position = allLabels.indexOf(widget.name);

        if (position >= 0 && position <= 3) {
            var offset = position - 4;
            var newAbsolute = currentIndex + offset;
            if (newAbsolute < 0) { currentYear--; }
            currentIndex = getWrappedIndex(newAbsolute);
        } else if (position >= 4 && position <= 7) {
            var offset2 = position - 3;
            var newAbsolute2 = currentIndex + offset2;
            if (newAbsolute2 > 11) { currentYear++; }
            currentIndex = getWrappedIndex(newAbsolute2);
        }
        renderMonthNav();
    };

    Partial.calendarPopupDateclick = function ($dateInfo) {
        var selectedDate = new Date($dateInfo);
        currentIndex = selectedDate.getMonth();
        currentYear = selectedDate.getFullYear();
        renderMonthNav();
        Partial.Variables.isCalendarVisible.dataSet = false;
    };

    // Close (✕) button handler — only hides popup, no selection clearing
    Partial.calendarCloseClick = function ($event, widget) {
        Partial.Variables.isCalendarVisible.dataSet = false;
    };

    // "Select date" button handler — fires calendarPopupDateclick with the currently selected date
    Partial.calendarSelectDateClick = function ($event, widget) {
        var calWidget = Partial.Widgets.calendarPopup;
        var selectedDates = calWidget.selecteddates;
        if (selectedDates && selectedDates.length > 0) {
            var dateVal = new Date(selectedDates[0]).getTime();
            Partial.calendarPopupDateclick(dateVal);
        } else {
            // No explicit selection — use the calendar popup's displayed month/year first day
            const fallback = new Date(calPopupYear, calPopupMonth, 1).getTime();
            Partial.calendarPopupDateclick(fallback);
        }
    };

    // Single arrow ‹ — navigate to previous month (same year if possible).
    Partial.calendarPrevMonthTap = function ($event, widget) {
        calPopupMonth--;
        if (calPopupMonth < 0) {
            calPopupMonth = 11;
            calPopupYear--;
        }
        updateCalendarNavLabel();
        Partial.Widgets.calendarPopup.gotoPrevMonth();
    };

    // Single arrow › — navigate to next month (same year if possible).
    Partial.calendarNextMonthTap = function ($event, widget) {
        calPopupMonth++;
        if (calPopupMonth > 11) {
            calPopupMonth = 0;
            calPopupYear++;
        }
        updateCalendarNavLabel();
        Partial.Widgets.calendarPopup.gotoNextMonth();
    };

    // Double arrow « — navigate to the same month, previous year.
    Partial.calendarPrevYearTap = function ($event, widget) {
        calPopupYear--;
        updateCalendarNavLabel();
        Partial.Widgets.calendarPopup.gotoPrevYear();
    };

    // Double arrow » — navigate to the same month, next year.
    Partial.calendarNextYearTap = function ($event, widget) {
        calPopupYear++;
        updateCalendarNavLabel();
        Partial.Widgets.calendarPopup.gotoNextYear();
    };

    // Toggle calendar dropdown visibility on click; open syncs to current month
    Partial.centerNavContainerTap = function ($event, widget) {
        var isVisible = !Partial.Variables.isCalendarVisible.dataSet;
        Partial.Variables.isCalendarVisible.dataSet = isVisible;
        if (isVisible) {
            openCalendarAtCurrentMonth();
            // Defer listener attachment slightly to allow FullCalendar to finish rendering cells
            setTimeout(function () {
                attachCalendarHoverListener();
            }, 300);
        }
    };

    renderMonthNav();
    updateCalendarNavLabel();

    // Register this partial instance with the page for cross-partial sync
    var parentScope = App.activePage;
    if (parentScope) {
        if (!parentScope.__monthlyViewInstances) {
            parentScope.__monthlyViewInstances = [];
        }
        // Store a reference to this instance's sync function
        var instanceId = parentScope.__monthlyViewInstances.length;
        parentScope.__monthlyViewInstances.push({
            syncToMonth: function (year, month) {
                // Only update if this instance is not the one that triggered the change
                if (currentIndex !== month || currentYear !== year) {
                    currentIndex = month;
                    currentYear = year;
                    renderMonthNav();
                }
            }
        });
    }
};
