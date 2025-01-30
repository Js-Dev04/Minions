const express = require('express');
const router = express.Router();
const db = require("../config/db.js"); // Asegúrate de que la conexión esté bien estructurada
const { io } = require('../server.js');






const ping = require("ping");


// Ruta para registrar un servidor
router.post("/", (req, res) => {
  const { nombre, ip } = req.body;

  if (!nombre || !ip) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }

  const query = "INSERT INTO servidores (nombre, ip) VALUES (?, ?)";
  db.query(query, [nombre, ip], (err, result) => {
    if (err) {
      console.error("Error al insertar el servidor:", err);
      return res.status(500).json({ error: "Error al cargar el servidor" });
    }

    io.emit("servidorCreado", { id: result.insertId, nombre, ip });

    res.status(200).json({ message: "Servidor registrado exitosamente", id: result.insertId });
  });
});

// Ruta para obtener servidores
router.get("/", (req, res) => {
  db.query("SELECT id, nombre, ip, estado FROM servidores", (err, results) => {
    if (err) {
      console.error("Error al obtener servidores:", err);
      return res.status(500).json({ error: "Error al obtener los servidores" });
    }
    res.json(results);
  });
});
// 📌 Editar un servidor
router.put("/:id", (req, res) => {
    const { id } = req.params;
    const { nombre, ip } = req.body;
  
    db.query(
      "UPDATE servidores SET nombre = ?, ip = ? WHERE id = ?",
      [nombre, ip, id],
      (err, result) => {
        if (err) {
          console.error("Error al actualizar el servidor:", err);
          return res.status(500).json({ error: "Error al actualizar el servidor" });
        }
  
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Servidor no encontrado" });
        }
  
        const servidorActualizado = { id, nombre, ip };
        io.emit("servidorActualizado", servidorActualizado); // Notificar cambios
        res.json(servidorActualizado);
      }
    );
  });
  
 // 📌 Eliminar un servidor por ID
router.delete("/:id", (req, res) => {
    const servidorId = req.params.id;
    console.log(`Intentando eliminar el servidor con ID: ${servidorId}`);  // 🔍 Log para depuración
  
    const sql = "DELETE FROM servidores WHERE id = ?";
    db.query(sql, [servidorId], (err, result) => {
      if (err) {
        console.error("Error al eliminar el servidor:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Servidor no encontrado" });
      }
  
      // Emite el evento a través de WebSocket si todo va bien
      
      global.io.emit("servidorEliminado", { id: servidorId });
      
      console.log(`evento envia: ${servidorId}`);
  
      res.json({ message: "Servidor eliminado correctamente" });
    });
  });
  

// Ping a los servidores cada 5 segundos

module.exports = router;
