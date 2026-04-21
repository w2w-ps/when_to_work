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
};

function getCombinedWeekPrefs(weekData) {
    return weekData.map(day => day.prefs || "").join("");
}

function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}


Page.button4Click = function ($event, widget) {



    const combinedPrefs = getCombinedWeekPrefs(
        Page.Widgets.WorkPreference1.weekpreferencedata
    );

    let data = {
        companyId: 1,
        employeeId: 1,
        startDate: getTodayDate(),
        prefs: combinedPrefs,
        compression: 0,
        editedBy: 1,
    };

    Page.Variables.PostWeekPref.invoke({
        "inputFields": { RequestBody: data }
    });



};
