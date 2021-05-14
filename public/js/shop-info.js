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
      clearInput(2);
      $("#table2").DataTable().row.add(data).draw();
    } else {
      $("#mys-err5").html(data.err).parent().show();
    }
  });
}

function deleteClerk() {
  let tr = $(this).parents("tr");

  tr.find("span").css("display", "inline-block");
  let posting = $.post("/edit-shop", {
    type: "delete-clerk",
    account: tr.children("td:first-child").html(),
  });

  posting.done(function (data) {
    tr.find("span").css("display", "none");
    if (data.status) {
      $("#table2").DataTable().row(tr).remove().draw();
    }
  });
}

$(document).ready(function () {
  $("#table2").DataTable({
    lengthChange: false,
    searching: false,
    autoWidth: false,
    pageLength: 8,
    columnDefs: [{ orderable: false, targets: 2 }],
    columns: [
      { data: "account" },
      { data: "phone" },
      {
        data: "button",
        render: function (data, type, row, meta) {
          return `<button type="button" class="btn btn-danger">
          <span class="spinner-border spinner-border-sm"></span>
          Delete</button>`;
        },
      },
    ],
  });

  for (let i = 2; i <= 4; i += 2) {
    $(`#mys${i}`).click(function () {
      $(`#mys${i - 1}`)
        .prop("disabled", false)
        .focus();
    });
  }

  $("#mys5").focus(function () {
    $("#mys-err5").html("").parent().hide();
  });

  $("#mys1").blur(editPrice);
  $("#mys3").blur(editAmount);
  $("#mys6").click(addClerk);
  $("#table2").on("click", "button", deleteClerk);
});
