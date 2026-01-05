import { GoogleAuth } from 'google-auth-library';

// Vercel/Node serverless function to fetch Google Analytics Realtime metrics
export default async function handler(req, res) {
  try {
    const propertyId = process.env.GA_PROPERTY_ID;
    const clientEmail = process.env.GA_CLIENT_EMAIL;
    const privateKeyRaw = process.env.GA_PRIVATE_KEY;

    if (!propertyId || !clientEmail || !privateKeyRaw) {
      return res.status(400).json({
        error: 'Missing GA_PROPERTY_ID, GA_CLIENT_EMAIL, or GA_PRIVATE_KEY environment variables.'
      });
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const resp = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken.token || accessToken}`,
        },
        body: JSON.stringify({
          metrics: [
            { name: 'activeUsers' },
            { name: 'eventCount' }
          ],
          dimensions: [
            { name: 'eventName' }
          ],
          limit: 25
        }),
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: text || 'Failed to fetch GA realtime data' });
    }

    const data = await resp.json();
    const rows = data.rows || [];

    let activeUsers = 0;
    let eventCount = 0;
    const events = rows.map((r) => {
      const name = r.dimensionValues?.[0]?.value || 'event';
      const active = Number(r.metricValues?.[0]?.value || 0);
      const count = Number(r.metricValues?.[1]?.value || 0);
      activeUsers = Math.max(activeUsers, active);
      eventCount += count;
      return { name, active, count };
    });

    return res.status(200).json({ activeUsers, eventCount, events });
  } catch (err) {
    console.error('GA realtime error:', err);
    return res.status(500).json({ error: err?.message || 'Unexpected GA realtime error' });
  }
}
