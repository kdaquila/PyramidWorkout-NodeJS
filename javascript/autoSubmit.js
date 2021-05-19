function autoSubmit(selector, triggerEvent) {
    let element = document.querySelector(selector);
    element.addEventListener(triggerEvent, ()=>{
        document.querySelector('#mainForm').submit();
    })
}