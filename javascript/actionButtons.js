function bindButtonAction(buttonClass) {

    const buttons = document.querySelectorAll(`[class*=${buttonClass}]`);
    buttons.forEach((button)=>{
        button.addEventListener('click', () => {
            const targetClass = button.getAttribute("data-target-class");
            const action = button.getAttribute("data-action");
            const targets = document.querySelectorAll(`[class*=${targetClass}]`);
            targets.forEach((target) => {
                switch (action) {
                    case "check-box": target.checked = true; break;
                    case "un-check-box": target.checked = false; break;
                }
            })
        })
    })
}

bindButtonAction("js-action-button")

