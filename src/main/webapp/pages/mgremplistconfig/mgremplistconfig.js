/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
    const savedConfig = localStorage.getItem('mgrEmpListConfig');
    let config;

    if (savedConfig) {
        try {
            config = JSON.parse(savedConfig);
        } catch (e) {
            config = null;
        }
    }

    if (!config) {
        config = {
            lastLogon: true,
            signinCount: false,
            address: false,
            address2: false,
            city: false,
            state: false,
            zip: false,
            email: true,
            employeeId: true,
            defaultPayRate: false,
            phone: false,
            phone2: false,
            cell: false,
            hireDate: false,
            comments: false,
            priorityGroup: false,
            maxWeekHours: false,
            maxDayHours: false,
            googleCal: false,
            nextAlert: false,
            customField1: false,
            customField2: false,
            empTypeIcon: true,
            employeePhoto: false
        };
    }

    Page.Widgets.chk_last_sign_in.datavalue = config.lastLogon ? 'Last Sign In' : null;
    Page.Widgets.chk_sign_in_count.datavalue = config.signinCount ? 'Sign In Count' : null;
    Page.Widgets.chk_address.datavalue = config.address ? 'Address' : null;
    Page.Widgets.chk_address2.datavalue = config.address2 ? 'Address 2' : null;
    Page.Widgets.chk_city.datavalue = config.city ? 'City' : null;
    Page.Widgets.chk_state.datavalue = config.state ? 'State' : null;
    Page.Widgets.chk_zip.datavalue = config.zip ? 'Zip' : null;
    Page.Widgets.chk_email.datavalue = config.email ? 'Email' : null;
    Page.Widgets.chk_employee_num.datavalue = config.employeeId ? 'Employee #' : null;
    Page.Widgets.chk_default_pay_rate.datavalue = config.defaultPayRate ? 'Default Pay Rate' : null;
    Page.Widgets.chk_phone.datavalue = config.phone ? 'Phone' : null;
    Page.Widgets.chk_phone2.datavalue = config.phone2 ? 'Phone2' : null;
    Page.Widgets.chk_cell.datavalue = config.cell ? 'Cell' : null;
    Page.Widgets.chk_hire_date.datavalue = config.hireDate ? 'Hire Date' : null;
    Page.Widgets.chk_comments.datavalue = config.comments ? 'Comments' : null;
    Page.Widgets.chk_priority_group.datavalue = config.priorityGroup ? 'Priority Group' : null;
    Page.Widgets.chk_max_week_hours.datavalue = config.maxWeekHours ? 'Max Week Hours/Days' : null;
    Page.Widgets.chk_max_day_hours.datavalue = config.maxDayHours ? 'Max Day Hours/Shifts' : null;
    Page.Widgets.chk_google_cal.datavalue = config.googleCal ? 'Google Cal Export' : null;
    Page.Widgets.chk_next_alert.datavalue = config.nextAlert ? 'Next Alert Date' : null;
    Page.Widgets.chk_custom_field1.datavalue = config.customField1 ? 'Custom Field 1*' : null;
    Page.Widgets.chk_custom_field2.datavalue = config.customField2 ? 'Custom Field 2*' : null;
    Page.Widgets.chk_status_icons.datavalue = config.empTypeIcon ? 'Status Icons**' : null;
    Page.Widgets.chk_employee_photo.datavalue = config.employeePhoto ? 'Employee Photo' : null;
};

Page.btn_saveClick = function ($event, widget) {
    // Helper: returns true only if checkboxset has a real non-empty value
    var isChecked = function (widgetDatavalue) {
        if (!widgetDatavalue) return false;
        if (Array.isArray(widgetDatavalue) && widgetDatavalue.length === 0) return false;
        if (typeof widgetDatavalue === 'string' && widgetDatavalue.trim() === '') return false;
        return true;
    };

    var config = {
        lastLogon:      isChecked(Page.Widgets.chk_last_sign_in.datavalue),
        signinCount:    isChecked(Page.Widgets.chk_sign_in_count.datavalue),
        address:        isChecked(Page.Widgets.chk_address.datavalue),
        address2:       isChecked(Page.Widgets.chk_address2.datavalue),
        city:           isChecked(Page.Widgets.chk_city.datavalue),
        state:          isChecked(Page.Widgets.chk_state.datavalue),
        zip:            isChecked(Page.Widgets.chk_zip.datavalue),
        email:          isChecked(Page.Widgets.chk_email.datavalue),
        employeeId:     isChecked(Page.Widgets.chk_employee_num.datavalue),
        defaultPayRate: isChecked(Page.Widgets.chk_default_pay_rate.datavalue),
        phone:          isChecked(Page.Widgets.chk_phone.datavalue),
        phone2:         isChecked(Page.Widgets.chk_phone2.datavalue),
        cell:           isChecked(Page.Widgets.chk_cell.datavalue),
        hireDate:       isChecked(Page.Widgets.chk_hire_date.datavalue),
        comments:       isChecked(Page.Widgets.chk_comments.datavalue),
        priorityGroup:  isChecked(Page.Widgets.chk_priority_group.datavalue),
        maxWeekHours:   isChecked(Page.Widgets.chk_max_week_hours.datavalue),
        maxDayHours:    isChecked(Page.Widgets.chk_max_day_hours.datavalue),
        googleCal:      isChecked(Page.Widgets.chk_google_cal.datavalue),
        nextAlert:      isChecked(Page.Widgets.chk_next_alert.datavalue),
        customField1:   isChecked(Page.Widgets.chk_custom_field1.datavalue),
        customField2:   isChecked(Page.Widgets.chk_custom_field2.datavalue),
        empTypeIcon:    isChecked(Page.Widgets.chk_status_icons.datavalue),
        employeePhoto:  isChecked(Page.Widgets.chk_employee_photo.datavalue)
    };

    localStorage.setItem('mgrEmpListConfig', JSON.stringify(config));
    App.Actions.goToPage_Mgremplist.invoke();
};
