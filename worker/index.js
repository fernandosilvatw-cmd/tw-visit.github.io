// Worker proxy para a API do Agendor CRM
// GET  /                       → lista de empresas
// GET  /deals?orgId=           → negócios de uma empresa
// GET  /deals/all              → todos os negócios (dashboard)
// GET  /deal?id=               → negócio individual
// GET  /person?id=             → dados de um contato
// GET  /users                  → lista de usuários da conta
// GET  /deal-tasks?dealId=     → tarefas de um negócio
// GET  /all-tasks              → todas as tarefas (calendário)
// POST /tasks                  → cria tarefa vinculada a um negócio
// POST /deal-ranking           → atualiza o ranking (estrelas) de um negócio
// POST /complete-task          → finaliza uma tarefa
// POST /move-stage             → move negócio para outra etapa do funil
// GET  /funnels                → funis com etapas

const ORIGENS_PERMITIDAS = [
  'https://tw-visit.pages.dev',
  'https://fernandosilvatw-cmd.github.io',
  'null',
];

export default {
  async fetch(request, env) {
    const origem = request.headers.get('Origin') || 'null';
    const cors = {
      'Access-Control-Allow-Origin':  ORIGENS_PERMITIDAS.includes(origem) ? origem : ORIGENS_PERMITIDAS[0],
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
    const hdrs = { 'Authorization': `Token ${env.AGENDOR_TOKEN}`, 'Content-Type': 'application/json' };

    // ── POST: criar tarefa ─────────────────────────────────
    if (request.method === 'POST' && path === '/tasks') {
      try {
        const body = await request.json();
        const { dealId, text, type, dueDate, assignedUserId } = body;
        if (!dealId || !text || !dueDate || !assignedUserId) {
          return resp({ erro: 'Campos obrigatórios: dealId, text, dueDate, assignedUserId' }, 400, cors);
        }
        const payload = { text, dueDate, assignedUsers: [assignedUserId] };
        if (type) payload.type = type;
        const r = await fetch(
          `https://api.agendor.com.br/v3/deals/${dealId}/tasks`,
          { method: 'POST', headers: hdrs, body: JSON.stringify(payload) }
        );
        return resp(await r.json(), r.status, cors);
      } catch (e) {
        return resp({ erro: 'Falha ao criar tarefa: ' + e.message }, 502, cors);
      }
    }

    // ── POST: finalizar tarefa ─────────────────────────────
    if (request.method === 'POST' && path === '/complete-task') {
      try {
        const { dealId, taskId } = await request.json();
        const r = await fetch(
          `https://api.agendor.com.br/v3/deals/${dealId}/tasks/${taskId}`,
          { method: 'PUT', headers: hdrs, body: JSON.stringify({ completed: true }) }
        );
        return resp(await r.json(), r.status, cors);
      } catch (e) {
        return resp({ erro: 'Falha ao finalizar tarefa: ' + e.message }, 502, cors);
      }
    }

    // ── POST: mover etapa do funil ─────────────────────────
    if (request.method === 'POST' && path === '/move-stage') {
      try {
        const { dealId, stageId } = await request.json();
        const r = await fetch(
          `https://api.agendor.com.br/v3/deals/${dealId}`,
          { method: 'PUT', headers: hdrs, body: JSON.stringify({ dealStage: { id: stageId } }) }
        );
        return resp(await r.json(), r.status, cors);
      } catch (e) {
        return resp({ erro: 'Falha ao mover etapa: ' + e.message }, 502, cors);
      }
    }

    // ── POST: atualizar ranking do negócio ─────────────────
    if (request.method === 'POST' && path === '/deal-ranking') {
      try {
        const { dealId, ranking } = await request.json();
        const r = await fetch(
          `https://api.agendor.com.br/v3/deals/${dealId}`,
          { method: 'PUT', headers: hdrs, body: JSON.stringify({ ranking }) }
        );
        return resp(await r.json(), r.status, cors);
      } catch (e) {
        return resp({ erro: 'Falha ao atualizar ranking: ' + e.message }, 502, cors);
      }
    }

    // ── GET: tarefas de um negócio específico ──────────────
    if (path === '/deal-tasks') {
      const dealId = url.searchParams.get('dealId');
      if (!dealId) return resp({ erro: 'dealId obrigatório.' }, 400, cors);
      try {
        const r = await fetch(
          `https://api.agendor.com.br/v3/deals/${dealId}/tasks?per_page=100`,
          { headers: { 'Authorization': `Token ${env.AGENDOR_TOKEN}` } }
        );
        return resp(await r.json(), r.status, cors);
      } catch (e) {
        return resp({ erro: 'Falha ao buscar tarefas: ' + e.message }, 502, cors);
      }
    }

    // ── GET: todas as tarefas (calendário) ─────────────────
    if (path === '/all-tasks') {
      const page = url.searchParams.get('page') || '1';
      const pp   = url.searchParams.get('per_page') || '100';
      const since = url.searchParams.get('since') || '';
      const until = url.searchParams.get('until') || '';
      try {
        let agendorUrl = `https://api.agendor.com.br/v3/tasks?page=${page}&per_page=${pp}`;
        if (since) agendorUrl += `&since=${since}`;
        if (until) agendorUrl += `&until=${until}`;
        const r = await fetch(agendorUrl, { headers: { 'Authorization': `Token ${env.AGENDOR_TOKEN}` } });
        return resp(await r.json(), r.status, cors);
      } catch (e) {
        return resp({ erro: 'Falha ao buscar tarefas: ' + e.message }, 502, cors);
      }
    }

    // ── GET: funis com etapas ──────────────────────────────
    if (path === '/funnels') {
      try {
        const r = await fetch(
          'https://api.agendor.com.br/v3/funnels?per_page=50',
          { headers: { 'Authorization': `Token ${env.AGENDOR_TOKEN}` } }
        );
        return resp(await r.json(), r.status, cors);
      } catch (e) {
        return resp({ erro: 'Falha ao buscar funis: ' + e.message }, 502, cors);
      }
    }

    // ── GET: lista de usuários da conta ────────────────────
    if (path === '/users') {
      try {
        const r = await fetch(
          'https://api.agendor.com.br/v3/users?per_page=100',
          { headers: { 'Authorization': `Token ${env.AGENDOR_TOKEN}` } }
        );
        return resp(await r.json(), r.status, cors);
      } catch (e) {
        return resp({ erro: 'Falha ao buscar usuários: ' + e.message }, 502, cors);
      }
    }

    // ── GET: todos os negócios (dashboard) ─────────────────
    if (path === '/deals/all') {
      const page = url.searchParams.get('page') || '1';
      const pp   = url.searchParams.get('per_page') || '100';
      try {
        const r = await fetch(
          `https://api.agendor.com.br/v3/deals?page=${page}&per_page=${pp}`,
          { headers: { 'Authorization': `Token ${env.AGENDOR_TOKEN}` } }
        );
        return resp(await r.json(), r.status, cors);
      } catch (e) {
        return resp({ erro: 'Falha ao buscar negócios: ' + e.message }, 502, cors);
      }
    }

    // ── GET: negócio individual ────────────────────────────
    if (path === '/deal') {
      const dealId = url.searchParams.get('id');
      if (!dealId) return resp({ erro: 'Parâmetro id é obrigatório.' }, 400, cors);
      try {
        const r = await fetch(
          `https://api.agendor.com.br/v3/deals/${dealId}`,
          { headers: { 'Authorization': `Token ${env.AGENDOR_TOKEN}` } }
        );
        return resp(await r.json(), r.status, cors);
      } catch (e) {
        return resp({ erro: 'Falha ao buscar negócio: ' + e.message }, 502, cors);
      }
    }

    // ── GET: dados de um contato ───────────────────────────
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

    // ── GET: negócios de uma empresa ──────────────────────
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

    // ── GET: lista de empresas (padrão) ───────────────────
    const page = url.searchParams.get('page') || '1';
    const pp   = url.searchParams.get('per_page') || '100';
    try {
      const r = await fetch(
        `https://api.agendor.com.br/v3/organizations?page=${page}&per_page=${pp}`,
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
