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

Page.ancShowSelectedClick = function($event, widget) {
    var panel = Page.Widgets.selectedPositionsPanel;
    var isOpen = panel.show;
    panel.show = !isOpen;
    widget.caption = isOpen ? "▼ Show selected" : "▲ Hide selected";
};

Page.ancShowUnselectedClick = function($event, widget) {
    var panel = Page.Widgets.unselectedPositionsPanel;
    var isOpen = panel.show;
    panel.show = !isOpen;
    widget.caption = isOpen ? "▼ Show unselected" : "▲ Hide unselected";
};

Page.btnSetPhotoClick = function($event, widget) {
    Page.Widgets.dlgUploadPhoto.open();
};
