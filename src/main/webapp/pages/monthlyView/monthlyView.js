Partial.onReady = function () {
    var MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    var today = new Date();
    var currentIndex = today.getMonth();
    var currentYear = today.getFullYear();

    // Tracks the calendar popup's displayed month/year (JS state — single source of truth for the label,
    // because calendar widget view updates are asynchronous and cannot be read back immediately).
    var calPopupMonth = currentIndex;
    var calPopupYear = currentYear;

    var leftLabels = ['lblFebruary', 'lblMarch', 'lblApril', 'lblMay'];
    var rightLabels = ['lblJuly', 'lblAugust', 'lblSeptember', 'lblOctober'];

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
    // We update calPopupMonth/calPopupYear state first (JS is synchronous and reliable),
    // then call gotoPrevMonth() to move the widget.  We do NOT read back currentview.start
    // because the widget renders asynchronously and the view object would still hold the old value.
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
    // Use gotoPrevYear() (supported widget method) instead of gotoMonth() which only accepts
    // a single monthVal (1–12) parameter and cannot target a specific year.
    Partial.calendarPrevYearTap = function ($event, widget) {
        calPopupYear--;
        updateCalendarNavLabel();
        Partial.Widgets.calendarPopup.gotoPrevYear();
    };

    // Double arrow » — navigate to the same month, next year.
    // Use gotoNextYear() (supported widget method) instead of gotoMonth().
    Partial.calendarNextYearTap = function ($event, widget) {
        calPopupYear++;
        updateCalendarNavLabel();
        Partial.Widgets.calendarPopup.gotoNextYear();
    };

    // When calendar popup becomes visible, sync it to the current month
    Partial.centerNavWrapperMouseenter = function ($event, widget) {
        Partial.Variables.isCalendarVisible.dataSet = true;
        openCalendarAtCurrentMonth();
    };

    renderMonthNav();
    updateCalendarNavLabel();
};

Partial.centerNavWrapperMouseleave = function ($event, widget) {
    Partial.Variables.isCalendarVisible.dataSet = false;
};
