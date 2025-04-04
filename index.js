const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const bodyparser = require("body-parser");
const cors = require("cors");
const app = express();
const routs = require("./src/routes/userRoutes");
const accountsRoutes = require("./src/routes/accountsRoutes");

const PORT = process.env.PORT || 6060;

app.use(bodyparser.json());
app.use(cors());
app.use("/api", routs);
app.use("/api", accountsRoutes);

app.listen(PORT, (err) => {
    if (err) {
        console.log("Server failed to start");
    } else {
        console.log(`Server is running on ${PORT}`);
    }
});

