Partial.onReady = function () {
    var MONTHS = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];

    var today = new Date();
    var currentIndex = today.getMonth();
    var currentYear  = today.getFullYear();

    var leftLabels  = ['lblFebruary','lblMarch','lblApril','lblMay'];
    var rightLabels = ['lblJuly','lblAugust','lblSeptember','lblOctober'];

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

        leftLabels.forEach(function(widgetName, i) {
            var offset = i - 4;
            var idx = getWrappedIndex(currentIndex + offset);
            Partial.Widgets[widgetName].caption = MONTHS[idx];
        });

        rightLabels.forEach(function(widgetName, i) {
            var offset = i + 1;
            var idx = getWrappedIndex(currentIndex + offset);
            Partial.Widgets[widgetName].caption = MONTHS[idx];
        });

        Partial.Widgets.lblCurrentMonth.$element.find('.app-label').addClass('text-danger');

        notifyPageOfMonthChange(currentYear, currentIndex);
    }

    Partial.iconPrevMonthTap = function($event, widget) {
        currentIndex--;
        if (currentIndex < 0) {
            currentIndex = 11;
            currentYear--;
        }
        renderMonthNav();
    };

    Partial.iconNextMonthTap = function($event, widget) {
        currentIndex++;
        if (currentIndex > 11) {
            currentIndex = 0;
            currentYear++;
        }
        renderMonthNav();
    };

    Partial.monthLabelTap = function($event, widget) {
        var allLabels = leftLabels.concat(rightLabels);
        var position  = allLabels.indexOf(widget.name);

        if (position >= 0 && position <= 3) {
            var offset = position - 4;
            var newAbsolute = currentIndex + offset;
            if (newAbsolute < 0) { currentYear--; }
            currentIndex = getWrappedIndex(newAbsolute);
        } else if (position >= 4 && position <= 7) {
            var offset = position - 3;
            var newAbsolute = currentIndex + offset;
            if (newAbsolute > 11) { currentYear++; }
            currentIndex = getWrappedIndex(newAbsolute);
        }
        renderMonthNav();
    };

    Partial.calendarPopupDateclick = function($dateInfo) {
        var selectedDate = new Date($dateInfo);
        currentIndex = selectedDate.getMonth();
        currentYear  = selectedDate.getFullYear();
        renderMonthNav();
        Partial.Variables.isCalendarVisible.dataSet = false;
    };

    renderMonthNav();
};

Partial.centerNavWrapperMouseenter = function($event, widget) {
    Partial.Variables.isCalendarVisible.dataSet = true;
};

Partial.centerNavWrapperMouseleave = function($event, widget) {
    Partial.Variables.isCalendarVisible.dataSet = false;
};
