"use strict";

function searchShopOrder(event) {
  event.preventDefault();

  $("#sor3 span").css("display", "inline-block");
  let posting = $.post("/search-shop-order", $("#sor").serialize());

  posting.done(function (data) {
    $("#sor3 span").css("display", "none");
    $("#table4").DataTable().clear().rows.add(data).draw();
  });
}

function finishOrder() {
  let form = $(this).parents(".tab-pane").find("form");
  let tr = $(this).parents("tr");

  tr.find("button:first-child span").css("display", "inline-block");
  let posting = $.post("/finish-order", {
    oid: tr.children("td:nth-child(2)").html(),
  });

  posting.done(function (data) {
    if (data.status) {
      form.trigger("submit");
    } else {
      window.alert("Finish order failed!");
      tr.find("button:first-child span").css("display", "none");
    }
  });
}

function cancelOrder() {
  let form = $(this).parents(".tab-pane").find("form");
  let tr = $(this).parents("tr");

  tr.find("button:last-child span").css("display", "inline-block");
  let posting = $.post("/finish-order", {
    oid: tr.children("td:nth-child(2)").html(),
  });

  posting.done(function (data) {
    if (data.status) {
      form.trigger("submit");
      $("#sho").trigger("submit");
    } else {
      window.alert("Cancel order failed!");
      tr.find("button:last-child span").css("display", "none");
    }
  });
}

function finishSelectedOrder() {
  let table = $(this).parents(".tab-pane").find("table");

  for (let i = 1; i <= table.find("tbody tr").length; i++) {
    let checkbox = table.find(`tbody tr:nth-child(${i}) td:first-child input`);
    if (checkbox.prop("checked")) {
      checkbox.parents("tr").find("button:first-child").trigger("click");
    }
  }
}

function cancelSelectedOrder() {
  let table = $(this).parents(".tab-pane").find("table");

  for (let i = 1; i <= table.find("tbody tr").length; i++) {
    let checkbox = table.find(`tbody tr:nth-child(${i}) td:first-child input`);
    if (checkbox.prop("checked")) {
      checkbox.parents("tr").find("button:last-child").trigger("click");
    }
  }
}

$(document).ready(function () {
  $("#table4").DataTable({
    lengthChange: false,
    searching: false,
    autoWidth: false,
    pageLength: 5,
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

  $("#sor").submit(searchShopOrder);
  $("#sor").trigger("submit");
  $("#sor4").click(finishSelectedOrder);
  $("#sor5").click(cancelSelectedOrder);
  $("#table4").on("click", "button:first-child", finishOrder);
  $("#table4").on("click", "button:last-child", cancelOrder);
});
