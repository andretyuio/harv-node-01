require('dotenv').config();

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ servico: 'financas-claudia', versao: '1.0.0' });
});

app.get('/status', (req, res) => {
  res.status(200).json({
    servico: 'financas-claudia',
    versao: '1.0.0',
    agora: new Date().toISOString(),
  });
});

app.post('/lancamentos', async (req, res) => {
  const {
    usuario_id,
    conta_id,
    categoria_id,
    tipo,
    valor,
    data_lancamento,
    descricao,
  } = req.body || {};

  const valorNumerico = Number(valor);
  const camposInvalidos = [];

  if (!Number.isInteger(usuario_id) || usuario_id <= 0) camposInvalidos.push('usuario_id');
  if (!Number.isInteger(conta_id) || conta_id <= 0) camposInvalidos.push('conta_id');
  if (!Number.isInteger(categoria_id) || categoria_id <= 0) camposInvalidos.push('categoria_id');
  if (tipo !== 'entrada' && tipo !== 'saida') camposInvalidos.push('tipo');
  if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) camposInvalidos.push('valor');
  if (typeof data_lancamento !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data_lancamento)) {
    camposInvalidos.push('data_lancamento');
  }
  if (typeof descricao !== 'string' || descricao.trim() === '') camposInvalidos.push('descricao');

  if (camposInvalidos.length > 0) {
    return res.status(400).json({ erro: 'campos_invalidos', campos: camposInvalidos });
  }

  const { data, error } = await db
    .from('lancamentos')
    .insert({
      usuario_id,
      conta_id,
      categoria_id,
      tipo,
      valor: valorNumerico,
      data_lancamento,
      descricao,
    })
    .select('lancamento_id')
    .single();

  if (error) {
    return res.status(500).json({ erro: error.message });
  }

  return res.status(201).json({ criado: true, lancamento_id: data.lancamento_id });
});

app.listen(PORT, () => {
  console.log(`financas-claudia rodando na porta ${PORT}`);
});