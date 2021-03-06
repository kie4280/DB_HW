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
    } else {
      $("#sho").trigger("submit");
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
    } else {
      $("#sho").trigger("submit");
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

function searchShopOrder(event) {
  event.preventDefault();
  sorSelected = [];

  $("#sor3 span").css("display", "inline-block");
  let posting = $.post("/search-shop-order", $("#sor").serialize());

  posting.done(function (data) {
    $("#sor3 span").css("display", "none");
    $("#table4").DataTable().clear().rows.add(data).draw();
  });
}

function finishOrder() {
  let tr = $(this).parents("tr");

  tr.find("button:first-child span").css("display", "inline-block");
  let posting = $.post("/finish-order", {
    oid: new Array(tr.children("td:nth-child(2)").html()),
  });

  posting.done(function (data) {
    if (!data.status) {
      window.alert("Finish order failed!");
    } else {
      window.location.replace("/main");
    }
  });
}

function finishSelectedOrder() {
  if (sorSelected.length == 0) return;
  let posting = $.post("/finish-order", { oid: sorSelected });
  posting.done(function (data) {
    if (!data.status) {
      window.alert("Finish selected order failed!");
    } else {
      window.location.replace("/main");
    }
  });
}

function sorCancelSelectedOrder() {
  if (sorSelected.length == 0) return;
  let posting = $.post("/cancel-order", { oid: sorSelected });
  posting.done(function (data) {
    if (!data.status) {
      window.alert("Cancel selected order failed!");
    } else {
      window.location.replace("/main");
    }
  });
}

function getWorkAt() {
  let posting = $.post("/get-work-at");

  posting.done(function (data) {
    data.forEach((shop) => {
      $("#sor1").append(`<option>${shop}</option>`);
    });
  });
}

var sorSelected = [];
function sorOnSelected() {
  let oid = $(this).parents("tr").children("td:nth-child(2)").html();
  if ($(this).is(":checked")) {
    sorSelected.push(oid);
  } else {
    let index = sorSelected.indexOf(oid);
    if (index >= 0) {
      sorSelected.splice(index, 1);
    }
  }
  // console.log("sorSelectd");
  // console.log(sorSelected);
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

  $("#table4").DataTable({
    lengthChange: false,
    searching: false,
    autoWidth: false,
    pageLength: 4,
    order: [[1, "asc"]],
    columnDefs: [{ orderable: false, targets: [0, 7] }],
    columns: [
      {
        data: "checkbox",
        render: function (data, type, row, meta) {
          if (row.status == "Not finished") {
            return `<input type="checkbox">`;
          }
          return "";
        },
      },
      { data: "oid" },
      { data: "status" },
      { data: "start" },
      { data: "end" },
      { data: "shop" },
      { data: "total_price" },
      {
        data: "button",
        render: function (data, type, row, meta) {
          if (row.status == "Not finished") {
            return `<button type="button" class="btn btn-success">
            <span class="spinner-border spinner-border-sm"></span>
            Done</button>
            <button type="button" class="btn btn-danger">
            <span class="spinner-border spinner-border-sm"></span>
            Cancel</button>`;
          }
          return "";
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

  $("#sor").submit(searchShopOrder);
  $("#sor4").click(finishSelectedOrder);
  $("#sor5").click(sorCancelSelectedOrder);

  $("#table2").on("click", "button", deleteClerk);
  $("#table4").on("click", "button:first-child", finishOrder);
  $("#table4").on("click", "button:last-child", cancelOrder);
  $("#table4").on("click", "input[type=checkbox]", sorOnSelected);

  $("#sor").trigger("submit");

  getWorkAt();
});
