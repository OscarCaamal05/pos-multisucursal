/*
Template Name: Velzon - Admin & Dashboard Template
Author: Themesbrand
Website: https://Themesbrand.com/
Contact: Themesbrand@gmail.com
File: Form input spin Js File
*/

// input spin
isData();

function isData() {
    var plus = document.getElementsByClassName('plus');
    var minus = document.getElementsByClassName('minus');

    if (plus) {
        Array.from(plus).forEach(function (e) {
            e.addEventListener('click', function (event) {
                event.target.previousElementSibling.value =
                    parseInt(event.target.previousElementSibling.value) + 1;
            });
        });
    }

    if (minus) {
        Array.from(minus).forEach(function (e) {
            e.addEventListener('click', function (event) {
                var current = parseInt(event.target.nextElementSibling.value);
                if (current > 1) {
                    event.target.nextElementSibling.value = current - 1;
                }
            });
        });
    }
}