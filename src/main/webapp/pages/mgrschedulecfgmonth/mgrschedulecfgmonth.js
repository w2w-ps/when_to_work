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

Page.btnSaveClick = function ($event, widget) {
    const GROUPING_MAP = {
        'Position': 'position_shift_timings',
        'Category': 'category_shift_timings',
        'Cat':      'cat_shift_timings',
        'None':     ''
    };

    const displayValue = Page.Widgets.rsScreenGroupBy.datavalue;
    const apiGrouping = GROUPING_MAP.hasOwnProperty(displayValue)
        ? GROUPING_MAP[displayValue]
        : displayValue;

    App.Variables.appSelectedGrouping.setData({
        grouping: apiGrouping,
        showDescription: Page.Widgets.cbScreenShowDesc.datavalue === true || Page.Widgets.cbScreenShowDesc.datavalue === 'true'
    });
    Page.Actions.goToPage_calenderView.invoke();
};
Page.rsScreenGroupByChange = function ($event, widget, newVal, oldVal) {
    debugger
    Page.pageparam = newVal
};
