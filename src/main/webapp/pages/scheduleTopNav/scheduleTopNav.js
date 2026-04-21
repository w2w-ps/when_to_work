/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Partial.onReady = function () {
    buildCombinedCategoriesDataset();

    // Re-build if either variable refreshes
    App.Variables.svGetAllCategoriesByCompanyId.onSuccess = function () {
        buildCombinedCategoriesDataset();
    };
    App.Variables.svGetCategoryGroup.onSuccess = function () {
        buildCombinedCategoriesDataset();
    };
};

function buildCombinedCategoriesDataset() {
    var flatCategories = (App.Variables.svGetAllCategoriesByCompanyId.dataSet.categories) || [];
    var categoryGroups = (App.Variables.svGetCategoryGroup.dataSet.categoryGroups) || [];

    var combined = [];

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

Partial.selPositionsChange = function ($event, widget, newVal, oldVal) {
    Partial.selectedPositionId = newVal.positionId;
    filterShifts();
};

filterShifts = function () {
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
