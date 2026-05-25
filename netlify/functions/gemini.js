export const handler = async (event, context) => {
  // Hanya izinkan metode POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Gunakan GEMINI_API_KEY (backend only secret)
  // Fallback ke VITE_GEMINI_API_KEY untuk transisi agar tidak error jika user belum merubah nama variabel
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY; 
  
  if (!apiKey) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: { message: "API Key tidak dikonfigurasi di server" } }) 
    };
  }

  try {
    // Teruskan request body persis seperti dari frontend ke Google Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: event.body
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: error.message || "Terjadi kesalahan internal server" } })
    };
  }
};
