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
    /*
    switch (key) {
        case "prop1":
            // do something with newVal for property 'prop1'
            break;
        case "prop2":
            // do something with newVal for property 'prop2'
            break;
    }
    */
};

Prefab.onReady = function () {
    // this method will be triggered post initialization of the prefab.
    Prefab.initializeCurrentWeek();
    Prefab.updateWeekNavigationButtonCaptions();
};


Prefab.initializeCurrentWeek = function () {
    var today = moment();
    var weekDates = Prefab.getWeekDates(today, Prefab.startdayofweek);
    Prefab.formatDaysOfWeek(weekDates);
};


Prefab.getWeekDates = function (date, dayName) {
    const today = moment(date).startOf('day');
    const daysMap = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
    };

    const targetDay = daysMap[dayName.toLowerCase()];
    const currentDay = today.day();

    // Find the next occurrence of selected day (including today)
    let diff = targetDay - currentDay;
    // if (diff < 0) diff += 7;

    if (diff > 0) {
        // Day is upcoming → go to previous week
        diff -= 7;
    }

    const start = today.clone().add(diff, 'days');

    return {
        startDate: start.clone(),
        day1: start.clone(),
        day2: start.clone().add(1, 'days'),
        day3: start.clone().add(2, 'days'),
        day4: start.clone().add(3, 'days'),
        day5: start.clone().add(4, 'days'),
        day6: start.clone().add(5, 'days'),
        day7: start.clone().add(6, 'days'),
        endDate: start.clone().add(6, 'days')
    };
};

Prefab.formatDaysOfWeek = function (weekDates) {
    Prefab.weekDates = weekDates;
    Prefab.Variables.currentWeekVar.setData({
        startDate: Prefab.formatDateToUserTZ(weekDates.startDate),
        endDate: Prefab.formatDateToUserTZ(weekDates.endDate),
        weekLabel: Prefab.formatWeekLabel(weekDates.day1, weekDates.day7),
        mondayDate: weekDates.day1.format('MMM-DD ddd'),
        tuesdayDate: weekDates.day2.format('MMM-DD ddd'),
        wednesdayDate: weekDates.day3.format('MMM-DD ddd'),
        thursdayDate: weekDates.day4.format('MMM-DD ddd'),
        fridayDate: weekDates.day5.format('MMM-DD ddd'),
        saturdayDate: weekDates.day6.format('MMM-DD ddd'),
        sundayDate: weekDates.day7.format('MMM-DD ddd')
    });
    Prefab.startdate = weekDates.startDate.format('YYYY-MM-DD');
    Prefab.enddate = weekDates.endDate.format('YYYY-MM-DD');
    Prefab.notifyDateRangeChange(weekDates.startDate.format('YYYY-MM-DD'), weekDates.endDate.format('YYYY-MM-DD'));

    Prefab.selectedweekdataset = Prefab.Variables.currentWeekVar.dataSet;

}
Prefab.updateWeekNavigationButtonCaptions = function () {
    var offsets = [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
    var buttonNames = [
        'btnPrevious6Week',
        'btnPrevious5Week',
        'btnPrevious4Week',
        'btnPrevious3Week',
        'btnPrevious2Week',
        'btnPrevious1Week',
        'btnNext1Week',
        'btnNext2Week',
        'btnNext3Week',
        'btnNext4Week',
        'btnNext5Week',
        'btnNext6Week'
    ];

    for (var i = 0; i < offsets.length; i++) {
        var weekStartDate = Prefab.calculateWeekStartDate(offsets[i]);
        var formattedDate = Prefab.formatDateAsMonthDay(weekStartDate);
        Prefab.Widgets[buttonNames[i]].caption = formattedDate;
    }
};

Prefab.calculateWeekStartDate = function (offset) {
    var currentStart = moment(Prefab.Variables.currentWeekVar.dataSet.startDate);
    return currentStart.clone().add(offset * 7, 'days');
};

Prefab.formatDateAsMonthDay = function (date) {
    return moment(date).format('MMM-D');
};

Prefab.formatWeekLabel = function (startDate, endDate) {
    var monday = moment(startDate);
    return 'Week of ' + monday.format('MMM DD, YYYY');
};

Prefab.formatDateToUserTZ = function (momentDate) {
    return momentDate
        .clone()
        .local() // 🔥 converts to browser timezone
        .format('YYYY-MM-DD HH:mm:ss Z'); // Z gives offset like +05:30
};

Prefab.previousWeek = function () {
    var currentStart = moment(Prefab.Variables.currentWeekVar.dataSet.startDate);
    var newStart = currentStart.subtract(7, 'days');
    var weekDates = Prefab.getWeekDates(newStart, Prefab.startdayofweek);

    Prefab.formatDaysOfWeek(weekDates);
    Prefab.updateWeekNavigationButtonCaptions();
};

Prefab.nextWeek = function () {
    var currentStart = moment(Prefab.Variables.currentWeekVar.dataSet.startDate);
    var newStart = currentStart.add(7, 'days');
    var weekDates = Prefab.getWeekDates(newStart, Prefab.startdayofweek);

    Prefab.formatDaysOfWeek(weekDates);

    Prefab.updateWeekNavigationButtonCaptions();
};

Prefab.navigateToWeekOffset = function (offset) {
    if (!offset || offset < -6 || offset > 6) {
        console.error('Invalid week offset. Must be between -6 and +6.');
        return;
    }

    var currentStart = moment(Prefab.Variables.currentWeekVar.dataSet.startDate);
    var newStart = currentStart.add(offset * 7, 'days');
    var weekDates = Prefab.getWeekDates(newStart, Prefab.startdayofweek);

    Prefab.formatDaysOfWeek(weekDates);
    Prefab.updateWeekNavigationButtonCaptions();
};

Prefab.weekLabelContainerClick = function ($event, widget) {
    Prefab.Widgets.weekPickerCalendar.show = true;
};

Prefab.weekPickerCalendarSelect = function ($start, $end, $view, $data) {
    Prefab.Widgets.weekPickerCalendar.show = false;

    // Clone to prevent mutation of the original moment object passed by the calendar widget
    var selectedDate = moment($start).clone();
    var weekDates = Prefab.getWeekDates(selectedDate, Prefab.startdayofweek);

    Prefab.formatDaysOfWeek(weekDates);
    Prefab.updateWeekNavigationButtonCaptions();
};
Prefab.tabs1Change = function ($event, widget, newPaneIndex, oldPaneIndex) {
    if (newPaneIndex >= 0 && newPaneIndex <= 6) {
        let positionviewStartDate = getStartAndEndDateForPostionView(newPaneIndex + 1);
        Prefab.startdate = positionviewStartDate;
        Prefab.enddate = positionviewStartDate;
        Prefab.notifyDateRangeChange(positionviewStartDate, positionviewStartDate);
    }
    if (newPaneIndex == 7) {
        Prefab.startdate = Prefab.weekDates.startDate.format('YYYY-MM-DD');
        Prefab.enddate = Prefab.weekDates.endDate.format('YYYY-MM-DD');
        Prefab.notifyDateRangeChange(Prefab.weekDates.startDate.format('YYYY-MM-DD'), Prefab.weekDates.endDate.format('YYYY-MM-DD'));
    }
};

function getStartAndEndDateForPostionView(index) {
    return (Prefab.weekDates["day" + index]).format('YYYY-MM-DD')
}


Prefab.notifyDateRangeChange = function (startdate, enddate) {
    if (Prefab.onDateRangeChange) {
        Prefab.onDateRangeChange({
            startdate: startdate,
            enddate: enddate
        });
    }
};
