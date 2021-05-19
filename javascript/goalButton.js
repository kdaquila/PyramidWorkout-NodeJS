function goalButton() {
    let goalButton = document.querySelector("#goalButton");
    let actualField = document.querySelector('#actualDone');
    goalButton.addEventListener('click', ()=> {
        actualField.value = goalButton.innerHTML
    })
}