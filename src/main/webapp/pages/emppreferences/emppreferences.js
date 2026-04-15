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

Page.WorkPreference1Click = function ($event) {
    debugger
    App.Actions.goToPage_emppreferencesday.invoke();
    App.Variables.selectedpreference.dataSet = $event;
};

Page.GetResolvedPreferencesSuccess = function (variable, data) {
    var records = (variable.dataSet || []).slice(0, 7);
    if (!records.length) {
        return;
    }
    var firstItem = records[0];
    var concatenatedPrefs = records.map(function (item) {
        return item.prefs || '';
    }).join('');
    var transformed = {
        startDate: firstItem.date,
        prefs: concatenatedPrefs
    };
    Page.Variables.resolvedPrefsFormatted.setData(transformed);
    Page.Widgets.WorkPreference1.resolvedpreferences = transformed;
};
