"use strict";

function checkInput(i) {
  // 1: shop, 3: price, 4: amount
  let value = $(`#regs${i}`).val();

  if (value.length == 0) {
    $(`#regs-err${i}`).html("*Required!");
    return false;
  }
  if (i == 3 || i == 4) {
    if (value < 0) {
      $(`#regs-err${i}`).html("*Input a non-negative number");
      return false;
    }
  }
  return true;
}

function register(event) {
  event.preventDefault();

  let success = true;
  for (let i = 1; i <= 4; i++) {
    success &= checkInput(i);
  }
  if (!success) {
    return;
  }

  $("#regs5 span").css("display", "inline-block");
  let posting = $.post("/register-shop", $("#regs").serialize());

  posting.done(function (data) {
    if (data.status) {
      window.alert("Register Success!");
      window.location.replace("/main");
    } else {
      $("#regs5 span").css("display", "none");
      $("#regs-err1").html("*Shop name has been used! QAQ");
    }
  });
}

$(document).ready(function () {
  for (let i = 1; i <= 4; i++) {
    $(`#regs${i}`).focus(function () {
      $(`#regs-err${i}`).html("");
    });
  }

  $("#regs").submit(register);
});
