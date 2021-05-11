const navSlide = () => {
    const burgerSection = document.querySelector('.navbar__burgerSection');
    const burgerLine1 = document.querySelector('.navbar__burgerLine1');
    const burgerLine2 = document.querySelector('.navbar__burgerLine2');
    const burgerLine3 = document.querySelector('.navbar__burgerLine3');
    const navLinkSection = document.querySelector('.navbar__linkSection');

    //Toggle Nav
    burgerSection.addEventListener('click', ()=>{
        navLinkSection.classList.toggle('active');
        burgerLine1.classList.toggle('active')
        burgerLine2.classList.toggle('active')
        burgerLine3.classList.toggle('active')
    });
}

navSlide();