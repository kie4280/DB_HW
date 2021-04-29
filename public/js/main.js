"use strict";

function clearInput(i) {
  // 1: my shop / register shop, 2: shop list
  if (i == 1) {
    $("#mys input:not([disabled])").val("");
    $("#mys label span").html("");
    $("#regs input").val("");
    $("#regs select").val("Taipei");
    $("#regs label span").html("");
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

        if (asc && td1.html().toLowerCase() > td2.html().toLowerCase()) {
          td1.parent().insertAfter(td2.parent());
          switched = true;
        }
        if (!asc && td1.html().toLowerCase() < td2.html().toLowerCase()) {
          td1.parent().insertAfter(td2.parent());
          switched = true;
        }
      }
    }
    if (switched == false) {
      asc = !asc;
    }
  }
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
  for (let i = 1; i <= 2; i++) {
    $(`#tab${i}`).click(function () {
      clearInput(i);
    });
  }

  $("option").val(function (index, value) {
    return $(this).text();
  });

  $("#tab3").click(logout);
  $("#sho").submit(search);
});
