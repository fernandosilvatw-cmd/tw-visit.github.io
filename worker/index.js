// Worker proxy para a API do Agendor CRM
// O token fica seguro aqui no servidor — nunca exposto no browser
// Repassa a resposta da API com cabeçalhos CORS para o frontend

const ORIGENS_PERMITIDAS = [
  'https://tw-visit.pages.dev',
  'https://fernandosilvatw-cmd.github.io',
  'null', // protocolo file:// (desenvolvimento local)
];

export default {
  async fetch(request, env) {
    const origem = request.headers.get('Origin') || 'null';

    const cors = {
      'Access-Control-Allow-Origin': ORIGENS_PERMITIDAS.includes(origem) ? origem : ORIGENS_PERMITIDAS[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (!env.AGENDOR_TOKEN) {
      return new Response(
        JSON.stringify({ erro: 'Token do Agendor não configurado. Execute: wrangler secret put AGENDOR_TOKEN' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const url      = new URL(request.url);
    const page     = url.searchParams.get('page')     || '1';
    const perPage  = url.searchParams.get('per_page') || '100';

    try {
      const agendorUrl = `https://api.agendor.com.br/v3/organizations?page=${page}&per_page=${perPage}`;
      const resposta = await fetch(agendorUrl, {
        headers: { 'Authorization': `Token ${env.AGENDOR_TOKEN}` }
      });

      const dados = await resposta.json();

      return new Response(JSON.stringify(dados), {
        status: resposta.status,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });

    } catch (erro) {
      return new Response(
        JSON.stringify({ erro: 'Falha ao conectar com o Agendor: ' + erro.message }),
        { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
  }
};
