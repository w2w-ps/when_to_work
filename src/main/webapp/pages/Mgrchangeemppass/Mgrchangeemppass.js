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

Page.svMgrUpdateEmpPwdonSuccess = function (variable, data) {
    debugger
    if (data.isValid === true) {
        App.Actions.appNotification.invoke({
            message: data.message,
            position: "bottom right",
            class: "success",
            duration: 3000
        });
    } else {
        var errorMsg = data.message || (data.errors && data.errors.length ? data.errors[0].message || data.errors[0] : "Failed to update password. Please try again.");
        App.Actions.appNotification.invoke({
            message: errorMsg,
            position: "bottom right",
            class: "error",
            duration: 5000
        });
    }

};
