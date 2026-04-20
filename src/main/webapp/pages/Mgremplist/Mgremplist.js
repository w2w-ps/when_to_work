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

/* Handler for View button in employee table */
Page.viewRowClick = function ($event, widget) {
    // Access the current row data via the table's selecteditem
    // e.g. var employee = Page.Widgets.employeeTable.selecteditem;
};

/* Handler for Edit button in employee table */
Page.editRowClick = function ($event, widget) {
    Page.Actions.goToPage_Mgrempedit.invoke();
};
