
const db = require("../config/db.js"); // Asegúrate de que la conexión esté bien estructurada
const { body, validationResult } = require("express-validator");

const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const { io } = require('../server.js');
const { server } = require('../server.js');
const { app } = require('../server.js');


// 📌 Obtener todas las noticias
router.get("/", (req, res) => {
  db.query("SELECT * FROM noticias", (error, results) => {
    if (error) {
      console.error("Error al obtener noticias:", error);
      return res.status(500).json({ error: "Error al obtener noticias" });
    }
    res.json(results);
  });
});

// 📌 Crear una noticia
router.post(
  "/",
  [
    body("titulo").notEmpty().withMessage("El título es obligatorio"),
    body("descripcion").notEmpty().withMessage("La descripción es obligatoria"),
    body("filial").notEmpty().withMessage("La filial es obligatoria"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { titulo, descripcion, filial } = req.body;
    const query = "INSERT INTO noticias (titulo, descripcion, filial) VALUES (?, ?, ?)";

    db.query(query, [titulo, descripcion, filial], (err, result) => {
      if (err) {
        console.error("Error al insertar la noticia:", err);
        return res.status(500).json({ error: "Error al cargar la noticia" });
      }

      const nuevaNoticia = { id: result.insertId, titulo, descripcion, filial };
      io.emit("noticiaCreada", nuevaNoticia); // Enviar evento a clientes
      res.status(201).json(nuevaNoticia);
    });
  }
);

// 📌 Editar una noticia
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, filial } = req.body;

  db.query(
    "UPDATE noticias SET titulo = ?, descripcion = ?, filial = ? WHERE id = ?",
    [titulo, descripcion, filial, id],
    (err, result) => {
      if (err) {
        console.error("Error al actualizar la noticia:", err);
        return res.status(500).json({ error: "Error al actualizar la noticia" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Noticia no encontrada" });
      }

      const noticiaActualizada = { id, titulo, descripcion, filial };
      io.emit("noticiaActualizada", noticiaActualizada); // Notificar cambios
      res.json(noticiaActualizada);
    }
  );
});


// 📌 Ruta para eliminar una noticia por ID
router.delete("/:id", (req, res) => {
  const noticiaId = req.params.id;
  console.log(`Intentando eliminar la noticia con ID: ${noticiaId}`);

  const sql = "DELETE FROM noticias WHERE id = ?";
    db.query(sql, [noticiaId], (err, result) => {
      if (err) {
        console.error("Error al eliminar la noticia:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Noticia no encontrada" });
      }

    // Emite el evento a través de WebSocket si todo va bien
    
    global.io.emit("noticiaEliminada", { id: noticiaId });
    
    console.log(`evento envia: ${noticiaId}`);

    res.json({ message: "Noticia eliminada correctamente" });
  });
});
  

module.exports = router;
