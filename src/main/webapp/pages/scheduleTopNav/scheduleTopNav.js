/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Partial.onReady = function () {
    if (!App.Variables.svGetAllCategoriesByCompanyId.dataSet ||
        !App.Variables.svGetAllCategoriesByCompanyId.dataSet.length) {
        App.Variables.svGetAllCategoriesByCompanyId.invoke();
    }
    if (!App.Variables.svGetAllPositionsByCompanyId.dataSet ||
        !App.Variables.svGetAllPositionsByCompanyId.dataSet.length) {
        App.Variables.svGetAllPositionsByCompanyId.invoke();
    }
    if (!App.Variables.svGetCategoryGroup.dataSet ||
        !App.Variables.svGetCategoryGroup.dataSet.length) {
        App.Variables.svGetCategoryGroup.invoke();
    }
    if (!App.Variables.svGetPositionGroup.dataSet ||
        !App.Variables.svGetPositionGroup.dataSet.length) {
        App.Variables.svGetPositionGroup.invoke();
    }

    const activePage = Partial.App.activePageName;
    if (activePage === 'EmployeeView') {
        Partial.Widgets.selViewType.datavalue = 'By Employee View';
    } else if (activePage === 'Position_view') {
        Partial.Widgets.selViewType.datavalue = 'By Position View';
    } else if (activePage === 'calenderView') {
        Partial.Widgets.selViewType.datavalue = 'Calendar View';
    } else {
        Partial.Widgets.selViewType.datavalue = 'By Employee View';
    }

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
    const flatCategories = (App.Variables.svGetAllCategoriesByCompanyId.dataSet.categories) || [];
    const categoryGroups = (App.Variables.svGetCategoryGroup.dataSet.categoryGroups) || [];

    const combined = [];

    combined.push({
        displayLabel: "All Categories",
        id: "allcategories",
        isHeader: false
    });

    combined.push({
        displayLabel: "Add/Edit Categories",
        id: "addeditcategories",
        isHeader: false
    });

    combined.push({ displayLabel: "-------------------", isHeader: false });
    combined.push({ displayLabel: "Select Group / Categories", isHeader: false });

    // Add group names from svGetCategoryGroup (group name only, selectable)
    categoryGroups.forEach(function (group) {
        let subCategoryIds = "";
        group.categories.forEach(function (subCategory) {
            subCategoryIds = subCategoryIds + subCategory.id + ",";
        });
        combined.push({
            id: group.id,
            displayLabel: group.name,
            isHeader: false,
            subCategoryIds: subCategoryIds
        });
    });

    combined.push({ displayLabel: "-------------------", isHeader: false });

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
    const flatPositions = (App.Variables.svGetAllPositionsByCompanyId.dataSet.positions) || [];
    const positionGroups = (App.Variables.svGetPositionGroup.dataSet.positionGroups) || [];

    const combined = [];

    combined.push({
        displayLabel: "All Positions",
        id: "allpositions",
        isHeader: false
    });

    combined.push({ displayLabel: "Add/Edit Positions", id: "addoredit", isHeader: false });
    combined.push({ displayLabel: "-------------------", id: "", isHeader: false });
    combined.push({ displayLabel: "Select Group / Positions", id: "selectgrouporposition", isHeader: false });

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

    combined.push({ displayLabel: "-------------------", id: "", isHeader: false });

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

    // Redirect to Add/Edit page
    if (newVal && newVal.id === 'addoredit') {
        App.redirectToNewtab("AddOrEditPosition");
        return;
    }

    // Silently ignore separator rows and non-selectable header rows (they have no id or empty id)
    if (newVal && (newVal.id === '' || newVal.id === 'selectgrouporposition')) {
        return;
    }

    // User cleared the selection (newVal is null/undefined) — reset filter and show all
    if (!newVal) {
        Partial.selectedPositionId = null;
        filterShifts();
        return;
    }

    // Valid position or group selected
    Partial.selectedPositionId = newVal.subPositionIds ? newVal.subPositionIds : newVal.id;
    filterShifts();
};

function filterShifts() {
    const activePage = Partial.App.activePageName;
    const currentPage = Partial.App.activePage;

    // -------------------------------------------------------
    // calenderView: use client-side filter via applyCalendarFilter
    // -------------------------------------------------------
    if (activePage === 'calenderView') {
        if (typeof currentPage.applyCalendarFilter === 'function') {
            currentPage.applyCalendarFilter(
                Partial.selectedCategoryId || null,
                Partial.selectedPositionId || null
            );
        }
        return;
    }

    // -------------------------------------------------------
    // Position_view / EmployeeView: existing server-side filter
    // -------------------------------------------------------
    let varName = "";
    if (activePage === 'Position_view') {
        varName = 'svGetPositionViewScheduling';
    } else if (activePage === 'EmployeeView') {
        varName = 'svScheduleList';
    }

    if (!varName) { return; }

    const weekview = currentPage['Widgets']['Weekview1'];
    const scheduleVar = currentPage['Variables'][varName];
    scheduleVar.dataBinding = {};
    if (Partial.selectedPositionId != 'allpositions') {
        scheduleVar.setInput('positionIds', Partial.selectedPositionId);
    }
    if (Partial.selectedCategoryId != 'allcategories') {
        scheduleVar.setInput('categoryIds', Partial.selectedCategoryId);
    }
    scheduleVar.setInput('companyId', 1);
    scheduleVar.setInput('startDate', weekview.startdate);
    scheduleVar.setInput('endDate', weekview.enddate);
    scheduleVar.invoke();
}

Partial.selCategoriesChange = function ($event, widget, newVal, oldVal) {
    // Silently ignore separator rows and non-selectable header rows (no id or known non-filter ids)
    if (newVal && (newVal.id === '' || newVal.displayLabel === 'Add/Edit Categories' ||
        newVal.displayLabel === '-------------------' ||
        newVal.displayLabel === 'Select Group / Categories')) {
        return;
    }

    // User cleared the selection — reset filter and show all
    if (!newVal) {
        Partial.selectedCategoryId = null;
        filterShifts();
        return;
    }

    // Valid category or group selected
    Partial.selectedCategoryId = newVal.subCategoryIds ? newVal.subCategoryIds : newVal.id;
    filterShifts();
};

Partial.selViewTypeChange = function ($event, widget, newVal, oldVal) {

    if (newVal == 'Calendar View') {
        Partial.App.Actions.goToPage_calenderView.invoke();
    } else if (newVal == 'By Position View') {
        Partial.App.Actions.goToPage_Position_view.invoke();
    } else if (newVal == 'By Employee View') {
        Partial.App.Actions.goToPage_EmployeeView.invoke();
    }
};

Partial.selStatusChange = function ($event, widget, newVal, oldVal) {

};

Partial.menu1Select = function ($event, widget, $item) {

};
