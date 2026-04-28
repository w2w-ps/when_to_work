/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    const config = App.Variables.appSelectedGrouping.dataSet;

    const GROUPING_REVERSE_MAP = {
        'position_shift_timings': 'Position',
        'category_shift_timings': 'Category',
        'cat_shift_timings':      'Cat',
        '':                       'None'
    };
    const savedGrouping = config.grouping || '';
    Page.Widgets.rsScreenGroupBy.datavalue = GROUPING_REVERSE_MAP[savedGrouping] || 'Position';

    Page.Widgets.cbScreenShowDesc.datavalue    = config.showDescription    === true ? 'true' : 'false';
    Page.Widgets.cbScreenHideGroups.datavalue  = config.hideGroupsNoShifts === true ? 'true' : (config.hideGroupsNoShifts === false ? 'false' : 'true');
    Page.Widgets.cbScreenShowCatPos.datavalue  = config.showCatPos         === true ? 'true' : 'false';

    Page.Widgets.selScreenName.datavalue = config.nameFormat || 'First Last';
    Page.Widgets.selStartOn.datavalue = config.startOn || 'Sunday';
};

Page.btnSaveClick = function ($event, widget) {
    const GROUPING_MAP = {
        'Position': 'position_shift_timings',
        'Category': 'category_shift_timings',
        'Cat':      'cat_shift_timings',
        'None':     ''
    };

    const displayValue = Page.Widgets.rsScreenGroupBy.datavalue;
    const apiGrouping  = GROUPING_MAP.hasOwnProperty(displayValue)
        ? GROUPING_MAP[displayValue]
        : displayValue;

    App.Variables.appSelectedGrouping.setData({
        grouping:           apiGrouping,
        showDescription:    Page.Widgets.cbScreenShowDesc.datavalue   === true || Page.Widgets.cbScreenShowDesc.datavalue   === 'true',
        hideGroupsNoShifts: Page.Widgets.cbScreenHideGroups.datavalue === true || Page.Widgets.cbScreenHideGroups.datavalue === 'true',
        showCatPos:         Page.Widgets.cbScreenShowCatPos.datavalue === true || Page.Widgets.cbScreenShowCatPos.datavalue === 'true',
        nameFormat:         Page.Widgets.selScreenName.datavalue,
        startOn:            Page.Widgets.selStartOn.datavalue
    });

    Page.Actions.goToPage_calenderView.invoke();
};

Page.rsScreenGroupByChange = function ($event, widget, newVal, oldVal) {
    Page.pageparam = newVal;
};
