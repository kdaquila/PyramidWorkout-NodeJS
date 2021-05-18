function syncCheckboxSetup(masterCheckboxSelector, slaveCheckboxSelector) {

    const buttons = document.querySelectorAll(masterCheckboxSelector);
    const targets = document.querySelectorAll(slaveCheckboxSelector);
    buttons.forEach((button)=>{
        button.addEventListener('click', () => {            
            targets.forEach((target) => {target.checked = button.checked;})
        })
    })
}

