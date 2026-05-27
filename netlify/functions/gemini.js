exports.handler = async function(event, context) {
  // Hanya izinkan metode POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  // Opsi: Coba ambil secara dinamis dari Supabase jika Service Role Key tersedia
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && serviceRoleKey) {
    try {
      const dbRes = await fetch(`${supabaseUrl}/rest/v1/settings?key=eq.GEMINI_API_KEY&select=value`, {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      });
      if (dbRes.ok) {
        const dbData = await dbRes.json();
        if (dbData && dbData.length > 0 && dbData[0].value) {
          apiKey = dbData[0].value;
        }
      }
    } catch (e) {
      console.error("Failed to fetch API key from DB:", e);
    }
  }
  if (!apiKey) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: { message: "API Key tidak dikonfigurasi di server" } }) 
    };
  }

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + apiKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: event.body
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: error.message || "Terjadi kesalahan internal server" } })
    };
  }
};
