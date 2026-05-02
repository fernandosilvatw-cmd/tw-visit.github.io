// Worker proxy para a API do Agendor CRM
// O token fica seguro aqui no servidor — nunca exposto no browser
// Aceita requisições apenas das origens autorizadas do projeto

const ORIGENS_PERMITIDAS = [
  'https://tw-visit.pages.dev',
  'https://fernandosilvatw-cmd.github.io',
  'null', // protocolo file:// (desenvolvimento local)
];

export default {
  async fetch(request, env) {
    const origem = request.headers.get('Origin') || 'null';

    // Cabeçalhos CORS — permite apenas as origens do projeto
    const cors = {
      'Access-Control-Allow-Origin': ORIGENS_PERMITIDAS.includes(origem) ? origem : ORIGENS_PERMITIDAS[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Responde ao preflight do navegador
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // Verifica se o token do Agendor está configurado
    if (!env.AGENDOR_TOKEN) {
      return new Response(
        JSON.stringify({ erro: 'Token do Agendor não configurado. Execute: wrangler secret put AGENDOR_TOKEN' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Lê os parâmetros de paginação vindos do frontend
    const url   = new URL(request.url);
    const page  = url.searchParams.get('page')     || '1';
    const limit = url.searchParams.get('per_page') || '100';

    try {
      // Chama a API do Agendor com o token secreto
      const agendorUrl = `https://api.agendor.com.br/v3/organizations?page=${page}&per_page=${limit}`;
      const resposta = await fetch(agendorUrl, {
        headers: { 'Authorization': `Token ${env.AGENDOR_TOKEN}` }
      });

      // Repassa o total de registros para o frontend saber quantas páginas há
      const totalCount = resposta.headers.get('Total-Count') || '0';
      const dados = await resposta.json();

      return new Response(JSON.stringify(dados), {
        status: resposta.status,
        headers: {
          ...cors,
          'Content-Type': 'application/json',
          'X-Total-Count': totalCount,
        }
      });

    } catch (erro) {
      return new Response(
        JSON.stringify({ erro: 'Falha ao conectar com o Agendor: ' + erro.message }),
        { status: 502, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
  }
};
