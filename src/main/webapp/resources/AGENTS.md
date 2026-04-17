## Agent Instructions

- Use `let` for variable declarations instead of `var`.

- Do not add any CSS styling; use only the existing variants.

- For navigation triggered by an "anchor" widget click:
  - Check if a `redirectTo` function already exists.
    - If it exists, reuse it.
    - If it does not exist, create the function in `App.js`.
  - Replace `PAGENAME` with the user-provided page name.

```javascript
function redirectTo(pageName) {
    let url =
        window.location.href.split('react-pages')[0] +
        `react-pages/${pageName}`;

    window.open(
        url,
        pageName,
        'width=900,height=600,left=100,top=100'
    );
}



