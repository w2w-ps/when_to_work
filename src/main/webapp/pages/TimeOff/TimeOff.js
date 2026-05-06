/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* Shared month/day arrays — mirrors monthlyView partial pattern */
var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
var MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/*
 * Closure-local state — mirrors monthlyView pattern.
 * Avoids mutable-object binding issues caused by in-place mutation of
 * a WaveMaker ModelVariable's dataSet object.
 */
var currentMonth, currentYear;

/**
 * Formats a Date into "Day, Mon D" (e.g. "Mon, Jun 9").
 * Mirrors monthlyView's formatHoveredDate() exactly.
 */
function formatHoveredDate(date) {
    return DAYS_SHORT[date.getDay()] + ', ' + MONTHS_SHORT[date.getMonth()] + ' ' + date.getDate();
}

/**
 * Publishes the active month as a YYYY-MM-01 string to activeMonthDate variable.
 * Mirrors monthlyView's notifyPageOfMonthChange().
 */
function notifyPageOfMonthChange(year, month) {
    var mm = String(month + 1).padStart(2, '0');
    Page.Variables.activeMonthDate.dataSet = { dataValue: year + '-' + mm + '-01' };
}

/**
 * Single source of truth for updating the month/year label and notifying
 * the data layer. Mirrors monthlyView's renderMonthNav() pattern.
 */
function renderMonthNav() {
    Page.Variables.calMonthYear.dataSet = { dataValue: MONTHS[currentMonth] + ' ' + currentYear };
    notifyPageOfMonthChange(currentYear, currentMonth);
}

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    var today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    renderMonthNav();
    Page.Variables.calSelectedDateDisplay.dataSet = { dataValue: 'Select date' };
};

Page.btnPrevMonthClick = function ($event, widget) {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderMonthNav();
    Page.Widgets.timeOffCalendar.gotoPrevMonth();
};

Page.btnNextMonthClick = function ($event, widget) {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderMonthNav();
    Page.Widgets.timeOffCalendar.gotoNextMonth();
};

Page.btnPrevYearClick = function ($event, widget) {
    currentYear--;
    renderMonthNav();
    Page.Widgets.timeOffCalendar.gotoPrevYear();
};

Page.btnNextYearClick = function ($event, widget) {
    currentYear++;
    renderMonthNav();
    Page.Widgets.timeOffCalendar.gotoNextYear();
};

/**
 * Handles single date-cell click from the inline calendar.
 * Uses on-dateclick (not on-select) to match monthlyView's calendarPopupDateclick pattern.
 * $dateInfo is the raw date value passed by the WaveMaker calendar on-dateclick event.
 */
Page.timeOffCalendarDateclick = function ($dateInfo) {
    var label = formatHoveredDate(new Date($dateInfo.date));
    Page.Variables.calSelectedDateDisplay.dataSet = { dataValue: label };
    Page.Widgets.dateInput.datavalue = label;
};

/**
 * Handles the "Request Time Off" button click.
 * Both startDate and endDate are set imperatively via setInput using the
 * same RequestBody.* prefix as the declarative dataBinding targets.
 */
Page.btnRequestTimeOffClick = function ($event, widget) {
    // 1. Validate input
    const rawDate = Page.Widgets.dateInput.datavalue;
    if (!rawDate) {
        App.notify('warn', 'Please select a start date before submitting.');
        return;
    }

    // 2. Parse the date value robustly
    // dateInput stores a display string like "Mon, Jun 9" — parse it carefully
    const currentYear = new Date().getFullYear();
    let parsedDate = new Date(rawDate + ' ' + currentYear);
    // If invalid or in the past, try next year
    if (isNaN(parsedDate.getTime()) || parsedDate < new Date()) {
        parsedDate = new Date(rawDate + ' ' + (currentYear + 1));
    }
    // Final validity check
    if (isNaN(parsedDate.getTime())) {
        App.notify('error', 'Invalid date selected. Please pick a valid date.');
        return;
    }

    // 3. Format as YYYY-MM-DD
    const pad = (n) => String(n).padStart(2, '0');
    const startDate = parsedDate.getFullYear() + '-' + pad(parsedDate.getMonth() + 1) + '-' + pad(parsedDate.getDate());

    // 4. Compute endDate
    const isFullDay = Page.Widgets.timeOffTypeRadio.datavalue === 'Full Day(s) Off';
    const endDateObj = new Date(parsedDate);
    if (isFullDay) {
        const days = parseInt(Page.Widgets.daysCountInput.datavalue) || 1;
        endDateObj.setDate(endDateObj.getDate() + (days - 1));
    }
    const endDate = endDateObj.getFullYear() + '-' + pad(endDateObj.getMonth() + 1) + '-' + pad(endDateObj.getDate());

    // 5. Set both dates imperatively — prefix matches declarative dataBinding targets
    Page.Variables.requestTimeOffVar.setInput('RequestBody.startDate', startDate);
    Page.Variables.requestTimeOffVar.setInput('RequestBody.endDate', endDate);

    // 6. Invoke the variable
    Page.Variables.requestTimeOffVar.invoke({});
};

/**
 * Called when requestTimeOffVar completes successfully.
 * Shows a success notification to the user.
 */
Page.requestTimeOffVaronSuccess = function (variable, data) {
    var message = (data && data.status) ? 'Time Off request submitted. Status: ' + data.status : 'Time Off request submitted successfully.';
    App.notify('success', message);
};

/**
 * Called when requestTimeOffVar encounters an error.
 * Shows an error notification to the user.
 */
Page.requestTimeOffVaronError = function (variable, data) {
    var message = (data && data.errorMessage) ? data.errorMessage : 'Failed to submit Time Off request. Please try again.';
    App.notify('error', message);
};
