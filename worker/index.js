// Worker proxy para a API do Agendor CRM
// Rotas:
//   GET /                → lista de empresas (organizations)
//   GET /deals?orgId=    → negócios de uma empresa
//   GET /person?id=      → dados de um contato (nome, cargo, email, telefone)

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
      return resp({ erro: 'Token do Agendor não configurado.' }, 500, cors);
    }

    const url  = new URL(request.url);
    const path = url.pathname;

    // ── Rota: dados de um contato ──────────────────────────
    if (path === '/person') {
      const personId = url.searchParams.get('id');
      if (!personId) return resp({ erro: 'Parâmetro id é obrigatório.' }, 400, cors);

      try {
        const r = await fetch(
          `https://api.agendor.com.br/v3/people/${personId}`,
          { headers: { 'Authorization': `Token ${env.AGENDOR_TOKEN}` } }
        );
        return resp(await r.json(), r.status, cors);
      } catch (e) {
        return resp({ erro: 'Falha ao buscar contato: ' + e.message }, 502, cors);
      }
    }

    // ── Rota: negócios de uma empresa ─────────────────────
    if (path === '/deals') {
      const orgId = url.searchParams.get('orgId');
      if (!orgId) return resp({ erro: 'Parâmetro orgId é obrigatório.' }, 400, cors);

      try {
        const r = await fetch(
          `https://api.agendor.com.br/v3/organizations/${orgId}/deals?per_page=100`,
          { headers: { 'Authorization': `Token ${env.AGENDOR_TOKEN}` } }
        );
        return resp(await r.json(), r.status, cors);
      } catch (e) {
        return resp({ erro: 'Falha ao buscar negócios: ' + e.message }, 502, cors);
      }
    }

    // ── Rota padrão: lista de empresas ────────────────────
    const page    = url.searchParams.get('page')     || '1';
    const perPage = url.searchParams.get('per_page') || '100';

    try {
      const r = await fetch(
        `https://api.agendor.com.br/v3/organizations?page=${page}&per_page=${perPage}`,
        { headers: { 'Authorization': `Token ${env.AGENDOR_TOKEN}` } }
      );
      return resp(await r.json(), r.status, cors);
    } catch (e) {
      return resp({ erro: 'Falha ao buscar empresas: ' + e.message }, 502, cors);
    }
  }
};

function resp(dados, status, cors) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}
