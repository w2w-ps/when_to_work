Page.onReady = function () { };

Page.WorkPreference1Click = function ($event) {
    localStorage.setItem('selectedpreference', JSON.stringify($event));
    setTimeout(() => {
        App.redirectTo('emppreferencesday');
    }, 0);
};

Page.Weekview1Daterangechange = function ($event, $data) {
    debugger;
    var sv = Page.Variables.GetResolvedPreferences;
    sv.invoke({
        inputFields: {
            companyId: App.Variables.loggedInUser.dataSet.userAttributes.tenantId,
            employeeId: App.Variables.loggedInUser.dataSet.id,
            startDate: $event.startdate,
            endDate: $event.enddate
        }
    });
};

Page.button1Click = function ($event, widget) {
    App.redirectTo('emppreferencesmonth');
};

Page.button2Click = function ($event, widget) {
    App.redirectTo('emppreferencesrepeat');
};

Page.GetResolvedPreferencesSuccess = function (variable, data) {
    const hourIndexes = [];
    if (Array.isArray(data)) {
        data.forEach(function (item, index) {
            if (item.preferenceType === 'HOUR') {
                hourIndexes.push({ dataValue: index });
            }
        });
    }
    Page.Variables.hourPreferenceIndexes.dataSet = hourIndexes;
};
