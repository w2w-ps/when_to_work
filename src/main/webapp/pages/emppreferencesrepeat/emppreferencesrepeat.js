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
    Page.Variables.SvGetWeekPreferences.setInput("startDate", getTodayDate());
    Page.Variables.SvGetWeekPreferences.invoke();
};

function getCombinedWeekPrefs(input) {
    let weekData;

    try {
        weekData = typeof input === "string" ? JSON.parse(input) : input;
    } catch (e) {
        console.error("Invalid JSON:", e);
        return "N".repeat(96);
    }

    if (!Array.isArray(weekData)) {
        return "N".repeat(96);
    }

    const result = weekData.map(day => {
        let prefs = (day?.prefs || "").trim();

        // Replace empty or spaces with 96 N's
        if (!prefs) {
            return "N".repeat(96);
        }

        // Optional: ensure length = 96
        if (prefs.length !== 96) {
            return prefs.padEnd(96, "N").slice(0, 96);
        }

        return prefs;
    }).join("");

    return result || "N".repeat(96);
}

function getTodayDate() {
    const today = new Date();

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
}


Page.button4Click = function ($event, widget) {



    const combinedPrefs = getCombinedWeekPrefs(
        Page.Widgets.WorkPreference1.weekpreferencedata
    );

    let data = {
        companyId: 1,
        employeeId: 1,
        startDate: getTodayDate(),
        prefs: combinedPrefs,
        compression: 0,
        editedBy: 1,
    };

    Page.Variables.PostWeekPref.invoke({
        "inputFields": { RequestBody: data }
    });



};
Page.alertdialog1Ok = function ($event, widget) {
    if (window.opener && !window.opener.closed) {
        window.opener.location.reload();
    }
    window.close();
};
