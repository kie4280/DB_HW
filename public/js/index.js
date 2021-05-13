"use strict";

const patt1 = new RegExp("^[a-z0-9]+$", "i");
const patt2 = new RegExp("^[0-9]+$");

function checkInput(i) {
  // 1: account, 2: password, 3: confirm password, 4: phone
  let value = $(`#reg${i}`).val();

  if (value.length == 0) {
    $(`#reg-err${i}`).html("*Required!").parent().show();
    return false;
  }
  if (i == 1 || i == 2) {
    if (!patt1.test(value)) {
      $(`#reg-err${i}`)
        .html(
          "*Invalid format (only upper/lower-case character and number are allowed)"
        )
        .parent()
        .show();
      return false;
    }
  } else if (i == 3) {
    if (value != $("#reg2").val()) {
      $("#reg-err3").html("*Password mismatch").parent().show();
      return false;
    }
  } else if (i == 4) {
    if (!patt2.test(value)) {
      $("#reg-err4")
        .html("*Invalid format (only number are allowed)")
        .parent()
        .show();
      return false;
    } else if (value.length > 10) {
      $("#reg-err4").html("*Invalid format (Max Length: 10)").parent().show();
      return false;
    }
  }
  return true;
}

function clearInput(i) {
  // 1: register, 2: login
  if (i == 1) {
    $("#log input").val("");
  } else {
    $("#reg input").val("");
    $("#reg label span").html("").parent().hide();
  }
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
      $("#log3 span").css("display", "none");
      window.alert("Login Failed! QAQ");
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
