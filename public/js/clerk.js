"use strict";

function checkInput() {
  // 1: shop, 2: city, 3: price, 4: amount
  let success = true;
  for (let i = 1; i <= 4; i++) {
    let value = $(`#regs${i}`).val();
    let err = $(`#regs-err${i}`);

    if (value.length == 0) {
      err.html("*Required!").parent().show();
      success = false;
    }
    switch (i) {
      case 3:
      case 4:
        if (value < 0) {
          err.html("*Input a non-negative number").parent().show();
          success = false;
        }
        break;
      default:
        break;
    }
  }
  return success;
}

function register(event) {
  event.preventDefault();

  if (!checkInput()) return;

  $("#regs5 span").css("display", "inline-block");
  let posting = $.post("/register-shop", $("#regs").serialize());

  posting.done(function (data) {
    $("#regs5 span").css("display", "none");
    if (data.status) {
      window.alert("Register Success!");
      window.location.replace("/main");
    } else {
      $("#regs-err1").html("*Shop name has been used! QAQ").parent().show();
    }
  });
}

$(document).ready(function () {
  for (let i = 1; i <= 4; i++) {
    $(`#regs-err${i}`).parent().hide();
    $(`#regs${i}`).focus(function () {
      $(`#regs-err${i}`).html("").parent().hide();
    });
  }

  $("#regs").submit(register);
});
