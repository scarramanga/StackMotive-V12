let mockPrefs = {
  theme: 'system',
  dashboardLayout: 'default',
  aiToneBias: 'balanced',
  debugMode: false,
};

export default function handler(req: any, res: any) {
  setTimeout(() => {
    if (req.method === 'GET') {
      res.status(200).json(mockPrefs);
    } else if (req.method === 'POST') {
      mockPrefs = { ...mockPrefs, ...req.body };
      res.status(200).json(mockPrefs);
    } else {
      res.status(405).end();
    }
  }, 400);
} 