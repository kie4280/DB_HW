"use strict";

function sortTable(i) {
  let asc = $(`#table1 th:nth-child(${i})`).data("asc");

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
      }
      if (!asc && td1.html().toLowerCase() < td2.html().toLowerCase()) {
        td1.parent().insertAfter(td2.parent());
      }
    }
  }

  $(`#table1 th:nth-child(${i})`).data("asc", !asc);
}

$(document).ready(function () {
  for (let i = 1; i <= 4; i++) {
    $(`#table1 th:nth-child(${i})`)
      .data("asc", true)
      .click(function () {
        sortTable(i);
      });
  }
});
