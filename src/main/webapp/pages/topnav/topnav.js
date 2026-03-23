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

Partial.navbar1Mouseenter = function ($event, widget) {
    var dropdowns = widget.nativeElement.querySelectorAll('.dropdown');
    dropdowns.forEach(function (dropdown) {
        dropdown.classList.add('open');
    });
};

Partial.navbar1Mouseleave = function ($event, widget) {
    var dropdowns = widget.nativeElement.querySelectorAll('.dropdown');
    dropdowns.forEach(function (dropdown) {
        dropdown.classList.remove('open');
    });
};
