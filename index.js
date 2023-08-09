const http = require("http");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const url = require("url");
const { nuevoRoommate, guardarUsuario, reset } = require("./roomate.js");
const { agregaGasto, modificaGasto, actualizarGastoRommie } = require("./calculos");

const gastosJSON = JSON.parse(fs.readFileSync("gastos.json", "utf8"));
const gastos = gastosJSON.gastos;

const server = http.createServer((req, res) => {
  const { method, url: reqUrl } = req;

  // Función para enviar una respuesta JSON
  const sendJsonResponse = (data) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data, null, 1));
  };

  // Función para leer y enviar un archivo HTML
  const sendHtmlFile = (filePath) => {
    res.setHeader("Content-Type", "text/html");
    res.end(fs.readFileSync(filePath, "utf8"));
  };

  // Función para leer y enviar un archivo JSON
  const sendJsonFile = (filePath) => {
    res.setHeader("Content-Type", "application/json");
    res.end(fs.readFileSync(filePath, "utf8"));
  };

  // Función para guardar un archivo JSON
  const saveJsonFile = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 1));
  };

  // Ruta: /
  if (method === "GET" && reqUrl === "/") {
    sendHtmlFile("./public/index.html");
  }

  // Ruta: /roommate (POST)
  if (method === "POST" && reqUrl.startsWith("/roommate")) {
    nuevoRoommate()
      .then(async (usuario) => {
        guardarUsuario(usuario);
        sendJsonResponse(usuario);
      })
      .catch((e) => {
        res.statusCode = 500;
        res.end();
        console.log("Error en el registro de un usuario random", e);
      });
  }

  // Ruta: /deleteUser (DELETE)
  if (method === "DELETE" && reqUrl.startsWith("/deleteUser")) {
    nuevoRoommate()
      .then(async (usuario) => {
        reset(usuario);
        sendJsonResponse(usuario);
      })
      .catch((e) => {
        res.statusCode = 500;
        res.end();
        console.log("Error borrando usuario", e);
      });
  }

  // Ruta: /roommates (GET)
  if (method === "GET" && reqUrl.startsWith("/roommates")) {
    sendJsonFile("roommates.json");
  }

  // Ruta: /gastos (GET)
  if (method === "GET" && reqUrl.startsWith("/gastos")) {
    sendJsonFile("gastos.json");
  }

  // Ruta: /gasto (POST)
  if (method === "POST" && reqUrl.startsWith("/gasto")) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const parsedBody = JSON.parse(body);
      const gasto = {
        id: uuidv4().slice(30),
        roommate: parsedBody.roommate,
        descripcion: parsedBody.descripcion,
        monto: parsedBody.monto,
      };
      gastos.push(gasto);
      agregaGasto(parsedBody);
      saveJsonFile("gastos.json", gastosJSON);
      res.end();
    });
  }

  // Ruta: /gasto (PUT)
  if (method === "PUT" && reqUrl.startsWith("/gasto")) {
    const { id } = url.parse(reqUrl, true).query;
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const parsedBody = JSON.parse(body);
      parsedBody.id = id;
      modificaGasto(parsedBody);
      gastosJSON.gastos = gastos.map((g) => {
        if (g.id === parsedBody.id) {
          return parsedBody;
        }
        return g;
      });
      saveJsonFile("gastos.json", gastosJSON);
      res.end();
    });
  }

  // Ruta: /gasto (DELETE)
  if (method === "DELETE" && reqUrl.startsWith("/gasto")) {
    const { id } = url.parse(reqUrl, true).query;
    gastosJSON.gastos = gastos.filter((g) => g.id !== id);
    saveJsonFile("gastos.json", gastosJSON);
    res.end();
  }
});

server.listen(3000, () => console.log("Servidor ON"));
