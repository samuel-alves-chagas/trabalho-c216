const restify = require('restify');
const { Pool } = require('pg');

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'postgres', // Usuário do banco de dados
    host: process.env.POSTGRES_HOST || 'db', // Este é o nome do serviço do banco de dados no Docker Compose
    database: process.env.POSTGRES_DB || 'loja',
    password: process.env.POSTGRES_PASSWORD || 'password', // Senha do banco de dados
    port: process.env.POSTGRES_PORT || 5432,
});

// iniciar o servidor
var server = restify.createServer({
    name: 'loja-seu-juquinha',
});

// Iniciando o banco de dados
async function initDatabase() {
    try {
        await pool.query('DROP TABLE IF EXISTS carro');
        await pool.query('CREATE TABLE IF NOT EXISTS carro (id SERIAL PRIMARY KEY, modelo VARCHAR(255) NOT NULL, marca VARCHAR(255) NOT NULL, ano_fabricacao VARCHAR(255) NOT NULL)');
        console.log('Banco de dados inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao iniciar o banco de dados, tentando novamente em 5 segundos:', error);
        setTimeout(initDatabase, 5000);
    }
}

// Middleware para permitir o parsing do corpo da requisição
server.use(restify.plugins.bodyParser());

// Endpoint para inserir um novo carro
server.post('/api/v1/carro/inserir', async (req, res, next) => {
    const { modelo, marca, ano_fabricacao } = req.body;

    try {
        const result = await pool.query(
          'INSERT INTO carro (modelo, marca, ano_fabricacao) VALUES ($1, $2, $3) RETURNING *',
          [modelo, marca, ano_fabricacao]
        );
        res.send(201, result.rows[0]);
        console.log('Carro inserido com sucesso:', result.rows[0]);
    } catch (error) {
        console.error('Erro ao inserir carro:', error);
        res.send(500, { message: 'Erro ao inserir carro' });
    }

    return next();
});

// Endpoint para listar todos os carro
server.get('/api/v1/carro/listar', async  (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM carro');
        res.send(result.rows);
        console.log('Carros encontrados:', result.rows);
    } catch (error) {
        console.error('Erro ao listar carros:', error);
        res.send(500, { message: 'Erro ao listar carros' });
    }
    
      return next();
});

// Endpoint para atualizar um carro existente
server.post('/api/v1/carro/atualizar', async (req, res, next) => {
    const { id, modelo, marca, ano_fabricacao } = req.body;

    try {
        const result = await pool.query(
          'UPDATE carro SET modelo = $1, marca = $2, ano_fabricacao = $3 WHERE id = $4 RETURNING *',
          [modelo, marca, ano_fabricacao, id]
        );
        if (result.rowCount === 0) {
          res.send(404, { message: 'Carro não encontrado' });
        } else {
          res.send(200, result.rows[0]);
          console.log('Carro atualizado com sucesso:', result.rows[0]);
        }
    } catch (error) {
        console.error('Erro ao atualizar carro:', error);
        res.send(500, { message: 'Erro ao atualizar carro' });
    }

    return next();
});

// Endpoint para excluir um carro pelo ID
server.post('/api/v1/carro/excluir', async (req, res, next) => {
    const { id } = req.body;

    try {
        const result = await pool.query('DELETE FROM carro WHERE id = $1', [id]);
        if (result.rowCount === 0) {
          res.send(404, { message: 'Carro não encontrado' });
        } else {
          res.send(200, { message: 'Carro excluído com sucesso' });
          console.log('Carro excluído com sucesso');
        }
    } catch (error) {
        console.error('Erro ao excluir carro:', error);
        res.send(500, { message: 'Erro ao excluir carro' });
    }

    return next();
});

// endpoint para resetar o banco de dados
server.del('/api/v1/database/reset', async (req, res, next) => {
    try {
      await pool.query('DROP TABLE IF EXISTS carro');
      await pool.query('CREATE TABLE carro (id SERIAL PRIMARY KEY, modelo VARCHAR(255) NOT NULL, marca VARCHAR(255) NOT NULL, ano_fabricacao VARCHAR(255) NOT NULL)');
      res.send(200, { message: 'Banco de dados resetado com sucesso' });
      console.log('Banco de dados resetado com sucesso');
    } catch (error) {
      console.error('Erro ao resetar o banco de dados:', error);
      res.send(500, { message: 'Erro ao resetar o banco de dados' });
    }
  
    return next();
});

// iniciar o servidor
var port = process.env.PORT || 5000;

// configurando o CORS
server.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, Content-Length, X-Requested-With'
    );
    if (req.method === 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
});

server.listen(port, function() {
    console.log('Servidor iniciado', server.name, ' na url http://localhost:' + port);
    console.log('Iniciando o banco de dados');
    initDatabase();
})