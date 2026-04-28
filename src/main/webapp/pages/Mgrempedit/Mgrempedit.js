/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    const list = JSON.parse(localStorage.getItem('empIdList') || '[]');
    const currentId = String(Page.pageParams.id);
    const idx = list.findIndex(id => String(id) === currentId);
    Page.Variables.currentEmpIndex.setValue('dataValue', idx >= 0 ? idx : 0);
};

Page.ancShowSelectedClick = function ($event, widget) {
    var panel = Page.Widgets.selectedPositionsPanel;
    var isOpen = panel.show;
    panel.show = !isOpen;
    widget.caption = isOpen ? "▼ Show selected" : "▲ Hide selected";
};

Page.ancShowUnselectedClick = function ($event, widget) {
    var panel = Page.Widgets.unselectedPositionsPanel;
    var isOpen = panel.show;
    panel.show = !isOpen;
    widget.caption = isOpen ? "▼ Show unselected" : "▲ Hide unselected";
};

Page.btnSetPhotoClick = function ($event, widget) {
    Page.Widgets.dlgUploadPhoto.open();
};
Page.btnStatusNoneClick = function ($event, widget) {
    Page.Widgets.lblFullTime.caption = '';
};
Page.btnStatusPurpleClick = function ($event, widget) {
    Page.Widgets.lblFullTime.caption = 'Full Time';
};
Page.btnStatusOrangeClick = function ($event, widget) {
    Page.Widgets.lblFullTime.caption = 'Part Time';
};
Page.btnStatusGreenTealClick = function ($event, widget) {
    Page.Widgets.lblFullTime.caption = '';
};
Page.btnStatusDarkGreenClick = function ($event, widget) {
    Page.Widgets.lblFullTime.caption = 'Per Dim';
};
Page.btnStatusTealClick = function ($event, widget) {
    Page.Widgets.lblFullTime.caption = ' ';
};

Page.patchEmployeeVarOnSuccess = function (variable, data) {
    if (Page._saveAndNext) {
        Page._saveAndNext = false;
        const list = JSON.parse(localStorage.getItem('empIdList') || '[]');
        let idx = Page.Variables.currentEmpIndex.dataSet.dataValue;
        if (typeof idx !== 'number' || isNaN(idx)) { idx = 0; }
        if (idx < list.length - 1) { idx++; } else { idx = 0; }
        Page.Variables.currentEmpIndex.setValue('dataValue', idx);
        Page.Variables.getEmployeeVar.setInput('id', list[idx]);
        Page.Variables.getEmployeeVar.invoke();
    } else {
        App.Actions.appNotification.invoke({
            message: 'Employee saved successfully',
            position: 'bottom right',
            class: 'success',
            duration: 3000
        });
    }
};

Page.patchEmployeeVarOnError = function (variable, data) {
    App.Actions.appNotification.invoke({
        message: 'Failed to save employee',
        position: 'bottom right',
        class: 'error',
        duration: 3000
    });
};

Page.getEmployeeVarOnSuccess = function (variable, data) {
    const ds = Page.Variables.employeeData.dataSet;
    ds.firstName = data.firstName;
    ds.lastName = data.lastName;
    ds.phone = data.phone;
    ds.phone2 = data.phone2;
    ds.cell = data.cell;
    ds.address = data.address && data.address.address !== undefined ? data.address.address : data.address;
    ds.city = data.address && data.address.city;
    ds.state = data.address && data.address.state;
    ds.zip = data.address && data.address.zip;
    ds.payRate = data.payRate;
    ds.comments = data.comments;
    ds.customField1 = data.customField1;
    ds.customField2 = data.customField2;
    ds.hireDateSeniority = data.hireDate;
    ds.alertDate = data.nextAlertDate;
    ds.byGroup = data.priorityGroup;
};

Page.anchor18Click = function ($event, widget) {
    const list = JSON.parse(localStorage.getItem('empIdList') || '[]');
    let idx = Page.Variables.currentEmpIndex.dataSet.dataValue;
    if (typeof idx !== 'number' || isNaN(idx)) { idx = 0; }
    if (idx > 0) { idx--; } else { idx = list.length - 1; }
    Page.Variables.currentEmpIndex.setValue('dataValue', idx);
    Page.Variables.getEmployeeVar.setInput('id', list[idx]);
    Page.Variables.getEmployeeVar.invoke();
};

Page.anchor16Click = function ($event, widget) {
    const list = JSON.parse(localStorage.getItem('empIdList') || '[]');
    let idx = Page.Variables.currentEmpIndex.dataSet.dataValue;
    if (typeof idx !== 'number' || isNaN(idx)) { idx = 0; }
    if (idx < list.length - 1) { idx++; } else { idx = 0; }
    Page.Variables.currentEmpIndex.setValue('dataValue', idx);
    Page.Variables.getEmployeeVar.setInput('id', list[idx]);
    Page.Variables.getEmployeeVar.invoke();
};

Page.btnSaveNextClick = function ($event, widget) {
    Page._saveAndNext = true;
    Page.Variables.patchEmployeeVar.invoke();
};
