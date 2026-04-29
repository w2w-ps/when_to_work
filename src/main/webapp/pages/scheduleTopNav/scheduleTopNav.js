/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Partial.onReady = function () {
    buildCombinedCategoriesDataset();
    buildCombinedPositionsDataset();

    // Re-build if either categories variable refreshes
    App.Variables.svGetAllCategoriesByCompanyId.onSuccess = function () {
        buildCombinedCategoriesDataset();
    };
    App.Variables.svGetCategoryGroup.onSuccess = function () {
        buildCombinedCategoriesDataset();
    };

    // Re-build if either positions variable refreshes
    App.Variables.svGetAllPositionsByCompanyId.onSuccess = function () {
        buildCombinedPositionsDataset();
    };
    App.Variables.svGetPositionGroup.onSuccess = function () {
        buildCombinedPositionsDataset();
    };
};

function buildCombinedCategoriesDataset() {
    let flatCategories = (App.Variables.svGetAllCategoriesByCompanyId.dataSet.categories) || [];
    let categoryGroups = (App.Variables.svGetCategoryGroup.dataSet.categoryGroups) || [];

    let combined = [];

    combined.push({
        displayLabel: "Add/Edit Categories",
        isHeader: false
    });

    combined.push({
        displayLabel: "-------------------",
        isHeader: false
    });

    combined.push({
        displayLabel: "Select Group / Categories",
        isHeader: false
    });

    // Add group names from svGetCategoryGroup (group name only, selectable)
    categoryGroups.forEach(function (group) {
        let subCategoryIds = "";
        group.categories.forEach(function (subCategory) {
            subCategoryIds = subCategoryIds + subCategory.id + ","
        });

        combined.push({
            id: group.id,
            displayLabel: group.name,
            isHeader: false,
            subCategoryIds: subCategoryIds
        });
    });

    combined.push({
        displayLabel: "-------------------",
        isHeader: false
    });

    // Add flat categories from svGetAllCategoriesByCompanyId
    flatCategories.forEach(function (cat) {
        combined.push({
            id: cat.categoryId,
            displayLabel: cat.description + (cat.shortDesc ? ' (' + cat.shortDesc + ')' : ''),
            isHeader: false
        });
    });

    Partial.Variables.mvCombinedCategories.dataSet = combined;
}

function buildCombinedPositionsDataset() {
    let flatPositions = (App.Variables.svGetAllPositionsByCompanyId.dataSet.positions) || [];
    let positionGroups = (App.Variables.svGetPositionGroup.dataSet.positionGroups) || [];

    let combined = [];

    combined.push({
        displayLabel: "Add/Edit Positions",
        id: "addoredit",
        isHeader: false
    });

    combined.push({
        displayLabel: "-------------------",
        id: "",
        isHeader: false
    });

    combined.push({
        displayLabel: "Select Group / Positions",
        id: "selectgrouporposition",
        isHeader: false
    });

    // Add group names from svGetPositionGroup (group name only, selectable)
    positionGroups.forEach(function (group) {
        let subPositionIds = "";
        group.positions.forEach(function (subPosition) {
            subPositionIds = subPositionIds + subPosition.positionId + ",";
        });

        combined.push({
            id: group.id,
            displayLabel: group.name,
            isHeader: false,
            subPositionIds: subPositionIds
        });
    });

    combined.push({
        displayLabel: "-------------------",
        id: "",
        isHeader: false
    });

    // Add flat positions from svGetAllPositionsByCompanyId
    flatPositions.forEach(function (pos) {
        combined.push({
            id: pos.positionId,
            displayLabel: pos.description,
            isHeader: false
        });
    });

    Partial.Variables.mvCombinedPositions.dataSet = combined;
}

Partial.selPositionsChange = function ($event, widget, newVal, oldVal) {
    if (newVal && newVal.id === 'addoredit') {
        Partial.App.Actions.goToPage_AddOrEditPosition.invoke();
    }
    Partial.selectedPositionId = newVal.subPositionIds ? newVal.subPositionIds : newVal.id;
    if (newVal.id) {
        filterShifts();
    }
};

function filterShifts() {
    let varName = "";
    if (Partial.App.activePageName === 'Position_view') {
        varName = 'svGetPositionViewScheduling';
    } else if (Partial.App.activePageName === 'EmployeeView') {
        varName = 'svScheduleList';
    }
    const currentPage = Partial.App.activePage;
    const weekview = currentPage['Widgets']['Weekview1'];
    const scheduleVar = currentPage['Variables'][varName];
    scheduleVar.setInput('positionIds', Partial.selectedPositionId);
    scheduleVar.setInput('categoryIds', Partial.selectedCategoryId);
    scheduleVar.setInput('companyId', 1);
    scheduleVar.setInput('startDate', weekview.startdate);
    scheduleVar.setInput('endDate', weekview.enddate);
    scheduleVar.invoke();
};

Partial.selCategoriesChange = function ($event, widget, newVal, oldVal) {
    Partial.selectedCategoryId = newVal.subCategoryIds ? newVal.subCategoryIds : newVal.id;
    if (newVal.id) {
        filterShifts();
    }
};

Partial.selViewTypeChange = function ($event, widget, newVal, oldVal) {
    debugger;
    if (newVal == 'Calendar View') {
        Partial.App.Actions.goToPage_calenderView.invoke();
    } else if (newVal == 'By Position View') {
        Partial.App.Actions.goToPage_Position_view.invoke();
    } else if (newVal == 'By Employee View') {
        Partial.App.Actions.goToPage_EmployeeView.invoke();
    }
};
