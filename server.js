const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🏛️ CONEXÃO COM O BANCO DE DADOS POSTGRESQL (SUPABASE)
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

// Inicialização automática das tabelas de turismo no Piauí
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Usuarios (
                id SERIAL PRIMARY KEY,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS Destinos (
                id SERIAL PRIMARY KEY,
                nome_local TEXT NOT NULL,
                categoria TEXT NOT NULL, -- Ex: Praia, Ecoturismo, Histórico
                descricao TEXT NOT NULL,
                preco NUMERIC(10,2) NOT NULL
            );
            CREATE TABLE IF NOT EXISTS Avaliacoes (
                id SERIAL PRIMARY KEY,
                comentario TEXT NOT NULL,
                nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
                destinoId INTEGER REFERENCES Destinos(id) ON DELETE CASCADE
            );
        `);
        console.log("🏛️ Banco de dados 123.viajei.com (Supabase) sincronizado com sucesso!");
    } catch (err) {
        console.error("❌ Erro ao inicializar tabelas de turismo:", err.message);
    }
};
initDb();

// ================================================================================
// ✈️ ENDPOINTS DA SPRINT 1 (ROTAS INICIAIS DO 123.VIAJEI.COM)
// ================================================================================

// 1. GET /api/destinos (Listar destinos turísticos com Paginação)
app.get('/api/destinos', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        const result = await pool.query('SELECT * FROM Destinos ORDER BY id DESC LIMIT \$1 OFFSET \$2', [limit, offset]);
        res.json({
            page,
            limit,
            total_pagina: result.rows.length,
            destinos: result.rows
        });
    } catch (err) { next(err); }
});

// 2. POST /api/destinos (Cadastrar novo destino turístico no Piauí)
app.post('/api/destinos', async (req, res, next) => {
    try {
        const { nome_local, categoria, descricao, preco } = req.body;
        if (!nome_local || !categoria || !preco) {
            return res.status(400).json({ error: "Campos obrigatórios não preenchidos." });
        }
        const result = await pool.query(
            'INSERT INTO Destinos (nome_local, categoria, description, preco) VALUES (\$1, \$2, \$3, \$4) RETURNING *',
            [nome_local, categoria, descricao, preco]
        );
        res.status(201).json(result.rows);
    } catch (err) { next(err); }
});

// 🛡️ MANIPULADOR GLOBAL DE EXCEÇÕES (TRATAMENTO DE ERROS AMIGÁVEL)
app.use((err, req, res, next) => {
    console.error("🛡️ Erro capturado:", err.message);
    res.status(500).json({ error: "Ocorreu um erro interno no servidor de banco de dados do 123.viajei.com" });
});

app.listen(PORT, () => {
    console.log(`🚀 123.VIAJEI.COM API ONLINE NA PORTA ${PORT}`);
});
