/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Page.onReady = function () {
  Page.calendarDaySlots = [];
  const selectedGrouping = App.Variables.appSelectedGrouping.dataSet.grouping;
  if (selectedGrouping === 'position_shift_timings') {
    Page.Variables.svcalendarPositionView.invoke();
  } else if (selectedGrouping === 'category_shift_timings') {
    Page.Variables.svcalendarCategoryView.invoke();
  } else if (selectedGrouping === 'cat_shift_timings') {
    Page.Variables.svCalendarShortCategoryView.invoke();
  } else {
    // '' (None selected)
    Page.Variables.svCalendarShiftTimingView.invoke();
  }
};

Page.Weekview1Daterangechange = function ($event, $data) {
  const selectedGrouping = App.Variables.appSelectedGrouping.dataSet.grouping;
  if (selectedGrouping === 'position_shift_timings') {
    Page.Variables.svcalendarPositionView.invoke();
  } else if (selectedGrouping === 'category_shift_timings') {
    Page.Variables.svcalendarCategoryView.invoke();
  } else if (selectedGrouping === 'cat_shift_timings') {
    Page.Variables.svCalendarShortCategoryView.invoke();
  } else {
    // '' (None selected)
    Page.Variables.svCalendarShiftTimingView.invoke();
  }
};

Page.Weekview1Load = function ($event, widget) {
  if (widget && typeof widget.onDaterangechange === 'undefined') {
    widget.onDaterangechange = function ($event, $data) {
      Page.Weekview1Daterangechange($event, $data);
    };
  }
};

Page.svcalendarPositionViewonSuccess = function (variable, data) {
  let resolvedData = data;
  if (Array.isArray(data) && data.length === 0) {
    resolvedData = variable.dataSet || data;
  }
  Page.calendarDaySlots = Page.buildCalendarDaySlots(resolvedData, null);
};

Page.svcalendarCategoryViewonSuccess = function (variable, data) {
  let resolvedData = data;
  if (Array.isArray(data) && data.length === 0) {
    resolvedData = variable.dataSet || data;
  }
  Page.calendarDaySlots = Page.buildCalendarDaySlots(resolvedData, null);
};

Page.svCalendarShortCategoryViewonSuccess = function (variable, data) {
  let resolvedData = data;
  if (Array.isArray(data) && data.length === 0) {
    resolvedData = variable.dataSet || data;
  }
  Page.calendarDaySlots = Page.buildCalendarDaySlots(resolvedData, null);
};

Page.svCalendarShiftTimingViewonSuccess = function (variable, data) {
  let resolvedData = data;
  if (Array.isArray(data) && data.length === 0) {
    resolvedData = variable.dataSet || data;
  }
  Page.calendarDaySlots = Page.buildCalendarDaySlotsShiftTiming(resolvedData);
};

Page.buildCalendarDaySlots = function (data, anchorDateStr) {
  const moment = App.importModule('moment');

  let datesArr = [];
  if (data && Array.isArray(data.dates)) {
    datesArr = data.dates;
  } else if (Array.isArray(data)) {
    datesArr = data;
  }

  if (!datesArr || datesArr.length === 0) { return []; }

  if (datesArr.length > 0) {
    anchorDateStr = datesArr[0].date;
  }

  const dateMap = {};
  datesArr.forEach(function (dateEntry) {
    const dateKey = dateEntry.date;
    if (!dateKey) { return; }
    const positions = [];
    const rawPositions = dateEntry.shiftGroups || [];
    rawPositions.forEach(function (posGroup) {
      const posName = posGroup.label || '';
      const timeSlots = posGroup.shiftGroups || [];
      timeSlots.forEach(function (timeSlot) {
        const timeRange = timeSlot.label || '';
        const shifts = timeSlot.shifts || [];
        const employees = [];
        shifts.forEach(function (shift) {
          const empName = ((shift.firstName || '') + ' ' + (shift.lastName || '')).trim() || shift.employeeName || '';
          const color = shift.color || '';
          const iconCls = color ? 'wi wi-circle' : 'wi wi-diamond';
          if (empName) {
            employees.push({ employeeName: empName, iconClass: iconCls, color: color, description: shift.description || '' });
          }
        });
        if (timeRange || employees.length > 0) {
          positions.push({ positionName: posName, timeRange: timeRange, employees: employees });
        }
      });
    });
    dateMap[dateKey] = { positions: positions };
  });

  let startDateStr;
  if (anchorDateStr && moment(anchorDateStr, 'YYYY-MM-DD', true).isValid()) {
    startDateStr = anchorDateStr.substring(0, 10);
  } else {
    const sortedKeys = Object.keys(dateMap).sort();
    if (sortedKeys.length === 0) { return []; }
    const monthCount = {};
    sortedKeys.forEach(function (k) {
      const mo = k.substring(0, 7);
      monthCount[mo] = (monthCount[mo] || 0) + 1;
    });
    const dominantMonth = Object.keys(monthCount).sort(function (a, b) {
      return monthCount[b] - monthCount[a];
    })[0];
    startDateStr = dominantMonth + '-01';
  }

  const monthStart = moment(startDateStr, 'YYYY-MM-DD').startOf('month');
  const totalDays = moment(startDateStr, 'YYYY-MM-DD').endOf('month').date();
  const firstDayOfWeek = monthStart.day();

  const slots = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    slots.push({ hasDate: false, dayNum: '', dateStr: '', positions: [] });
  }
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = monthStart.clone().date(d).format('YYYY-MM-DD');
    const dayData = dateMap[dateStr];
    slots.push({
      hasDate: true,
      dayNum: d,
      dateStr: dateStr,
      positions: dayData ? dayData.positions : []
    });
  }
  const remainder = slots.length % 7;
  if (remainder !== 0) {
    const trailing = 7 - remainder;
    for (let i = 0; i < trailing; i++) {
      slots.push({ hasDate: false, dayNum: '', dateStr: '', positions: [] });
    }
  }
  return slots;
};

Page.buildCalendarDaySlotsShiftTiming = function (data) {
  const moment = App.importModule('moment');

  let datesArr = [];
  if (data && Array.isArray(data.dates)) {
    datesArr = data.dates;
  } else if (Array.isArray(data)) {
    datesArr = data;
  }

  if (!datesArr || datesArr.length === 0) { return []; }

  const anchorDateStr = datesArr[0].date;

  const dateMap = {};
  datesArr.forEach(function (dateEntry) {
    const dateKey = dateEntry.date;
    if (!dateKey) { return; }

    const positions = [];
    const shiftGroups = dateEntry.shiftGroups || [];

    shiftGroups.forEach(function (group) {
      const label = group.label || '';
      const shifts = group.shifts || [];
      const employees = [];

      shifts.forEach(function (shift) {
        const empName = ((shift.firstName || '') + ' ' + (shift.lastName || '')).trim() || shift.employeeName || '';
        const color = shift.color || '';
        const iconCls = color ? 'wi wi-circle' : 'wi wi-diamond';
        if (empName) {
          employees.push({ employeeName: empName, iconClass: iconCls, color: color, description: shift.description || '' });
        }
      });

      if (label || employees.length > 0) {
        positions.push({ positionName: label, timeRange: label, employees: employees });
      }
    });

    dateMap[dateKey] = { positions: positions };
  });

  let startDateStr;
  if (anchorDateStr && moment(anchorDateStr, 'YYYY-MM-DD', true).isValid()) {
    startDateStr = anchorDateStr.substring(0, 10);
  } else {
    const sortedKeys = Object.keys(dateMap).sort();
    if (sortedKeys.length === 0) { return []; }
    const monthCount = {};
    sortedKeys.forEach(function (k) {
      const mo = k.substring(0, 7);
      monthCount[mo] = (monthCount[mo] || 0) + 1;
    });
    const dominantMonth = Object.keys(monthCount).sort(function (a, b) {
      return monthCount[b] - monthCount[a];
    })[0];
    startDateStr = dominantMonth + '-01';
  }

  const monthStart = moment(startDateStr, 'YYYY-MM-DD').startOf('month');
  const totalDays = moment(startDateStr, 'YYYY-MM-DD').endOf('month').date();
  const firstDayOfWeek = monthStart.day();

  const slots = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    slots.push({ hasDate: false, dayNum: '', dateStr: '', positions: [] });
  }
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = monthStart.clone().date(d).format('YYYY-MM-DD');
    const dayData = dateMap[dateStr];
    slots.push({
      hasDate: true,
      dayNum: d,
      dateStr: dateStr,
      positions: dayData ? dayData.positions : []
    });
  }
  const remainder = slots.length % 7;
  if (remainder !== 0) {
    const trailing = 7 - remainder;
    for (let i = 0; i < trailing; i++) {
      slots.push({ hasDate: false, dayNum: '', dateStr: '', positions: [] });
    }
  }
  return slots;
};

Page.svcalendarPositionViewonBeforeUpdate = function (variable, inputData, options) {
  console.trace()

};
