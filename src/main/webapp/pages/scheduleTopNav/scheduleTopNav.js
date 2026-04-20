/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Partial.onReady = function () {
    /*
     * variables can be accessed through 'Partial.Variables' property here
     * e.g. to get dataSet in a staticVariable named 'loggedInUser' use following script
     * Partial.Variables.loggedInUser.getData()
     *
     * widgets can be accessed through 'Partial.Widgets' property here
     * e.g. to get value of text widget named 'username' use following script
     * 'Partial.Widgets.username.datavalue'
     */
};
Partial.selPositionsChange = function ($event, widget, newVal, oldVal) {
    Partial.selectedPositionId = newVal.positionId;
    filterShifts();
};

filterShifts = function () {
    let varName = "";
    if (Partial.varName = App.activePageName === 'Position_view') {
        varName = 'svGetPositionViewScheduling';
    } else if (Partial.App.activePageName === 'EmployeeView') {
        varName = 'svScheduleList';
    }
    const currentPage = Partial.App.activePage;
    const weekview = currentPage['Widgets']['Weekview1'];
    const scheduleVar = currentPage['Variables'][varName];
    scheduleVar.setInput('positionIds', Partial.selectedPositionId);
    scheduleVar.setInput('categoryIds', Partial.selectedCategoryId);              // selected position from dropdown
    scheduleVar.setInput('companyId', 1);                     // hardcoded as requested
    scheduleVar.setInput('startDate', weekview.startdate);    // from Weekview1 on active page
    scheduleVar.setInput('endDate', weekview.enddate);        // from Weekview1 on active page
    scheduleVar.invoke();
}

Partial.selCategoriesChange = function ($event, widget, newVal, oldVal) {
    Partial.selectedCategoryId = newVal.categoryId;
    filterShifts();
};
