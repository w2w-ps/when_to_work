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
    Page.Widgets.passwordStrengthBar.datavalue = 0;
    Page.Widgets.passwordStrengthBar.type = 'danger';
    Page.Widgets.passwordStrengthLabel.caption = 'Password Strength';
    Page.Widgets.passwordStrengthLabel.class = 'password-strength-label strength-empty';
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


Page.newPasswordChange = function ($event, widget, newVal, oldVal) {
    var password = newVal || '';
    var strengthBar = Page.Widgets.passwordStrengthBar;
    var strengthLabel = Page.Widgets.strengthLabel;

    // Check password strength based on criteria
    var hasUpperCase = /[A-Z]/.test(password);
    var hasDigit = /\d/.test(password);
    var isLongEnough = password.length >= 8;

    // Update strength bar and label based on password criteria
    if (password.length === 0) {
        debugger
        // Empty password - red
        strengthLabel.caption = 'Password Strength';
        strengthBar.class = 'app-progress bar-password-danger';
        // strengthBar.datavalue = 0;
        strengthBar.type = 'danger';


    } else if (password.length <= 3) {
        // Too Short - red
        strengthLabel.caption = 'Too Short';
        strengthBar.class = 'app-progress  progress-bar-default';
        // strengthBar.datavalue = 33;
        strengthBar.type = 'danger';
    } else if (isLongEnough && (!hasUpperCase || !hasDigit)) {
        // Medium - orange/warning
        strengthLabel.caption = 'Medium';
        strengthBar.class = 'app-progress  progress-bar-default';
        // strengthBar.datavalue = 66;
        strengthBar.type = 'warning';

    } else if (password.length <= 6) {
        // Medium - orange/warning
        strengthLabel.caption = 'Week';
        strengthBar.class = 'app-progress progress-bar-warning';
        // strengthBar.datavalue = 66;
        strengthBar.type = 'warning';

    } else if (isLongEnough && hasUpperCase && hasDigit) {
        debugger
        // Strong - green
        strengthLabel.caption = 'Strong';
        strengthBar.class = 'app-progress progress-bar-success';
        // strengthBar.datavalue = 100;
        strengthBar.type = 'success';
    }

};
