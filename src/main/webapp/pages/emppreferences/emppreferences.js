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
    App.Variables.selectedpreference.dataSet = $event;
    setTimeout(() => {
        App.redirectTo('emppreferencesday');
    }, 0);
};

Page.Weekview1Daterangechange = function ($event, $data) {
    Page.Variables.GetResolvedPreferences.invoke();
};
Page.button1Click = function ($event, widget) {
    App.redirectTo('emppreferencesmonth');
};
Page.button2Click = function ($event, widget) {
    App.redirectTo('emppreferencesrepeat');
};
