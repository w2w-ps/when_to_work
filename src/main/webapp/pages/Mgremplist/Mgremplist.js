/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* Builds the flat positions dropdown list from positionGroups data and assigns it to positionsDropdownData */
Page.buildPositionsDropdown = function (positionGroups) {
    const items = [];

    items.push({ label: 'All Positions', value: 'all' });
    items.push({ label: 'Add / Edit Positions', value: 'add_edit' });
    items.push({ label: '----------', value: 'sep1' });
    items.push({ label: 'Select / Group Positions', value: 'group_header' });

    _.forEach(positionGroups, function (group) {
        items.push({ label: '-' + group.name, value: 'grp_' + group.id });
    });
    items.push({ label: '----------', value: 'sep2' });

    _.forEach(positionGroups, function (group) {
        if (!group.positions || group.positions.length === 0) {
            return;
        }
        _.forEach(group.positions, function (position) {
            items.push({ label: group.name + ' - ' + position.description, value: position.positionId });
        });
    });

    Page.Variables.positionsDropdownData.dataSet = items;
};

/* Reads column visibility config from localStorage and applies show/hide to configurable table columns.
   Dumps ALL available column keys on startup.
   Tries binding, then name, then iterates all columns matching by field/binding/name property.
   View, Edit, firstName, lastName columns are always visible and are NOT touched here. */
Page.applyColumnConfig = function () {
    var stored = localStorage.getItem('mgrEmpListConfig');
    var config = stored ? JSON.parse(stored) : {
        lastLogon: true,
        email: true,
        employeeId: true,
        empTypeIcon: true
    };

    var columns = [
        { binding: 'empType.name', configKey: 'empTypeIcon' },
        { binding: 'email', configKey: 'email' },
        { binding: 'employeeId', configKey: 'employeeId' },
        { binding: 'lastLogon', configKey: 'lastLogon' },
        { binding: 'phone', configKey: 'phone' },
        { binding: 'phone2', configKey: 'phone2' },
        { binding: 'cell', configKey: 'cell' },
        { binding: 'hireDate', configKey: 'hireDate' },
        { binding: 'comments', configKey: 'comments' },
        { binding: 'address.address', configKey: 'address' },
        { binding: 'address.address2', configKey: 'address2' },
        { binding: 'address.city', configKey: 'city' },
        { binding: 'address.state', configKey: 'state' },
        { binding: 'address.zip', configKey: 'zip' },
        { binding: 'payRate', configKey: 'defaultPayRate' },
        { binding: 'priorityGroup', configKey: 'priorityGroup' },
        { binding: 'maxWeeklyDays', configKey: 'maxWeekHours' },
        { binding: 'maxDailyHours', configKey: 'maxDayHours' },
        { binding: 'googleCalExport', configKey: 'googleCal' },
        { binding: 'nextAlertDate', configKey: 'nextAlert' },
        { binding: 'customField1', configKey: 'customField1' },
        { binding: 'customField2', configKey: 'customField2' },
        { binding: 'logonCount', configKey: 'signinCount' }
    ];

    var applyNow = function () {
        var table = Page.Widgets.employeeTable;
        if (!table || !table.columns) {
            return;
        }

        // Dump all available keys once
        var allKeys = Object.keys(table.columns);

        columns.forEach(function (col) {
            var showVal = !!config[col.configKey];

            // Try 1: by binding
            var tableCol = table.columns[col.binding];

            // Try 2: by name
            if (!tableCol) {
                tableCol = table.columns[col.name];
            }

            // Try 3: iterate all columns and match by field/binding property
            if (!tableCol) {
                allKeys.forEach(function (key) {
                    if (!tableCol) {
                        var c = table.columns[key];
                        if (c && (c.field === col.binding || c.binding === col.binding || c.name === col.name)) {
                            tableCol = c;
                        }
                    }
                });
            }

            if (tableCol) {
                tableCol.show = showVal;
            }
        });
    };

    applyNow();
    setTimeout(applyNow, 500);
    setTimeout(applyNow, 1500);
};

/* Fires after table renders data rows — NO longer calls applyColumnConfig here to prevent reset loop */
Page.employeeTableDatarender = function (widget, data) {
    // intentionally left empty — applyColumnConfig is called from onReady and onSuccess only
};

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    const positionGroupsData = App.Variables.svGetPositionGroup.dataSet;

    if (positionGroupsData && positionGroupsData.positionGroups && positionGroupsData.positionGroups.length) {
        Page.buildPositionsDropdown(positionGroupsData.positionGroups);
    } else {
        App.Variables.svGetPositionGroup.invoke({},
            function (data) {
                const groups = data && data.positionGroups ? data.positionGroups : [];
                Page.buildPositionsDropdown(groups);
            },
            function (error) {
                console.error('Failed to load position groups:', error);
            }
        );
    }

    Page.applyColumnConfig();
};

/* Handler for View button in employee table */
Page.employeeTable_ViewAction = function (row) {
    const empid = row.employeeId;
    App.redirectTo('mgrempinfopop?empid=' + empid);
};

/* Handler for Edit button in employee table */
Page.employeeTable_EditAction = function (row) {
    const empid = row.employeeId;
    App.redirectTo('Mgrempedit?empid=' + empid);
};

/* Handler for search1 on-submit — filters employeeTable rows by search term across all fields except employeePhoto */
Page.search1Change = function ($event, widget, newVal, oldVal) {
    const fullDataSet = Page.Variables.wsGetEmployeeDetails.dataSet;
    const term = (newVal || '').toString().trim().toLowerCase();
    const excludedFields = ['employeePhoto'];

    if (!term) {
        Page.Widgets.employeeTable.dataset = fullDataSet;
        return;
    }

    const filtered = _.filter(fullDataSet, function (row) {
        return _.some(_.keys(row), function (key) {
            if (excludedFields.indexOf(key) !== -1) {
                return false;
            }
            const val = row[key];
            if (val === null || val === undefined) {
                return false;
            }
            if (typeof val === 'object') {
                return _.some(_.values(val), function (nestedVal) {
                    return nestedVal !== null &&
                        nestedVal !== undefined &&
                        nestedVal.toString().toLowerCase().indexOf(term) !== -1;
                });
            }
            return val.toString().toLowerCase().indexOf(term) !== -1;
        });
    });

    Page.Widgets.employeeTable.dataset = filtered;
};

/* onSuccess handler for wsGetEmployeeDetails — extracts all employeeId values and stores them in localStorage */
Page.wsGetEmployeeDetailsonSuccess = function (variable, data) {
    const empIds = _.map(data, function (emp) {
        return String(emp.employeeId);
    });
    localStorage.setItem('empIdList', JSON.stringify(empIds));
    Page.applyColumnConfig();
};

Page.btnAddNewEmployeeClick = function ($event, widget) {
    App.redirectTo('mgrnewemp');
};

/* Handler for selStatus on-select — filters employeeTable by empType.name, or opens legend editor */
Page.selStatusChange = function ($event, widget, $item) {
    const selectedValue = $item.value;

    if (selectedValue === 'edit_legend') {
        App.Widgets.legendEditorDialog.open();
        return;
    }

    // Update the menu caption to reflect the selected item label
    Page.Widgets.selStatus.caption = $item.label;

    const fullDataSet = Page.Variables.wsGetEmployeeDetails.dataSet;

    if (selectedValue === 'all') {
        Page.Widgets.employeeTable.dataset = fullDataSet;
        return;
    }

    if (selectedValue === 'none') {
        Page.Widgets.employeeTable.dataset = _.filter(fullDataSet, function (row) {
            return !row.empType || !row.empType.name;
        });
        return;
    }

    Page.Widgets.employeeTable.dataset = _.filter(fullDataSet, function (row) {
        return row.empType && row.empType.name === selectedValue;
    });
};

/* Handler for selPositions on-change — filters employeeTable by position, or resets to full dataset for sentinel values */
Page.selPositionsChange = function ($event, widget, newVal, oldVal) {
    const fullDataSet = Page.Variables.wsGetEmployeeDetails.dataSet;

    // Sentinel values → show all employees
    if (!newVal || newVal === 'all' || newVal === 'add_edit'
        || String(newVal).startsWith('grp_')
        || String(newVal).startsWith('sep')) {
        Page.Widgets.employeeTable.dataset = fullDataSet;
        return;
    }

    // Filter: employee's positions array must contain the selected positionId
    const selectedPositionId = parseInt(newVal, 10);
    const filtered = _.filter(fullDataSet, function (row) {
        const positions = row.positions || [];
        return _.some(positions, function (p) {
            return p.positionId === selectedPositionId;
        });
    });

    Page.Widgets.employeeTable.dataset = filtered;
};
Page.employeeTableRowselect = function ($event, widget, row) {
    const selected = Page.Widgets.employeeTable.selectedItems || [];

    Page.Widgets.lblSelected.caption = "Selected: " + selected.length;
};
Page.employeeTableRowdeselect = function ($event, widget, row) {
    const selected = Page.Widgets.employeeTable.selectedItems || [];

    if (selected.length) {
        Page.Widgets.lblSelected.caption = "Selected: " + selected.length;
    } else {
        Page.Widgets.lblSelected.caption = "Selected:";
    }
};
