/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {

};/* Navigate to previous employee in the empIdList */
Page.btn_prev_empClick = function ($event, widget) {
    debugger
    const list = JSON.parse(localStorage.getItem('empIdList') || '[]');
    let idx = Page.Variables.currentEmpIndex.dataSet.dataValue;
    if (typeof idx !== 'number' || isNaN(idx)) {
        idx = 0;
    }
    if (idx > 0) {
        idx--;
    } else {
        idx = list.length - 1;
    }
    Page.Variables.currentEmpIndex.setValue('dataValue', idx);
    Page.Variables.svGetEmployeeById.setInput('id', list[idx]);
    Page.Variables.svGetEmployeeById.invoke();
};

/* Navigate to next employee in the empIdList */
Page.btn_next_empClick = function ($event, widget) {
    debugger
    const list = JSON.parse(localStorage.getItem('empIdList') || '[]');
    let idx = Page.Variables.currentEmpIndex.dataSet.dataValue;
    if (typeof idx !== 'number' || isNaN(idx)) {
        idx = 0;
    }
    if (idx < list.length - 1) {
        idx++;
    } else {
        idx = 0;
    }
    Page.Variables.currentEmpIndex.setValue('dataValue', idx);
    Page.Variables.svGetEmployeeById.setInput('id', list[idx]);
    Page.Variables.svGetEmployeeById.invoke();
};
