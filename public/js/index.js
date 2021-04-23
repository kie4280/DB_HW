"use strict";

const patt1 = new RegExp("^[a-z0-9]+$", "i");
const patt2 = new RegExp("^[0-9]+$");

function checkInput(i) {
  // 1: account, 2: password, 3: confirm password, 4: phone
  let value = $(`#reg${i}`).val();

  if (value.length == 0) {
    $(`#reg-err${i}`).html("*Required!");
    return false;
  }
  if (i == 1 || i == 2) {
    if (!patt1.test(value)) {
      $("#reg-err2").html(
        "*Invalid format (only upper/lower-case character and number are allowed)"
      );
      return false;
    }
  } else if (i == 3) {
    if (value != $("#reg2").val()) {
      $("#reg-err3").html("*Password mismatch");
      return false;
    }
  } else if (i == 4) {
    if (!patt2.test(value)) {
      $("#reg-err4").html("*Invalid format (only number are allowed)");
      return false;
    }
  }
  return true;
}

function clearInput(i) {
  // 1: register, 2: login
  if (i == 1) {
    $("#reg").find("input").val("");
    $("#reg").find("span").html("");
  } else {
    $("#log").find("input").val("");
  }
}

function register(event) {
  event.preventDefault();

  let success = true;
  for (let i = 2; i <= 4; i++) {
    success &= checkInput(i);
  }
  if (!checkInput(1)) {
    return;
  }

  let posting = $.post("/register-user", $("#reg").serialize());

  posting.done(function (data) {
    if (!data.status) {
      $("#reg-err1").html("*Account has been registered! QAQ");
    } else if (success) {
      window.alert("Register Success!");
      $(".nav-tabs a[href='#login']").tab("show");
      clearInput(1);
    }
  });
}

function login(event) {
  event.preventDefault();

  let posting = $.post("/login-user", $("#log").serialize());

  posting.done(function (data) {
    if (!data.status) {
      window.alert("Login Failed! QAQ");
      clearInput(2);
    } else {
      window.location.replace("main.html");
    }
  });
}

$(document).ready(function () {
  for (let i = 1; i <= 4; i++) {
    $(`#reg${i}`).focus(function () {
      $(`#reg-err${i}`).html("");
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
