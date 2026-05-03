/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    /*
     * variables can be accessed through 'Page.Variables' property here
     * e.g. to get dataSet in a staticVariable named 'loggedInUser' use following script
     * Page.Variables.loggedInUser.getData()
     *
     * widgets can be accessed through 'Page.Widgets' property here
     * e.g. to get value of text widget named 'username' use following script
     * 'Page.Widgets.username.datavalue'
     */
    // selCountry pre-selection: datavalue binding in markup (bind:Variables.countryList.dataSet[0].name)
    // already handles showing the first country. datafield="name" stores the name string,
    // so datavalue must also be a name string — which the markup binding correctly provides.
    // No additional JS override is needed here.
};

Page.radioSessionSecurityChange = function ($event, widget, newVal, oldVal) {
    Page.Variables.sessionSecurityLevel.dataSet.dataValue = newVal;
};

Page.wsGetTenantsonSuccess = function (variable, data) {
    const tenant = data && data[0] ? data[0] : {};
    const dayMap = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' };

    if (tenant.companyName !== undefined && tenant.companyName !== null) {
        Page.Widgets.txtCompanyName.datavalue = tenant.companyName;
        Page.Widgets.lblCompanyName.caption = tenant.companyName;
    }

    // Timezone: backend returns numeric (e.g. 1.0, -8.0) → set as number to match datafield="value"
    if (tenant.timezone !== undefined && tenant.timezone !== null) {
        Page.Widgets.selTimeZone.datavalue = parseFloat(tenant.timezone);
    }

    // Week start day: convert 1-7 to day name, store numeric for save
    if (tenant.weekStartDay !== undefined && tenant.weekStartDay !== null) {
        const dayName = dayMap[tenant.weekStartDay] || String(tenant.weekStartDay);
        Page.Widgets.lblStartDayValue.caption = dayName;
        Page.weekStartDayValue = tenant.weekStartDay;
    }
};

Page.wsUpdateTenantsonBeforeUpdate = function (variable, inputData, options) {
    const timezoneVal = parseFloat(Page.Widgets.selTimeZone.datavalue);
    const weekStartDay = Page.weekStartDayValue !== undefined ? parseInt(Page.weekStartDayValue, 10) : 1;
    inputData.RequestBody = {
        timezone: isNaN(timezoneVal) ? 0 : timezoneVal,
        weekStartDay: weekStartDay
    };
};

Page.wsUpdateTenantsonSuccess = function (variable, data, options) {
    App.Actions.appNotification.invoke({
        message: 'Settings saved successfully',
        class: 'success',
        duration: 3000
    });
};

Page.wsUpdateTenantsonError = function (variable, data, options) {
    App.Actions.appNotification.invoke({
        message: 'Failed to save settings',
        class: 'error',
        duration: 3000
    });
};
