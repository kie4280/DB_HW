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

function clearInput(i) {
  // 1: register shop / my shop, 2: shop list
  if (i == 1) {
    $("#regs input").val("");
    $("#regs select").val("Taipei");
    $("#regs label span").html("");

    $("#mys input:not([disabled])").val("");
    $("#mys label span").html("");
  } else {
    $("#sho input:not([type=checkbox])").val("");
    $("#sho input[type=checkbox]").prop("checked", false);
    $("#sho select").val("All");
  }
}

function sortTable(i) {
  let switched = false;
  let asc = true;

  while (!switched) {
    for (let j = 1; j <= $("#table1 tbody tr").length; j++) {
      for (let k = 1; k <= $("#table1 tbody tr").length - j; k++) {
        let td1 = $(
          `#table1 
           tbody tr:nth-child(${k}) 
           td:nth-child(${i})`
        );
        let td2 = $(
          `#table1 
           tbody tr:nth-child(${k + 1}) 
           td:nth-child(${i})`
        );

        if (asc) {
          if (td1.html().toLowerCase() > td2.html().toLowerCase()) {
            td1.parent().insertAfter(td2.parent());
            switched = true;
          }
        }
        if (!asc) {
          if (td1.html().toLowerCase() < td2.html().toLowerCase()) {
            td1.parent().insertAfter(td2.parent());
            switched = true;
          }
        }
      }
    }
    if (switched == false) {
      asc = !asc;
    }
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

function addClerk() {
  $("#mys6 span").css("display", "inline-block");
  let posting = $.post("/edit-shop", {
    type: "add-clerk",
    account: $("#mys5").val(),
  });

  posting.done(function (data) {
    $("#mys6 span").css("display", "none");
    if (data.status) {
      clearInput(1);
      $("#table2 tbody").append(
        `<tr id="clerk${data.id}">
           <td>${data.account}</td>
           <td>${data.phone}</td>
           <td>
             <button type="button" class="btn btn-danger" id="del${data.id}">
             <span class="spinner-border spinner-border-sm"></span>
               Delete
             </button>
           </td>
         </tr>`
      );
    } else {
      $("#mys-err5").html(data.err);
    }
  });
}

function deleteClerk() {
  $(this).children("span").css("display", "inline-block");
  let posting = $.post("/edit-shop", {
    type: "delete-clerk",
    account: $(this).parents("tr").children("td:first").html(),
  });

  posting.done(function (data) {
    if (data.status) {
      $(`#clerk${data.id}`).remove();
    }
  });
}

function editPrice() {
  $("#mys2 span").css("display", "inline-block");
  $("#mys1").prop("disabled", true);
  let posting = $.post("/edit-shop", {
    type: "edit-price",
    price: $("#mys1").val(),
  });

  posting.done(function (data) {
    $("#mys2 span").css("display", "none");
    if (!data.status) {
      $("#mys1").val(data.price);
    }
  });
}

function editAmount() {
  $("#mys4 span").css("display", "inline-block");
  $("#mys3").prop("disabled", true);
  let posting = $.post("/edit-shop", {
    type: "edit-amount",
    amount: $("#mys3").val(),
  });

  posting.done(function (data) {
    $("#mys4 span").css("display", "none");
    if (!data.status) {
      $("#mys3").val(data.amount);
    }
  });
}

function logout() {
  let posting = $.post("/logout-user");

  posting.done(function (data) {
    if (data.status) {
      window.location.replace("/");
    }
  });
}

function search(event) {
  event.preventDefault();

  $("#sho6 span").css("display", "inline-block");
  let posting = $.post("/search-shop", $("#sho").serialize());

  posting.done(function (data) {
    clearInput(2);
    $("#sho6 span").css("display", "none");
    $("#table1 tbody").empty();
    for (let i = 0; i < data.length; i++) {
      $("#table1 tbody").append(
        `<tr id="shop${data[i].id}">
           <td>${data[i].shop}</td>
           <td>${data[i].city}</td>
           <td>${data[i].price}</td>
           <td>${data[i].amount}</td>
         </tr>`
      );
    }
  });
}

$(document).ready(function () {
  for (let i = 1; i <= 4; i++) {
    $(`#table1 th:nth-child(${i})`).click(function () {
      sortTable(i);
    });
  }
  for (let i = 2; i <= 4; i += 2) {
    $(`#mys${i}`).click(function () {
      $(`#mys${i - 1}`)
        .prop("disabled", false)
        .focus();
    });
  }
  for (let i = 1; i <= 4; i++) {
    $(`#regs${i}`).focus(function () {
      $(`#regs-err${i}`).html("");
    });
  }
  for (let i = 1; i <= 2; i++) {
    $(`#tab${i}`).click(function () {
      clearInput(i);
    });
  }
  $("option").val(function (index, value) {
    return $(this).text();
  });
  $("#sho1").val(function (index, value) {
    return value.toLowerCase();
  });

  $("#table2").on("click", "button", deleteClerk);
  $("#mys6").click(addClerk);
  $("#mys1").blur(editPrice);
  $("#mys3").blur(editAmount);
  $("#tab3").click(logout);
  $("#regs").submit(register);
  $("#sho").submit(search);
});
