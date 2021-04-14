"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express"); // Create a new express app instance
const app = express();
app.listen(3000, function () { console.log("App is listening on port 3000"); });
app.use(express.static("public"));
//The 404 Route (ALWAYS Keep this as the last route)
app.get("*", function (req, res) {
    res.status(404).send("Not found!");
});
app.post("*", function (req, res) {
    res.status(404).send("Not found!");
});
//# sourceMappingURL=server.js.map