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

var currentMonth, currentYear;

function formatHoveredDate(date) {
    return DAYS_SHORT[date.getDay()] + ', ' + MONTHS_SHORT[date.getMonth()] + ' ' + date.getDate();
}

function notifyPageOfMonthChange(year, month) {
    var mm = String(month + 1).padStart(2, '0');
    Page.Variables.activeMonthDate.dataSet = { dataValue: year + '-' + mm + '-01' };
}

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

Page.timeOffCalendarDateclick = function ($dateInfo) {
    var label = formatHoveredDate(new Date($dateInfo));
    Page.Variables.calSelectedDateDisplay.dataSet = { dataValue: label };
    Page.Widgets.dateInput.datavalue = label;
};

Page.btnRequestTimeOffClick = function ($event, widget) {
    const rawDate = Page.Widgets.dateInput.datavalue;
    if (!rawDate) {
        App.notify('warn', 'Please select a start date before submitting.');
        return;
    }

    const currentYear = new Date().getFullYear();
    let parsedDate = new Date(rawDate + ' ' + currentYear);
    if (isNaN(parsedDate.getTime()) || parsedDate < new Date()) {
        parsedDate = new Date(rawDate + ' ' + (currentYear + 1));
    }
    if (isNaN(parsedDate.getTime())) {
        App.notify('error', 'Invalid date selected. Please pick a valid date.');
        return;
    }

    const pad = (n) => String(n).padStart(2, '0');
    const startDate = parsedDate.getFullYear() + '-' + pad(parsedDate.getMonth() + 1) + '-' + pad(parsedDate.getDate());

    const isFullDay = Page.Widgets.timeOffTypeRadio.datavalue === 'Full Day(s) Off';
    const endDateObj = new Date(parsedDate);
    if (isFullDay) {
        const days = parseInt(Page.Widgets.daysCountInput.datavalue) || 1;
        endDateObj.setDate(endDateObj.getDate() + (days - 1));
    }
    const endDate = endDateObj.getFullYear() + '-' + pad(endDateObj.getMonth() + 1) + '-' + pad(endDateObj.getDate());

    Page.Variables.requestTimeOffVar.setInput('RequestBody.startDate', startDate);
    Page.Variables.requestTimeOffVar.setInput('RequestBody.endDate', endDate);
    Page.Variables.requestTimeOffVar.invoke({});

    if (!isFullDay) {
        Page.Variables.requestTimeOffVar.setInput('RequestBody.startTime', Page.Widgets.startTimeInput.datavalue || null);
        Page.Variables.requestTimeOffVar.setInput('RequestBody.endTime', Page.Widgets.endTimeInput.datavalue || null);
        Page.Variables.requestTimeOffVar.setInput('RequestBody.repeatCount', parseInt(Page.Widgets.repeatSelect.datavalue) || 0);
    }
};

Page.requestTimeOffVaronSuccess = function (variable, data) {
    const message = (data && data.status)
        ? 'Time Off request submitted. Status: ' + data.status
        : 'Time Off request submitted successfully.';
    App.notify('success', message);
    Page.Variables.svTimeOffRequests.invoke({});
};

Page.requestTimeOffVaronError = function (variable, data) {
    const message = (data && data.errorMessage)
        ? data.errorMessage
        : 'Failed to submit Time Off request. Please try again.';
    App.notify('error', message);
};



Page.svTimeOffRequestsonError = function (variable, data) {
    const message = (data && data.errorMessage)
        ? data.errorMessage
        : 'Failed to load time off requests.';
    App.notify('error', message);
};

Page.showCancelButton = function (row) {
    const requests = Page.Variables.svTimeOffRequests.dataSet.timeOffRequests;
    if (!requests || !Array.isArray(requests)) {
        return false;
    }
    const item = requests.find(function (item) {
        return item.requestId === row.requestId;
    });
    return item ? (item.status !== 'CANCELLED' && item.status !== 'APPROVED') : false;
};

Page.btnCancelRequestClick = function ($event, widget) {
    const row = Page.Widgets.myTimeOffTable.selecteditem;
    const requestId = (row != null && row.requestId != null) ? row.requestId : null;
    const startDate = (row != null && row.startDate != null) ? row.startDate : '';

    if (!requestId) {
        App.notify('error', 'Unable to identify the request. Please try again.');
        return;
    }

    Page.Variables.selectedCancelId.dataSet = { dataValue: requestId };
    Page.Variables.selectedCancelDate.dataSet = { dataValue: startDate };
    Page.Widgets.dlgCancelConfirm.open();
};

Page.btnCancelConfirmYesClick = function ($event, widget) {
    const requestId = Page.Variables.selectedCancelId.dataSet.dataValue;
    if (!requestId) {
        App.notify('error', 'No request selected. Please try again.');
        return;
    }
    Page.Variables.svCancelTimeOffRequest.setInput('id', requestId);
    Page.Variables.svCancelTimeOffRequest.invoke({});
};

Page.svCancelTimeOffRequestonSuccess = function (variable, data) {
    Page.Widgets.dlgCancelConfirm.close();
    App.notify('success', 'Time off request cancelled successfully.');
    Page.Variables.svTimeOffRequests.invoke({});
};

Page.svCancelTimeOffRequestonError = function (variable, data) {
    const message = (data && data.errorMessage)
        ? data.errorMessage
        : 'Failed to cancel time off request. Please try again.';
    App.notify('error', message);
};
