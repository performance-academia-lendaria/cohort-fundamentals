// Sonda de viabilidade — verifica se Vercel Serverless Functions
// rodam através do proxy /fundamentals. Arquivo descartável.
// Após confirmar, é removido. Não referenciado por nenhuma página.
export async function GET(request) {
  return Response.json({
    ok: true,
    probe: 'cohort-fundamentals',
    now: new Date().toISOString(),
  });
}
