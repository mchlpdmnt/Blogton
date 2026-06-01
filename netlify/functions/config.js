// netlify/functions/config.js
// Serves Supabase credentials from Netlify env vars.
// CommonJS format — required without a bundler (no netlify.toml esbuild config).

exports.handler = async function () {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Missing env vars: SUPABASE_URL and/or SUPABASE_ANON_KEY are not set in Netlify Site Settings → Environment Variables.',
      }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supabaseUrl, supabaseKey }),
  };
};
