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

Page.svUpdateEmpPwdOnSuccess = function (variable, data) {
    if (data.isValid === false) {
        App.Actions.appNotification.invoke({
            message: (data.errors && data.errors[0]) || 'Validation failed.',
            position: 'bottom right',
            class: 'error',
            duration: 4000
        });
    } else {
        App.Actions.appNotification.invoke({
            message: data.message || 'Password updated successfully',
            position: 'bottom right',
            class: 'success',
            duration: 4000
        });
        Page.Widgets.currentPassword.datavalue = '';
        Page.Widgets.newPassword.datavalue = '';
        Page.Widgets.confirmPassword.datavalue = '';
    }
};

Page.svUpdateEmpPwdOnError = function (variable, data) {
    App.Actions.appNotification.invoke({
        message: data.error || data.message || (data.errors && data.errors[0]) || 'Failed to update password. Please try again.',
        position: 'bottom right',
        class: 'error',
        duration: 4000
    });
};

Page.newSectionHeaderClick = function ($event, widget) {
};
