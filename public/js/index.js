"use strict";

function checkInput() {
  // 1: account, 2: password, 3: confirm password, 4: phone
  const patt1 = new RegExp("^[a-z0-9]+$", "i");
  const patt2 = new RegExp("^[0-9]+$");

  let success = true;
  for (let i = 1; i <= 4; i++) {
    let value = $(`#reg${i}`).val();
    let err = $(`#reg-err${i}`);

    if (value.length == 0) {
      err.html("*Required!").parent().show();
      success = false;
      continue;
    }
    switch (i) {
      case 1:
      case 2:
        if (!patt1.test(value)) {
          err.html("*Invalid format (only upper/lower-case character and number are allowed)").parent().show();
          success = false;
        }
        break;
      case 3:
        if (value != $("#reg2").val()) {
          err.html("*Password mismatch").parent().show();
          success = false;
        }
        break;
      case 4:
        if (value.length > 10) {
          err.html("*Invalid format (Max Length: 10)").parent().show();
          success = false;
        }
        if (!patt2.test(value)) {
          err.html("*Invalid format (only number are allowed)").parent().show();
          success = false;
        }
        break;
      default:
        break;
    }
  }
  return success;
}

function clearInput(i) {
  // 1: login, 2: register
  switch (i) {
    case 1:
      $("#log input").val("");
      break;
    case 2:
      $("#reg input").val("");
      $("#reg label span").html("").parent().hide();
      break;
    default:
      break;
  }
}

function register(event) {
  event.preventDefault();

  if (!checkInput()) return;

  $("#reg5 span").css("display", "inline-block");
  let posting = $.post("/register-user", $("#reg").serialize());

  posting.done(function (data) {
    $("#reg5 span").css("display", "none");
    if (data.status) {
      window.alert("Register Success!");
      $(".nav-tabs a[href='#login']").tab("show");
      clearInput(2);
    } else {
      $("#reg-err1").html("*Account has been registered! QAQ").parent().show();
    }
  });
}

function login(event) {
  event.preventDefault();

  $("#log3 span").css("display", "inline-block");
  let posting = $.post("/login-user", $("#log").serialize());

  posting.done(function (data) {
    if (data.status) {
      window.location.replace("/main");
    } else {
      window.alert("Login Failed! QAQ");
      $("#log3 span").css("display", "none");
      clearInput(1);
    }
  });
}

$(document).ready(function () {
  for (let i = 1; i <= 4; i++) {
    $(`#reg-err${i}`).parent().hide();
    $(`#reg${i}`).focus(function () {
      $(`#reg-err${i}`).html("").parent().hide();
    });
  }
  for (let i = 1; i <= 2; i++) {
    $(`#tab${i}`).click(function () {
      clearInput(i);
    });
  }

  $("#reg").submit(register);
  $("#log").submit(login);
});
