Partial.onReady = function () {
    var MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    var DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var today = new Date();
    var currentIndex = today.getMonth();
    var currentYear = today.getFullYear();

    // Tracks the calendar popup's displayed month/year (JS state — single source of truth for the label,
    // because calendar widget view updates are asynchronous and cannot be read back immediately).
    var calPopupMonth = currentIndex;
    var calPopupYear = currentYear;

    var leftLabels = ['lblFebruary', 'lblMarch', 'lblApril', 'lblMay'];
    var rightLabels = ['lblJuly', 'lblAugust', 'lblSeptember', 'lblOctober'];

    // Default label for the Select Date button
    var DEFAULT_SELECT_LABEL = 'Select date';

    function getWrappedIndex(idx) {
        return ((idx % 12) + 12) % 12;
    }

    function notifyPageOfMonthChange(year, month) {
        var mm = String(month + 1).padStart(2, '0');
        var dateStr = year + '-' + mm + '-01';

        Partial.Variables.selectedMonthDate.dataSet = { dataValue: dateStr };

        var parentScope = Partial.App.activePage;
        if (parentScope && parentScope.Variables && parentScope.Variables.activeMonthDate) {
            parentScope.Variables.activeMonthDate.dataSet = { dataValue: dateStr };
        }
        if (parentScope && typeof parentScope.syncCalendarToMonth === 'function') {
            parentScope.syncCalendarToMonth(year, month);
        }
    }

    function renderMonthNav() {
        Partial.Widgets.lblCurrentMonth.caption = MONTHS[currentIndex] + ' ' + currentYear;

        leftLabels.forEach(function (widgetName, i) {
            var offset = i - 4;
            var idx = getWrappedIndex(currentIndex + offset);
            Partial.Widgets[widgetName].caption = MONTHS[idx];
        });

        rightLabels.forEach(function (widgetName, i) {
            var offset = i + 1;
            var idx = getWrappedIndex(currentIndex + offset);
            Partial.Widgets[widgetName].caption = MONTHS[idx];
        });

        Partial.Widgets.lblCurrentMonth.$element.find('.app-label').addClass('text-danger');

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
        var day = DAYS_SHORT[date.getDay()];
        var mon = MONTHS_SHORT[date.getMonth()];
        var dd = String(date.getDate()).padStart(2, '0');
        return day + ', ' + mon + ' ' + dd;
    }

    /**
     * Attaches DOM mouseover delegation to the calendar popup's date cells.
     * Called after the calendar popup becomes visible so the cells are rendered.
     * Uses event delegation on the calendar container so it works even after
     * the calendar navigates to a different month (cells are re-rendered by FullCalendar).
     */
    function attachCalendarHoverListener() {
        var calEl = Partial.Widgets.calendarPopup.$element;
        if (!calEl || !calEl.length) {
            return;
        }

        // Remove any previously attached delegated listener to avoid duplicates
        calEl.off('mouseover.dateHover');
        calEl.off('mouseleave.dateHover');

        // Delegate mouseover to any FullCalendar day cell (td[data-date]) or
        // the inner day-number anchor/span that carries the date string
        calEl.on('mouseover.dateHover', 'td[data-date]', function (e) {
            var dateStr = $(this).attr('data-date'); // format: YYYY-MM-DD
            if (dateStr) {
                // Parse parts directly to avoid timezone offset issues with new Date(string)
                var parts = dateStr.split('-');
                var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                var label = formatHoveredDate(d);
                Partial.Variables.hoveredDateLabel.dataSet = { dataValue: label };
            }
        });

        // Reset label when mouse leaves the entire calendar widget area
        calEl.on('mouseleave.dateHover', function () {
            Partial.Variables.hoveredDateLabel.dataSet = { dataValue: DEFAULT_SELECT_LABEL };
        });
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
            var fallback = new Date(calPopupYear, calPopupMonth, 1).getTime();
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
};
