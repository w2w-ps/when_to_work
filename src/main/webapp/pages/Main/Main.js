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

function toggleSelectAllLabelClass(widget) {
    var tableEl = widget.nativeElement;
    var headerCheckboxLabel = tableEl.querySelector('th .header-checkbox-container label, th .app-checkbox label, th [class*="select-all"] label, th input[type="checkbox"] + label');
    if (headerCheckboxLabel) {
        headerCheckboxLabel.classList.toggle('checked-box');
    }
}

Page.onTable1HeaderClick = function ($event, widget, column) {
    var target = $event.target;
    // Toggle only when the select-all checkbox or its label in the header is clicked
    if (target && (target.tagName === 'INPUT' && target.type === 'checkbox' || target.tagName === 'LABEL')) {
        toggleSelectAllLabelClass(Page.Widgets.supportedLocaleTable1_1);
    }
};

Page.onTable3HeaderClick = function ($event, widget, column) {
    var target = $event.target;
    // Toggle only when the select-all checkbox or its label in the header is clicked
    if (target && (target.tagName === 'INPUT' && target.type === 'checkbox' || target.tagName === 'LABEL')) {
        toggleSelectAllLabelClass(Page.Widgets.supportedLocaleTable3);
    }
};
