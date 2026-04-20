/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

var moment = App.importModule('moment');
window.moment = moment;

/* perform any action on the variables within this block(on-page-load) */
App.onAppVariablesReady = function () {
    /*
     * variables can be accessed through 'App.Variables' property here
     * e.g. App.Variables.staticVariable1.getData()
     */
};

/* perform any action on session timeout here, e.g clearing some data, etc */
App.onSessionTimeout = function () {
    /*
     * NOTE:
     * On re-login after session timeout:
     * if the same user logs in(through login dialog), app will retain its state
     * if a different user logs in, app will be reloaded and user is redirected to respective landing page configured in Security.
     */
};

/*
 * This application level callback function will be invoked after the invocation of PAGE level onPageReady function.
 * Use this function to write common logic across the pages in the application.
 * activePageName : name of the page
 * activePageScope: scope of the page
 * $activePageEl  : page jQuery element
 */
App.onPageReady = function (activePageName, activePageScope, $activePageEl) {

};

/*
 * This application level callback function will be invoked after a Variable receives an error from the target service.
 * Use this function to write common error handling logic across the application.
 * errorMsg:    The error message returned by the target service. This message will be displayed through appNotification variable
 *              You can change this though App.Variables.appNotification.setMessage(YOUR_CUSTOM_MESSAGE)
 * xhrObj:      The xhrObject used to make the service call
 *              This object contains useful information like statusCode, url, request/response body.
 */
App.onServiceError = function (errorMsg, xhrObj) {

};


App.loginActionOnError = function (variable, data) {
    App.Variables.loginAttemptCount.dataSet.dataValue += 1;
    App.Variables.loginErrorVisible.dataSet.dataValue = true;
};

App.loginActionOnSuccess = function (variable, data) {
    App.Variables.loginAttemptCount.dataSet.dataValue = 0;
    App.Variables.loginErrorVisible.dataSet.dataValue = false;
};

App.onBeforeServiceCall = function (requestParams) {

};

App.redirectTo = function (pageName) {
    const currentUrl = window.location.href;
    let popupUrl;

    if (currentUrl.includes("https://stage-platform.wavemaker.ai")) {
        // Removes the last segment (e.g., /current-page) to get the base path
        popupUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/')) + "/" + pageName;
    } else {
        // Assumes the structure has 'react-pages/' and replaces the suffix
        const baseUrl = currentUrl.split('react-pages')[0];
        popupUrl = `${baseUrl}react-pages/${pageName}`;
    }

    window.open(
        popupUrl,
        pageName,
        'width=900,height=600,left=100,top=100'
    );
};
