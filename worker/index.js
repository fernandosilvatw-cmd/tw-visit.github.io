// Worker proxy para a API do Agendor CRM
// Rotas:
//   GET /             → lista empresas (organizations)
//   GET /deals?orgId= → negócios de uma empresa específica

const ORIGENS_PERMITIDAS = [
  'https://tw-visit.pages.dev',
  'https://fernandosilvatw-cmd.github.io',
  'null', // file:// (desenvolvimento local)
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
      return resposta({ erro: 'Token do Agendor não configurado.' }, 500, cors);
    }

    const url  = new URL(request.url);
    const path = url.pathname;

    // ── Rota: negócios de uma empresa ──────────────────────
    if (path === '/deals') {
      const orgId = url.searchParams.get('orgId');
      if (!orgId) return resposta({ erro: 'Parâmetro orgId é obrigatório.' }, 400, cors);

      try {
        // Busca todos os negócios da empresa (até 100 por chamada)
        const agendorUrl =
          `https://api.agendor.com.br/v3/organizations/${orgId}/deals?per_page=100`;

        const r = await fetch(agendorUrl, {
          headers: { 'Authorization': `Token ${env.AGENDOR_TOKEN}` }
        });

        const dados = await r.json();
        return resposta(dados, r.status, cors);

      } catch (e) {
        return resposta({ erro: 'Falha ao buscar negócios: ' + e.message }, 502, cors);
      }
    }

    // ── Rota padrão: lista de empresas ────────────────────
    const page    = url.searchParams.get('page')     || '1';
    const perPage = url.searchParams.get('per_page') || '100';

    try {
      const agendorUrl =
        `https://api.agendor.com.br/v3/organizations?page=${page}&per_page=${perPage}`;

      const r = await fetch(agendorUrl, {
        headers: { 'Authorization': `Token ${env.AGENDOR_TOKEN}` }
      });

      const dados = await r.json();
      return resposta(dados, r.status, cors);

    } catch (e) {
      return resposta({ erro: 'Falha ao buscar empresas: ' + e.message }, 502, cors);
    }
  }
};

// Utilitário: retorna Response JSON com CORS
function resposta(dados, status, cors) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}
