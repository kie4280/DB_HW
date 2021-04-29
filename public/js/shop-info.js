"use strict";

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

$(document).ready(function () {
  for (let i = 2; i <= 4; i += 2) {
    $(`#mys${i}`).click(function () {
      $(`#mys${i - 1}`)
        .prop("disabled", false)
        .focus();
    });
  }

  $("#sho1").val(function (index, value) {
    return value.toLowerCase();
  });

  $("#mys1").blur(editPrice);
  $("#mys3").blur(editAmount);
  $("#mys6").click(addClerk);
  $("#table2").on("click", "button", deleteClerk);
});
