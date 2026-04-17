/*
 * Use App.getDependency for Dependency Injection
 * eg: var DialogService = App.getDependency('DialogService');
 */

/* perform any action on widgets/variables within this block */
Partial.onReady = function () {
    /*
     * This function is invoked after all the widgets on the page have been initialized.
     * Any code written here will get executed after the page is ready.
     */

    console.log('========== TOPNAV PARTIAL.ONREADY FIRED ==========');

    // Use setTimeout to ensure DOM is fully ready
    setTimeout(function () {
        console.log('========== NAVBAR CONDITIONAL CLASSES (via Partial.onReady) ==========');

        try {
            // Access navbarWrapper widget via Partial.Widgets
            var navbarWrapper = Partial.Widgets.navbarWrapper;

            if (!navbarWrapper) {
                console.error('ERROR: navbarWrapper widget not found!');
                return;
            }

            console.log('✓ navbarWrapper widget found');

            // Get roles from loggedInUser variable
            var roles = App.Variables.loggedInUser.dataSet.roles;

            console.log('Roles found:', roles);
            console.log('Roles type:', Array.isArray(roles) ? 'Array' : typeof roles);

            if (Array.isArray(roles) && roles.length > 0) {
                // Check for Manager role (case-insensitive)
                var hasManager = roles.some(function (role) {
                    return role && role.toLowerCase() === 'manager';
                });

                // Check for Employee role (case-insensitive)
                var hasEmployee = roles.some(function (role) {
                    return role && role.toLowerCase() === 'employee';
                });

                // Apply manager-nav class
                if (hasManager) {
                    navbarWrapper.nativeElement.classList.add('manager-nav');
                    console.log('✓ Applied: manager-nav');
                }

                // Apply employee-nav class
                if (hasEmployee) {
                    navbarWrapper.nativeElement.classList.add('employee-nav');
                    console.log('✓ Applied: employee-nav');
                }

                console.log('Final classes on navbarWrapper:', navbarWrapper.nativeElement.className);
            } else {
                console.warn('No roles array found or array is empty');
            }

            console.log('================================================');

        } catch (error) {
            console.error('ERROR applying conditional classes:', error.message);
            console.error('Error stack:', error.stack);
        }
    }, 200); // 200ms delay to ensure DOM is ready
};

// Widget load event - applies conditional classes to navbarWrapper based on user roles
// NOTE: This event doesn't seem to fire, so we're using Partial.onReady instead
Partial.navbarWrapperLoad = function ($event, widget) {
    console.log('========== NAVBAR WRAPPER ON-LOAD EVENT FIRED ==========');
    console.log('(This should appear if on-load works, but it probably won\'t)');

    try {
        // Get roles from the exact path shown in screenshot: App.Variables.loggedInUser.dataSet.roles
        var roles = App.Variables.loggedInUser.dataSet.roles;

        console.log('Roles found:', roles);
        console.log('Roles type:', Array.isArray(roles) ? 'Array' : typeof roles);

        if (Array.isArray(roles) && roles.length > 0) {
            // Check for Manager role (case-insensitive)
            var hasManager = roles.some(function (role) {
                return role && role.toLowerCase() === 'manager';
            });

            // Check for Employee role (case-insensitive)
            var hasEmployee = roles.some(function (role) {
                return role && role.toLowerCase() === 'employee';
            });

            // Apply manager-nav class
            if (hasManager) {
                widget.nativeElement.classList.add('manager-nav');
                console.log('✓ Applied: manager-nav');
            }

            // Apply employee-nav class
            if (hasEmployee) {
                widget.nativeElement.classList.add('employee-nav');
                console.log('✓ Applied: employee-nav');
            }

            console.log('Final classes:', widget.nativeElement.className);
        } else {
            console.warn('No roles array found or array is empty');
        }

        console.log('================================================');

    } catch (error) {
        console.error('ERROR applying conditional classes:', error.message);
    }
};

Partial.navbar1Mouseenter = function ($event, widget) {
    try {
        console.log('Navbar mouseenter event');
        var dropdowns = widget.nativeElement.querySelectorAll('.dropdown');
        console.log('Found dropdowns:', dropdowns.length);
        dropdowns.forEach(function (dropdown) {
            dropdown.classList.add('open');
        });
    } catch (error) {
        console.error('Error in navbar1Mouseenter:', error);
    }
};

Partial.navbar1Mouseleave = function ($event, widget) {
    try {
        console.log('Navbar mouseleave event');
        var dropdowns = widget.nativeElement.querySelectorAll('.dropdown');
        console.log('Found dropdowns:', dropdowns.length);
        dropdowns.forEach(function (dropdown) {
            dropdown.classList.remove('open');
        });
    } catch (error) {
        console.error('Error in navbar1Mouseleave:', error);
    }
};

Partial.leftTopLinksSelect = function ($event, widget, $item) {
    if ($item && ($item.caption === 'Sign Out' || $item.caption === 'SIGNOUT')) {

        App.Actions.logoutAction.invoke();
    }
};
