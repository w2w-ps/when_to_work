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
Page.employeeTable_ViewAction = function (row) {
    empid = row.employeeId
    App.redirectTo('mgrempinfopop?empid=' + empid);
};

/* Handler for Edit button in employee table */
Page.employeeTable_EditAction = function (row) {
    empid = row.employeeId
    App.redirectTo('Mgrempedit?empid=' + empid);
};

/* Handler for search1 on-submit — filters employeeTable rows by search term across all fields except employeePhoto */
Page.search1Change = function ($event, widget, newVal, oldVal) {
    var fullDataSet = Page.Variables.wsGetEmployeeDetails.dataSet;
    var term = (newVal || '').toString().trim().toLowerCase();
    var excludedFields = ['employeePhoto'];

    if (!term) {
        Page.Widgets.employeeTable.dataset = fullDataSet;
        return;
    }

    var filtered = _.filter(fullDataSet, function (row) {
        return _.some(_.keys(row), function (key) {
            if (excludedFields.indexOf(key) !== -1) {
                return false;
            }
            var val = row[key];
            if (val === null || val === undefined) {
                return false;
            }
            if (typeof val === 'object') {
                return _.some(_.values(val), function (nestedVal) {
                    return nestedVal !== null &&
                        nestedVal !== undefined &&
                        nestedVal.toString().toLowerCase().indexOf(term) !== -1;
                });
            }
            return val.toString().toLowerCase().indexOf(term) !== -1;
        });
    });

    Page.Widgets.employeeTable.dataset = filtered;
};
