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

    // Initialize password strength bar to empty state
    Page.Widgets.passwordStrengthBar.datavalue = 0;
    Page.Widgets.passwordStrengthBar.type = 'danger';
    Page.Widgets.passwordStrengthLabel.caption = 'Password Strength';
    Page.Widgets.passwordStrengthLabel.class = 'password-strength-label strength-empty';
};

Page.checkPasswordStrength = function ($event, widget, newVal, oldVal) {
    var password = newVal || '';
    var strengthBar = Page.Widgets.passwordStrengthBar;
    var strengthLabel = Page.Widgets.passwordStrengthLabel;

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

    } else if (password.length <= 8) {
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

Page.saveBtnClick = function ($event, widget) {
    var password = Page.Widgets.newPasswordInput.datavalue;
    var confirmPassword = Page.Widgets.confirmPasswordInput.datavalue;

    if (!password || password.length < 8) {
        Page.Widgets.pwdLength.open();
        return;
    }

    if (password !== confirmPassword) {
        Page.Widgets.confirmpwd.open();
        return;
    }

    Page.Variables.svMgrUpdateEmpPwd.invoke();
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
        debugger
        var errorMsg = data.message || (data.errors && data.errors.length ? data.errors[0].message || data.errors[0] : "Failed to update password. Please try again.");
        App.Actions.appNotification.invoke({
            message: errorMsg,
            position: "bottom right",
            class: "error",
            duration: 5000
        });
    }

};
