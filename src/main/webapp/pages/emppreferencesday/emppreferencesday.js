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

    // Page.selectedDay = "Mon Apr 6 2026";

};
Page.button3Click = function ($event, widget) {

    let repeatCount = Page.Widgets.select2.datavalue == "Repeat 1Week(This Week Only)"
        ? 1
        : parseInt(Page.Widgets.select2.datavalue);

    let data = {
        companyId: 1,
        employeeId: 1,
        date: Page.Widgets.WorkPreference2.weekpreferencedata[0].startDate,
        prefs: Page.Widgets.WorkPreference2.weekpreferencedata[0].prefs,
        repeatCount: repeatCount,
        compression: 0,
        editedBy: 1,
        isDayPrefs: false
    };

    Page.Variables.PostDayPref.invoke({
        "inputFields": { RequestBody: data }
    });
};
Page.WorkPreference2Load = function ($event, $data) {
    Page.Widgets.WorkPreference2.weekpreferencedata = JSON.parse(localStorage.getItem('selectedpreference') || '{}');
};
